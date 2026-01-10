/**
 * Data Source Composable
 *
 * Provides reactive access to the current data source configuration
 * and helper functions for making data source-aware API calls.
 */

import { ref, computed, onMounted } from 'vue'
import type {
  ClaimsListResponse,
  ClaimsSummaryResponse,
  PoliciesListResponse,
  InsightsResponse,
  ProvidersListResponse,
  AnalyticsDashboardResponse,
  ProcessedClaimWithInsights,
} from '~/types'
import { useSettingsStore } from '~/stores/settings'

export type DataSourceType = 'local' | 'paapi'

export interface DataSourceState {
  source: DataSourceType
  isConfigured: boolean
  isConnected: boolean
  lastError: string | null
}

export function useDataSource() {
  const settingsStore = useSettingsStore()

  // Local state
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed from store
  const dataSource = computed(() => settingsStore.dataSource)
  const isPaapiConfigured = computed(() => settingsStore.isPaapiConfigured)
  const isPaapiActive = computed(() => settingsStore.isPaapiActive)
  const isUsingPaapi = computed(() => settingsStore.isUsingPaapi)
  const connectionStatus = computed(() => settingsStore.connectionStatus)

  // Combined state
  const state = computed<DataSourceState>(() => ({
    source: dataSource.value,
    isConfigured: isPaapiConfigured.value,
    isConnected: connectionStatus.value === 'success',
    lastError: settingsStore.error,
  }))

  // Initialize settings on mount
  async function initialize() {
    if (!settingsStore.paapiConfig) {
      await settingsStore.fetchSettings()
    }
  }

  // Data fetching functions that work with either data source
  // These call the API endpoints which handle the data source routing

  async function fetchClaims(params: {
    limit?: number
    offset?: number
    status?: string
    startDate?: string
    endDate?: string
    providerId?: string
    search?: string
    ids?: string[]
  } = {}): Promise<ClaimsListResponse> {
    isLoading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string | number | undefined> = {
        limit: params.limit,
        offset: params.offset,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate,
        providerId: params.providerId,
        search: params.search,
        ids: params.ids?.join(','),
      }

      return await $fetch<ClaimsListResponse>('/api/v1/claims', {
        params: queryParams,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch claims'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchClaimById(id: string): Promise<ProcessedClaimWithInsights> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<ProcessedClaimWithInsights>(`/api/v1/claims/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch claim'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchClaimsSummary(params: {
    days?: number
  } = {}): Promise<ClaimsSummaryResponse> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<ClaimsSummaryResponse>('/api/v1/claims/summary', {
        params,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch claims summary'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPolicies(params: {
    limit?: number
    offset?: number
    mode?: string
    topic?: string
    search?: string
  } = {}): Promise<PoliciesListResponse> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<PoliciesListResponse>('/api/v1/policies', {
        params,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch policies'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInsights(params: {
    days?: number
  } = {}): Promise<InsightsResponse> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<InsightsResponse>('/api/v1/insights', {
        params,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProviders(params: {
    limit?: number
    offset?: number
    specialty?: string
    search?: string
  } = {}): Promise<ProvidersListResponse> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<ProvidersListResponse>('/api/v1/providers', {
        params,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch providers'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDashboard(params: {
    days?: number
  } = {}): Promise<AnalyticsDashboardResponse> {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch<AnalyticsDashboardResponse>('/api/v1/analytics/dashboard', {
        params,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    state,
    dataSource,
    isPaapiConfigured,
    isPaapiActive,
    isUsingPaapi,
    connectionStatus,
    isLoading,
    error,

    // Actions
    initialize,

    // Data fetching
    fetchClaims,
    fetchClaimById,
    fetchClaimsSummary,
    fetchPolicies,
    fetchInsights,
    fetchProviders,
    fetchDashboard,
  }
}

/**
 * Reactive composable for tracking data source status
 */
export function useDataSourceStatus() {
  const settingsStore = useSettingsStore()

  const statusLabel = computed(() => {
    if (settingsStore.dataSource === 'local') {
      return 'Local Database'
    }
    if (settingsStore.connectionStatus === 'success') {
      return 'PaAPI Connected'
    }
    if (settingsStore.connectionStatus === 'failed') {
      return 'PaAPI Disconnected'
    }
    return 'PaAPI Pending'
  })

  const statusColor = computed(() => {
    if (settingsStore.dataSource === 'local') {
      return 'neutral'
    }
    if (settingsStore.connectionStatus === 'success') {
      return 'success'
    }
    if (settingsStore.connectionStatus === 'failed') {
      return 'error'
    }
    return 'warning'
  })

  const statusIcon = computed(() => {
    if (settingsStore.dataSource === 'local') {
      return 'database'
    }
    if (settingsStore.connectionStatus === 'success') {
      return 'cloud-check'
    }
    if (settingsStore.connectionStatus === 'failed') {
      return 'cloud-off'
    }
    return 'cloud'
  })

  return {
    statusLabel,
    statusColor,
    statusIcon,
  }
}
