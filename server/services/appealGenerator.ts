/**
 * Appeal Generator Service
 *
 * Generates realistic appeals for denied claims with configurable
 * outcomes based on denial reason categories.
 */

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { claims, claimAppeals } from '../database/schema'
import { DENIAL_REASONS } from './claimGenerator'

// =============================================================================
// TYPES
// =============================================================================

export interface AppealConfig {
  /** Base appeal rate for denied claims (0-1), default 0.40 */
  appealRate?: number
  /** Days after processing to file appeal */
  appealDelayDays?: { min: number; max: number }
  /** Days to resolve appeal after filing */
  resolutionDelayDays?: { min: number; max: number }
}

export interface GeneratedAppeal {
  appeal: InferInsertModel<typeof claimAppeals>
  /** Scheduled resolution (for simulation) */
  scheduledResolution?: {
    outcomeDate: string
    outcome: 'upheld' | 'overturned'
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function addDays(date: Date | string, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

/**
 * Get the appeal success rate based on denial reason
 */
function getOverturnRate(denialReason: string | null): number {
  if (!denialReason) return 0.40 // Default rate

  // Check each denial reason category
  for (const info of Object.values(DENIAL_REASONS)) {
    if (denialReason.toLowerCase().includes(info.reason.toLowerCase().split(' ')[0]!)) {
      return info.appealSuccessRate
    }
  }

  // Category-based fallback
  if (denialReason.toLowerCase().includes('modifier')) return 0.65
  if (denialReason.toLowerCase().includes('authorization')) return 0.20
  if (denialReason.toLowerCase().includes('documentation')) return 0.45
  if (denialReason.toLowerCase().includes('bundl')) return 0.55
  if (denialReason.toLowerCase().includes('medical necessity')) return 0.35
  if (denialReason.toLowerCase().includes('frequency')) return 0.25

  return 0.40 // Default
}

/**
 * Generate a reason for the appeal based on the denial reason
 */
function generateAppealReason(denialReason: string | null): string {
  if (!denialReason) {
    return 'Appeal filed to contest claim denial'
  }

  if (denialReason.toLowerCase().includes('modifier')) {
    return 'Documentation supports distinct service; modifier added and claim resubmitted'
  }

  if (denialReason.toLowerCase().includes('authorization')) {
    return 'Retroactive authorization request submitted with supporting clinical documentation'
  }

  if (denialReason.toLowerCase().includes('documentation')) {
    return 'Additional clinical documentation provided to support medical necessity'
  }

  if (denialReason.toLowerCase().includes('bundl')) {
    return 'Services were distinct and separately identifiable; supporting documentation attached'
  }

  if (denialReason.toLowerCase().includes('global')) {
    return 'Service was unrelated to the surgical procedure and should be separately payable'
  }

  if (denialReason.toLowerCase().includes('diagnosis') || denialReason.toLowerCase().includes('mismatch')) {
    return 'Corrected diagnosis codes submitted with clinical justification'
  }

  if (denialReason.toLowerCase().includes('frequency')) {
    return 'Medical necessity documentation provided to justify service frequency'
  }

  return `Appeal filed to contest denial: ${denialReason}`
}

// =============================================================================
// MAIN GENERATOR FUNCTIONS
// =============================================================================

/**
 * Generate an appeal for a denied claim
 * Returns null if claim is not eligible for appeal or randomly not appealed
 */
export function generateAppeal(
  claim: InferSelectModel<typeof claims> | { id: string; status: string; denialReason: string | null; processingDate: string | null },
  config: AppealConfig = {}
): GeneratedAppeal | null {
  const {
    appealRate = 0.40,
    appealDelayDays = { min: 3, max: 14 },
    resolutionDelayDays = { min: 14, max: 45 },
  } = config

  // Only appeal denied claims
  if (claim.status !== 'denied') {
    return null
  }

  // Random chance to appeal
  if (Math.random() > appealRate) {
    return null
  }

  // Calculate dates
  const processingDate = claim.processingDate ? new Date(claim.processingDate) : new Date()
  const appealDate = addDays(processingDate, randomInt(appealDelayDays.min, appealDelayDays.max))
  const outcomeDate = addDays(appealDate, randomInt(resolutionDelayDays.min, resolutionDelayDays.max))

  // Determine outcome based on denial reason
  const overturnRate = getOverturnRate(claim.denialReason)
  const isOverturned = Math.random() < overturnRate
  const outcome: 'upheld' | 'overturned' = isOverturned ? 'overturned' : 'upheld'

  // Generate appeal reason
  const appealReason = generateAppealReason(claim.denialReason)

  // Build appeal record
  const appeal: InferInsertModel<typeof claimAppeals> = {
    claimId: claim.id,
    appealFiled: true,
    appealDate: toDateString(appealDate),
    appealReason,
    appealOutcome: 'pending', // Initially pending
    outcomeDate: null,
    outcomeNotes: null,
  }

  return {
    appeal,
    scheduledResolution: {
      outcomeDate: toDateString(outcomeDate),
      outcome,
    },
  }
}

/**
 * Generate appeals for a batch of claims
 */
export function generateAppealsForClaims(
  claimList: Array<InferSelectModel<typeof claims> | { id: string; status: string; denialReason: string | null; processingDate: string | null }>,
  config: AppealConfig = {}
): GeneratedAppeal[] {
  const appeals: GeneratedAppeal[] = []

  for (const claim of claimList) {
    const appeal = generateAppeal(claim, config)
    if (appeal) {
      appeals.push(appeal)
    }
  }

  return appeals
}

/**
 * Resolve a pending appeal (update its outcome)
 */
export function resolveAppeal(
  appeal: InferInsertModel<typeof claimAppeals>,
  resolution: { outcome: 'upheld' | 'overturned'; outcomeDate: string }
): InferInsertModel<typeof claimAppeals> {
  return {
    ...appeal,
    appealOutcome: resolution.outcome,
    outcomeDate: resolution.outcomeDate,
    outcomeNotes: resolution.outcome === 'overturned'
      ? 'Appeal approved. Claim will be reprocessed for payment.'
      : 'Appeal denied. Original denial reason upheld.',
  }
}

/**
 * Get statistics for a set of appeals
 */
export function calculateAppealStats(appeals: GeneratedAppeal[]): {
  total: number
  pending: number
  overturned: number
  upheld: number
  overturnRate: number
} {
  const total = appeals.length
  let pending = 0
  let overturned = 0
  let upheld = 0

  for (const appeal of appeals) {
    if (appeal.appeal.appealOutcome === 'pending') {
      pending++
    } else if (appeal.appeal.appealOutcome === 'overturned' || appeal.scheduledResolution?.outcome === 'overturned') {
      overturned++
    } else {
      upheld++
    }
  }

  const resolved = overturned + upheld
  const overturnRate = resolved > 0 ? overturned / resolved : 0

  return {
    total,
    pending,
    overturned,
    upheld,
    overturnRate,
  }
}
