/**
 * Bulk Policy Import API Endpoint
 *
 * POST /api/v1/admin/policies/import
 *
 * Imports policies from JSON data. Supports both individual policies
 * and arrays of policies.
 *
 * Options:
 *   - mode: 'replace' (default) or 'merge'
 *     - replace: Delete all existing policies first
 *     - merge: Update existing policies, insert new ones
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '~/server/database'
import { eq } from 'drizzle-orm'
import {
  policies,
  policyProcedureCodes,
  policyDiagnosisCodes,
  policyModifiers,
  policyPlacesOfService,
  policyReferenceDocs,
  policyRelatedPolicies,
} from '~/server/database/schema'

interface PolicyImport {
  id: string
  name: string
  mode: 'Edit' | 'Informational' | 'Pay & Advise'
  effectiveDate: string
  description?: string
  clinicalRationale?: string
  topic?: string
  logicType?: string
  source?: string
  hitRate?: number
  denialRate?: number
  appealRate?: number
  overturnRate?: number
  impact?: number
  insightCount?: number
  providersImpacted?: number
  trend?: 'up' | 'down' | 'stable'
  commonMistake?: string
  fixGuidance?: string
  ageRestrictions?: { min?: number; max?: number }
  frequencyLimits?: { count: number; period: string }
  procedureCodes?: string[]
  diagnosisCodes?: string[]
  modifiers?: string[]
  placeOfService?: string[]
  referenceDocs?: Array<{ title: string; url: string; source?: string }>
  relatedPolicies?: string[]
}

interface ImportRequest {
  policies: PolicyImport | PolicyImport[]
  mode?: 'replace' | 'merge'
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ImportRequest>(event)
    const importMode = body.mode || 'merge'

    // Normalize to array
    const policiesToImport = Array.isArray(body.policies) ? body.policies : [body.policies]

    if (policiesToImport.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No policies provided',
      })
    }

    // Validate required fields
    for (const policy of policiesToImport) {
      if (!policy.id || !policy.name || !policy.mode || !policy.effectiveDate) {
        throw createError({
          statusCode: 400,
          message: `Policy ${policy.id || 'unknown'} missing required fields (id, name, mode, effectiveDate)`,
        })
      }
    }

    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>,
    }

    // If replace mode, clear all policy data first
    if (importMode === 'replace') {
      await db.delete(policyProcedureCodes)
      await db.delete(policyDiagnosisCodes)
      await db.delete(policyModifiers)
      await db.delete(policyPlacesOfService)
      await db.delete(policyReferenceDocs)
      await db.delete(policyRelatedPolicies)
      await db.delete(policies)
    }

    // Process each policy
    for (const policyData of policiesToImport) {
      try {
        // Check if policy exists
        const existing = await db.query.policies.findFirst({
          where: eq(policies.id, policyData.id),
        })

        // Build policy record
        const policyRecord = {
          id: policyData.id,
          name: policyData.name,
          mode: policyData.mode,
          effectiveDate: policyData.effectiveDate,
          description: policyData.description || null,
          clinicalRationale: policyData.clinicalRationale || null,
          topic: policyData.topic || null,
          logicType: policyData.logicType || null,
          source: policyData.source || null,
          hitRate: policyData.hitRate ?? 0,
          denialRate: policyData.denialRate ?? 0,
          appealRate: policyData.appealRate ?? 0,
          overturnRate: policyData.overturnRate ?? 0,
          impact: policyData.impact ?? 0,
          insightCount: policyData.insightCount ?? 0,
          providersImpacted: policyData.providersImpacted ?? 0,
          trend: policyData.trend || null,
          commonMistake: policyData.commonMistake || null,
          fixGuidance: policyData.fixGuidance || null,
          ageRestrictions: policyData.ageRestrictions || null,
          frequencyLimits: policyData.frequencyLimits || null,
        }

        if (existing && importMode === 'merge') {
          // Update existing policy
          await db.update(policies)
            .set(policyRecord)
            .where(eq(policies.id, policyData.id))

          // Delete and re-insert related data
          await db.delete(policyProcedureCodes).where(eq(policyProcedureCodes.policyId, policyData.id))
          await db.delete(policyDiagnosisCodes).where(eq(policyDiagnosisCodes.policyId, policyData.id))
          await db.delete(policyModifiers).where(eq(policyModifiers.policyId, policyData.id))
          await db.delete(policyPlacesOfService).where(eq(policyPlacesOfService.policyId, policyData.id))
          await db.delete(policyReferenceDocs).where(eq(policyReferenceDocs.policyId, policyData.id))
          await db.delete(policyRelatedPolicies).where(eq(policyRelatedPolicies.policyId, policyData.id))

          results.updated++
        } else {
          // Insert new policy
          await db.insert(policies).values(policyRecord)
          results.inserted++
        }

        // Insert related data
        if (policyData.procedureCodes && policyData.procedureCodes.length > 0) {
          await db.insert(policyProcedureCodes).values(
            policyData.procedureCodes.map((code) => ({
              policyId: policyData.id,
              code,
            }))
          )
        }

        if (policyData.diagnosisCodes && policyData.diagnosisCodes.length > 0) {
          await db.insert(policyDiagnosisCodes).values(
            policyData.diagnosisCodes.map((code) => ({
              policyId: policyData.id,
              code,
            }))
          )
        }

        if (policyData.modifiers && policyData.modifiers.length > 0) {
          await db.insert(policyModifiers).values(
            policyData.modifiers.map((modifier) => ({
              policyId: policyData.id,
              modifier,
            }))
          )
        }

        if (policyData.placeOfService && policyData.placeOfService.length > 0) {
          await db.insert(policyPlacesOfService).values(
            policyData.placeOfService.map((pos) => ({
              policyId: policyData.id,
              placeOfService: pos,
            }))
          )
        }

        if (policyData.referenceDocs && policyData.referenceDocs.length > 0) {
          await db.insert(policyReferenceDocs).values(
            policyData.referenceDocs.map((doc) => ({
              policyId: policyData.id,
              title: doc.title,
              url: doc.url,
              source: doc.source || null,
            }))
          )
        }

        if (policyData.relatedPolicies && policyData.relatedPolicies.length > 0) {
          await db.insert(policyRelatedPolicies).values(
            policyData.relatedPolicies.map((relatedId) => ({
              policyId: policyData.id,
              relatedPolicyId: relatedId,
            }))
          )
        }
      } catch (policyError) {
        results.failed++
        results.errors.push({
          id: policyData.id,
          error: policyError instanceof Error ? policyError.message : 'Unknown error',
        })
      }
    }

    return {
      success: results.failed === 0,
      mode: importMode,
      total: policiesToImport.length,
      ...results,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Policy import error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to import policies',
    })
  }
})
