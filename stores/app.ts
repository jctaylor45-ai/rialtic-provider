import { defineStore } from 'pinia'
import type { ProcessedClaim, Policy, Insight, LearningMarker } from '~/types'

// Types for API responses
interface ClaimsApiResponse {
  data: ProcessedClaim[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface PoliciesApiResponse {
  data: Policy[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface ClaimsSummaryResponse {
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

// Helper to get status from PaAPI claim
function getClaimStatus(claim: ProcessedClaim): string {
  return (claim.additionalDetails as { status?: string })?.status || 'pending'
}

// Helper to get billed amount from PaAPI claim
function getClaimBilledAmount(claim: ProcessedClaim): number {
  return claim.total?.value || 0
}

// Helper to get paid amount from PaAPI claim
function getClaimPaidAmount(claim: ProcessedClaim): number {
  return (claim.additionalDetails as { paidAmount?: number })?.paidAmount || 0
}

// Helper to get policy mode
function getPolicyMode(policy: Policy): string {
  return policy.connector_insight_mode?.[0]?.insight_mode || 'Active'
}

const PAGE_SIZE = 100

export const useAppStore = defineStore('app', {
  state: () => ({
    // Core data
    claims: [] as ProcessedClaim[],
    policies: [] as Policy[],
    insights: [] as Insight[],
    learningMarkers: [] as LearningMarker[],
    claimsSummary: null as ClaimsSummaryResponse | null,

    // Loading states
    isLoading: false,
    claimsLoading: false,
    error: null as string | null,

    // Configuration
    useDatabase: true,

    // Pagination state
    pagination: {
      claims: { total: 0, limit: 100, offset: 0, hasMore: false },
      policies: { total: 0, limit: 100, offset: 0, hasMore: false },
    },

    // Pagination state for infinite scroll (console-ui pattern)
    claimsPage: 1,
    claimsTotalRecords: 0,
    claimsLoadedAll: false,
    claimsFirstDataLoaded: false,
  }),

  getters: {
    deniedClaims(state): ProcessedClaim[] {
      return state.claims.filter(c => getClaimStatus(c) === 'denied')
    },

    approvedClaims(state): ProcessedClaim[] {
      return state.claims.filter(c => getClaimStatus(c) === 'approved')
    },

    pendingClaims(state): ProcessedClaim[] {
      return state.claims.filter(c => getClaimStatus(c) === 'pending')
    },

    editModePolicies(state): Policy[] {
      return state.policies.filter(p => getPolicyMode(p) === 'Active')
    },

    highSeverityInsights(state): Insight[] {
      return state.insights.filter(i => i.severity === 'high' && !i.dismissed)
    },

    totalClaimsAmount(state): number {
      return state.claims.reduce((sum, c) => sum + getClaimBilledAmount(c), 0)
    },

    totalPaidAmount(state): number {
      return state.claims.reduce((sum, c) => sum + getClaimPaidAmount(c), 0)
    },

    denialRate(state): number {
      if (state.claims.length === 0) return 0
      const deniedCount = state.claims.filter(c => getClaimStatus(c) === 'denied').length
      return (deniedCount / state.claims.length) * 100
    },
  },

  actions: {
    async initialize() {
      this.isLoading = true
      this.error = null
      try {
        if (this.useDatabase) {
          await this.initializeFromDatabase()
        } else {
          await this.initializeFromJson()
        }
        this.loadLearningMarkers()
      } catch (err) {
        console.error('Failed to initialize data:', err)
        this.error = 'Failed to load data'
        // Fallback to JSON if database fails
        if (this.useDatabase) {
          console.log('Falling back to JSON data...')
          try {
            await this.initializeFromJson()
            this.loadLearningMarkers()
            this.error = null
          } catch {
            // Keep the original error
          }
        }
      } finally {
        this.isLoading = false
      }
    },

    async initializeFromDatabase() {
      // Reset pagination state
      this.claimsPage = 1
      this.claimsLoadedAll = false
      this.claimsFirstDataLoaded = false
      this.claims = []

      // Fetch policies, summary, and first page of claims in parallel
      const [policiesResponse, summaryResponse, claimsResponse] = await Promise.all([
        $fetch<PoliciesApiResponse>('/api/v1/policies', { params: { limit: 100 } }),
        $fetch<ClaimsSummaryResponse>('/api/v1/claims/summary'),
        $fetch<ClaimsApiResponse>('/api/v1/claims', { params: { limit: PAGE_SIZE, offset: 0 } }),
      ])

      this.policies = policiesResponse.data
      this.pagination.policies = policiesResponse.pagination
      this.claimsSummary = summaryResponse

      // Set initial claims data
      this.claims = claimsResponse.data
      this.claimsTotalRecords = claimsResponse.pagination.total
      this.pagination.claims = claimsResponse.pagination
      this.claimsFirstDataLoaded = true

      // Check if all claims are loaded
      if (!claimsResponse.pagination.hasMore || claimsResponse.data.length < PAGE_SIZE) {
        this.claimsLoadedAll = true
      }

      // For now, we still load insights from JSON (can be extended later)
      try {
        const insightsData = await $fetch<Insight[]>('/data/insights.json')
        this.insights = insightsData
      } catch {
        this.insights = []
      }
    },

    // Load next page of claims (console-ui infinite scroll pattern)
    async loadMoreClaims() {
      // Guard conditions
      if (this.claimsLoadedAll || !this.claimsFirstDataLoaded) {
        return
      }
      if (this.claimsLoading) {
        return
      }
      if (!this.claimsTotalRecords) {
        return
      }

      // Check if we've loaded all pages
      const maxPages = Math.ceil(this.claimsTotalRecords / PAGE_SIZE)
      if (this.claimsPage >= maxPages) {
        this.claimsLoadedAll = true
        return
      }

      this.claimsLoading = true
      try {
        this.claimsPage++
        const offset = (this.claimsPage - 1) * PAGE_SIZE

        const response = await $fetch<ClaimsApiResponse>('/api/v1/claims', {
          params: { limit: PAGE_SIZE, offset },
        })

        // Append new claims to existing list
        this.claims = [...this.claims, ...response.data]
        this.pagination.claims = response.pagination

        // Check if all claims are loaded
        if (!response.pagination.hasMore || response.data.length < PAGE_SIZE) {
          this.claimsLoadedAll = true
        }
      } catch (err) {
        console.error('Failed to load more claims:', err)
        // Revert page increment on error
        this.claimsPage--
      } finally {
        this.claimsLoading = false
      }
    },

    // Reset claims pagination (for filter/sort changes)
    resetClaimsPagination() {
      this.claimsPage = 1
      this.claimsLoadedAll = false
      this.claimsFirstDataLoaded = false
      this.claims = []
    },

    async initializeFromJson() {
      const [claimsData, policiesData, insightsData] = await Promise.all([
        $fetch<{ claims: ProcessedClaim[] }>('/data/claims.json'),
        $fetch<Policy[]>('/data/policies.json'),
        $fetch<Insight[]>('/data/insights.json'),
      ])

      this.claims = claimsData.claims
      this.policies = policiesData
      this.insights = insightsData
    },

    setUseDatabase(value: boolean) {
      this.useDatabase = value
    },

    loadLearningMarkers() {
      if (import.meta.client) {
        const stored = localStorage.getItem('learningMarkers')
        if (stored) {
          try {
            this.learningMarkers = JSON.parse(stored)
          } catch (err) {
            console.error('Failed to parse learning markers:', err)
            this.learningMarkers = []
          }
        }
      }
    },

    saveLearningMarkers() {
      if (import.meta.client) {
        localStorage.setItem('learningMarkers', JSON.stringify(this.learningMarkers))
      }
    },

    addLearningMarker(marker: Omit<LearningMarker, 'id' | 'timestamp'>) {
      const newMarker: LearningMarker = {
        ...marker,
        id: `LM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      }
      this.learningMarkers.push(newMarker)
      this.saveLearningMarkers()
    },

    dismissInsight(insightId: string) {
      const insight = this.insights.find(i => i.id === insightId)
      if (insight) {
        insight.dismissed = true
      }
    },

    getClaimById(id: string): ProcessedClaim | undefined {
      return this.claims.find(c => c.id === id)
    },

    getPolicyById(id: string): Policy | undefined {
      return this.policies.find(p => p.id === id)
    },

    getInsightById(id: string): Insight | undefined {
      return this.insights.find(i => i.id === id)
    },
  },
})
