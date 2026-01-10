/**
 * GET /api/v1/settings/paapi
 * Get PaAPI configuration
 */
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
  const configs = await db.select().from(paapiConfig) as PaapiConfigRow[]

  // Return active config or first config, with sensitive fields masked
  const activeConfig = configs.find((c: PaapiConfigRow) => c.isActive) || configs[0]

  if (!activeConfig) {
    return {
      configured: false,
      config: null,
    }
  }

  return {
    configured: true,
    config: {
      id: activeConfig.id,
      name: activeConfig.name,
      baseUrl: activeConfig.baseUrl,
      authType: activeConfig.authType,
      // Mask sensitive fields
      hasApiKey: !!activeConfig.apiKey,
      hasCredentials: !!(activeConfig.username && activeConfig.password),
      isActive: activeConfig.isActive,
      lastTestedAt: activeConfig.lastTestedAt,
      lastTestStatus: activeConfig.lastTestStatus,
      lastTestError: activeConfig.lastTestError,
      createdAt: activeConfig.createdAt,
      updatedAt: activeConfig.updatedAt,
    },
  }
})
