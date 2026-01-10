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
  patternClaimLines,
  patternPolicies,
  patternRelatedCodes,
  patternEvidence,
  patternImprovements,
  patternActions,
  claims,
  claimLineItems,
  policies,
} from '~/server/database/schema'
import { eq, desc, count, sum, sql } from 'drizzle-orm'

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

    // Get related claims via claim lines (limited to 20 for performance)
    // Patterns link to claim LINES, not claims directly
    const relatedClaimLines = await db
      .select({
        claimId: claims.id,
        patientName: claims.patientName,
        dateOfService: claims.dateOfService,
        status: claims.status,
        denialReason: claims.denialReason,
        providerName: claims.providerName,
        lineItemId: claimLineItems.id,
        lineNumber: claimLineItems.lineNumber,
        procedureCode: claimLineItems.procedureCode,
        lineBilledAmount: claimLineItems.billedAmount,
        deniedAmount: patternClaimLines.deniedAmount,
      })
      .from(patternClaimLines)
      .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
      .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
      .where(eq(patternClaimLines.patternId, id))
      .orderBy(desc(claims.dateOfService))
      .limit(20)

    // Group by claim for display while preserving line-level detail
    const relatedClaims = relatedClaimLines.map(line => ({
      id: line.claimId,
      patientName: line.patientName,
      dateOfService: line.dateOfService,
      billedAmount: line.lineBilledAmount,
      deniedAmount: line.deniedAmount,
      status: line.status,
      denialReason: line.denialReason,
      providerName: line.providerName,
      lineNumber: line.lineNumber,
      procedureCode: line.procedureCode,
    }))

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

    // Calculate live statistics from claim lines
    // totalAtRisk is computed from denied line amounts
    const [lineStats] = await db
      .select({
        count: count(),
        totalAtRisk: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
        totalBilled: sql<number>`COALESCE(SUM(${claimLineItems.billedAmount}), 0)`,
      })
      .from(patternClaimLines)
      .innerJoin(claimLineItems, eq(patternClaimLines.lineItemId, claimLineItems.id))
      .where(eq(patternClaimLines.patternId, id))

    return {
      ...pattern,
      statistics: {
        lineCount: lineStats?.count || 0,
        totalAtRisk: Number(lineStats?.totalAtRisk) || 0,
        totalBilled: Number(lineStats?.totalBilled) || 0,
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
