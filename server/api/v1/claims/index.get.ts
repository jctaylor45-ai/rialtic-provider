/**
 * Claims List API Endpoint
 *
 * GET /api/v1/claims
 *
 * Returns paginated claims list in PaAPI-compatible ProcessedClaim format.
 * Supports filtering by specific claim IDs (for pattern-linked claims).
 * Data source is determined by app settings (local DB or PaAPI).
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { eq, desc, and, gte, lte, like, sql, inArray } from 'drizzle-orm'
import { claimListAdapter, type DbClaim } from '~/server/utils/claimAdapter'
import { getDataSourceConfig, fetchFromPaAPI } from '~/server/utils/dataSource'

interface PaapiClaimsResponse {
  data: unknown[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 100, 500)
    const offset = parseInt(query.offset as string) || 0
    const status = query.status as string | undefined
    const startDate = query.startDate as string | undefined
    const endDate = query.endDate as string | undefined
    const providerId = query.providerId as string | undefined
    const search = query.search as string | undefined
    // Support filtering by specific claim IDs (comma-separated)
    const idsParam = query.ids as string | undefined
    const ids = idsParam ? idsParam.split(',').filter(id => id.trim()) : undefined

    // Check data source configuration
    const dataSourceConfig = await getDataSourceConfig()

    // If PaAPI is configured, fetch from remote
    if (dataSourceConfig.source === 'paapi' && dataSourceConfig.paapi) {
      const params: Record<string, string | number | undefined> = {
        limit,
        offset,
        status,
        startDate,
        endDate,
        providerId,
        search,
        ids: ids?.join(','),
      }

      const response = await fetchFromPaAPI<PaapiClaimsResponse>(
        dataSourceConfig.paapi,
        '/api/v1/claims',
        { params }
      )

      return response
    }

    // Local database source
    // Build where conditions
    const whereConditions: ReturnType<typeof eq>[] = []

    // If filtering by specific IDs, add that condition
    if (ids && ids.length > 0) {
      whereConditions.push(inArray(claims.id, ids))
    }

    if (status) {
      whereConditions.push(eq(claims.status, status as 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'))
    }

    if (startDate) {
      whereConditions.push(gte(claims.dateOfService, startDate))
    }

    if (endDate) {
      whereConditions.push(lte(claims.dateOfService, endDate))
    }

    if (providerId) {
      whereConditions.push(eq(claims.providerId, providerId))
    }

    if (search) {
      whereConditions.push(like(claims.patientName, `%${search}%`))
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Query claims
    const claimsList = await db
      .select()
      .from(claims)
      .where(where)
      .orderBy(desc(claims.dateOfService))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(claims)
      .where(where)

    const total = totalResult?.count || 0

    // Transform to PaAPI format
    const processedClaims = claimsList.map(claim =>
      claimListAdapter(claim as unknown as DbClaim)
    )

    return {
      data: processedClaims,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total,
      },
    }
  } catch (error) {
    console.error('Claims endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch claims',
    })
  }
})
