/**
 * Pattern Detail API Endpoint
 *
 * GET /api/v1/patterns/:id
 *
 * Returns a single pattern with related claims, policies, and evidence.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '~/server/database'
import {
  patterns,
  patternClaims,
  patternPolicies,
  patternRelatedCodes,
  patternEvidence,
  patternImprovements,
  patternActions,
  claims,
  policies,
} from '~/server/database/schema'
import { eq, desc, count, sum } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Pattern ID is required',
      })
    }

    // Get the pattern
    const [pattern] = await db
      .select()
      .from(patterns)
      .where(eq(patterns.id, id))
      .limit(1)

    if (!pattern) {
      throw createError({
        statusCode: 404,
        message: 'Pattern not found',
      })
    }

    // Get related claims (limited to 20 for performance)
    const relatedClaims = await db
      .select({
        id: claims.id,
        patientName: claims.patientName,
        dateOfService: claims.dateOfService,
        billedAmount: claims.billedAmount,
        status: claims.status,
        denialReason: claims.denialReason,
        providerName: claims.providerName,
      })
      .from(patternClaims)
      .innerJoin(claims, eq(patternClaims.claimId, claims.id))
      .where(eq(patternClaims.patternId, id))
      .orderBy(desc(claims.dateOfService))
      .limit(20)

    // Get related policies
    const relatedPolicies = await db
      .select({
        id: policies.id,
        name: policies.name,
        mode: policies.mode,
        effectiveDate: policies.effectiveDate,
        description: policies.description,
        denialRate: policies.denialRate,
      })
      .from(patternPolicies)
      .innerJoin(policies, eq(patternPolicies.policyId, policies.id))
      .where(eq(patternPolicies.patternId, id))

    // Get related codes
    const relatedCodes = await db
      .select()
      .from(patternRelatedCodes)
      .where(eq(patternRelatedCodes.patternId, id))

    // Get evidence
    const evidence = await db
      .select()
      .from(patternEvidence)
      .where(eq(patternEvidence.patternId, id))

    // Get improvements
    const improvements = await db
      .select()
      .from(patternImprovements)
      .where(eq(patternImprovements.patternId, id))
      .orderBy(desc(patternImprovements.date))

    // Get actions
    const actions = await db
      .select()
      .from(patternActions)
      .where(eq(patternActions.patternId, id))

    // Calculate live statistics
    const [claimStats] = await db
      .select({
        count: count(),
        totalBilled: sum(claims.billedAmount),
      })
      .from(patternClaims)
      .innerJoin(claims, eq(patternClaims.claimId, claims.id))
      .where(eq(patternClaims.patternId, id))

    return {
      ...pattern,
      statistics: {
        claimCount: claimStats?.count || 0,
        totalImpact: Number(claimStats?.totalBilled) || 0,
      },
      relatedClaims,
      relatedPolicies,
      relatedCodes,
      evidence,
      improvements,
      actions,
    }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error
    }
    console.error('Pattern detail error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch pattern',
    })
  }
})
