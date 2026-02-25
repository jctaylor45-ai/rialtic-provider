import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pattern, PatternFilters, PatternCategory, ActionType, PatternAction, ActionCategory, RecoveryStatus } from '~/types/enhancements'
import { getAppConfig } from '~/config/appConfig'
import type { PatternTier } from '~/types/enhancements'

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
  baselineDenialRate?: number
  currentClaimCount?: number
  currentDenialRate?: number
  currentDollarsDenied?: number
  liveClaimCount?: number
  liveLineCount?: number
  liveImpactAmount?: number
  liveTotalAtRisk?: number
  liveTotalBilled?: number
  appealCount?: number
  overturnedCount?: number
  appealRate?: number
  // Related data from API
  relatedPolicies?: Array<{
    policyId: string
    policyName: string
    policyMode: string
    fixGuidance?: string
    commonMistake?: string
    logicType?: string
  }>
  affectedClaims?: string[]
  recoveryStatus?: string
  actionCategory?: string
  shortTermDescription?: string
  shortTermCanResubmit?: number
  longTermDescription?: string
  longTermSteps?: string
  denialReason?: string
  relatedCodes?: string[]
  actions?: Array<{
    id: string
    actionType: string
    notes?: string
    timestamp?: string
  }>
  evidence?: Array<{
    claimId: string
    procedureCode?: string
    modifier?: string
    billedAmount?: number
    denialDate?: string
    denialReason?: string
  }>
  snapshots?: Array<{
    month: string
    denialRate?: number
    dollarsDenied?: number
    claimCount?: number
    deniedCount?: number
  }>
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
  // Use configurable pagination limit
  const paginationLimit = getAppConfig().ui.paginationLimit
  const pagination = ref({ total: 0, limit: paginationLimit, offset: 0, hasMore: false })
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
      // Always fetch fresh data from API/database
      if (useDatabase.value) {
        await loadFromDatabase()
      } else {
        await loadFromJson()
      }

      // Merge any saved actions/progress from localStorage
      mergeLocalPatternState()
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

  // Merge saved pattern state (actions, progress) with fresh API data
  function mergeLocalPatternState() {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem('patterns')
    if (!saved) return

    try {
      const savedPatterns: Pattern[] = JSON.parse(saved)
      const savedMap = new Map(savedPatterns.map(p => [p.id, p]))

      // Merge user-generated data (actions, progress) into fresh patterns
      patterns.value = patterns.value.map(pattern => {
        const savedPattern = savedMap.get(pattern.id)
        if (savedPattern) {
          return {
            ...pattern,
            actions: savedPattern.actions || [],
            learningProgress: savedPattern.learningProgress || pattern.learningProgress,
            practiceSessionsCompleted: savedPattern.practiceSessionsCompleted || pattern.practiceSessionsCompleted,
            correctionsApplied: savedPattern.correctionsApplied || pattern.correctionsApplied,
          }
        }
        return pattern
      })
    } catch (e) {
      console.error('Failed to merge saved pattern state:', e)
    }
  }

  async function loadFromDatabase() {
    const params: Record<string, string | number> = { limit: 0 }
    const appStore = useAppStore()
    if (appStore.selectedPracticeId) {
      params.scenario_id = appStore.selectedPracticeId
    }
    params.days = appStore.selectedTimeRange
    const response = await $fetch<PatternApiResponse>('/api/v1/patterns', { params })
    // Transform database patterns to match the frontend Pattern type
    const transformed = response.data.map(transformDbPattern)
    assignTiersByPercentile(transformed)
    patterns.value = transformed
    pagination.value = response.pagination
  }

  async function loadFromJson() {
    const data = await $fetch<{ patterns: Pattern[] }>('/data/patterns.json')
    patterns.value = data.patterns
  }

  // Generate long-term action steps based on related policies
  function generateLongTermSteps(relatedPolicies: DbPattern['relatedPolicies']): string[] {
    if (!relatedPolicies || relatedPolicies.length === 0) {
      return [
        'Review denial patterns with coding team',
        'Update internal coding guidelines',
        'Implement pre-submission validation checks',
      ]
    }

    const steps: string[] = []

    // Add policy-specific guidance
    for (const policy of relatedPolicies) {
      if (policy.fixGuidance) {
        steps.push(policy.fixGuidance)
      }
    }

    // Add common prevention steps based on logic type
    const logicTypes = new Set(relatedPolicies.map(p => p.logicType).filter(Boolean))

    if (logicTypes.has('Modifier')) {
      steps.push('Train staff on modifier usage requirements')
      steps.push('Add modifier validation to EHR/billing system')
    }
    if (logicTypes.has('Authorization')) {
      steps.push('Verify authorization requirements before scheduling services')
      steps.push('Implement authorization tracking workflow')
    }
    if (logicTypes.has('Medical Necessity')) {
      steps.push('Ensure documentation supports medical necessity')
      steps.push('Review LCD/NCD coverage requirements')
    }

    // Deduplicate and limit to 5 steps
    return [...new Set(steps)].slice(0, 5)
  }

  function transformDbPattern(dbPattern: DbPattern): Pattern {
    // Map database schema to frontend Pattern type
    const now = new Date().toISOString()

    // Use live data from API if available
    const liveTotalAtRisk = dbPattern.liveTotalAtRisk || dbPattern.totalAtRisk || dbPattern.liveImpactAmount || 0
    const liveClaimCount = dbPattern.affectedClaims?.length || dbPattern.liveClaimCount || dbPattern.currentClaimCount || 0

    // Extract policy IDs from related policies
    const relatedPolicyIds = dbPattern.relatedPolicies?.map(p => p.policyId) || []

    const patternActionCategory = (dbPattern.actionCategory || 'coding_knowledge') as ActionCategory
    const patternRecoveryStatus = (dbPattern.recoveryStatus || 'recoverable') as RecoveryStatus

    // Compute trend, velocity, recency, and denial rate from snapshots
    // Uses ALL available snapshots: compares avg of first third (baseline) vs last third (current)
    const snapshots = dbPattern.snapshots || []
    let liveTrend: 'up' | 'down' | 'stable' = 'stable'
    let liveVelocity = 0
    let liveRecency = 0
    let liveDenialRate = 0

    if (snapshots.length >= 2) {
      const latest = snapshots[snapshots.length - 1]!

      // Denial rate: most recent snapshot
      liveDenialRate = Math.round((latest.denialRate ?? 0) * 100) / 100

      // Recency: days since the most recent snapshot
      if (latest.month) {
        const snapshotDate = new Date(latest.month)
        const nowDate = new Date()
        liveRecency = Math.max(0, Math.round((nowDate.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24)))
      }

      // Split into thirds for trend: first third = baseline, last third = current
      const thirdSize = Math.max(1, Math.floor(snapshots.length / 3))
      const firstThird = snapshots.slice(0, thirdSize)
      const lastThird = snapshots.slice(-thirdSize)

      const avgFirst = firstThird.reduce((sum, s) => sum + (s.denialRate ?? 0), 0) / firstThird.length
      const avgLast = lastThird.reduce((sum, s) => sum + (s.denialRate ?? 0), 0) / lastThird.length
      const rateDiff = avgLast - avgFirst

      // Trend: ±0.5pp threshold
      if (rateDiff > 0.5) {
        liveTrend = 'up'
      } else if (rateDiff < -0.5) {
        liveTrend = 'down'
      }

      // Velocity: pp/month between midpoints of first and last thirds
      const firstMidIdx = Math.floor(firstThird.length / 2)
      const lastMidIdx = snapshots.length - thirdSize + Math.floor(lastThird.length / 2)
      const monthsBetween = lastMidIdx - firstMidIdx
      liveVelocity = monthsBetween > 0 ? Math.round((rateDiff / monthsBetween) * 100) / 100 : 0
    } else if (snapshots.length === 1) {
      liveDenialRate = Math.round((snapshots[0]!.denialRate ?? 0) * 100) / 100
    }

    // Compute score with live data (tier assigned later in batch by percentile)
    const score = {
      frequency: dbPattern.liveLineCount || 0,
      impact: liveTotalAtRisk,
      trend: liveTrend,
      velocity: liveVelocity,
      confidence: dbPattern.scoreConfidence || 0,
      recency: liveRecency,
    }

    return {
      id: dbPattern.id,
      title: dbPattern.title,
      description: dbPattern.description || '',
      category: dbPattern.category as PatternCategory,
      status: dbPattern.status as 'active' | 'improving' | 'resolved' | 'archived',
      tier: 'medium' as const, // placeholder — reassigned by assignTiersByPercentile()
      score,
      avgDenialAmount: dbPattern.avgDenialAmount || 0,
      totalAtRisk: liveTotalAtRisk,
      baselineDenialRate: (dbPattern.baselineDenialRate ?? 0) * 100,
      currentDenialRate: liveDenialRate,
      currentDollarsDenied: dbPattern.currentDollarsDenied,
      appealCount: dbPattern.appealCount || 0,
      overturnedCount: dbPattern.overturnedCount || 0,
      appealRate: dbPattern.appealRate || 0,
      learningProgress: dbPattern.learningProgress || 0,
      practiceSessionsCompleted: dbPattern.practiceSessionsCompleted || 0,
      correctionsApplied: dbPattern.correctionsApplied || 0,
      suggestedAction: dbPattern.suggestedAction || '',
      affectedClaims: dbPattern.affectedClaims || [],
      relatedPolicies: relatedPolicyIds,
      relatedCodes: dbPattern.relatedCodes || [],
      improvements: [],
      actions: (dbPattern.actions || []).map(a => ({
        id: a.id,
        timestamp: a.timestamp || now,
        actionType: a.actionType as ActionType,
        notes: a.notes,
      })),
      evidence: (dbPattern.evidence || []).map(e => ({
        claimId: e.claimId,
        denialDate: e.denialDate || '',
        denialReason: e.denialReason || dbPattern.denialReason || '',
        billedAmount: e.billedAmount || 0,
        procedureCode: e.procedureCode,
        modifier: e.modifier,
      })),
      firstDetected: dbPattern.baselineStart || now,
      lastUpdated: now,
      lastSeen: now,
      actionCategory: patternActionCategory,
      recoveryStatus: patternRecoveryStatus,
      recoverableAmount: patternRecoveryStatus === 'not_recoverable' ? 0
        : patternRecoveryStatus === 'partial' ? liveTotalAtRisk * 0.5
        : liveTotalAtRisk,
      recoverableClaimCount: patternRecoveryStatus === 'not_recoverable' ? 0
        : patternRecoveryStatus === 'partial' ? Math.round(liveClaimCount * 0.5)
        : liveClaimCount,
      possibleRootCauses: dbPattern.relatedPolicies?.filter(p => p.commonMistake).map(p => ({
        category: patternActionCategory,
        confidence: 'high' as const,
        signals: [p.policyName],
        explanation: p.commonMistake || '',
      })) || [],
      shortTermAction: {
        description: dbPattern.shortTermDescription ||
          dbPattern.suggestedAction ||
          dbPattern.relatedPolicies?.[0]?.fixGuidance ||
          'Review and correct the claim before resubmission',
        canResubmit: dbPattern.shortTermCanResubmit != null
          ? Boolean(dbPattern.shortTermCanResubmit)
          : true,
        claimCount: liveClaimCount,
        amount: liveTotalAtRisk,
      },
      longTermAction: {
        description: dbPattern.longTermDescription || 'Implement process improvements to prevent future denials',
        steps: dbPattern.longTermSteps
          ? JSON.parse(dbPattern.longTermSteps) as string[]
          : generateLongTermSteps(dbPattern.relatedPolicies || []),
      },
      snapshots: dbPattern.snapshots || [],
      detectionConfidence: dbPattern.scoreConfidence || 0.5,
    }
  }

  /**
   * Assign tiers by percentile cutoffs of totalAtRisk (live impact).
   * Sorts all values descending, computes p75/p50/p25 cutoffs, assigns:
   *   >= p75 → critical, >= p50 → high, >= p25 → medium, < p25 → low
   * Edge cases: all equal → medium, fewer than 4 → rank, totalAtRisk=0 → low
   */
  function assignTiersByPercentile(items: Pattern[]): void {
    if (items.length === 0) return

    // Edge case: fewer than 4 patterns — just rank them
    if (items.length < 4) {
      const ranked = [...items].sort((a, b) => b.totalAtRisk - a.totalAtRisk)
      const tierOrder: PatternTier[] = ['critical', 'high', 'medium', 'low']
      for (let i = 0; i < ranked.length; i++) {
        ranked[i]!.tier = ranked[i]!.totalAtRisk === 0 ? 'low' : tierOrder[i]!
      }
      return
    }

    // Collect and sort values descending
    const values = items.map(p => p.totalAtRisk).sort((a, b) => b - a)

    // Edge case: all values equal
    if (values[0] === values[values.length - 1]) {
      for (const item of items) {
        item.tier = item.totalAtRisk === 0 ? 'low' : 'medium'
      }
      return
    }

    // Compute percentile cutoffs using the sorted values
    const n = values.length
    const p75 = values[Math.floor(n * 0.25)]!  // value at 25th rank position = top 25% cutoff
    const p50 = values[Math.floor(n * 0.50)]!  // median
    const p25 = values[Math.floor(n * 0.75)]!  // value at 75th rank position = bottom 25% cutoff

    for (const item of items) {
      if (item.totalAtRisk === 0) {
        item.tier = 'low'
      } else if (item.totalAtRisk >= p75) {
        item.tier = 'critical'
      } else if (item.totalAtRisk >= p50) {
        item.tier = 'high'
      } else if (item.totalAtRisk >= p25) {
        item.tier = 'medium'
      } else {
        item.tier = 'low'
      }
    }
  }

  async function refreshPatterns(apiFilters?: { category?: string; status?: string; tier?: string }) {
    isLoading.value = true
    try {
      const params: Record<string, string | number | undefined> = { ...apiFilters }
      const appStore = useAppStore()
      if (appStore.selectedPracticeId) {
        params.scenario_id = appStore.selectedPracticeId
      }
      params.days = appStore.selectedTimeRange
      const response = await $fetch<PatternApiResponse>('/api/v1/patterns', {
        params,
      })
      const transformed = response.data.map(transformDbPattern)
      assignTiersByPercentile(transformed)
      patterns.value = transformed
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
          const parsed: Pattern[] = JSON.parse(saved)
          assignTiersByPercentile(parsed)
          patterns.value = parsed
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
