<template>
  <div class="p-6 space-y-6 flex-1 overflow-auto">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-900">
          {{ greeting }}, Jay.
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
      </div>
    </div>

    <!-- Metrics Grid - 5 cards in single row -->
    <div class="grid grid-cols-5 gap-4">
      <!-- Claims Submitted -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
        @click="handleMetricClick('claims-submitted', 'claims', 'all')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-1">Claims Submitted</div>
            <div class="text-2xl font-semibold text-neutral-900">{{ formatNumber(dashboardSummary?.totalClaims ?? 0) }}</div>
            <div class="text-xs text-neutral-500 mt-1">Last {{ selectedTimeRange }} days</div>
          </div>
          <Icon name="heroicons:chart-bar" class="w-8 h-8 text-secondary-500" />
        </div>
      </div>

      <!-- Approval Rate -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
        @click="handleMetricClick('approval-rate', 'claims', 'paid')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-1">Approval Rate</div>
            <div class="text-2xl font-semibold text-success-600">{{ formatPercentage(filteredApprovalRate) }}</div>
            <div class="flex items-center gap-1 text-xs mt-1">
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
          <Icon name="heroicons:check-circle" class="w-8 h-8 text-success-500" />
        </div>
      </div>

      <!-- Denial Rate -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-red-300 hover:shadow-md transition-all"
        @click="handleMetricClick('denial-rate', 'claims', 'denied')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-1">Denial Rate</div>
            <div class="text-2xl font-semibold text-neutral-900">{{ formatPercentage(filteredDenialRate) }}</div>
            <div class="flex items-center gap-1 text-xs mt-1">
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
          <Icon name="heroicons:x-circle" class="w-8 h-8 text-error-500" />
        </div>
      </div>

      <!-- Denied Amount -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all"
        @click="handleMetricClick('denied-amount', 'claims', 'denied')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-1">Denied Amount</div>
            <div class="text-2xl font-semibold text-neutral-900">{{ formatCurrency(filteredDeniedAmount) }}</div>
            <div class="text-xs text-neutral-500 mt-1">Potential revenue</div>
          </div>
          <Icon name="heroicons:currency-dollar" class="w-8 h-8 text-yellow-500" />
        </div>
      </div>

      <!-- Patterns Detected -->
      <div
        class="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
        @click="handleMetricClick('patterns-detected', 'insights')"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-neutral-600 mb-1">Patterns Detected</div>
            <div class="text-2xl font-semibold text-neutral-900">{{ patternsStore.totalPatternsDetected }}</div>
            <div class="text-xs text-orange-600 mt-1">{{ patternsStore.criticalPatterns.length }} critical</div>
          </div>
          <Icon name="heroicons:chart-pie" class="w-8 h-8 text-orange-500" />
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
        <!-- Patterns Improving -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Patterns Improving</div>
          <div class="text-2xl font-semibold text-success-600 mb-1">
            {{ patternsImproving }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon name="heroicons:arrow-trending-down" class="w-4 h-4 text-success-500" />
            <span class="text-neutral-500">denial trend down</span>
          </div>
        </div>

        <!-- Patterns Stable -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Patterns Stable</div>
          <div class="text-2xl font-semibold text-neutral-900 mb-1">
            {{ patternsStable }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon name="heroicons:minus" class="w-4 h-4 text-neutral-400" />
            <span class="text-neutral-500">no change</span>
          </div>
        </div>

        <!-- Patterns Regressing -->
        <div class="bg-white rounded-lg border border-secondary-200 p-4">
          <div class="text-xs text-neutral-600 mb-2">Patterns Regressing</div>
          <div class="text-2xl font-semibold mb-1" :class="patternsRegressing > 0 ? 'text-error-600' : 'text-neutral-900'">
            {{ patternsRegressing }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon name="heroicons:arrow-trending-up" class="w-4 h-4" :class="patternsRegressing > 0 ? 'text-error-500' : 'text-neutral-400'" />
            <span class="text-neutral-500">denial trend up</span>
          </div>
        </div>

        <!-- Revenue Recovered -->
        <div class="bg-white rounded-lg border border-neutral-200 p-4"
          :class="revenueRecovered > 0 ? 'ring-2 ring-success-500' : revenueRecovered < 0 ? 'ring-2 ring-error-500' : ''"
        >
          <div class="text-xs text-neutral-600 mb-2">Revenue Recovered</div>
          <div class="text-2xl font-semibold mb-1"
            :class="revenueRecovered > 0 ? 'text-success-600' : revenueRecovered < 0 ? 'text-error-600' : 'text-neutral-600'"
          >
            {{ formatCurrency(revenueRecovered, true) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <Icon
              v-if="revenueRecovered !== 0"
              :name="revenueRecovered > 0 ? 'heroicons:arrow-trending-down' : 'heroicons:arrow-trending-up'"
              class="w-4 h-4"
              :class="revenueRecovered > 0 ? 'text-success-500' : 'text-error-500'"
            />
            <span class="text-neutral-500">
              {{ revenueRecovered > 0 ? 'denials decreased' : revenueRecovered < 0 ? 'denials increased' : 'no change' }} vs prior period
            </span>
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
              class="flex items-center justify-between p-3 bg-white border border-error-300 rounded-lg cursor-pointer hover:bg-error-50 transition-colors"
              @click="handlePatternClick(pattern)"
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
              <UiButton size="sm" @click.stop="handlePatternClick(pattern)">
                Review
              </UiButton>
            </div>
          </div>
          <NuxtLink
            to="/provider-portal/insights"
            class="inline-flex items-center gap-2 text-sm font-medium text-error-700 hover:text-error-800 no-underline"
          >
            View all critical patterns
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Two Column Layout: Recent Denials & Recent Issues -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Recent Denials -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Recent Denials</h2>
          <NuxtLink
            to="/provider-portal/claims?status=denied"
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
            @click="handleClaimClick(claim)"
          >
            <div class="flex items-center gap-4">
              <Icon name="heroicons:x-circle" class="w-5 h-5 text-error-500" />
              <div>
                <div class="font-mono text-sm text-primary-600 font-medium">{{ claim.id }}</div>
                <div class="text-sm text-neutral-700">{{ claim.patientName }}</div>
                <div v-if="getClaimDenialReason(claim)" class="text-xs text-neutral-500 mt-0.5">{{ getClaimDenialReason(claim) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-neutral-900">{{ formatCurrency(getClaimBilledAmount(claim)) }}</div>
              <div class="text-xs text-neutral-500">{{ formatDate(getClaimDateOfService(claim)) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Issues (grouped by pattern) -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Recent Issues</h2>
          <NuxtLink
            to="/provider-portal/insights"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium no-underline"
          >
            View all insights
          </NuxtLink>
        </div>
        <div v-if="recentIssuesByPattern.length > 0" class="space-y-3">
          <div
            v-for="issue in recentIssuesByPattern"
            :key="issue.pattern.id"
            class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all"
            @click="handleIssueClick(issue.pattern)"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 bg-orange-100 rounded-lg">
                <Icon :name="getPatternCategoryIcon(issue.pattern.category)" class="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div class="text-sm font-medium text-neutral-900">
                  {{ issue.claimCount }} claim{{ issue.claimCount > 1 ? 's' : '' }} denied
                </div>
                <div class="text-sm text-neutral-600">{{ issue.pattern.title }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-orange-600">{{ formatCurrency(issue.totalAmount) }}</div>
              <div class="text-xs text-neutral-500">at risk</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-neutral-500">
          <Icon name="heroicons:check-circle" class="w-12 h-12 text-success-300 mx-auto mb-2" />
          <p class="text-sm">No pattern-linked issues in this period</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MetricTrend, Pattern } from '~/types/enhancements'
import type { ProcessedClaim } from '~/types'
import {
  getClaimStatus,
  getClaimBilledAmount,
  getClaimDateOfService,
  getClaimDenialReason,
  getClaimSubmissionDate,
} from '~/utils/formatting'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()

// Composables
const { getPatternCategoryIcon } = usePatterns()
const { formatCurrency, formatMetricTrend, getTrendIcon, getTrendColor } = useAnalytics()

const greeting = computed(() => getGreeting())

// =============================================================================
// Signal Capture / Tracking
// =============================================================================

// Track page exposure on mount
onMounted(() => {
  eventsStore.trackEvent('dashboard-viewed', 'dashboard', {})
  fetchDashboardSummary(selectedTimeRange.value)
})

// Click handlers with tracking
const handleMetricClick = (element: string, page: string, status?: string) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    // Store element info in a field that won't cause type errors
    practiceType: element as 'guided' | 'free-form', // Reusing existing field for element tracking
  })
  drillDown(page, status)
}

const handlePatternClick = (pattern: Pattern) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    patternId: pattern.id,
  })
  navigateTo(`/provider-portal/insights?pattern=${pattern.id}`)
}

const handleClaimClick = (claim: ProcessedClaim) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    claimId: claim.id,
  })
  navigateTo(`/provider-portal/claims?claim=${claim.id}&dateRange=${selectedTimeRange.value}`)
}

