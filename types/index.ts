/**
 * PaAPI-Compatible Types for Provider Portal
 *
 * These types are aligned with console-ui's ProcessedClaim format
 * to enable direct connection to PaAPI backend without transformation.
 */

// =============================================================================
// COMMON TYPES (FHIR-like structures)
// =============================================================================

export interface Money {
  value: number
  currency: string
}

export interface Period {
  start?: string
  end?: string
}

export interface Coding {
  code: string
  system?: string
  display?: string
}

export interface CodeableConcept {
  coding: Coding[]
  text?: string
}

export interface Quantity {
  value: number
  unit?: string
}

export interface PractitionerIdentifiers {
  npi?: string | null
  ein?: string | null
}

export interface Practitioner {
  id?: string
  resourceType?: string
  name?: {
    family?: string
    given?: string[]
  }
  identifiers?: PractitionerIdentifiers
  renderingProviderId?: string | null
}

export interface PractitionerRole {
  id?: string
  resourceType?: string
  practitioner?: Practitioner
  specialty?: CodeableConcept[]
}

export interface CareTeamMember {
  sequence: number
  role: CodeableConcept
  provider?: PractitionerRole
}

export interface RenderingProvider extends CareTeamMember {
  identifiers?: PractitionerIdentifiers
}

// =============================================================================
// DIAGNOSIS TYPES
// =============================================================================

export interface DiagnosisCode {
  codeableConcept: string
  sequence: number
  type: string
  error?: string
}

export interface Diagnosis {
  sequence: number
  diagnosisCodeableConcept: CodeableConcept
  type?: CodeableConcept[]
}

// =============================================================================
// CLAIM LINE TYPES
// =============================================================================

export interface ClaimLineInsight {
  id: string
  insight_score?: number
  insight: {
    insight: {
      claimLineSequenceNum: number
      policyId?: string
      editTypeId?: string
      paapi_policy_name?: string
      historyInfo?: HistoryInfo[]
    }
  }
  excluded_by?: string[]
}

export interface ProcessedInsight extends ClaimLineInsight {
  editType: EditType | null
  hasInfluencingClaims: boolean
  influencingClaims: HistoryInfo[]
  hasPolicy: boolean
  policyId: string | null
  policyName: string
  policyTopic: PolicyTopic | null
  policyEditTypes: PolicyEditType[]
}

export interface HistoryInfo {
  claimId: string
  lines?: Array<{
    sequence: number
    exit?: boolean
  }>
}

export interface EditType {
  edit_type_id: string
  edit_type: string
}

export interface PolicyEditType {
  edit_type_id: string
  edit_type: string
}

export interface PolicyTopic {
  id: string
  name: string
}

export interface ClaimLineAdditionalDetails {
  [key: string]: unknown
}

export interface ClaimLine {
  // Sequence/Line number
  sequence: number
  lineNumber: number

  // Service period
  servicedPeriod?: Period

  // Procedure code (FHIR productOrService)
  productOrService: CodeableConcept

  // Modifiers
  modifier?: CodeableConcept[]
  modifierCodes?: string[]

  // Location/Place of Service
  locationCodeableConcept?: CodeableConcept

  // Quantity and amounts
  quantity: Quantity
  net: Money

  // Diagnosis
  diagnosis1: DiagnosisCode
  diagnosisAdditional: DiagnosisCode[]
  diagnosisSequence: Diagnosis[]

  // NDC code
  ndcCode: string | null

  // Rendering provider
  renderingProvider: RenderingProvider
  renderingProviderIdentifiers?: PractitionerIdentifiers | null
  providerTaxonomyCodes?: string

  // Care team
  careTeamSequence: CareTeamMember[]

  // Additional details
  additionalDetails: ClaimLineAdditionalDetails
  billingName?: string

  // Type of bill (institutional claims)
  typeOfBill?: string | null

  // Detail items (for NDC codes, etc.)
  detail?: Array<{
    productOrService?: CodeableConcept
  }>
}

export interface ClaimLineWithInsights extends ClaimLine {
  excludedCount: number
  hasInsights: boolean
  hasInsightScore: boolean
  insights: ProcessedInsight[]
}

// =============================================================================
// CLAIM TYPES
// =============================================================================

export interface ClaimWarning {
  message: string
  data?: Record<string, unknown>
  type: string
}

export interface ClaimAdditionalDetails {
  [key: string]: unknown
}

export interface Insurance {
  sequence: number
  focal: boolean
  coverage: {
    id?: string
    subscriberId?: string
    class?: Array<{
      type: { text: string }
      value: string
    }>
  }
  claimResponse?: {
    id?: string
    addItem?: Array<{
      itemSequence: number[]
      extension?: unknown[]
    }>
    extension?: unknown[]
  } | null
  preAuthRef?: string[]
}

