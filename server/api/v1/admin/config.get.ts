/**
 * GET /api/v1/admin/config
 *
 * Get current application configuration
 */

import { getAppConfig } from '~/config/appConfig'

export default defineEventHandler(async () => {
  const config = getAppConfig()

  return {
    config,
    timestamp: new Date().toISOString(),
  }
})
