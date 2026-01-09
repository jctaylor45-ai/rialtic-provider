/**
 * PUT /api/admin/sources/:id
 *
 * Update a data source configuration
 */

import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

interface UpdateDataSourceBody {
  name?: string
  description?: string
  sourceType?: 'hl7' | 'era' | 'csv' | 'api' | 'sftp'
  status?: 'active' | 'inactive' | 'error' | 'syncing'
  config?: {
    endpoint?: string
    apiKey?: string
    username?: string
    password?: string
    filePath?: string
    columnMapping?: Record<string, string>
    [key: string]: unknown
  }
  syncEnabled?: boolean
  syncSchedule?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateDataSourceBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Data source ID is required',
    })
  }

  // Check if source exists
  const [existing] = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Data source not found',
    })
  }

  // Validate source type if provided
  if (body.sourceType) {
    const validTypes = ['hl7', 'era', 'csv', 'api', 'sftp']
    if (!validTypes.includes(body.sourceType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid source type. Must be one of: ${validTypes.join(', ')}`,
      })
    }
  }

  // Merge config if provided
  const mergedConfig = body.config
    ? { ...existing.config, ...body.config }
    : existing.config

  // Build update object
  const updates: Partial<typeof dataSources.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  }

  if (body.name !== undefined) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.sourceType !== undefined) updates.sourceType = body.sourceType
  if (body.status !== undefined) updates.status = body.status
  if (body.config !== undefined) updates.config = mergedConfig
  if (body.syncEnabled !== undefined) updates.syncEnabled = body.syncEnabled
  if (body.syncSchedule !== undefined) updates.syncSchedule = body.syncSchedule

  await db.update(dataSources)
    .set(updates)
    .where(eq(dataSources.id, id))

  // Fetch updated source
  const [updated] = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, id))
    .limit(1)

  return {
    success: true,
    source: updated,
  }
})
