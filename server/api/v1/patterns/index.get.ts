/**
 * Patterns List API Endpoint
 *
 * GET /api/v1/patterns
 *
 * Returns paginated patterns list with optional filtering.
 * Includes related policies and affected claims derived from claim line linkages.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { patterns, patternClaimLines, claimLineItems, claimLinePolicies, policies } from '~/server/database/schema'
import { eq, desc, and, sql, count } from 'drizzle-orm'

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

    // Calculate live line counts, totalAtRisk, related policies, and affected claims for each pattern
    // IMPORTANT: Only count DENIED lines - patterns should only show lines that failed the logic check
    const patternsWithLiveCounts = await Promise.all(
      patternsList.map(async (pattern) => {
        // Count only denied lines linked to this pattern
        const [deniedLineCountResult] = await db
          .select({ count: count() })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .where(and(
            eq(patternClaimLines.patternId, pattern.id),
            eq(claimLineItems.status, 'denied')
          ))

        // Calculate totalAtRisk from DENIED line amounts only
        const [impactResult] = await db
          .select({
            totalAtRisk: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
            totalBilled: sql<number>`COALESCE(SUM(${claimLineItems.billedAmount}), 0)`,
          })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .where(and(
            eq(patternClaimLines.patternId, pattern.id),
            eq(claimLineItems.status, 'denied')
          ))

        // Get related policies via claim lines chain (only from denied lines):
        // pattern -> pattern_claim_lines -> claim_line_items (denied) -> claim_line_policies -> policies
        // Include fixGuidance and commonMistake for insight guidance sections
        const relatedPolicies = await db
          .selectDistinct({
            policyId: policies.id,
            policyName: policies.name,
            policyMode: policies.mode,
            fixGuidance: policies.fixGuidance,
            commonMistake: policies.commonMistake,
            logicType: policies.logicType,
          })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .innerJoin(claimLinePolicies, eq(claimLineItems.id, claimLinePolicies.lineItemId))
          .innerJoin(policies, eq(claimLinePolicies.policyId, policies.id))
          .where(and(
            eq(patternClaimLines.patternId, pattern.id),
            eq(claimLineItems.status, 'denied')
          ))

        // Get affected claim IDs (only claims with DENIED lines)
        const affectedClaimsResult = await db
          .selectDistinct({
            claimId: claimLineItems.claimId,
          })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .where(and(
            eq(patternClaimLines.patternId, pattern.id),
            eq(claimLineItems.status, 'denied')
          ))

        const affectedClaims = affectedClaimsResult.map(r => r.claimId)

        return {
          ...pattern,
          liveLineCount: deniedLineCountResult?.count || 0,
          liveTotalAtRisk: Number(impactResult?.totalAtRisk) || 0,
          liveTotalBilled: Number(impactResult?.totalBilled) || 0,
          relatedPolicies,
          affectedClaims,
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
