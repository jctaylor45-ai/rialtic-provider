/**
 * PUT /api/v1/admin/config
 *
 * Update application configuration
 */

import { getAppConfig, updateAppConfig } from '~/config/appConfig'
import type { AppConfig } from '~/config/appConfig'

interface UpdateConfigBody {
  config: Partial<AppConfig>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UpdateConfigBody>(event)

  if (!body.config) {
    throw createError({
      statusCode: 400,
      message: 'Config object is required',
    })
  }

  // Validate the config structure
  const { config } = body

  // Update the configuration
  updateAppConfig(config)

  // Return the updated configuration
  const updatedConfig = getAppConfig()

  return {
    success: true,
    config: updatedConfig,
    timestamp: new Date().toISOString(),
  }
})
