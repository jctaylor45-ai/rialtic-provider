/**
 * Claims Summary API Endpoint
 *
 * GET /api/v1/claims/summary
 *
 * Returns aggregate statistics for claims.
 * Data source is determined by app settings (local DB or PaAPI).
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, claimAppeals } from '~/server/database/schema'
import { eq, sql, count, sum, and, gte, inArray } from 'drizzle-orm'
import {
  getDataSourceConfig,
  fetchClaimsSummaryFromPaAPI,
  validateClaimsSummaryResponse,
  createPaapiError,
} from '~/server/utils/dataSource'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    // Default to 365 days to capture more sample data in demos
    const days = parseInt(query.days as string) || 365

    // Check data source configuration
    const dataSourceConfig = await getDataSourceConfig()

    // If PaAPI is configured, fetch from remote
    if (dataSourceConfig.source === 'paapi' && dataSourceConfig.paapi) {
      try {
        const response = await fetchClaimsSummaryFromPaAPI(dataSourceConfig.paapi, { days })

        // Validate response structure
        if (!validateClaimsSummaryResponse(response)) {
          console.warn('Invalid claims summary response from PaAPI, falling back to local')
        } else {
          return response
        }
      } catch (error) {
        console.error('PaAPI claims summary failed, falling back to local:', error)
        // Fall through to local database
      }
    }

    // Local database source

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

    // Status breakdown (count both 'approved' and 'paid' together)
    const [approvedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(dateFilter, inArray(claims.status, ['approved', 'paid'])))

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
