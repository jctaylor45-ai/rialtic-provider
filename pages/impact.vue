<template>
  <div class="flex-1 overflow-auto p-8">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Learning Impact Dashboard</h1>

    <!-- Scorecard -->
    <div class="grid grid-cols-5 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Tests Completed</div>
        <div class="text-3xl font-semibold text-gray-900">{{ appStore.learningMarkers.length }}</div>
        <div class="text-xs text-green-600 mt-1">+5 this week</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Policies Learned</div>
        <div class="text-3xl font-semibold text-gray-900">{{ policiesLearned }}</div>
        <div class="text-xs text-green-600 mt-1">+3 this week</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Correction Rate</div>
        <div class="text-3xl font-semibold text-gray-900">{{ formatPercentage(correctionRate) }}%</div>
        <div class="text-xs text-green-600 mt-1">+12% improvement</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Estimated Savings</div>
        <div class="text-3xl font-semibold text-gray-900">{{ formatCurrency(estimatedSavings) }}</div>
        <div class="text-xs text-green-600 mt-1">From corrections</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-sm text-gray-600 mb-2">Avg Session Time</div>
        <div class="text-3xl font-semibold text-gray-900">8<span class="text-lg">m</span></div>
        <div class="text-xs text-gray-600 mt-1">Per test</div>
      </div>
    </div>

    <!-- Time Series Chart -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Learning Progress Over Time</h2>
      <div class="h-64 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm">Chart.js visualization would appear here</p>
          <p class="text-xs text-gray-400 mt-1">Install and configure Chart.js for production</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Learning Activity</h2>
      <div class="space-y-3">
        <div
          v-for="marker in recentMarkers"
          :key="marker.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center gap-4">
            <Icon
              :name="getMarkerIcon(marker.type)"
              class="w-5 h-5"
              :class="{
                'text-green-600': marker.type === 'claim_corrected',
                'text-blue-600': marker.type === 'policy_learned',
                'text-purple-600': marker.type === 'insight_applied',
              }"
            />
            <div>
              <div class="text-sm font-medium text-gray-900">{{ marker.description }}</div>
              <div class="text-xs text-gray-500">{{ formatDateTime(marker.timestamp) }}</div>
            </div>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">{{ marker.category }}</span>
          </div>
        </div>

        <div v-if="appStore.learningMarkers.length === 0" class="text-center py-8 text-gray-500">
          <Icon name="heroicons:academic-cap" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm">No learning activity yet</p>
          <p class="text-xs text-gray-400 mt-1">Complete tests in the Claim Lab to see your progress</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore()

const policiesLearned = computed(() => {
  const uniquePolicies = new Set(
    appStore.learningMarkers
      .filter(m => m.policyId)
      .map(m => m.policyId)
  )
  return uniquePolicies.size
})

const correctionRate = computed(() => {
  const corrected = appStore.learningMarkers.filter(m => m.type === 'claim_corrected').length
  const total = appStore.learningMarkers.length
  return total > 0 ? (corrected / total) * 100 : 0
})

const estimatedSavings = computed(() => {
  return appStore.learningMarkers
    .filter(m => m.simulationResult?.estimatedPayment)
    .reduce((sum, m) => sum + (m.simulationResult?.estimatedPayment || 0), 0)
})

const recentMarkers = computed(() => {
  return [...appStore.learningMarkers]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
})

function getMarkerIcon(type: string): string {
  switch (type) {
    case 'claim_corrected':
      return 'heroicons:check-circle'
    case 'policy_learned':
      return 'heroicons:document-text'
    case 'insight_applied':
      return 'heroicons:light-bulb'
    default:
      return 'heroicons:star'
  }
}
</script>
