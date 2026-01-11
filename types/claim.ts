/**
 * Claim types (PaAPI Compatible)
 * Aligned with console-ui @rialtic/types patterns
 */
import type {
  Money,
  Period,
  CodeableConcept,
  Quantity,
  DiagnosisCode,
  Diagnosis,
  Patient,
  Insurance,
  PractitionerRole,
  PractitionerIdentifiers,
  CareTeamMember,
  RenderingProvider,
} from './common'
import type { Policy, PolicyTopic, PolicyEditType } from './policy'

// Claim Line Insight Types
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

// Claim Line Types
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

// Claim Types
export interface ClaimWarning {
  message: string
  data?: Record<string, unknown>
  type: string
}

export interface ClaimAdditionalDetails {
  [key: string]: unknown
}

export interface ClaimChain {
  [key: string]: unknown
}

export interface ProcessedClaim {
  id: string

  // Claim type
  type: string // 'professional', 'institutional', 'outpatient', 'inpatient', etc.
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

// Legacy type alias
/** @deprecated Use ProcessedClaim instead */
export type Claim = ProcessedClaim

/** @deprecated Use ClaimLineWithInsights instead */
export type LineItem = ClaimLineWithInsights
