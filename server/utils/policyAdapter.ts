/**
 * Policy Adapter - Transforms database records to PaAPI-compatible format
 *
 * This mirrors console-ui's policy format, transforming flat database
 * records into the Policy format expected by PaAPI clients.
 *
 * Uses dynamic configuration from adapterConfig.ts for mode mappings.
 */

import type {
  Policy,
  PolicyDetails,
  PolicyReferenceDocument,
  PolicyTopic,
  PolicyEditType,
  ConnectorInsightMode,
  InsightMode,
} from '~/types'
import { getPolicyAdapterConfig, mapPolicyMode, getConnectorId } from '~/server/config/adapterConfig'

// Database record types (from Drizzle schema)
export interface DbPolicy {
  id: string
  name: string
  mode: 'Edit' | 'Informational' | 'Pay & Advise'
  effectiveDate: string
  description: string | null
  clinicalRationale: string | null
  topic: string | null
  logicType: string | null
  source: string | null
  hitRate: number | null
  denialRate: number | null
  appealRate: number | null
  overturnRate: number | null
  impact: number | null
  insightCount: number | null
  providersImpacted: number | null
  trend: 'up' | 'down' | 'stable' | null
  commonMistake: string | null
  fixGuidance: string | null
  ageRestrictions: { min?: number; max?: number } | null
  frequencyLimits: { count: number; period: string } | null
  learningMarkersCount: number | null
  recentTests: number | null
  createdAt: string | null
}

export interface DbReferenceDoc {
  id: number
  policyId: string
  title: string
  url: string
  source: string | null
}

export interface DbRelatedPolicy {
  id: string
  name: string
  mode: string
}

export interface DbRelatedPattern {
  id: string
  title: string
  category: string
  status: string
  tier: string
}

/**
 * Map database mode to PaAPI InsightMode format using dynamic configuration
 */
function mapModeToInsightMode(dbMode: string): InsightMode {
  const mappedMode = mapPolicyMode(dbMode)
  // Ensure the mapped mode is a valid InsightMode
  const validModes: InsightMode[] = ['Active', 'Observation', 'Inspection']
  return validModes.includes(mappedMode as InsightMode)
    ? (mappedMode as InsightMode)
    : 'Active'
}

/**
 * Transform database policy record to PaAPI Policy format
 */
export function policyAdapter(
  policy: DbPolicy,
  procedureCodes: string[] = [],
  diagnosisCodes: string[] = [],
  modifiers: string[] = [],
  placesOfService: string[] = [],
  referenceDocs: DbReferenceDoc[] = [],
  relatedPolicies: DbRelatedPolicy[] = [],
): Policy {
  // Build connector_insight_mode array (PaAPI format)
  const connector_insight_mode: ConnectorInsightMode[] = [{
    connector_id: getConnectorId(),
    insight_mode: mapModeToInsightMode(policy.mode),
  }]

  // Build topic object if present
  const topic: PolicyTopic | undefined = policy.topic ? {
    id: policy.topic.toLowerCase().replace(/\s+/g, '-'),
    name: policy.topic,
  } : undefined

  // Build edit_types from logic type
  const edit_types: PolicyEditType[] = policy.logicType ? [{
    edit_type_id: policy.logicType.toLowerCase().replace(/\s+/g, '-'),
    edit_type: policy.logicType,
  }] : []

  // Build policy_details (PaAPI format)
  const policy_details: PolicyDetails = {
    geography: [],
    specialty_codes: [],
    cpt_codes: procedureCodes.filter(c => c.length === 5 && /^\d+$/.test(c)),
    hcpcs_codes: procedureCodes.filter(c => /^[A-Z]\d{4}$/.test(c)),
    icd_codes: diagnosisCodes,
    modifiers,
    places_of_service: placesOfService,
    insight_type: policy.logicType ? [policy.logicType] : [],
    logic_type_primary: policy.logicType || '',
    logic_type_supporting: '',
    claim_type: [],
    ref_documents: referenceDocs.map(doc => ({
      is_primary: true,
      excerpt: '',
      title: doc.title,
      upcoming_change: null,
      type: doc.source || null,
      url: doc.url,
      source: doc.source || undefined,
    })),
    revenue_codes: [],
    type_of_bill_codes: [],
  }

  return {
    id: policy.id,
    name: policy.name,
    description: policy.description || undefined,
    clinical_rationale: policy.clinicalRationale || undefined,

    // Topic
    topic,

    // Edit types
    edit_types,

    // Connector insight modes (PaAPI format - replaces simple 'mode')
    connector_insight_mode,

    // Policy details (PaAPI format)
    policy_details,

    // Metrics (Provider Portal specific)
    hit_rate: policy.hitRate || undefined,
    denial_rate: policy.denialRate || undefined,
    appeal_rate: policy.appealRate || undefined,
    overturn_rate: policy.overturnRate || undefined,
    impact: policy.impact || undefined,
    insight_count: policy.insightCount || undefined,
    providers_impacted: policy.providersImpacted || undefined,
    trend: policy.trend || undefined,

    // Guidance
    common_mistake: policy.commonMistake || undefined,
    fix_guidance: policy.fixGuidance || undefined,

    // Age restrictions
    age_restrictions: policy.ageRestrictions || undefined,

    // Frequency limits
    frequency_limits: policy.frequencyLimits || undefined,

    // Learning tracking
    learning_markers_count: policy.learningMarkersCount || undefined,
    recent_tests: policy.recentTests || undefined,

    // Source
    source: policy.source || undefined,

    // Dates
    effective_date: policy.effectiveDate,
    created_at: policy.createdAt || undefined,
  }
}

/**
 * Transform database policy for list responses (includes codes for filtering/display)
 */
export function policyListAdapter(
  policy: DbPolicy,
  procedureCodes: string[] = [],
  diagnosisCodes: string[] = [],
  modifiers: string[] = [],
  placesOfService: string[] = [],
  referenceDocs: DbReferenceDoc[] = [],
): Policy {
  return policyAdapter(policy, procedureCodes, diagnosisCodes, modifiers, placesOfService, referenceDocs)
}

/**
 * Transform database policy with all related data for detail view
 */
export function policyDetailAdapter(
  policy: DbPolicy,
  procedureCodes: string[] = [],
  diagnosisCodes: string[] = [],
  modifiers: string[] = [],
  placesOfService: string[] = [],
  referenceDocs: DbReferenceDoc[] = [],
  relatedPolicies: DbRelatedPolicy[] = [],
  relatedPatterns: DbRelatedPattern[] = [],
): Policy & {
  // Extended fields for detail view
  procedureCodes: string[]
  diagnosisCodes: string[]
  modifiers: string[]
  placesOfService: string[]
  relatedPolicies: Array<{ id: string; name: string; mode: string }>
  relatedPatterns: Array<{ id: string; title: string; category: string; status: string; tier: string }>
} {
  const basePolicy = policyAdapter(
    policy,
    procedureCodes,
    diagnosisCodes,
    modifiers,
    placesOfService,
    referenceDocs,
    relatedPolicies,
  )

  return {
    ...basePolicy,
    // Additional flat arrays for easy access
    procedureCodes,
    diagnosisCodes,
    modifiers,
    placesOfService,
    // Related entities with mode converted to PaAPI insight mode for display
    relatedPolicies: relatedPolicies.map(rp => ({
      id: rp.id,
      name: rp.name,
      mode: mapModeToInsightMode(rp.mode),
    })),
    relatedPatterns,
  }
}
