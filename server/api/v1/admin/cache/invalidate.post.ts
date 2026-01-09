/**
 * POST /api/v1/admin/cache/invalidate
 *
 * Invalidate cache entries
 */

import { getCache } from '~/server/services/cacheManager'

interface InvalidateBody {
  pattern?: string
  prefix?: string
  all?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<InvalidateBody>(event)
  const cache = getCache()

  let deleted = 0

  if (body.all) {
    deleted = cache.invalidate()
  } else if (body.prefix) {
    deleted = cache.invalidatePrefix(body.prefix)
  } else if (body.pattern) {
    deleted = cache.invalidate(body.pattern)
  } else {
    throw createError({
      statusCode: 400,
      message: 'Must provide pattern, prefix, or all=true',
    })
  }

  return {
    success: true,
    deleted,
    timestamp: new Date().toISOString(),
  }
})
