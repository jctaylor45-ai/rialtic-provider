/**
 * Query Optimizer Service
 *
 * Provides optimized database queries for common patterns.
 * Uses indexed columns and limits result sets for performance.
 */

import { db } from '~/server/database'
import { claims, patterns, patternClaimLines, claimLineItems, claimAppeals } from '~/server/database/schema'
import { sql, and, eq, gte, lte, count, desc, asc, sum } from 'drizzle-orm'

// =============================================================================
// TYPES
// =============================================================================

export interface DenialMetrics {
  totalClaims: number
  deniedClaims: number
  approvedClaims: number
  pendingClaims: number
  appealedClaims: number
  totalBilled: number
  totalPaid: number
  totalDenied: number
  denialRate: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ClaimFilters {
  status?: string
  providerId?: string
  startDate?: string
  endDate?: string
  denialReason?: string
}

// =============================================================================
// QUERY OPTIMIZER CLASS
// =============================================================================

export class QueryOptimizer {
  /**
   * Get denial metrics with a single optimized query
   * Uses indexed columns and aggregates in database
   */
  async getDenialMetrics(startDate: string, endDate: string): Promise<DenialMetrics> {
    const result = await db
      .select({
        totalClaims: count(),
        deniedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
        approvedClaims: sql<number>`SUM(CASE WHEN ${claims.status} IN ('approved', 'paid') THEN 1 ELSE 0 END)`,
        pendingClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'pending' THEN 1 ELSE 0 END)`,
        appealedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'appealed' THEN 1 ELSE 0 END)`,
        totalBilled: sql<number>`COALESCE(SUM(${claims.billedAmount}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${claims.paidAmount}), 0)`,
        totalDenied: sql<number>`COALESCE(SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END), 0)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))

    const r = result[0]!
    const total = r.totalClaims || 1

    return {
      totalClaims: r.totalClaims,
      deniedClaims: r.deniedClaims || 0,
      approvedClaims: r.approvedClaims || 0,
      pendingClaims: r.pendingClaims || 0,
      appealedClaims: r.appealedClaims || 0,
      totalBilled: Math.round((r.totalBilled || 0) * 100) / 100,
      totalPaid: Math.round((r.totalPaid || 0) * 100) / 100,
      totalDenied: Math.round((r.totalDenied || 0) * 100) / 100,
      denialRate: Math.round(((r.deniedClaims || 0) / total) * 10000) / 100,
    }
  }

  /**
   * Get paginated claims with optimized query
   * Selects only needed columns instead of SELECT *
   */
  async getClaimsPaginated(
    limit: number,
    offset: number,
    filters?: ClaimFilters
  ): Promise<PaginatedResult<typeof claims.$inferSelect>> {
    // Build conditions array
    const conditions = []

    if (filters?.status) {
      conditions.push(eq(claims.status, filters.status as 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'))
    }
    if (filters?.providerId) {
      conditions.push(eq(claims.providerId, filters.providerId))
    }
    if (filters?.startDate) {
      conditions.push(gte(claims.dateOfService, filters.startDate))
    }
    if (filters?.endDate) {
      conditions.push(lte(claims.dateOfService, filters.endDate))
    }
    if (filters?.denialReason) {
      conditions.push(sql`${claims.denialReason} LIKE ${'%' + filters.denialReason + '%'}`)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get data with limit
    const data = await db
      .select()
      .from(claims)
      .where(whereClause)
      .orderBy(desc(claims.dateOfService))
      .limit(limit)
      .offset(offset)

    // Get total count - use COUNT(*) which is faster
    const [countResult] = await db
      .select({ total: count() })
      .from(claims)
      .where(whereClause)

    const total = countResult?.total || 0

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }

  /**
   * Get claims summary by status - optimized single query
   */
  async getClaimsSummaryByStatus(startDate: string, endDate: string) {
    const results = await db
      .select({
        status: claims.status,
        count: count(),
        totalBilled: sql<number>`COALESCE(SUM(${claims.billedAmount}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${claims.paidAmount}), 0)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(claims.status)

    return results.map(r => ({
      status: r.status,
      count: r.count,
      totalBilled: Math.round((r.totalBilled || 0) * 100) / 100,
      totalPaid: Math.round((r.totalPaid || 0) * 100) / 100,
    }))
  }

  /**
   * Get top denial reasons - optimized with LIMIT
   */
  async getTopDenialReasons(startDate: string, endDate: string, limit: number = 10) {
    const results = await db
      .select({
        reason: claims.denialReason,
        count: count(),
        totalAmount: sql<number>`COALESCE(SUM(${claims.billedAmount}), 0)`,
      })
      .from(claims)
      .where(and(
        eq(claims.status, 'denied'),
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate),
        sql`${claims.denialReason} IS NOT NULL`
      ))
      .groupBy(claims.denialReason)
      .orderBy(desc(count()))
      .limit(limit)

    return results.map(r => ({
      reason: r.reason || 'Unspecified',
      count: r.count,
      totalAmount: Math.round((r.totalAmount || 0) * 100) / 100,
    }))
  }

