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
            <div class="text-2xl font-semibold text-neutral-900">{{ formatNumber(filteredClaims.length) }}</div>
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
        <div class="bg-white rounded-lg border border-secondary-200 p-4 ring-2 ring-secondary-500">
          <div class="text-xs text-neutral-600 mb-2">Revenue Recovered</div>
          <div class="text-2xl font-semibold text-secondary-600 mb-1">
            <!-- TODO: This value will be an aggregate from the Impact tab calculation.
                 When Impact tab is reworked to calculate baseline vs current period recovery,
                 this field should pull from that computed value. -->
            {{ formatCurrency(revenueRecovered, true) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <span class="text-neutral-500">vs baseline period</span>
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
            to="/insights"
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
            @click="handleClaimClick(claim)"
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

      <!-- Recent Issues (grouped by pattern) -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Recent Issues</h2>
          <NuxtLink
            to="/insights"
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
import { subDays } from 'date-fns'
import type { MetricTrend, Pattern } from '~/types/enhancements'
import type { Claim } from '~/types'

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
  navigateTo(`/insights?pattern=${pattern.id}`)
}

const handleClaimClick = (claim: Claim) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    claimId: claim.id,
  })
  navigateTo(`/claims?claim=${claim.id}&dateRange=${selectedTimeRange.value}`)
}

const handleIssueClick = (pattern: Pattern) => {
  eventsStore.trackEvent('dashboard-click', 'dashboard', {
    patternId: pattern.id,
  })
  navigateTo(`/insights?pattern=${pattern.id}`)
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
    navigateTo({ path: '/claims', query })
  } else if (page === 'insights') {
    navigateTo('/insights')
  } else if (page === 'impact') {
    navigateTo('/impact')
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
// Filtered Claims Data
// =============================================================================

const filteredClaims = computed(() => {
  const now = new Date()
  const cutoffDate = subDays(now, selectedTimeRange.value)

  return appStore.claims.filter(claim => {
    if (!claim.submissionDate) return false
    const claimDate = new Date(claim.submissionDate)
    return claimDate >= cutoffDate
  })
})

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

const filteredDeniedClaims = computed(() => {
  return filteredClaims.value.filter(c => c.status === 'denied')
})

const filteredDeniedAmount = computed(() => {
  return filteredDeniedClaims.value.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

// Previous period denied claims and amount (for Revenue Recovered calculation)
const previousPeriodDeniedClaims = computed(() => {
  return previousPeriodClaims.value.filter(c => c.status === 'denied')
})

const previousPeriodDeniedAmount = computed(() => {
  return previousPeriodDeniedClaims.value.reduce((sum, claim) => sum + claim.billedAmount, 0)
})

const filteredDenialRate = computed(() => {
  if (filteredClaims.value.length === 0) return 0
  return (filteredDeniedClaims.value.length / filteredClaims.value.length) * 100
})

const filteredApprovalRate = computed(() => {
  return 100 - filteredDenialRate.value
})

// =============================================================================
// Trend Calculations
// =============================================================================

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
  return previousPeriodDeniedAmount.value - filteredDeniedAmount.value
})

// =============================================================================
// Recent Denials & Recent Issues
// =============================================================================

const recentDeniedClaims = computed(() => {
  return filteredDeniedClaims.value
    .filter(c => c.submissionDate)
    .sort((a, b) => new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime())
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
      existing.totalAmount += claim.billedAmount
    } else {
      issueMap.set(pattern.id, {
        pattern,
        claimCount: 1,
        totalAmount: claim.billedAmount,
      })
    }
  }

  // Convert to array, sort by claim count descending, limit to top 5
  return Array.from(issueMap.values())
    .sort((a, b) => b.claimCount - a.claimCount)
    .slice(0, 5)
})
</script>
