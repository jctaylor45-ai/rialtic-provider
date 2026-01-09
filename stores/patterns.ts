import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pattern, PatternFilters, PatternCategory, ActionType, PatternAction, ActionCategory, RecoveryStatus } from '~/types/enhancements'

// Types for API response
interface DbPattern {
  id: string
  title: string
  description?: string
  category: string
  status: string
  tier: string
  scenarioId?: string
  scoreFrequency?: number
  scoreImpact?: number
  scoreTrend?: string
  scoreVelocity?: number
  scoreConfidence?: number
  scoreRecency?: number
  avgDenialAmount?: number
  totalAtRisk?: number
  learningProgress?: number
  practiceSessionsCompleted?: number
  correctionsApplied?: number
  suggestedAction?: string
  baselineStart?: string
  currentClaimCount?: number
  currentDenialRate?: number
  currentDollarsDenied?: number
  liveClaimCount?: number
  liveImpactAmount?: number
}

interface PatternApiResponse {
  data: DbPattern[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export const usePatternsStore = defineStore('patterns', () => {
  // State
  const patterns = ref<Pattern[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const useDatabase = ref(true)
  const pagination = ref({ total: 0, limit: 50, offset: 0, hasMore: false })
  const filters = ref<PatternFilters>({
    status: [],
    tier: [],
    category: [],
    actionCategory: [],
    recoveryStatus: [],
    minImpact: 0,
    search: '',
  })

  // Getters
  const filteredPatterns = computed(() => {
    let filtered = [...patterns.value]

    if (filters.value.status && filters.value.status.length > 0) {
      filtered = filtered.filter(p => filters.value.status!.includes(p.status))
    }

    if (filters.value.tier && filters.value.tier.length > 0) {
      filtered = filtered.filter(p => filters.value.tier!.includes(p.tier))
    }

    if (filters.value.category && filters.value.category.length > 0) {
      filtered = filtered.filter(p => filters.value.category!.includes(p.category))
    }

    if (filters.value.actionCategory && filters.value.actionCategory.length > 0) {
      filtered = filtered.filter(p => filters.value.actionCategory!.includes(p.actionCategory))
    }

    if (filters.value.recoveryStatus && filters.value.recoveryStatus.length > 0) {
      filtered = filtered.filter(p => filters.value.recoveryStatus!.includes(p.recoveryStatus))
    }

    if (filters.value.minImpact && filters.value.minImpact > 0) {
      filtered = filtered.filter(p => p.score.impact >= filters.value.minImpact!)
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      )
    }

    return filtered
  })

  const activePatterns = computed(() => patterns.value.filter(p => p.status === 'active'))
  const improvingPatterns = computed(() => patterns.value.filter(p => p.status === 'improving'))
  const resolvedPatterns = computed(() => patterns.value.filter(p => p.status === 'resolved'))

  const criticalPatterns = computed(() => patterns.value.filter(p => p.tier === 'critical'))
  const highPriorityPatterns = computed(() => patterns.value.filter(p => p.tier === 'high'))

  const totalPatternsDetected = computed(() => patterns.value.length)
  const totalAtRisk = computed(() => patterns.value.reduce((sum, p) => sum + p.totalAtRisk, 0))

  const avgLearningProgress = computed(() => {
    if (patterns.value.length === 0) return 0
    const total = patterns.value.reduce((sum, p) => sum + p.learningProgress, 0)
    return Math.round(total / patterns.value.length)
  })

  const recentlyImprovedPatterns = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return patterns.value.filter(p =>
      p.improvements.some(imp => new Date(imp.date) >= thirtyDaysAgo)
    ).sort((a, b) => {
      const aLatest = a.improvements[a.improvements.length - 1]?.date || ''
      const bLatest = b.improvements[b.improvements.length - 1]?.date || ''
      return new Date(bLatest).getTime() - new Date(aLatest).getTime()
    })
  })

  const patternsByImpact = computed(() =>
    [...patterns.value].sort((a, b) => b.score.impact - a.score.impact)
  )

  const patternsByFrequency = computed(() =>
    [...patterns.value].sort((a, b) => b.score.frequency - a.score.frequency)
  )

  const patternsNeedingPractice = computed(() =>
    [...patterns.value]
      .filter(p => p.status !== 'resolved')
      .sort((a, b) => a.learningProgress - b.learningProgress)
  )

  // Trend-based counts (score.trend: down=improving, stable=stable, up=regressing)
  const patternsImproving = computed(() =>
    patterns.value.filter(p => p.score.trend === 'down').length
  )
  const patternsStable = computed(() =>
    patterns.value.filter(p => p.score.trend === 'stable').length
  )
  const patternsRegressing = computed(() =>
    patterns.value.filter(p => p.score.trend === 'up').length
  )

  // Recovery status getters
  const recoverablePatterns = computed(() =>
    patterns.value.filter(p => p.recoveryStatus === 'recoverable')
  )
  const partiallyRecoverablePatterns = computed(() =>
    patterns.value.filter(p => p.recoveryStatus === 'partial')
  )
  const notRecoverablePatterns = computed(() =>
    patterns.value.filter(p => p.recoveryStatus === 'not_recoverable')
  )

  // Total recoverable revenue (sum of recoverableAmount for all patterns)
  const totalRecoverableRevenue = computed(() =>
    patterns.value.reduce((sum, p) => sum + (p.recoverableAmount || 0), 0)
  )

  // Total denied dollars (same as totalAtRisk, renamed for clarity)
  const totalDeniedDollars = computed(() =>
    patterns.value.reduce((sum, p) => sum + p.totalAtRisk, 0)
  )

  // Patterns by action category
  const getPatternsByActionCategory = (actionCategory: ActionCategory): Pattern[] =>
    patterns.value.filter(p => p.actionCategory === actionCategory)

  // Patterns by recovery status
  const getPatternsByRecoveryStatus = (recoveryStatus: RecoveryStatus): Pattern[] =>
    patterns.value.filter(p => p.recoveryStatus === recoveryStatus)

  // Actions
  async function loadPatterns() {
    isLoading.value = true
    error.value = null
    try {
      // Try to load from localStorage first
      loadSavedPatterns()

      // If we have saved patterns, we're done
      if (patterns.value.length > 0) {
        isLoading.value = false
        return
      }

      if (useDatabase.value) {
        await loadFromDatabase()
      } else {
        await loadFromJson()
      }
    } catch (err) {
      console.error('Failed to load patterns:', err)
      error.value = 'Failed to load pattern data'
      // Fallback to JSON if database fails
      if (useDatabase.value) {
        try {
          await loadFromJson()
          error.value = null
        } catch {
          // Keep the original error
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadFromDatabase() {
    const response = await $fetch<PatternApiResponse>('/api/v1/patterns')
    // Transform database patterns to match the frontend Pattern type
    patterns.value = response.data.map(transformDbPattern)
    pagination.value = response.pagination
  }

  async function loadFromJson() {
    const data = await $fetch<{ patterns: Pattern[] }>('/data/patterns.json')
    patterns.value = data.patterns
  }

  function transformDbPattern(dbPattern: DbPattern): Pattern {
    // Map database schema to frontend Pattern type
    const now = new Date().toISOString()
    return {
      id: dbPattern.id,
      title: dbPattern.title,
      description: dbPattern.description || '',
      category: dbPattern.category as PatternCategory,
      status: dbPattern.status as 'active' | 'improving' | 'resolved' | 'archived',
      tier: dbPattern.tier as 'critical' | 'high' | 'medium' | 'low',
      score: {
        frequency: dbPattern.scoreFrequency || 0,
        impact: dbPattern.scoreImpact || 0,
        trend: (dbPattern.scoreTrend as 'up' | 'down' | 'stable') || 'stable',
        velocity: dbPattern.scoreVelocity || 0,
        confidence: dbPattern.scoreConfidence || 0,
        recency: dbPattern.scoreRecency || 0,
      },
      avgDenialAmount: dbPattern.avgDenialAmount || 0,
      totalAtRisk: dbPattern.totalAtRisk || dbPattern.liveImpactAmount || 0,
      learningProgress: dbPattern.learningProgress || 0,
      practiceSessionsCompleted: dbPattern.practiceSessionsCompleted || 0,
      correctionsApplied: dbPattern.correctionsApplied || 0,
      suggestedAction: dbPattern.suggestedAction || '',
      affectedClaims: [],
      relatedPolicies: [],
      relatedCodes: [],
      improvements: [],
      actions: [],
      evidence: [],
      firstDetected: dbPattern.baselineStart || now,
      lastUpdated: now,
      lastSeen: now,
      actionCategory: 'process' as ActionCategory,
      recoveryStatus: 'recoverable' as RecoveryStatus,
      recoverableAmount: dbPattern.totalAtRisk || 0,
      recoverableClaimCount: dbPattern.liveClaimCount || dbPattern.currentClaimCount || 0,
      possibleRootCauses: [],
      shortTermAction: {
        description: dbPattern.suggestedAction || 'Review and correct the claim',
        canResubmit: true,
        claimCount: dbPattern.liveClaimCount || dbPattern.currentClaimCount || 0,
        amount: dbPattern.totalAtRisk || dbPattern.liveImpactAmount || 0,
      },
      longTermAction: {
        description: 'Implement process improvements to prevent future occurrences',
        steps: [],
      },
      detectionConfidence: dbPattern.scoreConfidence || 0.5,
    }
  }

  async function refreshPatterns(apiFilters?: { category?: string; status?: string; tier?: string }) {
    isLoading.value = true
    try {
      const response = await $fetch<PatternApiResponse>('/api/v1/patterns', {
        params: apiFilters
      })
      patterns.value = response.data.map(transformDbPattern)
      pagination.value = response.pagination
    } catch (err) {
      console.error('Failed to refresh patterns:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setUseDatabase(value: boolean) {
    useDatabase.value = value
  }

  function getPatternById(id: string): Pattern | undefined {
    return patterns.value.find(p => p.id === id)
  }

  function getPatternsByCategory(category: PatternCategory): Pattern[] {
    return patterns.value.filter(p => p.category === category)
  }

  function getPatternsByClaim(claimId: string): Pattern[] {
    return patterns.value.filter(p => p.affectedClaims.includes(claimId))
  }

  function getPatternsByPolicy(policyId: string): Pattern[] {
    return patterns.value.filter(p => p.relatedPolicies.includes(policyId))
  }

  function updateFilters(newFilters: Partial<PatternFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      status: [],
      tier: [],
      category: [],
      actionCategory: [],
      recoveryStatus: [],
      minImpact: 0,
      search: '',
    }
  }

  function recordPracticeSession(patternId: string, correctionsCount: number) {
    const pattern = getPatternById(patternId)
    if (!pattern) return

    pattern.practiceSessionsCompleted++

    const progressIncrease = Math.min(5 + correctionsCount * 2, 15)
    pattern.learningProgress = Math.min(100, pattern.learningProgress + progressIncrease)

    if (pattern.learningProgress >= 85 && pattern.status === 'improving') {
      pattern.status = 'resolved'
    } else if (pattern.learningProgress >= 30 && pattern.status === 'active') {
      pattern.status = 'improving'
    }

    pattern.lastUpdated = new Date().toISOString()
  }

  function recordCorrection(patternId: string) {
    const pattern = getPatternById(patternId)
    if (!pattern) return

    pattern.correctionsApplied++
    pattern.lastUpdated = new Date().toISOString()
  }

  function recordAction(patternId: string, actionType: ActionType, notes?: string) {
    const pattern = getPatternById(patternId)
    if (!pattern) return

    const action: PatternAction = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType,
      notes,
    }

    pattern.actions.push(action)
    pattern.lastUpdated = new Date().toISOString()

    if (pattern.status === 'active') {
      pattern.status = 'improving'
    }

    savePatterns()
  }

  function savePatterns() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('patterns', JSON.stringify(patterns.value))
    }
  }

  function loadSavedPatterns() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('patterns')
      if (saved) {
        try {
          patterns.value = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load saved patterns:', e)
        }
      }
    }
  }

  return {
    // State
    patterns,
    isLoading,
    error,
    filters,
    useDatabase,
    pagination,
    // Getters
    filteredPatterns,
    activePatterns,
    improvingPatterns,
    resolvedPatterns,
    criticalPatterns,
    highPriorityPatterns,
    totalPatternsDetected,
    totalAtRisk,
    avgLearningProgress,
    recentlyImprovedPatterns,
    patternsByImpact,
    patternsByFrequency,
    patternsNeedingPractice,
    // Trend-based counts
    patternsImproving,
    patternsStable,
    patternsRegressing,
    // Recovery status getters
    recoverablePatterns,
    partiallyRecoverablePatterns,
    notRecoverablePatterns,
    totalRecoverableRevenue,
    totalDeniedDollars,
    // Actions
    loadPatterns,
    loadFromDatabase,
    loadFromJson,
    refreshPatterns,
    setUseDatabase,
    getPatternById,
    getPatternsByCategory,
    getPatternsByActionCategory,
    getPatternsByRecoveryStatus,
    getPatternsByClaim,
    getPatternsByPolicy,
    updateFilters,
    clearFilters,
    recordPracticeSession,
    recordCorrection,
    recordAction,
    savePatterns,
    loadSavedPatterns,
  }
})
