/**
 * Claim Adapter - Transforms database records to PaAPI-compatible format
 *
 * This mirrors console-ui's claimAdapter pattern, transforming flat database
 * records into the ProcessedClaim/ProcessedClaimWithInsights format.
 *
 * Uses dynamic configuration from adapterConfig.ts for FHIR code systems.
 */

import type {
  ProcessedClaim,
  ProcessedClaimWithInsights,
  ClaimLine,
  ClaimLineWithInsights,
  DiagnosisCode,
  Money,
  Period,
  Patient,
  PractitionerRole,
  PractitionerIdentifiers,
  CareTeamMember,
  RenderingProvider,
  Insurance,
  CodeableConcept,
  Quantity,
  ClaimAdditionalDetails,
  ClaimLineAdditionalDetails,
  ProcessedInsight,
  Policy,
} from '~/types'
import { getClaimAdapterConfig } from '~/server/config/adapterConfig'

// Database record types (from Drizzle schema)
interface DbClaim {
  id: string
  providerId: string
  claimType: string | null
  patientName: string
  patientDob: string | null
  patientSex: string | null
  memberId: string | null
  memberGroupId: string | null
  dateOfService: string
  dateOfServiceEnd: string | null
  billedAmount: number
  paidAmount: number | null
  providerName: string | null
  billingProviderTin: string | null
  billingProviderNpi: string | null
  billingProviderTaxonomy: string | null
  priorAuthNumber: string | null
  ltssIndicator: boolean | null
  parIndicator: boolean | null
  status: string
  denialReason: string | null
  appealStatus: string | null
  appealDate: string | null
  submissionDate: string | null
  processingDate: string | null
  createdAt: string | null
  aiInsight: { explanation: string; guidance: string } | null
}

interface DbLineItem {
  id: number
  claimId: string
  lineNumber: number
  dateOfService: string | null
  dateOfServiceEnd: string | null
  procedureCode: string
  ndcCode: string | null
  placeOfService: string | null
  units: number | null
  unitsType: string | null
  billedAmount: number
  paidAmount: number | null
  renderingProviderName: string | null
  renderingProviderNpi: string | null
  renderingProviderTaxonomy: string | null
  status: string | null
  parIndicator: boolean | null
  bypassCode: string | null
  policies?: DbLinePolicy[]
  modifiers?: string[]
  diagnosisCodes?: string[]
}

interface DbLinePolicy {
  policyId: string
  policyName: string
  policyMode: string
  triggeredAt: string | null
  isDenied: boolean | null
  deniedAmount: number | null
  denialReason: string | null
}

interface DbDiagnosisCode {
  code: string
  sequence: number
}

interface DbAppeal {
  id: number
  claimId: string
  lineNumber: number | null
  appealFiled: boolean | null
  appealDate: string | null
  appealReason: string | null
  appealOutcome: string | null
  outcomeDate: string | null
  outcomeNotes: string | null
}

// Utility functions
function createCodeableConcept(code: string, system?: string): CodeableConcept {
  const config = getClaimAdapterConfig()
  return {
    coding: [{
      code,
      system: system || config.codeSystems.procedureSystem,
    }],
  }
}

function createMoney(value: number, currency?: string): Money {
  const config = getClaimAdapterConfig()
  return { value, currency: currency || config.defaultCurrency }
}

function createPeriod(start?: string | null, end?: string | null): Period | undefined {
  if (!start && !end) return undefined
  return {
    start: start || undefined,
    end: end || start || undefined,
  }
}

function mapClaimType(dbType: string | null): string {
  if (!dbType) return 'professional'
  const type = dbType.toLowerCase()
  // Map to PaAPI claim types
  if (type === 'institutional' || type === 'inpatient' || type === 'outpatient') {
    return type
  }
  if (type === 'professional') return 'professional'
  if (type === 'dental') return 'dental'
  if (type === 'pharmacy') return 'pharmacy'
  return 'professional'
}

function mapFormType(dbType: string | null): 'institutional' | 'professional' {
  if (!dbType) return 'professional'
  const type = dbType.toLowerCase()
  if (['institutional', 'inpatient', 'outpatient'].includes(type)) {
    return 'institutional'
  }
  return 'professional'
}

function createDiagnosisCode(code: string, sequence: number, isPrimary = false): DiagnosisCode {
  return {
    codeableConcept: code,
    sequence,
    type: isPrimary ? 'principal' : 'secondary',
  }
}

function createPatient(claim: DbClaim): Patient {
  const names = claim.patientName.split(',').map(s => s.trim())
  const family = names[0] || ''
  const given = names[1] ? [names[1]] : []

  return {
    id: `Patient-${claim.id}`,
    resourceType: 'Patient',
    name: [{
      family,
      given,
    }],
    birthDate: claim.patientDob || undefined,
    gender: claim.patientSex || undefined,
  }
}

