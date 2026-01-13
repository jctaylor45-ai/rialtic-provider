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
  claims,
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
    const [totalClaimsResult] = await db
      .select({ count: count() })
      .from(claims)

    const totalClaims = totalClaimsResult?.count || 1

    const [policyMetrics] = await db
      .select({
        totalHits: count(),
        deniedHits: sql<number>`SUM(CASE WHEN ${claimLinePolicies.isDenied} = 1 THEN 1 ELSE 0 END)`,
        totalImpact: sql<number>`COALESCE(SUM(${claimLinePolicies.deniedAmount}), 0)`,
      })
      .from(claimLinePolicies)
      .where(eq(claimLinePolicies.policyId, id))

    // Transform to PaAPI format using the adapter
    const basePolicy = policyDetailAdapter(
      policy as unknown as DbPolicy,
      procedureCodes.map(c => c.code),
      diagnosisCodes.map(c => c.code),
      modifiers.map(m => m.modifier),
      placesOfService.map(p => p.placeOfService),
      referenceDocs as DbReferenceDoc[],
      relatedPoliciesFull.filter(Boolean) as DbRelatedPolicy[],
      relatedPatterns as DbRelatedPattern[],
    )

    // Merge computed metrics if available
    if (policyMetrics && policyMetrics.totalHits > 0) {
      return {
        ...basePolicy,
        hit_rate: policyMetrics.totalHits / totalClaims,
        denial_rate: policyMetrics.totalHits > 0 ? (policyMetrics.deniedHits || 0) / policyMetrics.totalHits : 0,
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
