<script setup lang="ts">
/**
 * Analytics Dashboard Component
 *
 * Main dashboard view combining KPIs, charts, and data tables.
 */

import type { DashboardKPIs } from '~/server/services/analyticsEngine'

// Fetch dashboard data
const days = ref(30)
const loading = ref(true)
const error = ref<string | null>(null)
const dashboardData = ref<{
  period: { days: number; startDate: string; endDate: string }
  kpis: DashboardKPIs
  generatedAt: string
} | null>(null)

const { data, pending, refresh } = await useFetch('/api/v1/analytics/dashboard', {
  query: computed(() => ({ days: days.value })),
  watch: [days],
})

watchEffect(() => {
  loading.value = pending.value
  if (data.value) {
    dashboardData.value = data.value as typeof dashboardData.value
    error.value = null
  }
})

// Computed KPIs
const summary = computed(() => dashboardData.value?.kpis.summary)
const denialRateTrend = computed(() => dashboardData.value?.kpis.denialRateTrend || [])
const revenueImpactTrend = computed(() => dashboardData.value?.kpis.revenueImpactTrend || [])
const denialReasons = computed(() => dashboardData.value?.kpis.denialReasons || [])
const topProviders = computed(() => dashboardData.value?.kpis.topProviderIssues || [])
const topPatterns = computed(() => dashboardData.value?.kpis.topPatternImpacts || [])
const appealMetrics = computed(() => dashboardData.value?.kpis.appealMetrics)

// Sparkline data from trends
const denialRateSparkline = computed(() => denialRateTrend.value.map(d => d.value))
const revenueSparkline = computed(() => revenueImpactTrend.value.map(d => d.value))

// Calculate trend direction
const denialTrend = computed(() => {
  if (denialRateTrend.value.length < 2) return 'stable'
  const first = denialRateTrend.value[0]?.value || 0
  const last = denialRateTrend.value[denialRateTrend.value.length - 1]?.value || 0
  if (last < first - 1) return 'down'
  if (last > first + 1) return 'up'
  return 'stable'
})

const denialRateChange = computed(() => {
  if (denialRateTrend.value.length < 2) return 0
  const first = denialRateTrend.value[0]?.value || 0
  const last = denialRateTrend.value[denialRateTrend.value.length - 1]?.value || 0
  return last - first
})

// Export functionality
const exporting = ref(false)

