/**
 * Composable for working with patterns
 */

import { usePatternsStore } from '~/stores/patterns'
import { useEventsStore } from '~/stores/events'
import type { Pattern, PatternStatus, PatternTier } from '~/types/enhancements'

export function usePatterns() {
  const patternsStore = usePatternsStore()
  const eventsStore = useEventsStore()

  // Get pattern color based on tier
  const getPatternTierColor = (tier: PatternTier): string => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'blue',
    }
    return colors[tier]
  }

  // Get pattern tier badge classes
  const getPatternTierBadgeClass = (tier: PatternTier): string => {
    const classes = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return classes[tier]
  }

  // Get pattern status color
  const getPatternStatusColor = (status: PatternStatus): string => {
    const colors = {
      active: 'red',
      improving: 'yellow',
      resolved: 'green',
      archived: 'gray',
    }
    return colors[status]
  }

  // Get pattern status badge classes
  const getPatternStatusBadgeClass = (status: PatternStatus): string => {
    const classes = {
      active: 'bg-red-100 text-red-800 border-red-300',
      improving: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      resolved: 'bg-green-100 text-green-800 border-green-300',
      archived: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return classes[status]
  }

  // Get pattern icon based on category
  const getPatternCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'modifier-missing': 'heroicons:exclamation-triangle',
      'code-mismatch': 'heroicons:code-bracket',
      'documentation': 'heroicons:document-text',
      'authorization': 'heroicons:shield-check',
      'billing-error': 'heroicons:currency-dollar',
      'timing': 'heroicons:clock',
      'coding-specificity': 'heroicons:magnifying-glass',
      'medical-necessity': 'heroicons:clipboard-document-check',
    }
    return icons[category] || 'heroicons:light-bulb'
  }

  // Calculate learning progress percentage
  const getLearningProgressClass = (progress: number): string => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Start practice session for a pattern
  const startPracticeSession = async (pattern: Pattern) => {
    // Track practice-started event
    eventsStore.trackEvent('practice-started', 'claim-lab', {
      patternId: pattern.id,
      patternCategory: pattern.category,
      practiceType: 'guided',
    })

    // Navigate to Claim Lab with pattern context
    return navigateTo(`/claim-lab?pattern=${pattern.id}`)
  }

  // Complete practice session
  const completePracticeSession = (
    patternId: string,
    duration: number,
    correctionsCount: number
  ) => {
    // Record in patterns store
    patternsStore.recordPracticeSession(patternId, correctionsCount)

    // Track practice-completed event
    eventsStore.trackEvent('practice-completed', 'claim-lab', {
      patternId,
      duration,
      success: true,
      correctionsCount,
    })
  }

  // Record a correction applied
  const recordCorrection = (patternId: string, claimId: string, action: string) => {
    patternsStore.recordCorrection(patternId)

    eventsStore.trackEvent('correction-applied', 'claim-lab', {
      patternId,
      claimId,
      action,
    })
  }

  // Get related patterns for a claim
  const getRelatedPatterns = (claimId: string): Pattern[] => {
    return patternsStore.getPatternsByClaim(claimId)
  }

  // Check if pattern has recent activity
  const hasRecentActivity = (pattern: Pattern, days: number = 7): boolean => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return pattern.improvements.some(imp =>
      new Date(imp.date) >= cutoff
    )
  }

  // Get pattern improvement trend (improving, stable, declining)
  const getImprovementTrend = (pattern: Pattern): 'improving' | 'stable' | 'declining' => {
    if (pattern.improvements.length < 2) return 'stable'

    const recent = pattern.improvements.slice(-3)
    const avgChange = recent.reduce((sum, imp) => sum + imp.percentChange, 0) / recent.length

    if (avgChange < -10) return 'improving' // Negative percent change is good
    if (avgChange > 10) return 'declining'
    return 'stable'
  }

  // Format pattern impact as currency
  const formatPatternImpact = (impact: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(impact)
  }

  return {
    // Store access
    patternsStore,

    // UI helpers
    getPatternTierColor,
    getPatternTierBadgeClass,
    getPatternStatusColor,
    getPatternStatusBadgeClass,
    getPatternCategoryIcon,
    getLearningProgressClass,

    // Actions
    startPracticeSession,
    completePracticeSession,
    recordCorrection,

    // Queries
    getRelatedPatterns,
    hasRecentActivity,
    getImprovementTrend,

    // Formatting
    formatPatternImpact,
  }
}
