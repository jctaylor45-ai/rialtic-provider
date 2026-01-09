/**
 * Generation Status API Endpoint
 *
 * GET /api/admin/generation/status
 *
 * Returns the current status of mock data generation.
 */

import { defineEventHandler, createError } from 'h3'
import { getGenerationStatus } from '../../../services/generationManager'
import { db } from '../../../database'
import { claims, claimAppeals, learningEvents } from '../../../database/schema'
import { count } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const status = getGenerationStatus()

    // Get database counts
    const [claimCount] = await db.select({ count: count() }).from(claims)
    const [appealCount] = await db.select({ count: count() }).from(claimAppeals)
    const [eventCount] = await db.select({ count: count() }).from(learningEvents)

    return {
      ...status,
      database: {
        totalClaims: claimCount?.count || 0,
        totalAppeals: appealCount?.count || 0,
        totalEvents: eventCount?.count || 0,
      },
    }
  } catch (error) {
    console.error('Get status error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to get generation status',
    })
  }
})
