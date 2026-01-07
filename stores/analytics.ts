import { defineStore } from 'pinia'
import { usePatternsStore } from './patterns'
import { useEventsStore } from './events'
import type { PracticeROI, DashboardMetrics, ProcedureCodeIntelligence } from '~/types/enhancements'
import { calculatePracticeROI, calculateMetricTrend } from '~/utils/analytics'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    codeIntelligence: new Map<string, ProcedureCodeIntelligence>(),
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    // Calculate ROI from patterns and events
    practiceROI(): PracticeROI {
      const patternsStore = usePatternsStore()
      const eventsStore = useEventsStore()

      return calculatePracticeROI(patternsStore.patterns, eventsStore.events)
    },

    // Dashboard metrics
    dashboardMetrics(): DashboardMetrics {
      const appStore = useAppStore()
      const patternsStore = usePatternsStore()
      const eventsStore = useEventsStore()

      const totalClaims = appStore.claims.length
      const approvedClaims = appStore.claims.filter(c => c.status === 'approved' || c.status === 'paid').length
      const deniedClaims = appStore.claims.filter(c => c.status === 'denied').length
      const pendingClaims = appStore.claims.filter(c => c.status === 'pending').length

      const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0
      const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

      const totalBilled = appStore.claims.reduce((sum, c) => sum + c.billedAmount, 0)
      const totalPaid = appStore.claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0)
      const totalDenied = appStore.claims
        .filter(c => c.status === 'denied')
        .reduce((sum, c) => sum + c.billedAmount, 0)

      // Calculate historical metrics for trends (last 30 days vs previous 30 days)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const recentClaims = appStore.claims.filter(c =>
        c.submissionDate && new Date(c.submissionDate) >= thirtyDaysAgo
      )
      const previousClaims = appStore.claims.filter(c => {
        if (!c.submissionDate) return false
        const date = new Date(c.submissionDate)
        return date >= sixtyDaysAgo && date < thirtyDaysAgo
      })

      const recentApprovalRate = recentClaims.length > 0
        ? (recentClaims.filter(c => c.status === 'approved' || c.status === 'paid').length / recentClaims.length) * 100
        : 0

      const previousApprovalRate = previousClaims.length > 0
        ? (previousClaims.filter(c => c.status === 'approved' || c.status === 'paid').length / previousClaims.length) * 100
        : 0

      const recentDenialRate = recentClaims.length > 0
        ? (recentClaims.filter(c => c.status === 'denied').length / recentClaims.length) * 100
        : 0

      const previousDenialRate = previousClaims.length > 0
        ? (previousClaims.filter(c => c.status === 'denied').length / previousClaims.length) * 100
        : 0

      const recentAvgReimbursement = recentClaims.length > 0
        ? recentClaims.reduce((sum, c) => sum + (c.paidAmount || 0), 0) / recentClaims.length
        : 0

      const previousAvgReimbursement = previousClaims.length > 0
        ? previousClaims.reduce((sum, c) => sum + (c.paidAmount || 0), 0) / previousClaims.length
        : 0

      const recentPracticeSessions = eventsStore.events.filter(e =>
        e.type === 'practice-completed' && new Date(e.timestamp) >= thirtyDaysAgo
      ).length

      const previousPracticeSessions = eventsStore.events.filter(e => {
        const date = new Date(e.timestamp)
        return e.type === 'practice-completed' && date >= sixtyDaysAgo && date < thirtyDaysAgo
      }).length

      return {
        totalClaims,
        approvalRate,
        denialRate,
        pendingClaims,
        totalBilled,
        totalPaid,
        totalDenied,
        estimatedRecoverable: patternsStore.totalAtRisk,
        patternsDetected: patternsStore.totalPatternsDetected,
        patternsResolved: patternsStore.resolvedPatterns.length,
        learningEvents: eventsStore.totalEvents,
        practiceSessions: eventsStore.totalPracticeSessions,
        trends: {
          approvalRate: calculateMetricTrend(recentApprovalRate, previousApprovalRate),
          denialRate: calculateMetricTrend(recentDenialRate, previousDenialRate),
          avgReimbursement: calculateMetricTrend(recentAvgReimbursement, previousAvgReimbursement),
          practiceSessions: calculateMetricTrend(recentPracticeSessions, previousPracticeSessions),
        },
      }
    },

    // ROI Summary Stats
    totalSavings(): number {
      return this.practiceROI.estimatedSavings
    },

    totalPracticeSessions(): number {
      return this.practiceROI.totalPracticeSessions
    },

    totalTimeInvested(): number {
      return this.practiceROI.totalTimeInvested
    },

    savingsPerHour(): number {
      const hours = this.totalTimeInvested / 60
      return hours > 0 ? Math.round(this.totalSavings / hours) : 0
    },

    // Get code intelligence for a specific procedure code
    getCodeIntelligence: (state) => (code: string): ProcedureCodeIntelligence | undefined => {
      return state.codeIntelligence.get(code)
    },

    // Get all available procedure codes
    availableCodes(): string[] {
      return Array.from(this.codeIntelligence.keys())
    },
  },

  actions: {
    async loadCodeIntelligence() {
      this.isLoading = true
      this.error = null
      try {
        const data = await $fetch<{ codeIntelligence: ProcedureCodeIntelligence[] }>('/data/codeIntelligence.json')

        // Convert array to Map for fast lookup
        this.codeIntelligence.clear()
        data.codeIntelligence.forEach(intel => {
          this.codeIntelligence.set(intel.code, intel)
        })
      } catch (error) {
        console.error('Failed to load code intelligence:', error)
        this.error = 'Failed to load code intelligence data'
      } finally {
        this.isLoading = false
      }
    },

    async initialize() {
      await this.loadCodeIntelligence()
    },

    // Calculate ROI for a specific pattern
    calculatePatternROI(patternId: string) {
      const patternsStore = usePatternsStore()
      const pattern = patternsStore.getPatternById(patternId)

      if (!pattern) return 0

      const resolutionRate = pattern.learningProgress / 100
      const potentialSavings = pattern.score.frequency * pattern.avgDenialAmount
      return Math.round(potentialSavings * resolutionRate)
    },

    // Get improvement percentage for a pattern
    getPatternImprovement(patternId: string): number {
      const patternsStore = usePatternsStore()
      const pattern = patternsStore.getPatternById(patternId)

      if (!pattern || pattern.improvements.length === 0) return 0

      const latestImprovement = pattern.improvements[pattern.improvements.length - 1]
      return latestImprovement ? Math.abs(latestImprovement.percentChange) : 0
    },

    // Get performance metrics for a specific time period
    getPerformanceMetrics(startDate: string, endDate: string) {
      const appStore = useAppStore()
      const eventsStore = useEventsStore()

      const start = new Date(startDate)
      const end = new Date(endDate)

      const periodClaims = appStore.claims.filter(c => {
        if (!c.submissionDate) return false
        const date = new Date(c.submissionDate)
        return date >= start && date <= end
      })

      const periodEvents = eventsStore.events.filter(e => {
        const date = new Date(e.timestamp)
        return date >= start && date <= end
      })

      const approvalRate = periodClaims.length > 0
        ? (periodClaims.filter(c => c.status === 'approved' || c.status === 'paid').length / periodClaims.length) * 100
        : 0

      const denialRate = periodClaims.length > 0
        ? (periodClaims.filter(c => c.status === 'denied').length / periodClaims.length) * 100
        : 0

      const practiceSessions = periodEvents.filter(e => e.type === 'practice-completed').length

      return {
        totalClaims: periodClaims.length,
        approvalRate: Math.round(approvalRate * 10) / 10,
        denialRate: Math.round(denialRate * 10) / 10,
        practiceSessions,
        totalBilled: periodClaims.reduce((sum, c) => sum + c.billedAmount, 0),
        totalPaid: periodClaims.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      }
    },

    // Generate monthly performance report
    getMonthlyReport(year: number, month: number) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      return this.getPerformanceMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      )
    },
  },
})
