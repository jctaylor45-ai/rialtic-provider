/**
 * Snapshot Engine Service
 *
 * Creates daily snapshots of metrics for trend analysis.
 * Stores historical data for pattern performance tracking.
 */

import { db } from '~/server/database'
import { patternSnapshots, patterns, claims, claimAppeals, patternClaims } from '~/server/database/schema'
import { eq, and, gte, lt, sql, count, sum, desc } from 'drizzle-orm'

// =============================================================================
// TYPES
// =============================================================================

export interface SnapshotResult {
  patternId: string
  snapshotDate: string
  periodStart: string
  periodEnd: string
  claimCount: number
  deniedCount: number
  denialRate: number
  dollarsDenied: number
  dollarsAtRisk: number
  appealCount: number
  appealRate: number
}

export interface TrendData {
  patternId: string
  patternTitle?: string
  period: {
    days: number
    from: string
    to: string
  }
  frequency: {
    start: number
    end: number
    change: number
    percentChange: number
  }
  denialRate: {
    start: number
    end: number
    change: number
  }
  dollarsDenied: {
    start: number
    end: number
    change: number
    percentChange: number
  }
  trend: 'improving' | 'worsening' | 'stable'
}

// =============================================================================
// SNAPSHOT CREATION
// =============================================================================

/**
 * Create a snapshot for a single pattern
 */
export async function createPatternSnapshot(
  patternId: string,
  snapshotDate: string,
  periodDays: number = 7
): Promise<SnapshotResult | null> {
  const periodEnd = new Date(snapshotDate)
  const periodStart = new Date(snapshotDate)
  periodStart.setDate(periodStart.getDate() - periodDays)

  const periodStartStr = periodStart.toISOString().split('T')[0] as string
  const periodEndStr = periodEnd.toISOString().split('T')[0] as string

  // Get claims linked to this pattern in the period
  const linkedClaims = await db
    .select({
      claimId: patternClaims.claimId,
      status: claims.status,
      billedAmount: claims.billedAmount,
      dateOfService: claims.dateOfService,
    })
    .from(patternClaims)
    .innerJoin(claims, eq(patternClaims.claimId, claims.id))
    .where(and(
      eq(patternClaims.patternId, patternId),
      gte(claims.dateOfService, periodStartStr),
      lt(claims.dateOfService, periodEndStr)
    ))

  const claimCount = linkedClaims.length
  const deniedClaims = linkedClaims.filter(c => c.status === 'denied')
  const deniedCount = deniedClaims.length
  const dollarsDenied = deniedClaims.reduce((sum, c) => sum + (c.billedAmount || 0), 0)
  const dollarsAtRisk = linkedClaims.reduce((sum, c) => sum + (c.billedAmount || 0), 0)
  const denialRate = claimCount > 0 ? (deniedCount / claimCount) * 100 : 0

  // Count appeals for linked claims
  const [appealResult] = await db
    .select({ count: count() })
    .from(claimAppeals)
    .where(sql`${claimAppeals.claimId} IN (SELECT claim_id FROM pattern_claims WHERE pattern_id = ${patternId})`)

  const appealCount = appealResult?.count || 0
  const appealRate = deniedCount > 0 ? (appealCount / deniedCount) * 100 : 0

  const snapshot: SnapshotResult = {
    patternId,
    snapshotDate,
    periodStart: periodStartStr,
    periodEnd: periodEndStr,
    claimCount,
    deniedCount,
    denialRate: Math.round(denialRate * 100) / 100,
    dollarsDenied,
    dollarsAtRisk,
    appealCount,
    appealRate: Math.round(appealRate * 100) / 100,
  }

  // Insert into database
  await db.insert(patternSnapshots).values(snapshot).onConflictDoNothing()

  return snapshot
}

/**
 * Create daily snapshots for all patterns
 * Should be run once per day
 */
