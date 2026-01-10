#!/usr/bin/env npx tsx
/**
 * Scenario-Based Mock Data Generator
 *
 * Generates consistent, interconnected mock data for the Provider Portal
 * based on scenario definition files.
 *
 * Usage:
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --validate
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --dry-run
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --verbose
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

import type {
  ScenarioDefinition,
  PatternDefinition,
  MonthRange,
  GeneratedClaimSummary,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './scenario-types'

import {
  getMonthsBetween,
  formatDateISO,
  randomDateInMonth,
  addDays,
  calculateDenialCurve,
  addCurveVariation,
  distributeClaimsAcrossMonths,
  distributeDeniedClaims,
  generatePatient,
  generateClaimId,
  resetClaimSequence,
  randomChoice,
  randomChoices,
  randomInt,
  randomFloat,
  randomClaimAmount,
  roundToDecimal,
  getProcedureCodesForSpecialty,
  getDiagnosisCodesForProcedure,
  needsModifier25,
  generateUUID,
} from './generator-helpers'

import { getPolicyById, validatePolicyReferences, policyLibrary } from './policy-library'

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

interface CLIOptions {
  scenario: string
  validate: boolean
  verbose: boolean
  dryRun: boolean
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    scenario: '',
    validate: false,
    verbose: false,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scenario':
      case '-s':
        options.scenario = args[++i] ?? ''
        break
      case '--validate':
      case '-v':
        options.validate = true
        break
      case '--verbose':
        options.verbose = true
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
    }
  }

  if (!options.scenario) {
    console.error('Error: --scenario is required')
    printUsage()
    process.exit(1)
  }

  return options
}

function printUsage(): void {
  console.log(`
Scenario-Based Mock Data Generator

Usage:
  npx tsx tools/generate-scenario.ts --scenario <path> [options]

Options:
  --scenario, -s <path>  Path to scenario definition file (required)
  --validate, -v         Validate scenario and generated data without writing
  --verbose              Enable verbose logging
  --dry-run, -d          Generate data but don't write to database
  --help, -h             Show this help message

Examples:
  npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts
  npx tsx tools/generate-scenario.ts -s scenarios/ortho-practice.scenario.ts -v
  npx tsx tools/generate-scenario.ts -s scenarios/test.ts --dry-run --verbose
`)
}

// =============================================================================
// LOGGING
// =============================================================================

let verboseMode = false

function log(...args: unknown[]): void {
  console.log(...args)
}

function verbose(...args: unknown[]): void {
  if (verboseMode) {
    console.log('  [verbose]', ...args)
  }
}

function success(msg: string): void {
  console.log(`✓ ${msg}`)
}

function warn(msg: string): void {
  console.log(`⚠ ${msg}`)
}

function error(msg: string): void {
  console.error(`✗ ${msg}`)
}

// =============================================================================
// SCENARIO LOADING
// =============================================================================

async function loadScenario(path: string): Promise<ScenarioDefinition> {
  const fullPath = join(process.cwd(), path)

  if (!existsSync(fullPath)) {
    throw new Error(`Scenario file not found: ${fullPath}`)
  }

  // Dynamic import for TypeScript scenario files
  const module = await import(fullPath)
  const scenario = module.default || module.scenario

  if (!scenario) {
    throw new Error('Scenario file must export a default scenario or named "scenario" export')
  }

  return scenario as ScenarioDefinition
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateScenario(scenario: ScenarioDefinition): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate required fields
  if (!scenario.id) {
    errors.push({ type: 'schema', entity: 'scenario', field: 'id', message: 'Scenario ID is required' })
  }
  if (!scenario.name) {
    errors.push({ type: 'schema', entity: 'scenario', field: 'name', message: 'Scenario name is required' })
  }

  // Validate timeline
  const startDate = new Date(scenario.timeline.startDate)
  const endDate = new Date(scenario.timeline.endDate)
  if (isNaN(startDate.getTime())) {
    errors.push({ type: 'timeline', entity: 'timeline', field: 'startDate', message: 'Invalid start date' })
  }
  if (isNaN(endDate.getTime())) {
    errors.push({ type: 'timeline', entity: 'timeline', field: 'endDate', message: 'Invalid end date' })
  }
  if (startDate >= endDate) {
    errors.push({ type: 'timeline', entity: 'timeline', field: 'startDate', message: 'Start date must be before end date' })
  }

  // Validate practice and providers
  if (!scenario.practice.providers || scenario.practice.providers.length === 0) {
    errors.push({ type: 'schema', entity: 'practice', field: 'providers', message: 'At least one provider is required' })
  }

  // Validate patterns reference valid policies
  for (const pattern of scenario.patterns) {
    const policyIds = pattern.policies.map(p => p.id)
    const missingPolicies = validatePolicyReferences(policyIds)
    if (missingPolicies.length > 0) {
      errors.push({
        type: 'referential',
        entity: `pattern:${pattern.id}`,
        field: 'policies',
        message: `References unknown policies: ${missingPolicies.join(', ')}`,
      })
    }

    // Validate trajectory dates
    if (pattern.trajectory.baseline.periodEnd > pattern.trajectory.current.periodStart) {
      warnings.push({
        type: 'timeline',
        message: `Pattern ${pattern.id}: baseline period overlaps with current period`,
      })
    }
  }

  // Validate claim distribution adds up
  const totalPatternClaims = scenario.patterns.reduce((sum, p) => sum + p.claimDistribution.total, 0)
  if (totalPatternClaims > scenario.volume.totalClaims) {
    warnings.push({
      type: 'aggregate',
      message: `Pattern claims (${totalPatternClaims}) exceed total claims (${scenario.volume.totalClaims})`,
    })
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

function validateGeneratedData(
  scenario: ScenarioDefinition,
  claims: GeneratedClaimSummary[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check total claim count
  const actualClaims = claims.length
  const expectedClaims = scenario.volume.totalClaims
  const tolerance = expectedClaims * 0.05 // 5% tolerance

  if (Math.abs(actualClaims - expectedClaims) > tolerance) {
    errors.push({
      type: 'aggregate',
      entity: 'claims',
      field: 'count',
      message: 'Claim count outside tolerance',
      expected: expectedClaims,
      actual: actualClaims,
    })
  }

  // Check denial rate
  const deniedClaims = claims.filter(c => c.status === 'denied').length
  const actualDenialRate = (deniedClaims / actualClaims) * 100
  const expectedDenialRate = scenario.targetMetrics.overallDenialRate
  const rateTolerance = 3 // 3 percentage points

  if (Math.abs(actualDenialRate - expectedDenialRate) > rateTolerance) {
    warnings.push({
      type: 'aggregate',
      message: `Denial rate ${actualDenialRate.toFixed(1)}% differs from target ${expectedDenialRate}%`,
    })
  }

  // Check each pattern has expected claim distribution
  for (const pattern of scenario.patterns) {
    const patternClaims = claims.filter(c => c.patternId === pattern.id)
    const expectedTotal = pattern.claimDistribution.total
    const actualTotal = patternClaims.length

    if (Math.abs(actualTotal - expectedTotal) > expectedTotal * 0.1) {
      warnings.push({
        type: 'aggregate',
        message: `Pattern ${pattern.id}: expected ${expectedTotal} claims, got ${actualTotal}`,
      })
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

// =============================================================================
// GENERATION ENGINE
// =============================================================================

interface GenerationContext {
  scenario: ScenarioDefinition
  months: MonthRange[]
  claims: GeneratedClaimSummary[]
  claimDetails: ClaimDetail[]
  patternSnapshots: PatternSnapshot[]
  appeals: AppealRecord[]
  learningEvents: LearningEvent[]
}

interface ClaimDetail {
  id: string
  providerId: string
  providerName: string
  billingProviderTIN: string
  billingProviderNPI: string
  billingProviderTaxonomy: string
  claimType: string
  patientName: string
  patientDOB: string
  patientSex: string
  memberId: string
  dateOfService: string
  dateOfServiceEnd?: string
  billedAmount: number
  paidAmount: number
  status: string
  denialReason?: string
  submissionDate: string
  processingDate: string
  patternId?: string
  lineItems: LineItemDetail[]
  diagnosisCodes: string[]
  procedureCodes: string[]
  policyIds: string[]
}

interface LineItemDetail {
  lineNumber: number
  dateOfService: string
  procedureCode: string
  modifiers: string[]
  diagnosisCodes: string[]
  units: number
  billedAmount: number
  paidAmount: number
  status: string
  placeOfService: string
  renderingProviderNPI: string
  renderingProviderName: string
}

interface PatternSnapshot {
  patternId: string
  snapshotDate: string
  periodStart: string
  periodEnd: string
  claimCount: number
  deniedCount: number
  denialRate: number
  dollarsDenied: number
  dollarsAtRisk: number
  appealCount: number
  appealRate: number
}

interface AppealRecord {
  claimId: string
  lineNumber?: number
  appealFiled: boolean
  appealDate?: string
  appealReason?: string
  appealOutcome?: 'pending' | 'upheld' | 'overturned'
  outcomeDate?: string
}

interface LearningEvent {
  id: string
  timestamp: string
  type: string
  context: string
  userId: string
  sessionId: string
  metadata: Record<string, unknown>
}

/**
 * Phase 1: Initialize Generation Context
 */
