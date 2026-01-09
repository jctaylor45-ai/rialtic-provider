/**
 * App Configuration Composable
 *
 * Provides reactive access to application configuration and
 * can compute values from the database when available.
 */

import { ref, computed } from 'vue'
import {
  getAppConfig,
  updateAppConfig,
  type AppConfig,
  type FinancialConfig,
  type ProgressConfig,
  type PatternConfig,
  type HealthConfig,
  type UIConfig,
} from '~/config/appConfig'

// Reactive config state (loaded once, cached)
const configLoaded = ref(false)
const computedAvgClaimValue = ref<number | null>(null)

export function useAppConfig() {
  const config = getAppConfig()

  // ==========================================================================
  // FINANCIAL CONFIGURATION
  // ==========================================================================

  const financial = computed(() => config.financial)

  /** Get the hourly rate for ROI calculations */
  const hourlyRate = computed(() => config.financial.hourlyRate)

  /** Get average claim value - computed from database if available, otherwise config default */
  const avgClaimValue = computed(() => {
    return computedAvgClaimValue.value ?? config.financial.defaultAvgClaimValue
  })

  /** Get savings thresholds */
  const savingsThresholds = computed(() => config.financial.savingsThresholds)

  /** Get color class for a savings amount */
  const getSavingsColorClass = (amount: number): string => {
    const { high, medium, low } = config.financial.savingsThresholds
    if (amount >= high) return 'text-success-700'
    if (amount >= medium) return 'text-success-600'
    if (amount >= low) return 'text-success-500'
    return 'text-neutral-600'
  }

  // ==========================================================================
  // PROGRESS CONFIGURATION
  // ==========================================================================

  const progress = computed(() => config.progress)

  /** Get progress color name based on percentage */
  const getProgressColor = (progressPercent: number): string => {
    const { excellent, good, fair } = config.progress.learningThresholds
    if (progressPercent >= excellent) return 'green'
    if (progressPercent >= good) return 'yellow'
    if (progressPercent >= fair) return 'orange'
    return 'red'
  }

  /** Get progress ring/badge class based on percentage */
  const getProgressColorClass = (progressPercent: number): string => {
    const { excellent, good, fair } = config.progress.learningThresholds
    if (progressPercent >= excellent) return 'text-success-600'
    if (progressPercent >= good) return 'text-warning-600'
    if (progressPercent >= fair) return 'text-orange-600'
    return 'text-error-600'
  }

  /** Get progress background class based on percentage */
  const getProgressBgClass = (progressPercent: number): string => {
    const { excellent, good, fair } = config.progress.learningThresholds
    if (progressPercent >= excellent) return 'bg-success-500'
    if (progressPercent >= good) return 'bg-warning-500'
    if (progressPercent >= fair) return 'bg-orange-500'
    return 'bg-error-500'
  }

  /** Get letter grade from score */
  const getLetterGrade = (score: number): string => {
    const { A, B, C, D } = config.progress.gradeScale
    if (score >= A) return 'A'
    if (score >= B) return 'B'
    if (score >= C) return 'C'
    if (score >= D) return 'D'
    return 'F'
  }

  /** Get grade color class */
  const getGradeColorClass = (grade: string): string => {
    const colors: Record<string, string> = {
      A: 'text-success-600',
      B: 'text-secondary-600',
      C: 'text-warning-600',
      D: 'text-orange-600',
      F: 'text-error-600',
    }
    return colors[grade] || 'text-neutral-600'
  }

  // ==========================================================================
  // PATTERN CONFIGURATION
  // ==========================================================================

  const pattern = computed(() => config.pattern)

  /** Get pattern tier based on score */
  const calculatePatternTier = (
    frequency: number,
    impact: number,
    trend: 'up' | 'down' | 'stable'
  ): 'critical' | 'high' | 'medium' | 'low' => {
    const { critical, high, medium } = config.pattern.tierThresholds

    // Critical: High frequency + high impact + upward trend
    if (
      frequency >= critical.minFrequency &&
      impact >= critical.minImpact &&
      (critical.requiresUptrend ? trend === 'up' : true)
    ) {
      return 'critical'
    }

    // High: Moderate-high frequency or high impact
    if (
      frequency >= high.minFrequency ||
      impact >= high.minImpact ||
      (frequency >= high.altFrequencyWithUptrend && trend === 'up')
    ) {
      return 'high'
    }

    // Medium: Moderate frequency or impact
    if (frequency >= medium.minFrequency || impact >= medium.minImpact) {
      return 'medium'
    }

    return 'low'
  }

  /** Calculate confidence score for pattern detection */
  const calculatePatternConfidence = (
    evidenceCount: number,
    timeSpanDays: number,
    consistencyScore: number // 0-1
  ): number => {
    const { evidence, timeSpan, consistency } = config.pattern.confidenceWeights
    const { maxEvidenceCount, maxTimeSpan } = config.pattern.confidenceNormalizers

    const evidenceScore = Math.min(evidenceCount / maxEvidenceCount, 1) * evidence
    const timeScore = Math.min(timeSpanDays / maxTimeSpan, 1) * timeSpan
    const consistencyWeight = consistencyScore * consistency

    return Math.round(evidenceScore + timeScore + consistencyWeight)
  }

  /** Determine trend direction based on change percentage */
  const determineTrend = (changePercent: number): 'up' | 'down' | 'stable' => {
    const threshold = config.pattern.trendChangeThreshold
    if (changePercent > threshold) return 'up'
    if (changePercent < -threshold) return 'down'
    return 'stable'
  }

  // ==========================================================================
  // HEALTH CONFIGURATION
  // ==========================================================================

  const health = computed(() => config.health)

  // ==========================================================================
  // UI CONFIGURATION
  // ==========================================================================

  const ui = computed(() => config.ui)

  /** Default debounce delay for URL params */
  const debounceMs = computed(() => config.ui.debounceMs)

  /** Default pagination limit */
  const paginationLimit = computed(() => config.ui.paginationLimit)

  /** Metric trend threshold */
  const metricTrendThreshold = computed(() => config.ui.metricTrendThreshold)

  // ==========================================================================
  // COMPUTED VALUES FROM DATABASE
  // ==========================================================================

  /**
   * Load computed configuration values from the database
   * Call this once when the app initializes to get practice-specific values
   */
  async function loadComputedConfig() {
    if (configLoaded.value) return

    try {
      // Try to fetch practice-specific configuration
      const response = await $fetch<{
        avgClaimValue?: number
        hourlyRate?: number
      }>('/api/v1/config/practice', {
        method: 'GET',
      }).catch(() => null)

      if (response) {
        if (response.avgClaimValue) {
          computedAvgClaimValue.value = response.avgClaimValue
        }
        if (response.hourlyRate) {
          updateAppConfig({
            financial: { ...config.financial, hourlyRate: response.hourlyRate },
          })
        }
      }
    } catch {
      // Use defaults if API not available
    }

    configLoaded.value = true
  }

  /**
   * Compute average claim value from actual claims data
   */
  function setComputedAvgClaimValue(claims: Array<{ billedAmount: number }>) {
    if (claims.length === 0) return

    const total = claims.reduce((sum, claim) => sum + claim.billedAmount, 0)
    computedAvgClaimValue.value = Math.round(total / claims.length)
  }

  /**
   * Update configuration values
   */
  function updateConfig(partial: Partial<AppConfig>) {
    updateAppConfig(partial)
  }

  return {
    // Full config sections
    financial,
    progress,
    pattern,
    health,
    ui,

    // Financial helpers
    hourlyRate,
    avgClaimValue,
    savingsThresholds,
    getSavingsColorClass,

    // Progress helpers
    getProgressColor,
    getProgressColorClass,
    getProgressBgClass,
    getLetterGrade,
    getGradeColorClass,

    // Pattern helpers
    calculatePatternTier,
    calculatePatternConfidence,
    determineTrend,

    // UI helpers
    debounceMs,
    paginationLimit,
    metricTrendThreshold,

    // Actions
    loadComputedConfig,
    setComputedAvgClaimValue,
    updateConfig,
  }
}
