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
  warnings: string[]
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
  const warnings: string[] = []

  if (!scenario) {
    return { valid: false, errors: ['Scenario is null or undefined'], warnings: [] }
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

      // Check policy references — warn if not in hardcoded library (full policy set may be in DB)
      const policyIds = pattern.policies?.map(p => p.id) || []
      const missing = validatePolicyReferences(policyIds)
      if (missing.length > 0) {
        warnings.push(`Pattern "${pattern.id}": policy IDs not in built-in library (will use pattern denialReason instead): ${missing.join(', ')}`)
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

  return { valid: errors.length === 0, errors, warnings }
}

// =============================================================================
// GENERATION PHASES
// =============================================================================

/**
 * Normalize a denial rate value to 0-1 decimal range.
 * Values > 1.0 are treated as percentages (e.g., 25 = 25%) and divided by 100.
 * Values <= 1.0 are treated as decimals (e.g., 0.25 = 25%) and kept as-is.
 *
 * Ambiguity note: exactly 1.0 could theoretically mean 100% (decimal) or 1%
 * (percentage). We treat it as 100% because real-world scenario data (e.g., UPMC)
 * uses 1.0 for very-high-denial patterns with denied counts of 83-91%.
 * A true 1% rate should be written as 0.01.
 */
function normalizeDenialRate(rate: number): number {
  if (rate > 1.0) return rate / 100
  return rate
}

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

function computeAveragePatternDenialCurve(
  scenario: ScenarioDefinition,
  monthCount: number
): number[] {
  let totalWeight = 0
  const weightedRates = new Array(monthCount).fill(0) as number[]

  for (const pattern of scenario.patterns) {
    const baselineRate = normalizeDenialRate(pattern.trajectory.baseline.denialRate)
    const currentRate = normalizeDenialRate(pattern.trajectory.current.denialRate)
    const curve = calculateDenialCurve(
      baselineRate,
      currentRate,
      monthCount,
      pattern.trajectory.curve
    )
    const weight = pattern.claimDistribution.total

    for (let i = 0; i < monthCount; i++) {
      weightedRates[i] = (weightedRates[i] ?? 0) + (curve[i] ?? 0) * weight
    }
    totalWeight += weight
  }

  if (totalWeight === 0) return new Array(monthCount).fill(0.03) as number[]
  return weightedRates.map(r => r / totalWeight)
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

  // Compute a base denial curve that mirrors the scenario's improvement trajectory.
  // Instead of a flat 3%, scale proportionally with the weighted average pattern denial curve.
  const BASE_RATE_CENTER = 0.03
  const avgCurve = computeAveragePatternDenialCurve(scenario, months.length)
  const startAvg = avgCurve[0] ?? 0.10
  const baseDenialRates = startAvg > 0
    ? avgCurve.map(avgRate => BASE_RATE_CENTER * (avgRate / startAvg))
    : new Array(months.length).fill(BASE_RATE_CENTER) as number[]

  _verbose(`Base denial rates: ${baseDenialRates.map(r => (r * 100).toFixed(1) + '%').join(', ')}`)

  // Pre-compute denied counts and enforce monotonic decrease.
  // Volume variation can cause count*rate to increase even when rate decreases,
  // so we clamp to ensure denied counts never rise month-over-month.
  const baseDeniedCounts = claimsPerMonth.map((count, idx) => {
    const rate = baseDenialRates[idx] ?? BASE_RATE_CENTER
    return Math.round(count * rate)
  })
  for (let i = 1; i < baseDeniedCounts.length; i++) {
    if ((baseDeniedCounts[i] ?? 0) > (baseDeniedCounts[i - 1] ?? 0)) {
      baseDeniedCounts[i] = baseDeniedCounts[i - 1] ?? 0
    }
  }

  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const count = claimsPerMonth[monthIdx] ?? 0
    if (!month) continue

    const deniedCount = baseDeniedCounts[monthIdx] ?? 0
    // Denied claims use a stable amount (medium range midpoint ±10%) so that
    // total denied dollars track proportionally with denied counts across months.
    const medMid = (scenario.volume.claimValueRanges.medium.min + scenario.volume.claimValueRanges.medium.max) / 2
    for (let i = 0; i < count; i++) {
      const forcedRate = i < deniedCount ? 1.0 : 0.0
      const stableAmt = i < deniedCount ? roundToDecimal(medMid * randomFloat(0.9, 1.1), 2) : undefined
      const claim = generateSingleClaim(ctx, month, undefined, forcedRate, stableAmt)
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

    // Normalize denial rates to 0-1 decimal range ONCE at the input boundary.
    // Scenario files typically use decimals (0.25 = 25%), but legacy files may use
    // percentages (25 = 25%). Normalize before any curve calculation or noise.
    // NOTE: A value of exactly 1.0 is ambiguous (100% or 1%). The UPMC scenarios
    // define 1.0 with denied counts of 83-91%, clearly meaning 100%. We treat
    // >= 1.0 as percentage notation. A true 1% rate would need to be written as 0.01.
    const baselineRate = normalizeDenialRate(pattern.trajectory.baseline.denialRate)
    const currentRate = normalizeDenialRate(pattern.trajectory.current.denialRate)

    const denialCurve = calculateDenialCurve(
      baselineRate,
      currentRate,
      months.length,
      pattern.trajectory.curve
    )

    const avgMonthlyClaimCount = Math.round(pattern.claimDistribution.total / months.length)
    const direction: 'improving' | 'worsening' | 'flat' =
      baselineRate > currentRate ? 'improving'
        : baselineRate < currentRate ? 'worsening'
          : 'flat'
    const denialRates = addCurveVariation(denialCurve, 3, {
      monthlyClaimCount: avgMonthlyClaimCount,
      direction,
    })

    // Flat-rate patterns (100%→100%) deny everything, so volume variation = denial variation.
    // Use perfectly even distribution (dampening=0) to eliminate noise entirely.
    const volumeDampening = direction === 'flat' ? 0 : 1.0
    const claimsPerMonth = distributeClaimsAcrossMonths(
      pattern.claimDistribution.total,
      months,
      scenario.volume.monthlyVariation,
      volumeDampening
    )

    // Pre-compute denied counts per month; enforce monotonic decrease for improving patterns
    const patternDeniedCounts = claimsPerMonth.map((monthCount, idx) => {
      const rate = denialRates[idx] ?? 0
      return Math.round(monthCount * rate)
    })
    if (direction === 'improving') {
      for (let i = 1; i < patternDeniedCounts.length; i++) {
        if ((patternDeniedCounts[i] ?? 0) > (patternDeniedCounts[i - 1] ?? 0)) {
          patternDeniedCounts[i] = patternDeniedCounts[i - 1] ?? 0
        }
      }
    }

    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const month = months[monthIdx]
      if (!month) continue

      const count = claimsPerMonth[monthIdx] ?? 0
      const deniedCount = patternDeniedCounts[monthIdx] ?? 0
      const patMedMid = (scenario.volume.claimValueRanges.medium.min + scenario.volume.claimValueRanges.medium.max) / 2
      for (let i = 0; i < count; i++) {
        const forcedRate = i < deniedCount ? 1.0 : 0.0
        const stableAmt = i < deniedCount ? roundToDecimal(patMedMid * randomFloat(0.9, 1.1), 2) : undefined
        const claim = generateSingleClaim(ctx, month, pattern, forcedRate, stableAmt)
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
  denialRate: number,
  overrideAmount?: number
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

  const billedAmount = overrideAmount ?? randomClaimAmount(scenario.volume.claimValueRanges)
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
        // Update line items: overturned means payer agreed to pay
        for (const line of claim.lineItems) {
          if (line.status === 'denied') {
            line.status = 'approved'
            line.paidAmount = roundToDecimal(line.billedAmount * randomFloat(0.7, 0.95), 2)
          }
        }
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
      // "Ever denied" = claims that were denied, including those later overturned (status='appealed')
      const everDeniedClaims = monthClaims.filter(c => c.status === 'denied' || c.status === 'appealed')
      const monthAppeals = appeals.filter(a => monthClaims.some(c => c.id === a.claimId))

      const dollarsDenied = everDeniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)
      const dollarsAtRisk = monthClaims.reduce((sum, c) => sum + c.billedAmount, 0)

      ctx.patternSnapshots.push({
        patternId: pattern.id,
        snapshotDate: formatDateISO(month.end),
        periodStart: formatDateISO(month.start),
        periodEnd: formatDateISO(month.end),
        claimCount: monthClaims.length,
        deniedCount: everDeniedClaims.length,
        denialRate:
          monthClaims.length > 0 ? (everDeniedClaims.length / monthClaims.length) * 100 : 0,
        dollarsDenied,
        dollarsAtRisk,
        appealCount: monthAppeals.length,
        appealRate:
          everDeniedClaims.length > 0 ? (monthAppeals.length / everDeniedClaims.length) * 100 : 0,
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

    // Derive recovery status and action category from pattern characteristics
    function deriveRecoveryClassification(pattern: {
      category: string
      title: string
      denialReason?: string
      description?: string
      remediation?: { shortTerm?: { description?: string }; longTerm?: { description?: string } }
    }): { actionCategory: string; recoveryStatus: string } {
      const cat = pattern.category.toLowerCase()
      const title = pattern.title.toLowerCase()
      const reason = (pattern.denialReason || '').toLowerCase()
      const shortTerm = (pattern.remediation?.shortTerm?.description || '').toLowerCase()
      const desc = (pattern.description || '').toLowerCase()
      const allText = `${title} ${reason} ${shortTerm} ${desc}`

      // Derive action_category from category and denial reason
      let actionCategory = 'coding_knowledge'
      if (cat.includes('modifier') || reason.includes('modifier')) {
        actionCategory = 'coding_knowledge'
      } else if (cat.includes('documentation') || reason.includes('documentation') || reason.includes('medical necessity')) {
        actionCategory = 'documentation'
      } else if (cat.includes('authorization') || reason.includes('prior auth') || reason.includes('authorization')) {
        actionCategory = 'operational_system'
      } else if (cat.includes('frequency') || cat.includes('coverage') || reason.includes('benefit limit') || reason.includes('not covered') || reason.includes('non-covered') || reason.includes('experimental')) {
        actionCategory = 'coverage_blindspot'
      } else if (cat.includes('bundling') || cat.includes('coding') || cat.includes('global')) {
        actionCategory = 'coding_knowledge'
      }

      // Derive recovery_status from action_category
      const categoryToRecovery: Record<string, string> = {
        coding_knowledge: 'recoverable',
        documentation: 'partial',
        operational_system: 'partial',
        coverage_blindspot: 'not_recoverable',
        payer_specific: 'partial',
      }
      let recoveryStatus = categoryToRecovery[actionCategory] || 'recoverable'

      // Override with strong text signals
      if (allText.includes('cannot resubmit') || allText.includes('legitimate') || allText.includes('not a covered benefit') || allText.includes('benefit limit exceeded') || allText.includes('benefit limitation')) {
        recoveryStatus = 'not_recoverable'
      } else if (allText.includes('resubmit with') || allText.includes('add modifier') || allText.includes('correct code') || allText.includes('append')) {
        recoveryStatus = 'recoverable'
      }

      return { actionCategory, recoveryStatus }
    }

    // Insert patterns
    const insertPattern = db.prepare(`
      INSERT OR REPLACE INTO patterns (
        id, title, description, category, status, tier, scenario_id,
        score_frequency, score_impact, score_trend, score_velocity, score_confidence, score_recency,
        avg_denial_amount, total_at_risk,
        baseline_start, baseline_end, baseline_claim_count, baseline_denied_count,
        baseline_denial_rate, baseline_dollars_denied,
        current_start, current_end, current_claim_count, current_denied_count,
        current_denial_rate, current_dollars_denied,
        denial_reason,
        short_term_description, short_term_can_resubmit, long_term_description, long_term_steps,
        recovery_status, action_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const pattern of scenario.patterns) {
      // Use actual generated snapshot data for baseline/current instead of scenario JSON estimates
      const patternSnaps = patternSnapshots
        .filter(s => s.patternId === pattern.id)
        .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
      const firstSnap = patternSnaps[0]
      const lastSnap = patternSnaps[patternSnaps.length - 1]

      // Derive score columns from trajectory data
      const baseRate = pattern.trajectory.baseline.denialRate
      const currRate = pattern.trajectory.current.denialRate
      const relativeChange = baseRate > 0 ? (currRate - baseRate) / baseRate : 0
      // score_trend: >10% relative increase = 'up' (regressing), >10% decrease = 'down' (improving)
      const scoreTrend = relativeChange < -0.10 ? 'down' : relativeChange > 0.10 ? 'up' : 'stable'
      // score_frequency: pattern claims as fraction of total volume
      const scoreFrequency = scenario.volume.totalClaims > 0
        ? Math.round((pattern.claimDistribution.total / scenario.volume.totalClaims) * 100)
        : 0
      // score_impact: total dollars denied in current period
      const scoreImpact = pattern.trajectory.current.dollarsDenied || 0
      // score_velocity: rate of change per month (percentage points)
      const months = pattern.trajectory.snapshots?.length || 1
      const scoreVelocity = months > 1
        ? Math.round(((currRate - baseRate) / months) * 10000) / 100
        : 0
      // score_confidence: higher with more claims and longer observation
      const scoreConfidence = Math.min(1.0,
        (pattern.claimDistribution.total / 100) * 0.5 + (months / 12) * 0.5
      )
      // score_recency: days since current period end
      const scoreRecency = Math.max(0, Math.round(
        (Date.now() - new Date(pattern.trajectory.current.periodEnd).getTime()) / (1000 * 60 * 60 * 24)
      ))
      // avg_denial_amount and total_at_risk
      const avgDenialAmount = pattern.trajectory.current.deniedCount > 0
        ? pattern.trajectory.current.dollarsDenied / pattern.trajectory.current.deniedCount
        : 0
      const totalAtRisk = pattern.trajectory.current.dollarsDenied || 0

      const derived = deriveRecoveryClassification(pattern)
      const actionCategory = pattern.actionCategoryOverride || derived.actionCategory
      const recoveryStatus = pattern.recoveryStatusOverride || derived.recoveryStatus

      insertPattern.run(
        pattern.id,
        pattern.title,
        pattern.description,
        pattern.category,
        pattern.status,
        pattern.tier,
        scenario.id,
        scoreFrequency,
        scoreImpact,
        scoreTrend,
        scoreVelocity,
        scoreConfidence,
        scoreRecency,
        avgDenialAmount,
        totalAtRisk,
        pattern.trajectory.baseline.periodStart,
        pattern.trajectory.baseline.periodEnd,
        pattern.trajectory.baseline.claimCount,
        pattern.trajectory.baseline.deniedCount,
        firstSnap ? firstSnap.denialRate : pattern.trajectory.baseline.denialRate * 100,
        firstSnap ? firstSnap.dollarsDenied : pattern.trajectory.baseline.dollarsDenied,
        pattern.trajectory.current.periodStart,
        pattern.trajectory.current.periodEnd,
        pattern.trajectory.current.claimCount,
        pattern.trajectory.current.deniedCount,
        lastSnap ? lastSnap.denialRate : pattern.trajectory.current.denialRate * 100,
        lastSnap ? lastSnap.dollarsDenied : pattern.trajectory.current.dollarsDenied,
        pattern.denialReason || null,
        pattern.remediation?.shortTerm?.description || null,
        pattern.remediation?.shortTerm?.canResubmit ? 1 : 0,
        pattern.remediation?.longTerm?.description || null,
        JSON.stringify(pattern.remediation?.longTerm?.steps || []),
        recoveryStatus,
        actionCategory
      )
    }

    // Insert pattern related codes (procedure codes from scenario JSON)
    const insertRelatedCode = db.prepare(`
      INSERT OR IGNORE INTO pattern_related_codes (pattern_id, code)
      VALUES (?, ?)
    `)
    for (const pattern of scenario.patterns) {
      if (pattern.procedureCodes) {
        for (const code of pattern.procedureCodes) {
          insertRelatedCode.run(pattern.id, code)
        }
      }
    }

    // Insert pattern actions from engagement data
    const insertPatternAction = db.prepare(`
      INSERT OR IGNORE INTO pattern_actions (id, pattern_id, action_type, notes, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `)
    for (const pattern of scenario.patterns) {
      if (pattern.engagement?.actionsRecorded) {
        pattern.engagement.actionsRecorded.forEach((action, i) => {
          // JSON may use 'description' instead of 'notes'
          const notes = action.notes || (action as unknown as { description?: string }).description || null
          insertPatternAction.run(
            `${pattern.id}-action-${i}`,
            pattern.id,
            action.type,
            notes,
            action.date
          )
        })
      }
    }

    // Insert policies from policy library.
    // Use INSERT OR IGNORE (not INSERT OR REPLACE) to prevent CASCADE deletes:
    // REPLACE internally DELETEs then INSERTs, which triggers ON DELETE CASCADE
    // on claim_line_policies, destroying policy links from earlier scenarios.
    const insertPolicy = db.prepare(`
      INSERT OR IGNORE INTO policies (
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
      } else {
        // Policy not in built-in library. Check if it already exists in the database
        // (e.g., from a prior bulk policy import) before inserting a stub.
        const existingRow = db.prepare('SELECT id FROM policies WHERE id = ?').get(policyId) as { id: string } | undefined
        if (existingRow) {
          _verbose(`Policy "${policyId}" found in database, skipping stub insertion`)
        } else {
          // Generate a meaningful name from the pattern context instead of using raw ID
          const patternUsingPolicy = scenario.patterns.find(
            p => p.policies?.some(ref => ref.id === policyId)
          )
          const categoryMap: Record<string, { topic: string; logicType: string }> = {
            'modifier-missing': { topic: 'Coding & Modifiers', logicType: 'Modifier Validation' },
            'code-mismatch': { topic: 'Coding & Billing', logicType: 'Code Matching' },
            'coding-error': { topic: 'Coding & Billing', logicType: 'Code Validation' },
            'documentation': { topic: 'Documentation', logicType: 'Documentation Review' },
            'authorization': { topic: 'Prior Authorization', logicType: 'Authorization Check' },
            'billing-error': { topic: 'Billing', logicType: 'Billing Validation' },
            'timing': { topic: 'Timing & Frequency', logicType: 'Frequency Limit' },
            'frequency-limit': { topic: 'Timing & Frequency', logicType: 'Frequency Limit' },
            'coding-specificity': { topic: 'Coding', logicType: 'Specificity Check' },
            'medical-necessity': { topic: 'Medical Necessity', logicType: 'Medical Necessity Review' },
            'bundling': { topic: 'Bundling & NCCI', logicType: 'Bundling Edit' },
            'global-period': { topic: 'Global Surgery', logicType: 'Global Period Check' },
            'administrative': { topic: 'Administrative', logicType: 'Administrative Review' },
            'coverage-exclusion': { topic: 'Coverage', logicType: 'Coverage Determination' },
          }
          const category = patternUsingPolicy?.category || ''
          const mapped = categoryMap[category] || { topic: 'General', logicType: 'Claim Review' }
          const policyName = patternUsingPolicy?.denialReason
            ? patternUsingPolicy.denialReason.slice(0, 120)
            : `Policy ${policyId}`

          _verbose(`Policy "${policyId}" not in built-in library, inserting contextual stub`)
          insertPolicy.run(
            policyId,
            policyName,
            'Informational',
            scenario.timeline.startDate,
            patternUsingPolicy?.denialReason || 'Policy referenced by scenario',
            null,                   // clinicalRationale
            mapped.topic,
            mapped.logicType,
            'Scenario Import',
            patternUsingPolicy ? `Common in ${category.replace(/-/g, ' ')} patterns` : null,
            patternUsingPolicy?.remediation?.shortTerm?.description || null
          )
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

      // Link policies to denied/overturned lines
      // Overturned claims (status='appealed') had line items changed to 'approved',
      // but they were originally denied and should still link to the triggering policy
      const isEverDenied = claim.status === 'denied' || claim.status === 'appealed'
      if (isEverDenied && claim.policyIds.length > 0 && lineItemIds.length > 0) {
        claim.policyIds.forEach((policyId, idx) => {
          const lineItemId = lineItemIds[idx % lineItemIds.length]
          insertClaimLinePolicy.run(
            lineItemId,
            policyId,
            1,
            claim.lineItems[idx % claim.lineItems.length]?.billedAmount ?? 0,
            claim.denialReason || null
          )
        })
      }

      // Link patterns to denied/overturned lines
      if (isEverDenied && claim.patternId && lineItemIds.length > 0) {
        lineItemIds.forEach((lineItemId, idx) => {
          insertPatternClaimLine.run(
            claim.patternId,
            lineItemId,
            claim.lineItems[idx]?.billedAmount ?? 0,
            claim.dateOfService
          )
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