function initializeContext(scenario: ScenarioDefinition): GenerationContext {
  verbose('Initializing generation context...')
  resetClaimSequence()

  const months = getMonthsBetween(scenario.timeline.startDate, scenario.timeline.endDate)
  verbose(`Timeline spans ${months.length} months`)

  return {
    scenario,
    months,
    claims: [],
    claimDetails: [],
    patternSnapshots: [],
    appeals: [],
    learningEvents: [],
  }
}

/**
 * Phase 2: Generate Base Claims (non-pattern claims)
 */
function generateBaseClaims(ctx: GenerationContext): void {
  verbose('Generating base claims...')

  const { scenario, months } = ctx
  const patternClaimTotal = scenario.patterns.reduce((sum, p) => sum + p.claimDistribution.total, 0)
  const baseClaimCount = scenario.volume.totalClaims - patternClaimTotal

  if (baseClaimCount <= 0) {
    verbose('No base claims needed (all claims assigned to patterns)')
    return
  }

  // Distribute base claims across months
  const claimsPerMonth = distributeClaimsAcrossMonths(
    baseClaimCount,
    months,
    scenario.volume.monthlyVariation
  )

  // Base claim denial rate (should be low - maybe 2-5%)
  const baseDenialRate = 0.03

  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const count = claimsPerMonth[monthIdx] ?? 0

    if (!month) continue

    for (let i = 0; i < count; i++) {
      const claim = generateSingleClaim(ctx, month, undefined, baseDenialRate)
      ctx.claims.push(claim.summary)
      ctx.claimDetails.push(claim.detail)
    }
  }

  verbose(`Generated ${baseClaimCount} base claims`)
}

