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
  // Mode is deprecated from UI but kept in DB for backwards compatibility
  // Defaults to 'Edit' if not provided
  mode?: 'Edit' | 'Informational' | 'Pay & Advise'
  effectiveDate: string
  description?: string
  clinicalRationale?: string
  topic?: string
  logicType?: string
  source?: string
  // Note: hitRate, denialRate, appealRate, overturnRate, and impact are computed
  // dynamically from claim_line_policies data and should not be imported
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

/**
 * Validate a single policy and return a list of field-level issues.
 * Returns an empty array if the policy is valid.
 */
function validatePolicy(policy: PolicyImport, index: number): string[] {
  const issues: string[] = []

  if (!policy || typeof policy !== 'object') {
    issues.push(`Policy at index ${index} is not an object (got ${typeof policy})`)
    return issues
  }

  // Required fields
  if (!policy.id) {
    issues.push('missing required field "id"')
  } else if (typeof policy.id !== 'string') {
    issues.push(`"id" must be a string (got ${typeof policy.id})`)
  }

  if (!policy.name) {
    issues.push('missing required field "name"')
  } else if (typeof policy.name !== 'string') {
    issues.push(`"name" must be a string (got ${typeof policy.name})`)
  }

  if (!policy.effectiveDate) {
    issues.push('missing required field "effectiveDate"')
  } else if (typeof policy.effectiveDate !== 'string') {
    issues.push(`"effectiveDate" must be a string (got ${typeof policy.effectiveDate})`)
  }

  // Optional array fields — check types if present
  if (policy.procedureCodes !== undefined && policy.procedureCodes !== null && !Array.isArray(policy.procedureCodes)) {
    issues.push(`"procedureCodes" must be an array (got ${typeof policy.procedureCodes})`)
  }
  if (policy.diagnosisCodes !== undefined && policy.diagnosisCodes !== null && !Array.isArray(policy.diagnosisCodes)) {
    issues.push(`"diagnosisCodes" must be an array (got ${typeof policy.diagnosisCodes})`)
  }
  if (policy.modifiers !== undefined && policy.modifiers !== null && !Array.isArray(policy.modifiers)) {
    issues.push(`"modifiers" must be an array (got ${typeof policy.modifiers})`)
  }
  if (policy.placeOfService !== undefined && policy.placeOfService !== null && !Array.isArray(policy.placeOfService)) {
    issues.push(`"placeOfService" must be an array (got ${typeof policy.placeOfService})`)
  }
  if (policy.relatedPolicies !== undefined && policy.relatedPolicies !== null && !Array.isArray(policy.relatedPolicies)) {
    issues.push(`"relatedPolicies" must be an array (got ${typeof policy.relatedPolicies})`)
  }
  if (policy.referenceDocs !== undefined && policy.referenceDocs !== null && !Array.isArray(policy.referenceDocs)) {
    issues.push(`"referenceDocs" must be an array (got ${typeof policy.referenceDocs})`)
  }

  return issues
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ImportRequest>(event)
    const importMode = body.mode || 'merge'

    // Normalize to array
    const policiesToImport = Array.isArray(body.policies) ? body.policies : [body.policies]

    console.log(`[Policy Import] Received ${policiesToImport.length} policies, mode=${importMode}`)

    if (policiesToImport.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No policies provided',
      })
    }

    // Validate all policies up front, collecting per-policy issues
    const validationErrors: { index: number; id: string; errors: string[] }[] = []

    for (let i = 0; i < policiesToImport.length; i++) {
      const policy = policiesToImport[i]!
      const issues = validatePolicy(policy, i)
      if (issues.length > 0) {
        const policyId = policy.id || 'unknown'
        validationErrors.push({ index: i, id: policyId, errors: issues })
        console.error(`[Policy Import] Validation failed for policy ${i} (${policyId}): ${issues.join('; ')}`)
      }
    }

    if (validationErrors.length > 0) {
      console.error(`[Policy Import] ${validationErrors.length} of ${policiesToImport.length} policies failed validation`)
      return {
        success: false,
        totalProcessed: 0,
        totalFailed: validationErrors.length,
        totalValid: policiesToImport.length - validationErrors.length,
        validationErrors: validationErrors.slice(0, 50),
        message: `${validationErrors.length} policies failed validation. First: policy ${validationErrors[0]!.index} (${validationErrors[0]!.id}): ${validationErrors[0]!.errors.join('; ')}`,
      }
    }

    console.log(`[Policy Import] All ${policiesToImport.length} policies passed validation`)

    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ index: number; id: string; error: string }>,
    }

    // If replace mode, clear all policy data first
    if (importMode === 'replace') {
      console.log('[Policy Import] Replace mode — clearing existing policy data')
      await db.delete(policyProcedureCodes)
      await db.delete(policyDiagnosisCodes)
      await db.delete(policyModifiers)
      await db.delete(policyPlacesOfService)
      await db.delete(policyReferenceDocs)
      await db.delete(policyRelatedPolicies)
      await db.delete(policies)
      console.log('[Policy Import] Existing policy data cleared')
    }

    const total = policiesToImport.length

    // Process each policy
    for (let i = 0; i < total; i++) {
      const policyData = policiesToImport[i]!

      // Log progress every 100 policies
      if (i % 100 === 0) {
        console.log(`[Policy Import] Processing policy ${i}/${total}: ${policyData.id}`)
      }

      try {
        // Check if policy exists
        const existing = await db.query.policies.findFirst({
          where: eq(policies.id, policyData.id),
        })

        // Build policy record
        // Note: hitRate, denialRate, appealRate, overturnRate, and impact are
        // computed dynamically from claim_line_policies data - not stored on import
        // Mode defaults to 'Edit' if not provided (deprecated from UI)
        const policyRecord = {
          id: policyData.id,
          name: policyData.name,
          mode: policyData.mode || 'Edit',
          effectiveDate: policyData.effectiveDate,
          description: policyData.description || null,
          clinicalRationale: policyData.clinicalRationale || null,
          topic: policyData.topic || null,
          logicType: policyData.logicType || null,
          source: policyData.source || null,
          // Computed metrics are left at default (0) - computed dynamically by API
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
        const errorMessage = policyError instanceof Error ? policyError.message : 'Unknown error'
        results.errors.push({
          index: i,
          id: policyData.id,
          error: errorMessage,
        })
        console.error(`[Policy Import] FAILED on policy ${i}/${total} (${policyData.id}): ${errorMessage}`)
      }
    }

    const succeeded = results.inserted + results.updated
    console.log(`[Policy Import] Complete: ${succeeded} succeeded (${results.inserted} inserted, ${results.updated} updated), ${results.failed} failed`)

    if (results.failed > 0) {
      console.error(`[Policy Import] ${results.failed} failures. First error: ${results.errors[0]?.error}`)
      return {
        success: false,
        mode: importMode,
        total,
        totalProcessed: succeeded,
        totalFailed: results.failed,
        ...results,
        errors: results.errors.slice(0, 50),
        message: `${succeeded} imported, ${results.failed} failed. First error: policy ${results.errors[0]?.index} (${results.errors[0]?.id}): ${results.errors[0]?.error}`,
      }
    }

    return {
      success: true,
      mode: importMode,
      total,
      ...results,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('[Policy Import] Unhandled error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to import policies',
    })
  }
})
