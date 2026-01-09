/**
 * URL Parameters State Composable
 * Manages filter/sort state in URL query parameters for persistence and shareability
 * Similar to console-ui's useUrlParamsState pattern
 */

import { getAppConfig } from '~/config/appConfig'

export interface UrlParamsOptions {
  /** Keys to exclude from URL params */
  excludeKeys?: string[]
  /** Default values for params (won't be included in URL if value matches default) */
  defaults?: Record<string, string>
  /** Debounce delay for search params in ms */
  debounceMs?: number
}

export function useUrlParamsState(options: UrlParamsOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const config = getAppConfig()

  // Use config default for debounce if not provided
  const { excludeKeys = ['claim', 'policy'], defaults = {}, debounceMs = config.ui.debounceMs } = options

  // Debounce timer for search inputs
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Get current URL params as a reactive object
   */
  const activeUrlParams = computed(() => {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(route.query)) {
      if (typeof value === 'string' && !excludeKeys.includes(key)) {
        params[key] = value
      }
    }
    return params
  })

  /**
   * Get normalized params (with defaults applied for missing values)
   */
  const normalizedParams = computed(() => {
    return { ...defaults, ...activeUrlParams.value }
  })

  /**
   * Get a specific URL param value
   */
  const getUrlParam = (key: string): string | null => {
    const value = route.query[key]
    return typeof value === 'string' ? value : null
  }

  /**
   * Set multiple URL params at once
   */
  const setUrlParams = (params: Record<string, string | null>, options?: { replace?: boolean }) => {
    const newQuery = { ...route.query }

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === '' || value === defaults[key]) {
        delete newQuery[key]
      } else {
        newQuery[key] = value
      }
    }

    if (options?.replace !== false) {
      router.replace({ query: newQuery })
    } else {
      router.push({ query: newQuery })
    }
  }

  /**
   * Set a single URL param
   */
  const setUrlParam = (key: string, value: string | null) => {
    setUrlParams({ [key]: value })
  }

  /**
   * Set a URL param with debounce (for search inputs)
   */
  const setUrlParamDebounced = (key: string, value: string | null) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      setUrlParam(key, value)
    }, debounceMs)
  }

  /**
   * Delete a URL param
   */
  const deleteUrlParam = (key: string) => {
    setUrlParam(key, null)
  }

  /**
   * Clear all URL params (except excluded ones)
   */
  const clearUrlParams = () => {
    const newQuery: Record<string, string> = {}
    // Keep excluded keys
    for (const key of excludeKeys) {
      const value = route.query[key]
      if (typeof value === 'string') {
        newQuery[key] = value
      }
    }
    router.replace({ query: newQuery })
  }

  /**
   * Check if any filters are active (non-default values)
   */
  const hasActiveFilters = computed(() => {
    for (const [key, value] of Object.entries(activeUrlParams.value)) {
      if (value !== defaults[key]) {
        return true
      }
    }
    return false
  })

  /**
   * Get the count of active filters
   */
  const activeFilterCount = computed(() => {
    let count = 0
    for (const [key, value] of Object.entries(activeUrlParams.value)) {
      if (value !== defaults[key]) {
        count++
      }
    }
    return count
  })

  // Cleanup debounce timer
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  return {
    activeUrlParams,
    normalizedParams,
    getUrlParam,
    setUrlParams,
    setUrlParam,
    setUrlParamDebounced,
    deleteUrlParam,
    clearUrlParams,
    hasActiveFilters,
    activeFilterCount,
  }
}

/**
 * URL Sort State Composable
 * Manages table sort state in URL query parameters
 */
export interface UrlSortOptions {
  /** The URL param key for sort state */
  paramKey?: string
  /** Default sort column */
  defaultColumn?: string
  /** Default sort direction */
  defaultDirection?: 'asc' | 'desc'
}

export function useUrlSortState(options: UrlSortOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const { paramKey = 'sort', defaultColumn, defaultDirection = 'desc' } = options

  /**
   * Parse sort param from URL (format: "column,direction")
   */
  const parseSortParam = (value: string | null): { column: string; direction: 'asc' | 'desc' } | null => {
    if (!value) return null
    const [column, direction] = value.split(',')
    if (!column) return null
    return {
      column,
      direction: direction === 'asc' ? 'asc' : 'desc',
    }
  }

  /**
   * Get current sort state from URL
   */
  const sortState = computed(() => {
    const param = route.query[paramKey]
    const parsed = parseSortParam(typeof param === 'string' ? param : null)
    if (parsed) return parsed
    if (defaultColumn) {
      return { column: defaultColumn, direction: defaultDirection }
    }
    return null
  })

  /**
   * Set sort state in URL
   */
  const setSortState = (column: string, direction: 'asc' | 'desc') => {
    const newQuery = { ...route.query }

    // If setting to default, remove from URL
    if (column === defaultColumn && direction === defaultDirection) {
      delete newQuery[paramKey]
    } else {
      newQuery[paramKey] = `${column},${direction}`
    }

    router.replace({ query: newQuery })
  }

  /**
   * Toggle sort direction or set new column
   */
  const toggleSort = (column: string) => {
    const current = sortState.value
    if (current?.column === column) {
      // Toggle direction
      setSortState(column, current.direction === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to desc
      setSortState(column, 'desc')
    }
  }

  /**
   * Clear sort (use defaults)
   */
  const clearSort = () => {
    const newQuery = { ...route.query }
    delete newQuery[paramKey]
    router.replace({ query: newQuery })
  }

  return {
    sortState,
    setSortState,
    toggleSort,
    clearSort,
  }
}
