import { defineStore } from 'pinia'
import type { Claim, Policy, Insight, LearningMarker } from '~/types'

export const useAppStore = defineStore('app', {
  state: () => ({
    claims: [] as Claim[],
    policies: [] as Policy[],
    insights: [] as Insight[],
    learningMarkers: [] as LearningMarker[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    // Claims getters
    deniedClaims: (state) => state.claims.filter(c => c.status === 'denied'),
    approvedClaims: (state) => state.claims.filter(c => c.status === 'approved'),
    pendingClaims: (state) => state.claims.filter(c => c.status === 'pending'),

    // Policy getters
    editModePolicies: (state) => state.policies.filter(p => p.mode === 'Edit'),

    // Insight getters
    highSeverityInsights: (state) => state.insights.filter(i => i.severity === 'high' && !i.dismissed),

    // Stats
    totalClaimsAmount: (state) => state.claims.reduce((sum, c) => sum + c.billedAmount, 0),
    totalPaidAmount: (state) => state.claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
    denialRate: (state) => {
      if (state.claims.length === 0) return 0
      const deniedCount = state.claims.filter(c => c.status === 'denied').length
      return (deniedCount / state.claims.length) * 100
    },
  },

  actions: {
    // Initialize data
    async initialize() {
      this.isLoading = true
      try {
        // Load data from JSON files
        const [claimsData, policiesData, insightsData] = await Promise.all([
          $fetch<Claim[]>('/data/claims.json'),
          $fetch<Policy[]>('/data/policies.json'),
          $fetch<Insight[]>('/data/insights.json'),
        ])

        this.claims = claimsData
        this.policies = policiesData
        this.insights = insightsData

        // Load learning markers from localStorage
        this.loadLearningMarkers()
      } catch (error) {
        console.error('Failed to initialize data:', error)
        this.error = 'Failed to load data'
      } finally {
        this.isLoading = false
      }
    },

    // Learning markers
    loadLearningMarkers() {
      if (import.meta.client) {
        const stored = localStorage.getItem('learningMarkers')
        if (stored) {
          try {
            this.learningMarkers = JSON.parse(stored)
          } catch (error) {
            console.error('Failed to parse learning markers:', error)
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

    // Get claim by ID
    getClaimById(id: string): Claim | undefined {
      return this.claims.find(c => c.id === id)
    },

    // Get policy by ID
    getPolicyById(id: string): Policy | undefined {
      return this.policies.find(p => p.id === id)
    },

    // Get insight by ID
    getInsightById(id: string): Insight | undefined {
      return this.insights.find(i => i.id === id)
    },
  },
})
