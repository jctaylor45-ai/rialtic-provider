/**
 * GET /api/admin/sources/:id/history
 *
 * Get import history for a data source
 */

import { db } from '~/server/database'
import { dataSources, importHistory } from '~/server/database/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)

  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0
  const status = query.status as string | undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Data source ID is required',
    })
  }

  // Check if source exists
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

  // Build conditions
  const conditions = [eq(importHistory.dataSourceId, id)]

  if (status) {
    conditions.push(eq(importHistory.status, status as 'running' | 'completed' | 'failed' | 'cancelled'))
  }

  if (from) {
    conditions.push(gte(importHistory.startedAt, from))
  }

  if (to) {
    conditions.push(lte(importHistory.startedAt, to))
  }

  // Get import history
  const history = await db
    .select()
    .from(importHistory)
    .where(and(...conditions))
    .orderBy(desc(importHistory.startedAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const allHistory = await db
    .select()
    .from(importHistory)
    .where(and(...conditions))

  const total = allHistory.length

  // Calculate summary statistics
  const completed = history.filter(h => h.status === 'completed')
  const failed = history.filter(h => h.status === 'failed')

  const summary = {
    totalImports: total,
    successRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    totalRecordsImported: completed.reduce(
      (sum, h) => sum + (h.recordsInserted || 0) + (h.recordsUpdated || 0),
      0
    ),
    averageDuration: completed.length > 0
      ? Math.round(completed.reduce((sum, h) => sum + (h.durationMs || 0), 0) / completed.length)
      : 0,
    recentErrors: failed.slice(0, 3).map(f => ({
      date: f.startedAt,
      error: f.errorMessage,
    })),
  }

  return {
    source: {
      id: source.id,
      name: source.name,
      sourceType: source.sourceType,
    },
    history,
    summary,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  }
})
