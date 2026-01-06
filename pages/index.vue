<template>
  <div class="p-6 space-y-6 flex-1 overflow-auto">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ greeting }}, Team.
      </h1>
      <button class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        Export
      </button>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Claims Submitted -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Claims Submitted</div>
            <div class="text-3xl font-semibold text-gray-900">{{ formatNumber(appStore.claims.length) }}</div>
            <div class="text-sm text-gray-500 mt-1">This period</div>
          </div>
          <Icon name="heroicons:chart-bar" class="w-10 h-10 text-blue-500" />
        </div>
      </div>

      <!-- Approval Rate -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Approval Rate</div>
            <div class="text-3xl font-semibold text-gray-900">{{ formatPercentage(100 - appStore.denialRate) }}%</div>
            <div class="text-sm text-gray-500 mt-1">Active</div>
          </div>
          <Icon name="heroicons:check-circle" class="w-10 h-10 text-green-500" />
        </div>
      </div>

      <!-- Denied Claims -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Denied Claims</div>
            <div class="text-3xl font-semibold text-gray-900">{{ appStore.deniedClaims.length }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ formatPercentage(appStore.denialRate) }}% of total</div>
          </div>
          <Icon name="heroicons:x-circle" class="w-10 h-10 text-red-500" />
        </div>
      </div>

      <!-- Denied Amount -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Denied Amount</div>
            <div class="text-3xl font-semibold text-gray-900">{{ formatCurrency(totalDeniedAmount) }}</div>
            <div class="text-sm text-gray-500 mt-1">Potential revenue</div>
          </div>
          <Icon name="heroicons:currency-dollar" class="w-10 h-10 text-yellow-500" />
        </div>
      </div>

      <!-- Appeal Success -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Appeal Success</div>
            <div class="text-3xl font-semibold text-gray-900">{{ overturnedCount }}</div>
            <div class="text-sm text-gray-500 mt-1">Overturned appeals</div>
          </div>
          <Icon name="heroicons:trophy" class="w-10 h-10 text-purple-500" />
        </div>
      </div>

      <!-- Learning Impact -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 ring-2 ring-primary-500">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-600">Learning Impact</span>
              <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">New</span>
            </div>
            <div class="text-3xl font-semibold text-gray-900">{{ appStore.learningMarkers.length }}</div>
            <div class="text-sm text-gray-500 mt-1">Tests completed</div>
          </div>
          <Icon name="heroicons:academic-cap" class="w-10 h-10 text-primary-500" />
        </div>
      </div>
    </div>

    <!-- Recent Denials -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Denials</h2>
      <div class="space-y-3">
        <div
          v-for="claim in recentDeniedClaims"
          :key="claim.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
          @click="navigateTo(`/claims/${claim.id}`)"
        >
          <div class="flex items-center gap-4">
            <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-500" />
            <div>
              <div class="font-mono text-sm text-primary-600 font-medium">{{ claim.id }}</div>
              <div class="text-sm text-gray-700">{{ claim.patientName }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(claim.billedAmount) }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(claim.dateOfService) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Insights Preview -->
    <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-6">
      <div class="flex items-start gap-4">
        <Icon name="heroicons:light-bulb" class="w-8 h-8 text-primary-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">AI Insights Available</h3>
          <p class="text-gray-700 mb-4">
            We've identified {{ appStore.highSeverityInsights.length }} high-priority patterns in your denied claims.
            Review these insights to improve your approval rate.
          </p>
          <NuxtLink
            to="/insights"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors no-underline"
          >
            View Insights
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore()

const greeting = computed(() => getGreeting())

const totalDeniedAmount = computed(() => {
  return appStore.deniedClaims.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

const overturnedCount = computed(() => {
  return appStore.claims.filter(c => c.appealStatus === 'overturned').length
})

const recentDeniedClaims = computed(() => {
  return appStore.deniedClaims.slice(0, 5)
})
</script>
