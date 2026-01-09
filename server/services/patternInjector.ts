/**
 * Pattern Injector Service
 *
 * Injects denial patterns into claim streams at configurable rates,
 * simulating real-world denial pattern distributions.
 */

import type { GeneratedClaim, DenialPattern } from './claimGenerator'
import { applyDenialPattern, DENIAL_REASONS, PROCEDURE_CODES } from './claimGenerator'

// =============================================================================
// TYPES
// =============================================================================

export interface PatternInjectionConfig {
  /** Pattern ID */
  patternId: string
  /** Injection rate (0-1) */
  rate: number
  /** Denial reason to apply */
  denialReason: string
  /** Pattern category */
  category: string
  /** Procedure codes that trigger this pattern (optional) */
  procedureCodes?: string[]
}

export interface InjectionResult {
  /** Total claims processed */
  totalClaims: number
  /** Claims with pattern injected */
  injectedCount: number
  /** Claims left unchanged */
  unchangedCount: number
  /** Injection rate achieved */
  actualRate: number
}

// =============================================================================
// PREDEFINED PATTERNS
// =============================================================================

export const PREDEFINED_PATTERNS: Record<string, DenialPattern> = {
  'MOD25-MISSING': {
    id: 'MOD25-MISSING',
    category: 'modifier-missing',
    denialReason: 'Modifier 25 required for E/M service on same day as procedure',
    procedureCodes: ['99213', '99214', '99215', '99203', '99204', '99205'],
  },
  'MOD59-MISSING': {
    id: 'MOD59-MISSING',
    category: 'modifier-missing',
    denialReason: 'Modifier 59 required to indicate distinct procedural service',
    procedureCodes: ['97110', '97140', '20610'],
  },
  'AUTH-MISSING': {
    id: 'AUTH-MISSING',
    category: 'authorization',
    denialReason: 'Prior authorization required but not obtained',
    procedureCodes: ['27447', '27446', '70553', '72148', '64483'],
  },
  'DOC-INCOMPLETE': {
    id: 'DOC-INCOMPLETE',
    category: 'documentation',
    denialReason: 'Medical necessity not established in documentation',
  },
  'BUNDLED-SERVICE': {
    id: 'BUNDLED-SERVICE',
    category: 'billing-error',
    denialReason: 'Service is bundled with primary procedure',
    procedureCodes: ['36415', '96372'],
  },
  'GLOBAL-PERIOD': {
    id: 'GLOBAL-PERIOD',
    category: 'billing-error',
    denialReason: 'Service included in surgical global period',
    procedureCodes: ['99213', '99214'],
  },
  'FREQ-EXCEEDED': {
    id: 'FREQ-EXCEEDED',
    category: 'timing',
    denialReason: 'Service frequency exceeds benefit limits',
    procedureCodes: ['20610', '64483', '64493'],
  },
  'DX-MISMATCH': {
    id: 'DX-MISMATCH',
    category: 'code-mismatch',
    denialReason: 'Diagnosis does not support medical necessity of procedure',
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}

/**
 * Check if a claim is eligible for a specific pattern injection
 */
function isEligibleForPattern(claim: GeneratedClaim, pattern: DenialPattern): boolean {
  // If pattern has specific procedure codes, check if claim has any
  if (pattern.procedureCodes && pattern.procedureCodes.length > 0) {
    const claimCodes = claim.procedureCodes.map(p => p.code)
    return claimCodes.some(code => pattern.procedureCodes!.includes(code))
  }

  // No procedure code restriction - all claims eligible
  return true
}

// =============================================================================
// MAIN INJECTOR FUNCTIONS
// =============================================================================

/**
 * Inject a single pattern into a batch of claims
 */
export function injectPattern(
  claims: GeneratedClaim[],
  patternId: string,
  rate: number
): { claims: GeneratedClaim[]; result: InjectionResult } {
  const pattern = PREDEFINED_PATTERNS[patternId]
  if (!pattern) {
    throw new Error(`Unknown pattern: ${patternId}`)
  }

  // Filter to eligible claims only
  const eligibleClaims = claims.filter(c => isEligibleForPattern(c, pattern))
  const ineligibleClaims = claims.filter(c => !isEligibleForPattern(c, pattern))

  // Calculate how many to inject
  const countToInject = Math.floor(eligibleClaims.length * rate)

  // Shuffle and select claims for injection
  const shuffled = shuffleArray(eligibleClaims)
  const toInject = new Set(shuffled.slice(0, countToInject))

  // Process claims
  const processedClaims = [
    ...ineligibleClaims,
    ...eligibleClaims.map(claim => {
      if (toInject.has(claim)) {
        return applyDenialPattern({ ...claim }, pattern)
      }
      return claim
    }),
  ]

  return {
    claims: processedClaims,
    result: {
      totalClaims: claims.length,
      injectedCount: countToInject,
      unchangedCount: claims.length - countToInject,
      actualRate: claims.length > 0 ? countToInject / claims.length : 0,
    },
  }
}

/**
 * Inject multiple patterns into a batch of claims
 */
export function injectMultiplePatterns(
  claims: GeneratedClaim[],
  patterns: PatternInjectionConfig[]
): { claims: GeneratedClaim[]; results: Record<string, InjectionResult> } {
  let currentClaims = [...claims]
  const results: Record<string, InjectionResult> = {}

  for (const config of patterns) {
    // Create or use predefined pattern
    const pattern: DenialPattern = PREDEFINED_PATTERNS[config.patternId] || {
      id: config.patternId,
      category: config.category,
      denialReason: config.denialReason,
      procedureCodes: config.procedureCodes,
    }

    // Filter to non-denied claims only (don't double-deny)
    const nonDeniedClaims = currentClaims.filter(c => c.claim.status !== 'denied')
    const alreadyDenied = currentClaims.filter(c => c.claim.status === 'denied')

    // Inject pattern into non-denied claims
    const countToInject = Math.floor(nonDeniedClaims.length * config.rate)
    const shuffled = shuffleArray(nonDeniedClaims)
    const toInject = new Set(shuffled.slice(0, countToInject))

    const processed = nonDeniedClaims.map(claim => {
      if (toInject.has(claim)) {
        return applyDenialPattern({ ...claim }, pattern)
      }
      return claim
    })

    currentClaims = [...alreadyDenied, ...processed]

    results[config.patternId] = {
      totalClaims: claims.length,
      injectedCount: countToInject,
      unchangedCount: claims.length - countToInject,
      actualRate: claims.length > 0 ? countToInject / claims.length : 0,
    }
  }

  return { claims: currentClaims, results }
}

/**
 * Inject patterns with trajectory simulation
 * (denial rate decreases over time to simulate improvement)
 */
export function injectPatternWithTrajectory(
  claims: GeneratedClaim[],
  pattern: DenialPattern,
  config: {
    baselineRate: number
    currentRate: number
    trajectory: 'steep_improvement' | 'gradual_improvement' | 'slight_improvement' | 'stable' | 'regression'
    timelineStart: Date
    timelineEnd: Date
  }
): { claims: GeneratedClaim[]; rateByMonth: Record<string, number> } {
  const { baselineRate, currentRate, trajectory, timelineStart, timelineEnd } = config

  // Calculate monthly rates based on trajectory
  const months: string[] = []
  const current = new Date(timelineStart)
  while (current <= timelineEnd) {
    months.push(current.toISOString().slice(0, 7))
    current.setMonth(current.getMonth() + 1)
  }

  const rateByMonth: Record<string, number> = {}

  months.forEach((month, index) => {
    const progress = index / Math.max(months.length - 1, 1)
    let rate: number

    switch (trajectory) {
      case 'steep_improvement':
        // 80% of improvement happens in first 40% of time
        if (progress <= 0.4) {
          rate = baselineRate - (baselineRate - currentRate) * 0.8 * (progress / 0.4)
        } else {
          rate = baselineRate - (baselineRate - currentRate) * (0.8 + 0.2 * ((progress - 0.4) / 0.6))
        }
        break
      case 'gradual_improvement':
        rate = baselineRate - (baselineRate - currentRate) * progress
        break
      case 'slight_improvement':
        rate = baselineRate - (baselineRate - currentRate) * Math.pow(progress, 2)
        break
      case 'stable':
        rate = baselineRate
        break
      case 'regression':
        rate = baselineRate + (currentRate - baselineRate) * progress
        break
      default:
        rate = baselineRate - (baselineRate - currentRate) * progress
    }

    rateByMonth[month] = Math.max(0, Math.min(1, rate / 100))
  })

  // Group claims by month
  const claimsByMonth: Record<string, GeneratedClaim[]> = {}
  for (const claim of claims) {
    const month = claim.claim.dateOfService?.slice(0, 7) || 'unknown'
    if (!claimsByMonth[month]) {
      claimsByMonth[month] = []
    }
    claimsByMonth[month].push(claim)
  }

  // Inject pattern at month-specific rates
  const processedClaims: GeneratedClaim[] = []

  for (const [month, monthClaims] of Object.entries(claimsByMonth)) {
    const rate = rateByMonth[month] ?? currentRate / 100
    const { claims: injected } = injectPattern(monthClaims, pattern.id, rate)
    processedClaims.push(...injected)
  }

  return { claims: processedClaims, rateByMonth }
}

/**
 * Get pattern statistics
 */
export function getPatternStats(
  claims: GeneratedClaim[],
  patternId: string
): {
  total: number
  denied: number
  approved: number
  denialRate: number
  totalBilled: number
  totalDenied: number
} {
  const pattern = PREDEFINED_PATTERNS[patternId]
  if (!pattern) {
    return { total: 0, denied: 0, approved: 0, denialRate: 0, totalBilled: 0, totalDenied: 0 }
  }

  const eligibleClaims = claims.filter(c =>
    pattern.procedureCodes
      ? c.procedureCodes.some(p => pattern.procedureCodes!.includes(p.code))
      : true
  )

  const denied = eligibleClaims.filter(c =>
    c.claim.status === 'denied' &&
    c.claim.denialReason?.includes(pattern.denialReason.split(' ')[0]!)
  )

  const totalBilled = eligibleClaims.reduce((sum, c) => sum + (c.claim.billedAmount || 0), 0)
  const totalDenied = denied.reduce((sum, c) => sum + (c.claim.billedAmount || 0), 0)

  return {
    total: eligibleClaims.length,
    denied: denied.length,
    approved: eligibleClaims.length - denied.length,
    denialRate: eligibleClaims.length > 0 ? (denied.length / eligibleClaims.length) * 100 : 0,
    totalBilled,
    totalDenied,
  }
}

/**
 * Get available patterns
 */
export function getAvailablePatterns(): DenialPattern[] {
  return Object.values(PREDEFINED_PATTERNS)
}
