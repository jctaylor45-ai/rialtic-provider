/**
 * Scenario Type Definitions for Mock Data Generation
 *
 * These types define the structure of scenario files used to generate
 * consistent, interconnected mock data for the Provider Portal.
 */

// =============================================================================
// TIMELINE TYPES
// =============================================================================

export interface TimelineDefinition {
  /** ISO date string for scenario start */
  startDate: string
  /** ISO date string for scenario end */
  endDate: string
  /** Total days in the scenario */
  periodDays: number
  /** Key events that occurred during the timeline */
  keyEvents: KeyEvent[]
}

export interface KeyEvent {
  date: string
  type: 'training' | 'system_update' | 'staff_meeting' | 'audit' | 'policy_change'
  description: string
  impactedPatterns?: string[]
}

// =============================================================================
// PRACTICE & PROVIDER TYPES
// =============================================================================

export interface PracticeDefinition {
  id: string
  name: string
  taxId: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  providers: ProviderDefinition[]
}

export interface ProviderDefinition {
  id: string
  name: string
  npi: string
  specialty: SpecialtyType
  taxonomy: string
  /** Weight for claim distribution (default 1.0) */
  claimWeight?: number
}

export type SpecialtyType =
  | 'Orthopedic Surgery'
  | 'Sports Medicine'
  | 'Physical Therapy'
  | 'Pain Management'
  | 'Internal Medicine'
  | 'Family Medicine'
  | 'Cardiology'
  | 'General Practice'
  | 'Neurology'
  | 'Rheumatology'

// =============================================================================
// VOLUME & DISTRIBUTION TYPES
// =============================================================================

export interface VolumeDefinition {
  /** Total claims to generate */
  totalClaims: number
  /** Claims per month variation (month key -> multiplier) */
  monthlyVariation: Record<string, number>
  /** Range of line items per claim */
  claimLinesPerClaim: {
    min: number
    max: number
  }
  /** Billed amount ranges by claim type */
  claimValueRanges: {
    low: { min: number; max: number }
    medium: { min: number; max: number }
    high: { min: number; max: number }
  }
}

// =============================================================================
// PATTERN TYPES
// =============================================================================

export interface PatternDefinition {
  id: string
  title: string
  description: string
  category: PatternCategory
  status: PatternStatus
  tier: PatternTier

  /** Procedure codes affected by this pattern */
  procedureCodes: string[]

  /** Policies that trigger for this pattern */
  policies: PolicyReference[]

  /** Denial reason text for claims */
  denialReason: string

  /** Claim distribution targets */
  claimDistribution: ClaimDistribution

  /** Trajectory from baseline to current */
  trajectory: PatternTrajectory

  /** User engagement metrics */
  engagement: PatternEngagement

  /** Remediation guidance */
  remediation: RemediationInfo
}

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

export interface PolicyReference {
  id: string
  /** Percentage of pattern claims this policy triggers on (0-1) */
  triggerRate?: number
}

export interface ClaimDistribution {
  /** Total claims related to this pattern (denied + approved) */
  total: number
  /** Denied claims in baseline period */
  deniedBaseline: number
  /** Denied claims in current period */
  deniedCurrent: number
  /** Number of appeals filed */
  appealsFiled: number
  /** Number of appeals overturned */
  appealsOverturned: number
}

export interface PatternTrajectory {
  /** Shape of the improvement curve */
  curve: TrajectoryCurve
  /** Baseline period metrics */
  baseline: PeriodMetrics
  /** Current period metrics */
  current: PeriodMetrics
  /** Monthly snapshots for trend charts */
  snapshots: MonthlySnapshot[]
}

export type TrajectoryCurve =
  | 'steep_improvement'  // 80% improvement in first 40% of time
  | 'gradual_improvement' // Linear improvement
  | 'slight_improvement'  // Small improvement
  | 'stable'              // No change
  | 'flat'                // Alias for stable
  | 'regression'          // Getting worse

export interface PeriodMetrics {
  periodStart: string
  periodEnd: string
  claimCount: number
  deniedCount: number
  denialRate: number
  dollarsDenied: number
}

export interface MonthlySnapshot {
  /** Month in YYYY-MM format */
  month: string
  denialRate: number
  dollarsDenied: number
  claimCount?: number
  deniedCount?: number
}

export interface PatternEngagement {
  /** Date pattern was first viewed */
  firstViewedDate: string
  /** Total times pattern has been viewed */
  totalViews: number
  /** Number of Claim Lab tests run */
  claimLabTests: number
  /** Number of claims exported */
  claimsExported: number
  /** Actions recorded by user */
  actionsRecorded: RecordedAction[]
}

export interface RecordedAction {
  id: string
  date: string
  type: ActionType
  notes?: string
}

export type ActionType =
  | 'resubmission'
  | 'workflow-update'
  | 'staff-training'
  | 'system-config'
  | 'practice-change'
  | 'other'

export interface RemediationInfo {
  shortTerm: {
    description: string
    canResubmit: boolean
    claimCount: number
    amount: number
  }
  longTerm: {
    description: string
    steps: string[]
  }
}

// =============================================================================
// LEARNING EVENTS TYPES
// =============================================================================

export interface LearningEventsDefinition {
  /** Event counts by type */
  eventDistribution: Record<string, number>
  /** Dates when events cluster (pattern ID -> dates) */
  eventClustering: Record<string, string[]>
}

// =============================================================================
// TARGET METRICS TYPES
// =============================================================================

export interface TargetMetrics {
  totalClaims: number
  totalDenied: number
  overallDenialRate: number
  totalDollarsDenied: number
  totalAppeals: number
  appealSuccessRate: number
}

// =============================================================================
// MAIN SCENARIO DEFINITION
// =============================================================================

export interface ScenarioDefinition {
  /** Unique scenario identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description of the scenario */
  description: string
  /** Timeline configuration */
  timeline: TimelineDefinition
  /** Practice and provider setup */
  practice: PracticeDefinition
  /** Volume and distribution settings */
  volume: VolumeDefinition
  /** Pattern definitions */
  patterns: PatternDefinition[]
  /** Learning events configuration */
  learningEvents: LearningEventsDefinition
  /** Expected aggregate metrics for validation */
  targetMetrics: TargetMetrics
}

// =============================================================================
// GENERATION HELPER TYPES
// =============================================================================

export interface MonthRange {
  key: string  // YYYY-MM format
  start: Date
  end: Date
}

export interface GeneratedClaimSummary {
  id: string
  status: 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'
  billedAmount: number
  month: string
  patternId?: string
  providerId: string
  dateOfService: string
}

export interface PatientData {
  name: string
  dob: string
  sex: 'male' | 'female' | 'unknown'
  memberId: string
}

export interface ValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'referential' | 'aggregate' | 'timeline' | 'schema'
  entity: string
  field: string
  message: string
  expected?: number | string
  actual?: number | string
}

export interface ValidationWarning {
  type: string
  message: string
}

// =============================================================================
// POLICY LIBRARY TYPES
// =============================================================================

export interface PolicyDefinition {
  id: string
  name: string
  mode: 'Edit' | 'Informational' | 'Pay & Advise'
  description: string
  clinicalRationale?: string
  topic: string
  primaryLogicType: string
  source: string
  procedureCodes?: string[]
  diagnosisCodes?: string[]
  modifiers?: string[]
  commonMistake: string
  fixGuidance: string
  referenceDocs?: Array<{
    title: string
    url: string
    source: string
  }>
}