export interface Patient {
  id?: string
  resourceType?: string
  name?: Array<{
    family?: string
    given?: string[]
  }>
  birthDate?: string
  gender?: string
}

export interface ClaimChain {
  [key: string]: unknown
}

export interface ProcessedClaim {
  id: string

  // Claim type
  type: string  // 'professional', 'institutional', 'outpatient', 'inpatient', etc.
  formType: 'institutional' | 'professional'

  // Amounts
  total: Money

  // Dates
  billablePeriod?: Period
  servicedPeriod?: Period
  created?: string

  // Provider info
  provider: PractitionerRole
  billingProviderIdentifiers: PractitionerIdentifiers | null

  // Patient info
  patient: Patient
  patientName: string | null

  // Member/Subscriber info
  subscriberId: string | null
  memberGroupId: string | null

  // Care team
  careTeam: CareTeamMember[]

  // Claim lines
  claimLines?: ClaimLine[]

  // Diagnosis codes (header level)
  diagnosisCodes: DiagnosisCode[]
  principalDiagnosisCode: string | null
  diagnosis?: Diagnosis[]

  // Insurance
  insurance: Insurance[]

  // Type of bill (institutional claims)
  typeOfBill: string | null
  subType?: CodeableConcept

  // Additional details & warnings
  additionalDetails: ClaimAdditionalDetails
  warnings?: ClaimWarning[]

  // Extensions
  extension?: unknown[]
}

export interface ProcessedClaimWithInsights extends ProcessedClaim {
  claimLines: ClaimLineWithInsights[]

  // Received date
  c_received_date?: string

  // Request ID
  rid?: string

  // Policies that apply to this claim
  policies?: Policy[]

  // Insights at claim level
  insights?: ProcessedInsight[]

  // Claim chain (related claims)
  claimChain?: ClaimChain
}

// =============================================================================
// POLICY TYPES (PaAPI Compatible)
// =============================================================================

export interface PolicyReferenceDocument {
  is_primary: boolean
  excerpt: string
  title: string | null
  upcoming_change: string | null
  type: string | null
  url?: string
  source?: string
}

export interface PolicyDetails {
  geography: string[]
  specialty_codes: string[]
  cpt_codes: string[]
  hcpcs_codes: string[]
  insight_type: string[]
  logic_type_primary: string
  logic_type_supporting: string
  claim_type: string[]
  ref_documents: PolicyReferenceDocument[]
  revenue_codes: string[]
  type_of_bill_codes: string[]
}

export type InsightMode = 'Active' | 'Inactive' | 'Inspection' | 'Observation' | 'Stealth'

export interface ConnectorInsightMode {
  connector_id: string
  insight_mode: InsightMode
}

export interface Policy {
  id: string
  name: string
  description?: string
  clinical_rationale?: string

  // Topic
  topic?: PolicyTopic

  // Edit types
  edit_types?: PolicyEditType[]

  // Connector insight modes (replaces simple 'mode')
  connector_insight_mode?: ConnectorInsightMode[]

  // Policy details
  policy_details?: PolicyDetails

  // Metrics (Provider Portal specific, may not exist in PaAPI)
  hit_rate?: number
  denial_rate?: number
  appeal_rate?: number
  overturn_rate?: number
  impact?: number
  insight_count?: number
  providers_impacted?: number
  trend?: 'up' | 'down' | 'stable'

  // Guidance (Provider Portal specific)
  common_mistake?: string
  fix_guidance?: string

  // Age restrictions
  age_restrictions?: {
    min?: number
    max?: number
  }

  // Frequency limits
  frequency_limits?: {
    count: number
    period: string
  }

  // Learning tracking (Provider Portal specific)
  learning_markers_count?: number
  recent_tests?: number

  // Dates
  effective_date?: string
  created_at?: string
}

// =============================================================================
// PATTERN/INSIGHT TYPES (Provider Portal specific)
// =============================================================================

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

// =============================================================================
// LEARNING MARKER TYPES (Provider Portal specific)
// =============================================================================

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

// =============================================================================
// PROVIDER TYPES
// =============================================================================

export interface Provider {
  id: string
  name: string
  specialty?: string
  npi?: string
  tin?: string
  taxonomy?: string
}

// =============================================================================
// LEGACY TYPE ALIASES (for backward compatibility during migration)
// =============================================================================

/** @deprecated Use ProcessedClaim instead */
export type Claim = ProcessedClaim

