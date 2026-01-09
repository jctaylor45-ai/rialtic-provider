/**
 * Monitoring Middleware
 *
 * Tracks API response times and errors for performance monitoring.
 * Runs on every request to collect metrics.
 */

import { getPerformanceMonitor } from '~/server/services/performanceMonitor'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const path = event.node.req.url || ''
  const method = event.node.req.method || 'GET'

  // Skip static assets and internal paths
  if (
    path.startsWith('/_nuxt') ||
    path.startsWith('/__nuxt') ||
    path.includes('.') // Static files
  ) {
    return
  }

  // Hook into response to track timing
  const originalEnd = event.node.res.end.bind(event.node.res)

  event.node.res.end = function (
    chunk?: unknown,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void
  ) {
    const duration = Date.now() - startTime
    const statusCode = event.node.res.statusCode

    // Record the response time
    getPerformanceMonitor().recordResponseTime(path, method, duration, statusCode)

    // Call original end with proper typing
    if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding)
    }
    if (encoding !== undefined) {
      return originalEnd(chunk, encoding, callback)
    }
    return originalEnd(chunk)
  }

  // Track errors
  event.node.res.on('error', (error: Error) => {
    getPerformanceMonitor().recordError(error, `${method} ${path}`)
  })
})
