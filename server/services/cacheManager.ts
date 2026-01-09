/**
 * Cache Manager Service
 *
 * In-memory cache with TTL support for API response caching.
 * For production: replace with Redis for distributed caching.
 */

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  hitRate: string
  avgTTL: number
}

// =============================================================================
// CACHE MANAGER CLASS
// =============================================================================

export class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  }
  private defaultTTL = 300 // 5 minutes

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  set<T>(key: string, value: T, ttlSeconds: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    })
    this.stats.sets++

    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup()
    }
  }

  /**
   * Get with automatic fetch and cache
   * If cached value exists and is valid, return it
   * Otherwise, fetch new value, cache it, and return
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = this.defaultTTL
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache
    const value = await fetcher()
    this.set(key, value, ttlSeconds)
    return value
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key)
    if (existed) {
      this.stats.deletes++
    }
    return existed
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size
      this.cache.clear()
      this.stats.deletes += size
      return size
    }

    let deleted = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        deleted++
      }
    }
    this.stats.deletes += deleted
    return deleted
  }

  /**
   * Invalidate entries matching a prefix
   */
  invalidatePrefix(prefix: string): number {
    let deleted = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        deleted++
      }
    }
    this.stats.deletes += deleted
    return deleted
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses

    // Calculate average TTL of current entries
    let totalTTL = 0
    const now = Date.now()
    for (const entry of this.cache.values()) {
      totalTTL += (entry.expiresAt - entry.createdAt) / 1000
    }
    const avgTTL = this.cache.size > 0 ? Math.round(totalTTL / this.cache.size) : 0

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : 'N/A',
      avgTTL,
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    }
  }

  /**
   * Get all keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get entry info (for debugging)
   */
  getEntryInfo(key: string): { exists: boolean; ttlRemaining?: number; createdAt?: string } | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return { exists: false }
    }

    const now = Date.now()
    return {
      exists: true,
      ttlRemaining: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
      createdAt: new Date(entry.createdAt).toISOString(),
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let cacheInstance: CacheManager | null = null

export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager()
  }
  return cacheInstance
}

// Legacy export for backwards compatibility
export const cache = getCache()

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

/**
 * Build standardized cache keys for different data types
 */
export const cacheKeys = {
  claims: (filters: Record<string, unknown>) => {
    const parts = ['claims']
    if (filters.status) parts.push(`status:${filters.status}`)
    if (filters.providerId) parts.push(`provider:${filters.providerId}`)
    if (filters.limit) parts.push(`limit:${filters.limit}`)
    if (filters.offset) parts.push(`offset:${filters.offset}`)
    return parts.join(':')
  },

  claimDetail: (id: string) => `claim:${id}`,

  patterns: (filters: Record<string, unknown>) => {
    const parts = ['patterns']
    if (filters.status) parts.push(`status:${filters.status}`)
    if (filters.category) parts.push(`cat:${filters.category}`)
    return parts.join(':')
  },

  patternDetail: (id: string) => `pattern:${id}`,

  dashboard: (days: number) => `dashboard:${days}d`,

  analytics: (metric: string, days: number) => `analytics:${metric}:${days}d`,

  providers: (filters: Record<string, unknown>) => {
    const parts = ['providers']
    if (filters.limit) parts.push(`limit:${filters.limit}`)
    return parts.join(':')
  },

  policies: (filters: Record<string, unknown>) => {
    const parts = ['policies']
    if (filters.mode) parts.push(`mode:${filters.mode}`)
    return parts.join(':')
  },
}

// =============================================================================
// CACHE TTL CONSTANTS
// =============================================================================

export const cacheTTL = {
  /** Short-lived data (1 minute) */
  short: 60,
  /** Medium-lived data (5 minutes) */
  medium: 300,
  /** Long-lived data (15 minutes) */
  long: 900,
  /** Very long-lived data (1 hour) */
  veryLong: 3600,
  /** Static data (24 hours) */
  static: 86400,
}
