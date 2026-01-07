<template>
  <div class="flex-1 overflow-y-auto p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Policy Analytics</h1>
      <button class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        Export CSV
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search policies..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
      />

      <div class="flex items-center gap-4">
        <select
          v-model="filters.mode"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Modes</option>
          <option value="Edit">Edit</option>
          <option value="Informational">Informational</option>
          <option value="Pay & Advise">Pay & Advise</option>
        </select>

        <select
          v-model="filters.topic"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Topics</option>
          <option value="Modifiers">Modifiers</option>
          <option value="Bundling">Bundling</option>
          <option value="Medical Necessity">Medical Necessity</option>
          <option value="Frequency">Frequency</option>
        </select>

        <select
          v-model="filters.source"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Sources</option>
          <option value="CMS">CMS</option>
          <option value="Payer">Payer</option>
          <option value="State">State</option>
        </select>

        <div class="ml-auto flex items-center gap-2">
          <label class="text-sm text-gray-600">Sort by:</label>
          <select
            v-model="sortBy"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="impact-desc">Impact (High to Low)</option>
            <option value="impact-asc">Impact (Low to High)</option>
            <option value="denial-rate-desc">Denial Rate (High to Low)</option>
            <option value="denial-rate-asc">Denial Rate (Low to High)</option>
            <option value="hit-rate-desc">Hit Rate (High to Low)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-gray-600 mb-4">
      {{ filteredPolicies.length }} policies found
    </div>

    <!-- Policies Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Policy Name</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Mode</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Topic</th>
              <th class="text-center px-6 py-3 text-xs font-semibold text-gray-700">Related Patterns</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-gray-700">Hit Rate</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-gray-700">Denial Rate</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-gray-700">Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="policy in filteredPolicies"
              :key="policy.id"
              class="hover:bg-primary-50 cursor-pointer transition-colors"
              @click="selectedPolicy = policy"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-sm text-gray-900">{{ policy.name }}</div>
                <div class="text-xs text-gray-500">{{ policy.id }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="{
                    'bg-red-100 text-red-700': policy.mode === 'Edit',
                    'bg-blue-100 text-blue-700': policy.mode === 'Informational',
                    'bg-yellow-100 text-yellow-700': policy.mode === 'Pay & Advise',
                  }"
                >
                  {{ policy.mode }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ policy.topic }}</td>
              <td class="px-6 py-4 text-center" @click.stop>
                <div v-if="getPolicyPatterns(policy.id).length > 0" class="flex justify-center gap-1">
                  <button
                    v-for="pattern in getPolicyPatterns(policy.id).slice(0, 2)"
                    :key="pattern.id"
                    @click="viewPattern(pattern)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-colors"
                    :class="getPatternBadgeClass(pattern.tier)"
                    :title="pattern.title"
                  >
                    <Icon :name="getPatternIcon(pattern.category)" class="w-3 h-3" />
                  </button>
                  <span
                    v-if="getPolicyPatterns(policy.id).length > 2"
                    class="inline-flex items-center px-2 py-0.5 text-xs text-gray-600"
                    :title="`+${getPolicyPatterns(policy.id).length - 2} more pattern(s)`"
                  >
                    +{{ getPolicyPatterns(policy.id).length - 2 }}
                  </span>
                </div>
                <div v-else class="text-xs text-gray-400">—</div>
              </td>
              <td class="px-6 py-4 text-right text-sm text-gray-900">{{ formatPercentage(policy.hitRate) }}%</td>
              <td class="px-6 py-4 text-right text-sm text-gray-900">{{ formatPercentage(policy.denialRate) }}%</td>
              <td class="px-6 py-4 text-right text-sm font-semibold text-gray-900">{{ formatCurrency(policy.impact) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Policy Detail Modal -->
    <div
      v-if="selectedPolicy"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="selectedPolicy = null"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">{{ selectedPolicy.name }}</h2>
              <p class="text-sm text-gray-600">{{ selectedPolicy.id }}</p>
            </div>
            <button @click="selectedPolicy = null" class="text-gray-400 hover:text-gray-600">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Related Patterns Alert -->
          <div v-if="getPolicyPatterns(selectedPolicy.id).length > 0" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-600 mt-0.5" />
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-orange-900 mb-2">Active Denial Patterns Related to This Policy</h3>
                <p class="text-xs text-orange-700 mb-3">
                  {{ getPolicyPatterns(selectedPolicy.id).length }} pattern(s) detected that relate to this policy
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="pattern in getPolicyPatterns(selectedPolicy.id)"
                    :key="pattern.id"
                    class="bg-white border border-orange-200 rounded p-3"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Icon :name="getPatternIcon(pattern.category)" class="w-4 h-4 text-orange-600" />
                        <span class="text-sm font-medium text-gray-900">{{ pattern.title }}</span>
                      </div>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded-full border"
                        :class="getPatternBadgeClass(pattern.tier)"
                      >
                        {{ pattern.tier.charAt(0).toUpperCase() + pattern.tier.slice(1) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 mb-2">{{ pattern.description }}</p>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 text-xs text-gray-600">
                        <span>{{ pattern.score.frequency }} occurrences</span>
                        <span>{{ formatCurrency(pattern.totalAtRisk) }} at risk</span>
                      </div>
                      <button
                        @click="viewPattern(pattern)"
                        class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p class="text-sm text-gray-700">{{ selectedPolicy.description }}</p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Clinical Rationale</h3>
            <p class="text-sm text-gray-700">{{ selectedPolicy.clinicalRationale }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-2">Common Mistake</h3>
              <p class="text-sm text-gray-700">{{ selectedPolicy.commonMistake }}</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-2">Fix Guidance</h3>
              <p class="text-sm text-gray-700">{{ selectedPolicy.fixGuidance }}</p>
            </div>
          </div>

          <!-- Impact Metrics -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-600 mb-1">Hit Rate</div>
              <div class="text-lg font-semibold text-gray-900">{{ formatPercentage(selectedPolicy.hitRate) }}%</div>
              <div class="text-xs text-gray-500 mt-1">of claims affected</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-600 mb-1">Denial Rate</div>
              <div class="text-lg font-semibold text-red-700">{{ formatPercentage(selectedPolicy.denialRate) }}%</div>
              <div class="text-xs text-gray-500 mt-1">when policy triggered</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-600 mb-1">Total Impact</div>
              <div class="text-lg font-semibold text-gray-900">{{ formatCurrency(selectedPolicy.impact) }}</div>
              <div class="text-xs text-gray-500 mt-1">estimated savings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Policy } from '~/types'
import type { Pattern } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const router = useRouter()

// Composables
const { getPatternCategoryIcon } = usePatterns()

const searchQuery = ref('')
const sortBy = ref('impact-desc')
const filters = reactive({
  mode: 'all',
  topic: 'all',
  source: 'all',
})

const selectedPolicy = ref<Policy | null>(null)

const filteredPolicies = computed(() => {
  let result = appStore.policies

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  if (filters.mode !== 'all') {
    result = result.filter(p => p.mode === filters.mode)
  }

  if (filters.topic !== 'all') {
    result = result.filter(p => p.topic === filters.topic)
  }

  if (filters.source !== 'all') {
    result = result.filter(p => p.source === filters.source)
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'impact-desc':
      result = result.sort((a, b) => b.impact - a.impact)
      break
    case 'impact-asc':
      result = result.sort((a, b) => a.impact - b.impact)
      break
    case 'denial-rate-desc':
      result = result.sort((a, b) => b.denialRate - a.denialRate)
      break
    case 'denial-rate-asc':
      result = result.sort((a, b) => a.denialRate - b.denialRate)
      break
    case 'hit-rate-desc':
      result = result.sort((a, b) => b.hitRate - a.hitRate)
      break
    case 'name':
      result = result.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  return result
})

// Get patterns related to a policy
const getPolicyPatterns = (policyId: string): Pattern[] => {
  return patternsStore.patterns.filter(pattern =>
    pattern.relatedPolicies.includes(policyId)
  )
}

// Get pattern tier badge class
const getPatternBadgeClass = (tier: string) => {
  const classes = {
    critical: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  }
  return classes[tier as keyof typeof classes] || 'bg-gray-100 text-gray-700 border-gray-300'
}

// Get pattern category icon
const getPatternIcon = (category: string) => {
  return getPatternCategoryIcon(category)
}

// Navigate to pattern details in insights page
const viewPattern = (pattern: Pattern) => {
  // Store the pattern ID in session storage so insights page can open it
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}

// Check for policy to open from session storage
onMounted(() => {
  if (typeof window !== 'undefined') {
    const policyId = sessionStorage.getItem('openPolicyId')
    if (policyId) {
      sessionStorage.removeItem('openPolicyId')
      const policy = appStore.policies.find(p => p.id === policyId)
      if (policy) {
        selectedPolicy.value = policy
      }
    }
  }
})
</script>
