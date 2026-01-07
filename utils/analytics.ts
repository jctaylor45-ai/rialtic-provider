/**
 * Analytics utilities for pattern detection, scoring, and ROI calculations
 */

import { differenceInDays, differenceInMonths, parseISO, startOfMonth, format } from 'date-fns'
import type {
  Pattern,
  PatternScore,
  PatternTier,
  PatternEvidence,
  PatternImprovement,
  PracticeROI,
  TimeSeriesDataPoint,
  MetricTrend,
  LearningEvent,
  EventType
} from '~/types/enhancements'

// ============================================================================
// PATTERN SCORING
// ============================================================================

/**
 * Calculate pattern tier based on frequency, impact, and trend
 */
export function calculatePatternTier(score: PatternScore, avgDenialAmount: number): PatternTier {
  const { frequency, impact, trend } = score

  // Critical: High frequency + high impact + upward trend
  if (frequency >= 15 && impact >= 20000 && trend === 'up') {
    return 'critical'
  }

  // High: Moderate-high frequency or high impact
  if (frequency >= 10 || impact >= 15000 || (frequency >= 5 && trend === 'up')) {
    return 'high'
  }

  // Medium: Moderate frequency or impact
  if (frequency >= 5 || impact >= 5000) {
    return 'medium'
  }

  // Low: Everything else
  return 'low'
}

/**
 * Calculate confidence score for pattern detection
 */
export function calculatePatternConfidence(
  evidenceCount: number,
  timeSpan: number,  // days
  consistencyScore: number  // 0-1
): number {
  // More evidence = higher confidence
  const evidenceScore = Math.min(evidenceCount / 10, 1) * 40

  // Longer time span with consistent pattern = higher confidence
  const timeScore = Math.min(timeSpan / 90, 1) * 30

  // Consistency is critical
  const consistencyWeight = consistencyScore * 30

  return Math.round(evidenceScore + timeScore + consistencyWeight)
}

/**
 * Calculate velocity (rate of change) for a pattern
 */
export function calculateVelocity(evidence: PatternEvidence[]): number {
  if (evidence.length < 2) return 0

  const sortedEvidence = [...evidence].sort((a, b) =>
    new Date(a.denialDate).getTime() - new Date(b.denialDate).getTime()
  )

  const firstEvidence = sortedEvidence[0]
  const lastEvidence = sortedEvidence[sortedEvidence.length - 1]
  if (!firstEvidence || !lastEvidence) return 0
  const firstDate = new Date(firstEvidence.denialDate)
  const lastDate = new Date(lastEvidence.denialDate)
  const monthsSpan = differenceInMonths(lastDate, firstDate) || 1

  return Math.round((evidence.length / monthsSpan) * 10) / 10
}

/**
 * Determine trend based on evidence over time
 */
export function calculateTrend(evidence: PatternEvidence[]): 'up' | 'down' | 'stable' {
  if (evidence.length < 4) return 'stable'

  const sorted = [...evidence].sort((a, b) =>
    new Date(a.denialDate).getTime() - new Date(b.denialDate).getTime()
  )

  const midpoint = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, midpoint)
  const secondHalf = sorted.slice(midpoint)

  const firstHalfFirst = firstHalf[0]
  const firstHalfLast = firstHalf[firstHalf.length - 1]
  const secondHalfFirst = secondHalf[0]
  const secondHalfLast = secondHalf[secondHalf.length - 1]

  if (!firstHalfFirst || !firstHalfLast || !secondHalfFirst || !secondHalfLast) return 'stable'

  const firstHalfRate = firstHalf.length / (differenceInMonths(
    new Date(firstHalfLast.denialDate),
    new Date(firstHalfFirst.denialDate)
  ) || 1)

  const secondHalfRate = secondHalf.length / (differenceInMonths(
    new Date(secondHalfLast.denialDate),
    new Date(secondHalfFirst.denialDate)
  ) || 1)

  const change = ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100

  if (change > 20) return 'up'
  if (change < -20) return 'down'
  return 'stable'
}

/**
 * Calculate complete pattern score
 */
