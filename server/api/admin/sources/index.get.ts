/**
 * GET /api/admin/sources
 *
 * List all configured data sources
 */

import { db } from '~/server/database'
import { dataSources, importHistory } from '~/server/database/schema'
import { eq, desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined

  // Build query with optional status filter
  const sources = status
    ? await db.select().from(dataSources)
        .where(eq(dataSources.status, status as 'active' | 'inactive' | 'error' | 'syncing'))
        .orderBy(desc(dataSources.createdAt))
    : await db.select().from(dataSources)
        .orderBy(desc(dataSources.createdAt))

  // Get last import for each source
  const sourcesWithHistory = await Promise.all(
    sources.map(async (source) => {
      const [lastImport] = await db
        .select()
        .from(importHistory)
        .where(eq(importHistory.dataSourceId, source.id))
        .orderBy(desc(importHistory.startedAt))
        .limit(1)

      return {
        ...source,
        lastImport: lastImport || null,
      }
    })
  )

  return {
    sources: sourcesWithHistory,
    total: sources.length,
  }
})
