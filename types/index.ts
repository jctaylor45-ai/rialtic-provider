// Core data types for the Provider Portal

export interface Claim {
  id: string
  providerId: string
  patientName: string
  patientDOB?: string
  memberId?: string
  dateOfService: string
  procedureCodes?: string[]
  procedureCode?: string
  diagnosisCodes?: string[]
  modifiers?: string[]
  billedAmount: number
  paidAmount?: number
  status: 'approved' | 'denied' | 'pending' | 'appealed'
  denialReason?: string
  policyId?: string
  policyIds?: string[]
  appealStatus?: string | null
  appealDate?: string
  submissionDate?: string
  submittedDate?: string
  processingDate?: string
  processedDate?: string
  statusDate?: string
  providerName?: string
  lineItems?: LineItem[]
  aiInsight?: {
    explanation: string
    guidance: string
  }
}

export interface LineItem {
  lineNumber: number
  procedureCode: string
  modifiers?: string[]
  diagnosisCodes?: string[]
  units: number
  billedAmount: number
  paidAmount: number
  status: string
  dateOfService?: string
  editsFired?: string[]
  policiesTriggered?: string[]
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