/**
 * Phase 3: Generate Pattern Claims
 */
function generatePatternClaims(ctx: GenerationContext): void {
  verbose('Generating pattern claims...')

  const { scenario, months } = ctx

  for (const pattern of scenario.patterns) {
    verbose(`Processing pattern: ${pattern.id}`)

    // Calculate denial curve for this pattern
    const denialCurve = calculateDenialCurve(
      pattern.trajectory.baseline.denialRate,
      pattern.trajectory.current.denialRate,
      months.length,
      pattern.trajectory.curve
    )

    // Add realistic variation
    const denialRates = addCurveVariation(denialCurve, 3)

    // Distribute claims across months
    const claimsPerMonth = distributeClaimsAcrossMonths(
      pattern.claimDistribution.total,
      months,
      scenario.volume.monthlyVariation
    )

    // Generate claims for each month
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const month = months[monthIdx]
      if (!month) continue

      const count = claimsPerMonth[monthIdx] ?? 0
      const denialRate = (denialRates[monthIdx] ?? 0) / 100

      for (let i = 0; i < count; i++) {
        const claim = generateSingleClaim(ctx, month, pattern, denialRate)
        ctx.claims.push(claim.summary)
        ctx.claimDetails.push(claim.detail)
      }
    }

    verbose(`Generated ${pattern.claimDistribution.total} claims for pattern ${pattern.id}`)
  }
}

/**
 * Generate a single claim
 */
