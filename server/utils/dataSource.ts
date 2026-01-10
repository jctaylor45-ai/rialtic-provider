/**
 * Data Source Service
 *
 * Provides a unified interface for fetching data from either:
 * - Local database (with PaAPI format adapters)
 * - Remote PaAPI backend
 *
 * The data source is determined by the 'dataSource' setting.
 *
 * Performance optimizations:
 * - Config caching (30s TTL) to avoid DB queries on every request
 * - Circuit breaker pattern for fast failure when PaAPI is down
 * - Retry with exponential backoff for transient failures
 * - Response caching for GET requests
 */

import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { appSettings, paapiConfig } from '~/server/database/schema'
import { cache, cacheTTL } from '~/server/services/cacheManager'

export type DataSourceType = 'local' | 'paapi'

export interface DataSourceConfig {
  source: DataSourceType
  paapi?: {
    baseUrl: string
    headers: Record<string, string>
  }
}

interface PaapiConfigRow {
  id: number
  name: string
  baseUrl: string
  authType: string | null
  apiKey: string | null
  username: string | null
  password: string | null
  isActive: boolean | null
  lastTestedAt: string | null
  lastTestStatus: string | null
  lastTestError: string | null
  createdAt: string | null
  updatedAt: string | null
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
}

const CIRCUIT_BREAKER_THRESHOLD = 5 // failures before opening
const CIRCUIT_BREAKER_RESET_MS = 30000 // 30 seconds before retry

function checkCircuitBreaker(): void {
  if (!circuitBreaker.isOpen) return

  // Check if we should attempt to close the circuit
  if (Date.now() - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreaker.isOpen = false
    circuitBreaker.failures = 0
    console.log('PaAPI circuit breaker: half-open, attempting request')
  } else {
    throw createError({
      statusCode: 503,
      message: 'PaAPI service temporarily unavailable (circuit breaker open)',
    })
  }
}

function recordSuccess(): void {
  circuitBreaker.failures = 0
  circuitBreaker.isOpen = false
}

function recordFailure(): void {
  circuitBreaker.failures++
  circuitBreaker.lastFailure = Date.now()

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true
    console.warn(`PaAPI circuit breaker opened after ${circuitBreaker.failures} failures`)
  }
}

// =============================================================================
// CONFIG CACHING
// =============================================================================

const CONFIG_CACHE_KEY = 'datasource:config'
const CONFIG_CACHE_TTL = 30 // 30 seconds

/**
 * Get the current data source configuration (cached)
 */
export async function getDataSourceConfig(): Promise<DataSourceConfig> {
  // Check cache first
  const cached = cache.get<DataSourceConfig>(CONFIG_CACHE_KEY)
  if (cached) {
    return cached
  }

  // Fetch from database
  const config = await fetchDataSourceConfigFromDb()

  // Cache the result
  cache.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL)

  return config
}

/**
 * Invalidate the config cache (call when settings change)
 */
export function invalidateConfigCache(): void {
  cache.delete(CONFIG_CACHE_KEY)
}

async function fetchDataSourceConfigFromDb(): Promise<DataSourceConfig> {
  // Get data source setting
  const settings = await db.select().from(appSettings).where(eq(appSettings.key, 'dataSource'))
  const dataSourceSetting = settings[0]?.value as DataSourceType | undefined

  const source = dataSourceSetting || 'local'

  if (source === 'paapi') {
    // Get PaAPI configuration
    const configs = await db.select().from(paapiConfig) as PaapiConfigRow[]
    const config = configs.find((c: PaapiConfigRow) => c.isActive) || configs[0]

    if (!config) {
      console.warn('PaAPI source selected but not configured, falling back to local')
      return { source: 'local' }
    }

    // Build headers based on auth type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate', // Enable compression
    }

    if (config.authType === 'api_key' && config.apiKey) {
      headers['X-API-Key'] = config.apiKey
    } else if (config.authType === 'bearer' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    } else if (config.authType === 'basic' && config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    }

    return {
      source: 'paapi',
      paapi: {
        baseUrl: config.baseUrl.replace(/\/$/, ''),
        headers,
      },
    }
  }

  return { source: 'local' }
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(error: any): boolean {
  const statusCode = error?.statusCode || error?.status
  // Retry on network errors, timeouts, and server errors (5xx)
  // Don't retry on client errors (4xx)
  if (!statusCode) return true // Network error
  return statusCode >= 500 || statusCode === 408 || statusCode === 429
}

// =============================================================================
// PAAPI FETCH
// =============================================================================

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | number | undefined>
  body?: unknown
  /** Cache TTL in seconds (only for GET requests). Set to 0 to disable caching. */
  cacheTTL?: number
  /** Timeout in milliseconds */
  timeout?: number
  /** Retry options */
  retry?: Partial<RetryOptions>
}

