/**
 * Centralized Application Configuration
 *
 * This file contains all configurable values that were previously hardcoded.
 * Values can be overridden via environment variables or database settings.
 */

// =============================================================================
// ROI & FINANCIAL CONFIGURATION
// =============================================================================

export interface FinancialConfig {
  /** Hourly rate for provider time cost calculations (in dollars) */
  hourlyRate: number
  /** Default average claim value when actual data is unavailable */
  defaultAvgClaimValue: number
  /** Savings color thresholds (high to low) */
  savingsThresholds: {
    high: number    // >= this amount shows as high savings
    medium: number  // >= this amount shows as medium savings
    low: number     // >= this amount shows as low savings
  }
}

export const defaultFinancialConfig: FinancialConfig = {
  hourlyRate: Number(process.env.PROVIDER_HOURLY_RATE) || 50,
  defaultAvgClaimValue: Number(process.env.DEFAULT_AVG_CLAIM_VALUE) || 500,
  savingsThresholds: {
    high: Number(process.env.SAVINGS_THRESHOLD_HIGH) || 10000,
    medium: Number(process.env.SAVINGS_THRESHOLD_MEDIUM) || 5000,
    low: Number(process.env.SAVINGS_THRESHOLD_LOW) || 1000,
  },
}

// =============================================================================
// PROGRESS & GRADING CONFIGURATION
// =============================================================================

export interface ProgressConfig {
  /** Learning progress thresholds for color coding */
  learningThresholds: {
    excellent: number  // >= this shows green/excellent
    good: number       // >= this shows yellow/good
    fair: number       // >= this shows orange/fair
    // Below fair shows red/needs improvement
  }
  /** Grade scale thresholds (percentage) */
  gradeScale: {
    A: number
    B: number
    C: number
    D: number
    // Below D is F
  }
}

export const defaultProgressConfig: ProgressConfig = {
  learningThresholds: {
    excellent: Number(process.env.PROGRESS_EXCELLENT) || 80,
    good: Number(process.env.PROGRESS_GOOD) || 50,
    fair: Number(process.env.PROGRESS_FAIR) || 25,
  },
  gradeScale: {
    A: Number(process.env.GRADE_A) || 90,
    B: Number(process.env.GRADE_B) || 80,
    C: Number(process.env.GRADE_C) || 70,
    D: Number(process.env.GRADE_D) || 60,
  },
}

// =============================================================================
// PATTERN DETECTION CONFIGURATION
// =============================================================================

export interface PatternConfig {
  /** Thresholds for pattern tier classification */
  tierThresholds: {
    critical: {
      minFrequency: number
      minImpact: number
      requiresUptrend: boolean
    }
    high: {
      minFrequency: number
      minImpact: number
      altFrequencyWithUptrend: number
    }
    medium: {
      minFrequency: number
      minImpact: number
    }
    // Below medium is 'low'
  }
  /** Confidence scoring weights (should sum to 100) */
  confidenceWeights: {
    evidence: number       // Weight for evidence count
    timeSpan: number       // Weight for time span
    consistency: number    // Weight for consistency
  }
  /** Normalizing factors for confidence calculation */
  confidenceNormalizers: {
    maxEvidenceCount: number  // Evidence count that gives max score
    maxTimeSpan: number       // Days that gives max time score
  }
  /** Trend change threshold (percentage) */
  trendChangeThreshold: number
}

export const defaultPatternConfig: PatternConfig = {
  tierThresholds: {
    critical: {
      minFrequency: Number(process.env.PATTERN_CRITICAL_FREQ) || 15,
      minImpact: Number(process.env.PATTERN_CRITICAL_IMPACT) || 20000,
      requiresUptrend: true,
    },
    high: {
      minFrequency: Number(process.env.PATTERN_HIGH_FREQ) || 10,
      minImpact: Number(process.env.PATTERN_HIGH_IMPACT) || 15000,
      altFrequencyWithUptrend: Number(process.env.PATTERN_HIGH_ALT_FREQ) || 5,
    },
    medium: {
      minFrequency: Number(process.env.PATTERN_MEDIUM_FREQ) || 5,
      minImpact: Number(process.env.PATTERN_MEDIUM_IMPACT) || 5000,
    },
  },
  confidenceWeights: {
    evidence: Number(process.env.CONFIDENCE_WEIGHT_EVIDENCE) || 40,
    timeSpan: Number(process.env.CONFIDENCE_WEIGHT_TIMESPAN) || 30,
    consistency: Number(process.env.CONFIDENCE_WEIGHT_CONSISTENCY) || 30,
  },
  confidenceNormalizers: {
    maxEvidenceCount: Number(process.env.CONFIDENCE_MAX_EVIDENCE) || 10,
    maxTimeSpan: Number(process.env.CONFIDENCE_MAX_TIMESPAN) || 90,
  },
  trendChangeThreshold: Number(process.env.TREND_CHANGE_THRESHOLD) || 20,
}

