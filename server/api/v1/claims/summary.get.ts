/**
 * Claims Summary API Endpoint
 *
 * GET /api/v1/claims/summary
 *
 * Returns aggregate statistics for claims.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, claimAppeals } from '~/server/database/schema'
import { eq, sql, count, sum, and, gte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] as string

    // Build where condition for date range
    const dateFilter = gte(claims.dateOfService, startDateStr)

    // Total claims
    const [totalResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(dateFilter)

    // Status breakdown
    const [approvedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(dateFilter, eq(claims.status, 'approved')))

    const [deniedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(dateFilter, eq(claims.status, 'denied')))

    const [pendingResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(dateFilter, eq(claims.status, 'pending')))

    const [appealedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(dateFilter, eq(claims.status, 'appealed')))

    // Financial metrics
    const [billedResult] = await db
      .select({ total: sum(claims.billedAmount) })
      .from(claims)
      .where(dateFilter)

    const [paidResult] = await db
      .select({ total: sum(claims.paidAmount) })
      .from(claims)
      .where(dateFilter)

    const [deniedAmountResult] = await db
      .select({ total: sum(claims.billedAmount) })
      .from(claims)
      .where(and(dateFilter, eq(claims.status, 'denied')))

    // Appeal metrics
    const [appealsTotalResult] = await db
      .select({ count: count() })
      .from(claimAppeals)
      .where(eq(claimAppeals.appealFiled, true))

    const [appealsOverturnedResult] = await db
      .select({ count: count() })
      .from(claimAppeals)
      .where(eq(claimAppeals.appealOutcome, 'overturned'))

    // Calculate derived metrics
    const totalClaims = totalResult?.count || 0
    const deniedClaims = deniedResult?.count || 0
    const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

    const totalAppeals = appealsTotalResult?.count || 0
    const appealsOverturned = appealsOverturnedResult?.count || 0
    const appealSuccessRate = totalAppeals > 0 ? (appealsOverturned / totalAppeals) * 100 : 0

    const billedAmount = Number(billedResult?.total) || 0
    const paidAmount = Number(paidResult?.total) || 0
    const deniedAmount = Number(deniedAmountResult?.total) || 0

    return {
      totalClaims,
      statusBreakdown: {
        approved: approvedResult?.count || 0,
        denied: deniedClaims,
        pending: pendingResult?.count || 0,
        appealed: appealedResult?.count || 0,
      },
      denialRate: Math.round(denialRate * 100) / 100,
      financial: {
        billedAmount: Math.round(billedAmount * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        deniedAmount: Math.round(deniedAmount * 100) / 100,
        collectionRate: billedAmount > 0 ? Math.round((paidAmount / billedAmount) * 10000) / 100 : 0,
      },
      appeals: {
        total: totalAppeals,
        overturned: appealsOverturned,
        successRate: Math.round(appealSuccessRate * 100) / 100,
      },
      period: {
        days,
        startDate: startDateStr,
        endDate: new Date().toISOString().split('T')[0],
      },
    }
  } catch (error) {
    console.error('Claims summary error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch claims summary',
    })
  }
})
