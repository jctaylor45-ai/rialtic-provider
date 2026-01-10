/**
 * PUT /api/v1/settings/paapi
 * Update PaAPI configuration
 */
import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { paapiConfig } from '~/server/database/schema'
import { invalidateConfigCache } from '~/server/utils/dataSource'

interface PaapiConfigBody {
  name?: string
  baseUrl: string
  authType: 'none' | 'api_key' | 'bearer' | 'basic'
  apiKey?: string
  username?: string
  password?: string
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PaapiConfigBody>(event)

  if (!body.baseUrl) {
    throw createError({
      statusCode: 400,
      message: 'PaAPI base URL is required',
    })
  }

  // Validate URL format
  try {
    new URL(body.baseUrl)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid URL format for baseUrl',
    })
  }

  // Check for existing config
  const existing = await db.select().from(paapiConfig)

  if (existing.length > 0) {
    // Update existing config
    const config = existing[0]
    await db.update(paapiConfig)
      .set({
        name: body.name || config?.name || 'default',
        baseUrl: body.baseUrl,
        authType: body.authType,
        apiKey: body.apiKey !== undefined ? body.apiKey : config?.apiKey,
        username: body.username !== undefined ? body.username : config?.username,
        password: body.password !== undefined ? body.password : config?.password,
        isActive: body.isActive !== undefined ? body.isActive : config?.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paapiConfig.id, config?.id || 1))

    // Invalidate config cache when PaAPI settings change
    invalidateConfigCache()

    return { success: true, id: config?.id }
  } else {
    // Insert new config
    const result = await db.insert(paapiConfig).values({
      name: body.name || 'default',
      baseUrl: body.baseUrl,
      authType: body.authType,
      apiKey: body.apiKey,
      username: body.username,
      password: body.password,
      isActive: body.isActive ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning({ id: paapiConfig.id })

    // Invalidate config cache when PaAPI settings change
    invalidateConfigCache()

    return { success: true, id: result[0]?.id }
  }
})
