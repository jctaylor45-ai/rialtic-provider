/**
 * Trend Metrics API Endpoint
 *
 * GET /api/v1/metrics/trends
 *
 * Returns trend analysis for patterns over time.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { getAllPatternTrends, getPatternTrend, getPatternHistory } from '~/server/services/snapshotEngine'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30
    const patternId = query.patternId as string | undefined
    const includeHistory = query.history === 'true'

    // If specific pattern requested
    if (patternId) {
      const trend = await getPatternTrend(patternId, days)
      let history = null

      if (includeHistory) {
        history = await getPatternHistory(patternId, days)
      }

      if (!trend) {
        return {
          trend: null,
          history,
          message: 'Insufficient snapshot data for trend analysis',
          period: { days },
        }
      }

      return {
        trend,
        history,
        period: { days },
        generatedAt: new Date().toISOString(),
      }
    }

    // Otherwise return all pattern trends
    const allTrends = await getAllPatternTrends(days)

    return {
      ...allTrends,
      period: { days },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Trends metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to calculate trends',
    })
  }
})
