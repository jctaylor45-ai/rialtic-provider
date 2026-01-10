<template>
  <div class="min-h-screen bg-neutral-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-neutral-900">Database Management</h1>
        <p class="mt-1 text-neutral-600">
          View statistics, clear data, and import policies
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingStats" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>

      <!-- Error State -->
      <div v-else-if="statsError" class="p-4 bg-error-50 border border-error-200 rounded-lg mb-6">
        <p class="text-error-700">{{ statsError }}</p>
        <button type="button" class="mt-2 text-sm text-error-600 underline" @click="loadStats">
          Try again
        </button>
      </div>

      <div v-else class="space-y-6">
        <!-- Database Statistics -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Database Statistics</h2>
              <p class="text-sm text-neutral-500">Current record counts</p>
            </div>
            <button
              type="button"
              class="btn btn-secondary text-sm"
              :disabled="isLoadingStats"
              @click="loadStats"
            >
              <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Claims Section -->
            <div class="p-4 bg-secondary-50 rounded-lg">
              <h3 class="text-sm font-medium text-secondary-700 mb-3">Claims Data</h3>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Claims</span>
                  <span class="font-medium">{{ stats?.claims.claims || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Line Items</span>
                  <span class="font-medium">{{ stats?.claims.lineItems || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Line-Policy Links</span>
                  <span class="font-medium">{{ stats?.claims.linePolicies || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Appeals</span>
                  <span class="font-medium">{{ stats?.claims.appeals || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Policies Section -->
            <div class="p-4 bg-primary-50 rounded-lg">
              <h3 class="text-sm font-medium text-primary-700 mb-3">Policies</h3>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Policies</span>
                  <span class="font-medium">{{ stats?.policies.policies || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Procedure Codes</span>
                  <span class="font-medium">{{ stats?.policies.procedureCodes || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Reference Docs</span>
                  <span class="font-medium">{{ stats?.policies.referenceDocs || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Patterns Section -->
            <div class="p-4 bg-warning-50 rounded-lg">
              <h3 class="text-sm font-medium text-warning-700 mb-3">Patterns</h3>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Patterns</span>
                  <span class="font-medium">{{ stats?.patterns.patterns || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Claim Line Links</span>
                  <span class="font-medium">{{ stats?.patterns.claimLines || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Policy Links</span>
                  <span class="font-medium">{{ stats?.patterns.policies || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Snapshots</span>
                  <span class="font-medium">{{ stats?.patterns.snapshots || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Other Section -->
            <div class="p-4 bg-neutral-100 rounded-lg">
              <h3 class="text-sm font-medium text-neutral-700 mb-3">Other</h3>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Learning Events</span>
                  <span class="font-medium">{{ stats?.other.learningEvents || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Providers</span>
                  <span class="font-medium">{{ stats?.other.providers || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Scenarios</span>
                  <span class="font-medium">{{ stats?.other.scenarios || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Data Sources</span>
                  <span class="font-medium">{{ stats?.other.dataSources || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Clear Database Section -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Clear Database</h2>
              <p class="text-sm text-neutral-500">Remove data from the database</p>
            </div>
            <span class="px-2 py-1 bg-error-100 text-error-700 rounded text-xs font-medium">
              Destructive
            </span>
          </div>

          <div class="space-y-4">
            <!-- Clear Mode Selection -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Clear Mode
              </label>
              <div class="space-y-2">
                <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50" :class="{ 'border-primary-500 bg-primary-50': clearMode === 'except-policies' }">
                  <input
                    v-model="clearMode"
                    type="radio"
                    name="clearMode"
                    value="except-policies"
                    class="mt-1"
                  />
                  <div>
                    <span class="font-medium text-neutral-900">Clear All Except Policies</span>
                    <p class="text-sm text-neutral-500">Remove claims, patterns, learning events, but keep policy library</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50" :class="{ 'border-primary-500 bg-primary-50': clearMode === 'claims-only' }">
                  <input
                    v-model="clearMode"
                    type="radio"
                    name="clearMode"
                    value="claims-only"
                    class="mt-1"
                  />
                  <div>
                    <span class="font-medium text-neutral-900">Clear Claims Only</span>
                    <p class="text-sm text-neutral-500">Remove claims and line items, keep patterns and policies</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50" :class="{ 'border-primary-500 bg-primary-50': clearMode === 'patterns-only' }">
                  <input
                    v-model="clearMode"
                    type="radio"
                    name="clearMode"
                    value="patterns-only"
                    class="mt-1"
                  />
                  <div>
                    <span class="font-medium text-neutral-900">Clear Patterns Only</span>
                    <p class="text-sm text-neutral-500">Remove patterns and insights, keep claims and policies</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50" :class="{ 'border-primary-500 bg-primary-50': clearMode === 'learning-only' }">
                  <input
                    v-model="clearMode"
                    type="radio"
                    name="clearMode"
                    value="learning-only"
                    class="mt-1"
                  />
                  <div>
                    <span class="font-medium text-neutral-900">Clear Learning Events Only</span>
                    <p class="text-sm text-neutral-500">Remove analytics and learning events only</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 p-3 rounded-lg border border-error-200 cursor-pointer hover:bg-error-50" :class="{ 'border-error-500 bg-error-50': clearMode === 'all' }">
                  <input
                    v-model="clearMode"
                    type="radio"
                    name="clearMode"
                    value="all"
                    class="mt-1"
                  />
                  <div>
                    <span class="font-medium text-error-700">Clear Everything</span>
                    <p class="text-sm text-error-600">Remove ALL data including policies (requires confirmation)</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Confirmation for "all" mode -->
            <div v-if="clearMode === 'all'" class="p-4 bg-error-50 border border-error-200 rounded-lg">
              <p class="text-sm text-error-700 mb-2">
                Type <strong>DELETE ALL DATA</strong> to confirm:
              </p>
              <input
                v-model="confirmPhrase"
                type="text"
                class="form-input w-full"
                placeholder="DELETE ALL DATA"
              />
            </div>

            <!-- Clear Button -->
            <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
              <div v-if="clearResult" class="text-sm" :class="clearResult.success ? 'text-success-600' : 'text-error-600'">
                {{ clearResult.message }}
              </div>
              <button
                type="button"
                class="btn"
                :class="clearMode === 'all' ? 'bg-error-600 hover:bg-error-700 text-white' : 'btn-secondary'"
                :disabled="isClearing || (clearMode === 'all' && confirmPhrase !== 'DELETE ALL DATA')"
                @click="clearDatabase"
              >
                <Icon v-if="isClearing" name="heroicons:arrow-path" class="w-4 h-4 mr-1 animate-spin" />
                <Icon v-else name="heroicons:trash" class="w-4 h-4 mr-1" />
                {{ isClearing ? 'Clearing...' : 'Clear Database' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Bulk Policy Import Section -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Bulk Policy Import</h2>
              <p class="text-sm text-neutral-500">Import policies from JSON file or paste JSON data</p>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Import Mode -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Import Mode
              </label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2">
                  <input
                    v-model="importMode"
                    type="radio"
                    name="importMode"
                    value="merge"
                  />
                  <span class="text-sm text-neutral-700">Merge (update existing, add new)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="importMode"
                    type="radio"
                    name="importMode"
                    value="replace"
                  />
                  <span class="text-sm text-neutral-700">Replace (delete all existing first)</span>
                </label>
              </div>
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Upload JSON File
              </label>
              <div class="flex items-center gap-4">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="($refs.fileInput as HTMLInputElement).click()"
                >
                  <Icon name="heroicons:arrow-up-tray" class="w-4 h-4 mr-1" />
                  Select File
                </button>
                <span v-if="selectedFile" class="text-sm text-neutral-600">
                  {{ selectedFile.name }}
                </span>
              </div>
            </div>

            <!-- Or paste JSON -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Or Paste JSON Data
              </label>
              <textarea
                v-model="jsonInput"
                class="form-input w-full h-48 font-mono text-sm"
                placeholder='{"policies": [{"id": "POL-001", "name": "Policy Name", "mode": "Edit", "effectiveDate": "2024-01-01", ...}]}'
              />
              <p class="mt-1 text-xs text-neutral-500">
                Expected format: <code>{"policies": [...]}</code> or just an array of policies
              </p>
            </div>

            <!-- Import Button -->
            <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
              <div v-if="importResult" class="text-sm" :class="importResult.success ? 'text-success-600' : 'text-error-600'">
                {{ importResult.success ? `Imported ${importResult.inserted} policies, updated ${importResult.updated}` : importResult.message }}
                <span v-if="importResult.failed && importResult.failed > 0" class="text-error-600"> ({{ importResult.failed }} failed)</span>
              </div>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isImporting || (!selectedFile && !jsonInput.trim())"
                @click="importPolicies"
              >
                <Icon v-if="isImporting" name="heroicons:arrow-path" class="w-4 h-4 mr-1 animate-spin" />
                <Icon v-else name="heroicons:arrow-down-tray" class="w-4 h-4 mr-1" />
                {{ isImporting ? 'Importing...' : 'Import Policies' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sample Policy JSON -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Policy JSON Format</h2>
              <p class="text-sm text-neutral-500">Example policy structure for import</p>
            </div>
            <button
              type="button"
              class="btn btn-secondary text-sm"
              @click="copyExample"
            >
              <Icon name="heroicons:clipboard-document" class="w-4 h-4 mr-1" />
              Copy
            </button>
          </div>
          <pre class="bg-neutral-100 p-4 rounded-lg text-xs overflow-x-auto"><code>{{ examplePolicyJson }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Stats
interface DbStats {
  claims: {
    claims: number
    lineItems: number
    diagnosisCodes: number
    procedureCodes: number
    linePolicies: number
    appeals: number
    lineItemModifiers: number
    lineItemDiagnosisCodes: number
  }
  policies: {
    policies: number
    procedureCodes: number
    diagnosisCodes: number
    modifiers: number
    placesOfService: number
    referenceDocs: number
    relatedPolicies: number
  }
  patterns: {
    patterns: number
    claimLines: number
    policies: number
    relatedCodes: number
    evidence: number
    improvements: number
    actions: number
    snapshots: number
  }
  other: {
    learningEvents: number
    providers: number
    scenarios: number
    dataSources: number
    importHistory: number
  }
}

const stats = ref<DbStats | null>(null)
const isLoadingStats = ref(false)
const statsError = ref<string | null>(null)

// Clear database
type ClearMode = 'all' | 'except-policies' | 'claims-only' | 'patterns-only' | 'learning-only'
const clearMode = ref<ClearMode>('except-policies')
const confirmPhrase = ref('')
const isClearing = ref(false)
const clearResult = ref<{ success: boolean; message: string } | null>(null)

// Import
const importMode = ref<'merge' | 'replace'>('merge')
const selectedFile = ref<File | null>(null)
const jsonInput = ref('')
const isImporting = ref(false)
const importResult = ref<{
  success: boolean
  message?: string
  inserted?: number
  updated?: number
  failed?: number
} | null>(null)

const examplePolicyJson = `{
  "policies": [
    {
      "id": "POL-001",
      "name": "Prior Authorization Required for High-Cost Procedures",
      "mode": "Edit",
      "effectiveDate": "2024-01-01",
      "description": "Requires prior authorization for procedures over $1000",
      "clinicalRationale": "Ensures appropriate utilization of high-cost services",
      "topic": "Prior Authorization",
      "logicType": "Authorization",
      "source": "Medical Policy Manual",
      "hitRate": 15.5,
      "denialRate": 8.2,
      "appealRate": 12.0,
      "overturnRate": 25.0,
      "commonMistake": "Submitting without obtaining prior authorization",
      "fixGuidance": "Obtain prior authorization before scheduling procedure",
      "procedureCodes": ["99213", "99214", "99215"],
      "diagnosisCodes": ["Z00.00", "Z00.01"],
      "modifiers": ["25", "59"],
      "placeOfService": ["11", "22"],
      "referenceDocs": [
        {
          "title": "Prior Auth Guidelines",
          "url": "https://example.com/guidelines",
          "source": "CMS"
        }
      ],
      "relatedPolicies": ["POL-002", "POL-003"]
    }
  ]
}`

async function loadStats() {
  isLoadingStats.value = true
  statsError.value = null

  try {
    stats.value = await $fetch<DbStats>('/api/v1/admin/database/stats')
  } catch (error) {
    statsError.value = error instanceof Error ? error.message : 'Failed to load database stats'
  } finally {
    isLoadingStats.value = false
  }
}

async function clearDatabase() {
  isClearing.value = true
  clearResult.value = null

  try {
    const response = await $fetch<{ success: boolean; message: string; totalDeleted: number }>('/api/v1/admin/database/clear', {
      method: 'POST',
      body: {
        mode: clearMode.value,
        confirmPhrase: clearMode.value === 'all' ? confirmPhrase.value : undefined,
      },
    })

    clearResult.value = {
      success: true,
      message: `Cleared ${response.totalDeleted} records`,
    }

    // Refresh stats
    await loadStats()

    // Reset confirmation
    confirmPhrase.value = ''
  } catch (error) {
    clearResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear database',
    }
  } finally {
    isClearing.value = false
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    if (file) {
      selectedFile.value = file
      // Clear JSON input when file is selected
      jsonInput.value = ''
    }
  }
}

async function importPolicies() {
  isImporting.value = true
  importResult.value = null

  try {
    let policiesData: unknown

    if (selectedFile.value) {
      // Read file
      const text = await selectedFile.value.text()
      policiesData = JSON.parse(text)
    } else if (jsonInput.value.trim()) {
      policiesData = JSON.parse(jsonInput.value.trim())
    } else {
      throw new Error('No data to import')
    }

    // Normalize data structure
    let policies: unknown[]
    if (Array.isArray(policiesData)) {
      policies = policiesData
    } else if (typeof policiesData === 'object' && policiesData !== null && 'policies' in policiesData) {
      policies = (policiesData as { policies: unknown[] }).policies
    } else {
      throw new Error('Invalid format: expected array of policies or {policies: [...]}')
    }

    const response = await $fetch<{
      success: boolean
      inserted: number
      updated: number
      failed: number
      errors: Array<{ id: string; error: string }>
    }>('/api/v1/admin/policies/import', {
      method: 'POST',
      body: {
        policies,
        mode: importMode.value,
      },
    })

    importResult.value = {
      success: response.success,
      inserted: response.inserted,
      updated: response.updated,
      failed: response.failed,
    }

    // Refresh stats
    await loadStats()

    // Clear inputs on success
    if (response.success) {
      selectedFile.value = null
      jsonInput.value = ''
      if (document.querySelector('input[type="file"]')) {
        (document.querySelector('input[type="file"]') as HTMLInputElement).value = ''
      }
    }
  } catch (error) {
    importResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import policies',
    }
  } finally {
    isImporting.value = false
  }
}

function copyExample() {
  navigator.clipboard.writeText(examplePolicyJson)
}

onMounted(() => {
  loadStats()
})
</script>