function generateSingleClaim(
  ctx: GenerationContext,
  month: MonthRange,
  pattern: PatternDefinition | undefined,
  denialRate: number
): { summary: GeneratedClaimSummary; detail: ClaimDetail } {
  const { scenario } = ctx

  // Pick a provider (weighted by claimWeight)
  const providers = scenario.practice.providers
  if (providers.length === 0) {
    throw new Error('Scenario must have at least one provider')
  }
  const providerWeights: [typeof providers[0], number][] = providers.map(p => [p, p.claimWeight || 1.0])
  const totalWeight = providerWeights.reduce((sum, [, w]) => sum + w, 0)
  let rand = Math.random() * totalWeight
  let provider = providers[0]!
  for (const [p, weight] of providerWeights) {
    rand -= weight
    if (rand <= 0) {
      provider = p
      break
    }
  }

  // Generate patient
  const patient = generatePatient()

  // Generate dates
  const dateOfService = randomDateInMonth(month)
  const submissionDate = addDays(dateOfService, randomInt(1, 7))
  const processingDate = addDays(submissionDate, randomInt(3, 14))

  // Determine status
  const isDenied = Math.random() < denialRate
  const status = isDenied ? 'denied' : 'approved'

  // Generate amount
  const billedAmount = randomClaimAmount(scenario.volume.claimValueRanges)
  const paidAmount = status === 'approved' ? roundToDecimal(billedAmount * randomFloat(0.7, 0.95), 2) : 0

  // Get procedure codes
  let procedureCodes: string[]
  if (pattern && pattern.procedureCodes.length > 0) {
    procedureCodes = randomChoices(pattern.procedureCodes, randomInt(1, 3))
  } else {
    procedureCodes = randomChoices(getProcedureCodesForSpecialty(provider.specialty), randomInt(1, 3))
  }

  // Get diagnosis codes
  const firstProcedure = procedureCodes[0] ?? '99213'
  const diagnosisCodes = randomChoices(getDiagnosisCodesForProcedure(firstProcedure), randomInt(1, 4))

  // Get policy IDs for denied claims
  const policyIds: string[] = []
  let denialReason: string | undefined
  if (isDenied && pattern) {
    for (const policyRef of pattern.policies) {
      if (Math.random() < (policyRef.triggerRate || 0.8)) {
        policyIds.push(policyRef.id)
        if (!denialReason) {
          const policy = getPolicyById(policyRef.id)
          denialReason = policy?.description || pattern.denialReason
        }
      }
    }
    if (policyIds.length === 0) {
      denialReason = pattern.denialReason
    }
  } else if (isDenied) {
    denialReason = 'Claim does not meet medical necessity requirements'
  }

  // Generate line items
  const lineItemCount = randomInt(
    scenario.volume.claimLinesPerClaim.min,
    scenario.volume.claimLinesPerClaim.max
  )
  const lineItems: LineItemDetail[] = []

  // Distribute billed amount across line items
  let remainingAmount = billedAmount
  for (let i = 0; i < lineItemCount; i++) {
    const isLast = i === lineItemCount - 1
    const lineAmount = isLast ? remainingAmount : roundToDecimal(remainingAmount * randomFloat(0.3, 0.6), 2)
    remainingAmount -= lineAmount

    const lineProcedure = procedureCodes[i % procedureCodes.length] ?? firstProcedure
    const modifiers: string[] = []

    // Add modifier 25 if needed
    if (needsModifier25(lineProcedure, procedureCodes) && !pattern) {
      modifiers.push('25')
    }
    // For pattern claims, intentionally omit required modifiers to create the denial pattern
    // (no-op here - we just don't add the required modifier)

    const firstDiagnosis = diagnosisCodes[0] ?? 'Z00.00'
    lineItems.push({
      lineNumber: i + 1,
      dateOfService: formatDateISO(dateOfService),
      procedureCode: lineProcedure,
      modifiers,
      diagnosisCodes: i === 0 ? diagnosisCodes : [firstDiagnosis],
      units: randomInt(1, 3),
      billedAmount: lineAmount,
      paidAmount: status === 'approved' ? roundToDecimal(lineAmount * randomFloat(0.7, 0.95), 2) : 0,
      status,
      placeOfService: '11', // Office
      renderingProviderNPI: provider.npi,
      renderingProviderName: provider.name,
    })
  }

  const claimId = generateClaimId(month)

  const summary: GeneratedClaimSummary = {
    id: claimId,
    status: status as 'approved' | 'denied',
    billedAmount,
    month: month.key,
    patternId: pattern?.id,
    providerId: provider.id,
    dateOfService: formatDateISO(dateOfService),
  }

  const detail: ClaimDetail = {
    id: claimId,
    providerId: provider.id,
    providerName: provider.name,
    billingProviderTIN: scenario.practice.taxId,
    billingProviderNPI: provider.npi,
    billingProviderTaxonomy: provider.taxonomy,
    claimType: 'Professional',
    patientName: patient.name,
    patientDOB: patient.dob,
    patientSex: patient.sex,
    memberId: patient.memberId,
    dateOfService: formatDateISO(dateOfService),
    billedAmount,
    paidAmount,
    status,
    denialReason,
    submissionDate: formatDateISO(submissionDate),
    processingDate: formatDateISO(processingDate),
    patternId: pattern?.id,
    lineItems,
    diagnosisCodes,
    procedureCodes,
    policyIds,
  }

  return { summary, detail }
}

/**
 * Phase 4: Generate Appeals
 */
function generateAppeals(ctx: GenerationContext): void {
  verbose('Generating appeals...')

  const { scenario, claimDetails } = ctx

  for (const pattern of scenario.patterns) {
    const patternClaims = claimDetails.filter(c => c.patternId === pattern.id && c.status === 'denied')
    const appealsToFile = pattern.claimDistribution.appealsFiled
    const overturnsNeeded = pattern.claimDistribution.appealsOverturned

    // Select random denied claims to appeal
    const claimsToAppeal = randomChoices(patternClaims, appealsToFile)

    for (let i = 0; i < claimsToAppeal.length; i++) {
      const claim = claimsToAppeal[i]
      if (!claim) continue

      const isOverturned = i < overturnsNeeded

      const appealDate = addDays(new Date(claim.processingDate), randomInt(7, 30))
      const outcomeDate = addDays(appealDate, randomInt(14, 60))

      ctx.appeals.push({
        claimId: claim.id,
        appealFiled: true,
        appealDate: formatDateISO(appealDate),
        appealReason: claim.denialReason || 'Requesting review of denial decision',
        appealOutcome: isOverturned ? 'overturned' : 'upheld',
        outcomeDate: formatDateISO(outcomeDate),
      })

      // Update claim status if overturned
      if (isOverturned) {
        claim.status = 'appealed'
        const summary = ctx.claims.find(c => c.id === claim.id)
        if (summary) {
          summary.status = 'appealed'
        }
      }
    }
  }

  verbose(`Generated ${ctx.appeals.length} appeal records`)
}

