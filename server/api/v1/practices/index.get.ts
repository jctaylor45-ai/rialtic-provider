/**
 * Practices List API Endpoint
 *
 * GET /api/v1/practices
 *
 * Returns all practices (scenarios) with aggregate counts.
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '~/server/database'
import { scenarios, claims, patterns, providers } from '~/server/database/schema'
import { eq, sql, count } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const scenariosList = await db
      .select({
        id: scenarios.id,
        name: scenarios.name,
      })
      .from(scenarios)
      .orderBy(scenarios.name)

    // Get counts in parallel
    const [claimCounts, patternCounts, providerCounts] = await Promise.all([
      db
        .select({
          scenarioId: claims.scenarioId,
          count: count(),
        })
        .from(claims)
        .groupBy(claims.scenarioId),
      db
        .select({
          scenarioId: patterns.scenarioId,
          count: count(),
        })
        .from(patterns)
        .groupBy(patterns.scenarioId),
      db
        .select({
          scenarioId: providers.scenarioId,
          count: count(),
        })
        .from(providers)
        .groupBy(providers.scenarioId),
    ])

    const claimMap = new Map(claimCounts.map(c => [c.scenarioId, c.count]))
    const patternMap = new Map(patternCounts.map(p => [p.scenarioId, p.count]))
    const providerMap = new Map(providerCounts.map(p => [p.scenarioId, p.count]))

    return scenariosList.map(s => ({
      id: s.id,
      name: s.name,
      claimCount: claimMap.get(s.id) || 0,
      patternCount: patternMap.get(s.id) || 0,
      providerCount: providerMap.get(s.id) || 0,
    }))
  } catch (error) {
    console.error('Practices endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch practices',
    })
  }
})
