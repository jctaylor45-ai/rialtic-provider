import { defineStore } from 'pinia'
import type { Pattern, PatternFilters, PatternStatus, PatternTier, PatternCategory } from '~/types/enhancements'

export const usePatternsStore = defineStore('patterns', {
  state: () => ({
    patterns: [] as Pattern[],
    isLoading: false,
    error: null as string | null,
    filters: {
      status: [],
      tier: [],
      category: [],
      minImpact: 0,
      search: '',
    } as PatternFilters,
  }),

  getters: {
    // Filter patterns based on active filters
    filteredPatterns: (state) => {
      let filtered = [...state.patterns]

      // Status filter
      if (state.filters.status && state.filters.status.length > 0) {
        filtered = filtered.filter(p => state.filters.status!.includes(p.status))
      }

      // Tier filter
      if (state.filters.tier && state.filters.tier.length > 0) {
        filtered = filtered.filter(p => state.filters.tier!.includes(p.tier))
      }

      // Category filter
      if (state.filters.category && state.filters.category.length > 0) {
        filtered = filtered.filter(p => state.filters.category!.includes(p.category))
      }

      // Min impact filter
      if (state.filters.minImpact && state.filters.minImpact > 0) {
        filtered = filtered.filter(p => p.score.impact >= state.filters.minImpact!)
      }

      // Search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
        )
      }

      return filtered
    },

    // Patterns by status
    activePatterns: (state) => state.patterns.filter(p => p.status === 'active'),
    improvingPatterns: (state) => state.patterns.filter(p => p.status === 'improving'),
    resolvedPatterns: (state) => state.patterns.filter(p => p.status === 'resolved'),

    // Patterns by tier
    criticalPatterns: (state) => state.patterns.filter(p => p.tier === 'critical'),
    highPriorityPatterns: (state) => state.patterns.filter(p => p.tier === 'high'),

    // Stats
    totalPatternsDetected: (state) => state.patterns.length,
    totalAtRisk: (state) => state.patterns.reduce((sum, p) => sum + p.totalAtRisk, 0),
    avgLearningProgress: (state) => {
      if (state.patterns.length === 0) return 0
      const total = state.patterns.reduce((sum, p) => sum + p.learningProgress, 0)
      return Math.round(total / state.patterns.length)
    },

    // Get patterns that have recent improvements
    recentlyImprovedPatterns: (state) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      return state.patterns.filter(p =>
        p.improvements.some(imp => new Date(imp.date) >= thirtyDaysAgo)
      ).sort((a, b) => {
        const aLatest = a.improvements[a.improvements.length - 1]?.date || ''
        const bLatest = b.improvements[b.improvements.length - 1]?.date || ''
        return new Date(bLatest).getTime() - new Date(aLatest).getTime()
      })
    },

    // Get patterns ordered by impact
    patternsByImpact: (state) => {
      return [...state.patterns].sort((a, b) => b.score.impact - a.score.impact)
    },

    // Get patterns ordered by frequency
    patternsByFrequency: (state) => {
      return [...state.patterns].sort((a, b) => b.score.frequency - a.score.frequency)
    },

    // Get patterns ordered by learning progress (lowest first - needs most practice)
    patternsNeedingPractice: (state) => {
      return [...state.patterns]
        .filter(p => p.status !== 'resolved')
        .sort((a, b) => a.learningProgress - b.learningProgress)
    },
  },

  actions: {
    async loadPatterns() {
      this.isLoading = true
      this.error = null
      try {
        // First, try to load from localStorage
        this.loadSavedPatterns()

        // If no saved patterns, load from JSON
        if (this.patterns.length === 0) {
          const data = await $fetch<{ patterns: Pattern[] }>('/data/patterns.json')
          this.patterns = data.patterns
        }
      } catch (error) {
        console.error('Failed to load patterns:', error)
        this.error = 'Failed to load pattern data'
      } finally {
        this.isLoading = false
      }
    },

    getPatternById(id: string): Pattern | undefined {
      return this.patterns.find(p => p.id === id)
    },

    getPatternsByCategory(category: PatternCategory): Pattern[] {
      return this.patterns.filter(p => p.category === category)
    },

    getPatternsByClaim(claimId: string): Pattern[] {
      return this.patterns.filter(p =>
        p.affectedClaims.includes(claimId)
      )
    },

    getPatternsByPolicy(policyId: string): Pattern[] {
      return this.patterns.filter(p =>
        p.relatedPolicies.includes(policyId)
      )
    },

    updateFilters(filters: Partial<PatternFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {
        status: [],
        tier: [],
        category: [],
        minImpact: 0,
        search: '',
      }
    },

    // Simulate pattern improvement (for demo/practice sessions)
    recordPracticeSession(patternId: string, correctionsCount: number) {
      const pattern = this.getPatternById(patternId)
      if (!pattern) return

      // Increment practice sessions
      pattern.practiceSessionsCompleted++

      // Increase learning progress (cap at 100)
      const progressIncrease = Math.min(5 + correctionsCount * 2, 15)
      pattern.learningProgress = Math.min(100, pattern.learningProgress + progressIncrease)

      // Update status based on learning progress
      if (pattern.learningProgress >= 85 && pattern.status === 'improving') {
        pattern.status = 'resolved'
      } else if (pattern.learningProgress >= 30 && pattern.status === 'active') {
        pattern.status = 'improving'
      }

      // Update last updated timestamp
      pattern.lastUpdated = new Date().toISOString()
    },

    recordCorrection(patternId: string) {
      const pattern = this.getPatternById(patternId)
      if (!pattern) return

      pattern.correctionsApplied++
      pattern.lastUpdated = new Date().toISOString()
    },

    recordAction(patternId: string, actionType: import('~/types/enhancements').ActionType, notes?: string) {
      const pattern = this.getPatternById(patternId)
      if (!pattern) return

      const action: import('~/types/enhancements').PatternAction = {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actionType,
        notes,
      }

      pattern.actions.push(action)
      pattern.lastUpdated = new Date().toISOString()

      // Mark pattern as "improving" if it was "active"
      if (pattern.status === 'active') {
        pattern.status = 'improving'
      }

      // Save patterns to localStorage
      this.savePatterns()
    },

    savePatterns() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('patterns', JSON.stringify(this.patterns))
      }
    },

    loadSavedPatterns() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('patterns')
        if (saved) {
          try {
            this.patterns = JSON.parse(saved)
          } catch (e) {
            console.error('Failed to load saved patterns:', e)
          }
        }
      }
    },
  },
})
