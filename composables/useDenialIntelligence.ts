/**
 * Denial Intelligence composable
 * Merges active patterns and inactive policies into a unified list
 * with filtering, sorting, URL state, drawer state, and summary stats
 */

import type {
  DenialIntelligenceItem,
  ActiveDenialItem,
  InactiveDenialItem,
} from '~/types/denial-intelligence'
import type { Policy } from '~/types/policy'

export function useDenialIntelligence() {
  const appStore = useAppStore()
  const patternsStore = usePatternsStore()
  const route = useRoute()
  const router = useRouter()

  // URL-persisted filter state
  const {
    normalizedParams,
    setUrlParam,
    setUrlParamDebounced,
    clearUrlParams,
    hasActiveFilters,
    activeFilterCount,
  } = useUrlParamsState({
    excludeKeys: ['pattern', 'policy', 'view', 'showAll'],
    defaults: {
      topic: 'all',
      source: 'all',
      tier: 'all',
      status: 'all',
      recoveryStatus: 'all',
    },
  })

  // URL-persisted sort state
  const { sortState, setSortState } = useUrlSortState({
    defaultColumn: 'impact',
    defaultDirection: 'desc',
  })

  // Local refs synced to URL
  const searchQuery = ref('')
  const filterTopic = ref('all')
  const filterSource = ref('all')
  const filterTier = ref('all')
  const filterStatus = ref('all')
  const filterRecoveryStatus = ref('all')

  // View mode (card/table)
  const viewMode = computed<'card' | 'table'>(() => {
    return route.query.view === 'table' ? 'table' : 'card'
  })

  const setViewMode = (mode: 'card' | 'table') => {
    const newQuery = { ...route.query }
    if (mode === 'card') {
      delete newQuery.view
    } else {
      newQuery.view = mode
    }
    router.replace({ query: newQuery })
  }

  // Show inactive toggle
  const showInactive = computed(() => {
    return route.query.showAll === '1'
  })

  const setShowInactive = (value: boolean) => {
    const newQuery = { ...route.query }
    if (value) {
      newQuery.showAll = '1'
    } else {
      delete newQuery.showAll
    }
    router.replace({ query: newQuery })
  }

  // Drawer state from URL
  const openPatternId = computed(() => {
    const val = route.query.pattern
    return typeof val === 'string' ? val : null
  })

  const openPolicyId = computed(() => {
    const val = route.query.policy
    return typeof val === 'string' ? val : null
  })

  const openDrawerItem = computed<DenialIntelligenceItem | null>(() => {
    if (openPatternId.value) {
      const item = activeItems.value.find(i => i.pattern.id === openPatternId.value)
      return item || null
    }
    if (openPolicyId.value) {
      const item = inactiveItems.value.find(i => i.policy.id === openPolicyId.value)
      return item || null
    }
    return null
  })

  const isDrawerOpen = computed(() => openDrawerItem.value !== null)

  const openDrawer = (item: DenialIntelligenceItem) => {
    const newQuery = { ...route.query }
    delete newQuery.pattern
    delete newQuery.policy
    if (item.type === 'active') {
      newQuery.pattern = item.pattern.id
    } else {
      newQuery.policy = item.policy.id
    }
    router.push({ query: newQuery })
  }

  const closeDrawer = () => {
    const newQuery = { ...route.query }
    delete newQuery.pattern
    delete newQuery.policy
    router.replace({ query: newQuery })
  }

  // Sync URL params to local refs
  const syncFromUrl = () => {
    searchQuery.value = normalizedParams.value.search || ''
    filterTopic.value = normalizedParams.value.topic || 'all'
    filterSource.value = normalizedParams.value.source || 'all'
    filterTier.value = normalizedParams.value.tier || 'all'
    filterStatus.value = normalizedParams.value.status || 'all'
    filterRecoveryStatus.value = normalizedParams.value.recoveryStatus || 'all'
  }

  watch(() => route.query, syncFromUrl, { immediate: true })

  // Sync local refs to URL
  watch(searchQuery, (val) => setUrlParamDebounced('search', val || null))
  watch(filterTopic, (val) => setUrlParam('topic', val === 'all' ? null : val))
  watch(filterSource, (val) => setUrlParam('source', val === 'all' ? null : val))
  watch(filterTier, (val) => setUrlParam('tier', val === 'all' ? null : val))
  watch(filterStatus, (val) => setUrlParam('status', val === 'all' ? null : val))
  watch(filterRecoveryStatus, (val) => setUrlParam('recoveryStatus', val === 'all' ? null : val))

  // Build active items from patterns
  const activeItems = computed<ActiveDenialItem[]>(() => {
    return patternsStore.patterns.map((pattern) => {
      const policies = pattern.relatedPolicies
        .map(id => appStore.getPolicyById(id))
        .filter((p): p is Policy => p !== undefined)

      const firstPolicy = policies[0]
      return {
        type: 'active' as const,
        id: pattern.id,
        pattern,
        policies,
        title: pattern.title,
        topic: firstPolicy?.topic?.name || pattern.category,
        source: firstPolicy?.source || '',
        tier: pattern.tier,
      }
    })
  })

  // Collect all policy IDs claimed by patterns
  const claimedPolicyIds = computed(() => {
    const ids = new Set<string>()
    for (const pattern of patternsStore.patterns) {
      for (const policyId of pattern.relatedPolicies) {
        ids.add(policyId)
      }
    }
    return ids
  })

  // Build inactive items from unclaimed policies
  const inactiveItems = computed<InactiveDenialItem[]>(() => {
    return appStore.policies
      .filter(p => !claimedPolicyIds.value.has(p.id))
      .map(policy => ({
        type: 'inactive' as const,
        id: policy.id,
        policy,
        title: policy.name,
        topic: policy.topic?.name || '',
        source: policy.source || '',
        tier: undefined,
      }))
  })

  // Filtered active items
  const filteredActiveItems = computed(() => {
    let items = [...activeItems.value]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.pattern.description.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      )
    }

    if (filterTopic.value !== 'all') {
      items = items.filter(i => i.topic === filterTopic.value)
    }

    if (filterSource.value !== 'all') {
      items = items.filter(i => i.source === filterSource.value)
    }

    if (filterTier.value !== 'all') {
      items = items.filter(i => i.tier === filterTier.value)
    }

    if (filterStatus.value !== 'all') {
      items = items.filter(i => i.pattern.status === filterStatus.value)
    }

    if (filterRecoveryStatus.value !== 'all') {
      items = items.filter(i => i.pattern.recoveryStatus === filterRecoveryStatus.value)
    }

    return items
  })

  // Filtered inactive items
  const filteredInactiveItems = computed(() => {
    if (!showInactive.value) return []

    let items = [...inactiveItems.value]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        (i.policy.description || '').toLowerCase().includes(q)
      )
    }

    if (filterTopic.value !== 'all') {
      items = items.filter(i => i.topic === filterTopic.value)
    }

    if (filterSource.value !== 'all') {
      items = items.filter(i => i.source === filterSource.value)
    }

    return items
  })

  // Sort active items
  const sortedActiveItems = computed(() => {
    const items = [...filteredActiveItems.value]
    const col = sortState.value?.column || 'impact'
    const dir = sortState.value?.direction || 'desc'
    const mult = dir === 'desc' ? -1 : 1

    items.sort((a, b) => {
      switch (col) {
        case 'impact':
          return (a.pattern.score.impact - b.pattern.score.impact) * mult
        case 'denialRate':
          return ((a.pattern.currentDenialRate || 0) - (b.pattern.currentDenialRate || 0)) * mult
        case 'frequency':
          return (a.pattern.score.frequency - b.pattern.score.frequency) * mult
        case 'recent':
          return (new Date(a.pattern.lastUpdated).getTime() - new Date(b.pattern.lastUpdated).getTime()) * mult
        default:
          return (a.pattern.score.impact - b.pattern.score.impact) * mult
      }
    })

    return items
  })

  // Combined items: active sorted first, inactive appended
  const allFilteredItems = computed<DenialIntelligenceItem[]>(() => {
    return [...sortedActiveItems.value, ...filteredInactiveItems.value]
  })

  // Summary stats (always from all patterns, not filtered)
  const summaryStats = computed(() => ({
    totalActive: patternsStore.patterns.length,
    improving: patternsStore.patternsImproving,
    stable: patternsStore.patternsStable,
    regressing: patternsStore.patternsRegressing,
    totalRecoverableRevenue: patternsStore.totalRecoverableRevenue,
    totalDeniedDollars: patternsStore.totalDeniedDollars,
  }))

  // Dynamic filter options from both patterns' related policies and standalone policies
  const uniqueTopics = computed(() => {
    const topics = new Set<string>()
    for (const item of activeItems.value) {
      if (item.topic) topics.add(item.topic)
    }
    for (const item of inactiveItems.value) {
      if (item.topic) topics.add(item.topic)
    }
    return Array.from(topics).sort()
  })

  const uniqueSources = computed(() => {
    const sources = new Set<string>()
    for (const item of activeItems.value) {
      if (item.source) sources.add(item.source)
    }
    for (const item of inactiveItems.value) {
      if (item.source) sources.add(item.source)
    }
    return Array.from(sources).sort()
  })

  // Clear all filters
  const handleClearFilters = () => {
    searchQuery.value = ''
    filterTopic.value = 'all'
    filterSource.value = 'all'
    filterTier.value = 'all'
    filterStatus.value = 'all'
    filterRecoveryStatus.value = 'all'
    clearUrlParams()
  }

  return {
    // Items
    activeItems,
    inactiveItems,
    filteredActiveItems,
    filteredInactiveItems,
    sortedActiveItems,
    allFilteredItems,

    // Summary
    summaryStats,

    // Filters
    searchQuery,
    filterTopic,
    filterSource,
    filterTier,
    filterStatus,
    filterRecoveryStatus,
    uniqueTopics,
    uniqueSources,
    hasActiveFilters,
    activeFilterCount,
    handleClearFilters,

    // Sort
    sortState,
    setSortState,

    // View
    viewMode,
    setViewMode,

    // Inactive toggle
    showInactive,
    setShowInactive,

    // Drawer
    openPatternId,
    openPolicyId,
    openDrawerItem,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
  }
}
