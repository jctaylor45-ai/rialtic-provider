<template>
  <div class="flex-1 overflow-hidden p-8">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Policy } from '~/types'

const appStore = useAppStore()

const searchQuery = ref('')
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

  return result
})
</script>
