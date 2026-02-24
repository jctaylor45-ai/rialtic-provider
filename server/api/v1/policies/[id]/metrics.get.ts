/**
 * Policy Metrics API Endpoint
 *
 * GET /api/v1/policies/:id/metrics
 *
 * Returns aggregate claim data for a specific policy, computed server-side
 * from claim_line_policies joins.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '~/server/database'
import {
  claimLineItems,
  claimLinePolicies,
  claims,
  claimAppeals,
  patternClaimLines,
  patterns,
} from '~/server/database/schema'
import { eq, sql, count, sum, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const policyId = getRouterParam(event, 'id')

    if (!policyId) {
      throw createError({ statusCode: 400, message: 'Policy ID is required' })
    }

    // Run all queries in parallel
    const [statsResult, claimStatsResult, appealStatsResult, patternStatsResult] = await Promise.all([
      // Line-level metrics
      db
        .select({
          totalLines: count(),
          totalBilled: sum(claimLineItems.billedAmount),
          deniedAmount: sql<number>`COALESCE(SUM(${claimLinePolicies.deniedAmount}), 0)`,
          paidAmount: sum(claimLineItems.paidAmount),
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .where(eq(claimLinePolicies.policyId, policyId)),

      // Claim-level metrics + providers
      db
        .select({
          deniedClaims: sql<number>`COUNT(DISTINCT ${claims.id})`,
          appealedClaims: sql<number>`COUNT(DISTINCT CASE WHEN ${claims.status} = 'appealed' THEN ${claims.id} END)`,
          providersImpacted: sql<number>`COUNT(DISTINCT ${claims.providerId})`,
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
        .where(eq(claimLinePolicies.policyId, policyId)),

      // Appeal metrics
      db
        .select({
          appealCount: count(),
          overturnedCount: sql<number>`SUM(CASE WHEN ${claimAppeals.appealOutcome} = 'overturned' THEN 1 ELSE 0 END)`,
        })
        .from(claimAppeals)
        .innerJoin(claims, eq(claimAppeals.claimId, claims.id))
        .innerJoin(claimLineItems, eq(claimLineItems.claimId, claims.id))
        .innerJoin(claimLinePolicies, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .where(and(
          eq(claimLinePolicies.policyId, policyId),
          eq(claimAppeals.appealFiled, true)
        )),

      // Linked patterns → distinct (patternId, denialRate) triples via claim chain
      db
        .selectDistinct({
          patternId: patternClaimLines.patternId,
          currentDenialRate: patterns.currentDenialRate,
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .innerJoin(patternClaimLines, eq(claimLineItems.id, patternClaimLines.lineItemId))
        .innerJoin(patterns, eq(patternClaimLines.patternId, patterns.id))
        .where(eq(claimLinePolicies.policyId, policyId)),
    ])

    const stats = statsResult[0]
    const claimStats = claimStatsResult[0]
    const appealStats = appealStatsResult[0]

    // Aggregate pattern stats from distinct triples
    const patternIds = new Set<string>()
    let totalDenialRate = 0
    for (const row of patternStatsResult) {
      if (!patternIds.has(row.patternId)) {
        patternIds.add(row.patternId)
        totalDenialRate += row.currentDenialRate || 0
      }
    }
    const patternCount = patternIds.size
    const avgDenialRate = patternCount > 0 ? totalDenialRate / patternCount : 0

    const totalLines = stats?.totalLines || 0
    const deniedClaims = Number(claimStats?.deniedClaims) || 0
    const appealedClaims = Number(claimStats?.appealedClaims) || 0
    const providersImpacted = Number(claimStats?.providersImpacted) || 0
    const appealCount = appealStats?.appealCount || 0
    const overturnedCount = Number(appealStats?.overturnedCount) || 0

    // Real denial rate from linked patterns (decimal → whole number %)
    const denialRate = Math.round(avgDenialRate * 10000) / 100

    // Estimate total claims evaluated using pattern denial rate
    const estimatedTotalClaims = avgDenialRate > 0
      ? Math.round(deniedClaims / avgDenialRate)
      : deniedClaims

    // Appeal rate: appeals filed / denied claims
    const appealRate = deniedClaims > 0
      ? Math.round((appealCount / deniedClaims) * 10000) / 100
      : 0

    // Overturn rate: overturned / appeals filed
    const overturnRate = appealCount > 0
      ? Math.round((overturnedCount / appealCount) * 10000) / 100
      : 0

    return {
      policyId,
      totalClaims: estimatedTotalClaims,
      totalLines,
      deniedClaims,
      appealedClaims,
      deniedLines: totalLines,
      totalBilled: Math.round((Number(stats?.totalBilled) || 0) * 100) / 100,
      deniedAmount: Math.round((Number(stats?.deniedAmount) || 0) * 100) / 100,
      paidAmount: Math.round((Number(stats?.paidAmount) || 0) * 100) / 100,
      denialRate,
      appealCount,
      overturnedCount,
      appealRate,
      overturnRate,
      providersImpacted,
      insightCount: patternCount,
    }
  } catch (error) {
    console.error('Policy metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch policy metrics',
    })
  }
})
