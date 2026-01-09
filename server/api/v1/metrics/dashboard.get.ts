/**
 * Dashboard Metrics API Endpoint
 *
 * GET /api/v1/metrics/dashboard
 *
 * Returns all metrics needed for the main dashboard in one call.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { calculateDenialMetrics, calculateDenialTrend, detectPatterns } from '~/server/services/patternDetection'
import { calculateGlobalLearningStats, calculateGlobalROI } from '~/server/services/learningMetrics'
import { getAllPatternTrends } from '~/server/services/snapshotEngine'
import { db } from '~/server/database'
import { claims, claimAppeals, patterns } from '~/server/database/schema'
import { eq, and, gte, count, sum, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] as string

    // Fetch all metrics in parallel
    const [
      denialMetrics,
      denialTrend,
      detectedPatterns,
      learningStats,
      roiData,
      patternTrends,
      appealStats,
      activePatternCount,
    ] = await Promise.all([
      calculateDenialMetrics(days),
      calculateDenialTrend(4, 7),
      detectPatterns(days),
      calculateGlobalLearningStats(),
      calculateGlobalROI(days),
      getAllPatternTrends(days),
      getAppealStats(startDateStr),
      db.select({ count: count() }).from(patterns).where(eq(patterns.status, 'active')),
    ])

    return {
      // Key performance indicators
      kpis: {
        denialRate: denialMetrics.denialRate,
        totalDenied: denialMetrics.totalDeniedAmount,
        potentialRecovery: denialMetrics.potentialRecovery,
        appealSuccessRate: appealStats.successRate,
        patternsDetected: detectedPatterns.length,
        activePatternsInDb: activePatternCount[0]?.count || 0,
        learningProgress: learningStats.averageAccuracy,
        estimatedROI: roiData.summary.totalEstimatedMonthlyRecovery,
      },

      // Denial analysis
      denials: {
        metrics: denialMetrics,
        trend: denialTrend,
        topReasons: denialMetrics.topDenialReasons.slice(0, 5),
      },

      // Pattern detection
      patterns: {
        detected: detectedPatterns.slice(0, 10),
        trends: patternTrends.summary,
        topByImpact: detectedPatterns
          .sort((a, b) => b.totalDeniedAmount - a.totalDeniedAmount)
          .slice(0, 5),
      },

      // Appeals
      appeals: appealStats,

      // Learning and ROI
      learning: {
        stats: {
          averageAccuracy: learningStats.averageAccuracy,
          totalSessions: learningStats.totalPracticeSessions,
          patternsWithProgress: learningStats.patternsWithProgress,
          totalTimeMinutes: learningStats.totalTimeSpentMinutes,
        },
        roi: roiData.summary,
        topROIPatterns: roiData.patterns.slice(0, 5),
      },

      // Metadata
      period: {
        days,
        startDate: startDateStr,
        endDate: new Date().toISOString().split('T')[0],
      },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to calculate dashboard metrics',
    })
  }
})

async function getAppealStats(startDateStr: string) {
  // Get appeal statistics
  const [totalAppeals] = await db
    .select({ count: count() })
    .from(claimAppeals)
    .where(eq(claimAppeals.appealFiled, true))

  const [overturnedAppeals] = await db
    .select({ count: count() })
    .from(claimAppeals)
    .where(eq(claimAppeals.appealOutcome, 'overturned'))

  const [upheldAppeals] = await db
    .select({ count: count() })
    .from(claimAppeals)
    .where(eq(claimAppeals.appealOutcome, 'upheld'))

  const [pendingAppeals] = await db
    .select({ count: count() })
    .from(claimAppeals)
    .where(eq(claimAppeals.appealOutcome, 'pending'))

  const total = totalAppeals?.count || 0
  const overturned = overturnedAppeals?.count || 0
  const upheld = upheldAppeals?.count || 0
  const pending = pendingAppeals?.count || 0
  const resolved = overturned + upheld
  const successRate = resolved > 0 ? Math.round((overturned / resolved) * 10000) / 100 : 0

  return {
    total,
    overturned,
    upheld,
    pending,
    successRate,
  }
}