export async function createDailySnapshot(
  snapshotDate?: string,
  periodDays: number = 7
): Promise<{ snapshotsCreated: number; date: string }> {
  const today = snapshotDate || new Date().toISOString().split('T')[0] as string

  // Get all active patterns
  const allPatterns = await db
    .select()
    .from(patterns)
    .where(eq(patterns.status, 'active'))

  let created = 0

  for (const pattern of allPatterns) {
    const snapshot = await createPatternSnapshot(pattern.id, today, periodDays)
    if (snapshot) created++
  }

  return { snapshotsCreated: created, date: today }
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Get trend data for a pattern over time
 */
export async function getPatternTrend(patternId: string, days: number = 30): Promise<TrendData | null> {
  const snapshots = await db
    .select()
    .from(patternSnapshots)
    .where(eq(patternSnapshots.patternId, patternId))
    .orderBy(desc(patternSnapshots.snapshotDate))
    .limit(days)

  if (snapshots.length < 2) {
    return null
  }

  // Get pattern title
  const [patternData] = await db
    .select({ title: patterns.title })
    .from(patterns)
    .where(eq(patterns.id, patternId))
    .limit(1)

  const newest = snapshots[0]!
  const oldest = snapshots[snapshots.length - 1]!

  const newestCount = newest.claimCount || 0
  const oldestCount = oldest.claimCount || 0
  const frequencyChange = newestCount - oldestCount
  const frequencyPercentChange = oldestCount > 0
    ? Math.round((frequencyChange / oldestCount) * 10000) / 100
    : 0

  const denialRateChange = (newest.denialRate || 0) - (oldest.denialRate || 0)

  const dollarsChange = (newest.dollarsDenied || 0) - (oldest.dollarsDenied || 0)
  const dollarsPercentChange = (oldest.dollarsDenied || 0) > 0
    ? Math.round((dollarsChange / (oldest.dollarsDenied || 1)) * 10000) / 100
    : 0

  // Determine trend direction based on denial rate and dollars denied
  let trend: 'improving' | 'worsening' | 'stable' = 'stable'
  if (denialRateChange < -5 || dollarsPercentChange < -10) {
    trend = 'improving'
  } else if (denialRateChange > 5 || dollarsPercentChange > 10) {
    trend = 'worsening'
  }

  return {
    patternId,
    patternTitle: patternData?.title,
    period: {
      days,
      from: oldest.snapshotDate,
      to: newest.snapshotDate,
    },
    frequency: {
      start: oldestCount,
      end: newestCount,
      change: frequencyChange,
      percentChange: frequencyPercentChange,
    },
    denialRate: {
      start: oldest.denialRate || 0,
      end: newest.denialRate || 0,
      change: Math.round(denialRateChange * 100) / 100,
    },
    dollarsDenied: {
      start: oldest.dollarsDenied || 0,
      end: newest.dollarsDenied || 0,
      change: dollarsChange,
      percentChange: dollarsPercentChange,
    },
    trend,
  }
}

/**
 * Get trends for all patterns
 */
export async function getAllPatternTrends(days: number = 30) {
  const allPatterns = await db.select().from(patterns)

  const trends = await Promise.all(
    allPatterns.map(p => getPatternTrend(p.id, days))
  )

  // Filter out nulls and sort by trend severity
  const validTrends = trends.filter((t): t is TrendData => t !== null)

  return {
    trends: validTrends.sort((a, b) => {
      // Sort worsening first, then stable, then improving
      const order = { worsening: 0, stable: 1, improving: 2 }
      return order[a.trend] - order[b.trend]
    }),
    summary: {
      improving: validTrends.filter(t => t.trend === 'improving').length,
      stable: validTrends.filter(t => t.trend === 'stable').length,
      worsening: validTrends.filter(t => t.trend === 'worsening').length,
      total: validTrends.length,
    },
  }
}

// =============================================================================
// HISTORICAL QUERIES
// =============================================================================

/**
 * Get snapshot history for a pattern
 */
export async function getPatternHistory(patternId: string, days: number = 90) {
  const snapshots = await db
    .select()
    .from(patternSnapshots)
    .where(eq(patternSnapshots.patternId, patternId))
    .orderBy(desc(patternSnapshots.snapshotDate))
    .limit(days)

  return snapshots.reverse() // Oldest first for charting
}

/**
 * Compare two time periods for a pattern
 */
export async function comparePatternPeriods(
  patternId: string,
  currentStart: string,
  currentEnd: string,
  baselineStart: string,
  baselineEnd: string
) {
  const [currentSnapshots, baselineSnapshots] = await Promise.all([
    db.select().from(patternSnapshots).where(and(
      eq(patternSnapshots.patternId, patternId),
      gte(patternSnapshots.snapshotDate, currentStart),
      lt(patternSnapshots.snapshotDate, currentEnd)
    )),
    db.select().from(patternSnapshots).where(and(
      eq(patternSnapshots.patternId, patternId),
      gte(patternSnapshots.snapshotDate, baselineStart),
      lt(patternSnapshots.snapshotDate, baselineEnd)
    )),
  ])

  // Aggregate each period
  const aggregatePeriod = (snapshots: typeof currentSnapshots) => ({
    totalClaims: snapshots.reduce((sum, s) => sum + (s.claimCount || 0), 0),
    totalDenied: snapshots.reduce((sum, s) => sum + (s.deniedCount || 0), 0),
    totalDollarsDenied: snapshots.reduce((sum, s) => sum + (s.dollarsDenied || 0), 0),
    avgDenialRate: snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + (s.denialRate || 0), 0) / snapshots.length
      : 0,
  })

  const current = aggregatePeriod(currentSnapshots)
  const baseline = aggregatePeriod(baselineSnapshots)

  return {
    patternId,
    current: {
      period: { start: currentStart, end: currentEnd },
      ...current,
    },
    baseline: {
      period: { start: baselineStart, end: baselineEnd },
      ...baseline,
    },
    comparison: {
      claimsChange: current.totalClaims - baseline.totalClaims,
      deniedChange: current.totalDenied - baseline.totalDenied,
      dollarsChange: current.totalDollarsDenied - baseline.totalDollarsDenied,
      denialRateChange: current.avgDenialRate - baseline.avgDenialRate,
      improvement: current.avgDenialRate < baseline.avgDenialRate,
    },
  }
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Clean up old snapshots (keep last N days)
 */
export async function cleanupOldSnapshots(keepDays: number = 365) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - keepDays)
  const cutoffStr = cutoffDate.toISOString().split('T')[0] as string

  const result = await db
    .delete(patternSnapshots)
    .where(lt(patternSnapshots.snapshotDate, cutoffStr))

  return { deleted: result.changes || 0, cutoffDate: cutoffStr }
}