async function exportReport(format: 'json' | 'csv') {
  if (!dashboardData.value) return

  exporting.value = true
  try {
    const response = await $fetch('/api/v1/reports/generate', {
      method: 'POST',
      body: {
        title: `Claims Analytics Report - ${days.value} Days`,
        startDate: dashboardData.value.period.startDate,
        endDate: dashboardData.value.period.endDate,
        sections: ['summary', 'trends', 'providers', 'patterns', 'denialReasons', 'appeals'],
        format,
      },
    })

    if (format === 'csv') {
      // Response is CSV string
      downloadFile(response as string, `analytics-report-${Date.now()}.csv`, 'text/csv')
    } else {
      // Response is JSON object
      const jsonResponse = response as { report: unknown }
      downloadFile(
        JSON.stringify(jsonResponse.report, null, 2),
        `analytics-report-${Date.now()}.json`,
        'application/json'
      )
    }
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    exporting.value = false
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with controls -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-neutral-900">Analytics Dashboard</h2>
        <p v-if="dashboardData" class="text-sm text-neutral-500 mt-1">
          {{ dashboardData.period.startDate }} to {{ dashboardData.period.endDate }}
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Period selector -->
        <select
          v-model="days"
          class="form-select rounded-md border-neutral-300 text-sm"
        >
          <option :value="7">Last 7 days</option>
          <option :value="14">Last 14 days</option>
          <option :value="30">Last 30 days</option>
          <option :value="60">Last 60 days</option>
          <option :value="90">Last 90 days</option>
        </select>

        <!-- Export buttons -->
        <div class="flex items-center gap-2">
          <button
            class="btn btn-secondary text-sm"
            :disabled="exporting || loading"
            @click="exportReport('csv')"
          >
            <span v-if="exporting">Exporting...</span>
            <span v-else>Export CSV</span>
          </button>
          <button
            class="btn btn-secondary text-sm"
            :disabled="exporting || loading"
            @click="exportReport('json')"
          >
            <span v-if="exporting">Exporting...</span>
            <span v-else>Export JSON</span>
          </button>
        </div>

        <!-- Refresh -->
        <button
          class="btn btn-primary text-sm"
          :disabled="loading"
          @click="() => refresh()"
        >
          <heroicons:arrow-path class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalyticsKPICard
        title="Total Claims"
        :value="summary?.totalClaims || 0"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Denial Rate"
        :value="summary?.denialRate || '0'"
        unit="%"
        :change="denialRateChange"
        change-label="vs start of period"
        :trend="denialTrend"
        trend-positive="down"
        :sparkline-data="denialRateSparkline"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Total Denied"
        :value="summary?.totalDenied || 0"
        prefix="$"
        :sparkline-data="revenueSparkline"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Recovery Rate"
        :value="summary?.recoveryRate || '0'"
        unit="%"
        :loading="loading"
      />
    </div>

    <!-- Appeal metrics -->
    <div v-if="appealMetrics" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <AnalyticsKPICard
        title="Total Appeals"
        :value="appealMetrics.totalAppeals"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Pending Appeals"
        :value="appealMetrics.pendingAppeals"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Overturned"
        :value="appealMetrics.overturnedAppeals"
        :loading="loading"
      />
      <AnalyticsKPICard
        title="Overturn Rate"
        :value="appealMetrics.overturnRate"
        unit="%"
        :loading="loading"
      />
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsTrendChart
        title="Denial Rate Trend"
        :data="denialRateTrend"
        type="line"
        color="#ef4444"
        unit="%"
        :loading="loading"
      />
      <AnalyticsTrendChart
        title="Daily Denied Amount"
        :data="revenueImpactTrend"
        type="bar"
        color="#f59e0b"
        unit="$"
        :loading="loading"
      />
    </div>

    <!-- Denial reasons and providers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsDenialReasonsChart
        title="Top Denial Reasons"
        :data="denialReasons"
        :loading="loading"
      />

      <!-- Top providers table -->
      <div class="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 class="text-sm font-medium text-neutral-700 mb-4">Providers with Highest Denial Rates</h3>

        <div v-if="loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="animate-pulse h-8 bg-neutral-100 rounded" />
        </div>

        <div v-else-if="topProviders.length === 0" class="py-8 text-center text-neutral-400">
          No provider data available
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-neutral-500 border-b border-neutral-200">
              <th class="pb-2 font-medium">Provider</th>
              <th class="pb-2 font-medium text-right">Claims</th>
              <th class="pb-2 font-medium text-right">Denial Rate</th>
              <th class="pb-2 font-medium text-right">$ Denied</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="provider in topProviders.slice(0, 5)"
              :key="provider.providerId"
              class="border-b border-neutral-100 last:border-0"
            >
              <td class="py-2">
                <span class="text-neutral-900">{{ provider.providerName || provider.providerId }}</span>
              </td>
              <td class="py-2 text-right text-neutral-600">{{ provider.totalClaims }}</td>
              <td class="py-2 text-right">
                <span
                  class="font-medium"
                  :class="parseFloat(provider.denialRate) > 20 ? 'text-error-600' : 'text-neutral-900'"
                >
                  {{ provider.denialRate }}%
                </span>
              </td>
              <td class="py-2 text-right text-neutral-600">
                ${{ provider.deniedAmount.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pattern impact -->
    <div class="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 class="text-sm font-medium text-neutral-700 mb-4">Pattern Impact Analysis</h3>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="animate-pulse h-12 bg-neutral-100 rounded" />
      </div>

      <div v-else-if="topPatterns.length === 0" class="py-8 text-center text-neutral-400">
        No pattern data available
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-neutral-500 border-b border-neutral-200">
              <th class="pb-2 font-medium">Pattern</th>
              <th class="pb-2 font-medium">Category</th>
              <th class="pb-2 font-medium text-right">Denials</th>
              <th class="pb-2 font-medium text-right">Total Impact</th>
              <th class="pb-2 font-medium text-right">Avg/Denial</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pattern in topPatterns"
              :key="pattern.patternId"
              class="border-b border-neutral-100 last:border-0"
            >
              <td class="py-3">
                <span class="text-neutral-900 font-medium">{{ pattern.patternTitle || pattern.patternId }}</span>
              </td>
              <td class="py-3">
                <span class="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600">
                  {{ pattern.category || 'General' }}
                </span>
              </td>
              <td class="py-3 text-right text-neutral-600">{{ pattern.denialCount }}</td>
              <td class="py-3 text-right font-medium text-error-600">
                ${{ pattern.totalImpact.toLocaleString() }}
              </td>
              <td class="py-3 text-right text-neutral-600">
                ${{ pattern.avgPerDenial.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Generated timestamp -->
    <p v-if="dashboardData" class="text-xs text-neutral-400 text-right">
      Generated at {{ new Date(dashboardData.generatedAt).toLocaleString() }}
    </p>
  </div>
</template>
