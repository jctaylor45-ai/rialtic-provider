/**
 * PUT /api/v1/settings
 * Update application settings
 */
import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { appSettings } from '~/server/database/schema'

interface SettingsUpdateBody {
  key: string
  value: unknown
  description?: string
  category?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SettingsUpdateBody>(event)

  if (!body.key) {
    throw createError({
      statusCode: 400,
      message: 'Setting key is required',
    })
  }

  // Check if setting exists
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, body.key))

  if (existing.length > 0) {
    // Update existing setting
    await db.update(appSettings)
      .set({
        value: body.value,
        description: body.description,
        category: body.category,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appSettings.key, body.key))
  } else {
    // Insert new setting
    await db.insert(appSettings).values({
      key: body.key,
      value: body.value,
      description: body.description,
      category: body.category || 'general',
      updatedAt: new Date().toISOString(),
    })
  }

  return { success: true, key: body.key }
})