export function calculatePatternScore(evidence: PatternEvidence[]): PatternScore {
  const frequency = evidence.length
  const impact = evidence.reduce((sum, e) => sum + e.billedAmount, 0)
  const trend = calculateTrend(evidence)
  const velocity = calculateVelocity(evidence)

  const sorted = [...evidence].sort((a, b) =>
    new Date(b.denialDate).getTime() - new Date(a.denialDate).getTime()
  )
  const firstSorted = sorted[0]
  const lastSorted = sorted[sorted.length - 1]
  const recency = firstSorted
    ? differenceInDays(new Date(), new Date(firstSorted.denialDate))
    : 999

  // Calculate consistency for confidence
  const timeSpan = firstSorted && lastSorted ? differenceInDays(
    new Date(firstSorted.denialDate),
    new Date(lastSorted.denialDate)
  ) : 0
  const consistencyScore = frequency > 1 ? Math.min(frequency / (timeSpan / 30), 1) : 0.5

  const confidence = calculatePatternConfidence(frequency, timeSpan, consistencyScore)

  return {
    frequency,
    impact: Math.round(impact),
    trend,
    velocity,
    confidence,
    recency
  }
}

// ============================================================================
// ROI CALCULATIONS
// ============================================================================

/**
 * Calculate estimated savings from pattern resolution
 */
export function calculatePatternSavings(
  pattern: Pattern,
  resolutionRate: number  // 0-1, how much the pattern has improved
): number {
  const potentialSavings = pattern.score.frequency * pattern.avgDenialAmount
  return Math.round(potentialSavings * resolutionRate)
}

/**
 * Calculate practice ROI metrics
 */
