/**
 * Policy Detail API Endpoint
 *
 * GET /api/v1/policies/:id
 *
 * Returns a single policy with all related codes and documentation.
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
} from '~/server/database/schema'
import { eq } from 'drizzle-orm'

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

    return {
      ...policy,
      procedureCodes: procedureCodes.map(c => c.code),
      diagnosisCodes: diagnosisCodes.map(c => c.code),
      modifiers: modifiers.map(m => m.modifier),
      placesOfService: placesOfService.map(p => p.placeOfService),
      referenceDocs,
      relatedPolicies: relatedPoliciesFull.filter(Boolean),
      relatedPatterns,
    }
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
