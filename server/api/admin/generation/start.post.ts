/**
 * Start Generation API Endpoint
 *
 * POST /api/admin/generation/start
 *
 * Starts continuous mock data generation.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { startGeneration, type GenerationConfig } from '../../../services/generationManager'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body || typeof body.claimsPerDay !== 'number') {
      throw createError({
        statusCode: 400,
        message: 'claimsPerDay is required and must be a number',
      })
    }

    // Build config with defaults
    const config: GenerationConfig = {
      claimsPerDay: body.claimsPerDay,
      scenarioId: body.scenarioId || undefined,
      speed: body.speed || 1,
      patterns: body.patterns || [],
      generateAppeals: body.generateAppeals !== false,
      generateEvents: body.generateEvents !== false,
      appealRate: body.appealRate || 0.40,
      eventsPerDay: body.eventsPerDay || 20,
    }

    // Validate config
    if (config.claimsPerDay < 10 || config.claimsPerDay > 10000) {
      throw createError({
        statusCode: 400,
        message: 'claimsPerDay must be between 10 and 10000',
      })
    }

    if (config.speed < 1 || config.speed > 1000) {
      throw createError({
        statusCode: 400,
        message: 'speed must be between 1 and 1000',
      })
    }

    // Start generation
    const result = startGeneration(config)

    if (!result.success) {
      throw createError({
        statusCode: 409,
        message: result.message,
      })
    }

    return {
      success: true,
      message: result.message,
      config: {
        claimsPerDay: config.claimsPerDay,
        speed: config.speed,
        patterns: config.patterns.length,
        generateAppeals: config.generateAppeals,
        generateEvents: config.generateEvents,
      },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Start generation error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to start generation',
    })
  }
})