export function calculatePracticeROI(
  patterns: Pattern[],
  learningEvents: LearningEvent[]
): PracticeROI {
  // Practice sessions
  const practiceSessions = learningEvents.filter(e =>
    e.type === 'practice-completed'
  )

  const totalPracticeSessions = practiceSessions.length
  const totalTimeInvested = practiceSessions.reduce((sum, e) =>
    sum + (e.metadata.duration || 0), 0
  ) / 60000  // Convert to minutes

  // Corrections applied
  const totalCorrectionsApplied = learningEvents.filter(e =>
    e.type === 'correction-applied'
  ).length

  // Pattern improvements
  const resolvedPatterns = patterns.filter(p => p.status === 'resolved')
  const improvingPatterns = patterns.filter(p => p.status === 'improving')

  // Calculate savings
  let estimatedSavings = 0
  const patternImpact = patterns.map(pattern => {
    const resolutionRate = pattern.learningProgress / 100
    const savingsRealized = calculatePatternSavings(pattern, resolutionRate)
    estimatedSavings += savingsRealized

    // Count denials before/after based on improvements
    const latestImprovement = pattern.improvements[pattern.improvements.length - 1]
    const denialsBefore = latestImprovement?.before || pattern.score.frequency
    const denialsAfter = latestImprovement?.after || pattern.score.frequency

    return {
      patternId: pattern.id,
      patternTitle: pattern.title,
      category: pattern.category,
      denialsBefore: Math.round(denialsBefore),
      denialsAfter: Math.round(denialsAfter),
      savingsRealized,
      lastPracticed: pattern.lastUpdated
    }
  }).sort((a, b) => b.savingsRealized - a.savingsRealized)

  // Calculate average correction rate
  const avgCorrectionRate = totalPracticeSessions > 0
    ? (totalCorrectionsApplied / totalPracticeSessions) * 100
    : 0

  // Generate time series data
  const savingsOverTime = generateSavingsTimeSeries(patterns, learningEvents)
  const denialRateOverTime = generateDenialRateTimeSeries(learningEvents)
  const practiceActivityOverTime = generatePracticeActivityTimeSeries(learningEvents)

  // Engagement metrics
  const avgSessionDuration = totalPracticeSessions > 0
    ? totalTimeInvested / totalPracticeSessions
    : 0

  const patternPracticeCount = new Map<string, number>()
  practiceSessions.forEach(e => {
    if (e.metadata.patternId) {
      patternPracticeCount.set(
        e.metadata.patternId,
        (patternPracticeCount.get(e.metadata.patternId) || 0) + 1
      )
    }
  })
  const mostPracticedPatterns = Array.from(patternPracticeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Calculate streak days
  const sortedEvents = [...learningEvents]
    .filter(e => e.type === 'practice-completed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  let streakDays = 0
  if (sortedEvents.length > 0) {
    const today = new Date()
    const uniqueDays = new Set<string>()

    for (const event of sortedEvents) {
      const eventDate = parseISO(event.timestamp)
      const daysDiff = differenceInDays(today, eventDate)

      if (daysDiff > streakDays + 1) break

      const dateKey = format(eventDate, 'yyyy-MM-dd')
      uniqueDays.add(dateKey)
    }

    streakDays = uniqueDays.size
  }

  const firstEvent = sortedEvents[0]
  const lastActivityDate = firstEvent
    ? firstEvent.timestamp
    : new Date().toISOString()

  return {
    totalPracticeSessions,
    totalCorrectionsApplied,
    totalTimeInvested: Math.round(totalTimeInvested),
    estimatedSavings: Math.round(estimatedSavings),
    avoidedDenials: resolvedPatterns.reduce((sum, p) => sum + p.score.frequency, 0),
    improvedApprovalRate: calculateImprovedApprovalRate(patterns),
    patternsResolved: resolvedPatterns.length,
    patternsImproving: improvingPatterns.length,
    avgCorrectionRate: Math.round(avgCorrectionRate),
    savingsOverTime,
    denialRateOverTime,
    practiceActivityOverTime,
    patternImpact,
    avgSessionDuration: Math.round(avgSessionDuration),
    mostPracticedPatterns,
    streakDays,
    lastActivityDate
  }
}

/**
 * Calculate improved approval rate from pattern improvements
 */
function calculateImprovedApprovalRate(patterns: Pattern[]): number {
  const totalImprovement = patterns.reduce((sum, p) => {
    if (p.improvements.length === 0) return sum
    const latest = p.improvements[p.improvements.length - 1]
    return latest ? sum + Math.abs(latest.percentChange) : sum
  }, 0)

  return Math.round((totalImprovement / patterns.length) * 10) / 10
}

// ============================================================================
// TIME SERIES GENERATION
// ============================================================================

/**
 * Generate savings over time series
 */
function generateSavingsTimeSeries(
  patterns: Pattern[],
  events: LearningEvent[]
): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = []
  const monthlyData = new Map<string, number>()

  // Aggregate savings by month
  patterns.forEach(pattern => {
    pattern.improvements.forEach(improvement => {
      const monthKey = format(startOfMonth(parseISO(improvement.date)), 'yyyy-MM')
      const savings = calculatePatternSavings(pattern, Math.abs(improvement.percentChange) / 100)
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + savings)
    })
  })

  // Convert to array and sort
  Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, value]) => {
      dataPoints.push({
        date,
        value: Math.round(value),
        label: format(parseISO(date + '-01'), 'MMM yyyy')
      })
    })

  return dataPoints
}

/**
 * Generate denial rate over time series
 */
function generateDenialRateTimeSeries(events: LearningEvent[]): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = []
  const monthlyStats = new Map<string, { denials: number; total: number }>()

  // Aggregate claims by month
  events.filter(e => e.type === 'claim-submitted').forEach(event => {
    const monthKey = format(startOfMonth(parseISO(event.timestamp)), 'yyyy-MM')
    const stats = monthlyStats.get(monthKey) || { denials: 0, total: 0 }

    stats.total++
    if (event.metadata.claimStatus === 'denied') {
      stats.denials++
    }

    monthlyStats.set(monthKey, stats)
  })

  // Calculate denial rates
  Array.from(monthlyStats.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, stats]) => {
      const rate = (stats.denials / stats.total) * 100
      dataPoints.push({
        date,
        value: Math.round(rate * 10) / 10,
        label: format(parseISO(date + '-01'), 'MMM yyyy')
      })
    })

  return dataPoints
}

