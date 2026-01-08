/**
 * Enhanced type definitions for Provider Portal learning and pattern detection
 */

// ============================================================================
// PATTERN DETECTION TYPES
// ============================================================================

export type PatternStatus = 'active' | 'improving' | 'resolved' | 'archived'
export type PatternTier = 'critical' | 'high' | 'medium' | 'low'
export type PatternCategory =
  | 'modifier-missing'
  | 'code-mismatch'
  | 'documentation'
  | 'authorization'
  | 'billing-error'
  | 'timing'
  | 'coding-specificity'
  | 'medical-necessity'

// Action categories for root cause classification
export type ActionCategory =
  | 'coding_knowledge'      // Staff needs training on coding rules
  | 'documentation'         // Documentation gaps or issues
  | 'operational_system'    // Process or system configuration issues
  | 'coverage_blindspot'    // Coverage limitations not well understood
  | 'payer_specific'        // Payer-specific rules or quirks

// Recovery status for pattern impact assessment
export type RecoveryStatus =
  | 'recoverable'           // Can be recovered through appeals/resubmission
  | 'partial'               // Partial recovery possible
  | 'not_recoverable'       // Cannot be recovered (timely filing, etc.)

export interface PossibleRootCause {
  id: string
  description: string
  likelihood: 'high' | 'medium' | 'low'
  category: ActionCategory
}

export interface ShortTermAction {
  id: string
  action: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: string    // e.g., "Recover $12,500"
  timeframe: string          // e.g., "This week", "Next 30 days"
}

export interface LongTermAction {
  id: string
  action: string
  category: ActionCategory
  expectedOutcome: string
  implementationNotes?: string
}

export interface PatternEvidence {
  claimId: string
  denialDate: string
  denialReason: string
  billedAmount: number
  procedureCode?: string
  modifier?: string
  diagnosisCode?: string
}

export interface PatternScore {
  frequency: number        // How often this pattern occurs
  impact: number          // Total $ amount at risk
  trend: 'up' | 'down' | 'stable'  // Is it getting worse or better?
  velocity: number        // Rate of change (claims/month)
  confidence: number      // AI confidence 0-100
  recency: number         // Days since last occurrence
}

export interface PatternImprovement {
  date: string
  metric: 'frequency' | 'impact' | 'resolutionRate'
  before: number
  after: number
  percentChange: number
  trigger?: string  // What caused improvement (e.g., "practice-session", "insight-dismissed")
}

export type ActionType =
  | 'resubmission'           // Updated claims in RCM for resubmission
  | 'workflow-update'        // Created/updated SOP or workflow
  | 'staff-training'         // Conducted staff training or meeting
  | 'system-config'          // Updated system configuration
  | 'practice-change'        // Changed clinical/billing practice
  | 'other'                  // Other action

export interface PatternAction {
  id: string
  timestamp: string
  actionType: ActionType
  notes?: string
  userId?: string  // For future multi-user support
}

export interface Pattern {
  id: string
  title: string
  description: string
  category: PatternCategory
  status: PatternStatus
  tier: PatternTier

  // Metrics
  score: PatternScore
  avgDenialAmount: number
  totalAtRisk: number

  // Evidence
  affectedClaims: string[]  // Claim IDs
  evidence: PatternEvidence[]
  firstDetected: string
  lastSeen: string

  // Learning
  learningProgress: number  // 0-100
  practiceSessionsCompleted: number
  correctionsApplied: number

  // Improvement tracking
  improvements: PatternImprovement[]

  // Action tracking
  actions: PatternAction[]

  // Actionable insights
  suggestedAction: string
  relatedPolicies: string[]
  relatedCodes?: string[]

  // Root cause analysis
  actionCategory: ActionCategory
  recoveryStatus: RecoveryStatus
  possibleRootCauses: PossibleRootCause[]

  // Recommended actions
  shortTermActions: ShortTermAction[]
  longTermActions: LongTermAction[]

  // AI metadata
  detectionConfidence: number
  lastUpdated: string
}

// ============================================================================
// LEARNING EVENT TYPES
// ============================================================================

export type EventType =
  | 'claim-submitted'
  | 'claim-reviewed'
  | 'insight-viewed'
  | 'insight-dismissed'
  | 'pattern-identified'
  | 'practice-started'
  | 'practice-completed'
  | 'correction-applied'
  | 'code-lookup'
  | 'policy-viewed'
  | 'dashboard-viewed'
  | 'dashboard-click'  // User clicked an element on the dashboard
  | 'action-recorded'  // User marked action taken on a pattern
  | 'code-intel-viewed'  // User viewed code intelligence modal

export type EventContext = 'dashboard' | 'claims' | 'insights' | 'claim-lab' | 'impact' | 'policies'

export interface EventMetadata {
  // Common fields
  duration?: number  // milliseconds
  success?: boolean

  // Claim-specific
  claimId?: string
  claimStatus?: string
  billedAmount?: number

  // Pattern-specific
  patternId?: string
  patternCategory?: PatternCategory

  // Practice-specific
  practiceType?: 'guided' | 'free-form'
  correctionsCount?: number

  // Code lookup
  procedureCode?: string
  codeCategory?: string

  // Policy-specific
  policyId?: string
  policyMode?: string

  // Navigation
  fromPage?: string
  toPage?: string

