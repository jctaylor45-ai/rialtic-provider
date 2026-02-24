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
import { patterns, patternClaimLines, claimLineItems, claimLinePolicies, policies, claims, claimAppeals, patternRelatedCodes, patternActions, patternEvidence, patternSnapshots } from '~/server/database/schema'
import { eq, desc, and, sql, count, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawLimit = parseInt(query.limit as string)
    // limit=0 means "return all"; otherwise default to 50
    const limit = rawLimit === 0 ? 0 : (rawLimit || 50)
    const offset = parseInt(query.offset as string) || 0
    const category = query.category as string | undefined
    const status = query.status as string | undefined
    const tier = query.tier as string | undefined
    const scenarioId = query.scenario_id as string | undefined

    // Build where conditions
    const whereConditions: ReturnType<typeof eq>[] = []

    if (scenarioId) {
      whereConditions.push(eq(patterns.scenarioId, scenarioId))
    }

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

    // Query patterns with available columns (limit=0 means return all)
    const patternsQuery = db
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
        recoveryStatus: patterns.recoveryStatus,
        actionCategory: patterns.actionCategory,
        shortTermDescription: patterns.shortTermDescription,
        shortTermCanResubmit: patterns.shortTermCanResubmit,
        longTermDescription: patterns.longTermDescription,
        longTermSteps: patterns.longTermSteps,
        denialReason: patterns.denialReason,
      })
      .from(patterns)
      .where(where)
      .orderBy(desc(patterns.scoreImpact), desc(patterns.totalAtRisk))
      .$dynamic()

    if (limit > 0) {
      patternsQuery.limit(limit).offset(offset)
    }

    const patternsList = await patternsQuery

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

        // Get appeal metrics for claims linked to this pattern
        // Join: pattern_claim_lines → claim_line_items → claims → claim_appeals
        const [appealResult] = await db
          .select({
            appealCount: sql<number>`COUNT(DISTINCT CASE WHEN ${claimAppeals.appealFiled} = 1 THEN ${claimAppeals.id} END)`,
            overturnedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${claimAppeals.appealOutcome} = 'overturned' THEN ${claimAppeals.id} END)`,
            // Denominator: claims that were ever denied (status='denied' or status='appealed')
            everDeniedClaims: sql<number>`COUNT(DISTINCT CASE WHEN ${claims.status} IN ('denied', 'appealed') THEN ${claims.id} END)`,
          })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
          .leftJoin(claimAppeals, eq(claims.id, claimAppeals.claimId))
          .where(eq(patternClaimLines.patternId, pattern.id))

        const appealCount = Number(appealResult?.appealCount) || 0
        const overturnedCount = Number(appealResult?.overturnedCount) || 0
        const everDeniedClaims = Number(appealResult?.everDeniedClaims) || 0

        // Fix 1: Related codes from pattern_related_codes table
        const relatedCodes = await db
          .select({ code: patternRelatedCodes.code })
          .from(patternRelatedCodes)
          .where(eq(patternRelatedCodes.patternId, pattern.id))

        // Fix 2: Actions from pattern_actions table
        const actions = await db
          .select({
            id: patternActions.id,
            actionType: patternActions.actionType,
            notes: patternActions.notes,
            timestamp: patternActions.timestamp,
          })
          .from(patternActions)
          .where(eq(patternActions.patternId, pattern.id))
          .orderBy(desc(patternActions.timestamp))

        // Fix 3: Evidence from denied claim lines (sample of 10)
        const evidence = await db
          .select({
            claimId: claimLineItems.claimId,
            procedureCode: claimLineItems.procedureCode,
            billedAmount: claimLineItems.billedAmount,
            denialDate: patternClaimLines.denialDate,
          })
          .from(patternClaimLines)
          .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
          .where(and(
            eq(patternClaimLines.patternId, pattern.id),
            eq(claimLineItems.status, 'denied')
          ))
          .limit(10)

        // Fix 4: Snapshots from pattern_snapshots table
        const snapshots = await db
          .select({
            month: patternSnapshots.snapshotDate,
            denialRate: patternSnapshots.denialRate,
            dollarsDenied: patternSnapshots.dollarsDenied,
            claimCount: patternSnapshots.claimCount,
            deniedCount: patternSnapshots.deniedCount,
          })
          .from(patternSnapshots)
          .where(eq(patternSnapshots.patternId, pattern.id))
          .orderBy(asc(patternSnapshots.snapshotDate))

        return {
          ...pattern,
          liveLineCount: deniedLineCountResult?.count || 0,
          liveTotalAtRisk: Number(impactResult?.totalAtRisk) || 0,
          liveTotalBilled: Number(impactResult?.totalBilled) || 0,
          relatedPolicies,
          affectedClaims,
          appealCount,
          overturnedCount,
          appealRate: everDeniedClaims > 0 ? Math.round((appealCount / everDeniedClaims) * 10000) / 100 : 0,
          relatedCodes: relatedCodes.map(r => r.code),
          actions,
          evidence: evidence.map(e => ({
            claimId: e.claimId,
            procedureCode: e.procedureCode,
            billedAmount: e.billedAmount,
            denialDate: e.denialDate,
            denialReason: pattern.denialReason || '',
          })),
          snapshots,
        }
      })
    )

    return {
      data: patternsWithLiveCounts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: limit > 0 && (offset + limit) < total,
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
