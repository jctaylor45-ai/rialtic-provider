/**
 * Claims List API Endpoint
 *
 * GET /api/v1/claims
 *
 * Returns paginated claims list with optional filtering.
 * Supports filtering by specific claim IDs (for pattern-linked claims).
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { claims, claimLineItems, claimDiagnosisCodes } from '~/server/database/schema'
import { eq, desc, and, gte, lte, like, sql, inArray } from 'drizzle-orm'

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
      .select({
        id: claims.id,
        providerId: claims.providerId,
        providerName: claims.providerName,
        claimType: claims.claimType,
        patientName: claims.patientName,
        patientDob: claims.patientDob,
        patientSex: claims.patientSex,
        memberId: claims.memberId,
        dateOfService: claims.dateOfService,
        billedAmount: claims.billedAmount,
        paidAmount: claims.paidAmount,
        status: claims.status,
        denialReason: claims.denialReason,
        submissionDate: claims.submissionDate,
        processingDate: claims.processingDate,
        createdAt: claims.createdAt,
      })
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

    return {
      data: claimsList,
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