  // User interaction
  action?: string
  value?: string | number

  // Action recording
  actionType?: ActionType
  actionNotes?: string
}

export interface LearningEvent {
  id: string
  timestamp: string
  type: EventType
  context: EventContext
  userId?: string  // For future multi-user support

  metadata: EventMetadata

  // Analytics
  sessionId?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
}

// ============================================================================
// ROI & IMPACT TYPES
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

export interface MetricTrend {
  current: number
  previous: number
  change: number
  percentChange: number
  trend: 'up' | 'down' | 'stable'
  sparkline?: TimeSeriesDataPoint[]
}

export interface PracticeROI {
  // Overall metrics
  totalPracticeSessions: number
  totalCorrectionsApplied: number
  totalTimeInvested: number  // minutes

  // Financial impact
  estimatedSavings: number
  avoidedDenials: number
  improvedApprovalRate: number

  // Learning metrics
  patternsResolved: number
  patternsImproving: number
  avgCorrectionRate: number

  // Time series
  savingsOverTime: TimeSeriesDataPoint[]
  denialRateOverTime: TimeSeriesDataPoint[]
  practiceActivityOverTime: TimeSeriesDataPoint[]

  // Breakdown by pattern
  patternImpact: {
    patternId: string
    patternTitle: string
    category: PatternCategory
    denialsBefore: number
    denialsAfter: number
    savingsRealized: number
    lastPracticed: string
  }[]

  // Engagement metrics
  avgSessionDuration: number
  mostPracticedPatterns: string[]
  streakDays: number
  lastActivityDate: string
}

// ============================================================================
// CODE INTELLIGENCE TYPES
// ============================================================================

export interface CodeModifier {
  code: string
  description: string
  usage: string
  required?: boolean
  billable?: boolean
}

export interface PayerRule {
  payerId: string
  payerName: string
  rule: string
  effectiveDate: string
  frequencyLimit?: string
  authRequired?: boolean
  modifierRequirements?: string[]
}

export interface CodeUsageHistory {
  month: string
  submissions: number
  approvals: number
  denials: number
  avgReimbursement: number
  commonDenialReasons: string[]
}

export interface RelatedCode {
  code: string
  description: string
  relationship: 'bundle' | 'alternative' | 'add-on' | 'prerequisite'
  note?: string
}

export interface ProcedureCodeIntelligence {
  code: string
  description: string
  category: string

  // Requirements
  typicalDiagnosisCodes: string[]
  requiredModifiers: CodeModifier[]
  optionalModifiers: CodeModifier[]
  documentationRequirements: string[]

  // Payer rules
  payerRules: PayerRule[]

  // Historical performance
  usageHistory: CodeUsageHistory[]
  yourApprovalRate: number
  nationalApprovalRate?: number
  avgReimbursement: number

  // Intelligence
  commonDenialReasons: string[]
  bestPractices: string[]
  relatedCodes: RelatedCode[]

  // Alerts
  recentPolicyChanges?: string[]
  warnings?: string[]

  lastUpdated: string
}

// ============================================================================
// ENHANCED CLAIM TYPES
// ============================================================================

export interface ClaimPatternMatch {
  patternId: string
  patternTitle: string
  matchConfidence: number
  suggestedFix?: string
}

export interface ClaimRiskScore {
  overall: number  // 0-100
  factors: {
    codeComplexity: number
    documentationGap: number
    policyMismatch: number
    historicalDenialRate: number
  }
  warnings: string[]
}

// ============================================================================
// DASHBOARD METRICS TYPES
// ============================================================================

export interface DashboardMetrics {
  // Claims overview
  totalClaims: number
  approvalRate: number
  denialRate: number
  pendingClaims: number

  // Financial
  totalBilled: number
  totalPaid: number
  totalDenied: number
  estimatedRecoverable: number

  // Learning impact
  patternsDetected: number
  patternsResolved: number
  learningEvents: number
  practiceSessions: number

  // Trends (vs previous period)
  trends: {
    approvalRate: MetricTrend
    denialRate: MetricTrend
    avgReimbursement: MetricTrend
    practiceSessions: MetricTrend
  }
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface PatternFilters {
  status?: PatternStatus[]
  tier?: PatternTier[]
  category?: PatternCategory[]
  actionCategory?: ActionCategory[]
  recoveryStatus?: RecoveryStatus[]
  minImpact?: number
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface EventFilters {
  type?: EventType[]
  context?: EventContext[]
  dateRange?: {
    start: string
    end: string
  }
  patternId?: string
  claimId?: string
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface PatternDetailView {
  pattern: Pattern
  relatedClaims: any[]  // Will use Claim type from main types
  relatedPolicies: any[]  // Will use Policy type from main types
  improvementChart: TimeSeriesDataPoint[]
  suggestions: string[]
}

export interface ClaimLabEnhanced {
  claimId?: string
  originalClaim?: any  // Will use Claim type
  editedClaim?: any
  detectedPatterns: ClaimPatternMatch[]
  riskScore?: ClaimRiskScore
  codeIntelligence: Map<string, ProcedureCodeIntelligence>
  simulationResult?: {
    predicted: 'approved' | 'denied' | 'pending'
    confidence: number
    estimatedPayment: number
    warnings: string[]
  }
}
