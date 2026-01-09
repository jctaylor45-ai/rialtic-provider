/**
 * Insights API Endpoint
 *
 * GET /api/v1/insights
 *
 * Returns aggregated insights from claims, patterns, and learning events.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, patterns, learningEvents, claimAppeals } from '~/server/database/schema'
import { eq, desc, and, gte, sql, count, sum } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] as string

    // Build date filter for claims
    const claimDateFilter = gte(claims.dateOfService, startDateStr)

    // Get denial patterns by category
    const denialsByCategory = await db
      .select({
        category: patterns.category,
        count: count(),
        totalImpact: sum(patterns.totalAtRisk),
      })
      .from(patterns)
      .where(eq(patterns.status, 'active'))
      .groupBy(patterns.category)

    // Get top denial reasons
    const topDenialReasons = await db
      .select({
        reason: claims.denialReason,
        count: sql<number>`count(*)`,
        totalAmount: sum(claims.billedAmount),
      })
      .from(claims)
      .where(and(
        claimDateFilter,
        eq(claims.status, 'denied')
      ))
      .groupBy(claims.denialReason)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    // Get appeal success rates by denial category
    const [appealStats] = await db
      .select({
        total: count(),
        overturned: sql<number>`SUM(CASE WHEN appeal_outcome = 'overturned' THEN 1 ELSE 0 END)`,
        upheld: sql<number>`SUM(CASE WHEN appeal_outcome = 'upheld' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN appeal_outcome = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(claimAppeals)
      .where(eq(claimAppeals.appealFiled, true))

    // Get learning engagement metrics
    const learningMetrics = await db
      .select({
        type: learningEvents.type,
        count: sql<number>`count(*)`,
      })
      .from(learningEvents)
      .where(gte(learningEvents.timestamp, startDate.toISOString()))
      .groupBy(learningEvents.type)

    // Get critical patterns (high impact, active)
    const criticalPatterns = await db
      .select({
        id: patterns.id,
        title: patterns.title,
        category: patterns.category,
        tier: patterns.tier,
        totalAtRisk: patterns.totalAtRisk,
        currentClaimCount: patterns.currentClaimCount,
        currentDenialRate: patterns.currentDenialRate,
      })
      .from(patterns)
      .where(and(
        eq(patterns.status, 'active'),
        eq(patterns.tier, 'critical')
      ))
      .orderBy(desc(patterns.totalAtRisk))
      .limit(5)

    // Calculate revenue at risk
    const [revenueAtRisk] = await db
      .select({
        total: sum(claims.billedAmount),
      })
      .from(claims)
      .where(and(
        claimDateFilter,
        eq(claims.status, 'denied')
      ))

    // Get trend data (claims by week)
    const weeklyTrends = await db
      .select({
        week: sql<string>`strftime('%Y-W%W', date_of_service)`,
        total: count(),
        denied: sql<number>`SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)`,
        approved: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
        totalBilled: sum(claims.billedAmount),
        totalPaid: sum(claims.paidAmount),
      })
      .from(claims)
      .where(claimDateFilter)
      .groupBy(sql`strftime('%Y-W%W', date_of_service)`)
      .orderBy(sql`strftime('%Y-W%W', date_of_service)`)

    // Build learning engagement summary
    const learningEngagement: Record<string, number> = {}
    for (const metric of learningMetrics) {
      learningEngagement[metric.type] = metric.count
    }

    return {
      period: {
        days,
        startDate: startDateStr,
        endDate: new Date().toISOString().split('T')[0],
      },
      denialAnalysis: {
        byCategory: denialsByCategory.map(d => ({
          category: d.category,
          count: d.count,
          impact: Number(d.totalImpact) || 0,
        })),
        topReasons: topDenialReasons.map(r => ({
          reason: r.reason || 'Unknown',
          count: r.count,
          amount: Number(r.totalAmount) || 0,
        })),
        revenueAtRisk: Number(revenueAtRisk?.total) || 0,
      },
      appeals: {
        total: appealStats?.total || 0,
        overturned: appealStats?.overturned || 0,
        upheld: appealStats?.upheld || 0,
        pending: appealStats?.pending || 0,
        successRate: appealStats && appealStats.total > 0
          ? Math.round((appealStats.overturned / (appealStats.overturned + appealStats.upheld)) * 10000) / 100
          : 0,
      },
      criticalPatterns,
      weeklyTrends: weeklyTrends.map(w => ({
        week: w.week,
        total: w.total,
        denied: w.denied,
        approved: w.approved,
        denialRate: w.total > 0 ? Math.round((w.denied / w.total) * 10000) / 100 : 0,
        totalBilled: Number(w.totalBilled) || 0,
        totalPaid: Number(w.totalPaid) || 0,
      })),
      learningEngagement,
    }
  } catch (error) {
    console.error('Insights endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch insights',
    })
  }
})
