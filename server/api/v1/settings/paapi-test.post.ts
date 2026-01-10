/**
 * POST /api/v1/settings/paapi-test
 * Test PaAPI connection
 */
import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { paapiConfig } from '~/server/database/schema'

interface PaapiConfigRow {
  id: number
  name: string
  baseUrl: string
  authType: string | null
  apiKey: string | null
  username: string | null
  password: string | null
  isActive: boolean | null
  lastTestedAt: string | null
  lastTestStatus: string | null
  lastTestError: string | null
  createdAt: string | null
  updatedAt: string | null
}

export default defineEventHandler(async () => {
  // Get active config
  const configs = await db.select().from(paapiConfig) as PaapiConfigRow[]
  const config = configs.find((c: PaapiConfigRow) => c.isActive) || configs[0]

  if (!config) {
    throw createError({
      statusCode: 400,
      message: 'PaAPI is not configured',
    })
  }

  // Build headers based on auth type
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.authType === 'api_key' && config.apiKey) {
    headers['X-API-Key'] = config.apiKey
  } else if (config.authType === 'bearer' && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  } else if (config.authType === 'basic' && config.username && config.password) {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  try {
    // Test connection by fetching a simple endpoint
    const testUrl = `${config.baseUrl.replace(/\/$/, '')}/health`
    const response = await $fetch(testUrl, {
      method: 'GET',
      headers,
      timeout: 10000,
    })

    // Update test status
    await db.update(paapiConfig)
      .set({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'success',
        lastTestError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paapiConfig.id, config.id))

    return {
      success: true,
      message: 'Connection successful',
      response,
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'

    // Update test status
    await db.update(paapiConfig)
      .set({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'failed',
        lastTestError: errorMessage,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paapiConfig.id, config.id))

    throw createError({
      statusCode: 502,
      message: `Connection failed: ${errorMessage}`,
    })
  }
})
