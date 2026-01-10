/**
 * Composable for analytics and ROI calculations
 */

import { useAnalyticsStore } from '~/stores/analytics'
import type { MetricTrend } from '~/types/enhancements'

export function useAnalytics() {
  const analyticsStore = useAnalyticsStore()
  const appConfig = useRialticConfig()

  // Format currency
  const formatCurrency = (amount: number, compact: boolean = false): string => {
    if (compact && amount >= 1000) {
      const value = amount / 1000
      return `$${value.toFixed(1)}k`
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`
  }

  // Format large numbers
  const formatNumber = (value: number, compact: boolean = false): string => {
    if (compact && value >= 1000) {
      const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      })
      return formatter.format(value)
    }

    return new Intl.NumberFormat('en-US').format(value)
  }

  // Format duration (minutes to human readable)
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`
    }

    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)

    if (mins === 0) {
      return `${hours}h`
    }

    return `${hours}h ${mins}m`
  }

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    const icons = {
      up: 'heroicons:arrow-trending-up',
      down: 'heroicons:arrow-trending-down',
      stable: 'heroicons:minus',
    }
    return icons[trend]
  }

  // Get trend color (context-aware: for metrics where "up" is good)
  const getTrendColor = (trend: 'up' | 'down' | 'stable', higherIsBetter: boolean = true): string => {
    if (trend === 'stable') return 'text-gray-500'

    if (higherIsBetter) {
      return trend === 'up' ? 'text-green-600' : 'text-red-600'
    } else {
      return trend === 'up' ? 'text-red-600' : 'text-green-600'
    }
  }

  // Get trend badge class
  const getTrendBadgeClass = (trend: 'up' | 'down' | 'stable', higherIsBetter: boolean = true): string => {
    if (trend === 'stable') return 'bg-gray-100 text-gray-800'

    if (higherIsBetter) {
      return trend === 'up'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    } else {
      return trend === 'up'
        ? 'bg-red-100 text-red-800'
        : 'bg-green-100 text-green-800'
    }
  }

  // Format metric trend for display
  const formatMetricTrend = (metricTrend: MetricTrend): string => {
    const sign = metricTrend.change >= 0 ? '+' : ''
    return `${sign}${metricTrend.percentChange.toFixed(1)}%`
  }

  // Calculate ROI percentage
  const calculateROI = (savings: number, timeInvested: number): number => {
    // Use configurable hourly rate for provider time cost
    const hoursInvested = timeInvested / 60
    const cost = hoursInvested * appConfig.hourlyRate.value

    if (cost === 0) return 0

    return ((savings - cost) / cost) * 100
  }

  // Format ROI
  const formatROI = (roi: number): string => {
    const sign = roi >= 0 ? '+' : ''
    return `${sign}${roi.toFixed(0)}%`
  }

  // Get savings color based on amount (uses configurable thresholds)
  const getSavingsColor = (amount: number): string => {
    return appConfig.getSavingsColorClass(amount)
  }

  // Calculate time to payback
  const calculatePaybackPeriod = (
    monthlySavings: number,
    initialInvestment: number
  ): number => {
    if (monthlySavings <= 0) return Infinity
    return initialInvestment / monthlySavings
  }

  // Format payback period
  const formatPaybackPeriod = (months: number): string => {
    if (months === Infinity) return 'N/A'
    if (months < 1) return 'Less than 1 month'
    if (months === 1) return '1 month'
    return `${Math.round(months)} months`
  }

  // Get color for learning progress (uses configurable thresholds)
  const getProgressColor = (progress: number): string => {
    return appConfig.getProgressColor(progress)
  }

  // Get progress ring color class (uses configurable thresholds)
  const getProgressRingClass = (progress: number): string => {
    return appConfig.getProgressColorClass(progress)
  }

  // Calculate score (0-100) from multiple factors
  const calculateScore = (factors: Record<string, number>): number => {
    const values = Object.values(factors)
    const sum = values.reduce((acc, val) => acc + val, 0)
    return Math.round((sum / values.length) * 100) / 100
  }

  // Get letter grade from score (uses configurable thresholds)
  const getLetterGrade = (score: number): string => {
    return appConfig.getLetterGrade(score)
  }

  // Get grade color (uses configurable thresholds)
  const getGradeColor = (grade: string): string => {
    return appConfig.getGradeColorClass(grade)
  }

  return {
    // Store access
    analyticsStore,

    // Formatting
    formatCurrency,
    formatPercentage,
    formatNumber,
    formatDuration,
    formatMetricTrend,
    formatROI,
    formatPaybackPeriod,

    // Trends
    getTrendIcon,
    getTrendColor,
    getTrendBadgeClass,

    // Colors
    getSavingsColor,
    getProgressColor,
    getProgressRingClass,
    getGradeColor,

    // Calculations
    calculateROI,
    calculatePaybackPeriod,
    calculateScore,
    getLetterGrade,
  }
}
