/**
 * Shared Scenario Generation Pipeline
 *
 * Core generation logic extracted from generate-scenario.ts.
 * Used by both the single-scenario CLI and bulk-generate CLI.
 */

import type BetterSqlite3 from 'better-sqlite3'
import type {
  ScenarioDefinition,
  PatternDefinition,
  MonthRange,
  GeneratedClaimSummary,
} from './scenario-types'

import {
  getMonthsBetween,
  formatDateISO,
  randomDateInMonth,
  addDays,
  calculateDenialCurve,
  addCurveVariation,
  distributeClaimsAcrossMonths,
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

import { getPolicyById, validatePolicyReferences } from './policy-library'

// =============================================================================
// EXPORTED TYPES
// =============================================================================

export interface PipelineResult {
  scenarioId: string
  scenarioName: string
  success: boolean
  error?: string
  stats: {
    claims: number
    deniedClaims: number
    appeals: number
    snapshots: number
    learningEvents: number
    durationMs: number
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// =============================================================================
// INTERNAL TYPES
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

// Module-level verbose logger (set per pipeline run)
type LogFn = (...args: unknown[]) => void
let _verbose: LogFn = () => {}

// =============================================================================
// VALIDATION
// =============================================================================

export function validateScenario(scenario: ScenarioDefinition): ValidationResult {
  const errors: string[] = []

  if (!scenario) {
    return { valid: false, errors: ['Scenario is null or undefined'] }
  }

  if (!scenario.id) errors.push('Missing required field: id')
  if (!scenario.name) errors.push('Missing required field: name')

  // Timeline
  if (!scenario.timeline) {
    errors.push('Missing required field: timeline')
  } else {
    const startDate = new Date(scenario.timeline.startDate)
    const endDate = new Date(scenario.timeline.endDate)
    if (!scenario.timeline.startDate || isNaN(startDate.getTime())) {
      errors.push('Invalid or missing timeline.startDate')
    }
    if (!scenario.timeline.endDate || isNaN(endDate.getTime())) {
      errors.push('Invalid or missing timeline.endDate')
    }
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.push('timeline.startDate must be before timeline.endDate')
    }
  }

  // Practice and providers
  if (!scenario.practice) {
    errors.push('Missing required field: practice')
  } else if (!scenario.practice.providers || scenario.practice.providers.length === 0) {
    errors.push('At least one provider is required in practice.providers')
  }

  // Volume
  if (!scenario.volume) {
    errors.push('Missing required field: volume')
  } else if (!scenario.volume.totalClaims || scenario.volume.totalClaims < 10) {
    errors.push('volume.totalClaims must be at least 10')
  }

  // Patterns
  if (!scenario.patterns || scenario.patterns.length === 0) {
    errors.push('At least one pattern is required')
  } else {
    for (const pattern of scenario.patterns) {
      if (!pattern.id) errors.push('Pattern missing required field: id')
      if (!pattern.title) errors.push(`Pattern "${pattern.id || '?'}": missing required field: title`)

      // Check policy references against policy library
      const policyIds = pattern.policies?.map(p => p.id) || []
      const missing = validatePolicyReferences(policyIds)
      if (missing.length > 0) {
        errors.push(`Pattern "${pattern.id}": references unknown policies: ${missing.join(', ')}`)
      }
    }

    // Check claim distribution
    if (scenario.volume) {
      const totalPatternClaims = scenario.patterns.reduce(
        (sum, p) => sum + (p.claimDistribution?.total || 0),
        0
      )
      if (totalPatternClaims > scenario.volume.totalClaims) {
        errors.push(
          `Pattern claims (${totalPatternClaims}) exceed total claims (${scenario.volume.totalClaims})`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// =============================================================================
// GENERATION PHASES
// =============================================================================

function initializeContext(scenario: ScenarioDefinition): GenerationContext {
  _verbose('Initializing generation context...')
  resetClaimSequence(scenario.id)

  const months = getMonthsBetween(scenario.timeline.startDate, scenario.timeline.endDate)
  _verbose(`Timeline spans ${months.length} months`)

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

function generateBaseClaims(ctx: GenerationContext): void {
  _verbose('Generating base claims...')

  const { scenario, months } = ctx
  const patternClaimTotal = scenario.patterns.reduce(
    (sum, p) => sum + p.claimDistribution.total,
    0
  )
  const baseClaimCount = scenario.volume.totalClaims - patternClaimTotal

  if (baseClaimCount <= 0) {
    _verbose('No base claims needed (all claims assigned to patterns)')
    return
  }

  const claimsPerMonth = distributeClaimsAcrossMonths(
    baseClaimCount,
    months,
    scenario.volume.monthlyVariation
  )

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

  _verbose(`Generated ${baseClaimCount} base claims`)
}

function generatePatternClaims(ctx: GenerationContext): void {
  _verbose('Generating pattern claims...')

  const { scenario, months } = ctx

  for (const pattern of scenario.patterns) {
    _verbose(`Processing pattern: ${pattern.id}`)

    const denialCurve = calculateDenialCurve(
      pattern.trajectory.baseline.denialRate,
      pattern.trajectory.current.denialRate,
      months.length,
      pattern.trajectory.curve
    )

    const denialRates = addCurveVariation(denialCurve, 3)

    const claimsPerMonth = distributeClaimsAcrossMonths(
      pattern.claimDistribution.total,
      months,
      scenario.volume.monthlyVariation
    )

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

    _verbose(`Generated ${pattern.claimDistribution.total} claims for pattern ${pattern.id}`)
  }
}

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
  const providerWeights: [typeof providers[0], number][] = providers.map(p => [
    p,
    p.claimWeight || 1.0,
  ])
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

  const patient = generatePatient()

  const dateOfService = randomDateInMonth(month)
  const submissionDate = addDays(dateOfService, randomInt(1, 7))
  const processingDate = addDays(submissionDate, randomInt(3, 14))

  const isDenied = Math.random() < denialRate
  const status = isDenied ? 'denied' : 'approved'

  const billedAmount = randomClaimAmount(scenario.volume.claimValueRanges)
  const paidAmount =
    status === 'approved' ? roundToDecimal(billedAmount * randomFloat(0.7, 0.95), 2) : 0

  // Get procedure codes
  let procedureCodes: string[]
  if (pattern && pattern.procedureCodes.length > 0) {
    procedureCodes = randomChoices(pattern.procedureCodes, randomInt(1, 3))
  } else {
    procedureCodes = randomChoices(
      getProcedureCodesForSpecialty(provider.specialty),
      randomInt(1, 3)
    )
  }

  const firstProcedure = procedureCodes[0] ?? '99213'
  const diagnosisCodes = randomChoices(
    getDiagnosisCodesForProcedure(firstProcedure),
    randomInt(1, 4)
  )

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

  let remainingAmount = billedAmount
  for (let i = 0; i < lineItemCount; i++) {
    const isLast = i === lineItemCount - 1
    const lineAmount = isLast
      ? remainingAmount
      : roundToDecimal(remainingAmount * randomFloat(0.3, 0.6), 2)
    remainingAmount -= lineAmount

    const lineProcedure = procedureCodes[i % procedureCodes.length] ?? firstProcedure
    const modifiers: string[] = []

    if (needsModifier25(lineProcedure, procedureCodes) && !pattern) {
      modifiers.push('25')
    }

    const firstDiagnosis = diagnosisCodes[0] ?? 'Z00.00'
    lineItems.push({
      lineNumber: i + 1,
      dateOfService: formatDateISO(dateOfService),
      procedureCode: lineProcedure,
      modifiers,
      diagnosisCodes: i === 0 ? diagnosisCodes : [firstDiagnosis],
      units: randomInt(1, 3),
      billedAmount: lineAmount,
      paidAmount:
        status === 'approved' ? roundToDecimal(lineAmount * randomFloat(0.7, 0.95), 2) : 0,
      status,
      placeOfService: '11',
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

function generateAppeals(ctx: GenerationContext): void {
  _verbose('Generating appeals...')

  const { scenario, claimDetails } = ctx

  for (const pattern of scenario.patterns) {
    const patternClaims = claimDetails.filter(
      c => c.patternId === pattern.id && c.status === 'denied'
    )
    const appealsToFile = pattern.claimDistribution.appealsFiled
    const overturnsNeeded = pattern.claimDistribution.appealsOverturned

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

      if (isOverturned) {
        claim.status = 'appealed'
        const summary = ctx.claims.find(c => c.id === claim.id)
        if (summary) {
          summary.status = 'appealed'
        }
      }
    }
  }

  _verbose(`Generated ${ctx.appeals.length} appeal records`)
}

function generatePatternSnapshots(ctx: GenerationContext): void {
  _verbose('Generating pattern snapshots...')

  const { scenario, months, claimDetails, appeals } = ctx

  for (const pattern of scenario.patterns) {
    for (const month of months) {
      const monthClaims = claimDetails.filter(
        c => c.patternId === pattern.id && c.dateOfService.startsWith(month.key)
      )
      const deniedClaims = monthClaims.filter(c => c.status === 'denied')
      const monthAppeals = appeals.filter(a => monthClaims.some(c => c.id === a.claimId))

      const dollarsDenied = deniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)
      const dollarsAtRisk = monthClaims.reduce((sum, c) => sum + c.billedAmount, 0)

      ctx.patternSnapshots.push({
        patternId: pattern.id,
        snapshotDate: formatDateISO(month.end),
        periodStart: formatDateISO(month.start),
        periodEnd: formatDateISO(month.end),
        claimCount: monthClaims.length,
        deniedCount: deniedClaims.length,
        denialRate:
          monthClaims.length > 0 ? (deniedClaims.length / monthClaims.length) * 100 : 0,
        dollarsDenied,
        dollarsAtRisk,
        appealCount: monthAppeals.length,
        appealRate:
          deniedClaims.length > 0 ? (monthAppeals.length / deniedClaims.length) * 100 : 0,
      })
    }
  }

  _verbose(`Generated ${ctx.patternSnapshots.length} pattern snapshots`)
}

function generateLearningEvents(ctx: GenerationContext): void {
  _verbose('Generating learning events...')

  const { scenario, months } = ctx
  const { eventDistribution, eventClustering } = scenario.learningEvents

  for (const [eventType, count] of Object.entries(eventDistribution)) {
    for (let i = 0; i < count; i++) {
      let timestamp: Date
      const clusterDates = Object.entries(eventClustering).find(
        ([, dates]) => dates.length > 0 && Math.random() < 0.7
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

  _verbose(`Generated ${ctx.learningEvents.length} learning events`)
}

// =============================================================================
// DATABASE WRITE
// =============================================================================

function writeToDatabase(ctx: GenerationContext, db: BetterSqlite3.Database): void {
  _verbose('Writing to database...')

  const { scenario, claimDetails, patternSnapshots, appeals, learningEvents } = ctx

  db.exec('BEGIN TRANSACTION')

  try {
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

    // Clean up existing data for this scenario (cascades handle children)
    db.prepare('DELETE FROM learning_events WHERE scenario_id = ?').run(scenario.id)
    db.prepare('DELETE FROM claims WHERE scenario_id = ?').run(scenario.id)
    db.prepare('DELETE FROM patterns WHERE scenario_id = ?').run(scenario.id)
    db.prepare('DELETE FROM providers WHERE scenario_id = ?').run(scenario.id)

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

    const referencedPolicyIds = new Set<string>()
    for (const claim of claimDetails) {
      claim.policyIds.forEach(id => referencedPolicyIds.add(id))
    }

    for (const policyId of referencedPolicyIds) {
      const policy = getPolicyById(policyId)
      if (policy) {
        insertPolicy.run(
          policy.id,
          policy.name,
          policy.mode,
          scenario.timeline.startDate,
          policy.description,
          policy.clinicalRationale || null,
          policy.topic,
          policy.primaryLogicType,
          policy.source,
          policy.commonMistake,
          policy.fixGuidance
        )

        if (policy.procedureCodes) {
          for (const code of policy.procedureCodes) {
            insertPolicyProcedure.run(policy.id, code)
          }
        }

        if (policy.modifiers) {
          for (const modifier of policy.modifiers) {
            insertPolicyModifier.run(policy.id, modifier)
          }
        }
      }
    }

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

      claim.diagnosisCodes.forEach((code, idx) => {
        insertDiagnosis.run(claim.id, code, idx + 1)
      })

      claim.procedureCodes.forEach(code => {
        insertProcedure.run(claim.id, code)
      })

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

        line.modifiers.forEach((modifier, idx) => {
          insertModifier.run(result.lastInsertRowid, modifier, idx + 1)
        })
      }

      // Link policies to denied lines
      if (claim.status === 'denied' && claim.policyIds.length > 0 && lineItemIds.length > 0) {
        claim.policyIds.forEach((policyId, idx) => {
          const lineItemId = lineItemIds[idx % lineItemIds.length]
          const lineItem = claim.lineItems[idx % claim.lineItems.length]
          if (lineItem && lineItem.status === 'denied') {
            insertClaimLinePolicy.run(
              lineItemId,
              policyId,
              1,
              lineItem.billedAmount,
              claim.denialReason || null
            )
          }
        })
      }

      // Link patterns to denied lines
      if (claim.status === 'denied' && claim.patternId && lineItemIds.length > 0) {
        lineItemIds.forEach((lineItemId, idx) => {
          const lineItem = claim.lineItems[idx]
          if (lineItem && lineItem.status === 'denied') {
            insertPatternClaimLine.run(
              claim.patternId,
              lineItemId,
              lineItem.billedAmount,
              claim.dateOfService
            )
          }
        })
      }
    }

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

    db.exec('COMMIT')
    _verbose('Data written to database successfully')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

// =============================================================================
// MAIN PIPELINE
// =============================================================================

export function runScenarioPipeline(
  scenario: ScenarioDefinition,
  db: BetterSqlite3.Database,
  options?: { verbose?: boolean }
): PipelineResult {
  const startTime = Date.now()

  // Set module-level verbose logger for this run
  _verbose = options?.verbose
    ? (...args: unknown[]) => console.log('  [verbose]', ...args)
    : () => {}

  try {
    const ctx = initializeContext(scenario)

    generateBaseClaims(ctx)
    generatePatternClaims(ctx)
    generateAppeals(ctx)
    generatePatternSnapshots(ctx)
    generateLearningEvents(ctx)

    writeToDatabase(ctx, db)

    const deniedClaims = ctx.claims.filter(c => c.status === 'denied').length

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      success: true,
      stats: {
        claims: ctx.claims.length,
        deniedClaims,
        appeals: ctx.appeals.length,
        snapshots: ctx.patternSnapshots.length,
        learningEvents: ctx.learningEvents.length,
        durationMs: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stats: {
        claims: 0,
        deniedClaims: 0,
        appeals: 0,
        snapshots: 0,
        learningEvents: 0,
        durationMs: Date.now() - startTime,
      },
    }
  } finally {
    _verbose = () => {}
  }
}
