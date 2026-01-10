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
// APPEAL CONFIGURATION
// =============================================================================

export type PatternCategory =
  | 'modifier-missing'
  | 'code-mismatch'
  | 'documentation'
  | 'authorization'
  | 'billing-error'
  | 'timing'
  | 'coding-specificity'
  | 'medical-necessity'

export interface AppealConfig {
  /** Appeal filing rates by pattern category (0-1) */
  ratesByCategory: Record<PatternCategory, number>
  /** Appeal overturn rates by pattern category (0-1) */
  overturnRatesByCategory: Record<PatternCategory, number>
}

export const defaultAppealConfig: AppealConfig = {
  ratesByCategory: {
    'modifier-missing': Number(process.env.APPEAL_RATE_MODIFIER) || 0.45,
    'authorization': Number(process.env.APPEAL_RATE_AUTH) || 0.30,
    'documentation': Number(process.env.APPEAL_RATE_DOC) || 0.35,
    'billing-error': Number(process.env.APPEAL_RATE_BILLING) || 0.40,
    'coding-specificity': Number(process.env.APPEAL_RATE_CODING) || 0.25,
    'code-mismatch': Number(process.env.APPEAL_RATE_MISMATCH) || 0.35,
    'timing': Number(process.env.APPEAL_RATE_TIMING) || 0.20,
    'medical-necessity': Number(process.env.APPEAL_RATE_NECESSITY) || 0.40,
  },
  overturnRatesByCategory: {
    'modifier-missing': Number(process.env.OVERTURN_RATE_MODIFIER) || 0.65,
    'authorization': Number(process.env.OVERTURN_RATE_AUTH) || 0.20,
    'documentation': Number(process.env.OVERTURN_RATE_DOC) || 0.45,
    'billing-error': Number(process.env.OVERTURN_RATE_BILLING) || 0.55,
    'coding-specificity': Number(process.env.OVERTURN_RATE_CODING) || 0.40,
    'code-mismatch': Number(process.env.OVERTURN_RATE_MISMATCH) || 0.50,
    'timing': Number(process.env.OVERTURN_RATE_TIMING) || 0.30,
    'medical-necessity': Number(process.env.OVERTURN_RATE_NECESSITY) || 0.35,
  },
}

// =============================================================================
// CLAIM GENERATION CONFIGURATION
// =============================================================================

export interface ClaimGenerationConfig {
  /** Claim value ranges for generation */
  valueRanges: {
    low: { min: number; max: number }
    medium: { min: number; max: number }
    high: { min: number; max: number }
  }
  /** Lines per claim range */
  linesPerClaim: { min: number; max: number }
  /** Base denial rate before pattern injection (0-1) */
  baseDenialRate: number
}

export const defaultClaimGenerationConfig: ClaimGenerationConfig = {
  valueRanges: {
    low: {
      min: Number(process.env.CLAIM_VALUE_LOW_MIN) || 75,
      max: Number(process.env.CLAIM_VALUE_LOW_MAX) || 250,
    },
    medium: {
      min: Number(process.env.CLAIM_VALUE_MEDIUM_MIN) || 250,
      max: Number(process.env.CLAIM_VALUE_MEDIUM_MAX) || 1500,
    },
    high: {
      min: Number(process.env.CLAIM_VALUE_HIGH_MIN) || 1500,
      max: Number(process.env.CLAIM_VALUE_HIGH_MAX) || 8000,
    },
  },
  linesPerClaim: {
    min: Number(process.env.CLAIM_LINES_MIN) || 1,
    max: Number(process.env.CLAIM_LINES_MAX) || 5,
  },
  baseDenialRate: Number(process.env.BASE_DENIAL_RATE) || 0.15,
}

// =============================================================================
// SPECIALTY CONFIGURATION
// =============================================================================

export interface SpecialtyDefinition {
  /** Display name of the specialty */
  specialty: string
  /** NUCC taxonomy code */
  taxonomy: string
  /** Typical claim value range for this specialty */
  typicalClaimRange: { min: number; max: number }
}

export interface SpecialtyConfig {
  /** Available specialties for scenario generation */
  specialties: SpecialtyDefinition[]
}

export const defaultSpecialtyConfig: SpecialtyConfig = {
  specialties: [
    { specialty: 'Orthopedic Surgery', taxonomy: '207X00000X', typicalClaimRange: { min: 500, max: 15000 } },
    { specialty: 'Sports Medicine', taxonomy: '207QS0000X', typicalClaimRange: { min: 150, max: 2500 } },
    { specialty: 'Physical Therapy', taxonomy: '225100000X', typicalClaimRange: { min: 75, max: 500 } },
    { specialty: 'Pain Management', taxonomy: '208VP0014X', typicalClaimRange: { min: 300, max: 5000 } },
    { specialty: 'Internal Medicine', taxonomy: '207R00000X', typicalClaimRange: { min: 100, max: 1000 } },
    { specialty: 'Family Medicine', taxonomy: '207Q00000X', typicalClaimRange: { min: 75, max: 750 } },
    { specialty: 'Cardiology', taxonomy: '207RC0000X', typicalClaimRange: { min: 200, max: 8000 } },
    { specialty: 'General Practice', taxonomy: '208D00000X', typicalClaimRange: { min: 75, max: 600 } },
    { specialty: 'Neurology', taxonomy: '2084N0400X', typicalClaimRange: { min: 150, max: 3000 } },
    { specialty: 'Rheumatology', taxonomy: '207RR0500X', typicalClaimRange: { min: 150, max: 2000 } },
  ],
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
  appeal: AppealConfig
  claimGeneration: ClaimGenerationConfig
  specialty: SpecialtyConfig
}

export const defaultAppConfig: AppConfig = {
  financial: defaultFinancialConfig,
  progress: defaultProgressConfig,
  pattern: defaultPatternConfig,
  health: defaultHealthConfig,
  ui: defaultUIConfig,
  appeal: defaultAppealConfig,
  claimGeneration: defaultClaimGenerationConfig,
  specialty: defaultSpecialtyConfig,
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
  if (partial.appeal) {
    config.appeal = { ...config.appeal, ...partial.appeal }
  }
  if (partial.claimGeneration) {
    config.claimGeneration = { ...config.claimGeneration, ...partial.claimGeneration }
  }
  if (partial.specialty) {
    config.specialty = { ...config.specialty, ...partial.specialty }
  }
}
