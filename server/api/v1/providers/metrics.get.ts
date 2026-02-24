/**
 * Provider Metrics API Endpoint
 *
 * GET /api/v1/providers/metrics
 *
 * Returns per-provider aggregate metrics for a given time period.
 * Accepts `days` parameter for time filtering (default 90).
 * Includes `includePrevious=true` for baseline comparison.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, claimAppeals, providers } from '~/server/database/schema'
import { eq, sql, count, sum, and, gte, lte, inArray } from 'drizzle-orm'

interface ProviderMetrics {
  id: string
  name: string
  specialty: string | null
  npi: string | null
  totalClaims: number
  deniedClaims: number
  appealedClaims: number
  denialRate: number
  deniedDollars: number
  totalBilled: number
  appealsFiled: number
  appealsOverturned: number
  appealRate: number
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 90
    const includePrevious = query.includePrevious === 'true' || query.includePrevious === '1'
    const scenarioId = query.scenario_id as string | undefined

    const now = new Date()
    const endDateStr = now.toISOString().split('T')[0] as string
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0] as string

    async function getProviderMetrics(periodStart: string, periodEnd: string): Promise<ProviderMetrics[]> {
      // Get providers (filtered by scenario when applicable)
      const providersQuery = db
        .select({
          id: providers.id,
          name: providers.name,
          specialty: providers.specialty,
          npi: providers.npi,
        })
        .from(providers)
        .orderBy(providers.name)
        .$dynamic()

      if (scenarioId) {
        providersQuery.where(eq(providers.scenarioId, scenarioId))
      }

      const providersList = await providersQuery

      // Build claim date conditions with optional scenario filter
      const claimConditions = [
        gte(claims.dateOfService, periodStart),
        lte(claims.dateOfService, periodEnd),
      ]
      if (scenarioId) {
        claimConditions.push(eq(claims.scenarioId, scenarioId))
      }

      // Get per-provider claim aggregates in a single query
      const claimStats = await db
        .select({
          providerId: claims.providerId,
          totalClaims: count(),
          deniedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN 1 ELSE 0 END)`,
          appealedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'appealed' THEN 1 ELSE 0 END)`,
          totalBilled: sum(claims.billedAmount),
          deniedDollars: sql<number>`SUM(CASE WHEN ${claims.status} = 'denied' THEN ${claims.billedAmount} ELSE 0 END)`,
        })
        .from(claims)
        .where(and(...claimConditions))
        .groupBy(claims.providerId)

      // Build appeal conditions with optional scenario filter
      const appealConditions = [
        eq(claimAppeals.appealFiled, true),
        gte(claimAppeals.appealDate, periodStart),
        lte(claimAppeals.appealDate, periodEnd),
      ]
      if (scenarioId) {
        appealConditions.push(eq(claims.scenarioId, scenarioId))
      }

      // Get per-provider appeal counts
      const appealStats = await db
        .select({
          providerId: claims.providerId,
          appealsFiled: count(),
          appealsOverturned: sql<number>`SUM(CASE WHEN ${claimAppeals.appealOutcome} = 'overturned' THEN 1 ELSE 0 END)`,
        })
        .from(claimAppeals)
        .innerJoin(claims, eq(claimAppeals.claimId, claims.id))
        .where(and(...appealConditions))
        .groupBy(claims.providerId)

      const claimStatsMap = new Map(claimStats.map(s => [s.providerId, s]))
      const appealStatsMap = new Map(appealStats.map(s => [s.providerId, s]))

      return providersList.map(provider => {
        const cs = claimStatsMap.get(provider.id)
        const as_ = appealStatsMap.get(provider.id)

        const totalClaims = cs?.totalClaims || 0
        const deniedClaims = Number(cs?.deniedClaims) || 0
        const appealedClaims = Number(cs?.appealedClaims) || 0
        const everDenied = deniedClaims + appealedClaims
        const deniedDollars = Number(cs?.deniedDollars) || 0
        const totalBilled = Number(cs?.totalBilled) || 0
        const appealsFiled = as_?.appealsFiled || 0
        const appealsOverturned = Number(as_?.appealsOverturned) || 0

        return {
          id: provider.id,
          name: provider.name,
          specialty: provider.specialty,
          npi: provider.npi,
          totalClaims,
          deniedClaims,
          appealedClaims,
          denialRate: totalClaims > 0 ? Math.round((deniedClaims / totalClaims) * 10000) / 100 : 0,
          deniedDollars: Math.round(deniedDollars * 100) / 100,
          totalBilled: Math.round(totalBilled * 100) / 100,
          appealsFiled,
          appealsOverturned,
          appealRate: everDenied > 0 ? Math.round((appealsFiled / everDenied) * 10000) / 100 : 0,
        }
      }).filter(p => p.totalClaims > 0)
    }

    const current = await getProviderMetrics(startDateStr, endDateStr)

    if (!includePrevious) {
      return { data: current }
    }

    // Previous period
    const prevStart = new Date(startDate)
    prevStart.setDate(prevStart.getDate() - days)
    const prevStartStr = prevStart.toISOString().split('T')[0] as string

    const previous = await getProviderMetrics(prevStartStr, startDateStr)

    return {
      data: current,
      previousPeriod: previous,
    }
  } catch (error) {
    console.error('Provider metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch provider metrics',
    })
  }
})
