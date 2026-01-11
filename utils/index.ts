/**
 * Utils barrel file
 *
 * Exports all utility functions from a single entry point.
 * Pattern aligned with console-ui packages/utils.
 */

// Formatting utilities
export {
  formatDate,
  formatDateTime,
  getGreeting,
  formatTime,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercentage,
  formatNumber,
  truncateText,
  getClaimStatus,
  getClaimBilledAmount,
  getClaimPaidAmount,
  getClaimDenialReason,
  getClaimDateOfService,
  getClaimSubmissionDate,
  getClaimAppealStatus,
  getClaimProviderId,
  getClaimProviderName,
  getClaimProcedureCodes,
  getClaimMemberId,
  ensureClaimLines,
} from './formatting'

// Validation utilities
export {
  requiredString,
  email,
  phone,
  url,
  positiveNumber,
  percentage,
  currency,
  pastDate,
  futureDate,
  npi,
  claimId,
  procedureCode,
  diagnosisCode,
  createFormSchema,
  validate,
  getFirstError,
  toFieldValidator,
} from './validation'

// Analytics utilities
export {
  calculatePatternTier,
  calculatePatternConfidence,
  calculateVelocity,
  calculateTrend,
  calculatePatternScore,
  calculatePatternSavings,
  calculatePracticeROI,
  calculateMetricTrend,
  calculateEngagementScore,
  groupEventsByPeriod,
  calculateLearningVelocity,
} from './analytics'

// Table helpers
export {
  claimColumnHelper,
  policyColumnHelper,
  columnSizes,
  formatters,
  createTextColumn,
  createCurrencyColumn,
  createDateColumn,
  createPercentageColumn,
} from './table-helpers'
