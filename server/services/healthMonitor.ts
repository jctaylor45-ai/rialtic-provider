/**
 * Health Monitor Service
 *
 * Monitors application health and provides status for health check endpoints.
 * Tracks database connectivity, memory usage, and service dependencies.
 */

import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { count } from 'drizzle-orm'
import { getCache } from './cacheManager'
import { getPerformanceMonitor } from './performanceMonitor'

// =============================================================================
// TYPES
// =============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthCheckResult {
  status: HealthStatus
  checks: {
    database: {
      status: HealthStatus
      responseTimeMs?: number
      error?: string
    }
    cache: {
      status: HealthStatus
      hitRate: string
      size: number
    }
    memory: {
      status: HealthStatus
      usedMB: number
      totalMB: number
      percentUsed: number
    }
    performance: {
      status: HealthStatus
      avgResponseTimeMs: number
      errorRate: number
    }
  }
  metrics: {
    uptime: string
    requestsTracked: number
    errorCount: number
    cacheHitRate: string
  }
  timestamp: string
}

// =============================================================================
// HEALTH MONITOR CLASS
// =============================================================================

export class HealthMonitor {
  private degradedResponseTimeThreshold = 500 // ms
  private unhealthyResponseTimeThreshold = 2000 // ms
  private degradedMemoryThreshold = 80 // percent
  private unhealthyMemoryThreshold = 95 // percent
  private degradedErrorRateThreshold = 5 // percent
  private unhealthyErrorRateThreshold = 20 // percent

  /**
   * Perform all health checks
   */
  async getHealth(): Promise<HealthCheckResult> {
    const [dbCheck, cacheCheck, memoryCheck, performanceCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory(),
      this.checkPerformance(),
    ])

    // Determine overall status
    const checks = [dbCheck.status, cacheCheck.status, memoryCheck.status, performanceCheck.status]
    let overallStatus: HealthStatus = 'healthy'

    if (checks.includes('unhealthy')) {
      overallStatus = 'unhealthy'
    } else if (checks.includes('degraded')) {
      overallStatus = 'degraded'
    }

    // Get metrics
    const perfStats = getPerformanceMonitor().getStats()
    const cacheStats = getCache().getStats()

    return {
      status: overallStatus,
      checks: {
        database: dbCheck,
        cache: cacheCheck,
        memory: memoryCheck,
        performance: performanceCheck,
      },
      metrics: {
        uptime: perfStats.uptime.uptimeFormatted,
        requestsTracked: perfStats.api.total,
        errorCount: perfStats.errors.total,
        cacheHitRate: cacheStats.hitRate,
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{
    status: HealthStatus
    responseTimeMs?: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // Simple query to test database connection
      await db.select({ count: count() }).from(claims).limit(1)

      const responseTimeMs = Date.now() - startTime

      let status: HealthStatus = 'healthy'
      if (responseTimeMs > this.unhealthyResponseTimeThreshold) {
        status = 'unhealthy'
      } else if (responseTimeMs > this.degradedResponseTimeThreshold) {
        status = 'degraded'
      }

      return { status, responseTimeMs }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check cache health
   */
  private checkCache(): {
    status: HealthStatus
    hitRate: string
    size: number
  } {
    const cacheStats = getCache().getStats()

    // Parse hit rate
    const hitRateNum = parseFloat(cacheStats.hitRate) || 0

    let status: HealthStatus = 'healthy'
    // If cache is being used but hit rate is low, mark as degraded
    if (cacheStats.hits + cacheStats.misses > 100) {
      if (hitRateNum < 50) {
        status = 'degraded'
      }
    }

    return {
      status,
      hitRate: cacheStats.hitRate,
      size: cacheStats.size,
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): {
    status: HealthStatus
    usedMB: number
    totalMB: number
    percentUsed: number
  } {
    const memUsage = process.memoryUsage()
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const percentUsed = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

    let status: HealthStatus = 'healthy'
    if (percentUsed > this.unhealthyMemoryThreshold) {
      status = 'unhealthy'
    } else if (percentUsed > this.degradedMemoryThreshold) {
      status = 'degraded'
    }

    return { status, usedMB, totalMB, percentUsed }
  }

  /**
   * Check performance metrics
   */
  private checkPerformance(): {
    status: HealthStatus
    avgResponseTimeMs: number
    errorRate: number
  } {
    const perfStats = getPerformanceMonitor().getStats()

    const avgResponseTimeMs = perfStats.api.avgResponseTime
    const errorRate = perfStats.api.total > 0
      ? (perfStats.errors.total / perfStats.api.total) * 100
      : 0

    let status: HealthStatus = 'healthy'

    if (avgResponseTimeMs > this.unhealthyResponseTimeThreshold || errorRate > this.unhealthyErrorRateThreshold) {
      status = 'unhealthy'
    } else if (avgResponseTimeMs > this.degradedResponseTimeThreshold || errorRate > this.degradedErrorRateThreshold) {
      status = 'degraded'
    }

    return {
      status,
      avgResponseTimeMs,
      errorRate: Math.round(errorRate * 100) / 100,
    }
  }

  /**
   * Get a simple liveness check (for kubernetes probes)
   */
  async getLiveness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      // Just check if the process is running
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      }
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Get a readiness check (for kubernetes probes)
   */
  async getReadiness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      // Check if database is accessible
      await db.select({ count: count() }).from(claims).limit(1)
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      }
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let healthMonitorInstance: HealthMonitor | null = null

export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor()
  }
  return healthMonitorInstance
}

export const healthMonitor = getHealthMonitor()