/** @deprecated Use ClaimLineWithInsights instead */
export type LineItem = ClaimLineWithInsights

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

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ClaimsListResponse {
  data: ProcessedClaim[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ClaimDetailResponse extends ProcessedClaimWithInsights {}

export interface PoliciesListResponse {
  data: Policy[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface PatternsListResponse {
  data: Pattern[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// =============================================================================
// PAAPI ERROR & RESPONSE TYPES
// =============================================================================

/**
 * Standardized PaAPI error response format
 */
export interface PaapiErrorResponse {
  code: string
  message: string
  details?: unknown
  timestamp?: string
  requestId?: string
}

/**
 * PaAPI validation error details
 */
export interface PaapiValidationError {
  field: string
  message: string
  code: string
}

/**
 * Wrapper for PaAPI responses that may contain errors
 */
export interface PaapiResponse<T> {
  success: boolean
  data?: T
  error?: PaapiErrorResponse
  meta?: {
    requestId?: string
    duration?: number
    cached?: boolean
  }
}

// =============================================================================
// PAAPI SUMMARY & METRICS RESPONSE TYPES
// =============================================================================

export interface ClaimsSummaryResponse {
  totalClaims: number
  statusBreakdown: {
    approved: number
    denied: number
    pending: number
    appealed: number
  }
  denialRate: number
  financial: {
    billedAmount: number
    paidAmount: number
    deniedAmount: number
    collectionRate: number
  }
  appeals: {
    total: number
    overturned: number
    successRate: number
  }
  period: {
    days: number
    startDate: string
    endDate: string
  }
}

export interface InsightsResponse {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  denialAnalysis: {
    byCategory: Array<{
      category: string
      count: number
      impact: number
    }>
    topReasons: Array<{
      reason: string
      count: number
      amount: number
    }>
    revenueAtRisk: number
  }
  appeals: {
    total: number
    overturned: number
    upheld: number
    pending: number
    successRate: number
  }
  criticalPatterns: Array<{
    id: string
    title: string
    category: string
    tier: string
    totalAtRisk: number
    currentClaimCount: number
    currentDenialRate: number
  }>
  weeklyTrends: Array<{
    week: string
    total: number
    denied: number
    approved: number
    denialRate: number
    totalBilled: number
    totalPaid: number
  }>
  learningEngagement: Record<string, number>
}

export interface ProviderWithStats {
  id: string
  name: string
  specialty: string | null
  npi: string | null
  tin: string | null
  taxonomy: string | null
  createdAt: string | null
  statistics: {
    totalClaims: number
    totalBilled: number
    totalPaid: number
    deniedClaims: number
    denialRate: number
  }
}

export interface ProvidersListResponse {
  data: ProviderWithStats[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface DashboardKPIs {
  totalClaims: number
  denialRate: number
  appealSuccessRate: number
  avgDaysToPayment: number
  totalBilledAmount: number
  totalPaidAmount: number
  collectionRate: number
  activePatterns: number
  criticalPatterns: number
  learningProgress: number
}

export interface AnalyticsDashboardResponse {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  kpis: DashboardKPIs
  generatedAt: string
}

// =============================================================================
// ADAPTER CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration for FHIR code systems used in adapters
 */
export interface FHIRCodeSystemConfig {
  /** Provider taxonomy system URL */
  providerTaxonomy: string
  /** Diagnosis code system URL (ICD-10) */
  diagnosisSystem: string
  /** Procedure code system URL (CPT/HCPCS) */
  procedureSystem: string
  /** Care team role code system URL */
  careTeamRoleSystem: string
  /** Claim type code system URL */
  claimTypeSystem: string
  /** Insurance type code system URL */
  insuranceTypeSystem: string
}

/**
 * Configuration for claim adapter behavior
 */
export interface ClaimAdapterConfig {
  /** FHIR code system URLs */
  codeSystems: FHIRCodeSystemConfig
  /** Default connector ID when not specified */
  defaultConnectorId: string
  /** Default currency for Money types */
  defaultCurrency: string
  /** Whether to include empty optional fields */
  includeEmptyFields: boolean
}

/**
 * Policy mode mapping configuration
 */
export interface PolicyModeMapping {
  /** Local mode name -> PaAPI mode name */
  [localMode: string]: string
}

/**
 * Configuration for policy adapter behavior
 */
export interface PolicyAdapterConfig {
  /** Mode mappings from local to PaAPI format */
  modeMappings: PolicyModeMapping
  /** Default connector ID when not specified */
  defaultConnectorId: string
  /** Whether to validate CPT/HCPCS codes */
  validateProcedureCodes: boolean
}
