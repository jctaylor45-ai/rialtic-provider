/**
 * Composable for displaying PaAPI policies in templates
 * Provides normalized access to policy properties with camelCase aliases
 */

import type { Policy, PolicyReferenceDocument } from '~/types'

export interface DisplayPolicy extends Policy {
  // CamelCase aliases for template compatibility
  hitRate: number | undefined
  denialRate: number | undefined
  appealRate: number | undefined
  overturnRate: number | undefined
  insightCount: number | undefined
  providersImpacted: number | undefined
  recentTests: number | undefined
  effectiveDate: string | undefined
  commonMistake: string | undefined
  fixGuidance: string | undefined
  clinicalRationale: string | undefined
  logicType: string | undefined
  source: string | undefined

  // Simplified topic string
  topicName: string | undefined

  // Mode for display (from connector_insight_mode)
  mode: string

  // Codes from policy_details
  procedureCodes: string[]
  diagnosisCodes: string[]
  modifiers: string[]
  placesOfService: string[]

  // Reference docs normalized
  referenceDocs: Array<{
    title: string
    url: string
    source: string | null
  }>

  // Related policies (empty if not provided)
  relatedPolicies: string[]

  // Original policy
  _raw: Policy
}

/**
 * Transform a PaAPI Policy to a display format with camelCase aliases
 */
export function normalizePolicyForDisplay(policy: Policy): DisplayPolicy {
  // Get mode from connector_insight_mode
  const mode = policy.connector_insight_mode?.[0]?.insight_mode || 'Active'

  // Get codes from policy_details
  const policyDetails = policy.policy_details
  const procedureCodes = [
    ...(policyDetails?.cpt_codes || []),
    ...(policyDetails?.hcpcs_codes || []),
  ]
  const diagnosisCodes = policyDetails?.icd_codes || []
  const modifiers = policyDetails?.modifiers || []
  const placesOfService = policyDetails?.places_of_service || []

  // Get logic type from edit_types
  const logicType = policy.edit_types?.[0]?.edit_type || policyDetails?.logic_type_primary || undefined

  // Transform ref_documents to referenceDocs
  const referenceDocs = (policyDetails?.ref_documents || []).map(doc => ({
    title: doc.title || 'Reference Document',
    url: doc.url || '',
    source: doc.source || null,
  }))

  return {
    ...policy,

    // CamelCase aliases
    hitRate: policy.hit_rate,
    denialRate: policy.denial_rate,
    appealRate: policy.appeal_rate,
    overturnRate: policy.overturn_rate,
    insightCount: policy.insight_count,
    providersImpacted: policy.providers_impacted,
    recentTests: policy.recent_tests,
    effectiveDate: policy.effective_date,
    commonMistake: policy.common_mistake,
    fixGuidance: policy.fix_guidance,
    clinicalRationale: policy.clinical_rationale,
    logicType,
    source: policy.source,

    // Simplified topic
    topicName: policy.topic?.name,

    // Mode
    mode,

    // Codes
    procedureCodes,
    diagnosisCodes,
    modifiers,
    placesOfService,

    // Reference docs
    referenceDocs,

    // Related policies
    relatedPolicies: [],

    // Original
    _raw: policy,
  }
}

/**
 * Composable for policy display utilities
 */
export function usePolicyDisplay() {
  return {
    normalizePolicyForDisplay,
  }
}
