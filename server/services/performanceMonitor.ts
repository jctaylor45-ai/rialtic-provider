/**
 * Performance Monitor Service
 *
 * Tracks query performance, API response times, and identifies slow operations.
 * For production: integrate with monitoring services like DataDog, New Relic, etc.
 */

// =============================================================================
// TYPES
// =============================================================================

interface QueryLog {
  name: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

interface ResponseTimeLog {
  path: string
  method: string
  duration: number
  statusCode: number
  timestamp: number
}

interface ErrorLog {
  message: string
  stack?: string
  context?: string
  timestamp: number
}

interface PerformanceStats {
  queries: {
    total: number
    slow: number
    avgDuration: number
    maxDuration: number
    p95Duration: number
  }
  api: {
    total: number
    avgResponseTime: number
    maxResponseTime: number
    p95ResponseTime: number
    slowRequests: number
  }
  errors: {
    total: number
    recent: ErrorLog[]
  }
  uptime: {
    startTime: string
    uptimeSeconds: number
    uptimeFormatted: string
  }
}

// =============================================================================
// PERFORMANCE MONITOR CLASS
// =============================================================================

export class PerformanceMonitor {
  private slowQueryThreshold = 1000 // 1 second
  private slowResponseThreshold = 500 // 500ms
  private maxLogSize = 1000 // Keep last 1000 entries

  private queryLogs: QueryLog[] = []
  private responseLogs: ResponseTimeLog[] = []
  private errorLogs: ErrorLog[] = []
  private startTime = Date.now()

  /**
   * Track a database query execution
   */
  async trackQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await queryFn()
      const duration = Date.now() - startTime

      this.logQuery(name, duration, true)

      if (duration > this.slowQueryThreshold) {
        console.warn(`[SLOW QUERY] ${name}: ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      this.logQuery(name, duration, false, errorMessage)
      console.error(`[QUERY ERROR] ${name}: ${errorMessage}`)

      throw error
    }
  }

  /**
   * Log a query execution
   */
  private logQuery(name: string, duration: number, success: boolean, error?: string): void {
    this.queryLogs.push({
      name,
      duration,
      timestamp: Date.now(),
      success,
      error,
    })

    // Trim logs if too large
    if (this.queryLogs.length > this.maxLogSize) {
      this.queryLogs = this.queryLogs.slice(-this.maxLogSize)
    }
  }

  /**
   * Record API response time
   */
  recordResponseTime(path: string, method: string, duration: number, statusCode: number): void {
    this.responseLogs.push({
      path,
      method,
      duration,
      statusCode,
      timestamp: Date.now(),
    })

    // Trim logs if too large
    if (this.responseLogs.length > this.maxLogSize) {
      this.responseLogs = this.responseLogs.slice(-this.maxLogSize)
    }

    // Log slow requests
    if (duration > this.slowResponseThreshold) {
      console.warn(`[SLOW REQUEST] ${method} ${path}: ${duration}ms`)
    }
  }

  /**
   * Record an error
   */
  recordError(error: Error | unknown, context?: string): void {
    const errorLog: ErrorLog = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now(),
    }

    this.errorLogs.push(errorLog)

    // Trim logs if too large
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogSize)
    }

    console.error(`[ERROR] ${context || 'Unknown'}: ${errorLog.message}`)
  }

  /**
   * Calculate percentile from array of numbers
   */
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)] || 0
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    // Query stats
    const queryDurations = this.queryLogs.map(q => q.duration)
    const slowQueries = this.queryLogs.filter(q => q.duration > this.slowQueryThreshold)

    // API stats
    const responseTimes = this.responseLogs.map(r => r.duration)
    const slowRequests = this.responseLogs.filter(r => r.duration > this.slowResponseThreshold)

    // Uptime
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60

    return {
      queries: {
        total: this.queryLogs.length,
        slow: slowQueries.length,
        avgDuration: queryDurations.length > 0
          ? Math.round(queryDurations.reduce((a, b) => a + b, 0) / queryDurations.length)
          : 0,
        maxDuration: queryDurations.length > 0 ? Math.max(...queryDurations) : 0,
        p95Duration: this.percentile(queryDurations, 95),
      },
      api: {
        total: this.responseLogs.length,
        avgResponseTime: responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0,
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        p95ResponseTime: this.percentile(responseTimes, 95),
        slowRequests: slowRequests.length,
      },
      errors: {
        total: this.errorLogs.length,
        recent: this.errorLogs.slice(-5).reverse(),
      },
      uptime: {
        startTime: new Date(this.startTime).toISOString(),
        uptimeSeconds,
        uptimeFormatted: `${hours}h ${minutes}m ${seconds}s`,
      },
    }
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit: number = 10): QueryLog[] {
    return this.queryLogs
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get slow requests
   */
  getSlowRequests(limit: number = 10): ResponseTimeLog[] {
    return this.responseLogs
      .filter(r => r.duration > this.slowResponseThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get error summary
   */
  getErrorSummary(): { message: string; count: number; lastOccurred: string }[] {
    const errorCounts = new Map<string, { count: number; lastOccurred: number }>()

    for (const error of this.errorLogs) {
      const existing = errorCounts.get(error.message)
      if (existing) {
        existing.count++
        existing.lastOccurred = Math.max(existing.lastOccurred, error.timestamp)
      } else {
        errorCounts.set(error.message, { count: 1, lastOccurred: error.timestamp })
      }
    }

    return Array.from(errorCounts.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: new Date(data.lastOccurred).toISOString(),
      }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.queryLogs = []
    this.responseLogs = []
    this.errorLogs = []
  }

  /**
   * Set thresholds
   */
  setThresholds(queryMs?: number, responseMs?: number): void {
    if (queryMs !== undefined) this.slowQueryThreshold = queryMs
    if (responseMs !== undefined) this.slowResponseThreshold = responseMs
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let performanceMonitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor()
  }
  return performanceMonitorInstance
}

// Legacy export
export const performanceMonitor = getPerformanceMonitor()
