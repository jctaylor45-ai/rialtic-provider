import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type DataSourceType = 'local' | 'paapi'
export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic'

export interface PaapiConfig {
  id?: number
  name: string
  baseUrl: string
  authType: AuthType
  hasApiKey: boolean
  hasCredentials: boolean
  isActive: boolean
  lastTestedAt: string | null
  lastTestStatus: 'success' | 'failed' | 'pending' | null
  lastTestError: string | null
  createdAt: string
  updatedAt: string
}

export interface PaapiConfigUpdate {
  name?: string
  baseUrl: string
  authType: AuthType
  apiKey?: string
  username?: string
  password?: string
  isActive?: boolean
}

interface PaapiConfigResponse {
  configured: boolean
  config: PaapiConfig | null
}

// Settings API returns a flat key-value object
type SettingsResponse = Record<string, unknown>

interface TestConnectionResponse {
  success: boolean
  message: string
  response?: unknown
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const dataSource = ref<DataSourceType>('local')
  const paapiConfig = ref<PaapiConfig | null>(null)
  const isLoading = ref(false)
  const isTesting = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isPaapiConfigured = computed(() => paapiConfig.value !== null)
  const isPaapiActive = computed(() => paapiConfig.value?.isActive ?? false)
  const connectionStatus = computed(() => paapiConfig.value?.lastTestStatus ?? null)
  const isUsingPaapi = computed(() => dataSource.value === 'paapi' && isPaapiActive.value)

  // Actions
  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const [settingsResponse, paapiResponse] = await Promise.all([
        $fetch<SettingsResponse>('/api/v1/settings'),
        $fetch<PaapiConfigResponse>('/api/v1/settings/paapi'),
      ])

      // Get data source setting (API returns flat key-value object)
      const dataSourceSetting = settingsResponse?.dataSource as DataSourceType | undefined
      dataSource.value = dataSourceSetting || 'local'

      // Get PaAPI config
      paapiConfig.value = paapiResponse.config
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch settings'
    } finally {
      isLoading.value = false
    }
  }

  async function setDataSource(source: DataSourceType) {
    isLoading.value = true
    error.value = null
    try {
      await $fetch('/api/v1/settings', {
        method: 'PUT',
        body: {
          key: 'dataSource',
          value: source,
          description: 'Data source for claims and policies',
          category: 'data',
        },
      })
      dataSource.value = source
    } catch (err) {
      console.error('Failed to update data source:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update data source'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updatePaapiConfig(config: PaapiConfigUpdate) {
    isLoading.value = true
    error.value = null
    try {
      await $fetch('/api/v1/settings/paapi', {
        method: 'PUT',
        body: config,
      })
      // Refresh config to get updated values
      const response = await $fetch<PaapiConfigResponse>('/api/v1/settings/paapi')
      paapiConfig.value = response.config
    } catch (err) {
      console.error('Failed to update PaAPI config:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update PaAPI configuration'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function testConnection(): Promise<TestConnectionResponse> {
    isTesting.value = true
    error.value = null
    try {
      const response = await $fetch<TestConnectionResponse>('/api/v1/settings/paapi-test', {
        method: 'POST',
      })
      // Refresh config to get updated test status
      const configResponse = await $fetch<PaapiConfigResponse>('/api/v1/settings/paapi')
      paapiConfig.value = configResponse.config
      return response
    } catch (err: unknown) {
      console.error('Connection test failed:', err)
      // Refresh config even on failure to get updated status
      try {
        const configResponse = await $fetch<PaapiConfigResponse>('/api/v1/settings/paapi')
        paapiConfig.value = configResponse.config
      } catch {
        // Ignore secondary error
      }
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed'
      error.value = errorMessage
      throw err
    } finally {
      isTesting.value = false
    }
  }

  async function activatePaapi() {
    if (!paapiConfig.value) {
      throw new Error('PaAPI is not configured')
    }
    await updatePaapiConfig({
      baseUrl: paapiConfig.value.baseUrl,
      authType: paapiConfig.value.authType as AuthType,
      isActive: true,
    })
    await setDataSource('paapi')
  }

  async function deactivatePaapi() {
    await setDataSource('local')
    if (paapiConfig.value) {
      await updatePaapiConfig({
        baseUrl: paapiConfig.value.baseUrl,
        authType: paapiConfig.value.authType as AuthType,
        isActive: false,
      })
    }
  }

  return {
    // State
    dataSource,
    paapiConfig,
    isLoading,
    isTesting,
    error,
    // Getters
    isPaapiConfigured,
    isPaapiActive,
    connectionStatus,
    isUsingPaapi,
    // Actions
    fetchSettings,
    setDataSource,
    updatePaapiConfig,
    testConnection,
    activatePaapi,
    deactivatePaapi,
  }
})
