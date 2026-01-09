/**
 * Providers List API Endpoint
 *
 * GET /api/v1/providers
 *
 * Returns paginated providers list with claim statistics.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { providers, claims } from '~/server/database/schema'
import { eq, desc, like, sql, count, sum, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const offset = parseInt(query.offset as string) || 0
    const specialty = query.specialty as string | undefined
    const search = query.search as string | undefined

    // Build where conditions
    const whereConditions: ReturnType<typeof eq>[] = []

    if (specialty) {
      whereConditions.push(eq(providers.specialty, specialty))
    }

    if (search) {
      whereConditions.push(like(providers.name, `%${search}%`))
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Query providers
    const providersList = await db
      .select({
        id: providers.id,
        name: providers.name,
        specialty: providers.specialty,
        npi: providers.npi,
        tin: providers.tin,
        taxonomy: providers.taxonomy,
        createdAt: providers.createdAt,
      })
      .from(providers)
      .where(where)
      .orderBy(providers.name)
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providers)
      .where(where)

    const total = totalResult?.count || 0

    // Calculate statistics for each provider
    const providersWithStats = await Promise.all(
      providersList.map(async (provider) => {
        // Get claim statistics
        const [statsResult] = await db
          .select({
            totalClaims: count(),
            totalBilled: sum(claims.billedAmount),
            totalPaid: sum(claims.paidAmount),
          })
          .from(claims)
          .where(eq(claims.providerId, provider.id))

        // Get denial count
        const [denialResult] = await db
          .select({ count: count() })
          .from(claims)
          .where(and(
            eq(claims.providerId, provider.id),
            eq(claims.status, 'denied')
          ))

        const totalClaims = statsResult?.totalClaims || 0
        const deniedClaims = denialResult?.count || 0
        const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0

        return {
          ...provider,
          statistics: {
            totalClaims,
            totalBilled: Number(statsResult?.totalBilled) || 0,
            totalPaid: Number(statsResult?.totalPaid) || 0,
            deniedClaims,
            denialRate: Math.round(denialRate * 100) / 100,
          },
        }
      })
    )

    return {
      data: providersWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total,
      },
    }
  } catch (error) {
    console.error('Providers endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch providers',
    })
  }
})