/**
 * Phase 5: Generate Pattern Snapshots
 */
function generatePatternSnapshots(ctx: GenerationContext): void {
  verbose('Generating pattern snapshots...')

  const { scenario, months, claimDetails, appeals } = ctx

  for (const pattern of scenario.patterns) {
    for (const month of months) {
      const monthClaims = claimDetails.filter(
        c => c.patternId === pattern.id && c.dateOfService.startsWith(month.key)
      )
      const deniedClaims = monthClaims.filter(c => c.status === 'denied')
      const monthAppeals = appeals.filter(
        a => monthClaims.some(c => c.id === a.claimId)
      )

      const dollarsDenied = deniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)
      const dollarsAtRisk = monthClaims.reduce((sum, c) => sum + c.billedAmount, 0)

      ctx.patternSnapshots.push({
        patternId: pattern.id,
        snapshotDate: formatDateISO(month.end),
        periodStart: formatDateISO(month.start),
        periodEnd: formatDateISO(month.end),
        claimCount: monthClaims.length,
        deniedCount: deniedClaims.length,
        denialRate: monthClaims.length > 0 ? (deniedClaims.length / monthClaims.length) * 100 : 0,
        dollarsDenied,
        dollarsAtRisk,
        appealCount: monthAppeals.length,
        appealRate: deniedClaims.length > 0 ? (monthAppeals.length / deniedClaims.length) * 100 : 0,
      })
    }
  }

  verbose(`Generated ${ctx.patternSnapshots.length} pattern snapshots`)
}

/**
 * Phase 6: Generate Learning Events
 */
function generateLearningEvents(ctx: GenerationContext): void {
  verbose('Generating learning events...')

  const { scenario, months } = ctx
  const { eventDistribution, eventClustering } = scenario.learningEvents

  for (const [eventType, count] of Object.entries(eventDistribution)) {
    for (let i = 0; i < count; i++) {
      // Check if this event type has clustering
      let timestamp: Date
      const clusterDates = Object.entries(eventClustering).find(([, dates]) =>
        dates.length > 0 && Math.random() < 0.7
      )

      if (clusterDates) {
        const clusterDate = randomChoice(clusterDates[1])
        timestamp = addDays(new Date(clusterDate), randomInt(-3, 3))
      } else {
        timestamp = randomDateInMonth(randomChoice(months))
      }

      ctx.learningEvents.push({
        id: generateUUID(),
        timestamp: timestamp.toISOString(),
        type: eventType,
        context: `scenario:${scenario.id}`,
        userId: 'user-001',
        sessionId: generateUUID(),
        metadata: {
          source: 'generator',
          scenarioId: scenario.id,
        },
      })
    }
  }

  verbose(`Generated ${ctx.learningEvents.length} learning events`)
}

/**
 * Phase 7: Validate Generated Data
 */
function validateGenerated(ctx: GenerationContext): ValidationResult {
  return validateGeneratedData(ctx.scenario, ctx.claims)
}

/**
 * Phase 8: Write to Database
 */
