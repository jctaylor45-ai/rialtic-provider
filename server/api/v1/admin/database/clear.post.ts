/**
 * Database Clear API Endpoint
 *
 * POST /api/v1/admin/database/clear
 *
 * Clears database tables based on the mode specified.
 * Modes:
 *   - 'all': Clear everything including policies
 *   - 'except-policies': Clear everything except policy-related tables
 *   - 'claims-only': Clear only claims and related data
 *   - 'patterns-only': Clear only patterns and related data
 *   - 'learning-only': Clear only learning events
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '~/server/database'
import { sql } from 'drizzle-orm'
import {
  claims,
  claimLineItems,
  claimDiagnosisCodes,
  claimProcedureCodes,
  claimLinePolicies,
  claimAppeals,
  lineItemModifiers,
  lineItemDiagnosisCodes,
  policies,
  policyProcedureCodes,
  policyDiagnosisCodes,
  policyModifiers,
  policyPlacesOfService,
  policyReferenceDocs,
  policyRelatedPolicies,
  patterns,
  patternClaimLines,
  patternPolicies,
  patternRelatedCodes,
  patternEvidence,
  patternImprovements,
  patternActions,
  patternSnapshots,
  learningEvents,
  providers,
  scenarios,
  dataSources,
  importHistory,
} from '~/server/database/schema'

type ClearMode = 'all' | 'except-policies' | 'claims-only' | 'patterns-only' | 'learning-only'

interface ClearRequest {
  mode: ClearMode
  confirmPhrase?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ClearRequest>(event)
    const { mode, confirmPhrase } = body

    // Validate mode
    const validModes: ClearMode[] = ['all', 'except-policies', 'claims-only', 'patterns-only', 'learning-only']
    if (!mode || !validModes.includes(mode)) {
      throw createError({
        statusCode: 400,
        message: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
      })
    }

    // Require confirmation for destructive operations
    if (mode === 'all' && confirmPhrase !== 'DELETE ALL DATA') {
      throw createError({
        statusCode: 400,
        message: 'Confirmation phrase required: "DELETE ALL DATA"',
      })
    }

    const deleted: Record<string, number> = {}

    // Helper to delete and count
    async function clearTable(table: Parameters<typeof db.delete>[0], name: string) {
      const result = await db.delete(table)
      deleted[name] = result.changes
    }

    // Clear based on mode
    if (mode === 'all' || mode === 'except-policies') {
      // Clear claim-related tables (order matters due to foreign keys)
      await clearTable(claimLinePolicies, 'claimLinePolicies')
      await clearTable(claimAppeals, 'claimAppeals')
      await clearTable(lineItemModifiers, 'lineItemModifiers')
      await clearTable(lineItemDiagnosisCodes, 'lineItemDiagnosisCodes')
      await clearTable(claimLineItems, 'claimLineItems')
      await clearTable(claimDiagnosisCodes, 'claimDiagnosisCodes')
      await clearTable(claimProcedureCodes, 'claimProcedureCodes')
      await clearTable(claims, 'claims')

      // Clear pattern-related tables
      await clearTable(patternClaimLines, 'patternClaimLines')
      await clearTable(patternPolicies, 'patternPolicies')
      await clearTable(patternRelatedCodes, 'patternRelatedCodes')
      await clearTable(patternEvidence, 'patternEvidence')
      await clearTable(patternImprovements, 'patternImprovements')
      await clearTable(patternActions, 'patternActions')
      await clearTable(patternSnapshots, 'patternSnapshots')
      await clearTable(patterns, 'patterns')

      // Clear learning events
      await clearTable(learningEvents, 'learningEvents')

      // Clear providers
      await clearTable(providers, 'providers')

      // Clear scenarios
      await clearTable(scenarios, 'scenarios')

      // Clear data sources and import history
      await clearTable(importHistory, 'importHistory')
      await clearTable(dataSources, 'dataSources')
    }

    if (mode === 'all') {
      // Also clear policy-related tables
      await clearTable(policyProcedureCodes, 'policyProcedureCodes')
      await clearTable(policyDiagnosisCodes, 'policyDiagnosisCodes')
      await clearTable(policyModifiers, 'policyModifiers')
      await clearTable(policyPlacesOfService, 'policyPlacesOfService')
      await clearTable(policyReferenceDocs, 'policyReferenceDocs')
      await clearTable(policyRelatedPolicies, 'policyRelatedPolicies')
      await clearTable(policies, 'policies')
    }

    if (mode === 'claims-only') {
      // Clear claim-related tables only
      await clearTable(claimLinePolicies, 'claimLinePolicies')
      await clearTable(claimAppeals, 'claimAppeals')
      await clearTable(lineItemModifiers, 'lineItemModifiers')
      await clearTable(lineItemDiagnosisCodes, 'lineItemDiagnosisCodes')
      await clearTable(claimLineItems, 'claimLineItems')
      await clearTable(claimDiagnosisCodes, 'claimDiagnosisCodes')
      await clearTable(claimProcedureCodes, 'claimProcedureCodes')
      await clearTable(claims, 'claims')

      // Also clear pattern-claim links since claims are gone
      await clearTable(patternClaimLines, 'patternClaimLines')
      await clearTable(patternEvidence, 'patternEvidence')
    }

    if (mode === 'patterns-only') {
      // Clear pattern-related tables
      await clearTable(patternClaimLines, 'patternClaimLines')
      await clearTable(patternPolicies, 'patternPolicies')
      await clearTable(patternRelatedCodes, 'patternRelatedCodes')
      await clearTable(patternEvidence, 'patternEvidence')
      await clearTable(patternImprovements, 'patternImprovements')
      await clearTable(patternActions, 'patternActions')
      await clearTable(patternSnapshots, 'patternSnapshots')
      await clearTable(patterns, 'patterns')
    }

    if (mode === 'learning-only') {
      await clearTable(learningEvents, 'learningEvents')
    }

    // Calculate total deleted
    const totalDeleted = Object.values(deleted).reduce((sum, count) => sum + count, 0)

    return {
      success: true,
      mode,
      deleted,
      totalDeleted,
      message: `Successfully cleared ${totalDeleted} records`,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Database clear error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to clear database',
    })
  }
})
