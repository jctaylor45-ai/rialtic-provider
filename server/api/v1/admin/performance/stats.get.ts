/**
 * GET /api/v1/admin/performance/stats
 *
 * Get performance statistics
 */

import { getPerformanceMonitor } from '~/server/services/performanceMonitor'

export default defineEventHandler(async () => {
  const monitor = getPerformanceMonitor()

  return {
    stats: monitor.getStats(),
    slowQueries: monitor.getSlowQueries(10),
    slowRequests: monitor.getSlowRequests(10),
    errorSummary: monitor.getErrorSummary(),
    timestamp: new Date().toISOString(),
  }
})
