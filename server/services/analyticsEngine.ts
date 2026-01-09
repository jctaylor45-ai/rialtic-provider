/**
 * Analytics Engine Service
 *
 * Aggregates metrics for dashboards and reports.
 * Computes trends, comparisons, and KPIs from claim data.
 */

import { db } from '~/server/database'
import { claims, patterns, patternClaims, providers, claimAppeals } from '~/server/database/schema'
import { sql, count, eq, and, gte, lte, desc } from 'drizzle-orm'

// =============================================================================
// TYPES
// =============================================================================

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface Cohort {
  name: string
  value: number
  percentage: number
}

export interface PeriodMetrics {
  totalClaims: number
  deniedCount: number
  approvedCount: number
  appealedCount: number
  totalBilled: number
  totalDenied: number
  totalPaid: number
  denialRate: string
  recoveryRate: string
}

export interface ProviderPerformance {
  providerId: string
  providerName: string | null
  totalClaims: number
  deniedClaims: number
  denialRate: string
  billedAmount: number
  deniedAmount: number
  recoveryOpportunity: number
}

export interface PatternImpact {
  patternId: string
  patternTitle: string | null
  category: string | null
  denialCount: number
  totalImpact: number
  avgPerDenial: number
}

export interface DashboardKPIs {
  summary: PeriodMetrics
  denialRateTrend: TimeSeriesPoint[]
  revenueImpactTrend: TimeSeriesPoint[]
  denialReasons: Cohort[]
  topProviderIssues: ProviderPerformance[]
  topPatternImpacts: PatternImpact[]
  appealMetrics: {
    totalAppeals: number
    pendingAppeals: number
    overturnedAppeals: number
    upheldAppeals: number
    overturnRate: string
  }
}

// =============================================================================
// ANALYTICS ENGINE CLASS
// =============================================================================

