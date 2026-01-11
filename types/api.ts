/**
 * API response types
 * Aligned with console-ui @rialtic/types patterns
 */
import type { ProcessedClaim, ProcessedClaimWithInsights } from './claim'
import type { Policy } from './policy'
import type { Pattern } from './pattern'
import type { ProviderWithStats } from './provider'

// Pagination
export interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// List Response Types
export interface ClaimsListResponse {
  data: ProcessedClaim[]
  pagination: Pagination
}

export interface ClaimDetailResponse extends ProcessedClaimWithInsights {}

export interface PoliciesListResponse {
  data: Policy[]
  pagination: Pagination
}

export interface PatternsListResponse {
  data: Pattern[]
  pagination: Pagination
}

export interface ProvidersListResponse {
  data: ProviderWithStats[]
  pagination: Pagination
}

// PaAPI Error & Response Types
export interface PaapiErrorResponse {
  code: string
  message: string
  details?: unknown
  timestamp?: string
  requestId?: string
}

export interface PaapiValidationError {
  field: string
  message: string
  code: string
}

export interface PaapiResponse<T> {
  success: boolean
  data?: T
  error?: PaapiErrorResponse
  meta?: {
    requestId?: string
    duration?: number
    cached?: boolean
  }
}

// Summary & Metrics Response Types
export interface ClaimsSummaryResponse {
  totalClaims: number
  statusBreakdown: {
    approved: number
    denied: number
    pending: number
    appealed: number
  }
  denialRate: number
  financial: {
    billedAmount: number
    paidAmount: number
    deniedAmount: number
    collectionRate: number
  }
  appeals: {
    total: number
    overturned: number
    successRate: number
  }
  period: {
    days: number
    startDate: string
    endDate: string
  }
}

export interface InsightsResponse {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  denialAnalysis: {
    byCategory: Array<{
      category: string
      count: number
      impact: number
    }>
    topReasons: Array<{
      reason: string
      count: number
      amount: number
    }>
    revenueAtRisk: number
  }
  appeals: {
    total: number
    overturned: number
    upheld: number
    pending: number
    successRate: number
  }
  criticalPatterns: Array<{
    id: string
    title: string
    category: string
    tier: string
    totalAtRisk: number
    currentClaimCount: number
    currentDenialRate: number
  }>
  weeklyTrends: Array<{
    week: string
    total: number
    denied: number
    approved: number
    denialRate: number
    totalBilled: number
    totalPaid: number
  }>
  learningEngagement: Record<string, number>
}

export interface DashboardKPIs {
  totalClaims: number
  denialRate: number
  appealSuccessRate: number
  avgDaysToPayment: number
  totalBilledAmount: number
  totalPaidAmount: number
  collectionRate: number
  activePatterns: number
  criticalPatterns: number
  learningProgress: number
}

export interface AnalyticsDashboardResponse {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  kpis: DashboardKPIs
  generatedAt: string
}
