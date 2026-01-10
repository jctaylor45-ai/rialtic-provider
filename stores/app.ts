import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

export const useAppStore = defineStore('app', () => {
  // State
  const claims = ref<ProcessedClaim[]>([])
  const policies = ref<Policy[]>([])
  const insights = ref<Insight[]>([])
  const learningMarkers = ref<LearningMarker[]>([])
  const claimsSummary = ref<ClaimsSummaryResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const useDatabase = ref(true) // Toggle to use database APIs vs JSON files
  const pagination = ref({
    claims: { total: 0, limit: 500, offset: 0, hasMore: false },
    policies: { total: 0, limit: 100, offset: 0, hasMore: false },
  })

  // Getters - use helper functions for PaAPI format
  const deniedClaims = computed(() => claims.value.filter(c => getClaimStatus(c) === 'denied'))
  const approvedClaims = computed(() => claims.value.filter(c => getClaimStatus(c) === 'approved'))
  const pendingClaims = computed(() => claims.value.filter(c => getClaimStatus(c) === 'pending'))
  const editModePolicies = computed(() => policies.value.filter(p => getPolicyMode(p) === 'Active'))
  const highSeverityInsights = computed(() => insights.value.filter(i => i.severity === 'high' && !i.dismissed))

  const totalClaimsAmount = computed(() => claims.value.reduce((sum, c) => sum + getClaimBilledAmount(c), 0))
  const totalPaidAmount = computed(() => claims.value.reduce((sum, c) => sum + getClaimPaidAmount(c), 0))
  const denialRate = computed(() => {
    if (claims.value.length === 0) return 0
    const deniedCount = claims.value.filter(c => getClaimStatus(c) === 'denied').length
    return (deniedCount / claims.value.length) * 100
  })

  // Actions
  async function initialize() {
    isLoading.value = true
    error.value = null
    try {
      if (useDatabase.value) {
        await initializeFromDatabase()
      } else {
        await initializeFromJson()
      }
      loadLearningMarkers()
    } catch (err) {
      console.error('Failed to initialize data:', err)
      error.value = 'Failed to load data'
      // Fallback to JSON if database fails
      if (useDatabase.value) {
        console.log('Falling back to JSON data...')
        try {
          await initializeFromJson()
          loadLearningMarkers()
          error.value = null
        } catch {
          // Keep the original error
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  async function initializeFromDatabase() {
    // Fetch all claims (up to 500) to match summary counts
    const [claimsResponse, policiesResponse, summaryResponse] = await Promise.all([
      $fetch<ClaimsApiResponse>('/api/v1/claims', { params: { limit: 500 } }),
      $fetch<PoliciesApiResponse>('/api/v1/policies', { params: { limit: 100 } }),
      $fetch<ClaimsSummaryResponse>('/api/v1/claims/summary'),
    ])

    claims.value = claimsResponse.data
    pagination.value.claims = claimsResponse.pagination

    policies.value = policiesResponse.data
    pagination.value.policies = policiesResponse.pagination

    claimsSummary.value = summaryResponse

    // For now, we still load insights from JSON (can be extended later)
    try {
      const insightsData = await $fetch<Insight[]>('/data/insights.json')
      insights.value = insightsData
    } catch {
      insights.value = []
    }
  }

  async function initializeFromJson() {
    const [claimsData, policiesData, insightsData] = await Promise.all([
      $fetch<{ claims: ProcessedClaim[] }>('/data/claims.json'),
      $fetch<Policy[]>('/data/policies.json'),
      $fetch<Insight[]>('/data/insights.json'),
    ])

    claims.value = claimsData.claims
    policies.value = policiesData
    insights.value = insightsData
  }

  function setUseDatabase(value: boolean) {
    useDatabase.value = value
  }

  function loadLearningMarkers() {
    if (import.meta.client) {
      const stored = localStorage.getItem('learningMarkers')
      if (stored) {
        try {
          learningMarkers.value = JSON.parse(stored)
        } catch (err) {
          console.error('Failed to parse learning markers:', err)
          learningMarkers.value = []
        }
      }
    }
  }

  function saveLearningMarkers() {
    if (import.meta.client) {
      localStorage.setItem('learningMarkers', JSON.stringify(learningMarkers.value))
    }
  }

  function addLearningMarker(marker: Omit<LearningMarker, 'id' | 'timestamp'>) {
    const newMarker: LearningMarker = {
      ...marker,
      id: `LM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }
    learningMarkers.value.push(newMarker)
    saveLearningMarkers()
  }

  function dismissInsight(insightId: string) {
    const insight = insights.value.find(i => i.id === insightId)
    if (insight) {
      insight.dismissed = true
    }
  }

  function getClaimById(id: string): ProcessedClaim | undefined {
    return claims.value.find(c => c.id === id)
  }

  function getPolicyById(id: string): Policy | undefined {
    return policies.value.find(p => p.id === id)
  }

  function getInsightById(id: string): Insight | undefined {
    return insights.value.find(i => i.id === id)
  }

  return {
    // State
    claims,
    policies,
    insights,
    learningMarkers,
    claimsSummary,
    isLoading,
    error,
    useDatabase,
    pagination,
    // Getters
    deniedClaims,
    approvedClaims,
    pendingClaims,
    editModePolicies,
    highSeverityInsights,
    totalClaimsAmount,
    totalPaidAmount,
    denialRate,
    // Actions
    initialize,
    initializeFromDatabase,
    initializeFromJson,
    setUseDatabase,
    loadLearningMarkers,
    saveLearningMarkers,
    addLearningMarker,
    dismissInsight,
    getClaimById,
    getPolicyById,
    getInsightById,
  }
})
