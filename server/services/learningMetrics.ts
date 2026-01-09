/**
 * Learning Metrics Service
 *
 * Tracks learning progress, practice sessions, and calculates ROI
 * from educational interventions.
 */

import { db } from '~/server/database'
import { learningEvents, patterns } from '~/server/database/schema'
import { eq, and, gte, sql, count, desc } from 'drizzle-orm'

// =============================================================================
// TYPES
// =============================================================================

export interface LearningProgress {
  patternId: string
  patternTitle?: string
  sessionsCompleted: number
  questionsAttempted: number
  correctAnswers: number
  accuracy: number
  lastPracticed: string | null
  timeSpentMinutes: number
}

export interface GlobalLearningStats {
  averageAccuracy: number
  totalPracticeSessions: number
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  patternsWithProgress: number
  totalTimeSpentMinutes: number
  detailedProgress: LearningProgress[]
  recentActivity: Array<{
    type: string
    timestamp: string
    patternId?: string
    metadata?: Record<string, unknown>
  }>
}

export interface PracticeROI {
  patternId: string
  patternTitle?: string
  sessionsCompleted: number
  currentImprovement: number
  estimatedMonthlyRecovery: number
  roi: 'positive' | 'in_progress' | 'not_started'
  totalAtRisk: number
}

// =============================================================================
// LEARNING PROGRESS
// =============================================================================

/**
 * Calculate learning progress for a specific pattern
 */
export async function calculateLearningProgress(patternId: string): Promise<LearningProgress> {
  // Get all learning events for this pattern
  const events = await db
    .select()
    .from(learningEvents)
    .where(sql`json_extract(${learningEvents.metadata}, '$.patternId') = ${patternId}`)
    .orderBy(desc(learningEvents.timestamp))

  const sessions = new Set<string>()
  let totalCorrect = 0
  let totalQuestions = 0
  let totalTimeMinutes = 0

  for (const event of events) {
    const metadata = event.metadata as Record<string, unknown> | null

    if (event.type === 'practice_started' || event.type === 'practice-started') {
      if (event.sessionId) sessions.add(event.sessionId)
    }

    if (event.type === 'practice_completed' || event.type === 'practice-completed') {
      totalCorrect += (metadata?.correct as number) || 0
      totalQuestions += (metadata?.total as number) || 0
      totalTimeMinutes += (metadata?.durationMinutes as number) || 0
    }

    if (event.type === 'pattern_practiced' || event.type === 'pattern-practiced') {
      totalQuestions++
      if (metadata?.correct) totalCorrect++
    }
  }

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0

  return {
    patternId,
    sessionsCompleted: sessions.size,
    questionsAttempted: totalQuestions,
    correctAnswers: totalCorrect,
    accuracy,
    lastPracticed: events.length > 0 ? events[0]?.timestamp || null : null,
    timeSpentMinutes: totalTimeMinutes,
  }
}

/**
 * Calculate overall learning statistics
 */
export async function calculateGlobalLearningStats(): Promise<GlobalLearningStats> {
  // Get all patterns
  const allPatterns = await db.select().from(patterns)

  // Calculate progress for each pattern
  const progressList = await Promise.all(
    allPatterns.map(async (p) => {
      const progress = await calculateLearningProgress(p.id)
      return {
        ...progress,
        patternTitle: p.title,
      }
    })
  )

  // Get recent activity
  const recentEvents = await db
    .select()
    .from(learningEvents)
    .orderBy(desc(learningEvents.timestamp))
    .limit(20)

  // Aggregate stats
  const patternsWithProgress = progressList.filter(p => p.sessionsCompleted > 0)
  const totalSessions = progressList.reduce((sum, p) => sum + p.sessionsCompleted, 0)
  const totalQuestions = progressList.reduce((sum, p) => sum + p.questionsAttempted, 0)
  const totalCorrect = progressList.reduce((sum, p) => sum + p.correctAnswers, 0)
  const totalTime = progressList.reduce((sum, p) => sum + p.timeSpentMinutes, 0)

  const avgAccuracy = patternsWithProgress.length > 0
    ? patternsWithProgress.reduce((sum, p) => sum + p.accuracy, 0) / patternsWithProgress.length
    : 0

  return {
    averageAccuracy: Math.round(avgAccuracy * 10) / 10,
    totalPracticeSessions: totalSessions,
    totalQuestionsAnswered: totalQuestions,
    totalCorrectAnswers: totalCorrect,
    patternsWithProgress: patternsWithProgress.length,
    totalTimeSpentMinutes: totalTime,
    detailedProgress: progressList.sort((a, b) => b.sessionsCompleted - a.sessionsCompleted),
    recentActivity: recentEvents.map(e => ({
      type: e.type,
      timestamp: e.timestamp,
      patternId: (e.metadata as Record<string, unknown> | null)?.patternId as string | undefined,
      metadata: e.metadata as Record<string, unknown> | undefined,
    })),
  }
}

