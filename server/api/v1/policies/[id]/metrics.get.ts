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
import { claimLineItems, claimLinePolicies, claims, claimAppeals } from '~/server/database/schema'
import { eq, sql, count, sum, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const policyId = getRouterParam(event, 'id')

    if (!policyId) {
      throw createError({ statusCode: 400, message: 'Policy ID is required' })
    }

    // Get aggregate metrics for claims linked to this policy via claim_line_policies
    const [stats] = await db
      .select({
        totalLines: count(),
        totalBilled: sum(claimLineItems.billedAmount),
        deniedLines: sql<number>`SUM(CASE WHEN ${claimLineItems.status} = 'denied' THEN 1 ELSE 0 END)`,
        deniedAmount: sql<number>`SUM(CASE WHEN ${claimLineItems.status} = 'denied' THEN ${claimLineItems.billedAmount} ELSE 0 END)`,
        paidAmount: sum(claimLineItems.paidAmount),
      })
      .from(claimLinePolicies)
      .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
      .where(eq(claimLinePolicies.policyId, policyId))

    // Get distinct claim count and status breakdown
    const claimStats = await db
      .select({
        totalClaims: sql<number>`COUNT(DISTINCT ${claimLineItems.claimId})`,
        deniedClaims: sql<number>`COUNT(DISTINCT CASE WHEN ${claims.status} IN ('denied', 'appealed') THEN ${claims.id} END)`,
        appealedClaims: sql<number>`COUNT(DISTINCT CASE WHEN ${claims.status} = 'appealed' THEN ${claims.id} END)`,
      })
      .from(claimLinePolicies)
      .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
      .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
      .where(eq(claimLinePolicies.policyId, policyId))

    // Get appeal counts for claims linked to this policy
    const [appealStats] = await db
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
      ))

    const totalLines = stats?.totalLines || 0
    const deniedLines = Number(stats?.deniedLines) || 0
    const totalClaims = Number(claimStats[0]?.totalClaims) || 0
    const deniedClaims = Number(claimStats[0]?.deniedClaims) || 0
    const appealedClaims = Number(claimStats[0]?.appealedClaims) || 0

    return {
      policyId,
      totalClaims,
      totalLines,
      deniedClaims,
      appealedClaims,
      deniedLines,
      totalBilled: Math.round((Number(stats?.totalBilled) || 0) * 100) / 100,
      deniedAmount: Math.round((Number(stats?.deniedAmount) || 0) * 100) / 100,
      paidAmount: Math.round((Number(stats?.paidAmount) || 0) * 100) / 100,
      denialRate: totalClaims > 0 ? Math.round((deniedClaims / totalClaims) * 10000) / 100 : 0,
      appealCount: appealStats?.appealCount || 0,
      overturnedCount: Number(appealStats?.overturnedCount) || 0,
    }
  } catch (error) {
    console.error('Policy metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch policy metrics',
    })
  }
})
