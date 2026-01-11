import { format, parseISO } from 'date-fns'
import numeral from 'numeral'
import type { ProcessedClaim, ClaimLine } from '~/types'

// Date formatting
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    return format(date, 'MM/dd/yyyy')
  } catch (error) {
    console.error('Invalid date:', dateString)
    return ''
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    return format(date, 'MM/dd/yyyy hh:mm a')
  } catch (error) {
    console.error('Invalid date:', dateString)
    return ''
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatTime(): string {
  return format(new Date(), 'h:mm a')
}

// Number formatting
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined) return '$0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return numeral(num).format('$0,0')
}

export function formatCurrencyDetailed(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined) return '$0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return numeral(num).format('$0,0.00')
}

export function formatPercentage(value: number | string | undefined | null): string {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return numeral(num / 100).format('0%')
}

export function formatNumber(value: number | string | undefined | null): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return numeral(num).format('0,0')
}

// Text utilities
export function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// PaAPI claim property helpers
export function getClaimStatus(claim: ProcessedClaim): string {
  return (claim.additionalDetails as { status?: string })?.status || 'pending'
}

export function getClaimBilledAmount(claim: ProcessedClaim): number {
  return claim.total?.value || 0
}

export function getClaimPaidAmount(claim: ProcessedClaim): number {
  return (claim.additionalDetails as { paidAmount?: number })?.paidAmount || 0
}

export function getClaimDenialReason(claim: ProcessedClaim): string | undefined {
  return (claim.additionalDetails as { denialReason?: string })?.denialReason
}

export function getClaimDateOfService(claim: ProcessedClaim): string | undefined {
  return claim.billablePeriod?.start || claim.servicedPeriod?.start
}

export function getClaimSubmissionDate(claim: ProcessedClaim): string | undefined {
  return claim.created
}

export function getClaimAppealStatus(claim: ProcessedClaim): string | undefined {
  return (claim.additionalDetails as { appealStatus?: string })?.appealStatus
}

export function getClaimProviderId(claim: ProcessedClaim): string | undefined {
  return claim.billingProviderIdentifiers?.npi ?? undefined
}

export function getClaimProviderName(claim: ProcessedClaim): string | undefined {
  return claim.provider?.practitioner?.name?.family ?? undefined
}

export function getClaimProcedureCodes(claim: ProcessedClaim): string[] {
  // First check additionalDetails.procedureCodes (available in list view)
  const additionalCodes = (claim.additionalDetails as { procedureCodes?: string[] })?.procedureCodes
  if (additionalCodes && additionalCodes.length > 0) {
    return additionalCodes
  }

  // Fall back to extracting from claimLines (available in detail view)
  if (!claim.claimLines) return []
  return claim.claimLines
    .map(line => line.productOrService?.coding?.[0]?.code)
    .filter((code): code is string => !!code)
}

export function getClaimMemberId(claim: ProcessedClaim): string | undefined {
  return claim.subscriberId ?? undefined
}

// Claim utilities - now works with PaAPI ProcessedClaim
export function ensureClaimLines(claim: ProcessedClaim | null | undefined): ProcessedClaim | null {
  if (!claim) return null

  // If claimLines already exist, return as is
  if (claim.claimLines && claim.claimLines.length > 0) {
    return claim
  }

  // Create a synthetic claim line from claim-level data
  const billedAmount = getClaimBilledAmount(claim)
  const dateOfService = getClaimDateOfService(claim)

  const claimLines: ClaimLine[] = [{
    sequence: 1,
    lineNumber: 1,
    productOrService: { coding: [{ code: '' }] },
    modifierCodes: [],
    quantity: { value: 1 },
    net: { value: billedAmount, currency: 'USD' },
    servicedPeriod: dateOfService ? { start: dateOfService, end: dateOfService } : undefined,
    diagnosis1: { codeableConcept: '', sequence: 1, type: '' },
    diagnosisAdditional: [],
    diagnosisSequence: [],
    renderingProvider: { sequence: 1, provider: {}, role: { coding: [] } },
    renderingProviderIdentifiers: null,
    ndcCode: null,
    locationCodeableConcept: undefined,
    careTeamSequence: [],
    additionalDetails: {},
  }]

  return {
    ...claim,
    claimLines,
  }
}
