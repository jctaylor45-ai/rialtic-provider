/**
 * Claims Summary API Endpoint
 *
 * GET /api/v1/claims/summary
 *
 * Returns aggregate statistics for claims.
 * Supports `includePrevious=true` to also return the prior period for trend comparison.
 * Data source is determined by app settings (local DB or PaAPI).
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, claimAppeals } from '~/server/database/schema'
import { eq, sql, count, sum, and, gte, lte, inArray } from 'drizzle-orm'
import {
  getDataSourceConfig,
  fetchClaimsSummaryFromPaAPI,
  validateClaimsSummaryResponse,
  createPaapiError,
} from '~/server/utils/dataSource'

interface PeriodSummary {
  totalClaims: number
  statusBreakdown: {
    approved: number
    denied: number
    pending: number
    appealed: number
  }
  denialRate: number
  financial: {
    billedAmount: number
    paidAmount: number
    deniedAmount: number
    collectionRate: number
  }
  appeals: {
    total: number
    overturned: number
    successRate: number
  }
  period: {
    days: number
    startDate: string
    endDate: string
  }
}

/**
 * Compute aggregate claim metrics for a date range.
 */
async function computePeriodSummary(startDateStr: string, endDateStr: string, days: number): Promise<PeriodSummary> {
  const dateFilter = and(
    gte(claims.dateOfService, startDateStr),
    lte(claims.dateOfService, endDateStr)
  )!

  // Run all queries in parallel
  const [
    totalResult,
    approvedResult,
    deniedResult,
    pendingResult,
    appealedResult,
    billedResult,
    paidResult,
    deniedAmountResult,
    appealsTotalResult,
    appealsOverturnedResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(claims).where(dateFilter),
    db.select({ count: count() }).from(claims).where(and(dateFilter, inArray(claims.status, ['approved', 'paid']))),
    db.select({ count: count() }).from(claims).where(and(dateFilter, eq(claims.status, 'denied'))),
    db.select({ count: count() }).from(claims).where(and(dateFilter, eq(claims.status, 'pending'))),
    db.select({ count: count() }).from(claims).where(and(dateFilter, eq(claims.status, 'appealed'))),
    db.select({ total: sum(claims.billedAmount) }).from(claims).where(dateFilter),
    db.select({ total: sum(claims.paidAmount) }).from(claims).where(dateFilter),
    db.select({ total: sum(claims.billedAmount) }).from(claims).where(and(dateFilter, eq(claims.status, 'denied'))),
    db.select({ count: count() }).from(claimAppeals).where(eq(claimAppeals.appealFiled, true)),
    db.select({ count: count() }).from(claimAppeals).where(eq(claimAppeals.appealOutcome, 'overturned')),
  ])

  const totalClaims = totalResult[0]?.count || 0
  const deniedClaims = deniedResult[0]?.count || 0
  const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

  const totalAppeals = appealsTotalResult[0]?.count || 0
  const appealsOverturned = appealsOverturnedResult[0]?.count || 0
  const appealSuccessRate = totalAppeals > 0 ? (appealsOverturned / totalAppeals) * 100 : 0

  const billedAmount = Number(billedResult[0]?.total) || 0
  const paidAmount = Number(paidResult[0]?.total) || 0
  const deniedAmount = Number(deniedAmountResult[0]?.total) || 0

  return {
    totalClaims,
    statusBreakdown: {
      approved: approvedResult[0]?.count || 0,
      denied: deniedClaims,
      pending: pendingResult[0]?.count || 0,
      appealed: appealedResult[0]?.count || 0,
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
      endDate: endDateStr,
    },
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    // Default to 365 days to capture more sample data in demos
    const days = parseInt(query.days as string) || 365
    const includePrevious = query.includePrevious === 'true' || query.includePrevious === '1'

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

    // Current period: [today - days, today]
    const now = new Date()
    const endDateStr = now.toISOString().split('T')[0] as string
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] as string

    // Find the actual max date of service in the database to include future-dated claims
    const [maxDateResult] = await db
      .select({ maxDate: sql<string>`MAX(date_of_service)` })
      .from(claims)

    // Use the later of today or max claim date as the effective end date
    const maxClaimDate = maxDateResult?.maxDate || endDateStr
    const effectiveEndDate = maxClaimDate > endDateStr ? maxClaimDate : endDateStr

    const currentSummary = await computePeriodSummary(startDateStr, effectiveEndDate, days)

    if (!includePrevious) {
      return currentSummary
    }

    // Previous period: [startDate - days, startDate]
    const prevStart = new Date(startDate)
    prevStart.setDate(prevStart.getDate() - days)
    const prevStartStr = prevStart.toISOString().split('T')[0] as string
    // Previous period ends where current period starts
    const prevEndStr = startDateStr

    const previousSummary = await computePeriodSummary(prevStartStr, prevEndStr, days)

    return {
      ...currentSummary,
      previousPeriod: previousSummary,
    }
  } catch (error) {
    console.error('Claims summary error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch claims summary',
    })
  }
})
