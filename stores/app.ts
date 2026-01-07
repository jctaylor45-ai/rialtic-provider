import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Claim, Policy, Insight, LearningMarker } from '~/types'

export const useAppStore = defineStore('app', () => {
  // State
  const claims = ref<Claim[]>([])
  const policies = ref<Policy[]>([])
  const insights = ref<Insight[]>([])
  const learningMarkers = ref<LearningMarker[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const deniedClaims = computed(() => claims.value.filter(c => c.status === 'denied'))
  const approvedClaims = computed(() => claims.value.filter(c => c.status === 'approved'))
  const pendingClaims = computed(() => claims.value.filter(c => c.status === 'pending'))
  const editModePolicies = computed(() => policies.value.filter(p => p.mode === 'Edit'))
  const highSeverityInsights = computed(() => insights.value.filter(i => i.severity === 'high' && !i.dismissed))

  const totalClaimsAmount = computed(() => claims.value.reduce((sum, c) => sum + c.billedAmount, 0))
  const totalPaidAmount = computed(() => claims.value.reduce((sum, c) => sum + (c.paidAmount || 0), 0))
  const denialRate = computed(() => {
    if (claims.value.length === 0) return 0
    const deniedCount = claims.value.filter(c => c.status === 'denied').length
    return (deniedCount / claims.value.length) * 100
  })

  // Actions
  async function initialize() {
    isLoading.value = true
    try {
      const [claimsData, policiesData, insightsData] = await Promise.all([
        $fetch<{ claims: Claim[] }>('/data/claims.json'),
        $fetch<Policy[]>('/data/policies.json'),
        $fetch<Insight[]>('/data/insights.json'),
      ])

      claims.value = claimsData.claims
      policies.value = policiesData
      insights.value = insightsData

      loadLearningMarkers()
    } catch (err) {
      console.error('Failed to initialize data:', err)
      error.value = 'Failed to load data'
    } finally {
      isLoading.value = false
    }
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

  function getClaimById(id: string): Claim | undefined {
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
    isLoading,
    error,
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
    loadLearningMarkers,
    saveLearningMarkers,
    addLearningMarker,
    dismissInsight,
    getClaimById,
    getPolicyById,
    getInsightById,
  }
})
