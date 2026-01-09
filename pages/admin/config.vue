<template>
  <div class="min-h-screen bg-neutral-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-neutral-900">Configuration</h1>
        <p class="mt-1 text-neutral-600">
          Manage application settings and thresholds
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-4 bg-error-50 border border-error-200 rounded-lg mb-6">
        <p class="text-error-700">{{ error }}</p>
        <button type="button" class="mt-2 text-sm text-error-600 underline" @click="loadConfig">
          Try again
        </button>
      </div>

      <!-- Config Sections -->
      <div v-else class="space-y-6">
        <!-- Financial Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Financial Settings</h2>
              <p class="text-sm text-neutral-500">ROI calculations and cost thresholds</p>
            </div>
            <span class="px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs font-medium">
              Affects ROI metrics
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Provider Hourly Rate
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <input
                  v-model.number="config.financial.hourlyRate"
                  type="number"
                  min="0"
                  step="5"
                  class="form-input w-full pl-7"
                />
              </div>
              <p class="mt-1 text-xs text-neutral-500">
                Used for calculating time investment cost in ROI
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Default Average Claim Value
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <input
                  v-model.number="config.financial.defaultAvgClaimValue"
                  type="number"
                  min="0"
                  step="50"
                  class="form-input w-full pl-7"
                />
              </div>
              <p class="mt-1 text-xs text-neutral-500">
                Fallback when actual claim data is unavailable
              </p>
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium text-neutral-700 mb-3">
              Savings Color Thresholds
            </label>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-neutral-500 mb-1">High (Green)</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input
                    v-model.number="config.financial.savingsThresholds.high"
                    type="number"
                    min="0"
                    step="1000"
                    class="form-input w-full pl-7"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Medium</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input
                    v-model.number="config.financial.savingsThresholds.medium"
                    type="number"
                    min="0"
                    step="1000"
                    class="form-input w-full pl-7"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Low</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input
                    v-model.number="config.financial.savingsThresholds.low"
                    type="number"
                    min="0"
                    step="500"
                    class="form-input w-full pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress & Grading Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Progress & Grading</h2>
              <p class="text-sm text-neutral-500">Learning progress and scoring thresholds</p>
            </div>
            <span class="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
              Affects UI indicators
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Learning Thresholds -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Learning Progress Thresholds
              </label>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded bg-success-500" />
                  <span class="text-sm text-neutral-600 w-20">Excellent</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.learningThresholds.excellent"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded bg-warning-500" />
                  <span class="text-sm text-neutral-600 w-20">Good</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.learningThresholds.good"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded bg-orange-500" />
                  <span class="text-sm text-neutral-600 w-20">Fair</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.learningThresholds.fair"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grade Scale -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Grade Scale Thresholds
              </label>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded flex items-center justify-center font-bold text-sm bg-success-100 text-success-700">A</span>
                  <span class="text-sm text-neutral-600 w-16">A Grade</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.gradeScale.A"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded flex items-center justify-center font-bold text-sm bg-secondary-100 text-secondary-700">B</span>
                  <span class="text-sm text-neutral-600 w-16">B Grade</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.gradeScale.B"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded flex items-center justify-center font-bold text-sm bg-warning-100 text-warning-700">C</span>
                  <span class="text-sm text-neutral-600 w-16">C Grade</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.gradeScale.C"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded flex items-center justify-center font-bold text-sm bg-orange-100 text-orange-700">D</span>
                  <span class="text-sm text-neutral-600 w-16">D Grade</span>
                  <div class="relative flex-1">
                    <input
                      v-model.number="config.progress.gradeScale.D"
                      type="number"
                      min="0"
                      max="100"
                      class="form-input w-full pr-8"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pattern Detection Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Pattern Detection</h2>
              <p class="text-sm text-neutral-500">Thresholds for pattern classification and scoring</p>
            </div>
            <span class="px-2 py-1 bg-warning-100 text-warning-700 rounded text-xs font-medium">
              Affects pattern analysis
            </span>
          </div>

          <!-- Tier Thresholds -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-3">
              Pattern Tier Classification
            </label>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-neutral-200">
                    <th class="text-left py-2 pr-4 font-medium text-neutral-700">Tier</th>
                    <th class="text-left py-2 px-4 font-medium text-neutral-700">Min Frequency</th>
                    <th class="text-left py-2 px-4 font-medium text-neutral-700">Min Impact ($)</th>
                    <th class="text-left py-2 pl-4 font-medium text-neutral-700">Special</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-neutral-100">
                    <td class="py-3 pr-4">
                      <span class="px-2 py-1 rounded text-xs font-medium bg-error-100 text-error-700">
                        Critical
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.critical.minFrequency"
                        type="number"
                        min="0"
                        class="form-input w-24"
                      />
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.critical.minImpact"
                        type="number"
                        min="0"
                        step="1000"
                        class="form-input w-28"
                      />
                    </td>
                    <td class="py-3 pl-4">
                      <label class="flex items-center gap-2 text-xs text-neutral-600">
                        <input
                          v-model="config.pattern.tierThresholds.critical.requiresUptrend"
                          type="checkbox"
                          class="rounded border-neutral-300"
                        />
                        Requires uptrend
                      </label>
                    </td>
                  </tr>
                  <tr class="border-b border-neutral-100">
                    <td class="py-3 pr-4">
                      <span class="px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-700">
                        High
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.high.minFrequency"
                        type="number"
                        min="0"
                        class="form-input w-24"
                      />
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.high.minImpact"
                        type="number"
                        min="0"
                        step="1000"
                        class="form-input w-28"
                      />
                    </td>
                    <td class="py-3 pl-4">
                      <div class="flex items-center gap-2 text-xs text-neutral-600">
                        <span>Alt freq w/ uptrend:</span>
                        <input
                          v-model.number="config.pattern.tierThresholds.high.altFrequencyWithUptrend"
                          type="number"
                          min="0"
                          class="form-input w-16"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="py-3 pr-4">
                      <span class="px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-700">
                        Medium
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.medium.minFrequency"
                        type="number"
                        min="0"
                        class="form-input w-24"
                      />
                    </td>
                    <td class="py-3 px-4">
                      <input
                        v-model.number="config.pattern.tierThresholds.medium.minImpact"
                        type="number"
                        min="0"
                        step="1000"
                        class="form-input w-28"
                      />
                    </td>
                    <td class="py-3 pl-4 text-xs text-neutral-500">
                      Below medium = Low
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Confidence Weights -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Confidence Scoring Weights
              </label>
              <p class="text-xs text-neutral-500 mb-3">
                Should sum to 100 for proper scoring
              </p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600">Evidence Count</span>
                  <input
                    v-model.number="config.pattern.confidenceWeights.evidence"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-20"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600">Time Span</span>
                  <input
                    v-model.number="config.pattern.confidenceWeights.timeSpan"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-20"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600">Consistency</span>
                  <input
                    v-model.number="config.pattern.confidenceWeights.consistency"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-20"
                  />
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-neutral-200">
                  <span class="text-sm font-medium text-neutral-700">Total</span>
                  <span
                    class="font-medium"
                    :class="confidenceWeightsTotal === 100 ? 'text-success-600' : 'text-error-600'"
                  >
                    {{ confidenceWeightsTotal }}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Other Pattern Settings
              </label>
              <div class="space-y-4">
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">
                    Max Evidence Count (for normalization)
                  </label>
                  <input
                    v-model.number="config.pattern.confidenceNormalizers.maxEvidenceCount"
                    type="number"
                    min="1"
                    class="form-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">
                    Max Time Span Days (for normalization)
                  </label>
                  <input
                    v-model.number="config.pattern.confidenceNormalizers.maxTimeSpan"
                    type="number"
                    min="1"
                    class="form-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">
                    Trend Change Threshold (%)
                  </label>
                  <input
                    v-model.number="config.pattern.trendChangeThreshold"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Monitoring Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Health Monitoring</h2>
              <p class="text-sm text-neutral-500">System health check thresholds</p>
            </div>
            <span class="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium">
              Affects health checks
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Response Time -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Response Time (ms)
              </label>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Degraded Threshold</label>
                  <input
                    v-model.number="config.health.responseTime.degraded"
                    type="number"
                    min="0"
                    step="100"
                    class="form-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Unhealthy Threshold</label>
                  <input
                    v-model.number="config.health.responseTime.unhealthy"
                    type="number"
                    min="0"
                    step="100"
                    class="form-input w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Memory -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Memory Usage (%)
              </label>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Degraded Threshold</label>
                  <input
                    v-model.number="config.health.memory.degraded"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Unhealthy Threshold</label>
                  <input
                    v-model.number="config.health.memory.unhealthy"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Error Rate -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">
                Error Rate (%)
              </label>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Degraded Threshold</label>
                  <input
                    v-model.number="config.health.errorRate.degraded"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs text-neutral-500 mb-1">Unhealthy Threshold</label>
                  <input
                    v-model.number="config.health.errorRate.unhealthy"
                    type="number"
                    min="0"
                    max="100"
                    class="form-input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-xs text-neutral-500 mb-1">
              Min Cache Hit Rate (%)
            </label>
            <input
              v-model.number="config.health.cacheHitRateMin"
              type="number"
              min="0"
              max="100"
              class="form-input w-32"
            />
          </div>
        </div>

        <!-- UI Configuration -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">UI Settings</h2>
              <p class="text-sm text-neutral-500">User interface defaults</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Debounce Delay (ms)
              </label>
              <input
                v-model.number="config.ui.debounceMs"
                type="number"
                min="0"
                step="50"
                class="form-input w-full"
              />
              <p class="mt-1 text-xs text-neutral-500">
                Delay before URL params update
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Pagination Limit
              </label>
              <input
                v-model.number="config.ui.paginationLimit"
                type="number"
                min="10"
                max="200"
                step="10"
                class="form-input w-full"
              />
              <p class="mt-1 text-xs text-neutral-500">
                Default items per page
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Metric Trend Threshold (%)
              </label>
              <input
                v-model.number="config.ui.metricTrendThreshold"
                type="number"
                min="0"
                max="100"
                class="form-input w-full"
              />
              <p class="mt-1 text-xs text-neutral-500">
                Change % to show up/down trend
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div class="flex items-center gap-2 text-sm text-neutral-500">
            <span v-if="hasChanges" class="flex items-center gap-1 text-warning-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Unsaved changes
            </span>
            <span v-else-if="lastSaved" class="text-success-600">
              Last saved: {{ lastSaved }}
            </span>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="!hasChanges"
              @click="resetConfig"
            >
              Reset
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!hasChanges || isSaving"
              @click="saveConfig"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import type { AppConfig } from '~/config/appConfig'

