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
            <div class="text-3xl font-semibold text-green-600">{{ formatPercentage(100 - appStore.denialRate) }}%</div>
            <div class="flex items-center gap-1 text-sm mt-1">
              <Icon
                :name="getTrendIcon(analyticsStore.dashboardMetrics.trends.approvalRate.trend)"
                class="w-3 h-3"
                :class="getTrendColor(analyticsStore.dashboardMetrics.trends.approvalRate.trend, true)"
              />
              <span :class="getTrendColor(analyticsStore.dashboardMetrics.trends.approvalRate.trend, true)">
                {{ formatMetricTrend(analyticsStore.dashboardMetrics.trends.approvalRate) }}
              </span>
            </div>
          </div>
          <Icon name="heroicons:check-circle" class="w-10 h-10 text-green-500" />
        </div>
      </div>

      <!-- Denial Rate -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Denial Rate</div>
            <div class="text-3xl font-semibold text-gray-900">{{ formatPercentage(appStore.denialRate) }}%</div>
            <div class="flex items-center gap-1 text-sm mt-1">
              <Icon
                :name="getTrendIcon(analyticsStore.dashboardMetrics.trends.denialRate.trend)"
                class="w-3 h-3"
                :class="getTrendColor(analyticsStore.dashboardMetrics.trends.denialRate.trend, false)"
              />
              <span :class="getTrendColor(analyticsStore.dashboardMetrics.trends.denialRate.trend, false)">
                {{ formatMetricTrend(analyticsStore.dashboardMetrics.trends.denialRate) }}
              </span>
            </div>
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

      <!-- Patterns Detected -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600 mb-2">Patterns Detected</div>
            <div class="text-3xl font-semibold text-gray-900">{{ patternsStore.totalPatternsDetected }}</div>
            <div class="text-sm text-orange-600 mt-1">{{ patternsStore.criticalPatterns.length }} critical</div>
          </div>
          <Icon name="heroicons:chart-pie" class="w-10 h-10 text-orange-500" />
        </div>
      </div>

      <!-- Savings Potential -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 ring-2 ring-green-500">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-600">Savings Potential</span>
              <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">ROI</span>
            </div>
            <div class="text-3xl font-semibold text-green-600">{{ formatCurrency(analyticsStore.totalSavings, true) }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ patternsStore.avgLearningProgress }}% progress</div>
          </div>
          <Icon name="heroicons:banknotes" class="w-10 h-10 text-green-500" />
        </div>
      </div>
    </div>

    <!-- Your Improvement Section -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-blue-600 rounded-lg">
          <Icon name="heroicons:chart-bar-square" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Your Improvement</h2>
          <p class="text-sm text-gray-600">Progress since baseline (6 months ago)</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <!-- Denial Rate Improvement -->
        <div class="bg-white rounded-lg border border-blue-200 p-4">
          <div class="text-xs text-gray-600 mb-2">Denial Rate</div>
          <div class="text-2xl font-semibold text-gray-900 mb-1">
            {{ formatPercentage(appStore.denialRate) }}%
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon name="heroicons:arrow-down" class="w-4 h-4 text-green-600" />
            <span class="font-medium text-green-600">
              {{ formatPercentage(baselineDenialRate - appStore.denialRate) }}pts
            </span>
            <span class="text-gray-500">from {{ formatPercentage(baselineDenialRate) }}%</span>
          </div>
        </div>

        <!-- Patterns Addressed -->
        <div class="bg-white rounded-lg border border-blue-200 p-4">
          <div class="text-xs text-gray-600 mb-2">Patterns Addressed</div>
          <div class="text-2xl font-semibold text-gray-900 mb-1">
            {{ patternsStore.resolvedPatterns.length }} of {{ patternsStore.totalPatternsDetected }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="font-medium text-blue-600">
              {{ Math.round((patternsStore.resolvedPatterns.length / patternsStore.totalPatternsDetected) * 100) }}%
            </span>
            <span class="text-gray-500">completion rate</span>
          </div>
        </div>

        <!-- Claim Lab Tests -->
        <div class="bg-white rounded-lg border border-blue-200 p-4">
          <div class="text-xs text-gray-600 mb-2">Claim Lab Tests</div>
          <div class="text-2xl font-semibold text-gray-900 mb-1">
            {{ eventsStore.totalPracticeSessions }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="text-gray-500">this quarter</span>
          </div>
        </div>

        <!-- Est. Admin Savings -->
        <div class="bg-white rounded-lg border border-blue-200 p-4 ring-2 ring-blue-500">
          <div class="text-xs text-gray-600 mb-2">Est. Admin Savings</div>
          <div class="text-2xl font-semibold text-blue-600 mb-1">
            {{ formatCurrency(estimatedAdminSavings, true) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="text-gray-500">this quarter</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Patterns Alert -->
    <div
      v-if="patternsStore.criticalPatterns.length > 0"
      class="bg-red-50 border border-red-200 rounded-lg p-6"
    >
      <div class="flex items-start gap-4">
        <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-red-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-red-900 mb-2">
            {{ patternsStore.criticalPatterns.length }} Critical Pattern{{ patternsStore.criticalPatterns.length > 1 ? 's' : '' }} Detected
          </h3>
          <p class="text-sm text-red-800 mb-4">
            These patterns require immediate attention and could result in significant revenue loss if not addressed.
          </p>
          <div class="space-y-2 mb-4">
            <div
              v-for="pattern in patternsStore.criticalPatterns.slice(0, 2)"
              :key="pattern.id"
              class="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-5 h-5 text-red-600" />
                <div>
                  <div class="font-medium text-red-900">{{ pattern.title }}</div>
                  <div class="text-xs text-red-700">
                    {{ pattern.score.frequency }} occurrences • {{ formatCurrency(pattern.totalAtRisk) }} at risk
                  </div>
                </div>
              </div>
              <button
                @click="navigateTo(`/insights`)"
                class="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
          <NuxtLink
            to="/insights"
            class="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 no-underline"
          >
            View all critical patterns
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recent Improvements -->
    <div
      v-if="patternsStore.recentlyImprovedPatterns.length > 0"
      class="bg-green-50 border border-green-200 rounded-lg p-6"
    >
      <div class="flex items-start gap-4">
        <Icon name="heroicons:check-circle" class="w-8 h-8 text-green-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-green-900 mb-2">Recent Improvements</h3>
          <p class="text-sm text-green-800 mb-4">
            {{ patternsStore.recentlyImprovedPatterns.length }} pattern{{ patternsStore.recentlyImprovedPatterns.length > 1 ? 's have' : ' has' }} shown measurable improvement in the last 30 days.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="pattern in patternsStore.recentlyImprovedPatterns.slice(0, 3)"
              :key="pattern.id"
              class="p-3 bg-white border border-green-200 rounded-lg cursor-pointer hover:border-green-400 transition-colors"
              @click="navigateTo(`/insights`)"
            >
              <div class="text-sm font-medium text-green-900 mb-1">{{ pattern.title }}</div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-green-700">{{ pattern.learningProgress }}% progress</span>
                <span class="text-green-600">
                  {{ pattern.improvements.length }} improvement{{ pattern.improvements.length > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Recent Denials -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Denials</h2>
          <NuxtLink
            to="/claims?status=denied"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium no-underline"
          >
            View all
          </NuxtLink>
        </div>
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
                <div v-if="claim.denialReason" class="text-xs text-gray-500 mt-0.5">{{ claim.denialReason }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(claim.billedAmount) }}</div>
              <div class="text-xs text-gray-500">{{ formatDate(claim.dateOfService) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Practice Activity -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Practice Activity</h2>
          <NuxtLink
            to="/impact"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium no-underline"
          >
            View impact
          </NuxtLink>
        </div>
        <div class="space-y-4">
          <!-- Practice Stats -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="text-xs text-blue-700 mb-1">Practice Sessions</div>
              <div class="text-2xl font-semibold text-blue-900">{{ eventsStore.totalPracticeSessions }}</div>
              <div class="text-xs text-blue-600 mt-1">{{ eventsStore.currentStreak }} day streak</div>
            </div>
            <div class="p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="text-xs text-green-700 mb-1">Corrections Applied</div>
              <div class="text-2xl font-semibold text-green-900">{{ eventsStore.totalCorrections }}</div>
              <div class="text-xs text-green-600 mt-1">Avg {{ eventsStore.avgSessionDuration }}s per session</div>
            </div>
          </div>

          <!-- Recent Practice Events -->
          <div>
            <div class="text-xs font-medium text-gray-700 mb-2">Recent Activity</div>
            <div class="space-y-2">
              <div
                v-for="event in recentPracticeEvents"
                :key="event.id"
                class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
              >
                <Icon name="heroicons:academic-cap" class="w-4 h-4 text-primary-600" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900 truncate">
                    {{ getEventDescription(event) }}
                  </div>
                  <div class="text-xs text-gray-500">{{ formatRelativeTime(event.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pattern Insights CTA -->
    <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-6">
      <div class="flex items-start gap-4">
        <Icon name="heroicons:light-bulb" class="w-8 h-8 text-primary-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered Pattern Detection</h3>
          <p class="text-gray-700 mb-4">
            We've identified <strong>{{ patternsStore.totalPatternsDetected }} denial patterns</strong> in your claims.
            {{ patternsStore.criticalPatterns.length }} require immediate attention.
            Start practicing to unlock <strong>{{ formatCurrency(patternsStore.totalAtRisk, true) }} in potential savings</strong>.
          </p>
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/insights"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors no-underline"
            >
              View All Patterns
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </NuxtLink>
            <NuxtLink
              to="/claim-lab"
              class="inline-flex items-center gap-2 px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors no-underline"
            >
              <Icon name="heroicons:beaker" class="w-4 h-4" />
              Practice in Claim Lab
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import type { LearningEvent } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()
const analyticsStore = useAnalyticsStore()

// Composables
const { getPatternCategoryIcon } = usePatterns()
const { formatCurrency, formatMetricTrend, getTrendIcon, getTrendColor } = useAnalytics()

const greeting = computed(() => getGreeting())

// Baseline metrics (from 6 months ago)
const baselineDenialRate = computed(() => {
  // Based on pattern data showing improvement from 18% to current rate
  return 18.0
})

const estimatedAdminSavings = computed(() => {
  // Calculate savings based on denied claims prevented
  const denialRateReduction = baselineDenialRate.value - appStore.denialRate
  const totalClaims = appStore.claims.length
  const claimsPrevented = Math.round(totalClaims * (denialRateReduction / 100))
  const avgClaimAmount = totalDeniedAmount.value / Math.max(appStore.deniedClaims.length, 1)
  const adminCostPerAppeal = 350 // Default admin cost

  // Savings = (claims prevented * avg claim amount) + (appeals avoided * admin cost)
  return Math.round(claimsPrevented * avgClaimAmount * 0.3) + (claimsPrevented * adminCostPerAppeal)
})

const totalDeniedAmount = computed(() => {
  return appStore.deniedClaims.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

const recentDeniedClaims = computed(() => {
  return appStore.deniedClaims
    .filter(c => c.submissionDate)
    .sort((a, b) => new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime())
    .slice(0, 5)
})

const recentPracticeEvents = computed(() => {
  return eventsStore.events
    .filter(e => e.type === 'practice-completed' || e.type === 'correction-applied')
    .slice(0, 3)
})

const getEventDescription = (event: LearningEvent): string => {
  if (event.type === 'practice-completed') {
    const pattern = patternsStore.getPatternById(event.metadata.patternId || '')
    return pattern ? `Practiced: ${pattern.title}` : 'Completed practice session'
  }
  if (event.type === 'correction-applied') {
    return `Applied correction to ${event.metadata.claimId}`
  }
  return 'Activity'
}

const formatRelativeTime = (timestamp: string): string => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return timestamp
  }
}
</script>
