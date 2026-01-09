/**
 * GET /api/v1/admin/readiness
 *
 * Kubernetes readiness probe endpoint
 * Returns 200 if the app is ready to receive traffic
 */

import { getHealthMonitor } from '~/server/services/healthMonitor'

export default defineEventHandler(async (event) => {
  const healthMonitor = getHealthMonitor()
  const result = await healthMonitor.getReadiness()

  if (result.status === 'error') {
    throw createError({
      statusCode: 503,
      message: 'Service not ready',
    })
  }

  return result
})
