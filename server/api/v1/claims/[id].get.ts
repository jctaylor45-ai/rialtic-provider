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
  claimLinePolicies,
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
    ])

    // Get policies at the LINE level (policies link to lines, not claims)
    // For each line item, get its linked policies
    const lineItemsWithPolicies = await Promise.all(
      lineItems.map(async (line) => {
        const linePolicies = await db
          .select({
            policyId: claimLinePolicies.policyId,
            policyName: policies.name,
            policyMode: policies.mode,
            triggeredAt: claimLinePolicies.triggeredAt,
            isDenied: claimLinePolicies.isDenied,
            deniedAmount: claimLinePolicies.deniedAmount,
            denialReason: claimLinePolicies.denialReason,
          })
          .from(claimLinePolicies)
          .innerJoin(policies, eq(claimLinePolicies.policyId, policies.id))
          .where(eq(claimLinePolicies.lineItemId, line.id))

        return {
          ...line,
          policies: linePolicies,
        }
      })
    )

    // Transform diagnosis codes to array of strings, sorted by sequence
    const diagnosisCodeStrings = diagnosisCodes
      .sort((a, b) => a.sequence - b.sequence)
      .map(dc => dc.code)

    // Transform procedure codes to array of strings
    const procedureCodeStrings = procedureCodes.map(pc => pc.code)

    return {
      ...claim,
      lineItems: lineItemsWithPolicies,
      diagnosisCodes: diagnosisCodeStrings,
      procedureCodes: procedureCodeStrings,
      appeals,
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
