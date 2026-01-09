/**
 * POST /api/admin/sources/:id/test
 *
 * Test connection to a data source without importing
 */

import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { HL7Adapter } from '~/server/services/adapters/hl7Adapter'
import { ERAAdapter } from '~/server/services/adapters/eraAdapter'
import { CSVAdapter } from '~/server/services/adapters/csvAdapter'
import type { DataSourceAdapter, AdapterConfig } from '~/server/services/adapters/baseAdapter'

interface TestRequestBody {
  /** Optional CSV content for testing CSV sources */
  csvContent?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<TestRequestBody>(event)

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

  const startTime = Date.now()

  try {
    // Test connection
    await adapter.connect(adapterConfig)

    // Try to fetch a small sample
    const sampleClaims = await adapter.fetchClaims({ limit: 5 })

    // Get adapter metadata
    const metadata = adapter.getMetadata()

    // Disconnect
    await adapter.disconnect()

    const duration = Date.now() - startTime

    return {
      success: true,
      message: 'Connection successful',
      details: {
        adapterName: metadata.name,
        adapterDescription: metadata.description,
        connected: true,
        sampleSize: sampleClaims.length,
        testDurationMs: duration,
      },
      sample: sampleClaims.slice(0, 2), // Return first 2 as preview
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Try to disconnect
    try {
      await adapter.disconnect()
    } catch {
      // Ignore disconnect errors
    }

    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      details: {
        connected: false,
        error: errorMessage,
        testDurationMs: Date.now() - startTime,
      },
    }
  }
})
