/**
 * POST /api/admin/sources
 *
 * Create a new data source configuration
 */

import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'
import { nanoid } from 'nanoid'

interface CreateDataSourceBody {
  name: string
  description?: string
  sourceType: 'hl7' | 'era' | 'csv' | 'api' | 'sftp'
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
  const body = await readBody<CreateDataSourceBody>(event)

  // Validate required fields
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Name is required',
    })
  }

  if (!body.sourceType) {
    throw createError({
      statusCode: 400,
      message: 'Source type is required',
    })
  }

  const validTypes = ['hl7', 'era', 'csv', 'api', 'sftp']
  if (!validTypes.includes(body.sourceType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid source type. Must be one of: ${validTypes.join(', ')}`,
    })
  }

  const id = `src-${nanoid(10)}`
  const now = new Date().toISOString()

  const newSource = {
    id,
    name: body.name,
    description: body.description || null,
    sourceType: body.sourceType,
    status: 'inactive' as const,
    config: body.config || null,
    syncEnabled: body.syncEnabled ?? false,
    syncSchedule: body.syncSchedule || null,
    totalImported: 0,
    lastImportCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(dataSources).values(newSource)

  return {
    success: true,
    source: newSource,
  }
})