// =============================================================================
// ROI CALCULATION
// =============================================================================

/**
 * Calculate practice ROI for a pattern
 * Estimates money saved by learning this pattern
 */
export async function calculatePracticeROI(patternId: string, lookbackDays: number = 30): Promise<PracticeROI> {
  // Get learning progress
  const progress = await calculateLearningProgress(patternId)

  // Get pattern data
  const [patternData] = await db
    .select()
    .from(patterns)
    .where(eq(patterns.id, patternId))
    .limit(1)

  if (!patternData) {
    return {
      patternId,
      sessionsCompleted: 0,
      currentImprovement: 0,
      estimatedMonthlyRecovery: 0,
      roi: 'not_started',
      totalAtRisk: 0,
    }
  }

  if (progress.sessionsCompleted === 0) {
    return {
      patternId,
      patternTitle: patternData.title,
      sessionsCompleted: 0,
      currentImprovement: 0,
      estimatedMonthlyRecovery: 0,
      roi: 'not_started',
      totalAtRisk: patternData.totalAtRisk || 0,
    }
  }

  // Estimate: each practice session improves performance
  // More sessions + higher accuracy = more improvement
  const sessionBonus = Math.min(progress.sessionsCompleted * 5, 40) // Max 40% from sessions
  const accuracyBonus = progress.accuracy * 0.5 // Up to 50% from accuracy
  const currentImprovement = Math.min(sessionBonus + accuracyBonus, 80) // Max 80% improvement

  // Calculate estimated recovery
  const totalAtRisk = patternData.totalAtRisk || patternData.currentDollarsDenied || 0
  const estimatedMonthlyRecovery = Math.round(totalAtRisk * (currentImprovement / 100))

  return {
    patternId,
    patternTitle: patternData.title,
    sessionsCompleted: progress.sessionsCompleted,
    currentImprovement: Math.round(currentImprovement * 10) / 10,
    estimatedMonthlyRecovery,
    roi: estimatedMonthlyRecovery > 0 ? 'positive' : 'in_progress',
    totalAtRisk,
  }
}

/**
 * Calculate ROI for all patterns
 */
export async function calculateGlobalROI(lookbackDays: number = 30) {
  const allPatterns = await db.select().from(patterns)

  const roiResults = await Promise.all(
    allPatterns.map(p => calculatePracticeROI(p.id, lookbackDays))
  )

  // Sort by estimated recovery
  roiResults.sort((a, b) => b.estimatedMonthlyRecovery - a.estimatedMonthlyRecovery)

  const totalRecovery = roiResults.reduce((sum, r) => sum + r.estimatedMonthlyRecovery, 0)
  const totalAtRisk = roiResults.reduce((sum, r) => sum + r.totalAtRisk, 0)
  const patternsWithROI = roiResults.filter(r => r.estimatedMonthlyRecovery > 0).length

  return {
    patterns: roiResults,
    summary: {
      totalEstimatedMonthlyRecovery: totalRecovery,
      totalAtRisk,
      patternsWithROI,
      totalPatterns: roiResults.length,
      averageImprovement: roiResults.length > 0
        ? Math.round(roiResults.reduce((sum, r) => sum + r.currentImprovement, 0) / roiResults.length * 10) / 10
        : 0,
    },
  }
}

// =============================================================================
// ENGAGEMENT METRICS
// =============================================================================

/**
 * Calculate user engagement metrics
 */
export async function calculateEngagementMetrics(lookbackDays: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString()

  // Get events in period
  const events = await db
    .select()
    .from(learningEvents)
    .where(gte(learningEvents.timestamp, startDateStr))

  // Count by type
  const eventCounts: Record<string, number> = {}
  const dailyActivity: Record<string, number> = {}
  const uniqueSessions = new Set<string>()
  const uniqueUsers = new Set<string>()

  for (const event of events) {
    // Count event types
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1

    // Track daily activity
    const date = event.timestamp.split('T')[0] as string
    dailyActivity[date] = (dailyActivity[date] || 0) + 1

    // Track unique sessions and users
    if (event.sessionId) uniqueSessions.add(event.sessionId)
    if (event.userId) uniqueUsers.add(event.userId)
  }

  // Calculate daily averages
  const days = Object.keys(dailyActivity).length || 1
  const avgDailyEvents = Math.round(events.length / days)

  return {
    totalEvents: events.length,
    eventsByType: eventCounts,
    uniqueSessions: uniqueSessions.size,
    uniqueUsers: uniqueUsers.size,
    dailyActivity: Object.entries(dailyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    averageDailyEvents: avgDailyEvents,
    period: {
      days: lookbackDays,
      startDate: startDateStr,
      endDate: new Date().toISOString(),
    },
  }
}
