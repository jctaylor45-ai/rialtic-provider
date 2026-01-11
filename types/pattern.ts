/**
 * Pattern/Insight types (Provider Portal specific)
 * Aligned with console-ui @rialtic/types patterns
 */
import type { ProcessedClaim } from './claim'

export type PatternCategory =
  | 'modifier-missing'
  | 'code-mismatch'
  | 'documentation'
  | 'authorization'
  | 'billing-error'
  | 'timing'
  | 'coding-specificity'
  | 'medical-necessity'

export type PatternStatus = 'active' | 'improving' | 'resolved' | 'archived'

export type PatternTier = 'critical' | 'high' | 'medium' | 'low'

export interface Pattern {
  id: string
  title: string
  description?: string
  category: PatternCategory
  status: PatternStatus
  tier: PatternTier

  // Score metrics
  scoreFrequency: number
  scoreImpact: number
  scoreTrend: 'up' | 'down' | 'stable'
  scoreVelocity: number
  scoreConfidence: number
  scoreRecency: number

  // Financial metrics
  avgDenialAmount: number
  totalAtRisk: number

  // Learning metrics
  learningProgress: number
  practiceSessionsCompleted: number
  correctionsApplied: number

  // Guidance
  suggestedAction?: string

  // Baseline period metrics
  baselineStart?: string
  baselineEnd?: string
  baselineClaimCount?: number
  baselineDeniedCount?: number
  baselineDenialRate?: number
  baselineDollarsDenied?: number

  // Current period metrics
  currentStart?: string
  currentEnd?: string
  currentClaimCount?: number
  currentDeniedCount?: number
  currentDenialRate?: number
  currentDollarsDenied?: number

  // Timestamps
  firstDetected?: string
  lastSeen?: string
  lastUpdated?: string

  // Related data
  relatedPolicies?: Array<{
    policyId: string
    policyName: string
    policyMode?: string
    fixGuidance?: string
    commonMistake?: string
    logicType?: string
  }>
  affectedClaims?: string[]
  relatedCodes?: string[]
}

// Learning Marker Types
export interface LearningMarker {
  id: string
  timestamp: string
  userId: string
  type: 'policy_learned' | 'claim_corrected' | 'insight_applied'
  category: string
  description: string
  originalClaim?: ProcessedClaim
  correctedClaim?: ProcessedClaim
  changes?: string[]
  notes?: string
  simulationResult?: {
    outcome: string
    editsPassed: number
    editsFailed: number
    estimatedPayment: number
  }
  policyId?: string
  insightId?: string
}

// Legacy type alias
/** @deprecated Use Pattern instead */
export interface Insight {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  category: string
  frequency: number
  impact: number
  trend: 'up' | 'down' | 'stable'
  affectedClaims: number
  avgDenialAmount: number
  learningProgress: number
  example: {
    claimId: string
    patient: string
    issue: string
  }
  suggestedAction: string
  relatedPolicies: string[]
  dismissed?: boolean
}