export class AnalyticsEngine {
  /**
   * Get denial rate over time
   */
  async getDenialRateTrend(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesPoint[]> {
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d'
      : groupBy === 'week' ? '%Y-W%W'
      : '%Y-%m'

    const results = await db
      .select({
        date: sql<string>`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`,
        total: count(),
        denied: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(sql`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`)
      .orderBy(sql`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`)

    return results.map(r => ({
      date: r.date,
      value: r.total > 0 ? Math.round((r.denied / r.total) * 10000) / 100 : 0,
    }))
  }

  /**
   * Get revenue impact over time (denied amount trend)
   */
  async getRevenueImpactTrend(
    startDate: string,
    endDate: string
  ): Promise<TimeSeriesPoint[]> {
    const results = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', ${claims.dateOfService})`,
        deniedAmount: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`,
        paidAmount: sql<number>`SUM(CASE WHEN ${claims.status} IN ('approved', 'paid') THEN ${claims.paidAmount} ELSE 0 END)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(sql`strftime('%Y-%m-%d', ${claims.dateOfService})`)
      .orderBy(sql`strftime('%Y-%m-%d', ${claims.dateOfService})`)

    return results.map(r => ({
      date: r.date,
      value: Math.round((r.deniedAmount || 0) * 100) / 100,
    }))
  }

  /**
   * Get denial reasons breakdown
   */
  async getDenialReasonBreakdown(startDate: string, endDate: string): Promise<Cohort[]> {
    const results = await db
      .select({
        reason: claims.denialReason,
        count: count(),
      })
      .from(claims)
      .where(and(
        eq(claims.status, 'denied'),
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(claims.denialReason)
      .orderBy(desc(count()))

    const total = results.reduce((sum, r) => sum + r.count, 0)

    return results
      .filter(r => r.reason) // Exclude null reasons
      .map(r => ({
        name: r.reason || 'Unspecified',
        value: r.count,
        percentage: Math.round((r.count / total) * 10000) / 100,
      }))
      .slice(0, 10) // Top 10 reasons
  }

  /**
   * Get provider performance metrics
   */
  async getProviderPerformance(
    startDate: string,
    endDate: string
  ): Promise<ProviderPerformance[]> {
    const results = await db
      .select({
        providerId: claims.providerId,
        providerName: claims.providerName,
        total: count(),
        denied: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
        deniedAmount: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`,
        billedAmount: sql<number>`SUM(${claims.billedAmount})`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(claims.providerId, claims.providerName)
      .orderBy(desc(sql`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`))

    return results.map(r => ({
      providerId: r.providerId,
      providerName: r.providerName,
      totalClaims: r.total,
      deniedClaims: r.denied || 0,
      denialRate: r.total > 0 ? ((r.denied / r.total) * 100).toFixed(1) : '0.0',
      billedAmount: Math.round((r.billedAmount || 0) * 100) / 100,
      deniedAmount: Math.round((r.deniedAmount || 0) * 100) / 100,
      recoveryOpportunity: Math.round((r.deniedAmount || 0) * 100) / 100,
    }))
  }

  /**
   * Get pattern impact analysis
   */
  async getPatternImpact(
    startDate: string,
    endDate: string
  ): Promise<PatternImpact[]> {
    // Get patterns with their linked claims
    const patternData = await db
      .select({
        patternId: patterns.id,
        patternTitle: patterns.title,
        category: patterns.category,
      })
      .from(patterns)
      .where(eq(patterns.status, 'active'))

    const impacts: PatternImpact[] = []

    for (const pattern of patternData) {
      // Count denied claims linked to this pattern in the date range
      const linkedClaimsResult = await db
        .select({
          claimCount: count(),
          totalAmount: sql<number>`SUM(${claims.billedAmount})`,
        })
        .from(patternClaims)
        .innerJoin(claims, eq(patternClaims.claimId, claims.id))
        .where(and(
          eq(patternClaims.patternId, pattern.patternId),
          eq(claims.status, 'denied'),
          gte(claims.dateOfService, startDate),
          lte(claims.dateOfService, endDate)
        ))

      const denialCount = linkedClaimsResult[0]?.claimCount || 0
      const denialAmount = linkedClaimsResult[0]?.totalAmount || 0

      if (denialCount > 0) {
        impacts.push({
          patternId: pattern.patternId,
          patternTitle: pattern.patternTitle,
          category: pattern.category,
          denialCount,
          totalImpact: Math.round(denialAmount * 100) / 100,
          avgPerDenial: denialCount > 0 ? Math.round((denialAmount / denialCount) * 100) / 100 : 0,
        })
      }
    }

    return impacts.sort((a, b) => b.totalImpact - a.totalImpact)
  }

  /**
   * Get appeal metrics
   */
  async getAppealMetrics(startDate: string, endDate: string) {
    const results = await db
      .select({
        total: count(),
        pending: sql<number>`SUM(CASE WHEN ${claimAppeals.appealOutcome} = 'pending' THEN 1 ELSE 0 END)`,
        overturned: sql<number>`SUM(CASE WHEN ${claimAppeals.appealOutcome} = 'overturned' THEN 1 ELSE 0 END)`,
        upheld: sql<number>`SUM(CASE WHEN ${claimAppeals.appealOutcome} = 'upheld' THEN 1 ELSE 0 END)`,
      })
      .from(claimAppeals)
      .innerJoin(claims, eq(claimAppeals.claimId, claims.id))
      .where(and(
        eq(claimAppeals.appealFiled, true),
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))

    const r = results[0]
    const decidedAppeals = (r?.overturned || 0) + (r?.upheld || 0)

    return {
      totalAppeals: r?.total || 0,
      pendingAppeals: r?.pending || 0,
      overturnedAppeals: r?.overturned || 0,
      upheldAppeals: r?.upheld || 0,
      overturnRate: decidedAppeals > 0
        ? ((r?.overturned || 0) / decidedAppeals * 100).toFixed(1)
        : '0.0',
    }
  }

  /**
   * Get period metrics summary
   */
  async getPeriodMetrics(startDate: string, endDate: string): Promise<PeriodMetrics> {
    const results = await db
      .select({
        total: count(),
        denied: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
        approved: sql<number>`SUM(CASE WHEN ${claims.status} IN ('approved', 'paid') THEN 1 ELSE 0 END)`,
        appealed: sql<number>`SUM(CASE WHEN ${claims.status} = 'appealed' THEN 1 ELSE 0 END)`,
        billedAmount: sql<number>`SUM(${claims.billedAmount})`,
        deniedAmount: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`,
        paidAmount: sql<number>`SUM(${claims.paidAmount})`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))

    const r = results[0]
    const total = r?.total || 1

    return {
      totalClaims: r?.total || 0,
      deniedCount: r?.denied || 0,
      approvedCount: r?.approved || 0,
      appealedCount: r?.appealed || 0,
      totalBilled: Math.round((r?.billedAmount || 0) * 100) / 100,
      totalDenied: Math.round((r?.deniedAmount || 0) * 100) / 100,
      totalPaid: Math.round((r?.paidAmount || 0) * 100) / 100,
      denialRate: ((r?.denied || 0) / total * 100).toFixed(2),
      recoveryRate: (r?.billedAmount || 0) > 0
        ? (((r?.paidAmount || 0) / (r?.billedAmount || 1)) * 100).toFixed(2)
        : '0.00',
    }
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    period1: { start: string; end: string },
    period2: { start: string; end: string }
  ) {
    const [p1Metrics, p2Metrics] = await Promise.all([
      this.getPeriodMetrics(period1.start, period1.end),
      this.getPeriodMetrics(period2.start, period2.end),
    ])

    const denialRateChange = parseFloat(p2Metrics.denialRate) - parseFloat(p1Metrics.denialRate)
    const deniedAmountChange = p2Metrics.totalDenied - p1Metrics.totalDenied
    const claimCountChange = p2Metrics.totalClaims - p1Metrics.totalClaims

    return {
      period1: {
        dates: period1,
        metrics: p1Metrics,
      },
      period2: {
        dates: period2,
        metrics: p2Metrics,
      },
      changes: {
        denialRateChange: Math.round(denialRateChange * 100) / 100,
        denialRateDirection: denialRateChange < 0 ? 'improving' : denialRateChange > 0 ? 'worsening' : 'stable',
        deniedAmountChange: Math.round(deniedAmountChange * 100) / 100,
        deniedAmountPercent: p1Metrics.totalDenied > 0
          ? Math.round((deniedAmountChange / p1Metrics.totalDenied) * 10000) / 100
          : 0,
        claimCountChange,
        claimCountPercent: p1Metrics.totalClaims > 0
          ? Math.round((claimCountChange / p1Metrics.totalClaims) * 10000) / 100
          : 0,
      },
    }
  }

  /**
   * Get full dashboard KPIs
   */
  async getDashboardKPIs(days: number = 30): Promise<DashboardKPIs> {
    const endDate = new Date().toISOString().split('T')[0]!
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]!

    const [
      summary,
      denialRateTrend,
      revenueImpactTrend,
      denialReasons,
      providerPerformance,
      patternImpact,
      appealMetrics,
    ] = await Promise.all([
      this.getPeriodMetrics(startDate, endDate),
      this.getDenialRateTrend(startDate, endDate, 'day'),
      this.getRevenueImpactTrend(startDate, endDate),
      this.getDenialReasonBreakdown(startDate, endDate),
      this.getProviderPerformance(startDate, endDate),
      this.getPatternImpact(startDate, endDate),
      this.getAppealMetrics(startDate, endDate),
    ])

    return {
      summary,
      denialRateTrend,
      revenueImpactTrend,
      denialReasons,
      topProviderIssues: providerPerformance.slice(0, 10),
      topPatternImpacts: patternImpact.slice(0, 10),
      appealMetrics,
    }
  }

  /**
   * Get claim volume by status over time
   */
  async getClaimVolumeByStatus(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d'
      : groupBy === 'week' ? '%Y-W%W'
      : '%Y-%m'

    const results = await db
      .select({
        date: sql<string>`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`,
        approved: sql<number>`SUM(CASE WHEN ${claims.status} IN ('approved', 'paid') THEN 1 ELSE 0 END)`,
        denied: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${claims.status} = 'pending' THEN 1 ELSE 0 END)`,
        appealed: sql<number>`SUM(CASE WHEN ${claims.status} = 'appealed' THEN 1 ELSE 0 END)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(sql`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`)
      .orderBy(sql`strftime('${sql.raw(dateFormat)}', ${claims.dateOfService})`)

    return results.map(r => ({
      date: r.date,
      approved: r.approved || 0,
      denied: r.denied || 0,
      pending: r.pending || 0,
      appealed: r.appealed || 0,
      total: (r.approved || 0) + (r.denied || 0) + (r.pending || 0) + (r.appealed || 0),
    }))
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let analyticsEngineInstance: AnalyticsEngine | null = null

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngine()
  }
  return analyticsEngineInstance
}
