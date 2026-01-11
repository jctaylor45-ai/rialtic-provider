/**
 * Composable for displaying PaAPI claims in templates
 * Provides normalized access to nested claim properties
 */

import type { ProcessedClaimWithInsights, ClaimLineWithInsights } from '~/types'

export interface DisplayClaim {
  // Core identifiers
  id: string
  type: string
  formType: string
  status: string

  // Patient
  patientName: string
  patientDOB: string | null
  patientSex: string | null

  // Member
  memberId: string | null
  memberGroupId: string | null

  // Dates
  dateOfService: string | null
  dateOfServiceEnd: string | null
  submissionDate: string | null
  processingDate: string | null

  // Provider
  providerName: string | null
  billingProviderNPI: string | null
  billingProviderTIN: string | null
  billingProviderTaxonomy: string | null

  // Financial
  billedAmount: number
  paidAmount: number

  // Authorization
  priorAuthNumber: string | null
  ltssIndicator: boolean | null
  parIndicator: boolean | null

  // Denial
  denialReason: string | null
  appealStatus: string | null
  appealDate: string | null

  // Codes
  diagnosisCodes: string[]
  procedureCodes: string[]
  principalDiagnosisCode: string | null

  // AI
  aiInsight: { explanation: string; guidance: string } | null

  // Line items (normalized)
  lineItems: DisplayLineItem[]

  // Related policies
  policyIds: string[]

  // Original claim for full access
  _raw: ProcessedClaimWithInsights
}

export interface DisplayLineItem {
  lineNumber: number
  procedureCode: string
  modifiers: string[]
  diagnosisCodes: string[]
  units: number
  billedAmount: number
  paidAmount: number
  status: string
  policies: Array<{
    policyId: string
    policyName: string
    policyMode: string
    isDenied: boolean | null
    deniedAmount: number | null
    denialReason: string | null
  }>
  editsFired: string[]
  renderingProviderName: string | null
  renderingProviderNPI: string | null
  ndcCode: string | null
  placeOfService: string | null
  dateOfService: string | null
  dateOfServiceEnd: string | null
  _raw: ClaimLineWithInsights
}

/**
 * Transform a PaAPI ProcessedClaimWithInsights to a flat display format
 */
export function normalizeClaimForDisplay(claim: ProcessedClaimWithInsights): DisplayClaim {
  const additionalDetails = claim.additionalDetails as {
    status?: string
    denialReason?: string
    paidAmount?: number
    appealStatus?: string
    appealDate?: string
    processingDate?: string
    ltssIndicator?: boolean
    parIndicator?: boolean
    aiInsight?: { explanation: string; guidance: string }
  } | undefined

  // Get provider info from nested structure
  const practitioner = claim.provider?.practitioner
  const specialty = claim.provider?.specialty?.[0]?.coding?.[0]?.code

  // Get prior auth from insurance
  const priorAuth = claim.insurance?.[0]?.preAuthRef?.[0] || null

  // Normalize line items
  const lineItems: DisplayLineItem[] = (claim.claimLines || []).map(line => {
    // Get procedure code from productOrService
    const procedureCode = line.productOrService?.coding?.[0]?.code || ''

    // Get modifiers
    const modifiers = line.modifierCodes || []

    // Get diagnosis codes from line
    const diagnosisCodes = [
      line.diagnosis1?.codeableConcept,
      ...(line.diagnosisAdditional || []).map(d => d.codeableConcept)
    ].filter(Boolean) as string[]

    // Get policies from insights
    const policies = (line.insights || []).map(insight => ({
      policyId: insight.policyId || '',
      policyName: insight.policyName || '',
      policyMode: 'Active',
      isDenied: insight.hasPolicy,
      deniedAmount: null as number | null,
      denialReason: null as string | null,
    }))

    // Determine status from insights
    let status = 'approved'
    if (line.hasInsights && line.insights.some(i => i.hasPolicy)) {
      status = 'denied'
    }

    return {
      lineNumber: line.lineNumber,
      procedureCode,
      modifiers,
      diagnosisCodes,
      units: line.quantity?.value || 1,
      billedAmount: line.net?.value || 0,
      paidAmount: 0,
      status,
      policies,
      editsFired: [],
      renderingProviderName: line.renderingProvider?.provider?.practitioner?.name?.family || null,
      renderingProviderNPI: line.renderingProviderIdentifiers?.npi || null,
      ndcCode: line.ndcCode,
      placeOfService: line.locationCodeableConcept?.coding?.[0]?.code || null,
      dateOfService: line.servicedPeriod?.start || null,
      dateOfServiceEnd: line.servicedPeriod?.end || null,
      _raw: line,
    }
  })

  // Collect all policy IDs from line items
  const policyIds = [...new Set(
    lineItems.flatMap(line => line.policies.map(p => p.policyId))
  )]

  // Get procedure codes from line items
  const procedureCodes = [...new Set(lineItems.map(l => l.procedureCode).filter(Boolean))]

  // Get diagnosis codes as strings
  const diagnosisCodes = claim.diagnosisCodes?.map(dc => dc.codeableConcept) || []

  return {
    id: claim.id,
    type: claim.type || 'Professional',
    formType: claim.formType || 'professional',
    status: additionalDetails?.status || 'pending',

    patientName: claim.patientName || '',
    patientDOB: claim.patient?.birthDate || null,
    patientSex: claim.patient?.gender || null,

    memberId: claim.subscriberId,
    memberGroupId: claim.memberGroupId,

    dateOfService: claim.billablePeriod?.start || claim.servicedPeriod?.start || null,
    dateOfServiceEnd: claim.billablePeriod?.end || claim.servicedPeriod?.end || null,
    submissionDate: claim.created || null,
    processingDate: additionalDetails?.processingDate || null,

    providerName: practitioner?.name?.family || null,
    billingProviderNPI: claim.billingProviderIdentifiers?.npi || null,
    billingProviderTIN: claim.billingProviderIdentifiers?.ein || null,
    billingProviderTaxonomy: specialty || null,

    billedAmount: claim.total?.value || 0,
    paidAmount: additionalDetails?.paidAmount || 0,

    priorAuthNumber: priorAuth,
    ltssIndicator: additionalDetails?.ltssIndicator ?? null,
    parIndicator: additionalDetails?.parIndicator ?? null,

    denialReason: additionalDetails?.denialReason || null,
    appealStatus: additionalDetails?.appealStatus || null,
    appealDate: additionalDetails?.appealDate || null,

    diagnosisCodes,
    procedureCodes,
    principalDiagnosisCode: claim.principalDiagnosisCode,

    aiInsight: additionalDetails?.aiInsight || null,

    lineItems,
    policyIds,

    _raw: claim,
  }
}

/**
 * Composable for claim display utilities
 */
export function useClaimDisplay() {
  return {
    normalizeClaimForDisplay,
  }
}
