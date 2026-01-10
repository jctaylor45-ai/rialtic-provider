/**
 * Data Source Service
 *
 * Provides a unified interface for fetching data from either:
 * - Local database (with PaAPI format adapters)
 * - Remote PaAPI backend
 *
 * The data source is determined by the 'dataSource' setting.
 */

import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { appSettings, paapiConfig } from '~/server/database/schema'

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

/**
 * Get the current data source configuration
 */
export async function getDataSourceConfig(): Promise<DataSourceConfig> {
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

/**
 * Fetch from PaAPI with proper error handling
 */
export async function fetchFromPaAPI<T>(
  config: NonNullable<DataSourceConfig['paapi']>,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    params?: Record<string, string | number | undefined>
    body?: unknown
  } = {}
): Promise<T> {
  const { method = 'GET', params, body } = options

  // Build URL with query params
  const url = new URL(`${config.baseUrl}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  try {
    const response = await $fetch(url.toString(), {
      method,
      headers: config.headers,
      body: body ? JSON.stringify(body) : undefined,
      timeout: 30000,
    })

    return response as T
  } catch (error: any) {
    console.error(`PaAPI request failed: ${endpoint}`, error?.message)
    throw createError({
      statusCode: error?.statusCode || 502,
      message: `PaAPI request failed: ${error?.message || 'Unknown error'}`,
    })
  }
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
