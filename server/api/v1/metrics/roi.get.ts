/**
 * Practice ROI Metrics API Endpoint
 *
 * GET /api/v1/metrics/roi
 *
 * Returns estimated ROI from learning/practice activities.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { calculateGlobalROI } from '~/server/services/learningMetrics'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const roi = await calculateGlobalROI(days)

    return {
      ...roi,
      period: { days },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('ROI metrics error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to calculate ROI',
    })
  }
})
