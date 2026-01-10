<template>
  <div class="min-h-screen bg-neutral-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-neutral-900">Data Source</h1>
        <p class="mt-1 text-neutral-600">
          Configure where claims and policies data is fetched from
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-4 bg-error-50 border border-error-200 rounded-lg mb-6">
        <p class="text-error-700">{{ error }}</p>
        <button type="button" class="mt-2 text-sm text-error-600 underline" @click="loadSettings">
          Try again
        </button>
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Data Source Selection -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Active Data Source</h2>
              <p class="text-sm text-neutral-500">Choose where to fetch data from</p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="isUsingPaapi ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-700'"
            >
              {{ isUsingPaapi ? 'PaAPI' : 'Local Database' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Local Database Option -->
            <button
              type="button"
              class="relative p-4 rounded-lg border-2 text-left transition-all"
              :class="dataSource === 'local'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'"
              @click="selectDataSource('local')"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="dataSource === 'local' ? 'bg-primary-100' : 'bg-neutral-100'"
                >
                  <svg class="w-5 h-5" :class="dataSource === 'local' ? 'text-primary-600' : 'text-neutral-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-neutral-900">Local Database</h3>
                  <p class="text-sm text-neutral-500 mt-1">
                    Use the Provider Portal's internal SQLite database with sample or imported data
                  </p>
                </div>
              </div>
              <div
                v-if="dataSource === 'local'"
                class="absolute top-3 right-3"
              >
                <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>

            <!-- PaAPI Option -->
            <button
              type="button"
              class="relative p-4 rounded-lg border-2 text-left transition-all"
              :class="dataSource === 'paapi'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'"
              :disabled="!isPaapiConfigured"
              @click="selectDataSource('paapi')"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="dataSource === 'paapi' ? 'bg-primary-100' : 'bg-neutral-100'"
                >
                  <svg class="w-5 h-5" :class="dataSource === 'paapi' ? 'text-primary-600' : 'text-neutral-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-neutral-900">PaAPI (Remote)</h3>
                  <p class="text-sm text-neutral-500 mt-1">
                    Connect to a remote PaAPI backend for live production data
                  </p>
                  <p v-if="!isPaapiConfigured" class="text-xs text-warning-600 mt-2">
                    Configure connection settings below to enable
                  </p>
                </div>
              </div>
              <div
                v-if="dataSource === 'paapi'"
                class="absolute top-3 right-3"
              >
                <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- PaAPI Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">PaAPI Configuration</h2>
              <p class="text-sm text-neutral-500">Remote API connection settings</p>
            </div>
            <div v-if="connectionStatus" class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-success-500': connectionStatus === 'success',
                  'bg-error-500': connectionStatus === 'failed',
                  'bg-warning-500': connectionStatus === 'pending'
                }"
              />
              <span
                class="text-sm"
                :class="{
                  'text-success-600': connectionStatus === 'success',
                  'text-error-600': connectionStatus === 'failed',
                  'text-warning-600': connectionStatus === 'pending'
                }"
              >
                {{ connectionStatus === 'success' ? 'Connected' : connectionStatus === 'failed' ? 'Failed' : 'Pending' }}
              </span>
            </div>
          </div>

          <form class="space-y-6" @submit.prevent="savePaapiConfig">
            <!-- Base URL -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Base URL
              </label>
              <input
                v-model="paapiForm.baseUrl"
                type="url"
                placeholder="https://api.example.com"
                class="form-input w-full"
                required
              />
              <p class="mt-1 text-xs text-neutral-500">
                The root URL of the PaAPI backend (without trailing slash)
              </p>
            </div>

            <!-- Authentication Type -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Authentication Type
              </label>
              <select v-model="paapiForm.authType" class="form-input w-full">
                <option value="none">None</option>
                <option value="api_key">API Key (X-API-Key header)</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            <!-- API Key (for api_key and bearer) -->
            <div v-if="paapiForm.authType === 'api_key' || paapiForm.authType === 'bearer'">
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                {{ paapiForm.authType === 'api_key' ? 'API Key' : 'Bearer Token' }}
              </label>
              <div class="relative">
                <input
                  v-model="paapiForm.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  :placeholder="hasApiKey ? '(unchanged)' : 'Enter API key'"
                  class="form-input w-full pr-10"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  @click="showApiKey = !showApiKey"
                >
                  <svg v-if="showApiKey" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p v-if="hasApiKey" class="mt-1 text-xs text-neutral-500">
                Leave empty to keep the current value
              </p>
            </div>

            <!-- Basic Auth Credentials -->
            <div v-if="paapiForm.authType === 'basic'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">
                  Username
                </label>
                <input
                  v-model="paapiForm.username"
                  type="text"
                  :placeholder="hasCredentials ? '(unchanged)' : 'Enter username'"
                  class="form-input w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  v-model="paapiForm.password"
                  type="password"
                  :placeholder="hasCredentials ? '(unchanged)' : 'Enter password'"
                  class="form-input w-full"
                />
              </div>
              <p v-if="hasCredentials" class="col-span-2 text-xs text-neutral-500">
                Leave empty to keep current credentials
              </p>
            </div>

            <!-- Test Connection Status -->
            <div v-if="paapiConfig?.lastTestError" class="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p class="text-sm text-error-700">
                <span class="font-medium">Last error:</span> {{ paapiConfig.lastTestError }}
              </p>
              <p v-if="paapiConfig.lastTestedAt" class="text-xs text-error-500 mt-1">
                {{ formatDateTime(paapiConfig.lastTestedAt) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="isTesting"
                @click="testConnection"
              >
                <svg v-if="isTesting" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isTesting ? 'Testing...' : 'Test Connection' }}
              </button>

              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSaving || !paapiForm.baseUrl"
              >
                {{ isSaving ? 'Saving...' : 'Save Configuration' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Connection Info -->
        <div v-if="isPaapiConfigured && paapiConfig" class="card p-6 bg-neutral-50">
          <h3 class="text-sm font-medium text-neutral-700 mb-3">Connection Details</h3>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-neutral-500">Endpoint</dt>
              <dd class="font-mono text-neutral-900">{{ paapiConfig.baseUrl }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500">Auth Type</dt>
              <dd class="text-neutral-900 capitalize">{{ paapiConfig.authType || 'None' }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500">Last Tested</dt>
              <dd class="text-neutral-900">
                {{ paapiConfig.lastTestedAt ? formatDateTime(paapiConfig.lastTestedAt) : 'Never' }}
              </dd>
            </div>
            <div>
              <dt class="text-neutral-500">Status</dt>
              <dd>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-success-100 text-success-700': connectionStatus === 'success',
                    'bg-error-100 text-error-700': connectionStatus === 'failed',
                    'bg-neutral-100 text-neutral-700': !connectionStatus
                  }"
                >
                  {{ connectionStatus || 'Not tested' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Success Toast -->
        <div
          v-if="successMessage"
          class="fixed bottom-4 right-4 p-4 bg-success-500 text-white rounded-lg shadow-lg flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ successMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore, type DataSourceType, type AuthType } from '~/stores/settings'

const settingsStore = useSettingsStore()

// Local state
const showApiKey = ref(false)
const isSaving = ref(false)
const successMessage = ref<string | null>(null)
const paapiForm = ref({
  baseUrl: '',
  authType: 'none' as AuthType,
  apiKey: '',
  username: '',
  password: '',
})

// Computed from store
const isLoading = computed(() => settingsStore.isLoading)
const isTesting = computed(() => settingsStore.isTesting)
const error = computed(() => settingsStore.error)
const dataSource = computed(() => settingsStore.dataSource)
const paapiConfig = computed(() => settingsStore.paapiConfig)
const isPaapiConfigured = computed(() => settingsStore.isPaapiConfigured)
const connectionStatus = computed(() => settingsStore.connectionStatus)
const isUsingPaapi = computed(() => settingsStore.isUsingPaapi)
const hasApiKey = computed(() => paapiConfig.value?.hasApiKey ?? false)
const hasCredentials = computed(() => paapiConfig.value?.hasCredentials ?? false)

// Initialize form when config loads
watch(paapiConfig, (config) => {
  if (config) {
    paapiForm.value.baseUrl = config.baseUrl
    paapiForm.value.authType = config.authType as AuthType || 'none'
    // Don't populate sensitive fields
    paapiForm.value.apiKey = ''
    paapiForm.value.username = ''
    paapiForm.value.password = ''
  }
}, { immediate: true })

// Methods
async function loadSettings() {
  await settingsStore.fetchSettings()
}

async function selectDataSource(source: DataSourceType) {
  if (source === 'paapi' && !isPaapiConfigured.value) {
    return
  }
  try {
    await settingsStore.setDataSource(source)
    showSuccess(`Switched to ${source === 'paapi' ? 'PaAPI' : 'Local Database'}`)
  } catch {
    // Error handled by store
  }
}

async function savePaapiConfig() {
  if (!paapiForm.value.baseUrl) return

  isSaving.value = true
  try {
    await settingsStore.updatePaapiConfig({
      baseUrl: paapiForm.value.baseUrl,
      authType: paapiForm.value.authType,
      apiKey: paapiForm.value.apiKey || undefined,
      username: paapiForm.value.username || undefined,
      password: paapiForm.value.password || undefined,
      isActive: dataSource.value === 'paapi',
    })
    showSuccess('Configuration saved')
    // Clear sensitive fields after save
    paapiForm.value.apiKey = ''
    paapiForm.value.username = ''
    paapiForm.value.password = ''
  } catch {
    // Error handled by store
  } finally {
    isSaving.value = false
  }
}

async function testConnection() {
  try {
    await settingsStore.testConnection()
    showSuccess('Connection successful')
  } catch {
    // Error handled by store
  }
}

function showSuccess(message: string) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>
