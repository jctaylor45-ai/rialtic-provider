/**
 * Run Single Batch API Endpoint
 *
 * POST /api/admin/generation/batch
 *
 * Runs a single batch of mock data generation (for testing).
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { runSingleBatch, type GenerationConfig } from '../../../services/generationManager'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}

    // Build config with defaults
    const config: GenerationConfig = {
      claimsPerDay: body.claimsPerDay || 100,
      scenarioId: body.scenarioId || undefined,
      speed: 1, // Speed doesn't matter for single batch
      patterns: body.patterns || [],
      generateAppeals: body.generateAppeals !== false,
      generateEvents: body.generateEvents !== false,
      appealRate: body.appealRate || 0.40,
      eventsPerDay: body.eventsPerDay || 20,
    }

    // Run single batch
    const result = await runSingleBatch(config)

    return {
      success: result.success,
      message: 'Batch completed',
      stats: result.stats,
    }
  } catch (error) {
    console.error('Run batch error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to run batch',
    })
  }
})
