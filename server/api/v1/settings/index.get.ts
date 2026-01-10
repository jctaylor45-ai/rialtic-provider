/**
 * GET /api/v1/settings
 * Get all application settings
 */
import { db } from '~/server/database'
import { appSettings } from '~/server/database/schema'

export default defineEventHandler(async () => {
  const settings = await db.select().from(appSettings)

  // Convert to key-value object
  const settingsMap: Record<string, unknown> = {}
  for (const setting of settings) {
    settingsMap[setting.key] = setting.value
  }

  // Add defaults if not set
  if (!settingsMap.dataSource) {
    settingsMap.dataSource = 'local'
  }

  return settingsMap
})
