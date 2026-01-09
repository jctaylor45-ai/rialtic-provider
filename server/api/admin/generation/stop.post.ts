/**
 * Stop Generation API Endpoint
 *
 * POST /api/admin/generation/stop
 *
 * Stops continuous mock data generation.
 */

import { defineEventHandler, createError } from 'h3'
import { stopGeneration } from '../../../services/generationManager'

export default defineEventHandler(async () => {
  try {
    const result = stopGeneration()

    if (!result.success) {
      throw createError({
        statusCode: 409,
        message: result.message,
      })
    }

    return {
      success: true,
      message: result.message,
      stats: result.stats,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Stop generation error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to stop generation',
    })
  }
})
