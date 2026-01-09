/**
 * Claim Detail API Endpoint
 *
 * GET /api/v1/claims/:id
 *
 * Returns a single claim with all related data (line items, codes, appeals).
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '~/server/database'
import {
  claims,
  claimLineItems,
  claimDiagnosisCodes,
  claimProcedureCodes,
  claimAppeals,
  claimPolicies,
  policies,
} from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Claim ID is required',
      })
    }

    // Get the claim
    const [claim] = await db
      .select()
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1)

    if (!claim) {
      throw createError({
        statusCode: 404,
        message: 'Claim not found',
      })
    }

    // Get related data in parallel
    const [
      lineItems,
      diagnosisCodes,
      procedureCodes,
      appeals,
      claimPoliciesData,
    ] = await Promise.all([
      db
        .select()
        .from(claimLineItems)
        .where(eq(claimLineItems.claimId, id)),
      db
        .select()
        .from(claimDiagnosisCodes)
        .where(eq(claimDiagnosisCodes.claimId, id)),
      db
        .select()
        .from(claimProcedureCodes)
        .where(eq(claimProcedureCodes.claimId, id)),
      db
        .select()
        .from(claimAppeals)
        .where(eq(claimAppeals.claimId, id)),
      db
        .select({
          policyId: claimPolicies.policyId,
          policyName: policies.name,
          policyMode: policies.mode,
          triggeredAt: claimPolicies.triggeredAt,
        })
        .from(claimPolicies)
        .innerJoin(policies, eq(claimPolicies.policyId, policies.id))
        .where(eq(claimPolicies.claimId, id)),
    ])

    return {
      ...claim,
      lineItems,
      diagnosisCodes,
      procedureCodes,
      appeals,
      policies: claimPoliciesData,
    }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error
    }
    console.error('Claim detail error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch claim',
    })
  }
})
