/**
 * Learning Metrics API Endpoint
 *
 * GET /api/v1/metrics/learning
 *
 * Returns learning progress and engagement metrics.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { calculateGlobalLearningStats, calculateEngagementMetrics } from '~/server/services/learningMetrics'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const [stats, engagement] = await Promise.all([
      calculateGlobalLearningStats(),
      calculateEngagementMetrics(days),
    ])

    return {
      stats,
      engagement,
      period: { days },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Learning metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to calculate learning metrics',
    })
  }
})
