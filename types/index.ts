// Core data types for the Provider Portal

export interface Claim {
  id: string
  providerId: string

  // Claim type
  claimType?: 'Professional' | 'Institutional' | 'Dental' | 'Pharmacy'

  // Patient info
  patientName: string
  patientDOB?: string
  patientSex?: 'male' | 'female' | 'unknown'
  memberId?: string
  memberGroupId?: string

  // Service dates
  dateOfService: string
  dateOfServiceEnd?: string  // For date ranges

  // Codes
  procedureCodes?: string[]
  procedureCode?: string
  diagnosisCodes?: string[]
  modifiers?: string[]

  // Billing
  billedAmount: number
  paidAmount?: number

  // Billing provider info
  providerName?: string
  billingProviderTIN?: string
  billingProviderNPI?: string
  billingProviderTaxonomy?: string
  specialtyCodes?: string[]

  // Authorization & indicators
  priorAuthNumber?: string
  ltssIndicator?: boolean
  parIndicator?: boolean

  // Status
  status: 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'
  denialReason?: string
  policyId?: string
  policyIds?: string[]
  appealStatus?: string | null
  appealDate?: string

  // Dates
  submissionDate?: string
  submittedDate?: string
  processingDate?: string
  processedDate?: string
  statusDate?: string

  // Line items
  lineItems?: LineItem[]

  // AI
  aiInsight?: {
    explanation: string
    guidance: string
  }
}

export interface LineItem {
  lineNumber: number

  // Service dates
  dateOfService?: string
  dateOfServiceEnd?: string

  // Codes
  procedureCode: string
  ndcCode?: string
  modifiers?: string[]
  diagnosisCodes?: string[]
  placeOfService?: string

  // Quantities and amounts
  units: number
  unitsType?: string  // "UN" for units, "MJ" for minutes, etc.
  billedAmount: number
  paidAmount: number

  // Rendering provider
  renderingProviderName?: string
  renderingProviderNPI?: string
  renderingProviderTaxonomy?: string

  // Indicators
  parIndicator?: boolean
  bypassCode?: string

  // Status
  status: string
  editsFired?: string[]
  policiesTriggered?: string[]

  // Policies from API (full details from claim_line_policies join)
  policies?: Array<{
    policyId: string
    policyName: string
    policyMode: string
    triggeredAt?: string
    isDenied?: boolean
    deniedAmount?: number
    denialReason?: string
  }>
}

export interface Policy {
  id: string
  name: string
  mode: 'Edit' | 'Informational' | 'Pay & Advise'
  effectiveDate: string
  description: string
  clinicalRationale: string
  topic: string
  logicType: string
  source: string
  hitRate: number
  denialRate: number
  appealRate: number
  overturnRate: number
  impact: number
  insightCount: number
  providersImpacted: number
  trend: 'up' | 'down' | 'stable'
  procedureCodes: string[]
  diagnosisCodes?: string[]
  modifiers?: string[]
  placeOfService?: string[]
  ageRestrictions?: {
    min?: number
    max?: number
  }
  frequencyLimits?: {
    count: number
    period: string
  }
  commonMistake: string
  fixGuidance: string
  referenceDocs: Array<{
    title: string
    url: string
    source: string
  }>
  relatedPolicies: string[]
  learningMarkersCount: number
  recentTests: number

  // Geography - regions where policy applies
  geography?: {
    regions: string[]
    states?: string[]
    jurisdictions?: string[]
  }

  // Applicable claim types
  applicableClaimTypes?: ('Professional' | 'Institutional' | 'Dental' | 'Pharmacy')[]

  // CARC/RARC codes
  carcCodes?: CARCCode[]
  rarcCodes?: RARCCode[]

  // Specialty codes
  specialtyCodes?: SpecialtyCode[]
}

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

export interface LearningMarker {
  id: string
  timestamp: string
  userId: string
  type: 'policy_learned' | 'claim_corrected' | 'insight_applied'
  category: string
  description: string
  originalClaim?: Claim
  correctedClaim?: Claim
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

export interface Provider {
  id: string
  name: string
  specialty: string
  npi: string
}

// CARC/RARC and Specialty Code types for Policy
export interface CARCCode {
  code: string
  description: string
}

export interface RARCCode {
  code: string
  description: string
}

export interface SpecialtyCode {
  code: string
  description: string
  cmsCategory?: string
}
