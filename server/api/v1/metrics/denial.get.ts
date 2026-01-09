/**
 * Denial Metrics API Endpoint
 *
 * GET /api/v1/metrics/denial
 *
 * Returns computed denial metrics from database.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { calculateDenialMetrics, calculateDenialTrend } from '~/server/services/patternDetection'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30
    const includeTrend = query.includeTrend === 'true'

    const metrics = await calculateDenialMetrics(days)

    let trend = null
    if (includeTrend) {
      trend = await calculateDenialTrend(4, 7) // 4 weeks of trend data
    }

    return {
      metrics,
      trend,
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Denial metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to calculate denial metrics',
    })
  }
})