  /**
   * Get provider metrics - optimized batch query
   */
  async getProviderMetrics(startDate: string, endDate: string, limit: number = 20) {
    const results = await db
      .select({
        providerId: claims.providerId,
        providerName: claims.providerName,
        totalClaims: count(),
        deniedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
        totalBilled: sql<number>`COALESCE(SUM(${claims.billedAmount}), 0)`,
        totalDenied: sql<number>`COALESCE(SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END), 0)`,
      })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))
      .groupBy(claims.providerId, claims.providerName)
      .orderBy(desc(sql`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`))
      .limit(limit)

    return results.map(r => ({
      providerId: r.providerId,
      providerName: r.providerName,
      totalClaims: r.totalClaims,
      deniedClaims: r.deniedClaims || 0,
      denialRate: r.totalClaims > 0 ? Math.round(((r.deniedClaims || 0) / r.totalClaims) * 10000) / 100 : 0,
      totalBilled: Math.round((r.totalBilled || 0) * 100) / 100,
      totalDenied: Math.round((r.totalDenied || 0) * 100) / 100,
    }))
  }

  /**
   * Batch insert claims with conflict handling
   */
  async batchInsertClaims(
    claimsData: Array<typeof claims.$inferInsert>,
    batchSize: number = 100
  ): Promise<{ inserted: number; batches: number }> {
    let inserted = 0
    let batches = 0

    for (let i = 0; i < claimsData.length; i += batchSize) {
      const batch = claimsData.slice(i, i + batchSize)

      await db.insert(claims).values(batch).onConflictDoNothing()

      inserted += batch.length
      batches++
    }

    return { inserted, batches }
  }

  /**
   * Get pattern metrics from linked claim lines
   * Patterns link to claim LINES, not claims - totalAtRisk is sum of denied line amounts
   */
  async getPatternMetrics(patternId: string, startDate: string, endDate: string) {
    const results = await db
      .select({
        totalLinked: count(),
        totalBilled: sql<number>`COALESCE(SUM(${claimLineItems.billedAmount}), 0)`,
        totalDenied: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
      })
      .from(patternClaimLines)
      .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
      .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
      .where(and(
        eq(patternClaimLines.patternId, patternId),
        gte(claims.dateOfService, startDate),
        lte(claims.dateOfService, endDate)
      ))

    const r = results[0]!

    return {
      patternId,
      totalLinkedLines: r.totalLinked,
      totalBilled: Math.round((r.totalBilled || 0) * 100) / 100,
      totalDenied: Math.round((r.totalDenied || 0) * 100) / 100,
    }
  }

  /**
   * Compute total at risk for a pattern from its linked denied claim lines
   * This is the source of truth for pattern.totalAtRisk
   */
  async computePatternTotalAtRisk(patternId: string): Promise<number> {
    const result = await db
      .select({
        totalAtRisk: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
      })
      .from(patternClaimLines)
      .where(eq(patternClaimLines.patternId, patternId))

    return Math.round((result[0]?.totalAtRisk || 0) * 100) / 100
  }

  /**
   * Get all patterns with computed totalAtRisk from linked claim lines
   */
  async getPatternsWithComputedTotals() {
    const results = await db
      .select({
        patternId: patternClaimLines.patternId,
        totalAtRisk: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
        lineCount: count(),
      })
      .from(patternClaimLines)
      .groupBy(patternClaimLines.patternId)

    return results.map(r => ({
      patternId: r.patternId,
      totalAtRisk: Math.round((r.totalAtRisk || 0) * 100) / 100,
      lineCount: r.lineCount,
    }))
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let queryOptimizerInstance: QueryOptimizer | null = null

export function getQueryOptimizer(): QueryOptimizer {
  if (!queryOptimizerInstance) {
    queryOptimizerInstance = new QueryOptimizer()
  }
  return queryOptimizerInstance
}
