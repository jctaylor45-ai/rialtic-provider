/**
 * Policy types (PaAPI Compatible)
 * Aligned with console-ui @rialtic/types patterns
 */

export interface PolicyTopic {
  id: string
  name: string
}

export interface PolicyEditType {
  edit_type_id: string
  edit_type: string
}

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
  icd_codes?: string[]
  modifiers?: string[]
  places_of_service?: string[]
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

  // Source (Provider Portal specific)
  source?: string

  // Dates
  effective_date?: string
  created_at?: string
}
