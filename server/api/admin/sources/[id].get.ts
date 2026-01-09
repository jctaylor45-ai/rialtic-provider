/**
 * GET /api/admin/sources/:id
 *
 * Get a specific data source with its import history
 */

import { db } from '~/server/database'
import { dataSources, importHistory } from '~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Data source ID is required',
    })
  }

  // Get data source
  const [source] = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, id))
    .limit(1)

  if (!source) {
    throw createError({
      statusCode: 404,
      message: 'Data source not found',
    })
  }

  // Get recent import history
  const history = await db
    .select()
    .from(importHistory)
    .where(eq(importHistory.dataSourceId, id))
    .orderBy(desc(importHistory.startedAt))
    .limit(10)

  // Calculate statistics
  const completedImports = history.filter(h => h.status === 'completed')
  const totalRecordsImported = completedImports.reduce(
    (sum, h) => sum + (h.recordsInserted || 0) + (h.recordsUpdated || 0),
    0
  )
  const avgDuration = completedImports.length > 0
    ? completedImports.reduce((sum, h) => sum + (h.durationMs || 0), 0) / completedImports.length
    : 0

  return {
    source: {
      ...source,
      // Mask sensitive config data
      config: source.config ? {
        ...source.config,
        apiKey: source.config.apiKey ? '***' : undefined,
        password: source.config.password ? '***' : undefined,
      } : null,
    },
    history,
    statistics: {
      totalImports: history.length,
      successfulImports: completedImports.length,
      failedImports: history.filter(h => h.status === 'failed').length,
      totalRecordsImported,
      averageDurationMs: Math.round(avgDuration),
    },
  }
})