/**
 * Fetch from PaAPI with caching, retry, and circuit breaker
 */
export async function fetchFromPaAPI<T>(
  config: NonNullable<DataSourceConfig['paapi']>,
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    params,
    body,
    cacheTTL: requestCacheTTL = cacheTTL.short,
    timeout = 15000,
    retry = {},
  } = options

  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retry }

  // Build URL with query params
  const url = new URL(`${config.baseUrl}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const urlString = url.toString()

  // Check response cache for GET requests
  if (method === 'GET' && requestCacheTTL > 0) {
    const cacheKey = `paapi:${urlString}`
    const cached = cache.get<T>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Check circuit breaker
  checkCircuitBreaker()

  // Retry loop
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      const response = await $fetch(urlString, {
        method,
        headers: config.headers,
        body: body ? JSON.stringify(body) : undefined,
        timeout,
      })

      // Record success for circuit breaker
      recordSuccess()

      // Cache GET responses
      if (method === 'GET' && requestCacheTTL > 0) {
        const cacheKey = `paapi:${urlString}`
        cache.set(cacheKey, response, requestCacheTTL)
      }

      return response as T
    } catch (error: any) {
      lastError = error

      // Record failure for circuit breaker
      recordFailure()

      // Check if we should retry
      if (attempt < retryOptions.maxRetries && isRetryableError(error)) {
        // Exponential backoff with jitter
        const delay = Math.min(
          retryOptions.baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
          retryOptions.maxDelayMs
        )
        console.warn(`PaAPI request failed (attempt ${attempt + 1}/${retryOptions.maxRetries + 1}), retrying in ${Math.round(delay)}ms: ${error?.message}`)
        await sleep(delay)
        continue
      }

      break
    }
  }

  // All retries exhausted
  console.error(`PaAPI request failed: ${endpoint}`, lastError?.message)
  throw createError({
    statusCode: (lastError as any)?.statusCode || 502,
    message: `PaAPI request failed: ${(lastError as any)?.message || 'Unknown error'}`,
  })
}

/**
 * Get circuit breaker status for monitoring
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean
  failures: number
  lastFailure: number | null
  threshold: number
  resetMs: number
} {
  return {
    isOpen: circuitBreaker.isOpen,
    failures: circuitBreaker.failures,
    lastFailure: circuitBreaker.lastFailure || null,
    threshold: CIRCUIT_BREAKER_THRESHOLD,
    resetMs: CIRCUIT_BREAKER_RESET_MS,
  }
}

/**
 * Reset circuit breaker (for admin use)
 */
export function resetCircuitBreaker(): void {
  circuitBreaker.isOpen = false
  circuitBreaker.failures = 0
  circuitBreaker.lastFailure = 0
  console.log('PaAPI circuit breaker manually reset')
}

/**
 * Invalidate PaAPI response cache (call when data changes)
 */
export function invalidatePaapiCache(pattern?: string): number {
  return cache.invalidatePrefix(pattern ? `paapi:${pattern}` : 'paapi:')
}

/**
 * Check if current data source is PaAPI
 */
export async function isPaapiSource(): Promise<boolean> {
  const config = await getDataSourceConfig()
  return config.source === 'paapi'
}

/**
 * Get the current data source type
 */
export async function getDataSourceType(): Promise<DataSourceType> {
  const config = await getDataSourceConfig()
  return config.source
}

// =============================================================================
// PAAPI ERROR HANDLING
// =============================================================================

export interface PaapiErrorDetail {
  code: string
  message: string
  details?: unknown
  statusCode: number
  isRetryable: boolean
}

/**
 * Parse and normalize PaAPI error responses
 */
export function parsePaapiError(error: unknown): PaapiErrorDetail {
  const anyError = error as any

  // Extract status code
  const statusCode = anyError?.statusCode || anyError?.status || 500

  // Try to extract structured error
  const errorBody = anyError?.data || anyError?.response?._data || anyError

  // Determine if error is retryable
  const isRetryable = statusCode >= 500 || statusCode === 408 || statusCode === 429

  // Build normalized error
  return {
    code: errorBody?.code || `HTTP_${statusCode}`,
    message: errorBody?.message || anyError?.message || 'Unknown PaAPI error',
    details: errorBody?.details,
    statusCode,
    isRetryable,
  }
}

/**
 * Create a standardized error from PaAPI response
 */
export function createPaapiError(error: unknown, context?: string): ReturnType<typeof createError> {
  const parsed = parsePaapiError(error)

  return createError({
    statusCode: parsed.statusCode,
    message: context
      ? `${context}: ${parsed.message}`
      : parsed.message,
    data: {
      code: parsed.code,
      details: parsed.details,
      isRetryable: parsed.isRetryable,
    },
  })
}

// =============================================================================
// SPECIALIZED PAAPI FETCH FUNCTIONS
// =============================================================================

import type {
  ClaimsSummaryResponse,
  InsightsResponse,
  ProvidersListResponse,
  AnalyticsDashboardResponse,
  ClaimsListResponse,
  PoliciesListResponse,
} from '~/types'

/**
 * Fetch claims summary from PaAPI
 */
export async function fetchClaimsSummaryFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: { days?: number } = {}
): Promise<ClaimsSummaryResponse> {
  return fetchFromPaAPI<ClaimsSummaryResponse>(
    config,
    '/api/v1/claims/summary',
    { params, cacheTTL: cacheTTL.medium }
  )
}

/**
 * Fetch insights from PaAPI
 */
export async function fetchInsightsFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: { days?: number } = {}
): Promise<InsightsResponse> {
  return fetchFromPaAPI<InsightsResponse>(
    config,
    '/api/v1/insights',
    { params, cacheTTL: cacheTTL.medium }
  )
}

/**
 * Fetch providers from PaAPI
 */
export async function fetchProvidersFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: { limit?: number; offset?: number; specialty?: string; search?: string } = {}
): Promise<ProvidersListResponse> {
  return fetchFromPaAPI<ProvidersListResponse>(
    config,
    '/api/v1/providers',
    { params, cacheTTL: cacheTTL.medium }
  )
}

/**
 * Fetch analytics dashboard from PaAPI
 */
export async function fetchDashboardFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: { days?: number } = {}
): Promise<AnalyticsDashboardResponse> {
  return fetchFromPaAPI<AnalyticsDashboardResponse>(
    config,
    '/api/v1/analytics/dashboard',
    { params, cacheTTL: cacheTTL.short }
  )
}

/**
 * Fetch claims list from PaAPI
 */
export async function fetchClaimsFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: {
    limit?: number
    offset?: number
    status?: string
    startDate?: string
    endDate?: string
    providerId?: string
    search?: string
    ids?: string
  } = {}
): Promise<ClaimsListResponse> {
  return fetchFromPaAPI<ClaimsListResponse>(
    config,
    '/api/v1/claims',
    { params, cacheTTL: cacheTTL.short }
  )
}

/**
 * Fetch policies list from PaAPI
 */
export async function fetchPoliciesFromPaAPI(
  config: NonNullable<DataSourceConfig['paapi']>,
  params: {
    limit?: number
    offset?: number
    mode?: string
    topic?: string
    search?: string
  } = {}
): Promise<PoliciesListResponse> {
  return fetchFromPaAPI<PoliciesListResponse>(
    config,
    '/api/v1/policies',
    { params, cacheTTL: cacheTTL.medium }
  )
}

// =============================================================================
// RESPONSE VALIDATION
// =============================================================================

/**
 * Validate that a response has the expected pagination structure
 */
export function validatePaginatedResponse<T>(
  response: unknown,
  resourceName: string
): response is { data: T[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } } {
  if (!response || typeof response !== 'object') {
    console.warn(`Invalid ${resourceName} response: not an object`)
    return false
  }

  const resp = response as Record<string, unknown>

  if (!Array.isArray(resp.data)) {
    console.warn(`Invalid ${resourceName} response: data is not an array`)
    return false
  }

  if (!resp.pagination || typeof resp.pagination !== 'object') {
    console.warn(`Invalid ${resourceName} response: missing pagination`)
    return false
  }

  return true
}

/**
 * Validate claims summary response structure
 */
export function validateClaimsSummaryResponse(response: unknown): response is ClaimsSummaryResponse {
  if (!response || typeof response !== 'object') {
    return false
  }

  const resp = response as Record<string, unknown>

  // Check required fields
  const requiredFields = ['totalClaims', 'statusBreakdown', 'denialRate', 'financial', 'appeals', 'period']
  for (const field of requiredFields) {
    if (!(field in resp)) {
      console.warn(`Invalid claims summary: missing field "${field}"`)
      return false
    }
  }

  return true
}

/**
 * Validate insights response structure
 */
export function validateInsightsResponse(response: unknown): response is InsightsResponse {
  if (!response || typeof response !== 'object') {
    return false
  }

  const resp = response as Record<string, unknown>

  // Check required fields
  const requiredFields = ['period', 'denialAnalysis', 'appeals']
  for (const field of requiredFields) {
    if (!(field in resp)) {
      console.warn(`Invalid insights response: missing field "${field}"`)
      return false
    }
  }

  return true
}