const handleIssueClick = (pattern: Pattern) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    patternId: pattern.id,
  })
  navigateTo(`/provider-portal/insights?pattern=${pattern.id}`)
}

// =============================================================================
// Navigation
// =============================================================================

const drillDown = (page: string, status?: string) => {
  if (page === 'claims') {
    const query: Record<string, string> = {
      dateRange: selectedTimeRange.value.toString()
    }
    if (status && status !== 'all') {
      query.status = status
    }
    navigateTo({ path: '/provider-portal/claims', query })
  } else if (page === 'insights') {
    navigateTo('/provider-portal/insights')
  } else if (page === 'impact') {
    navigateTo('/provider-portal/impact')
  }
}

// =============================================================================
// Time Range Filter
// =============================================================================

const timeRanges = [
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
]
const selectedTimeRange = ref(30)

// =============================================================================
// Server-Side Dashboard Summary
// =============================================================================

interface SummaryPeriod {
  totalClaims: number
  statusBreakdown: { approved: number; denied: number; pending: number; appealed: number }
  denialRate: number
  financial: { billedAmount: number; paidAmount: number; deniedAmount: number; collectionRate: number }
  appeals: { total: number; overturned: number; successRate: number }
  period: { days: number; startDate: string; endDate: string }
}

const dashboardSummary = ref<SummaryPeriod | null>(null)
const previousSummary = ref<SummaryPeriod | null>(null)
const summaryLoading = ref(false)

