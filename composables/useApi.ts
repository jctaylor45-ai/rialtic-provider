/**
 * Centralized API composable
 *
 * Provides a unified fetch wrapper with:
 * - Centralized error handling
 * - Request/response logging
 * - Performance monitoring integration
 * - Type-safe responses
 *
 * Pattern aligned with console-ui's useApi composable
 */

import type { FetchError } from 'ofetch'

export interface ApiError {
  statusCode: number
  statusMessage: string
  message: string
  data?: unknown
}

export interface ApiRequestOptions {
  /** Skip error logging for expected errors */
  silent?: boolean
  /** Request body */
  body?: Record<string, unknown>
  /** Query parameters */
  params?: Record<string, unknown>
  /** Query parameters (alias for params) */
  query?: Record<string, unknown>
  /** Request headers */
  headers?: Record<string, string>
}

/**
 * Centralized API composable for making HTTP requests
 *
 * Usage:
 * ```ts
 * const api = useApi()
 *
 * // GET request
 * const data = await api.get('/api/v1/claims')
 *
 * // POST request
 * const result = await api.post('/api/v1/claims', { body: claimData })
 *
 * // With custom options
 * const data = await api.get('/api/v1/claims', {
 *   params: { limit: 100, offset: 0 },
 *   silent: true // Don't log errors
 * })
 * ```
 */
export function useApi() {
  /**
   * Handle API errors centrally
   */
  function handleError(error: FetchError, silent?: boolean): never {
    const apiError: ApiError = {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Unknown error',
      message: error.message || 'An unexpected error occurred',
      data: error.data,
    }

    // Log error unless silent mode
    if (!silent) {
      console.error('[API Error]', {
        statusCode: apiError.statusCode,
        message: apiError.message,
        url: error.request?.toString(),
      })

      // Track error in performance monitor (server-side)
      if (import.meta.server) {
        try {
          // Performance monitoring can be added here
          // getPerformanceMonitor().recordError(error, error.request?.toString())
        } catch {
          // Ignore monitoring errors
        }
      }
    }

    throw apiError
  }

  /**
   * GET request
   */
  async function get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, {
        method: 'GET',
        ...fetchOptions,
      }) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  /**
   * POST request
   */
  async function post<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, {
        method: 'POST',
        ...fetchOptions,
      }) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  /**
   * PUT request
   */
  async function put<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, {
        method: 'PUT',
        ...fetchOptions,
      }) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  /**
   * PATCH request
   */
  async function patch<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, {
        method: 'PATCH',
        ...fetchOptions,
      }) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  /**
   * DELETE request
   */
  async function del<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, {
        method: 'DELETE',
        ...fetchOptions,
      }) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  /**
   * Raw fetch with full control
   */
  async function request<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { silent, ...fetchOptions } = options || {}
    try {
      return await $fetch<T>(url, fetchOptions) as T
    } catch (error) {
      handleError(error as FetchError, silent)
    }
  }

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    request,
  }
}

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * Helper to extract paginated data
 */
export function extractPaginatedData<T>(response: ApiResponse<T>): {
  data: T
  pagination: NonNullable<ApiResponse<T>['pagination']>
} {
  return {
    data: response.data,
    pagination: response.pagination || {
      total: Array.isArray(response.data) ? response.data.length : 1,
      limit: 100,
      offset: 0,
      hasMore: false,
    },
  }
}