function createProvider(claim: DbClaim): PractitionerRole {
  return {
    id: `PractitionerRole-${claim.providerId}`,
    resourceType: 'PractitionerRole',
    practitioner: {
      id: `Practitioner-${claim.providerId}`,
      resourceType: 'Practitioner',
      name: {
        family: claim.providerName || '',
      },
      identifiers: {
        npi: claim.billingProviderNpi || null,
        ein: claim.billingProviderTin || null,
      },
      renderingProviderId: claim.billingProviderNpi || null,
    },
    specialty: claim.billingProviderTaxonomy ? [{
      coding: [{
        code: claim.billingProviderTaxonomy,
        system: getClaimAdapterConfig().codeSystems.providerTaxonomy,
      }],
    }] : undefined,
  }
}

function createBillingProviderIdentifiers(claim: DbClaim): PractitionerIdentifiers | null {
  if (!claim.billingProviderNpi && !claim.billingProviderTin) return null
  return {
    npi: claim.billingProviderNpi || null,
    ein: claim.billingProviderTin || null,
  }
}

function createInsurance(claim: DbClaim): Insurance[] {
  return [{
    sequence: 1,
    focal: true,
    coverage: {
      id: `Coverage-${claim.id}`,
      subscriberId: claim.memberId || undefined,
      class: claim.memberGroupId ? [{
        type: { text: 'policy/group number' },
        value: claim.memberGroupId,
      }] : undefined,
    },
    claimResponse: null,
    preAuthRef: claim.priorAuthNumber ? [claim.priorAuthNumber] : undefined,
  }]
}

function transformLineItem(
  line: DbLineItem,
  claimDiagnosisCodes: DiagnosisCode[],
  claimDateOfService: string,
): ClaimLine {
  // Build diagnosis codes for this line
  const lineDiagnosisCodes = line.diagnosisCodes?.map((code, i) =>
    createDiagnosisCode(code, i + 1, i === 0)
  ) || claimDiagnosisCodes.slice(0, 4)

  const diagnosis1 = lineDiagnosisCodes[0] || createDiagnosisCode('', 1, true)
  const diagnosisAdditional = lineDiagnosisCodes.slice(1)

  // Create rendering provider
  const config = getClaimAdapterConfig()
  const renderingProvider: RenderingProvider = {
    sequence: 1,
    role: createCodeableConcept('82', config.codeSystems.careTeamRoleSystem),
    provider: {
      id: `PractitionerRole-rendering-${line.id}`,
      resourceType: 'PractitionerRole',
      practitioner: {
        id: `Practitioner-rendering-${line.id}`,
        resourceType: 'Practitioner',
        name: {
          family: line.renderingProviderName || '',
        },
        identifiers: {
          npi: line.renderingProviderNpi || null,
          ein: null,
        },
        renderingProviderId: line.renderingProviderNpi || null,
      },
      specialty: line.renderingProviderTaxonomy ? [{
        coding: [{
          code: line.renderingProviderTaxonomy,
          system: config.codeSystems.providerTaxonomy,
        }],
      }] : undefined,
    },
    identifiers: {
      npi: line.renderingProviderNpi || null,
      ein: null,
    },
  }

  return {
    sequence: line.lineNumber,
    lineNumber: line.lineNumber,
    servicedPeriod: createPeriod(
      line.dateOfService || claimDateOfService,
      line.dateOfServiceEnd || line.dateOfService || claimDateOfService
    ),
    productOrService: createCodeableConcept(line.procedureCode),
    modifier: line.modifiers?.map(m => createCodeableConcept(m)) || undefined,
    modifierCodes: line.modifiers || undefined,
    locationCodeableConcept: line.placeOfService
      ? createCodeableConcept(line.placeOfService, 'https://www.cms.gov/Medicare/Coding/place-of-service-codes')
      : undefined,
    quantity: { value: line.units || 1, unit: line.unitsType || 'UN' },
    net: createMoney(line.billedAmount),
    diagnosis1,
    diagnosisAdditional,
    diagnosisSequence: lineDiagnosisCodes.map((dc, i) => ({
      sequence: i + 1,
      diagnosisCodeableConcept: createCodeableConcept(dc.codeableConcept, 'http://hl7.org/fhir/sid/icd-10-cm'),
      type: i === 0 ? [createCodeableConcept('principal', 'http://terminology.hl7.org/CodeSystem/ex-diagnosistype')] : undefined,
    })),
    ndcCode: line.ndcCode || null,
    renderingProvider,
    renderingProviderIdentifiers: {
      npi: line.renderingProviderNpi || null,
      ein: null,
    },
    providerTaxonomyCodes: line.renderingProviderTaxonomy || undefined,
    careTeamSequence: [renderingProvider],
    additionalDetails: {} as ClaimLineAdditionalDetails,
    billingName: line.renderingProviderName?.toLowerCase() || undefined,
  }
}