/**
 * Generate practice activity over time series
 */
function generatePracticeActivityTimeSeries(events: LearningEvent[]): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = []
  const monthlyCount = new Map<string, number>()

  // Count practice sessions by month
  events.filter(e => e.type === 'practice-completed').forEach(event => {
    const monthKey = format(startOfMonth(parseISO(event.timestamp)), 'yyyy-MM')
    monthlyCount.set(monthKey, (monthlyCount.get(monthKey) || 0) + 1)
  })

  // Convert to array
  Array.from(monthlyCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, value]) => {
      dataPoints.push({
        date,
        value,
        label: format(parseISO(date + '-01'), 'MMM yyyy')
      })
    })

  return dataPoints
}

// ============================================================================
// METRIC TRENDS
// ============================================================================

/**
 * Calculate metric trend comparing current vs previous period
 */
export function calculateMetricTrend(
  currentValue: number,
  previousValue: number,
  sparklineData?: TimeSeriesDataPoint[]
): MetricTrend {
  const change = currentValue - previousValue
  const percentChange = previousValue !== 0
    ? (change / previousValue) * 100
    : 0

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (Math.abs(percentChange) >= 5) {
    trend = percentChange > 0 ? 'up' : 'down'
  }

  return {
    current: currentValue,
    previous: previousValue,
    change: Math.round(change * 100) / 100,
    percentChange: Math.round(percentChange * 10) / 10,
    trend,
    sparkline: sparklineData
  }
}

// ============================================================================
// EVENT ANALYTICS
// ============================================================================

/**
 * Calculate engagement score based on event types and frequency
 */
export function calculateEngagementScore(events: LearningEvent[]): number {
  const weights: Record<EventType, number> = {
    'claim-submitted': 1,
    'claim-reviewed': 2,
    'insight-viewed': 3,
    'insight-dismissed': 2,
    'pattern-identified': 5,
    'practice-started': 4,
    'practice-completed': 8,
    'correction-applied': 10,
    'code-lookup': 3,
    'policy-viewed': 2,
    'dashboard-viewed': 1,
    'action-recorded': 6,
    'code-intel-viewed': 3
  }

  const score = events.reduce((sum, event) => {
    return sum + (weights[event.type] || 1)
  }, 0)

  // Normalize to 0-100 scale
  return Math.min(Math.round((score / events.length) * 10), 100)
}

/**
 * Group events by time period
 */
export function groupEventsByPeriod(
  events: LearningEvent[],
  period: 'day' | 'week' | 'month'
): Map<string, LearningEvent[]> {
  const grouped = new Map<string, LearningEvent[]>()

  events.forEach(event => {
    const date = parseISO(event.timestamp)
    let key: string

    switch (period) {
      case 'day':
        key = format(date, 'yyyy-MM-dd')
        break
      case 'week':
        key = format(date, 'yyyy-ww')
        break
      case 'month':
        key = format(date, 'yyyy-MM')
        break
    }

    const group = grouped.get(key) || []
    group.push(event)
    grouped.set(key, group)
  })

  return grouped
}

/**
 * Calculate pattern learning velocity (how fast patterns are being resolved)
 */
export function calculateLearningVelocity(patterns: Pattern[]): number {
  const patternsWithProgress = patterns.filter(p => p.improvements.length > 0)

  if (patternsWithProgress.length === 0) return 0

  const totalVelocity = patternsWithProgress.reduce((sum, pattern) => {
    if (pattern.improvements.length < 2) return sum

    const firstImprovement = pattern.improvements[0]
    const latestImprovement = pattern.improvements[pattern.improvements.length - 1]

    if (!firstImprovement || !latestImprovement) return sum

    const timeSpan = differenceInDays(
      parseISO(latestImprovement.date),
      parseISO(firstImprovement.date)
    )

    const progressRate = timeSpan > 0
      ? pattern.learningProgress / timeSpan
      : 0

    return sum + progressRate
  }, 0)

  return Math.round((totalVelocity / patternsWithProgress.length) * 10) / 10
}
