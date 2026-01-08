<template>
  <div class="flex-1 overflow-auto p-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Learning Impact & ROI Dashboard</h1>
          <p class="text-sm text-neutral-600 mt-1">
            Measure the return on your practice sessions and pattern learning
          </p>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
          <button
            @click="activeView = 'provider'"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="{
              'bg-white text-neutral-900 shadow-sm': activeView === 'provider',
              'text-neutral-600 hover:text-neutral-900': activeView !== 'provider'
            }"
          >
            Provider View
          </button>
          <button
            @click="activeView = 'network'"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="{
              'bg-white text-neutral-900 shadow-sm': activeView === 'network',
              'text-neutral-600 hover:text-neutral-900': activeView !== 'network'
            }"
          >
            Network View
          </button>
          <button
            @click="activeView = 'achievements'"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="{
              'bg-white text-neutral-900 shadow-sm': activeView === 'achievements',
              'text-neutral-600 hover:text-neutral-900': activeView !== 'achievements'
            }"
          >
            Achievement History
          </button>
        </div>
      </div>
    </div>

    <!-- Provider View -->
    <div v-if="activeView === 'provider'">
    <!-- Executive Summary -->
    <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-sm border border-primary-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
        <Icon name="heroicons:chart-bar-square" class="w-5 h-5" />
        Executive Summary
      </h2>
      <div class="bg-white/80 backdrop-blur rounded-lg p-4">
        <p class="text-sm text-neutral-700 leading-relaxed">
          Since adopting this tool, your practice has:
        </p>
        <ul class="mt-3 space-y-2">
          <li class="flex items-start gap-2 text-sm">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <span>
              Reduced denial rate by <strong>{{ denialRateReduction.toFixed(1) }}%</strong>
              ({{ baselineMetrics.denialRate.toFixed(1) }}% → {{ currentMetrics.denialRate.toFixed(1) }}%)
            </span>
          </li>
          <li class="flex items-start gap-2 text-sm">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <span>
              Addressed <strong>{{ roi.patternsResolved + roi.patternsImproving }} of {{ patternsStore.totalPatternsDetected }}</strong> identified patterns
              ({{ Math.round(((roi.patternsResolved + roi.patternsImproving) / patternsStore.totalPatternsDetected) * 100) }}%)
            </span>
          </li>
          <li class="flex items-start gap-2 text-sm">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <span>
              Reduced appeals by <strong>{{ appealReduction }}%</strong> through proactive corrections
            </span>
          </li>
          <li class="flex items-start gap-2 text-sm">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <span>
              Saved an estimated <strong>{{ formatCurrency(adminSavings) }}</strong> in administrative costs
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Settings / Configuration -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
        Settings
      </h2>

      <div class="grid grid-cols-2 gap-6">
        <!-- Measurement Window -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-3">Measurement Window</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="window in measurementWindows"
              :key="window.value"
              @click="selectedWindow = window.value"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              :class="{
                'bg-primary-600 text-white border-primary-600': selectedWindow === window.value,
                'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50': selectedWindow !== window.value
              }"
            >
              {{ window.label }}
            </button>
          </div>
          <p class="text-xs text-neutral-500 mt-2">
            Comparing last {{ selectedWindow }} days vs previous {{ selectedWindow }} days
          </p>
        </div>

        <!-- Admin Cost Per Appeal -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-3">Admin Cost Per Appeal</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
            <input
              v-model.number="adminCostPerAppeal"
              type="number"
              min="0"
              step="10"
              class="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <p class="text-xs text-neutral-500 mt-2">
            Used in administrative savings calculations
          </p>
        </div>
      </div>
    </div>

    <!-- Top ROI Metrics -->
    <div class="grid grid-cols-5 gap-6 mb-6">
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-success-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-success-700 font-medium">Total Savings</div>
          <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-success-600" />
        </div>
        <div class="text-3xl font-semibold text-success-900">
          {{ formatCurrency(roi.estimatedSavings, true) }}
        </div>
        <div class="text-xs text-success-700 mt-1">
          From {{ roi.patternsResolved + roi.patternsImproving }} patterns
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Practice Sessions</div>
          <Icon name="heroicons:academic-cap" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">{{ roi.totalPracticeSessions }}</div>
        <div class="text-xs text-neutral-500 mt-1">
          {{ roi.streakDays }}-day streak
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Time Invested</div>
          <Icon name="heroicons:clock" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">
          {{ Math.round(roi.totalTimeInvested) }}<span class="text-lg text-neutral-600">m</span>
        </div>
        <div class="text-xs text-neutral-500 mt-1">
          ~{{ roi.avgSessionDuration }}m per session
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Savings/Hour</div>
          <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">
          {{ formatCurrency(savingsPerHour, true) }}
        </div>
        <div class="text-xs text-neutral-500 mt-1">
          ROI efficiency metric
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Corrections</div>
          <Icon name="heroicons:check-badge" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">{{ roi.totalCorrectionsApplied }}</div>
        <div class="text-xs text-neutral-500 mt-1">
          {{ roi.avgCorrectionRate }}% avg rate
        </div>
      </div>
    </div>

    <!-- Key Performance Indicators -->
    <div class="grid grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Denial Rate</div>
          <Icon name="heroicons:x-circle" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="flex items-baseline gap-2">
          <div class="text-3xl font-semibold text-neutral-900">
            {{ dashboardMetrics.denialRate.toFixed(1) }}%
          </div>
          <div class="flex items-center gap-1">
            <Icon
              :name="dashboardMetrics.trends.denialRate.trend === 'down' ? 'heroicons:arrow-down' : dashboardMetrics.trends.denialRate.trend === 'up' ? 'heroicons:arrow-up' : 'heroicons:minus'"
              class="w-4 h-4"
              :class="{
                'text-success-600': dashboardMetrics.trends.denialRate.trend === 'down',
                'text-error-600': dashboardMetrics.trends.denialRate.trend === 'up',
                'text-neutral-400': dashboardMetrics.trends.denialRate.trend === 'stable'
              }"
            />
            <span
              class="text-xs font-medium"
              :class="{
                'text-success-600': dashboardMetrics.trends.denialRate.trend === 'down',
                'text-error-600': dashboardMetrics.trends.denialRate.trend === 'up',
                'text-neutral-400': dashboardMetrics.trends.denialRate.trend === 'stable'
              }"
            >
              {{ Math.abs(dashboardMetrics.trends.denialRate.percentChange).toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="text-xs text-neutral-500 mt-1">vs previous 30 days</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Approval Rate</div>
          <Icon name="heroicons:check-circle" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="flex items-baseline gap-2">
          <div class="text-3xl font-semibold text-neutral-900">
            {{ dashboardMetrics.approvalRate.toFixed(1) }}%
          </div>
          <div class="flex items-center gap-1">
            <Icon
              :name="dashboardMetrics.trends.approvalRate.trend === 'up' ? 'heroicons:arrow-up' : dashboardMetrics.trends.approvalRate.trend === 'down' ? 'heroicons:arrow-down' : 'heroicons:minus'"
              class="w-4 h-4"
              :class="{
                'text-success-600': dashboardMetrics.trends.approvalRate.trend === 'up',
                'text-error-600': dashboardMetrics.trends.approvalRate.trend === 'down',
                'text-neutral-400': dashboardMetrics.trends.approvalRate.trend === 'stable'
              }"
            />
            <span
              class="text-xs font-medium"
              :class="{
                'text-success-600': dashboardMetrics.trends.approvalRate.trend === 'up',
                'text-error-600': dashboardMetrics.trends.approvalRate.trend === 'down',
                'text-neutral-400': dashboardMetrics.trends.approvalRate.trend === 'stable'
              }"
            >
              {{ Math.abs(dashboardMetrics.trends.approvalRate.percentChange).toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="text-xs text-neutral-500 mt-1">vs previous 30 days</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Patterns Resolved</div>
          <Icon name="heroicons:sparkles" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">{{ roi.patternsResolved }}</div>
        <div class="text-xs text-neutral-500 mt-1">
          {{ roi.patternsImproving }} improving
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-neutral-600">Denials Avoided</div>
          <Icon name="heroicons:shield-check" class="w-5 h-5 text-neutral-400" />
        </div>
        <div class="text-3xl font-semibold text-neutral-900">{{ roi.avoidedDenials }}</div>
        <div class="text-xs text-neutral-500 mt-1">
          From resolved patterns
        </div>
      </div>
    </div>

    <!-- Time Series Charts -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- Denial Rate Over Time -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Denial Rate Trend</h2>
          <Icon name="heroicons:chart-bar" class="w-5 h-5 text-neutral-400" />
        </div>
        <div v-if="roi.denialRateOverTime.length > 0" class="space-y-3">
          <div
            v-for="point in roi.denialRateOverTime"
            :key="point.date"
            class="flex items-center gap-3"
          >
            <div class="text-xs text-neutral-600 w-20">{{ point.label }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-error-500 to-error-600 rounded-full transition-all"
                    :style="{ width: `${Math.min(point.value * 5, 100)}%` }"
                  ></div>
                </div>
                <div class="text-sm font-medium text-neutral-900 w-12 text-right">
                  {{ point.value.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-neutral-500">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
          <p class="text-sm">No data available yet</p>
        </div>
      </div>

      <!-- Savings Over Time -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Savings Accumulation</h2>
          <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-neutral-400" />
        </div>
        <div v-if="roi.savingsOverTime.length > 0" class="space-y-3">
          <div
            v-for="point in roi.savingsOverTime"
            :key="point.date"
            class="flex items-center gap-3"
          >
            <div class="text-xs text-neutral-600 w-20">{{ point.label }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-success-500 to-success-600 rounded-full transition-all"
                    :style="{ width: `${Math.min((point.value / maxSavings) * 100, 100)}%` }"
                  ></div>
                </div>
                <div class="text-sm font-medium text-neutral-900 w-16 text-right">
                  {{ formatCurrency(point.value, true) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-neutral-500">
          <Icon name="heroicons:currency-dollar" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
          <p class="text-sm">No savings data yet</p>
        </div>
      </div>
    </div>

    <!-- Practice Activity Over Time -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">Practice Activity</h2>
        <Icon name="heroicons:academic-cap" class="w-5 h-5 text-neutral-400" />
      </div>
      <div v-if="roi.practiceActivityOverTime.length > 0" class="space-y-3">
        <div
          v-for="point in roi.practiceActivityOverTime"
          :key="point.date"
          class="flex items-center gap-3"
        >
          <div class="text-xs text-neutral-600 w-20">{{ point.label }}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                  :style="{ width: `${Math.min((point.value / maxActivity) * 100, 100)}%` }"
                ></div>
              </div>
              <div class="text-sm font-medium text-neutral-900 w-12 text-right">
                {{ point.value }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-neutral-500">
        <Icon name="heroicons:academic-cap" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p class="text-sm">No practice activity yet</p>
        <p class="text-xs text-neutral-400 mt-1">Start practicing in the Claim Lab</p>
      </div>
    </div>

    <!-- Pattern Performance Table -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">Pattern Performance</h2>
        <div class="flex items-center gap-2">
          <label class="text-sm text-neutral-600">Sort by:</label>
          <select
            v-model="sortBy"
            class="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
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
            <tr class="border-b border-neutral-200">
              <th class="text-left text-xs font-medium text-neutral-600 pb-3 pr-4">Pattern</th>
              <th class="text-left text-xs font-medium text-neutral-600 pb-3 pr-4">Category</th>
              <th class="text-right text-xs font-medium text-neutral-600 pb-3 pr-4">Denials Before</th>
              <th class="text-right text-xs font-medium text-neutral-600 pb-3 pr-4">Denials After</th>
              <th
                class="text-right text-xs font-medium text-neutral-600 pb-3 pr-4 cursor-pointer hover:text-neutral-900 select-none"
                @click="togglePatternSort('denials')"
              >
                <div class="flex items-center justify-end gap-1">
                  Reduction
                  <Icon :name="getPatternSortIcon('denials')" class="w-4 h-4" :class="sortBy === 'denials' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th
                class="text-right text-xs font-medium text-neutral-600 pb-3 cursor-pointer hover:text-neutral-900 select-none"
                @click="togglePatternSort('savings')"
              >
                <div class="flex items-center justify-end gap-1">
                  Savings Realized
                  <Icon :name="getPatternSortIcon('savings')" class="w-4 h-4" :class="sortBy === 'savings' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="impact in sortedPatternImpact"
              :key="impact.patternId"
              class="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
              @click="navigateToPattern(impact.patternId)"
            >
              <td class="py-3 pr-4">
                <div class="text-sm font-medium text-neutral-900">{{ impact.patternTitle }}</div>
                <div class="text-xs text-neutral-500">{{ impact.patternId }}</div>
              </td>
              <td class="py-3 pr-4">
                <span class="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded">
                  {{ formatCategory(impact.category) }}
                </span>
              </td>
              <td class="py-3 pr-4 text-right text-sm text-neutral-900">{{ impact.denialsBefore }}</td>
              <td class="py-3 pr-4 text-right text-sm text-neutral-900">{{ impact.denialsAfter }}</td>
              <td class="py-3 pr-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Icon
                    name="heroicons:arrow-down"
                    class="w-4 h-4"
                    :class="{
                      'text-success-600': impact.denialsBefore > impact.denialsAfter,
                      'text-neutral-400': impact.denialsBefore === impact.denialsAfter
                    }"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="{
                      'text-success-600': impact.denialsBefore > impact.denialsAfter,
                      'text-neutral-600': impact.denialsBefore === impact.denialsAfter
                    }"
                  >
                    {{ impact.denialsBefore - impact.denialsAfter }}
                  </span>
                </div>
              </td>
              <td class="py-3 text-right text-sm font-semibold text-success-700">
                {{ formatCurrency(impact.savingsRealized) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8 text-neutral-500">
        <Icon name="heroicons:chart-bar" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p class="text-sm">No pattern performance data yet</p>
        <p class="text-xs text-neutral-400 mt-1">Practice patterns to see their impact</p>
      </div>
    </div>

    <!-- Recent Practice Activity -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 class="text-lg font-semibold text-neutral-900 mb-4">Recent Practice Sessions</h2>
      <div v-if="recentPracticeSessions.length > 0" class="space-y-3">
        <div
          v-for="session in recentPracticeSessions"
          :key="session.id"
          class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-success-100': (session.metadata.correctionsCount || 0) > 0,
                'bg-neutral-100': (session.metadata.correctionsCount || 0) === 0
              }"
            >
              <Icon
                name="heroicons:academic-cap"
                class="w-5 h-5"
                :class="{
                  'text-success-600': (session.metadata.correctionsCount || 0) > 0,
                  'text-neutral-600': (session.metadata.correctionsCount || 0) === 0
                }"
              />
            </div>
            <div>
              <div class="text-sm font-medium text-neutral-900">
                {{ getPatternTitle(session.metadata.patternId) }}
              </div>
              <div class="text-xs text-neutral-500">
                {{ formatRelativeTime(session.timestamp) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-right">
              <div class="text-xs text-neutral-600">Duration</div>
              <div class="text-sm font-medium text-neutral-900">
                {{ formatDuration(session.metadata.duration) }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-neutral-600">Corrections</div>
              <div class="text-sm font-medium text-neutral-900">
                {{ session.metadata.correctionsCount || 0 }}
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

      <div v-else class="text-center py-8 text-neutral-500">
        <Icon name="heroicons:academic-cap" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p class="text-sm">No practice sessions yet</p>
        <p class="text-xs text-neutral-400 mt-1">Complete practice sessions to see your activity</p>
        <NuxtLink
          to="/claim-lab"
          class="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Start Practicing
        </NuxtLink>
      </div>
    </div>
    </div><!-- End Provider View -->

    <!-- Network View (Payer Aggregate) -->
    <div v-else>
      <div class="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <Icon name="heroicons:building-office-2" class="w-5 h-5" />
          Network Impact Summary
        </h2>
        <div class="bg-white/80 backdrop-blur rounded-lg p-4">
          <div class="grid grid-cols-4 gap-4">
            <div>
              <div class="text-xs text-neutral-600 mb-1">Providers Using Tool</div>
              <div class="text-2xl font-bold text-neutral-900">{{ networkMetrics.providersCount }}</div>
            </div>
            <div>
              <div class="text-xs text-neutral-600 mb-1">Avg Denial Rate Improvement</div>
              <div class="text-2xl font-bold text-success-600">{{ networkMetrics.avgImprovement }}%</div>
            </div>
            <div>
              <div class="text-xs text-neutral-600 mb-1">Total Appeals Avoided</div>
              <div class="text-2xl font-bold text-neutral-900">{{ networkMetrics.totalAppealsAvoided }}</div>
            </div>
            <div>
              <div class="text-xs text-neutral-600 mb-1">Total Admin Savings</div>
              <div class="text-2xl font-bold text-success-600">{{ formatCurrency(networkMetrics.totalSavings) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Breakdown Table -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Provider Performance</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-neutral-200">
                <th
                  class="text-left text-xs font-medium text-neutral-600 pb-3 pr-4 cursor-pointer hover:text-neutral-900 select-none"
                  @click="toggleProviderSort('name')"
                >
                  <div class="flex items-center gap-1">
                    Provider
                    <Icon :name="getProviderSortIcon('name')" class="w-4 h-4" :class="providerSortBy === 'name' ? 'text-primary-600' : 'text-neutral-400'" />
                  </div>
                </th>
                <th
                  class="text-center text-xs font-medium text-neutral-600 pb-3 pr-4 cursor-pointer hover:text-neutral-900 select-none"
                  @click="toggleProviderSort('engagement')"
                >
                  <div class="flex items-center justify-center gap-1">
                    Engagement Level
                    <Icon :name="getProviderSortIcon('engagement')" class="w-4 h-4" :class="providerSortBy === 'engagement' ? 'text-primary-600' : 'text-neutral-400'" />
                  </div>
                </th>
                <th
                  class="text-right text-xs font-medium text-neutral-600 pb-3 pr-4 cursor-pointer hover:text-neutral-900 select-none"
                  @click="toggleProviderSort('improvement')"
                >
                  <div class="flex items-center justify-end gap-1">
                    Denial Rate Improvement
                    <Icon :name="getProviderSortIcon('improvement')" class="w-4 h-4" :class="providerSortBy === 'improvement' ? 'text-primary-600' : 'text-neutral-400'" />
                  </div>
                </th>
                <th
                  class="text-right text-xs font-medium text-neutral-600 pb-3 pr-4 cursor-pointer hover:text-neutral-900 select-none"
                  @click="toggleProviderSort('sessions')"
                >
                  <div class="flex items-center justify-end gap-1">
                    Practice Sessions
                    <Icon :name="getProviderSortIcon('sessions')" class="w-4 h-4" :class="providerSortBy === 'sessions' ? 'text-primary-600' : 'text-neutral-400'" />
                  </div>
                </th>
                <th class="text-center text-xs font-medium text-neutral-600 pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="provider in sortedNetworkProviders"
                :key="provider.id"
                class="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                <td class="py-3 pr-4">
                  <div class="text-sm font-medium text-neutral-900">{{ provider.name }}</div>
                  <div class="text-xs text-neutral-500">{{ provider.specialty }}</div>
                </td>
                <td class="py-3 pr-4 text-center">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-success-100 text-success-700': provider.engagementLevel === 'high',
                      'bg-warning-100 text-warning-700': provider.engagementLevel === 'medium',
                      'bg-error-100 text-error-700': provider.engagementLevel === 'low'
                    }"
                  >
                    {{ provider.engagementLevel.charAt(0).toUpperCase() + provider.engagementLevel.slice(1) }}
                  </span>
                </td>
                <td class="py-3 pr-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Icon
                      :name="provider.improvement > 0 ? 'heroicons:arrow-down' : 'heroicons:arrow-up'"
                      class="w-4 h-4"
                      :class="{
                        'text-success-600': provider.improvement > 0,
                        'text-error-600': provider.improvement < 0
                      }"
                    />
                    <span
                      class="text-sm font-medium"
                      :class="{
                        'text-success-600': provider.improvement > 0,
                        'text-error-600': provider.improvement < 0
                      }"
                    >
                      {{ Math.abs(provider.improvement).toFixed(1) }}%
                    </span>
                  </div>
                </td>
                <td class="py-3 pr-4 text-right text-sm text-neutral-900">
                  {{ provider.practiceSessions }}
                </td>
                <td class="py-3 text-center">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-success-100 text-success-700': provider.status === 'active',
                      'bg-neutral-100 text-neutral-700': provider.status === 'inactive'
                    }"
                  >
                    {{ provider.status.charAt(0).toUpperCase() + provider.status.slice(1) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Correlation Proof -->
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">Engagement → Outcome Correlation</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-success-50 rounded-lg border border-success-200">
              <div>
                <div class="text-sm font-medium text-success-900">High Engagement Providers</div>
                <div class="text-xs text-success-700 mt-1">{{ networkMetrics.highEngagementCount }} providers</div>
              </div>
              <div class="text-2xl font-bold text-success-600">{{ networkMetrics.highEngagementImprovement }}%</div>
            </div>
            <div class="flex items-center justify-between p-4 bg-error-light rounded-lg border border-error-200">
              <div>
                <div class="text-sm font-medium text-error-900">Low Engagement Providers</div>
                <div class="text-xs text-error-700 mt-1">{{ networkMetrics.lowEngagementCount }} providers</div>
              </div>
              <div class="text-2xl font-bold text-error-600">{{ networkMetrics.lowEngagementImprovement }}%</div>
            </div>
            <div class="pt-4 border-t border-neutral-200">
              <div class="flex items-center gap-2 text-sm text-neutral-700">
                <Icon name="heroicons:light-bulb" class="w-5 h-5 text-yellow-500" />
                <span>
                  High engagement providers show
                  <strong>{{ (networkMetrics.highEngagementImprovement - networkMetrics.lowEngagementImprovement).toFixed(1) }}%</strong>
                  better improvement
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">Network-Wide Patterns</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div class="text-sm text-neutral-700">Total Patterns Identified</div>
              <div class="text-lg font-semibold text-neutral-900">{{ networkMetrics.totalPatterns }}</div>
            </div>
            <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div class="text-sm text-neutral-700">Patterns Resolved</div>
              <div class="text-lg font-semibold text-success-600">{{ networkMetrics.patternsResolved }}</div>
            </div>
            <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div class="text-sm text-neutral-700">Currently In Progress</div>
              <div class="text-lg font-semibold text-warning-600">{{ networkMetrics.patternsInProgress }}</div>
            </div>
            <div class="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-200">
              <div class="text-sm text-secondary-900 font-medium">Resolution Rate</div>
              <div class="text-lg font-bold text-secondary-600">
                {{ Math.round((networkMetrics.patternsResolved / networkMetrics.totalPatterns) * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div><!-- End Network View -->

    <!-- Achievement History View -->
    <div v-if="activeView === 'achievements'">
      <!-- Achievement Summary -->
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-success-200 p-8 mb-6">
        <div class="flex items-start gap-6">
          <div class="p-4 bg-white rounded-full shadow-sm">
            <Icon name="heroicons:trophy" class="w-12 h-12 text-success-600" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-success-900 mb-2">Your Impact & Achievements</h2>
            <p class="text-success-800 mb-4">
              Track your progress in resolving denial patterns and improving claim acceptance rates.
            </p>
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-neutral-600 mb-1">Patterns Resolved</div>
                <div class="text-3xl font-bold text-success-600">{{ patternsStore.resolvedPatterns.length }}</div>
                <div class="text-xs text-neutral-500 mt-1">Total achievements</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-neutral-600 mb-1">Patterns Improving</div>
                <div class="text-3xl font-bold text-warning-600">{{ patternsStore.improvingPatterns.length }}</div>
                <div class="text-xs text-neutral-500 mt-1">In progress</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-neutral-600 mb-1">Total Impact</div>
                <div class="text-3xl font-bold text-neutral-900">{{ formatCurrency(totalResolvedImpact, true) }}</div>
                <div class="text-xs text-neutral-500 mt-1">Savings realized</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-neutral-600 mb-1">Success Rate</div>
                <div class="text-3xl font-bold text-success-600">{{ achievementSuccessRate }}%</div>
                <div class="text-xs text-neutral-500 mt-1">Patterns resolved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resolved Patterns Grid -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">Resolved Patterns</h3>
          <span class="text-sm text-neutral-600">{{ patternsStore.resolvedPatterns.length }} total</span>
        </div>

        <div v-if="patternsStore.resolvedPatterns.length > 0" class="grid grid-cols-2 gap-4">
          <div
            v-for="pattern in patternsStore.resolvedPatterns"
            :key="pattern.id"
            class="bg-white rounded-lg border border-success-200 p-6 hover:border-success-400 transition-colors cursor-pointer"
            @click="navigateToPattern(pattern.id)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-success-100 rounded-lg">
                  <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <h4 class="font-medium text-neutral-900">{{ pattern.title }}</h4>
                  <p class="text-xs text-neutral-600 mt-0.5">{{ formatCategory(pattern.category) }}</p>
                </div>
              </div>
              <div class="px-2 py-1 bg-success-100 text-success-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Icon name="heroicons:check-circle" class="w-3 h-3" />
                Resolved
              </div>
            </div>

            <p class="text-sm text-neutral-700 mb-4 line-clamp-2">{{ pattern.description }}</p>

            <!-- Before/After Metrics -->
            <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-neutral-200">
              <div>
                <div class="text-xs text-neutral-600 mb-1">Before</div>
                <div class="text-sm font-semibold text-error-600">{{ pattern.score.frequency }} denials</div>
                <div class="text-xs text-neutral-500">{{ formatCurrency(pattern.totalAtRisk) }} at risk</div>
              </div>
              <div>
                <div class="text-xs text-neutral-600 mb-1">After</div>
                <div class="text-sm font-semibold text-success-600">{{ calculateAfterDenials(pattern) }} denials</div>
                <div class="text-xs text-neutral-500">{{ formatCurrency(calculateSavingsRealized(pattern)) }} saved</div>
              </div>
            </div>

            <!-- Improvement Metrics -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-neutral-600">
                <strong class="text-neutral-900">{{ pattern.learningProgress }}%</strong> improvement
              </span>
              <span class="text-neutral-600">
                <strong class="text-neutral-900">{{ pattern.practiceSessionsCompleted }}</strong> sessions
              </span>
              <span class="text-neutral-600">
                <strong class="text-neutral-900">{{ pattern.correctionsApplied }}</strong> corrections
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 bg-neutral-50 rounded-lg">
          <Icon name="heroicons:flag" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 class="text-lg font-medium text-neutral-900 mb-1">No Patterns Resolved Yet</h3>
          <p class="text-sm text-neutral-600 mb-4">
            Keep working on active patterns to see your achievements here
          </p>
          <NuxtLink
            to="/insights"
            class="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            View Active Patterns
          </NuxtLink>
        </div>
      </div>

      <!-- Improving Patterns -->
      <div v-if="patternsStore.improvingPatterns.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">Patterns In Progress</h3>
          <span class="text-sm text-neutral-600">{{ patternsStore.improvingPatterns.length }} improving</span>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="pattern in patternsStore.improvingPatterns"
            :key="pattern.id"
            class="bg-white rounded-lg border border-warning-200 p-4 hover:border-warning-400 transition-colors cursor-pointer"
            @click="navigateToPattern(pattern.id)"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-4 h-4 text-warning-600" />
              <span class="text-sm font-medium text-neutral-900">{{ pattern.title }}</span>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between text-xs text-neutral-600 mb-1">
                <span>Progress</span>
                <span class="font-medium text-neutral-900">{{ pattern.learningProgress }}%</span>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div
                  class="bg-warning-500 h-2 rounded-full transition-all"
                  :style="{ width: `${pattern.learningProgress}%` }"
                />
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-neutral-600">
              <span>{{ pattern.improvements.length }} improvements</span>
              <span>{{ pattern.practiceSessionsCompleted }} sessions</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress Timeline -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Your Journey</h3>
        <div v-if="patternsStore.patterns.length > 0" class="space-y-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-24 text-xs text-neutral-600 pt-1">All Patterns</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <div class="flex-1 bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div class="flex h-full">
                    <div
                      class="bg-success-500 h-full"
                      :style="{ width: `${(patternsStore.resolvedPatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.resolvedPatterns.length} resolved`"
                    />
                    <div
                      class="bg-warning-500 h-full"
                      :style="{ width: `${(patternsStore.improvingPatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.improvingPatterns.length} improving`"
                    />
                    <div
                      class="bg-error-500 h-full"
                      :style="{ width: `${(patternsStore.activePatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.activePatterns.length} active`"
                    />
                  </div>
                </div>
                <span class="text-xs font-medium text-neutral-900">{{ patternsStore.totalPatternsDetected }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-success-500 rounded"></div>
                  <span class="text-neutral-600">{{ patternsStore.resolvedPatterns.length }} Resolved</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-warning-500 rounded"></div>
                  <span class="text-neutral-600">{{ patternsStore.improvingPatterns.length }} Improving</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-error-500 rounded"></div>
                  <span class="text-neutral-600">{{ patternsStore.activePatterns.length }} Active</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-neutral-200 grid grid-cols-3 gap-4">
            <div class="text-center p-4 bg-neutral-50 rounded-lg">
              <div class="text-2xl font-bold text-neutral-900 mb-1">{{ patternsStore.avgLearningProgress }}%</div>
              <div class="text-xs text-neutral-600">Average Progress</div>
            </div>
            <div class="text-center p-4 bg-neutral-50 rounded-lg">
              <div class="text-2xl font-bold text-neutral-900 mb-1">{{ formatCurrency(totalSavingsRealized, true) }}</div>
              <div class="text-xs text-neutral-600">Total Savings</div>
            </div>
            <div class="text-center p-4 bg-neutral-50 rounded-lg">
              <div class="text-2xl font-bold text-neutral-900 mb-1">{{ totalPracticeSessions }}</div>
              <div class="text-xs text-neutral-600">Practice Sessions</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-neutral-500">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
          <p class="text-sm">No patterns detected yet</p>
        </div>
      </div>
    </div><!-- End Achievement History View -->
  </div>
</template>

<script setup lang="ts">
import { formatRelative } from 'date-fns'

// Stores
const analyticsStore = useAnalyticsStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()
const appStore = useAppStore()

// Composables
const { formatCurrency } = useAnalytics()
const { getPatternCategoryIcon } = usePatterns()

// State
const sortBy = ref<'savings' | 'denials' | 'recent'>('savings')
const sortDirection = ref<'asc' | 'desc'>('desc')
const selectedWindow = ref(90) // Default to 90 days
const adminCostPerAppeal = ref(350) // Default admin cost
const activeView = ref<'provider' | 'network' | 'achievements'>('provider')

// Column sorting for pattern impact table
const togglePatternSort = (column: 'savings' | 'denials' | 'recent') => {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDirection.value = 'desc'
  }
}

const getPatternSortIcon = (column: string) => {
  if (sortBy.value !== column) return 'heroicons:chevron-up-down'
  return sortDirection.value === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}

// Provider table sorting
const providerSortBy = ref<'name' | 'engagement' | 'improvement' | 'sessions'>('improvement')
const providerSortDir = ref<'asc' | 'desc'>('desc')

const toggleProviderSort = (column: typeof providerSortBy.value) => {
  if (providerSortBy.value === column) {
    providerSortDir.value = providerSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    providerSortBy.value = column
    providerSortDir.value = column === 'name' ? 'asc' : 'desc'
  }
}

const getProviderSortIcon = (column: string) => {
  if (providerSortBy.value !== column) return 'heroicons:chevron-up-down'
  return providerSortDir.value === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}

// Measurement window options
const measurementWindows = [
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
  { value: 180, label: '180d' },
  { value: 360, label: '360d' },
]

// Computed data
const roi = computed(() => analyticsStore.practiceROI)
const dashboardMetrics = computed(() => analyticsStore.dashboardMetrics)

// Baseline vs Current Metrics (based on selected window)
const baselineMetrics = computed(() => {
  const now = new Date()
  const windowStart = new Date(now.getTime() - selectedWindow.value * 24 * 60 * 60 * 1000)
  const baselineStart = new Date(windowStart.getTime() - selectedWindow.value * 24 * 60 * 60 * 1000)

  const baselineClaims = appStore.claims.filter(c => {
    if (!c.submissionDate) return false
    const date = new Date(c.submissionDate)
    return date >= baselineStart && date < windowStart
  })

  const totalClaims = baselineClaims.length
  const deniedClaims = baselineClaims.filter(c => c.status === 'denied').length
  const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

  return {
    totalClaims,
    deniedClaims,
    denialRate,
  }
})

const currentMetrics = computed(() => {
  const now = new Date()
  const windowStart = new Date(now.getTime() - selectedWindow.value * 24 * 60 * 60 * 1000)

  const currentClaims = appStore.claims.filter(c => {
    if (!c.submissionDate) return false
    const date = new Date(c.submissionDate)
    return date >= windowStart
  })

  const totalClaims = currentClaims.length
  const deniedClaims = currentClaims.filter(c => c.status === 'denied').length
  const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

  return {
    totalClaims,
    deniedClaims,
    denialRate,
  }
})

const denialRateReduction = computed(() => {
  return baselineMetrics.value.denialRate - currentMetrics.value.denialRate
})

const appealReduction = computed(() => {
  // Estimate: assume patterns resolved/improving led to reduced appeals
  // Simplified calculation: % of patterns addressed × historical appeal rate
  const patternsAddressed = roi.value.patternsResolved + roi.value.patternsImproving
  const totalPatterns = patternsStore.totalPatternsDetected || 1
  const reductionRate = (patternsAddressed / totalPatterns) * 100

  return Math.min(Math.round(reductionRate * 0.6), 60) // Cap at 60% reduction
})

const adminSavings = computed(() => {
  // Calculate admin savings based on:
  // (denials avoided) × (% that would have been appealed) × (cost per appeal)
  const denialsAvoided = roi.value.avoidedDenials
  const assumedAppealRate = 0.25 // Assume 25% of denials get appealed
  const appealsAvoided = Math.round(denialsAvoided * assumedAppealRate)

  return appealsAvoided * adminCostPerAppeal.value
})

// Achievement History computed properties
const totalResolvedImpact = computed(() => {
  return patternsStore.resolvedPatterns.reduce((sum, p) => sum + p.totalAtRisk, 0)
})

const achievementSuccessRate = computed(() => {
  const total = patternsStore.totalPatternsDetected
  if (total === 0) return 0
  return Math.round((patternsStore.resolvedPatterns.length / total) * 100)
})

const totalSavingsRealized = computed(() => {
  return patternsStore.resolvedPatterns.reduce((sum, p) => {
    const resolutionRate = p.learningProgress / 100
    return sum + (p.totalAtRisk * resolutionRate)
  }, 0)
})

const totalPracticeSessions = computed(() => {
  return patternsStore.patterns.reduce((sum, p) => sum + p.practiceSessionsCompleted, 0)
})

const calculateAfterDenials = (pattern: any): number => {
  const reduction = pattern.learningProgress / 100
  return Math.round(pattern.score.frequency * (1 - reduction))
}

const calculateSavingsRealized = (pattern: any): number => {
  const resolutionRate = pattern.learningProgress / 100
  return Math.round(pattern.totalAtRisk * resolutionRate)
}

// Network-level aggregated metrics (simulated for demo)
const networkMetrics = computed(() => {
  // Simulate network data with current provider + fictional providers
  const currentProviderImprovement = denialRateReduction.value
  const currentProviderSessions = roi.value.totalPracticeSessions

  return {
    providersCount: 12,
    avgImprovement: 6.8,
    totalAppealsAvoided: 142,
    totalSavings: 49700,
    highEngagementCount: 5,
    highEngagementImprovement: 9.2,
    lowEngagementCount: 7,
    lowEngagementImprovement: 4.1,
    totalPatterns: 84,
    patternsResolved: 31,
    patternsInProgress: 42,
  }
})

// Simulated network provider data
const networkProviders = computed(() => {
  return [
    {
      id: 'p1',
      name: 'Summit Primary Care',
      specialty: 'Family Medicine',
      engagementLevel: 'high',
      improvement: 8.2,
      practiceSessions: 45,
      status: 'active'
    },
    {
      id: 'p2',
      name: 'Valley Medical Group',
      specialty: 'Internal Medicine',
      engagementLevel: 'high',
      improvement: 11.5,
      practiceSessions: 67,
      status: 'active'
    },
    {
      id: 'p3',
      name: 'Riverside Cardiology',
      specialty: 'Cardiology',
      engagementLevel: 'medium',
      improvement: 5.3,
      practiceSessions: 28,
      status: 'active'
    },
    {
      id: 'p4',
      name: 'Harbor Orthopedics',
      specialty: 'Orthopedic Surgery',
      engagementLevel: 'high',
      improvement: 9.7,
      practiceSessions: 52,
      status: 'active'
    },
    {
      id: 'p5',
      name: 'Coastal Family Health',
      specialty: 'Family Medicine',
      engagementLevel: 'low',
      improvement: 2.8,
      practiceSessions: 12,
      status: 'active'
    },
    {
      id: 'p6',
      name: 'Metro Pediatrics',
      specialty: 'Pediatrics',
      engagementLevel: 'medium',
      improvement: 6.1,
      practiceSessions: 34,
      status: 'active'
    },
    {
      id: 'p7',
      name: 'Lakeside Dermatology',
      specialty: 'Dermatology',
      engagementLevel: 'low',
      improvement: 3.4,
      practiceSessions: 8,
      status: 'active'
    },
    {
      id: 'p8',
      name: 'North Point Surgery',
      specialty: 'General Surgery',
      engagementLevel: 'high',
      improvement: 10.3,
      practiceSessions: 58,
      status: 'active'
    },
    {
      id: 'p9',
      name: 'Eastside Wellness',
      specialty: 'Family Medicine',
      engagementLevel: 'low',
      improvement: 4.2,
      practiceSessions: 15,
      status: 'active'
    },
    {
      id: 'p10',
      name: 'Sunset Radiology',
      specialty: 'Radiology',
      engagementLevel: 'medium',
      improvement: 5.9,
      practiceSessions: 31,
      status: 'active'
    },
    {
      id: 'p11',
      name: 'Greenwood Urgent Care',
      specialty: 'Emergency Medicine',
      engagementLevel: 'low',
      improvement: -1.2,
      practiceSessions: 5,
      status: 'inactive'
    },
    {
      id: 'p12',
      name: 'Hilltop Neurology',
      specialty: 'Neurology',
      engagementLevel: 'medium',
      improvement: 7.4,
      practiceSessions: 39,
      status: 'active'
    }
  ]
})

const sortedNetworkProviders = computed(() => {
  const providers = [...networkProviders.value]
  const dir = providerSortDir.value === 'asc' ? 1 : -1

  switch (providerSortBy.value) {
    case 'name':
      return providers.sort((a, b) => dir * a.name.localeCompare(b.name))
    case 'engagement':
      const levels = { high: 3, medium: 2, low: 1 }
      return providers.sort((a, b) => dir * (levels[a.engagementLevel as keyof typeof levels] - levels[b.engagementLevel as keyof typeof levels]))
    case 'improvement':
      return providers.sort((a, b) => dir * (a.improvement - b.improvement))
    case 'sessions':
      return providers.sort((a, b) => dir * (a.practiceSessions - b.practiceSessions))
    default:
      return providers
  }
})

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
  const dir = sortDirection.value === 'asc' ? 1 : -1

  switch (sortBy.value) {
    case 'savings':
      return impacts.sort((a, b) => dir * (b.savingsRealized - a.savingsRealized))
    case 'denials':
      return impacts.sort((a, b) =>
        dir * ((b.denialsBefore - b.denialsAfter) - (a.denialsBefore - a.denialsAfter))
      )
    case 'recent':
      return impacts.sort((a, b) =>
        dir * (new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime())
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
