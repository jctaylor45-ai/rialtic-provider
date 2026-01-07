<template>
  <div class="p-6 space-y-6 flex-1 overflow-auto">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-900">
          {{ greeting }}, Team.
        </h1>
        <p class="text-sm text-neutral-500 mt-1">
          Showing data for the last {{ selectedTimeRange }} days
        </p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Time Range Filter -->
        <div class="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            @click="selectedTimeRange = range.value"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            :class="{
              'bg-white text-neutral-900 shadow-sm': selectedTimeRange === range.value,
              'text-neutral-600 hover:text-neutral-900': selectedTimeRange !== range.value
            }"
          >
            {{ range.label }}
          </button>
        </div>
        <button class="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
          Export
        </button>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Claims Submitted -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
        @click="drillDown('claims', 'all')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-2">Claims Submitted</div>
            <div class="text-3xl font-semibold text-neutral-900">{{ formatNumber(filteredClaims.length) }}</div>
            <div class="text-sm text-neutral-500 mt-1">Last {{ selectedTimeRange }} days</div>
          </div>
          <Icon name="heroicons:chart-bar" class="w-10 h-10 text-secondary-500" />
        </div>
      </div>

      <!-- Approval Rate -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
        @click="drillDown('claims', 'paid')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-2">Approval Rate</div>
            <div class="text-3xl font-semibold text-success-600">{{ formatPercentage(filteredApprovalRate) }}</div>
            <div class="flex items-center gap-1 text-sm mt-1">
              <Icon
                :name="getTrendIcon(filteredTrends.approvalRate.trend)"
                class="w-3 h-3"
                :class="getTrendColor(filteredTrends.approvalRate.trend, true)"
              />
              <span :class="getTrendColor(filteredTrends.approvalRate.trend, true)">
                {{ formatMetricTrend(filteredTrends.approvalRate) }}
              </span>
            </div>
          </div>
          <Icon name="heroicons:check-circle" class="w-10 h-10 text-success-500" />
        </div>
      </div>

      <!-- Denial Rate -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer hover:border-red-300 hover:shadow-md transition-all"
        @click="drillDown('claims', 'denied')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-2">Denial Rate</div>
            <div class="text-3xl font-semibold text-neutral-900">{{ formatPercentage(filteredDenialRate) }}</div>
            <div class="flex items-center gap-1 text-sm mt-1">
              <Icon
                :name="getTrendIcon(filteredTrends.denialRate.trend)"
                class="w-3 h-3"
                :class="getTrendColor(filteredTrends.denialRate.trend, false)"
              />
              <span :class="getTrendColor(filteredTrends.denialRate.trend, false)">
                {{ formatMetricTrend(filteredTrends.denialRate) }}
              </span>
            </div>
          </div>
          <Icon name="heroicons:x-circle" class="w-10 h-10 text-error-500" />
        </div>
      </div>

      <!-- Denied Amount -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all"
        @click="drillDown('claims', 'denied')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-2">Denied Amount</div>
            <div class="text-3xl font-semibold text-neutral-900">{{ formatCurrency(filteredDeniedAmount) }}</div>
            <div class="text-sm text-neutral-500 mt-1">Potential revenue</div>
          </div>
          <Icon name="heroicons:currency-dollar" class="w-10 h-10 text-yellow-500" />
        </div>
      </div>

      <!-- Patterns Detected -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
        @click="drillDown('insights')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-2">Patterns Detected</div>
            <div class="text-3xl font-semibold text-neutral-900">{{ patternsStore.totalPatternsDetected }}</div>
            <div class="text-sm text-orange-600 mt-1">{{ patternsStore.criticalPatterns.length }} critical</div>
          </div>
          <Icon name="heroicons:chart-pie" class="w-10 h-10 text-orange-500" />
        </div>
      </div>

      <!-- Savings Potential -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ring-2 ring-success-500 cursor-pointer hover:shadow-md transition-all"
        @click="drillDown('impact')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-neutral-600">Savings Potential</span>
              <span class="px-2 py-0.5 bg-success-100 text-success-700 text-xs font-medium rounded">ROI</span>
            </div>
            <div class="text-3xl font-semibold text-success-600">{{ formatCurrency(analyticsStore.totalSavings, true) }}</div>
            <div class="text-sm text-neutral-500 mt-1">{{ patternsStore.avgLearningProgress }}% progress</div>
          </div>
          <Icon name="heroicons:banknotes" class="w-10 h-10 text-success-500" />
        </div>
      </div>
    </div>

    <!-- Your Improvement Section -->
    <div class="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-lg border border-secondary-200 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-primary-600 rounded-lg">
          <Icon name="heroicons:chart-bar-square" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-neutral-900">Your Improvement</h2>
          <p class="text-sm text-neutral-600">Last {{ selectedTimeRange }} days vs previous {{ selectedTimeRange }} days</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <!-- Denial Rate Improvement -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Denial Rate</div>
          <div class="text-2xl font-semibold text-neutral-900 mb-1">
            {{ formatPercentage(filteredDenialRate) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon
              :name="filteredTrends.denialRate.trend === 'down' ? 'heroicons:arrow-down' : filteredTrends.denialRate.trend === 'up' ? 'heroicons:arrow-up' : 'heroicons:minus'"
              class="w-4 h-4"
              :class="filteredTrends.denialRate.trend === 'down' ? 'text-success-600' : filteredTrends.denialRate.trend === 'up' ? 'text-error-600' : 'text-neutral-400'"
            />
            <span
              class="font-medium"
              :class="filteredTrends.denialRate.trend === 'down' ? 'text-success-600' : filteredTrends.denialRate.trend === 'up' ? 'text-error-600' : 'text-neutral-600'"
            >
              {{ Math.abs(filteredTrends.denialRate.change).toFixed(1) }}pts
            </span>
            <span class="text-neutral-500">from {{ filteredTrends.denialRate.previous.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- Patterns Addressed -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Patterns Addressed</div>
          <div class="text-2xl font-semibold text-neutral-900 mb-1">
            {{ patternsStore.resolvedPatterns.length }} of {{ patternsStore.totalPatternsDetected }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="font-medium text-secondary-600">
              {{ Math.round((patternsStore.resolvedPatterns.length / patternsStore.totalPatternsDetected) * 100) }}%
            </span>
            <span class="text-neutral-500">completion rate</span>
          </div>
        </div>

        <!-- Claim Lab Tests -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Claim Lab Tests</div>
          <div class="text-2xl font-semibold text-neutral-900 mb-1">
            {{ filteredPracticeSessions }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="text-neutral-500">last {{ selectedTimeRange }} days</span>
          </div>
        </div>

        <!-- Est. Admin Savings -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4 ring-2 ring-secondary-500">
          <div class="text-xs text-neutral-600 mb-2">Est. Admin Savings</div>
          <div class="text-2xl font-semibold text-secondary-600 mb-1">
            {{ formatCurrency(estimatedAdminSavings, true) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="text-neutral-500">last {{ selectedTimeRange }} days</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Patterns Alert -->
    <div
      v-if="patternsStore.criticalPatterns.length > 0"
      class="bg-error-light border border-error-300 rounded-lg p-6"
    >
      <div class="flex items-start gap-4">
        <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-error-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-error-900 mb-2">
            {{ patternsStore.criticalPatterns.length }} Critical Pattern{{ patternsStore.criticalPatterns.length > 1 ? 's' : '' }} Detected
          </h3>
          <p class="text-sm text-error-800 mb-4">
            These patterns require immediate attention and could result in significant revenue loss if not addressed.
          </p>
          <div class="space-y-2 mb-4">
            <div
              v-for="pattern in patternsStore.criticalPatterns.slice(0, 2)"
              :key="pattern.id"
              class="flex items-center justify-between p-3 bg-white border border-error-300 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-5 h-5 text-error-600" />
                <div>
                  <div class="font-medium text-error-900">{{ pattern.title }}</div>
                  <div class="text-xs text-error-700">
                    {{ pattern.score.frequency }} occurrences • {{ formatCurrency(pattern.totalAtRisk) }} at risk
                  </div>
                </div>
              </div>
              <button
                @click="navigateTo(`/insights`)"
                class="px-3 py-1.5 bg-error text-white text-sm font-medium rounded-lg hover:bg-error-dark transition-colors"
              >
                Review
              </button>
            </div>
          </div>
          <NuxtLink
            to="/insights"
            class="inline-flex items-center gap-2 text-sm font-medium text-error-700 hover:text-error-800 no-underline"
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
      class="bg-success-50 border border-success-200 rounded-lg p-6"
    >
      <div class="flex items-start gap-4">
        <Icon name="heroicons:check-circle" class="w-8 h-8 text-success-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-success-900 mb-2">Recent Improvements</h3>
          <p class="text-sm text-success-800 mb-4">
            {{ patternsStore.recentlyImprovedPatterns.length }} pattern{{ patternsStore.recentlyImprovedPatterns.length > 1 ? 's have' : ' has' }} shown measurable improvement in the last 30 days.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="pattern in patternsStore.recentlyImprovedPatterns.slice(0, 3)"
              :key="pattern.id"
              class="p-3 bg-white border border-success-200 rounded-lg cursor-pointer hover:border-success-400 transition-colors"
              @click="navigateTo(`/insights`)"
            >
              <div class="text-sm font-medium text-success-900 mb-1">{{ pattern.title }}</div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-success-700">{{ pattern.learningProgress }}% progress</span>
                <span class="text-success-600">
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
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Recent Denials</h2>
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
            class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
            @click="navigateTo(`/claims/${claim.id}`)"
          >
            <div class="flex items-center gap-4">
              <Icon name="heroicons:x-circle" class="w-5 h-5 text-error-500" />
              <div>
                <div class="font-mono text-sm text-primary-600 font-medium">{{ claim.id }}</div>
                <div class="text-sm text-neutral-700">{{ claim.patientName }}</div>
                <div v-if="claim.denialReason" class="text-xs text-neutral-500 mt-0.5">{{ claim.denialReason }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-neutral-900">{{ formatCurrency(claim.billedAmount) }}</div>
              <div class="text-xs text-neutral-500">{{ formatDate(claim.dateOfService) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Practice Activity -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Practice Activity</h2>
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
            <div class="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <div class="text-xs text-secondary-700 mb-1">Practice Sessions</div>
              <div class="text-2xl font-semibold text-secondary-900">{{ eventsStore.totalPracticeSessions }}</div>
              <div class="text-xs text-secondary-600 mt-1">{{ eventsStore.currentStreak }} day streak</div>
            </div>
            <div class="p-4 bg-success-50 rounded-lg border border-success-200">
              <div class="text-xs text-success-700 mb-1">Corrections Applied</div>
              <div class="text-2xl font-semibold text-success-900">{{ eventsStore.totalCorrections }}</div>
              <div class="text-xs text-success-600 mt-1">Avg {{ eventsStore.avgSessionDuration }}s per session</div>
            </div>
          </div>

          <!-- Recent Practice Events -->
          <div>
            <div class="text-xs font-medium text-neutral-700 mb-2">Recent Activity</div>
            <div class="space-y-2">
              <div
                v-for="event in recentPracticeEvents"
                :key="event.id"
                class="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg"
              >
                <Icon name="heroicons:academic-cap" class="w-4 h-4 text-primary-600" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-neutral-900 truncate">
                    {{ getEventDescription(event) }}
                  </div>
                  <div class="text-xs text-neutral-500">{{ formatRelativeTime(event.timestamp) }}</div>
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
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">AI-Powered Pattern Detection</h3>
          <p class="text-neutral-700 mb-4">
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
import { formatDistanceToNow, subDays } from 'date-fns'
import type { LearningEvent, MetricTrend } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()
const analyticsStore = useAnalyticsStore()

// Composables
const { getPatternCategoryIcon } = usePatterns()
const { formatCurrency, formatMetricTrend, getTrendIcon, getTrendColor } = useAnalytics()

const greeting = computed(() => getGreeting())

// Drill down navigation
const drillDown = (page: string, status?: string) => {
  if (page === 'claims') {
    const query: Record<string, string> = {
      dateRange: selectedTimeRange.value.toString()
    }
    if (status && status !== 'all') {
      query.status = status
    }
    navigateTo({ path: '/claims', query })
  } else if (page === 'insights') {
    navigateTo('/insights')
  } else if (page === 'impact') {
    navigateTo('/impact')
  }
}

// Time range filter
const timeRanges = [
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
]
const selectedTimeRange = ref(30)

// Filter claims by selected time range
const filteredClaims = computed(() => {
  const now = new Date()
  const cutoffDate = subDays(now, selectedTimeRange.value)

  return appStore.claims.filter(claim => {
    if (!claim.submissionDate) return false
    const claimDate = new Date(claim.submissionDate)
    return claimDate >= cutoffDate
  })
})

// Previous period claims for comparison
const previousPeriodClaims = computed(() => {
  const now = new Date()
  const currentCutoff = subDays(now, selectedTimeRange.value)
  const previousCutoff = subDays(now, selectedTimeRange.value * 2)

  return appStore.claims.filter(claim => {
    if (!claim.submissionDate) return false
    const claimDate = new Date(claim.submissionDate)
    return claimDate >= previousCutoff && claimDate < currentCutoff
  })
})

// Filtered metrics
const filteredDeniedClaims = computed(() => {
  return filteredClaims.value.filter(c => c.status === 'denied')
})

const filteredDeniedAmount = computed(() => {
  return filteredDeniedClaims.value.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

const filteredDenialRate = computed(() => {
  if (filteredClaims.value.length === 0) return 0
  return (filteredDeniedClaims.value.length / filteredClaims.value.length) * 100
})

const filteredApprovalRate = computed(() => {
  return 100 - filteredDenialRate.value
})

// Calculate trends vs previous period
const filteredTrends = computed(() => {
  const prevDenied = previousPeriodClaims.value.filter(c => c.status === 'denied')
  const prevDenialRate = previousPeriodClaims.value.length > 0
    ? (prevDenied.length / previousPeriodClaims.value.length) * 100
    : 0
  const prevApprovalRate = 100 - prevDenialRate

  const denialChange = filteredDenialRate.value - prevDenialRate
  const approvalChange = filteredApprovalRate.value - prevApprovalRate

  return {
    denialRate: {
      current: filteredDenialRate.value,
      previous: prevDenialRate,
      change: denialChange,
      percentChange: prevDenialRate > 0 ? (denialChange / prevDenialRate) * 100 : 0,
      trend: denialChange < -0.5 ? 'down' : denialChange > 0.5 ? 'up' : 'stable',
    } as MetricTrend,
    approvalRate: {
      current: filteredApprovalRate.value,
      previous: prevApprovalRate,
      change: approvalChange,
      percentChange: prevApprovalRate > 0 ? (approvalChange / prevApprovalRate) * 100 : 0,
      trend: approvalChange > 0.5 ? 'up' : approvalChange < -0.5 ? 'down' : 'stable',
    } as MetricTrend,
  }
})

// Baseline metrics (from 6 months ago)
const baselineDenialRate = computed(() => {
  // Based on pattern data showing improvement from 18% to current rate
  return 18.0
})

const estimatedAdminSavings = computed(() => {
  // Calculate savings based on denied claims prevented
  const denialRateReduction = baselineDenialRate.value - filteredDenialRate.value
  const totalClaims = filteredClaims.value.length
  const claimsPrevented = Math.round(totalClaims * (denialRateReduction / 100))
  const avgClaimAmount = filteredDeniedAmount.value / Math.max(filteredDeniedClaims.value.length, 1)
  const adminCostPerAppeal = 350 // Default admin cost

  // Savings = (claims prevented * avg claim amount) + (appeals avoided * admin cost)
  return Math.round(claimsPrevented * avgClaimAmount * 0.3) + (claimsPrevented * adminCostPerAppeal)
})

const totalDeniedAmount = computed(() => {
  return appStore.deniedClaims.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

// Filter practice sessions by time range
const filteredPracticeSessions = computed(() => {
  const now = new Date()
  const cutoffDate = subDays(now, selectedTimeRange.value)

  return eventsStore.events.filter(e => {
    if (e.type !== 'practice-completed') return false
    const eventDate = new Date(e.timestamp)
    return eventDate >= cutoffDate
  }).length
})

const recentDeniedClaims = computed(() => {
  return filteredDeniedClaims.value
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
