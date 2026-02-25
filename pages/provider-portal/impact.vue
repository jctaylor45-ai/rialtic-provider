<template>
  <div class="flex-1 overflow-auto p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-900">Impact & ROI</h1>
        <p class="text-sm text-neutral-600 mt-1">
          Track your claims performance outcomes and measure improvement
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <div class="flex bg-neutral-100 rounded-lg p-1">
          <button
            @click="setView('trend')"
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            :class="activeView === 'trend'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'"
          >
            Trend View
          </button>
          <button
            @click="setView('network')"
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            :class="activeView === 'network'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'"
          >
            Network View
          </button>
        </div>

      </div>
    </div>

    <!-- Settings Section (Collapsible) -->
    <div class="mb-6">
      <button
        @click="showSettings = !showSettings"
        class="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <Icon name="heroicons:cog-6-tooth" class="w-4 h-4" />
        Settings
        <Icon
          :name="showSettings ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
          class="w-4 h-4"
        />
      </button>
      <div v-if="showSettings" class="mt-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div class="flex items-center gap-4">
          <label class="text-sm text-neutral-700">Admin Cost Per Appeal:</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
            <input
              v-model.number="adminCostPerAppeal"
              type="number"
              min="0"
              step="10"
              class="w-32 pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <span class="text-xs text-neutral-500">Used for payer ROI calculations</span>
        </div>
      </div>
    </div>

    <!-- TREND VIEW -->
    <div v-if="activeView === 'trend'">
      <!-- Practice Performance Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Practice Performance</h2>

        <!-- Edge Case: No Data -->
        <div v-if="!hasClaimsData" class="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 class="text-lg font-medium text-neutral-900 mb-1">No Claims Data Available</h3>
          <p class="text-sm text-neutral-600">
            No claims data found for the selected time period. Try expanding your date range.
          </p>
        </div>

        <!-- Metric Cards -->
        <div v-else class="grid grid-cols-3 gap-6 mb-6">
          <!-- Denial Rate Card -->
          <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-neutral-600 font-medium">Denial Rate</div>
              <Icon name="heroicons:x-circle" class="w-5 h-5 text-neutral-400" />
            </div>
            <div class="text-3xl font-semibold text-neutral-900 mb-2">
              {{ formatPercentage(currentMetrics.denialRate) }}
            </div>
            <!-- Sparkline -->
            <div class="h-10 mb-1">
              <svg viewBox="0 0 120 40" class="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'sparklineGradient-denial'" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" :stop-color="denialRateTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="denialRateTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0" />
                  </linearGradient>
                  <clipPath id="activeWindow-denial">
                    <rect :x="practiceWindowBoundaryX" y="0" :width="120 - practiceWindowBoundaryX" height="40" />
                  </clipPath>
                </defs>
                <g opacity="0.25">
                  <path :d="denialRateSparklineFill" :fill="`url(#sparklineGradient-denial)`" />
                  <path :d="denialRateSparklinePath" fill="none" :stroke="denialRateTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <g clip-path="url(#activeWindow-denial)">
                  <path :d="denialRateSparklineFill" :fill="`url(#sparklineGradient-denial)`" />
                  <path :d="denialRateSparklinePath" fill="none" :stroke="denialRateTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <line v-if="practiceActiveStartIndex > 0" :x1="practiceWindowBoundaryX" y1="0" :x2="practiceWindowBoundaryX" y2="40" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
              </svg>
            </div>
            <div class="flex justify-between text-[10px] text-neutral-400 mb-2">
              <span>{{ practiceSparklineLabels.first }}</span>
              <span>{{ practiceSparklineLabels.last }}</span>
            </div>
            <!-- Trend Info -->
            <div class="space-y-1">
              <div class="flex items-center gap-1">
                <Icon
                  :name="denialRateTrend.isImproving ? 'heroicons:arrow-down' : 'heroicons:arrow-up'"
                  class="w-4 h-4"
                  :class="denialRateTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                />
                <span
                  class="text-sm font-medium"
                  :class="denialRateTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                >
                  {{ Math.abs(denialRateTrend.pointChange).toFixed(1) }} pts
                </span>
              </div>
              <div class="text-xs text-neutral-500">
                from {{ formatPercentage(baselineMetrics.denialRate) }}
              </div>
              <div class="text-xs text-neutral-500">
                ({{ Math.abs(denialRateTrend.percentChange).toFixed(0) }}% {{ denialRateTrend.isImproving ? 'reduction' : 'increase' }})
              </div>
            </div>
          </div>

          <!-- Appeal Rate Card -->
          <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-neutral-600 font-medium">Appeal Rate</div>
              <Icon name="heroicons:arrow-path" class="w-5 h-5 text-neutral-400" />
            </div>
            <template v-if="hasAppealData">
              <div class="text-3xl font-semibold text-neutral-900 mb-2">
                {{ formatPercentage(currentMetrics.appealRate) }}
              </div>
              <!-- Sparkline -->
              <div class="h-10 mb-1">
                <svg viewBox="0 0 120 40" class="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient :id="'sparklineGradient-appeal'" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" :stop-color="appealRateTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0.3" />
                      <stop offset="100%" :stop-color="appealRateTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0" />
                    </linearGradient>
                    <clipPath id="activeWindow-appeal">
                      <rect :x="practiceWindowBoundaryX" y="0" :width="120 - practiceWindowBoundaryX" height="40" />
                    </clipPath>
                  </defs>
                  <g opacity="0.25">
                    <path :d="appealRateSparklineFill" :fill="`url(#sparklineGradient-appeal)`" />
                    <path :d="appealRateSparklinePath" fill="none" :stroke="appealRateTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <g clip-path="url(#activeWindow-appeal)">
                    <path :d="appealRateSparklineFill" :fill="`url(#sparklineGradient-appeal)`" />
                    <path :d="appealRateSparklinePath" fill="none" :stroke="appealRateTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <line v-if="practiceActiveStartIndex > 0" :x1="practiceWindowBoundaryX" y1="0" :x2="practiceWindowBoundaryX" y2="40" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
                </svg>
              </div>
              <div class="flex justify-between text-[10px] text-neutral-400 mb-2">
                <span>{{ practiceSparklineLabels.first }}</span>
                <span>{{ practiceSparklineLabels.last }}</span>
              </div>
              <!-- Trend Info -->
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                  <Icon
                    :name="appealRateTrend.isImproving ? 'heroicons:arrow-down' : 'heroicons:arrow-up'"
                    class="w-4 h-4"
                    :class="appealRateTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="appealRateTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                  >
                    {{ Math.abs(appealRateTrend.pointChange).toFixed(1) }} pts
                  </span>
                </div>
                <div class="text-xs text-neutral-500">
                  from {{ formatPercentage(baselineMetrics.appealRate) }}
                </div>
                <div class="text-xs text-neutral-500">
                  ({{ Math.abs(appealRateTrend.percentChange).toFixed(0) }}% {{ appealRateTrend.isImproving ? 'reduction' : 'increase' }})
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center py-4">
                <Icon name="heroicons:clock" class="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p class="text-sm text-neutral-500">Appeal tracking coming soon</p>
              </div>
            </template>
          </div>

          <!-- Denied Dollars Card -->
          <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-neutral-600 font-medium">Denied Dollars</div>
              <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-neutral-400" />
            </div>
            <div class="text-3xl font-semibold text-neutral-900 mb-2">
              {{ formatCurrency(currentMetrics.deniedDollars) }}
            </div>
            <!-- Sparkline -->
            <div class="h-10 mb-1">
              <svg viewBox="0 0 120 40" class="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'sparklineGradient-dollars'" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" :stop-color="deniedDollarsTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="deniedDollarsTrend.isImproving ? '#10B981' : '#EF4444'" stop-opacity="0" />
                  </linearGradient>
                  <clipPath id="activeWindow-dollars">
                    <rect :x="practiceWindowBoundaryX" y="0" :width="120 - practiceWindowBoundaryX" height="40" />
                  </clipPath>
                </defs>
                <g opacity="0.25">
                  <path :d="deniedDollarsSparklineFill" :fill="`url(#sparklineGradient-dollars)`" />
                  <path :d="deniedDollarsSparklinePath" fill="none" :stroke="deniedDollarsTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <g clip-path="url(#activeWindow-dollars)">
                  <path :d="deniedDollarsSparklineFill" :fill="`url(#sparklineGradient-dollars)`" />
                  <path :d="deniedDollarsSparklinePath" fill="none" :stroke="deniedDollarsTrend.isImproving ? '#10B981' : '#EF4444'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <line v-if="practiceActiveStartIndex > 0" :x1="practiceWindowBoundaryX" y1="0" :x2="practiceWindowBoundaryX" y2="40" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
              </svg>
            </div>
            <div class="flex justify-between text-[10px] text-neutral-400 mb-2">
              <span>{{ practiceSparklineLabels.first }}</span>
              <span>{{ practiceSparklineLabels.last }}</span>
            </div>
            <!-- Trend Info -->
            <div class="space-y-1">
              <div class="flex items-center gap-1">
                <Icon
                  :name="deniedDollarsTrend.isImproving ? 'heroicons:arrow-down' : 'heroicons:arrow-up'"
                  class="w-4 h-4"
                  :class="deniedDollarsTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                />
                <span
                  class="text-sm font-medium"
                  :class="deniedDollarsTrend.isImproving ? 'text-success-600' : 'text-error-600'"
                >
                  {{ formatCurrency(Math.abs(deniedDollarsTrend.dollarChange)) }}
                </span>
              </div>
              <div class="text-xs text-neutral-500">
                from {{ formatCurrency(baselineMetrics.deniedDollars) }}
              </div>
              <div class="text-xs text-neutral-500">
                ({{ Math.abs(deniedDollarsTrend.percentChange).toFixed(0) }}% {{ deniedDollarsTrend.isImproving ? 'reduction' : 'increase' }})
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue & Appeals Banners -->
        <div v-if="hasClaimsData" class="grid gap-6 mb-8" :class="hasAppealSnapshotData ? 'grid-cols-2' : 'grid-cols-1'">
          <!-- Recovered Revenue Banner -->
          <div
            class="rounded-lg p-6"
            :class="recoveredRevenue >= 0
              ? 'bg-success-50 border border-success-200'
              : 'bg-error-light border border-error-300'"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold mb-1"
                  :class="recoveredRevenue >= 0 ? 'text-success-700' : 'text-error-700'"
                >
                  Recovered Revenue
                </h3>
                <p class="text-sm" :class="recoveredRevenue >= 0 ? 'text-success-600' : 'text-error-600'">
                  Additional approved revenue vs. baseline
                </p>
              </div>
              <div class="text-right">
                <div
                  class="text-4xl font-bold"
                  :class="recoveredRevenue >= 0 ? 'text-success-700' : 'text-error-700'"
                >
                  {{ recoveredRevenue >= 0 ? '+' : '' }}{{ formatCurrency(recoveredRevenue) }}
                </div>
                <p class="text-sm mt-1" :class="recoveredRevenue >= 0 ? 'text-success-600' : 'text-error-600'">
                  {{ recoveredRevenue >= 0
                    ? "This is money you're now collecting that was previously denied."
                    : "Denied dollars have increased compared to baseline."
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Appeals Avoided Banner -->
          <div
            v-if="hasAppealSnapshotData"
            class="rounded-lg p-6"
            :class="practiceAppealsAvoided >= 0
              ? 'bg-success-50 border border-success-200'
              : 'bg-error-light border border-error-300'"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold mb-1"
                  :class="practiceAppealsAvoided >= 0 ? 'text-success-700' : 'text-error-700'"
                >
                  Appeals Avoided
                </h3>
                <p class="text-sm" :class="practiceAppealsAvoided >= 0 ? 'text-success-600' : 'text-error-600'">
                  Reduction in appeals filed vs. earlier period
                </p>
              </div>
              <div class="text-right">
                <div
                  class="text-4xl font-bold"
                  :class="practiceAppealsAvoided >= 0 ? 'text-success-700' : 'text-error-700'"
                >
                  {{ practiceAppealsAvoided >= 0 ? '+' : '' }}{{ practiceAppealsAvoided }}
                </div>
                <p class="text-sm mt-1" :class="practiceAppealsAvoided >= 0 ? 'text-success-600' : 'text-error-600'">
                  {{ practiceAppealsAvoided >= 0
                    ? "Fewer appeals means less administrative burden and faster resolution."
                    : "Appeal volume has increased compared to earlier period."
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Performance Section -->
      <div v-if="hasClaimsData">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Pattern Performance</h2>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div v-if="patternPerformance.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Pattern
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denial Rate
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Appeal Rate
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denied $
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                <template v-for="pattern in patternPerformance" :key="pattern.id">
                  <tr
                    class="hover:bg-neutral-50 cursor-pointer transition-colors"
                    :class="{ 'opacity-60': !pattern.hasClaimLinkage }"
                    @click="togglePatternExpand(pattern.id)"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <Icon
                          :name="expandedPatternId === pattern.id ? 'heroicons:chevron-down' : 'heroicons:chevron-right'"
                          class="w-4 h-4 text-neutral-400"
                        />
                        <div>
                          <div class="text-sm font-medium text-neutral-900">{{ pattern.title }}</div>
                          <div v-if="pattern.hasClaimLinkage" class="text-xs text-neutral-500">{{ pattern.claimsCount }} claims</div>
                          <div v-else class="text-xs text-warning-600 flex items-center gap-1">
                            <Icon name="heroicons:exclamation-triangle" class="w-3 h-3" />
                            No claim data — rates are configured estimates
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <span class="text-sm text-neutral-600">
                          {{ formatPercentage(pattern.baseline.denialRate) }}
                        </span>
                        <Icon name="heroicons:arrow-right" class="w-3 h-3 text-neutral-400" />
                        <span class="text-sm font-medium text-neutral-900">
                          {{ formatPercentage(pattern.current.denialRate) }}
                        </span>
                        <Icon
                          :name="pattern.denialRateImproving ? 'heroicons:arrow-down' : pattern.denialRateWorsening ? 'heroicons:arrow-up' : 'heroicons:minus'"
                          class="w-4 h-4"
                          :class="{
                            'text-success-600': pattern.denialRateImproving,
                            'text-error-600': pattern.denialRateWorsening,
                            'text-neutral-400': !pattern.denialRateImproving && !pattern.denialRateWorsening
                          }"
                        />
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div v-if="pattern.hasAppealSnapshots" class="flex items-center justify-end gap-2">
                        <span class="text-sm text-neutral-600">
                          {{ formatPercentage(capRate(pattern.baseline.appealRate)) }}
                        </span>
                        <Icon name="heroicons:arrow-right" class="w-3 h-3 text-neutral-400" />
                        <span class="text-sm font-medium text-neutral-900">
                          {{ formatPercentage(capRate(pattern.current.appealRate)) }}
                        </span>
                        <span class="text-xs text-neutral-500">({{ pattern.snapshotAppealCount }})</span>
                        <Icon
                          :name="pattern.appealRateImproving ? 'heroicons:arrow-down' : pattern.appealRateWorsening ? 'heroicons:arrow-up' : 'heroicons:minus'"
                          class="w-4 h-4"
                          :class="{
                            'text-success-600': pattern.appealRateImproving,
                            'text-error-600': pattern.appealRateWorsening,
                            'text-neutral-400': !pattern.appealRateImproving && !pattern.appealRateWorsening
                          }"
                        />
                      </div>
                      <div v-else-if="pattern.appealCount > 0" class="flex items-center justify-end gap-2">
                        <span class="text-sm font-medium text-neutral-900">
                          {{ formatPercentage(capRate(pattern.current.appealRate)) }}
                        </span>
                        <span class="text-xs text-neutral-500">({{ pattern.appealCount }})</span>
                      </div>
                      <span v-else class="text-sm text-neutral-400">—</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <span class="text-sm text-neutral-600">
                          {{ formatCurrencyCompact(pattern.baseline.deniedDollars) }}
                        </span>
                        <Icon name="heroicons:arrow-right" class="w-3 h-3 text-neutral-400" />
                        <span
                          class="text-sm font-medium"
                          :class="pattern.current.deniedDollars > 0 ? 'text-error-600' : 'text-neutral-600'"
                        >
                          {{ formatCurrencyCompact(pattern.current.deniedDollars) }}
                        </span>
                        <Icon
                          :name="pattern.deniedDollarsImproving ? 'heroicons:arrow-down' : pattern.deniedDollarsWorsening ? 'heroicons:arrow-up' : 'heroicons:minus'"
                          class="w-4 h-4"
                          :class="{
                            'text-success-600': pattern.deniedDollarsImproving,
                            'text-error-600': pattern.deniedDollarsWorsening,
                            'text-neutral-400': !pattern.deniedDollarsImproving && !pattern.deniedDollarsWorsening
                          }"
                        />
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Pattern Detail -->
                  <tr v-if="expandedPatternId === pattern.id">
                    <td colspan="4" class="px-6 py-6 bg-neutral-50">
                      <div class="flex items-center justify-between mb-4">
                        <h4 class="text-sm font-semibold text-neutral-900">{{ pattern.title }}</h4>
                        <button
                          @click.stop="navigateToPattern(pattern.id)"
                          class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          View Insight
                          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
                        </button>
                      </div>

                      <!-- Trend Charts -->
                      <div class="grid grid-cols-3 gap-6 mb-4">
                        <div class="bg-white rounded-lg border border-neutral-200 p-4">
                          <div class="text-xs text-neutral-600 mb-2">Denial Rate</div>
                          <div class="text-lg font-semibold text-neutral-900 mb-2">
                            {{ formatPercentage(pattern.baseline.denialRate) }} → {{ formatPercentage(pattern.current.denialRate) }}
                          </div>
                          <div class="h-16">
                            <svg viewBox="0 0 200 60" class="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <clipPath :id="'patternWindow-' + pattern.id + '-denial'">
                                  <rect :x="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.denialRate || []).length)" y="0" :width="200 - patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.denialRate || []).length)" height="60" />
                                </clipPath>
                              </defs>
                              <path :d="generatePatternTrendPath(pattern.trendData?.denialRate || [])" fill="none" :stroke="pattern.current.denialRate < pattern.baseline.denialRate ? '#10B981' : '#EF4444'" stroke-width="2" opacity="0.25" />
                              <path :d="generatePatternTrendPath(pattern.trendData?.denialRate || [])" fill="none" :stroke="pattern.current.denialRate < pattern.baseline.denialRate ? '#10B981' : '#EF4444'" stroke-width="2" :clip-path="'url(#patternWindow-' + pattern.id + '-denial)'" />
                              <line v-if="getActiveStartIndex(pattern.snapshotMonths, true) > 0" :x1="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.denialRate || []).length)" y1="0" :x2="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.denialRate || []).length)" y2="60" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
                            </svg>
                          </div>
                          <div class="flex justify-between text-[10px] text-neutral-400 mt-1">
                            <span>Baseline</span>
                            <span>{{ patternLastLabel(pattern.snapshotMonths) }}</span>
                          </div>
                          <div class="text-xs text-neutral-500 mt-1">over {{ appStore.selectedTimeRange }} days</div>
                        </div>

                        <div class="bg-white rounded-lg border border-neutral-200 p-4">
                          <div class="text-xs text-neutral-600 mb-2">Appeals</div>
                          <template v-if="pattern.hasAppealSnapshots && pattern.snapshotAppealCount > 0">
                            <div class="text-lg font-semibold text-neutral-900 mb-2">
                              {{ formatPercentage(capRate(pattern.baseline.appealRate)) }} → {{ formatPercentage(capRate(pattern.current.appealRate)) }}
                            </div>
                            <div class="h-16">
                              <svg viewBox="0 0 200 60" class="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                  <clipPath :id="'patternWindow-' + pattern.id + '-appeal'">
                                    <rect :x="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.appealRate || []).length)" y="0" :width="200 - patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.appealRate || []).length)" height="60" />
                                  </clipPath>
                                </defs>
                                <path :d="generatePatternTrendPath(pattern.trendData?.appealRate || [])" fill="none" :stroke="capRate(pattern.current.appealRate) < capRate(pattern.baseline.appealRate) ? '#10B981' : '#EF4444'" stroke-width="2" opacity="0.25" />
                                <path :d="generatePatternTrendPath(pattern.trendData?.appealRate || [])" fill="none" :stroke="capRate(pattern.current.appealRate) < capRate(pattern.baseline.appealRate) ? '#10B981' : '#EF4444'" stroke-width="2" :clip-path="'url(#patternWindow-' + pattern.id + '-appeal)'" />
                                <line v-if="getActiveStartIndex(pattern.snapshotMonths, true) > 0" :x1="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.appealRate || []).length)" y1="0" :x2="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.appealRate || []).length)" y2="60" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
                              </svg>
                            </div>
                            <div class="flex justify-between text-[10px] text-neutral-400 mt-1">
                              <span>Baseline</span>
                              <span>{{ patternLastLabel(pattern.snapshotMonths) }}</span>
                            </div>
                            <div class="flex items-center gap-4 text-sm text-neutral-600 mt-2">
                              <span>{{ pattern.snapshotAppealCount }} filed</span>
                              <span>{{ pattern.overturnedCount }} overturned (total)</span>
                            </div>
                            <div class="text-xs text-neutral-500 mt-2">over {{ appStore.selectedTimeRange }} days</div>
                          </template>
                          <template v-else-if="pattern.hasAppealSnapshots && pattern.snapshotAppealCount === 0 && pattern.appealCount > 0">
                            <div class="text-sm text-neutral-400 text-center py-4">No appeals in current period</div>
                          </template>
                          <template v-else>
                            <div class="text-sm text-neutral-400 text-center py-4">No appeals filed</div>
                          </template>
                        </div>

                        <div class="bg-white rounded-lg border border-neutral-200 p-4">
                          <div class="text-xs text-neutral-600 mb-2">Denied Dollars</div>
                          <div class="text-lg font-semibold text-neutral-900 mb-2">
                            {{ formatCurrencyCompact(pattern.baseline.deniedDollars) }} → {{ formatCurrencyCompact(pattern.current.deniedDollars) }}
                          </div>
                          <div class="h-16">
                            <svg viewBox="0 0 200 60" class="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <clipPath :id="'patternWindow-' + pattern.id + '-dollars'">
                                  <rect :x="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.deniedDollars || []).length)" y="0" :width="200 - patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.deniedDollars || []).length)" height="60" />
                                </clipPath>
                              </defs>
                              <path :d="generatePatternTrendPath(pattern.trendData?.deniedDollars || [])" fill="none" :stroke="pattern.current.deniedDollars < pattern.baseline.deniedDollars ? '#10B981' : '#EF4444'" stroke-width="2" opacity="0.25" />
                              <path :d="generatePatternTrendPath(pattern.trendData?.deniedDollars || [])" fill="none" :stroke="pattern.current.deniedDollars < pattern.baseline.deniedDollars ? '#10B981' : '#EF4444'" stroke-width="2" :clip-path="'url(#patternWindow-' + pattern.id + '-dollars)'" />
                              <line v-if="getActiveStartIndex(pattern.snapshotMonths, true) > 0" :x1="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.deniedDollars || []).length)" y1="0" :x2="patternWindowBoundaryX(pattern.snapshotMonths, (pattern.trendData?.deniedDollars || []).length)" y2="60" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2,2" />
                            </svg>
                          </div>
                          <div class="flex justify-between text-[10px] text-neutral-400 mt-1">
                            <span>Baseline</span>
                            <span>{{ patternLastLabel(pattern.snapshotMonths) }}</span>
                          </div>
                          <div class="text-xs text-neutral-500 mt-2">
                            Total Pattern Impact: {{ formatCurrency(pattern.current.totalAtRisk) }}
                          </div>
                          <div class="text-xs text-neutral-500">over {{ appStore.selectedTimeRange }} days</div>
                        </div>
                      </div>

                      <!-- Appeals Avoided Banner -->
                      <div
                        v-if="pattern.appealsAvoided > 0"
                        class="bg-success-50 border border-success-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2"
                      >
                        <Icon name="heroicons:arrow-trending-down" class="w-5 h-5 text-success-600 flex-shrink-0" />
                        <span class="text-sm text-success-800">
                          ~{{ pattern.appealsAvoided }} fewer appeals filed vs. earlier period
                        </span>
                      </div>

                      <!-- Additional Info -->
                      <div class="flex items-center gap-6 text-sm text-neutral-600">
                        <span>
                          <strong class="text-neutral-900">{{ pattern.claimsCount }}</strong> claims
                        </span>
                        <span v-if="pattern.firstImprovementDate">
                          First improvement observed: <strong class="text-neutral-900">{{ formatDate(pattern.firstImprovementDate) }}</strong>
                        </span>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-8 text-neutral-500">
            <Icon name="heroicons:chart-bar" class="w-12 h-12 text-neutral-400 mx-auto mb-2" />
            <p class="text-sm">Only one pattern detected in your claims</p>
          </div>
        </div>
      </div>
    </div>

    <!-- NETWORK VIEW -->
    <div v-else-if="activeView === 'network'">
      <!-- Provider Comparison Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Provider Comparison</h2>

        <!-- Edge Case: No Providers -->
        <div v-if="providers.length <= 1" class="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center">
          <Icon name="heroicons:user-group" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 class="text-lg font-medium text-neutral-900 mb-1">Network Comparison Unavailable</h3>
          <p class="text-sm text-neutral-600">
            Network comparison requires multiple providers. Currently only {{ providers.length }} provider detected.
          </p>
        </div>

        <template v-else>
          <!-- Provider Selector -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Compare Provider:</label>
            <select
              v-model="selectedProviderId"
              @change="onProviderSelect"
              class="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                {{ provider.name }} (NPI: {{ provider.npi }})
              </option>
            </select>
          </div>

          <!-- Selected Provider vs Practice Cards -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-neutral-600 uppercase tracking-wider mb-4">
              Selected Provider vs. Practice
            </h3>

            <div class="grid grid-cols-3 gap-6 mb-6">
              <!-- Denial Rate Comparison -->
              <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div class="text-sm text-neutral-600 font-medium mb-4">Denial Rate</div>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Selected:</span>
                    <span class="text-lg font-semibold text-neutral-900">
                      {{ formatPercentage(selectedProviderMetrics.denialRate) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Practice:</span>
                    <span class="text-sm text-neutral-700">
                      {{ formatPercentage(practiceAverageMetrics.denialRate) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Best:</span>
                    <span class="text-sm text-success-600">
                      {{ formatPercentage(bestProviderMetrics.denialRate) }}
                    </span>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-neutral-200">
                  <div class="text-xs text-neutral-600 mb-2">
                    Rank: <strong class="text-neutral-900">{{ selectedProviderRank.denialRate }} of {{ providers.length }}</strong>
                  </div>
                  <div class="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      class="bg-primary-600 h-2 rounded-full"
                      :style="{ width: `${((providers.length - selectedProviderRank.denialRate + 1) / providers.length) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Appeal Rate Comparison -->
              <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div class="text-sm text-neutral-600 font-medium mb-4">Appeal Rate</div>
                <template v-if="hasAppealData">
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-neutral-600">Selected:</span>
                      <span class="text-lg font-semibold text-neutral-900">
                        {{ formatPercentage(selectedProviderMetrics.appealRate) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-neutral-600">Practice:</span>
                      <span class="text-sm text-neutral-700">
                        {{ formatPercentage(practiceAverageMetrics.appealRate) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-neutral-600">Best:</span>
                      <span class="text-sm text-success-600">
                        {{ formatPercentage(bestProviderMetrics.appealRate) }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-4 pt-4 border-t border-neutral-200">
                    <div class="text-xs text-neutral-600 mb-2">
                      Rank: <strong class="text-neutral-900">{{ selectedProviderRank.appealRate }} of {{ providers.length }}</strong>
                    </div>
                    <div class="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        class="bg-primary-600 h-2 rounded-full"
                        :style="{ width: `${((providers.length - selectedProviderRank.appealRate + 1) / providers.length) * 100}%` }"
                      ></div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center py-8">
                    <Icon name="heroicons:clock" class="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p class="text-sm text-neutral-500">Appeal tracking coming soon</p>
                  </div>
                </template>
              </div>

              <!-- Denied Dollars Comparison -->
              <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div class="text-sm text-neutral-600 font-medium mb-4">Denied Dollars</div>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Selected:</span>
                    <span class="text-lg font-semibold text-neutral-900">
                      {{ formatCurrencyCompact(selectedProviderMetrics.deniedDollars) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Practice:</span>
                    <span class="text-sm text-neutral-700">
                      {{ formatCurrencyCompact(practiceAverageMetrics.deniedDollars) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-600">Best:</span>
                    <span class="text-sm text-success-600">
                      {{ formatCurrencyCompact(bestProviderMetrics.deniedDollars) }}
                    </span>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-neutral-200">
                  <div class="text-xs text-neutral-600 mb-2">
                    Rank: <strong class="text-neutral-900">{{ selectedProviderRank.deniedDollars }} of {{ providers.length }}</strong>
                  </div>
                  <div class="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      class="bg-primary-600 h-2 rounded-full"
                      :style="{ width: `${((providers.length - selectedProviderRank.deniedDollars + 1) / providers.length) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recovered Revenue for Selected Provider -->
            <div
              class="rounded-lg p-6"
              :class="selectedProviderRecoveredRevenue >= 0
                ? 'bg-success-50 border border-success-200'
                : 'bg-error-light border border-error-300'"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold mb-1"
                    :class="selectedProviderRecoveredRevenue >= 0 ? 'text-success-700' : 'text-error-700'"
                  >
                    Recovered Revenue (Selected Provider)
                  </h3>
                  <p class="text-sm" :class="selectedProviderRecoveredRevenue >= 0 ? 'text-success-600' : 'text-error-600'">
                    Additional approved revenue vs. baseline
                  </p>
                </div>
                <div class="text-right">
                  <div
                    class="text-3xl font-bold"
                    :class="selectedProviderRecoveredRevenue >= 0 ? 'text-success-700' : 'text-error-700'"
                  >
                    {{ selectedProviderRecoveredRevenue >= 0 ? '+' : '' }}{{ formatCurrency(selectedProviderRecoveredRevenue) }}
                  </div>
                  <p class="text-sm mt-1" :class="selectedProviderRecoveredRevenue >= 0 ? 'text-success-600' : 'text-error-600'">
                    Practice Total: {{ totalRecoveredRevenue >= 0 ? '+' : '' }}{{ formatCurrency(totalRecoveredRevenue) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- All Practice Providers Table -->
      <div v-if="providers.length > 1" class="mb-8">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">All Practice Providers</h2>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Provider
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denial Rate
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Appeal Rate
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denied $
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Recovered
                  </th>
                  <th class="text-center text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                <tr
                  v-for="provider in sortedProviderMetrics"
                  :key="provider.id"
                  class="hover:bg-neutral-50 cursor-pointer transition-colors"
                  :class="{
                    'bg-primary-50 border-l-4 border-primary-500': provider.id === selectedProviderId
                  }"
                  @click="selectProviderFromTable(provider.id)"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <Icon
                        v-if="provider.id === selectedProviderId"
                        name="heroicons:chevron-right"
                        class="w-4 h-4 text-primary-500"
                      />
                      <div>
                        <div class="text-sm font-medium text-neutral-900">{{ provider.name }}</div>
                        <div class="text-xs text-neutral-500">{{ provider.specialty }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <span class="text-sm font-medium text-neutral-900">
                        {{ formatPercentage(provider.metrics.denialRate) }}
                      </span>
                      <Icon
                        :name="provider.trends.denialRate === 'improving' ? 'heroicons:arrow-down' : provider.trends.denialRate === 'worsening' ? 'heroicons:arrow-up' : 'heroicons:minus'"
                        class="w-4 h-4"
                        :class="{
                          'text-success-600': provider.trends.denialRate === 'improving',
                          'text-error-600': provider.trends.denialRate === 'worsening',
                          'text-neutral-400': provider.trends.denialRate === 'stable'
                        }"
                      />
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <template v-if="hasAppealData">
                      <div class="flex items-center justify-end gap-2">
                        <span class="text-sm font-medium text-neutral-900">
                          {{ formatPercentage(provider.metrics.appealRate) }}
                        </span>
                        <Icon
                          :name="provider.trends.appealRate === 'improving' ? 'heroicons:arrow-down' : provider.trends.appealRate === 'worsening' ? 'heroicons:arrow-up' : 'heroicons:minus'"
                          class="w-4 h-4"
                          :class="{
                            'text-success-600': provider.trends.appealRate === 'improving',
                            'text-error-600': provider.trends.appealRate === 'worsening',
                            'text-neutral-400': provider.trends.appealRate === 'stable'
                          }"
                        />
                      </div>
                    </template>
                    <span v-else class="text-sm text-neutral-400">—</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm font-medium text-neutral-900">
                      {{ formatCurrencyCompact(provider.metrics.deniedDollars) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span
                      class="text-sm font-medium"
                      :class="provider.recoveredRevenue >= 0 ? 'text-success-600' : 'text-error-600'"
                    >
                      {{ provider.recoveredRevenue >= 0 ? '+' : '' }}{{ formatCurrencyCompact(provider.recoveredRevenue) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <Icon
                      :name="provider.overallTrend === 'improving' ? 'heroicons:arrow-trending-down' : provider.overallTrend === 'worsening' ? 'heroicons:arrow-trending-up' : 'heroicons:minus'"
                      class="w-5 h-5"
                      :class="{
                        'text-success-600': provider.overallTrend === 'improving',
                        'text-error-600': provider.overallTrend === 'worsening',
                        'text-neutral-400': provider.overallTrend === 'stable'
                      }"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Regional Benchmark Section -->
      <div v-if="providers.length > 1" class="mb-8">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Regional Benchmark (De-identified)</h2>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <p class="text-sm text-neutral-600 mb-6">
            Compared to <strong>{{ regionalBenchmark.peerCount }}</strong> similar providers in the region:
          </p>

          <div class="space-y-6">
            <!-- Denial Rate Percentile -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-neutral-700">Denial Rate:</span>
                <span class="text-sm font-medium text-neutral-900">
                  {{ regionalBenchmark.denialRatePercentile }}th percentile
                  <span class="text-neutral-500">(better than {{ regionalBenchmark.denialRatePercentile }}% of peers)</span>
                </span>
              </div>
              <div class="relative w-full bg-neutral-200 rounded-full h-3">
                <div
                  class="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-error-400 via-warning-400 to-success-400"
                  style="width: 100%"
                ></div>
                <div
                  class="absolute top-1/2 -translate-y-1/2 w-0 h-0"
                  :style="{ left: `${regionalBenchmark.denialRatePercentile}%` }"
                >
                  <div class="relative">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 rounded-full border-2 border-white shadow"></div>
                    <div class="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-neutral-600 whitespace-nowrap">Selected</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Appeal Rate Percentile -->
            <div v-if="hasAppealData">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-neutral-700">Appeal Rate:</span>
                <span class="text-sm font-medium text-neutral-900">
                  {{ regionalBenchmark.appealRatePercentile }}th percentile
                  <span class="text-neutral-500">(better than {{ regionalBenchmark.appealRatePercentile }}% of peers)</span>
                </span>
              </div>
              <div class="relative w-full bg-neutral-200 rounded-full h-3">
                <div
                  class="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-error-400 via-warning-400 to-success-400"
                  style="width: 100%"
                ></div>
                <div
                  class="absolute top-1/2 -translate-y-1/2 w-0 h-0"
                  :style="{ left: `${regionalBenchmark.appealRatePercentile}%` }"
                >
                  <div class="relative">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 rounded-full border-2 border-white shadow"></div>
                    <div class="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-neutral-600 whitespace-nowrap">Selected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern-Level Comparison -->
      <div v-if="providers.length > 1 && patternPerformance.length > 0">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Pattern-Level Comparison</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-neutral-700 mb-2">Select Pattern:</label>
          <select
            v-model="selectedPatternFilter"
            @change="onPatternFilterChange"
            class="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Patterns</option>
            <option v-for="pattern in patternPerformance" :key="pattern.id" :value="pattern.id">
              {{ pattern.title }}
            </option>
          </select>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Provider
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denial Rate
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Claims Affected
                  </th>
                  <th class="text-right text-xs font-medium text-neutral-600 uppercase tracking-wider px-6 py-3">
                    Denied $
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                <tr
                  v-for="provider in filteredPatternProviders"
                  :key="provider.id"
                  class="hover:bg-neutral-50 transition-colors"
                  :class="{
                    'bg-primary-50 border-l-4 border-primary-500': provider.id === selectedProviderId
                  }"
                >
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-neutral-900">{{ provider.name }}</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm font-medium text-neutral-900">
                      {{ formatPercentage(provider.patternDenialRate) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm text-neutral-900">{{ provider.patternClaimsAffected }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-sm font-medium text-neutral-900">
                      {{ formatCurrencyCompact(provider.patternDeniedDollars) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'

// Provider type for this page
interface Provider {
  id: string
  name: string
  specialty: string
  npi: string
}

// Stores
const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()

// State
const activeView = ref<'trend' | 'network'>('trend')
const showSettings = ref(false)
const adminCostPerAppeal = ref(400)
const expandedPatternId = ref<string | null>(null)
const selectedProviderId = ref<string | null>(null)
const selectedPatternFilter = ref<string>('')

// Signal capture helper
function trackEvent(signal: string, data: Record<string, unknown> = {}) {
  eventsStore.trackEvent(
    signal as any,
    'impact',
    data as any
  )
}

// View change handler
function setView(view: 'trend' | 'network') {
  activeView.value = view
  trackEvent('impact-view-change', { view })
}

// Re-fetch when global time range changes
watch(() => appStore.selectedTimeRange, (days) => {
  trackEvent('impact-period-change', { period: String(days) })
  fetchImpactSummary(days)
  fetchProviderMetrics(days)
})

// =============================================================================
// Server-Side Impact Metrics
// =============================================================================

interface SummaryPeriod {
  totalClaims: number
  statusBreakdown: { approved: number; denied: number; pending: number; appealed: number }
  denialRate: number
  financial: { billedAmount: number; paidAmount: number; deniedAmount: number; collectionRate: number }
  appeals: { total: number; overturned: number; successRate: number }
  period: { days: number; startDate: string; endDate: string }
}

const impactSummary = ref<SummaryPeriod | null>(null)
const impactPreviousSummary = ref<SummaryPeriod | null>(null)
const impactLoading = ref(false)

async function fetchImpactSummary(days: number) {
  impactLoading.value = true
  try {
    const params: Record<string, string | number> = { days, includePrevious: 'true' }
    if (appStore.selectedPracticeId) {
      params.scenario_id = appStore.selectedPracticeId
    }
    const response = await $fetch<SummaryPeriod & { previousPeriod?: SummaryPeriod }>(
      '/api/v1/claims/summary',
      { params }
    )
    impactSummary.value = response
    impactPreviousSummary.value = response.previousPeriod || null
  } catch (err) {
    console.error('Failed to fetch impact summary:', err)
  } finally {
    impactLoading.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchImpactSummary(appStore.selectedTimeRange)
})

// Derived metrics from server response (current period)
const currentMetrics = computed(() => {
  const s = impactSummary.value
  if (!s) return { totalLines: 0, deniedCount: 0, denialRate: 0, deniedDollars: 0, appealsFiled: 0, appealRate: 0, hasAppealData: false }
  return {
    totalLines: s.totalClaims,
    deniedCount: s.statusBreakdown.denied,
    denialRate: s.denialRate,
    deniedDollars: s.financial.deniedAmount,
    appealsFiled: s.appeals.total,
    appealRate: (s.statusBreakdown.denied + (s.statusBreakdown.appealed || 0)) > 0 ? (s.appeals.total / (s.statusBreakdown.denied + (s.statusBreakdown.appealed || 0))) * 100 : 0,
    hasAppealData: s.appeals.total > 0,
  }
})

// Derived metrics from server response (previous/baseline period)
const baselineMetrics = computed(() => {
  const s = impactPreviousSummary.value
  if (!s) return { totalLines: 0, deniedCount: 0, denialRate: 0, deniedDollars: 0, appealsFiled: 0, appealRate: 0, hasAppealData: false }
  return {
    totalLines: s.totalClaims,
    deniedCount: s.statusBreakdown.denied,
    denialRate: s.denialRate,
    deniedDollars: s.financial.deniedAmount,
    appealsFiled: s.appeals.total,
    appealRate: (s.statusBreakdown.denied + (s.statusBreakdown.appealed || 0)) > 0 ? (s.appeals.total / (s.statusBreakdown.denied + (s.statusBreakdown.appealed || 0))) * 100 : 0,
    hasAppealData: s.appeals.total > 0,
  }
})

// Check if we have claims data (server-side — no longer limited to 100 in-memory claims)
const hasClaimsData = computed(() => {
  return impactSummary.value !== null && impactSummary.value.totalClaims > 0
})

// Check if we have appeal data
const hasAppealData = computed(() => {
  return baselineMetrics.value.hasAppealData || currentMetrics.value.hasAppealData
})

// Trend calculations
const denialRateTrend = computed(() => {
  const pointChange = currentMetrics.value.denialRate - baselineMetrics.value.denialRate
  const percentChange = baselineMetrics.value.denialRate > 0
    ? (pointChange / baselineMetrics.value.denialRate) * 100
    : 0
  return {
    pointChange,
    percentChange,
    isImproving: pointChange < 0,
  }
})

const appealRateTrend = computed(() => {
  const pointChange = currentMetrics.value.appealRate - baselineMetrics.value.appealRate
  const percentChange = baselineMetrics.value.appealRate > 0
    ? (pointChange / baselineMetrics.value.appealRate) * 100
    : 0
  return {
    pointChange,
    percentChange,
    isImproving: pointChange < 0,
  }
})

const deniedDollarsTrend = computed(() => {
  const dollarChange = currentMetrics.value.deniedDollars - baselineMetrics.value.deniedDollars
  const percentChange = baselineMetrics.value.deniedDollars > 0
    ? (dollarChange / baselineMetrics.value.deniedDollars) * 100
    : 0
  return {
    dollarChange,
    percentChange,
    isImproving: dollarChange < 0,
  }
})

// Recovered revenue = Baseline Denied $ - Current Denied $
const recoveredRevenue = computed(() => {
  return baselineMetrics.value.deniedDollars - currentMetrics.value.deniedDollars
})

// Practice-level appeals avoided: pre-window avg vs active-window avg monthly appeal counts
// Requires at least 3 baseline months before the active window for a reliable comparison
const practiceAppealsAvoided = computed(() => {
  const months = practiceMonthlySnapshots.value
  const boundary = practiceActiveStartIndex.value
  if (boundary < 3 || boundary >= months.length) return 0
  const preWindow = months.slice(0, boundary)
  const activeWindow = months.slice(boundary)
  const preAvg = preWindow.reduce((s, m) => s + m.appealCount, 0) / preWindow.length
  const activeAvg = activeWindow.reduce((s, m) => s + m.appealCount, 0) / activeWindow.length
  return Math.round((preAvg - activeAvg) * activeWindow.length)
})

// Whether any appeal data exists in snapshots (to decide if banner should show)
const hasAppealSnapshotData = computed(() => {
  return practiceMonthlySnapshots.value.some(m => m.appealCount > 0)
})

// Aggregate pattern snapshots by month for practice-level sparklines
const practiceMonthlySnapshots = computed(() => {
  const patterns = patternsStore.patterns
  if (patterns.length === 0) return []

  const byMonth = new Map<string, { totalClaims: number; totalDenied: number; totalDollarsDenied: number; totalAppeals: number }>()

  for (const pattern of patterns) {
    for (const snap of (pattern.snapshots || [])) {
      if (!snap.month) continue
      const existing = byMonth.get(snap.month) || { totalClaims: 0, totalDenied: 0, totalDollarsDenied: 0, totalAppeals: 0 }
      existing.totalClaims += snap.claimCount ?? 0
      existing.totalDenied += snap.deniedCount ?? 0
      existing.totalDollarsDenied += snap.dollarsDenied ?? 0
      existing.totalAppeals += snap.appealCount ?? 0
      byMonth.set(snap.month, existing)
    }
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      denialRate: data.totalClaims > 0 ? (data.totalDenied / data.totalClaims) * 100 : 0,
      deniedDollars: data.totalDollarsDenied,
      appealRate: data.totalDenied > 0 ? (data.totalAppeals / data.totalDenied) * 100 : 0,
      appealCount: data.totalAppeals,
    }))
})

// Time-window highlight: find the first data point index within the selected time range
function getActiveStartIndex(snapshotMonths: string[], hasPrependedBaseline: boolean): number {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - appStore.selectedTimeRange)
  const offset = hasPrependedBaseline ? 1 : 0
  const idx = snapshotMonths.findIndex(m => new Date(m) >= cutoffDate)
  if (idx === -1) return 0 // all months before cutoff — show everything
  return idx + offset
}

// Practice sparkline: boundary index and x-coordinate (viewBox 120×40, padding 2)
const practiceActiveStartIndex = computed(() => {
  const months = practiceMonthlySnapshots.value.map(m => m.month)
  return getActiveStartIndex(months, false)
})
const practiceWindowBoundaryX = computed(() => {
  const count = practiceMonthlySnapshots.value.length
  if (count < 2) return 2
  return 2 + (practiceActiveStartIndex.value / (count - 1)) * 116
})

// Practice sparkline: date labels
const practiceSparklineLabels = computed(() => {
  const months = practiceMonthlySnapshots.value
  if (months.length === 0) return { first: '', last: '' }
  const fmt = (dateStr: string) => {
    const d = new Date(dateStr)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
  }
  return { first: fmt(months[0]!.month), last: fmt(months[months.length - 1]!.month) }
})

// Pattern sparkline: boundary x-coordinate (viewBox 200×60, padding 5)
function patternWindowBoundaryX(snapshotMonths: string[], dataLength: number): number {
  const idx = getActiveStartIndex(snapshotMonths, true)
  if (dataLength < 2) return 5
  return 5 + (idx / (dataLength - 1)) * 190
}

// Pattern sparkline: date label for last snapshot
function patternLastLabel(snapshotMonths: string[]): string {
  if (snapshotMonths.length === 0) return ''
  const d = new Date(snapshotMonths[snapshotMonths.length - 1]!)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
}

// Convert data to SVG path
function dataToSparklinePath(data: number[]): string {
  if (data.length < 2) return ''

  const width = 120
  const height = 40
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const isFlat = max - min < 0.01

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    // Flat line draws at vertical midpoint instead of stretching noise to fill height
    const y = isFlat ? height / 2 : height - padding - ((val - min) / (max - min)) * (height - 2 * padding)
    return { x, y }
  })

  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

function dataToSparklineFill(data: number[]): string {
  if (data.length < 2) return ''

  const width = 120
  const height = 40
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const isFlat = max - min < 0.01

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = isFlat ? height / 2 : height - padding - ((val - min) / (max - min)) * (height - 2 * padding)
    return { x, y }
  })

  const firstX = points[0]?.x ?? padding
  const lastX = points[points.length - 1]?.x ?? (width - padding)

  return `M ${firstX} ${height} ` +
    points.map((p, i) => `${i === 0 ? 'L' : ''} ${p.x} ${p.y}`).join(' ') +
    ` L ${lastX} ${height} Z`
}

// Practice-level sparkline data from aggregated real snapshots
const denialRateSparklineData = computed(() =>
  practiceMonthlySnapshots.value.map(s => s.denialRate)
)
const denialRateSparklinePath = computed(() => dataToSparklinePath(denialRateSparklineData.value))
const denialRateSparklineFill = computed(() => dataToSparklineFill(denialRateSparklineData.value))

// Appeal rate from aggregated snapshot data (capped at 100% for display)
const appealRateSparklineData = computed(() => {
  const snapData = practiceMonthlySnapshots.value
  const hasAppealSnapshots = snapData.some(s => s.appealRate > 0)
  if (hasAppealSnapshots) {
    return snapData.map(s => Math.min(s.appealRate, 100))
  }
  // Fallback: linear interpolation when no appeal data exists in snapshots
  const numPoints = snapData.length || 2
  const baseline = baselineMetrics.value.appealRate
  const current = currentMetrics.value.appealRate
  return Array.from({ length: numPoints }, (_, i) => {
    if (numPoints <= 1) return current
    return baseline + (current - baseline) * (i / (numPoints - 1))
  })
})
const appealRateSparklinePath = computed(() => dataToSparklinePath(appealRateSparklineData.value))
const appealRateSparklineFill = computed(() => dataToSparklineFill(appealRateSparklineData.value))

const deniedDollarsSparklineData = computed(() =>
  practiceMonthlySnapshots.value.map(s => s.deniedDollars)
)
const deniedDollarsSparklinePath = computed(() => dataToSparklinePath(deniedDollarsSparklineData.value))
const deniedDollarsSparklineFill = computed(() => dataToSparklineFill(deniedDollarsSparklineData.value))

// Pattern performance data — uses store values from patterns API (not in-memory claims)
const patternPerformance = computed(() => {
  const patterns = patternsStore.patterns
  if (patterns.length === 0) return []

  return patterns.map(pattern => {
    // Use DB values directly: baseline and current denial rates from pipeline import
    const baselineDenialRate = pattern.baselineDenialRate ?? 0
    const currentDenialRate = pattern.currentDenialRate ?? 0

    // Denied dollars: totalAtRisk is live-computed from pattern_claim_lines (cumulative)
    const totalAtRisk = pattern.totalAtRisk
    // Baseline from DB column, current from latest snapshot (monthly comparable values)
    const sortedSnapshots = [...(pattern.snapshots || [])].sort((a, b) => (a.month || '').localeCompare(b.month || ''))
    const baselineDeniedDollars = pattern.baselineDollarsDenied ?? (sortedSnapshots.length > 0 ? (sortedSnapshots[0]!.dollarsDenied ?? 0) : totalAtRisk)
    const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[sortedSnapshots.length - 1]! : null
    const currentDeniedDollars = latestSnapshot?.dollarsDenied ?? 0

    // Claims count from affected claims (live from patterns API)
    const claimsCount = pattern.affectedClaims?.length || 0

    // Appeal rate from the patterns API (already computed server-side)
    const appealRate = pattern.appealRate ?? 0

    // Appeal snapshot data for from→to display (capped at 100% for display)
    const firstSnapshotAppealRate = sortedSnapshots.length > 0 ? Math.min(sortedSnapshots[0]!.appealRate ?? 0, 100) : 0
    const latestSnapshotAppealRate = latestSnapshot ? Math.min(latestSnapshot.appealRate ?? 0, 100) : 0
    const hasAppealSnapshots = sortedSnapshots.some(s => (s.appealCount ?? 0) > 0)

    // Snapshot-period appeal counts (not cumulative lifetime)
    const snapshotAppealCount = sortedSnapshots.reduce((sum, s) => sum + (s.appealCount ?? 0), 0)

    const denialRateChange = currentDenialRate - baselineDenialRate
    const deniedDollarsChange = currentDeniedDollars - baselineDeniedDollars
    const deniedDollarsChangePercent = baselineDeniedDollars > 0 ? Math.abs(deniedDollarsChange) / baselineDeniedDollars : 0
    const appealRateChange = latestSnapshotAppealRate - firstSnapshotAppealRate

    // Appeals avoided: pre-window avg vs active-window avg monthly appeals
    // Requires at least 3 baseline months before the active window
    const snapshotMonthsList = sortedSnapshots.map(s => s.month || '')
    const patternBoundary = getActiveStartIndex(snapshotMonthsList, false)
    let appealsAvoided = 0
    if (patternBoundary >= 3 && patternBoundary < sortedSnapshots.length) {
      const preWindow = sortedSnapshots.slice(0, patternBoundary)
      const activeWindow = sortedSnapshots.slice(patternBoundary)
      const preAvg = preWindow.reduce((s, snap) => s + (snap.appealCount ?? 0), 0) / preWindow.length
      const activeAvg = activeWindow.reduce((s, snap) => s + (snap.appealCount ?? 0), 0) / activeWindow.length
      appealsAvoided = Math.round((preAvg - activeAvg) * activeWindow.length)
    }

    // Find first improvement date from pattern improvements
    const firstImprovement = pattern.improvements?.[0]
    const firstImprovementDate = firstImprovement?.date

    // Flag patterns with no linked claim data (pipeline-only rates)
    const hasClaimLinkage = claimsCount > 0 || totalAtRisk > 0

    return {
      id: pattern.id,
      title: pattern.title,
      category: pattern.category,
      claimsCount,
      hasClaimLinkage,
      baseline: {
        denialRate: baselineDenialRate,
        deniedDollars: baselineDeniedDollars,
        appealRate: firstSnapshotAppealRate,
        claimsCount,
      },
      current: {
        denialRate: currentDenialRate,
        deniedDollars: currentDeniedDollars,
        totalAtRisk,
        appealRate,
        claimsCount,
      },
      denialRateImproving: denialRateChange < -0.5,
      denialRateWorsening: denialRateChange > 0.5,
      deniedDollarsImproving: deniedDollarsChangePercent > 0.05 && deniedDollarsChange < 0,
      deniedDollarsWorsening: deniedDollarsChangePercent > 0.05 && deniedDollarsChange > 0,
      appealRateImproving: appealRateChange < -1,
      appealRateWorsening: appealRateChange > 1,
      hasAppealSnapshots,
      appealCount: pattern.appealCount ?? 0,
      snapshotAppealCount,
      overturnedCount: pattern.overturnedCount ?? 0,
      appealsAvoided,
      firstImprovementDate,
      snapshotMonths: sortedSnapshots.map(s => s.month || ''),
      trendData: {
        // Prepend baseline as first point so sparkline starts at the label's "from" value
        denialRate: [baselineDenialRate, ...sortedSnapshots.map(s => s.denialRate ?? 0)],
        deniedDollars: [baselineDeniedDollars, ...sortedSnapshots.map(s => s.dollarsDenied ?? 0)],
        appealRate: [firstSnapshotAppealRate, ...sortedSnapshots.map(s => Math.min(s.appealRate ?? 0, 100))],
      },
    }
  }).sort((a, b) => b.current.totalAtRisk - a.current.totalAtRisk)
})

// Pattern expand toggle
function togglePatternExpand(patternId: string) {
  if (expandedPatternId.value === patternId) {
    expandedPatternId.value = null
  } else {
    expandedPatternId.value = patternId
    trackEvent('impact-pattern-expand', { patternId })
  }
}

function navigateToPattern(patternId: string) {
  trackEvent('impact-pattern-navigate', { patternId, destination: 'denial-intelligence' })
  navigateTo(`/provider-portal/denial-intelligence?pattern=${patternId}`)
}

// Generate trend path for pattern detail
function generatePatternTrendPath(data: number[]): string {
  if (data.length < 2) return 'M 0 30 L 200 30'

  const width = 200
  const height = 60
  const padding = 5

  const min = Math.min(...data)
  const max = Math.max(...data)
  const isFlat = max - min < 0.01

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = isFlat ? height / 2 : height - padding - ((val - min) / (max - min)) * (height - 2 * padding)
    return { x, y }
  })

  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

// =============================================================================
// Server-Side Provider Metrics (Network View)
// =============================================================================

interface ServerProviderMetrics {
  id: string
  name: string
  specialty: string | null
  npi: string | null
  totalClaims: number
  deniedClaims: number
  appealedClaims: number
  denialRate: number
  deniedDollars: number
  totalBilled: number
  appealsFiled: number
  appealsOverturned: number
  appealRate: number
}

const serverProviderMetrics = ref<ServerProviderMetrics[]>([])
const serverPreviousProviderMetrics = ref<ServerProviderMetrics[]>([])

async function fetchProviderMetrics(days: number) {
  try {
    const params: Record<string, string | number> = { days, includePrevious: 'true' }
    if (appStore.selectedPracticeId) {
      params.scenario_id = appStore.selectedPracticeId
    }
    const response = await $fetch<{ data: ServerProviderMetrics[]; previousPeriod?: ServerProviderMetrics[] }>(
      '/api/v1/providers/metrics',
      { params }
    )
    serverProviderMetrics.value = response.data
    serverPreviousProviderMetrics.value = response.previousPeriod || []
  } catch (err) {
    console.error('Failed to fetch provider metrics:', err)
  }
}

// Fetch on mount
onMounted(() => { fetchProviderMetrics(appStore.selectedTimeRange) })

// Providers list from server data
const providers = computed<Provider[]>(() => {
  if (serverProviderMetrics.value.length === 0) return []
  return serverProviderMetrics.value.map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty || 'General Practice',
    npi: p.npi || '',
  }))
})

// Initialize selected provider
watch(providers, (newProviders) => {
  if (newProviders.length > 0 && !selectedProviderId.value) {
    selectedProviderId.value = newProviders[0]?.id ?? null
  }
}, { immediate: true })

// Helper to get current/previous metrics for a provider from server data
function getServerMetrics(providerId: string) {
  const current = serverProviderMetrics.value.find(p => p.id === providerId)
  const previous = serverPreviousProviderMetrics.value.find(p => p.id === providerId)
  return { current, previous }
}

// Selected provider metrics
const selectedProviderMetrics = computed(() => {
  if (!selectedProviderId.value) return { denialRate: 0, appealRate: 0, deniedDollars: 0 }
  const { current } = getServerMetrics(selectedProviderId.value)
  if (!current) return { denialRate: 0, appealRate: 0, deniedDollars: 0 }
  return {
    denialRate: current.denialRate,
    appealRate: current.appealRate,
    deniedDollars: current.deniedDollars,
  }
})

const selectedProviderRecoveredRevenue = computed(() => {
  if (!selectedProviderId.value) return 0
  const { current, previous } = getServerMetrics(selectedProviderId.value)
  return (previous?.deniedDollars || 0) - (current?.deniedDollars || 0)
})

// Practice average metrics
const practiceAverageMetrics = computed(() => {
  const data = serverProviderMetrics.value
  if (data.length === 0) return { denialRate: 0, appealRate: 0, deniedDollars: 0 }
  return {
    denialRate: data.reduce((s, p) => s + p.denialRate, 0) / data.length,
    appealRate: data.reduce((s, p) => s + p.appealRate, 0) / data.length,
    deniedDollars: data.reduce((s, p) => s + p.deniedDollars, 0) / data.length,
  }
})

// Best provider metrics (lowest denial rate, etc.)
const bestProviderMetrics = computed(() => {
  const data = serverProviderMetrics.value
  if (data.length === 0) return { denialRate: 0, appealRate: 0, deniedDollars: 0 }
  return {
    denialRate: Math.min(...data.map(p => p.denialRate)),
    appealRate: Math.min(...data.map(p => p.appealRate)),
    deniedDollars: Math.min(...data.map(p => p.deniedDollars)),
  }
})

// Provider rank calculation
const selectedProviderRank = computed(() => {
  if (!selectedProviderId.value) return { denialRate: 1, appealRate: 1, deniedDollars: 1 }
  const data = serverProviderMetrics.value
  const sorted = (key: keyof ServerProviderMetrics) =>
    [...data].sort((a, b) => (a[key] as number) - (b[key] as number))
      .findIndex(p => p.id === selectedProviderId.value) + 1
  return {
    denialRate: sorted('denialRate') || 1,
    appealRate: sorted('appealRate') || 1,
    deniedDollars: sorted('deniedDollars') || 1,
  }
})

// Total recovered revenue for practice
const totalRecoveredRevenue = computed(() => {
  return serverProviderMetrics.value.reduce((total, current) => {
    const previous = serverPreviousProviderMetrics.value.find(p => p.id === current.id)
    return total + ((previous?.deniedDollars || 0) - current.deniedDollars)
  }, 0)
})

// Sorted provider metrics for table
const sortedProviderMetrics = computed(() => {
  return serverProviderMetrics.value.map(p => {
    const previous = serverPreviousProviderMetrics.value.find(prev => prev.id === p.id)
    const recovered = (previous?.deniedDollars || 0) - p.deniedDollars
    const denialTrend = previous
      ? (p.denialRate < previous.denialRate - 0.5 ? 'improving' : p.denialRate > previous.denialRate + 0.5 ? 'worsening' : 'stable')
      : 'stable'
    const appealTrend = previous
      ? (p.appealRate < previous.appealRate - 0.5 ? 'improving' : p.appealRate > previous.appealRate + 0.5 ? 'worsening' : 'stable')
      : 'stable'
    return {
      id: p.id,
      name: p.name,
      specialty: p.specialty || 'General Practice',
      npi: p.npi || '',
      metrics: { denialRate: p.denialRate, appealRate: p.appealRate, deniedDollars: p.deniedDollars },
      recoveredRevenue: recovered,
      trends: {
        denialRate: denialTrend as 'improving' | 'worsening' | 'stable',
        appealRate: appealTrend as 'improving' | 'worsening' | 'stable',
      },
      overallTrend: (recovered > 0 ? 'improving' : recovered < 0 ? 'worsening' : 'stable') as 'improving' | 'worsening' | 'stable',
    }
  }).sort((a, b) => a.metrics.denialRate - b.metrics.denialRate)
})

// Regional benchmark (simulated)
const regionalBenchmark = computed(() => {
  const selectedMetrics = selectedProviderMetrics.value
  const avgDenialRate = 12.5
  const avgAppealRate = 18.2
  return {
    peerCount: 847,
    denialRatePercentile: Math.min(100, Math.max(0, Math.round((1 - selectedMetrics.denialRate / (avgDenialRate * 2)) * 100))),
    appealRatePercentile: Math.min(100, Math.max(0, Math.round((1 - selectedMetrics.appealRate / (avgAppealRate * 2)) * 100))),
  }
})

// Pattern-level comparison for providers — uses server provider data with pattern store overlay
const filteredPatternProviders = computed(() => {
  if (!selectedPatternFilter.value) {
    return sortedProviderMetrics.value.map(p => ({
      ...p,
      patternDenialRate: p.metrics.denialRate,
      patternClaimsAffected: 0,
      patternDeniedDollars: p.metrics.deniedDollars,
    }))
  }

  // When a specific pattern is selected, use the pattern store data (not in-memory claims)
  const pattern = patternsStore.getPatternById(selectedPatternFilter.value)
  if (!pattern) return []

  // Pattern-level per-provider breakdown isn't available server-side yet,
  // so show the overall provider metrics with pattern context
  return sortedProviderMetrics.value.map(p => ({
    id: p.id,
    name: p.name,
    patternDenialRate: p.metrics.denialRate,
    patternClaimsAffected: 0,
    patternDeniedDollars: p.metrics.deniedDollars,
  }))
})

// Event handlers
function onProviderSelect() {
  trackEvent('impact-provider-select', { providerId: selectedProviderId.value })
}

function selectProviderFromTable(providerId: string) {
  selectedProviderId.value = providerId
  trackEvent('impact-provider-table-click', { providerId })
}

function onPatternFilterChange() {
  trackEvent('impact-pattern-filter', { patternId: selectedPatternFilter.value })
}

// Formatting helpers
function capRate(value: number): number {
  return Math.min(value, 100)
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(0)}K`
  }
  return `${sign}$${absAmount.toFixed(0)}`
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

// Page load tracking
onMounted(() => {
  trackEvent('impact-page-view', {
    view: activeView.value,
    period: String(appStore.selectedTimeRange),
  })
})
</script>
