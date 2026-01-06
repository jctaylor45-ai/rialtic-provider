import { format, parseISO } from 'date-fns'
import numeral from 'numeral'
import type { Claim, LineItem } from '~/types'

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

// Claim utilities
export function ensureLineItems(claim: Claim | null | undefined): Claim | null {
  if (!claim) return null

  // If lineItems already exist, return as is
  if (claim.lineItems && claim.lineItems.length > 0) {
    return claim
  }

  // Create lineItems from procedureCodes
  const procedureCodes = claim.procedureCodes || (claim.procedureCode ? [claim.procedureCode] : [])

  const lineItems: LineItem[] = procedureCodes.map((code, idx) => ({
    lineNumber: idx + 1,
    procedureCode: code,
    modifiers: claim.modifiers || [],
    diagnosisCodes: claim.diagnosisCodes || [],
    units: 1,
    billedAmount: claim.billedAmount / procedureCodes.length,
    paidAmount: (claim.paidAmount || 0) / procedureCodes.length,
    status: claim.status,
    dateOfService: claim.dateOfService,
    editsFired: claim.denialReason ? [claim.denialReason] : [],
    policiesTriggered: claim.policyIds || [],
  }))

  return {
    ...claim,
    lineItems,
  }
}