function transformLineItemWithInsights(
  line: DbLineItem,
  claimDiagnosisCodes: DiagnosisCode[],
  claimDateOfService: string,
): ClaimLineWithInsights {
  const baseLine = transformLineItem(line, claimDiagnosisCodes, claimDateOfService)

  // Transform line policies to insights
  const insights: ProcessedInsight[] = (line.policies || [])
    .filter(p => p.isDenied)
    .map(p => ({
      id: `insight-${line.id}-${p.policyId}`,
      insight_score: 100,
      insight: {
        insight: {
          claimLineSequenceNum: line.lineNumber,
          policyId: p.policyId,
          editTypeId: undefined,
          paapi_policy_name: p.policyName,
          historyInfo: [],
        },
      },
      excluded_by: [],
      editType: null,
      hasInfluencingClaims: false,
      influencingClaims: [],
      hasPolicy: true,
      policyId: p.policyId,
      policyName: p.policyName,
      policyTopic: null,
      policyEditTypes: [],
    }))

  return {
    ...baseLine,
    excludedCount: 0,
    hasInsights: insights.length > 0,
    hasInsightScore: insights.length > 0,
    insights,
  }
}

/**
 * Transform database claim record to ProcessedClaim format
 */
export function claimAdapter(
  claim: DbClaim,
  diagnosisCodes: DbDiagnosisCode[] = [],
  procedureCodes: string[] = [],
): ProcessedClaim {
  // Transform diagnosis codes
  const sortedDiagnosisCodes = diagnosisCodes
    .sort((a, b) => a.sequence - b.sequence)
    .map((dc, i) => createDiagnosisCode(dc.code, dc.sequence, i === 0))

  const principalDiagnosisCode = sortedDiagnosisCodes
    .find(dc => dc.type === 'principal')?.codeableConcept || null

  return {
    id: claim.id,
    type: mapClaimType(claim.claimType),
    formType: mapFormType(claim.claimType),
    total: createMoney(claim.billedAmount),
    billablePeriod: createPeriod(claim.dateOfService, claim.dateOfServiceEnd || claim.dateOfService),
    servicedPeriod: createPeriod(claim.dateOfService, claim.dateOfServiceEnd || claim.dateOfService),
    created: claim.submissionDate || claim.createdAt || undefined,
    provider: createProvider(claim),
    billingProviderIdentifiers: createBillingProviderIdentifiers(claim),
    patient: createPatient(claim),
    patientName: claim.patientName,
    subscriberId: claim.memberId || null,
    memberGroupId: claim.memberGroupId || null,
    careTeam: [],
    diagnosisCodes: sortedDiagnosisCodes,
    principalDiagnosisCode,
    insurance: createInsurance(claim),
    typeOfBill: null,
    additionalDetails: {
      status: claim.status,
      denialReason: claim.denialReason,
      paidAmount: claim.paidAmount,
      appealStatus: claim.appealStatus,
      appealDate: claim.appealDate,
      processingDate: claim.processingDate,
      ltssIndicator: claim.ltssIndicator,
      parIndicator: claim.parIndicator,
      aiInsight: claim.aiInsight,
      // Include procedure codes for list view filtering/display
      procedureCodes: procedureCodes.length > 0 ? procedureCodes : undefined,
    } as ClaimAdditionalDetails,
    warnings: [],
  }
}

/**
 * Transform database claim with line items to ProcessedClaimWithInsights format
 */
export function claimWithInsightsAdapter(
  claim: DbClaim,
  lineItems: DbLineItem[],
  diagnosisCodes: DbDiagnosisCode[] = [],
  procedureCodes: string[] = [],
  appeals: DbAppeal[] = [],
): ProcessedClaimWithInsights {
  const baseClaim = claimAdapter(claim, diagnosisCodes, procedureCodes)

  // Transform line items with insights
  const claimLines = lineItems.map(line =>
    transformLineItemWithInsights(line, baseClaim.diagnosisCodes, claim.dateOfService)
  )

  // Collect all policies from line items
  const allPolicies = new Map<string, Policy>()
  for (const line of lineItems) {
    for (const policy of (line.policies || [])) {
      if (!allPolicies.has(policy.policyId)) {
        allPolicies.set(policy.policyId, {
          id: policy.policyId,
          name: policy.policyName,
          connector_insight_mode: [{
            connector_id: 'default',
            insight_mode: policy.policyMode as 'Active' | 'Inactive' | 'Inspection' | 'Observation' | 'Stealth' || 'Active',
          }],
        })
      }
    }
  }

  // Collect all insights from claim lines
  const allInsights = claimLines.flatMap(line => line.insights)

  return {
    ...baseClaim,
    claimLines,
    policies: Array.from(allPolicies.values()),
    insights: allInsights,
    claimChain: {},
  }
}

/**
 * Transform database claim for list responses (without line items)
 * Now accepts diagnosis and procedure codes for filtering/display
 */
export function claimListAdapter(
  claim: DbClaim,
  diagnosisCodes: DbDiagnosisCode[] = [],
  procedureCodes: string[] = [],
): ProcessedClaim {
  return claimAdapter(claim, diagnosisCodes, procedureCodes)
}

export type { DbClaim, DbLineItem, DbLinePolicy, DbDiagnosisCode, DbAppeal }
