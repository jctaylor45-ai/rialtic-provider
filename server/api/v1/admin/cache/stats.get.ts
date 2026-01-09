/**
 * GET /api/v1/admin/cache/stats
 *
 * Get cache statistics
 */

import { getCache } from '~/server/services/cacheManager'

export default defineEventHandler(async () => {
  const cache = getCache()

  return {
    stats: cache.getStats(),
    keys: cache.getKeys().slice(0, 50), // Show first 50 keys
    timestamp: new Date().toISOString(),
  }
})
