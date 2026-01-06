<template>
  <div class="flex-1 overflow-auto p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Learning Impact & ROI Dashboard</h1>
      <p class="text-sm text-gray-600 mt-1">
        Measure the return on your practice sessions and pattern learning
      </p>
    </div>

    <!-- Top ROI Metrics -->
    <div class="grid grid-cols-5 gap-6 mb-6">
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-green-700 font-medium">Total Savings</div>
          <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-green-600" />
        </div>
        <div class="text-3xl font-semibold text-green-900">
          {{ formatCurrency(roi.estimatedSavings, true) }}
        </div>
        <div class="text-xs text-green-700 mt-1">
          From {{ roi.patternsResolved + roi.patternsImproving }} patterns
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Practice Sessions</div>
          <Icon name="heroicons:academic-cap" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">{{ roi.totalPracticeSessions }}</div>
        <div class="text-xs text-gray-500 mt-1">
          {{ roi.streakDays }}-day streak
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Time Invested</div>
          <Icon name="heroicons:clock" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">
          {{ Math.round(roi.totalTimeInvested) }}<span class="text-lg text-gray-600">m</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          ~{{ roi.avgSessionDuration }}m per session
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Savings/Hour</div>
          <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">
          {{ formatCurrency(savingsPerHour, true) }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          ROI efficiency metric
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Corrections</div>
          <Icon name="heroicons:check-badge" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">{{ roi.totalCorrectionsApplied }}</div>
        <div class="text-xs text-gray-500 mt-1">
          {{ roi.avgCorrectionRate }}% avg rate
        </div>
      </div>
    </div>

    <!-- Key Performance Indicators -->
    <div class="grid grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Denial Rate</div>
          <Icon name="heroicons:x-circle" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="flex items-baseline gap-2">
          <div class="text-3xl font-semibold text-gray-900">
            {{ dashboardMetrics.denialRate.toFixed(1) }}%
          </div>
          <div class="flex items-center gap-1">
            <Icon
              :name="dashboardMetrics.trends.denialRate.trend === 'down' ? 'heroicons:arrow-down' : dashboardMetrics.trends.denialRate.trend === 'up' ? 'heroicons:arrow-up' : 'heroicons:minus'"
              class="w-4 h-4"
              :class="{
                'text-green-600': dashboardMetrics.trends.denialRate.trend === 'down',
                'text-red-600': dashboardMetrics.trends.denialRate.trend === 'up',
                'text-gray-400': dashboardMetrics.trends.denialRate.trend === 'stable'
              }"
            />
            <span
              class="text-xs font-medium"
              :class="{
                'text-green-600': dashboardMetrics.trends.denialRate.trend === 'down',
                'text-red-600': dashboardMetrics.trends.denialRate.trend === 'up',
                'text-gray-400': dashboardMetrics.trends.denialRate.trend === 'stable'
              }"
            >
              {{ Math.abs(dashboardMetrics.trends.denialRate.percentChange).toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-1">vs previous 30 days</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Approval Rate</div>
          <Icon name="heroicons:check-circle" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="flex items-baseline gap-2">
          <div class="text-3xl font-semibold text-gray-900">
            {{ dashboardMetrics.approvalRate.toFixed(1) }}%
          </div>
          <div class="flex items-center gap-1">
            <Icon
              :name="dashboardMetrics.trends.approvalRate.trend === 'up' ? 'heroicons:arrow-up' : dashboardMetrics.trends.approvalRate.trend === 'down' ? 'heroicons:arrow-down' : 'heroicons:minus'"
              class="w-4 h-4"
              :class="{
                'text-green-600': dashboardMetrics.trends.approvalRate.trend === 'up',
                'text-red-600': dashboardMetrics.trends.approvalRate.trend === 'down',
                'text-gray-400': dashboardMetrics.trends.approvalRate.trend === 'stable'
              }"
            />
            <span
              class="text-xs font-medium"
              :class="{
                'text-green-600': dashboardMetrics.trends.approvalRate.trend === 'up',
                'text-red-600': dashboardMetrics.trends.approvalRate.trend === 'down',
                'text-gray-400': dashboardMetrics.trends.approvalRate.trend === 'stable'
              }"
            >
              {{ Math.abs(dashboardMetrics.trends.approvalRate.percentChange).toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-1">vs previous 30 days</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Patterns Resolved</div>
          <Icon name="heroicons:sparkles" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">{{ roi.patternsResolved }}</div>
        <div class="text-xs text-gray-500 mt-1">
          {{ roi.patternsImproving }} improving
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Denials Avoided</div>
          <Icon name="heroicons:shield-check" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">{{ roi.avoidedDenials }}</div>
        <div class="text-xs text-gray-500 mt-1">
          From resolved patterns
        </div>
      </div>
    </div>

    <!-- Time Series Charts -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- Denial Rate Over Time -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Denial Rate Trend</h2>
          <Icon name="heroicons:chart-bar" class="w-5 h-5 text-gray-400" />
        </div>
        <div v-if="roi.denialRateOverTime.length > 0" class="space-y-3">
          <div
            v-for="point in roi.denialRateOverTime"
            :key="point.date"
            class="flex items-center gap-3"
          >
            <div class="text-xs text-gray-600 w-20">{{ point.label }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                    :style="{ width: `${Math.min(point.value * 5, 100)}%` }"
                  ></div>
                </div>
                <div class="text-sm font-medium text-gray-900 w-12 text-right">
                  {{ point.value.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm">No data available yet</p>
        </div>
      </div>

      <!-- Savings Over Time -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Savings Accumulation</h2>
          <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-gray-400" />
        </div>
        <div v-if="roi.savingsOverTime.length > 0" class="space-y-3">
          <div
            v-for="point in roi.savingsOverTime"
            :key="point.date"
            class="flex items-center gap-3"
          >
            <div class="text-xs text-gray-600 w-20">{{ point.label }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                    :style="{ width: `${Math.min((point.value / maxSavings) * 100, 100)}%` }"
                  ></div>
                </div>
                <div class="text-sm font-medium text-gray-900 w-16 text-right">
                  {{ formatCurrency(point.value, true) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:currency-dollar" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm">No savings data yet</p>
        </div>
      </div>
    </div>

    <!-- Practice Activity Over Time -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Practice Activity</h2>
        <Icon name="heroicons:academic-cap" class="w-5 h-5 text-gray-400" />
      </div>
      <div v-if="roi.practiceActivityOverTime.length > 0" class="space-y-3">
        <div
          v-for="point in roi.practiceActivityOverTime"
          :key="point.date"
          class="flex items-center gap-3"
        >
          <div class="text-xs text-gray-600 w-20">{{ point.label }}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                  :style="{ width: `${Math.min((point.value / maxActivity) * 100, 100)}%` }"
                ></div>
              </div>
              <div class="text-sm font-medium text-gray-900 w-12 text-right">
                {{ point.value }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <Icon name="heroicons:academic-cap" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p class="text-sm">No practice activity yet</p>
        <p class="text-xs text-gray-400 mt-1">Start practicing in the Claim Lab</p>
      </div>
    </div>

    <!-- Pattern Performance Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Pattern Performance</h2>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Sort by:</label>
          <select
            v-model="sortBy"
            class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="savings">Savings Realized</option>
            <option value="denials">Denials Reduced</option>
            <option value="recent">Recently Practiced</option>
          </select>
        </div>
      </div>

      <div v-if="sortedPatternImpact.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left text-xs font-medium text-gray-600 pb-3 pr-4">Pattern</th>
              <th class="text-left text-xs font-medium text-gray-600 pb-3 pr-4">Category</th>
              <th class="text-right text-xs font-medium text-gray-600 pb-3 pr-4">Denials Before</th>
              <th class="text-right text-xs font-medium text-gray-600 pb-3 pr-4">Denials After</th>
              <th class="text-right text-xs font-medium text-gray-600 pb-3 pr-4">Reduction</th>
              <th class="text-right text-xs font-medium text-gray-600 pb-3">Savings Realized</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="impact in sortedPatternImpact"
              :key="impact.patternId"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="navigateToPattern(impact.patternId)"
            >
              <td class="py-3 pr-4">
                <div class="text-sm font-medium text-gray-900">{{ impact.patternTitle }}</div>
                <div class="text-xs text-gray-500">{{ impact.patternId }}</div>
              </td>
              <td class="py-3 pr-4">
                <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {{ formatCategory(impact.category) }}
                </span>
              </td>
              <td class="py-3 pr-4 text-right text-sm text-gray-900">{{ impact.denialsBefore }}</td>
              <td class="py-3 pr-4 text-right text-sm text-gray-900">{{ impact.denialsAfter }}</td>
              <td class="py-3 pr-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Icon
                    name="heroicons:arrow-down"
                    class="w-4 h-4"
                    :class="{
                      'text-green-600': impact.denialsBefore > impact.denialsAfter,
                      'text-gray-400': impact.denialsBefore === impact.denialsAfter
                    }"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': impact.denialsBefore > impact.denialsAfter,
                      'text-gray-600': impact.denialsBefore === impact.denialsAfter
                    }"
                  >
                    {{ impact.denialsBefore - impact.denialsAfter }}
                  </span>
                </div>
              </td>
              <td class="py-3 text-right text-sm font-semibold text-green-700">
                {{ formatCurrency(impact.savingsRealized) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <Icon name="heroicons:chart-bar" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p class="text-sm">No pattern performance data yet</p>
        <p class="text-xs text-gray-400 mt-1">Practice patterns to see their impact</p>
      </div>
    </div>

    <!-- Recent Practice Activity -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Practice Sessions</h2>
      <div v-if="recentPracticeSessions.length > 0" class="space-y-3">
        <div
          v-for="session in recentPracticeSessions"
          :key="session.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-green-100': session.metadata.correctionsApplied > 0,
                'bg-gray-100': session.metadata.correctionsApplied === 0
              }"
            >
              <Icon
                name="heroicons:academic-cap"
                class="w-5 h-5"
                :class="{
                  'text-green-600': session.metadata.correctionsApplied > 0,
                  'text-gray-600': session.metadata.correctionsApplied === 0
                }"
              />
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">
                {{ getPatternTitle(session.metadata.patternId) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatRelativeTime(session.timestamp) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-right">
              <div class="text-xs text-gray-600">Duration</div>
              <div class="text-sm font-medium text-gray-900">
                {{ formatDuration(session.metadata.duration) }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-600">Corrections</div>
              <div class="text-sm font-medium text-gray-900">
                {{ session.metadata.correctionsApplied || 0 }}
              </div>
            </div>
            <button
              @click="navigateToPattern(session.metadata.patternId)"
              class="px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              View Pattern
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <Icon name="heroicons:academic-cap" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p class="text-sm">No practice sessions yet</p>
        <p class="text-xs text-gray-400 mt-1">Complete practice sessions to see your activity</p>
        <NuxtLink
          to="/claim-lab"
          class="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Start Practicing
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRelative } from 'date-fns'

// Stores
const analyticsStore = useAnalyticsStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()

// Composables
const { formatCurrency } = useAnalytics()

// State
const sortBy = ref<'savings' | 'denials' | 'recent'>('savings')

// Computed data
const roi = computed(() => analyticsStore.practiceROI)
const dashboardMetrics = computed(() => analyticsStore.dashboardMetrics)

const savingsPerHour = computed(() => {
  const hours = roi.value.totalTimeInvested / 60
  return hours > 0 ? Math.round(roi.value.estimatedSavings / hours) : 0
})

const maxSavings = computed(() => {
  if (roi.value.savingsOverTime.length === 0) return 1
  return Math.max(...roi.value.savingsOverTime.map(p => p.value))
})

const maxActivity = computed(() => {
  if (roi.value.practiceActivityOverTime.length === 0) return 1
  return Math.max(...roi.value.practiceActivityOverTime.map(p => p.value))
})

const sortedPatternImpact = computed(() => {
  const impacts = [...roi.value.patternImpact]

  switch (sortBy.value) {
    case 'savings':
      return impacts.sort((a, b) => b.savingsRealized - a.savingsRealized)
    case 'denials':
      return impacts.sort((a, b) =>
        (b.denialsBefore - b.denialsAfter) - (a.denialsBefore - a.denialsAfter)
      )
    case 'recent':
      return impacts.sort((a, b) =>
        new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime()
      )
    default:
      return impacts
  }
})

const recentPracticeSessions = computed(() => {
  return eventsStore.events
    .filter(e => e.type === 'practice-completed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
})

// Methods
function formatCategory(category: string): string {
  return category.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function formatRelativeTime(timestamp: string): string {
  return formatRelative(new Date(timestamp), new Date())
}

function formatDuration(milliseconds?: number): string {
  if (!milliseconds) return '0m'
  const minutes = Math.round(milliseconds / 60000)
  return `${minutes}m`
}

function getPatternTitle(patternId?: string): string {
  if (!patternId) return 'Unknown Pattern'
  const pattern = patternsStore.getPatternById(patternId)
  return pattern?.title || patternId
}

function navigateToPattern(patternId?: string) {
  if (!patternId) return
  navigateTo(`/insights?pattern=${patternId}`)
}
</script>
