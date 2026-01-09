/**
 * Patterns List API Endpoint
 *
 * GET /api/v1/patterns
 *
 * Returns paginated patterns list with optional filtering.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { patterns, patternClaims, claims } from '~/server/database/schema'
import { eq, desc, and, sql, count, sum } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const offset = parseInt(query.offset as string) || 0
    const category = query.category as string | undefined
    const status = query.status as string | undefined
    const tier = query.tier as string | undefined

    // Build where conditions
    const whereConditions: ReturnType<typeof eq>[] = []

    if (category) {
      whereConditions.push(eq(patterns.category, category as typeof patterns.category.enumValues[number]))
    }

    if (status) {
      whereConditions.push(eq(patterns.status, status as typeof patterns.status.enumValues[number]))
    }

    if (tier) {
      whereConditions.push(eq(patterns.tier, tier as typeof patterns.tier.enumValues[number]))
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Query patterns with available columns
    const patternsList = await db
      .select({
        id: patterns.id,
        title: patterns.title,
        description: patterns.description,
        category: patterns.category,
        status: patterns.status,
        tier: patterns.tier,
        scenarioId: patterns.scenarioId,
        scoreFrequency: patterns.scoreFrequency,
        scoreImpact: patterns.scoreImpact,
        scoreTrend: patterns.scoreTrend,
        scoreVelocity: patterns.scoreVelocity,
        scoreConfidence: patterns.scoreConfidence,
        scoreRecency: patterns.scoreRecency,
        avgDenialAmount: patterns.avgDenialAmount,
        totalAtRisk: patterns.totalAtRisk,
        learningProgress: patterns.learningProgress,
        practiceSessionsCompleted: patterns.practiceSessionsCompleted,
        correctionsApplied: patterns.correctionsApplied,
        suggestedAction: patterns.suggestedAction,
        baselineDenialRate: patterns.baselineDenialRate,
        currentDenialRate: patterns.currentDenialRate,
        currentClaimCount: patterns.currentClaimCount,
        currentDollarsDenied: patterns.currentDollarsDenied,
      })
      .from(patterns)
      .where(where)
      .orderBy(desc(patterns.scoreImpact), desc(patterns.totalAtRisk))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patterns)
      .where(where)

    const total = totalResult?.count || 0

    // Calculate live claim counts for each pattern
    const patternsWithLiveCounts = await Promise.all(
      patternsList.map(async (pattern) => {
        const [claimCountResult] = await db
          .select({ count: count() })
          .from(patternClaims)
          .where(eq(patternClaims.patternId, pattern.id))

        // Calculate impact from linked claims
        const [impactResult] = await db
          .select({ total: sum(claims.billedAmount) })
          .from(patternClaims)
          .innerJoin(claims, eq(patternClaims.claimId, claims.id))
          .where(eq(patternClaims.patternId, pattern.id))

        return {
          ...pattern,
          liveClaimCount: claimCountResult?.count || 0,
          liveImpactAmount: Number(impactResult?.total) || 0,
        }
      })
    )

    return {
      data: patternsWithLiveCounts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total,
      },
    }
  } catch (error) {
    console.error('Patterns endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch patterns',
    })
  }
})
