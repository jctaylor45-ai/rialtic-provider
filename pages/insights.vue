<template>
  <div class="flex-1 overflow-hidden p-8">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">AI Insights Hub</h1>

    <!-- Summary Header -->
    <div class="grid grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Total Insights</div>
        <div class="text-3xl font-semibold text-gray-900">{{ appStore.insights.length }}</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">High Priority</div>
        <div class="text-3xl font-semibold text-red-600">{{ appStore.highSeverityInsights.length }}</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Potential Impact</div>
        <div class="text-3xl font-semibold text-gray-900">{{ formatCurrency(totalImpact) }}</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="flex items-center gap-4">
        <select
          v-model="filters.severity"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          v-model="filters.category"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
          <option value="Coding Error">Coding Error</option>
          <option value="Policy Violation">Policy Violation</option>
          <option value="Documentation">Documentation</option>
        </select>

        <div class="flex-1"></div>

        <button
          v-if="filters.severity !== 'all' || filters.category !== 'all'"
          @click="clearFilters"
          class="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear filters
        </button>
      </div>
    </div>

    <!-- Insights Grid -->
    <div class="grid grid-cols-2 gap-6">
      <div
        v-for="insight in filteredInsights"
        :key="insight.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="selectedInsight = insight"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <Icon name="heroicons:light-bulb" class="w-5 h-5 text-primary-600" />
            <span
              class="px-2 py-1 text-xs font-medium rounded"
              :class="{
                'bg-red-100 text-red-700': insight.severity === 'high',
                'bg-yellow-100 text-yellow-700': insight.severity === 'medium',
                'bg-blue-100 text-blue-700': insight.severity === 'low',
              }"
            >
              {{ insight.severity.toUpperCase() }}
            </span>
          </div>
          <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">{{ insight.category }}</span>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ insight.title }}</h3>
        <p class="text-sm text-gray-600 mb-4">{{ insight.description }}</p>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Affected Claims:</span>
            <span class="font-semibold text-gray-900 ml-1">{{ insight.affectedClaims }}</span>
          </div>
          <div>
            <span class="text-gray-600">Avg Denial:</span>
            <span class="font-semibold text-gray-900 ml-1">{{ formatCurrency(insight.avgDenialAmount) }}</span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="text-xs text-gray-600 mb-1">Learning Progress</div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-primary-600 h-2 rounded-full"
              :style="{ width: `${insight.learningProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insight Detail Modal -->
    <div
      v-if="selectedInsight"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="selectedInsight = null"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div class="flex items-start justify-between">
            <h2 class="text-2xl font-semibold text-gray-900">{{ selectedInsight.title }}</h2>
            <button @click="selectedInsight = null" class="text-gray-400 hover:text-gray-600">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p class="text-sm text-gray-700">{{ selectedInsight.description }}</p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Suggested Action</h3>
            <p class="text-sm text-gray-700">{{ selectedInsight.suggestedAction }}</p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Example Case</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm"><strong>Claim:</strong> {{ selectedInsight.example.claimId }}</div>
              <div class="text-sm"><strong>Patient:</strong> {{ selectedInsight.example.patient }}</div>
              <div class="text-sm"><strong>Issue:</strong> {{ selectedInsight.example.issue }}</div>
            </div>
          </div>

          <div class="flex gap-3">
            <NuxtLink
              :to="`/claim-lab?insight=${selectedInsight.id}`"
              class="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center no-underline"
            >
              Practice in Claim Lab
            </NuxtLink>
            <button
              @click="dismissInsight(selectedInsight.id)"
              class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Insight } from '~/types'

const appStore = useAppStore()

const filters = reactive({
  severity: 'all',
  category: 'all',
})

const selectedInsight = ref<Insight | null>(null)

const totalImpact = computed(() => {
  return appStore.insights.reduce((sum, i) => sum + i.impact, 0)
})

const filteredInsights = computed(() => {
  let result = appStore.insights.filter(i => !i.dismissed)

  if (filters.severity !== 'all') {
    result = result.filter(i => i.severity === filters.severity)
  }

  if (filters.category !== 'all') {
    result = result.filter(i => i.category === filters.category)
  }

  return result
})

function clearFilters() {
  filters.severity = 'all'
  filters.category = 'all'
}

function dismissInsight(id: string) {
  appStore.dismissInsight(id)
  selectedInsight.value = null
}
</script>
