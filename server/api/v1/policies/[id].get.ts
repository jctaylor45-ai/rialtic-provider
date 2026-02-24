/**
 * Policy Detail API Endpoint
 *
 * GET /api/v1/policies/:id
 *
 * Returns a single policy in PaAPI-compatible format with all related data.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '~/server/database'
import {
  policies,
  policyProcedureCodes,
  policyDiagnosisCodes,
  policyModifiers,
  policyPlacesOfService,
  policyReferenceDocs,
  policyRelatedPolicies,
  patternPolicies,
  patterns,
  claimLinePolicies,
  claimLineItems,
} from '~/server/database/schema'
import { eq, sql, count } from 'drizzle-orm'
import {
  policyDetailAdapter,
  type DbPolicy,
  type DbReferenceDoc,
  type DbRelatedPolicy,
  type DbRelatedPattern,
} from '~/server/utils/policyAdapter'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Policy ID is required',
      })
    }

    // Get the policy
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id))
      .limit(1)

    if (!policy) {
      throw createError({
        statusCode: 404,
        message: 'Policy not found',
      })
    }

    // Get related data in parallel
    const [
      procedureCodes,
      diagnosisCodes,
      modifiers,
      placesOfService,
      referenceDocs,
      relatedPoliciesData,
      relatedPatterns,
      claimDerivedCodes,
    ] = await Promise.all([
      db
        .select({ code: policyProcedureCodes.code })
        .from(policyProcedureCodes)
        .where(eq(policyProcedureCodes.policyId, id)),
      db
        .select({ code: policyDiagnosisCodes.code })
        .from(policyDiagnosisCodes)
        .where(eq(policyDiagnosisCodes.policyId, id)),
      db
        .select({ modifier: policyModifiers.modifier })
        .from(policyModifiers)
        .where(eq(policyModifiers.policyId, id)),
      db
        .select({ placeOfService: policyPlacesOfService.placeOfService })
        .from(policyPlacesOfService)
        .where(eq(policyPlacesOfService.policyId, id)),
      db
        .select()
        .from(policyReferenceDocs)
        .where(eq(policyReferenceDocs.policyId, id)),
      db
        .select({
          relatedPolicyId: policyRelatedPolicies.relatedPolicyId,
        })
        .from(policyRelatedPolicies)
        .where(eq(policyRelatedPolicies.policyId, id)),
      db
        .select({
          id: patterns.id,
          title: patterns.title,
          category: patterns.category,
          status: patterns.status,
          tier: patterns.tier,
        })
        .from(patternPolicies)
        .innerJoin(patterns, eq(patternPolicies.patternId, patterns.id))
        .where(eq(patternPolicies.policyId, id)),
      // Fallback: derive procedure codes from linked claim lines
      db.selectDistinct({
        procedureCode: claimLineItems.procedureCode,
      })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .where(eq(claimLinePolicies.policyId, id)),
    ])

    // Get full related policy details
    const relatedPoliciesFull = await Promise.all(
      relatedPoliciesData.map(async (rp) => {
        const [relPolicy] = await db
          .select({
            id: policies.id,
            name: policies.name,
            mode: policies.mode,
          })
          .from(policies)
          .where(eq(policies.id, rp.relatedPolicyId))
          .limit(1)

        return relPolicy || null
      })
    )

    // Compute metrics for this policy from claim_line_policies
    // Hit Rate = % of claim lines that hit the policy
    // Denial Rate = % of claim lines that hit the policy that are denied
    const [totalClaimLinesResult] = await db
      .select({ count: count() })
      .from(claimLineItems)

    const totalClaimLines = totalClaimLinesResult?.count || 1

    const [policyMetrics] = await db
      .select({
        totalHits: count(),
        deniedHits: sql<number>`SUM(CASE WHEN ${claimLinePolicies.isDenied} = 1 THEN 1 ELSE 0 END)`,
        totalImpact: sql<number>`COALESCE(SUM(${claimLinePolicies.deniedAmount}), 0)`,
      })
      .from(claimLinePolicies)
      .where(eq(claimLinePolicies.policyId, id))

    // Use junction table codes, falling back to claim-derived codes
    const junctionCodes = procedureCodes.map(c => c.code)
    const procCodes = junctionCodes.length > 0 ? junctionCodes : claimDerivedCodes.map(c => c.procedureCode)

    // Transform to PaAPI format using the adapter
    const basePolicy = policyDetailAdapter(
      policy as unknown as DbPolicy,
      procCodes,
      diagnosisCodes.map(c => c.code),
      modifiers.map(m => m.modifier),
      placesOfService.map(p => p.placeOfService),
      referenceDocs as DbReferenceDoc[],
      relatedPoliciesFull.filter(Boolean) as DbRelatedPolicy[],
      relatedPatterns as DbRelatedPattern[],
    )

    // Fix generic common_mistake for scenario stubs
    if (basePolicy.common_mistake && /^Common in .+ patterns$/.test(basePolicy.common_mistake)) {
      basePolicy.common_mistake = `Submitting claims that do not meet this policy's requirements: ${policy.name.toLowerCase()}.`
    }

    // Merge computed metrics if available
    // Rates are stored as whole number percentages (3 = 3%) for consistency with rest of app
    if (policyMetrics && policyMetrics.totalHits > 0) {
      return {
        ...basePolicy,
        hit_rate: (policyMetrics.totalHits / totalClaimLines) * 100,
        denial_rate: policyMetrics.totalHits > 0 ? ((policyMetrics.deniedHits || 0) / policyMetrics.totalHits) * 100 : 0,
        impact: policyMetrics.totalImpact || 0,
      }
    }

    return basePolicy
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error
    }
    console.error('Policy detail error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch policy',
    })
  }
})
