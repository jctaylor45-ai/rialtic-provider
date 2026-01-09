/**
 * POST /api/admin/sources/:id/import
 *
 * Trigger an import from a data source
 */

import { db } from '~/server/database'
import { dataSources, importHistory } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { HL7Adapter } from '~/server/services/adapters/hl7Adapter'
import { ERAAdapter } from '~/server/services/adapters/eraAdapter'
import { CSVAdapter } from '~/server/services/adapters/csvAdapter'
import { IngestionPipeline, type IngestionConfig } from '~/server/services/ingestionPipeline'
import type { DataSourceAdapter, AdapterConfig } from '~/server/services/adapters/baseAdapter'

interface ImportRequestBody {
  /** Override default import configuration */
  config?: IngestionConfig
  /** CSV content for CSV sources (optional - can use file path from source config) */
  csvContent?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<ImportRequestBody>(event)

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

  // Check if already syncing
  if (source.status === 'syncing') {
    throw createError({
      statusCode: 409,
      message: 'Import already in progress for this data source',
    })
  }

  // Create adapter based on source type
  let adapter: DataSourceAdapter
  switch (source.sourceType) {
    case 'hl7':
      adapter = new HL7Adapter()
      break
    case 'era':
      adapter = new ERAAdapter()
      break
    case 'csv':
      adapter = new CSVAdapter()
      break
    default:
      throw createError({
        statusCode: 400,
        message: `Unsupported source type: ${source.sourceType}`,
      })
  }

  // Build adapter config
  const adapterConfig: AdapterConfig = {
    ...(source.config || {}),
  }

  // For CSV, add content if provided
  if (source.sourceType === 'csv' && body?.csvContent) {
    adapterConfig.csvContent = body.csvContent
  }

  // Create import history record
  const startedAt = new Date().toISOString()
  const historyResult = await db.insert(importHistory).values({
    dataSourceId: id,
    startedAt,
    status: 'running',
    recordsFetched: 0,
    recordsValidated: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsErrored: 0,
  }).returning()

  const importRecord = historyResult[0]

  // Update source status
  await db.update(dataSources)
    .set({ status: 'syncing', updatedAt: startedAt })
    .where(eq(dataSources.id, id))

  try {
    // Connect adapter
    await adapter.connect(adapterConfig)

    // Create and run pipeline
    const pipeline = new IngestionPipeline(adapter, {
      skipInvalid: true,
      upsert: true,
      ...body?.config,
    })

    const result = await pipeline.run()

    // Update import history
    await db.update(importHistory)
      .set({
        completedAt: result.endTime,
        status: result.success ? 'completed' : 'failed',
        recordsFetched: result.stats.fetched,
        recordsValidated: result.stats.validated,
        recordsInserted: result.stats.inserted,
        recordsUpdated: result.stats.updated,
        recordsSkipped: result.stats.skipped,
        recordsErrored: result.stats.validationErrors + result.errors.length,
        durationMs: result.durationMs,
        errorMessage: result.errors.length > 0 ? `${result.errors.length} errors occurred` : null,
        errorDetails: result.errors.length > 0 ? result.errors : null,
      })
      .where(eq(importHistory.id, importRecord!.id))

    // Update source statistics
    await db.update(dataSources)
      .set({
        status: result.success ? 'active' : 'error',
        lastSyncAt: result.endTime,
        lastSyncStatus: result.success ? 'success' : 'error',
        lastSyncError: result.success ? null : result.errors[0]?.errors.join(', '),
        totalImported: (source.totalImported || 0) + result.stats.inserted,
        lastImportCount: result.stats.inserted + result.stats.updated,
        updatedAt: result.endTime,
      })
      .where(eq(dataSources.id, id))

    // Disconnect adapter
    await adapter.disconnect()

    return {
      success: result.success,
      importId: importRecord!.id,
      stats: result.stats,
      duration: result.durationMs,
      errors: result.errors.slice(0, 10), // Limit errors in response
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const completedAt = new Date().toISOString()

    // Update import history with error
    await db.update(importHistory)
      .set({
        completedAt,
        status: 'failed',
        durationMs: Date.now() - new Date(startedAt).getTime(),
        errorMessage,
      })
      .where(eq(importHistory.id, importRecord!.id))

    // Update source status
    await db.update(dataSources)
      .set({
        status: 'error',
        lastSyncAt: completedAt,
        lastSyncStatus: 'error',
        lastSyncError: errorMessage,
        updatedAt: completedAt,
      })
      .where(eq(dataSources.id, id))

    // Try to disconnect adapter
    try {
      await adapter.disconnect()
    } catch {
      // Ignore disconnect errors
    }

    throw createError({
      statusCode: 500,
      message: `Import failed: ${errorMessage}`,
    })
  }
})