// State
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const lastSaved = ref<string | null>(null)
const originalConfig = ref<string>('')

// Deep reactive config object
const config = reactive<AppConfig>({
  financial: {
    hourlyRate: 50,
    defaultAvgClaimValue: 500,
    savingsThresholds: {
      high: 10000,
      medium: 5000,
      low: 1000,
    },
  },
  progress: {
    learningThresholds: {
      excellent: 80,
      good: 50,
      fair: 25,
    },
    gradeScale: {
      A: 90,
      B: 80,
      C: 70,
      D: 60,
    },
  },
  pattern: {
    tierThresholds: {
      critical: {
        minFrequency: 15,
        minImpact: 20000,
        requiresUptrend: true,
      },
      high: {
        minFrequency: 10,
        minImpact: 15000,
        altFrequencyWithUptrend: 5,
      },
      medium: {
        minFrequency: 5,
        minImpact: 5000,
      },
    },
    confidenceWeights: {
      evidence: 40,
      timeSpan: 30,
      consistency: 30,
    },
    confidenceNormalizers: {
      maxEvidenceCount: 10,
      maxTimeSpan: 90,
    },
    trendChangeThreshold: 20,
  },
  health: {
    responseTime: {
      degraded: 500,
      unhealthy: 2000,
    },
    memory: {
      degraded: 80,
      unhealthy: 95,
    },
    errorRate: {
      degraded: 5,
      unhealthy: 20,
    },
    cacheHitRateMin: 50,
  },
  ui: {
    debounceMs: 300,
    paginationLimit: 50,
    metricTrendThreshold: 5,
  },
})

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(config) !== originalConfig.value
})

const confidenceWeightsTotal = computed(() => {
  return (
    config.pattern.confidenceWeights.evidence +
    config.pattern.confidenceWeights.timeSpan +
    config.pattern.confidenceWeights.consistency
  )
})

// Methods
async function loadConfig() {
  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<{ config: AppConfig }>('/api/v1/admin/config')
    Object.assign(config, response.config)
    originalConfig.value = JSON.stringify(config)
  } catch (err) {
    console.error('Failed to load config:', err)
    error.value = 'Failed to load configuration. Using defaults.'
    // Keep defaults
    originalConfig.value = JSON.stringify(config)
  } finally {
    isLoading.value = false
  }
}

function resetConfig() {
  if (!originalConfig.value) return
  const original = JSON.parse(originalConfig.value)
  Object.assign(config, original)
}

async function saveConfig() {
  isSaving.value = true
  error.value = null

  try {
    await $fetch('/api/v1/admin/config', {
      method: 'PUT',
      body: { config },
    })

    originalConfig.value = JSON.stringify(config)
    lastSaved.value = new Date().toLocaleTimeString()
  } catch (err) {
    console.error('Failed to save config:', err)
    error.value = 'Failed to save configuration. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadConfig()
})
</script>