// =============================================================================
// HEALTH MONITORING CONFIGURATION
// =============================================================================

export interface HealthConfig {
  /** Response time thresholds (in milliseconds) */
  responseTime: {
    degraded: number    // Above this = degraded
    unhealthy: number   // Above this = unhealthy
  }
  /** Memory usage thresholds (percentage) */
  memory: {
    degraded: number    // Above this = degraded
    unhealthy: number   // Above this = unhealthy
  }
  /** Error rate thresholds (percentage) */
  errorRate: {
    degraded: number    // Above this = degraded
    unhealthy: number   // Above this = unhealthy
  }
  /** Cache hit rate threshold for degraded status (percentage) */
  cacheHitRateMin: number
}

export const defaultHealthConfig: HealthConfig = {
  responseTime: {
    degraded: Number(process.env.HEALTH_RESPONSE_DEGRADED) || 500,
    unhealthy: Number(process.env.HEALTH_RESPONSE_UNHEALTHY) || 2000,
  },
  memory: {
    degraded: Number(process.env.HEALTH_MEMORY_DEGRADED) || 80,
    unhealthy: Number(process.env.HEALTH_MEMORY_UNHEALTHY) || 95,
  },
  errorRate: {
    degraded: Number(process.env.HEALTH_ERROR_DEGRADED) || 5,
    unhealthy: Number(process.env.HEALTH_ERROR_UNHEALTHY) || 20,
  },
  cacheHitRateMin: Number(process.env.HEALTH_CACHE_HIT_MIN) || 50,
}

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export interface UIConfig {
  /** Default debounce delay for URL params (milliseconds) */
  debounceMs: number
  /** Default pagination limit */
  paginationLimit: number
  /** Metric trend threshold (percentage change to show as up/down vs stable) */
  metricTrendThreshold: number
}

export const defaultUIConfig: UIConfig = {
  debounceMs: Number(process.env.UI_DEBOUNCE_MS) || 300,
  paginationLimit: Number(process.env.UI_PAGINATION_LIMIT) || 50,
  metricTrendThreshold: Number(process.env.UI_TREND_THRESHOLD) || 5,
}

// =============================================================================
// COMPLETE APP CONFIG
// =============================================================================

export interface AppConfig {
  financial: FinancialConfig
  progress: ProgressConfig
  pattern: PatternConfig
  health: HealthConfig
  ui: UIConfig
}

export const defaultAppConfig: AppConfig = {
  financial: defaultFinancialConfig,
  progress: defaultProgressConfig,
  pattern: defaultPatternConfig,
  health: defaultHealthConfig,
  ui: defaultUIConfig,
}

// Export singleton instance
let appConfigInstance: AppConfig | null = null

export function getAppConfig(): AppConfig {
  if (!appConfigInstance) {
    appConfigInstance = { ...defaultAppConfig }
  }
  return appConfigInstance
}

export function updateAppConfig(partial: Partial<AppConfig>): void {
  const config = getAppConfig()
  if (partial.financial) {
    config.financial = { ...config.financial, ...partial.financial }
  }
  if (partial.progress) {
    config.progress = { ...config.progress, ...partial.progress }
  }
  if (partial.pattern) {
    config.pattern = { ...config.pattern, ...partial.pattern }
  }
  if (partial.health) {
    config.health = { ...config.health, ...partial.health }
  }
  if (partial.ui) {
    config.ui = { ...config.ui, ...partial.ui }
  }
}
