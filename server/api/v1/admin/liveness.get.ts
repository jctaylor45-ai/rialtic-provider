/**
 * GET /api/v1/admin/liveness
 *
 * Kubernetes liveness probe endpoint
 * Returns 200 if the process is running
 */

import { getHealthMonitor } from '~/server/services/healthMonitor'

export default defineEventHandler(async () => {
  const healthMonitor = getHealthMonitor()
  return healthMonitor.getLiveness()
})
