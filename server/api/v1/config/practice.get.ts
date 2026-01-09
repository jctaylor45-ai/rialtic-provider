/**
 * GET /api/v1/config/practice
 *
 * Get practice-specific computed configuration values
 * This endpoint computes values from actual database data
 */

import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { avg } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Compute average claim value from actual claims data
    const result = await db
      .select({
        avgClaimValue: avg(claims.billedAmount),
      })
      .from(claims)

    const avgClaimValue = result[0]?.avgClaimValue
      ? Math.round(Number(result[0].avgClaimValue))
      : null

    return {
      avgClaimValue,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    // If database query fails, return null values (fallback to defaults)
    return {
      avgClaimValue: null,
      timestamp: new Date().toISOString(),
    }
  }
})
