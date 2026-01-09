/**
 * DELETE /api/admin/sources/:id
 *
 * Delete a data source and its import history
 */

import { db } from '~/server/database'
import { dataSources, importHistory } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

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

  // Don't allow deletion if sync is in progress
  if (existing.status === 'syncing') {
    throw createError({
      statusCode: 409,
      message: 'Cannot delete data source while sync is in progress',
    })
  }

  // Delete import history first (cascade should handle this, but explicit is safer)
  await db.delete(importHistory)
    .where(eq(importHistory.dataSourceId, id))

  // Delete the data source
  await db.delete(dataSources)
    .where(eq(dataSources.id, id))

  return {
    success: true,
    message: `Data source "${existing.name}" deleted successfully`,
  }
})
