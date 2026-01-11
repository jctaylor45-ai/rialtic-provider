/**
 * Claim Detail API Endpoint
 *
 * GET /api/v1/claims/:id
 *
 * Returns a single claim in PaAPI-compatible ProcessedClaimWithInsights format.
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
  lineItemModifiers,
  lineItemDiagnosisCodes,
  policies,
} from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import {
  claimWithInsightsAdapter,
  type DbClaim,
  type DbLineItem,
  type DbLinePolicy,
  type DbDiagnosisCode,
  type DbAppeal,
} from '~/server/utils/claimAdapter'

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

    // Get policies and modifiers for each line item
    const lineItemsWithDetails = await Promise.all(
      lineItems.map(async (line) => {
        const [linePolicies, modifiers, lineDiagnoses] = await Promise.all([
          db
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
            .where(eq(claimLinePolicies.lineItemId, line.id)),
          db
            .select({ modifier: lineItemModifiers.modifier })
            .from(lineItemModifiers)
            .where(eq(lineItemModifiers.lineItemId, line.id)),
          db
            .select({ code: lineItemDiagnosisCodes.code })
            .from(lineItemDiagnosisCodes)
            .where(eq(lineItemDiagnosisCodes.lineItemId, line.id)),
        ])

        return {
          ...line,
          policies: linePolicies as DbLinePolicy[],
          modifiers: modifiers.map(m => m.modifier),
          diagnosisCodes: lineDiagnoses.map(d => d.code),
        } as DbLineItem
      })
    )

    // Transform to PaAPI format using the adapter
    const processedClaim = claimWithInsightsAdapter(
      claim as unknown as DbClaim,
      lineItemsWithDetails,
      diagnosisCodes as DbDiagnosisCode[],
      procedureCodes.map(pc => pc.code),
      appeals as unknown as DbAppeal[],
    )

    return processedClaim
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