async function fetchDashboardSummary(days: number) {
  summaryLoading.value = true
  try {
    const response = await $fetch<SummaryPeriod & { previousPeriod?: SummaryPeriod }>(
      '/api/v1/claims/summary',
      { params: { days, includePrevious: 'true' } }
    )
    dashboardSummary.value = response
    previousSummary.value = response.previousPeriod || null
  } catch (err) {
    console.error('Failed to fetch dashboard summary:', err)
  } finally {
    summaryLoading.value = false
  }
}

// Re-fetch when time range changes
watch(selectedTimeRange, (days) => {
  fetchDashboardSummary(days)
})

// =============================================================================
// Server-Side Metrics (replacing client-side filtering)
// =============================================================================

const filteredDenialRate = computed(() => dashboardSummary.value?.denialRate ?? 0)
const filteredApprovalRate = computed(() => 100 - filteredDenialRate.value)
const filteredDeniedAmount = computed(() => dashboardSummary.value?.financial.deniedAmount ?? 0)

// =============================================================================
// Trend Calculations (from server-side previous period)
// =============================================================================

const filteredTrends = computed(() => {
  const currentDenialRate = filteredDenialRate.value
  const prevDenialRate = previousSummary.value?.denialRate ?? 0
  const currentApprovalRate = filteredApprovalRate.value
  const prevApprovalRate = 100 - prevDenialRate

  const denialChange = currentDenialRate - prevDenialRate
  const approvalChange = currentApprovalRate - prevApprovalRate

  return {
    denialRate: {
      current: currentDenialRate,
      previous: prevDenialRate,
      change: denialChange,
      percentChange: prevDenialRate > 0 ? (denialChange / prevDenialRate) * 100 : 0,
      trend: denialChange < -0.5 ? 'down' : denialChange > 0.5 ? 'up' : 'stable',
    } as MetricTrend,
    approvalRate: {
      current: currentApprovalRate,
      previous: prevApprovalRate,
      change: approvalChange,
      percentChange: prevApprovalRate > 0 ? (approvalChange / prevApprovalRate) * 100 : 0,
      trend: approvalChange > 0.5 ? 'up' : approvalChange < -0.5 ? 'down' : 'stable',
    } as MetricTrend,
  }
})

// =============================================================================
// Pattern Trend Counts (for Your Improvement section)
// =============================================================================

// Patterns Improving = score.trend === 'down' (denial trend going down)
const patternsImproving = computed(() => {
  return patternsStore.patterns.filter(p => p.score.trend === 'down').length
})

// Patterns Stable = score.trend === 'stable'
const patternsStable = computed(() => {
  return patternsStore.patterns.filter(p => p.score.trend === 'stable').length
})

// Patterns Regressing = score.trend === 'up' (denial trend going up)
const patternsRegressing = computed(() => {
  return patternsStore.patterns.filter(p => p.score.trend === 'up').length
})

// Revenue Recovered = Previous Period Denied $ - Current Period Denied $
// A positive value means we're denying less money now compared to the previous period
const revenueRecovered = computed(() => {
  const prevDenied = previousSummary.value?.financial.deniedAmount ?? 0
  const currentDenied = filteredDeniedAmount.value
  return prevDenied - currentDenied
})

// =============================================================================
// Recent Denials & Recent Issues (use in-memory claims for display lists)
// =============================================================================

const filteredDeniedClaims = computed(() => {
  return appStore.claims.filter(c => getClaimStatus(c) === 'denied')
})

const recentDeniedClaims = computed(() => {
  return filteredDeniedClaims.value
    .filter(c => getClaimSubmissionDate(c))
    .sort((a, b) => {
      const dateA = getClaimSubmissionDate(a) || ''
      const dateB = getClaimSubmissionDate(b) || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 5)
})

// Group recent denied claims by pattern (excluding claims without pattern matches)
const recentIssuesByPattern = computed(() => {
  const issueMap = new Map<string, { pattern: Pattern; claimCount: number; totalAmount: number }>()

  for (const claim of filteredDeniedClaims.value) {
    const patterns = patternsStore.getPatternsByClaim(claim.id)
    const pattern = patterns[0]
    if (!pattern) continue // Exclude claims without pattern matches

    const existing = issueMap.get(pattern.id)

    if (existing) {
      existing.claimCount++
      existing.totalAmount += getClaimBilledAmount(claim)
    } else {
      issueMap.set(pattern.id, {
        pattern,
        claimCount: 1,
        totalAmount: getClaimBilledAmount(claim),
      })
    }
  }

  // Convert to array, sort by claim count descending, limit to top 5
  return Array.from(issueMap.values())
    .sort((a, b) => b.claimCount - a.claimCount)
    .slice(0, 5)
})
</script>
