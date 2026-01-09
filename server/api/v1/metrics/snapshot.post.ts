/**
 * Snapshot Creation API Endpoint
 *
 * POST /api/v1/metrics/snapshot
 *
 * Manually triggers snapshot creation for all patterns.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { createDailySnapshot } from '~/server/services/snapshotEngine'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const snapshotDate = body?.date as string | undefined
    const periodDays = parseInt(body?.periodDays as string) || 7

    const result = await createDailySnapshot(snapshotDate, periodDays)

    return {
      success: true,
      ...result,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Snapshot creation error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to create snapshot',
    })
  }
})
