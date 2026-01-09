/**
 * GET /api/v1/admin/health
 *
 * Comprehensive health check endpoint for monitoring systems
 */

import { getHealthMonitor } from '~/server/services/healthMonitor'

export default defineEventHandler(async () => {
  const healthMonitor = getHealthMonitor()
  const health = await healthMonitor.getHealth()

  // Set appropriate status code based on health
  // Note: We return the data regardless, but monitoring systems
  // can use the status field to determine if the app is healthy

  return health
})