function writeToDatabase(ctx: GenerationContext): void {
  log('Writing to database...')

  const dbPath = join(process.cwd(), 'provider-portal.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  try {
    db.exec('BEGIN TRANSACTION')

    const { scenario, claimDetails, patternSnapshots, appeals, learningEvents } = ctx

    // Insert scenario
    const insertScenario = db.prepare(`
      INSERT OR REPLACE INTO scenarios (id, name, description, is_active, timeline_start, timeline_end, config)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `)
    insertScenario.run(
      scenario.id,
      scenario.name,
      scenario.description,
      scenario.timeline.startDate,
      scenario.timeline.endDate,
      JSON.stringify(scenario)
    )
    verbose(`Inserted scenario: ${scenario.id}`)

    // Deactivate other scenarios
    db.prepare('UPDATE scenarios SET is_active = 0 WHERE id != ?').run(scenario.id)

    // Insert providers
    const insertProvider = db.prepare(`
      INSERT OR REPLACE INTO providers (id, name, specialty, npi, tin, taxonomy, scenario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    for (const provider of scenario.practice.providers) {
      insertProvider.run(
        provider.id,
        provider.name,
        provider.specialty,
        provider.npi,
        scenario.practice.taxId,
        provider.taxonomy,
        scenario.id
      )
    }
    verbose(`Inserted ${scenario.practice.providers.length} providers`)

    // Insert patterns
    const insertPattern = db.prepare(`
      INSERT OR REPLACE INTO patterns (
        id, title, description, category, status, tier, scenario_id,
        baseline_start, baseline_end, baseline_claim_count, baseline_denied_count,
        baseline_denial_rate, baseline_dollars_denied,
        current_start, current_end, current_claim_count, current_denied_count,
        current_denial_rate, current_dollars_denied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const pattern of scenario.patterns) {
      insertPattern.run(
        pattern.id,
        pattern.title,
        pattern.description,
        pattern.category,
        pattern.status,
        pattern.tier,
        scenario.id,
        pattern.trajectory.baseline.periodStart,
        pattern.trajectory.baseline.periodEnd,
        pattern.trajectory.baseline.claimCount,
        pattern.trajectory.baseline.deniedCount,
        pattern.trajectory.baseline.denialRate,
        pattern.trajectory.baseline.dollarsDenied,
        pattern.trajectory.current.periodStart,
        pattern.trajectory.current.periodEnd,
        pattern.trajectory.current.claimCount,
        pattern.trajectory.current.deniedCount,
        pattern.trajectory.current.denialRate,
        pattern.trajectory.current.dollarsDenied
      )
    }
    verbose(`Inserted ${scenario.patterns.length} patterns`)

    // Insert policies from policy library
    const insertPolicy = db.prepare(`
      INSERT OR REPLACE INTO policies (
        id, name, mode, effective_date, description, clinical_rationale,
        topic, logic_type, source, common_mistake, fix_guidance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertPolicyProcedure = db.prepare(`
      INSERT OR IGNORE INTO policy_procedure_codes (policy_id, code)
      VALUES (?, ?)
    `)
    const insertPolicyModifier = db.prepare(`
      INSERT OR IGNORE INTO policy_modifiers (policy_id, modifier)
      VALUES (?, ?)
    `)

    // Get all unique policy IDs referenced in claims
    const referencedPolicyIds = new Set<string>()
    for (const claim of claimDetails) {
      claim.policyIds.forEach(id => referencedPolicyIds.add(id))
    }

    // Insert each referenced policy
    for (const policyId of referencedPolicyIds) {
      const policy = getPolicyById(policyId)
      if (policy) {
        insertPolicy.run(
          policy.id,
          policy.name,
          policy.mode,
          scenario.timeline.startDate, // Use scenario start as effective date
          policy.description,
          policy.clinicalRationale || null,
          policy.topic,
          policy.primaryLogicType,
          policy.source,
          policy.commonMistake,
          policy.fixGuidance
        )

        // Insert procedure codes
        if (policy.procedureCodes) {
          for (const code of policy.procedureCodes) {
            insertPolicyProcedure.run(policy.id, code)
          }
        }

        // Insert modifiers
        if (policy.modifiers) {
          for (const modifier of policy.modifiers) {
            insertPolicyModifier.run(policy.id, modifier)
          }
        }
      }
    }
    verbose(`Inserted ${referencedPolicyIds.size} policies`)

    // Insert claims
    const insertClaim = db.prepare(`
      INSERT INTO claims (
        id, provider_id, claim_type, patient_name, patient_dob, patient_sex,
        member_id, date_of_service, billed_amount, paid_amount, provider_name,
        billing_provider_tin, billing_provider_npi, billing_provider_taxonomy,
        status, denial_reason, submission_date, processing_date, scenario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertLineItem = db.prepare(`
      INSERT INTO claim_line_items (
        claim_id, line_number, date_of_service, procedure_code, place_of_service,
        units, billed_amount, paid_amount, rendering_provider_name, rendering_provider_npi, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertDiagnosis = db.prepare(`
      INSERT OR IGNORE INTO claim_diagnosis_codes (claim_id, code, sequence)
      VALUES (?, ?, ?)
    `)

    const insertProcedure = db.prepare(`
      INSERT OR IGNORE INTO claim_procedure_codes (claim_id, code)
      VALUES (?, ?)
    `)

    const insertClaimLinePolicy = db.prepare(`
      INSERT OR IGNORE INTO claim_line_policies (line_item_id, policy_id, is_denied, denied_amount, denial_reason)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertPatternClaimLine = db.prepare(`
      INSERT OR IGNORE INTO pattern_claim_lines (pattern_id, line_item_id, denied_amount, denial_date)
      VALUES (?, ?, ?, ?)
    `)

    const insertModifier = db.prepare(`
      INSERT OR IGNORE INTO line_item_modifiers (line_item_id, modifier, sequence)
      VALUES (?, ?, ?)
    `)

    for (const claim of claimDetails) {
      insertClaim.run(
        claim.id,
        claim.providerId,
        claim.claimType,
        claim.patientName,
        claim.patientDOB,
        claim.patientSex,
        claim.memberId,
        claim.dateOfService,
        claim.billedAmount,
        claim.paidAmount,
        claim.providerName,
        claim.billingProviderTIN,
        claim.billingProviderNPI,
        claim.billingProviderTaxonomy,
        claim.status,
        claim.denialReason,
        claim.submissionDate,
        claim.processingDate,
        scenario.id
      )

      // Insert diagnosis codes
      claim.diagnosisCodes.forEach((code, idx) => {
        insertDiagnosis.run(claim.id, code, idx + 1)
      })

      // Insert procedure codes
      claim.procedureCodes.forEach(code => {
        insertProcedure.run(claim.id, code)
      })

      // Insert line items first (policies and patterns link to lines, not claims)
      const lineItemIds: number[] = []
      for (const line of claim.lineItems) {
        const result = insertLineItem.run(
          claim.id,
          line.lineNumber,
          line.dateOfService,
          line.procedureCode,
          line.placeOfService,
          line.units,
          line.billedAmount,
          line.paidAmount,
          line.renderingProviderName,
          line.renderingProviderNPI,
          line.status
        )
        lineItemIds.push(result.lastInsertRowid as number)

        // Insert modifiers
        line.modifiers.forEach((modifier, idx) => {
          insertModifier.run(result.lastInsertRowid, modifier, idx + 1)
        })
      }

      // Insert policy links at LINE level (policies link to lines, not claims)
      // Distribute policies across line items
      if (claim.policyIds.length > 0 && lineItemIds.length > 0) {
        claim.policyIds.forEach((policyId, idx) => {
          const lineItemId = lineItemIds[idx % lineItemIds.length]
          const isDenied = claim.status === 'denied' ? 1 : 0
          const lineItem = claim.lineItems[idx % claim.lineItems.length]
          const deniedAmount = isDenied ? (lineItem?.billedAmount || 0) : 0
          insertClaimLinePolicy.run(lineItemId, policyId, isDenied, deniedAmount, claim.denialReason || null)
        })
      }

      // Insert pattern links at LINE level (patterns link to lines, not claims)
      if (claim.patternId && lineItemIds.length > 0) {
        lineItemIds.forEach((lineItemId, idx) => {
          const lineItem = claim.lineItems[idx]
          const deniedAmount = claim.status === 'denied' ? (lineItem?.billedAmount || 0) : 0
          insertPatternClaimLine.run(claim.patternId, lineItemId, deniedAmount, claim.dateOfService)
        })
      }
    }
    verbose(`Inserted ${claimDetails.length} claims with line items`)

    // Insert pattern snapshots
    const insertSnapshot = db.prepare(`
      INSERT INTO pattern_snapshots (
        pattern_id, snapshot_date, period_start, period_end,
        claim_count, denied_count, denial_rate, dollars_denied, dollars_at_risk,
        appeal_count, appeal_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const snapshot of patternSnapshots) {
      insertSnapshot.run(
        snapshot.patternId,
        snapshot.snapshotDate,
        snapshot.periodStart,
        snapshot.periodEnd,
        snapshot.claimCount,
        snapshot.deniedCount,
        snapshot.denialRate,
        snapshot.dollarsDenied,
        snapshot.dollarsAtRisk,
        snapshot.appealCount,
        snapshot.appealRate
      )
    }
    verbose(`Inserted ${patternSnapshots.length} pattern snapshots`)

    // Insert appeals
    const insertAppeal = db.prepare(`
      INSERT INTO claim_appeals (
        claim_id, line_number, appeal_filed, appeal_date, appeal_reason,
        appeal_outcome, outcome_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    for (const appeal of appeals) {
      insertAppeal.run(
        appeal.claimId,
        appeal.lineNumber || null,
        appeal.appealFiled ? 1 : 0,
        appeal.appealDate,
        appeal.appealReason,
        appeal.appealOutcome,
        appeal.outcomeDate
      )
    }
    verbose(`Inserted ${appeals.length} appeals`)

    // Insert learning events
    const insertEvent = db.prepare(`
      INSERT INTO learning_events (id, timestamp, type, context, user_id, session_id, metadata, scenario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const event of learningEvents) {
      insertEvent.run(
        event.id,
        event.timestamp,
        event.type,
        event.context,
        event.userId,
        event.sessionId,
        JSON.stringify(event.metadata),
        scenario.id
      )
    }
    verbose(`Inserted ${learningEvents.length} learning events`)

    db.exec('COMMIT')
    success('Data written to database successfully')

  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  } finally {
    db.close()
  }
}

/**
 * Phase 9: Output Summary
 */
function outputSummary(ctx: GenerationContext): void {
  const { scenario, claims, claimDetails, patternSnapshots, appeals, learningEvents } = ctx

  const deniedClaims = claims.filter(c => c.status === 'denied')
  const totalBilled = claimDetails.reduce((sum, c) => sum + c.billedAmount, 0)
  const totalPaid = claimDetails.reduce((sum, c) => sum + c.paidAmount, 0)
  const totalDenied = deniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)

  log('\n═══════════════════════════════════════════════════════════')
  log('GENERATION SUMMARY')
  log('═══════════════════════════════════════════════════════════')
  log(`Scenario: ${scenario.name} (${scenario.id})`)
  log(`Timeline: ${scenario.timeline.startDate} to ${scenario.timeline.endDate}`)
  log('')
  log('CLAIMS:')
  log(`  Total Claims:     ${claims.length.toLocaleString()}`)
  log(`  Approved:         ${claims.filter(c => c.status === 'approved').length.toLocaleString()}`)
  log(`  Denied:           ${deniedClaims.length.toLocaleString()}`)
  log(`  Denial Rate:      ${((deniedClaims.length / claims.length) * 100).toFixed(1)}%`)
  log('')
  log('FINANCIALS:')
  log(`  Total Billed:     $${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  log(`  Total Paid:       $${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  log(`  Total Denied:     $${totalDenied.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  log('')
  log('PATTERNS:')
  for (const pattern of scenario.patterns) {
    const patternClaims = claims.filter(c => c.patternId === pattern.id)
    const patternDenied = patternClaims.filter(c => c.status === 'denied')
    log(`  ${pattern.title}:`)
    log(`    Claims: ${patternClaims.length}, Denied: ${patternDenied.length} (${((patternDenied.length / patternClaims.length) * 100).toFixed(1)}%)`)
  }
  log('')
  log('OTHER RECORDS:')
  log(`  Pattern Snapshots: ${patternSnapshots.length}`)
  log(`  Appeals:           ${appeals.length}`)
  log(`  Learning Events:   ${learningEvents.length}`)
  log('═══════════════════════════════════════════════════════════\n')
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs()
  verboseMode = options.verbose

  log('╔═══════════════════════════════════════════════════════════╗')
  log('║         Scenario-Based Mock Data Generator                ║')
  log('╚═══════════════════════════════════════════════════════════╝\n')

  try {
    // Load scenario
    log(`Loading scenario: ${options.scenario}`)
    const scenario = await loadScenario(options.scenario)
    success(`Loaded scenario: ${scenario.name}`)

    // Validate scenario
    log('\nValidating scenario definition...')
    const scenarioValidation = validateScenario(scenario)

    if (scenarioValidation.warnings.length > 0) {
      for (const w of scenarioValidation.warnings) {
        warn(w.message)
      }
    }

    if (!scenarioValidation.passed) {
      for (const e of scenarioValidation.errors) {
        error(`${e.entity}.${e.field}: ${e.message}`)
      }
      throw new Error('Scenario validation failed')
    }
    success('Scenario validation passed')

    // If validate-only mode, stop here
    if (options.validate) {
      log('\n--validate flag set, skipping data generation')
      return
    }

    // Generate data
    log('\nGenerating data...')
    const ctx = initializeContext(scenario)

    generateBaseClaims(ctx)
    success(`Generated ${ctx.claims.length} base claims`)

    generatePatternClaims(ctx)
    success(`Total claims: ${ctx.claims.length}`)

    generateAppeals(ctx)
    success(`Generated ${ctx.appeals.length} appeals`)

    generatePatternSnapshots(ctx)
    success(`Generated ${ctx.patternSnapshots.length} snapshots`)

    generateLearningEvents(ctx)
    success(`Generated ${ctx.learningEvents.length} learning events`)

    // Validate generated data
    log('\nValidating generated data...')
    const dataValidation = validateGenerated(ctx)

    if (dataValidation.warnings.length > 0) {
      for (const w of dataValidation.warnings) {
        warn(w.message)
      }
    }

    if (!dataValidation.passed) {
      for (const e of dataValidation.errors) {
        error(`${e.entity}.${e.field}: ${e.message} (expected: ${e.expected}, actual: ${e.actual})`)
      }
      throw new Error('Data validation failed')
    }
    success('Data validation passed')

    // Write to database (unless dry-run)
    if (options.dryRun) {
      log('\n--dry-run flag set, skipping database write')
    } else {
      log('')
      writeToDatabase(ctx)
    }

    // Output summary
    outputSummary(ctx)

    log('Generation complete!')

  } catch (err) {
    error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
