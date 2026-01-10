/**
 * Database Statistics API Endpoint
 *
 * GET /api/v1/admin/database/stats
 *
 * Returns counts of records in each table for the admin dashboard.
 */

import { defineEventHandler, createError } from 'h3'
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

export default defineEventHandler(async () => {
  try {
    // Get counts for all tables
    const [
      claimsCount,
      claimLineItemsCount,
      claimDiagnosisCodesCount,
      claimProcedureCodesCount,
      claimLinePoliciesCount,
      claimAppealsCount,
      lineItemModifiersCount,
      lineItemDiagnosisCodesCount,
      policiesCount,
      policyProcedureCodesCount,
      policyDiagnosisCodesCount,
      policyModifiersCount,
      policyPlacesOfServiceCount,
      policyReferenceDocsCount,
      policyRelatedPoliciesCount,
      patternsCount,
      patternClaimLinesCount,
      patternPoliciesCount,
      patternRelatedCodesCount,
      patternEvidenceCount,
      patternImprovementsCount,
      patternActionsCount,
      patternSnapshotsCount,
      learningEventsCount,
      providersCount,
      scenariosCount,
      dataSourcesCount,
      importHistoryCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(claims),
      db.select({ count: sql<number>`count(*)` }).from(claimLineItems),
      db.select({ count: sql<number>`count(*)` }).from(claimDiagnosisCodes),
      db.select({ count: sql<number>`count(*)` }).from(claimProcedureCodes),
      db.select({ count: sql<number>`count(*)` }).from(claimLinePolicies),
      db.select({ count: sql<number>`count(*)` }).from(claimAppeals),
      db.select({ count: sql<number>`count(*)` }).from(lineItemModifiers),
      db.select({ count: sql<number>`count(*)` }).from(lineItemDiagnosisCodes),
      db.select({ count: sql<number>`count(*)` }).from(policies),
      db.select({ count: sql<number>`count(*)` }).from(policyProcedureCodes),
      db.select({ count: sql<number>`count(*)` }).from(policyDiagnosisCodes),
      db.select({ count: sql<number>`count(*)` }).from(policyModifiers),
      db.select({ count: sql<number>`count(*)` }).from(policyPlacesOfService),
      db.select({ count: sql<number>`count(*)` }).from(policyReferenceDocs),
      db.select({ count: sql<number>`count(*)` }).from(policyRelatedPolicies),
      db.select({ count: sql<number>`count(*)` }).from(patterns),
      db.select({ count: sql<number>`count(*)` }).from(patternClaimLines),
      db.select({ count: sql<number>`count(*)` }).from(patternPolicies),
      db.select({ count: sql<number>`count(*)` }).from(patternRelatedCodes),
      db.select({ count: sql<number>`count(*)` }).from(patternEvidence),
      db.select({ count: sql<number>`count(*)` }).from(patternImprovements),
      db.select({ count: sql<number>`count(*)` }).from(patternActions),
      db.select({ count: sql<number>`count(*)` }).from(patternSnapshots),
      db.select({ count: sql<number>`count(*)` }).from(learningEvents),
      db.select({ count: sql<number>`count(*)` }).from(providers),
      db.select({ count: sql<number>`count(*)` }).from(scenarios),
      db.select({ count: sql<number>`count(*)` }).from(dataSources),
      db.select({ count: sql<number>`count(*)` }).from(importHistory),
    ])

    return {
      claims: {
        claims: claimsCount[0]?.count || 0,
        lineItems: claimLineItemsCount[0]?.count || 0,
        diagnosisCodes: claimDiagnosisCodesCount[0]?.count || 0,
        procedureCodes: claimProcedureCodesCount[0]?.count || 0,
        linePolicies: claimLinePoliciesCount[0]?.count || 0,
        appeals: claimAppealsCount[0]?.count || 0,
        lineItemModifiers: lineItemModifiersCount[0]?.count || 0,
        lineItemDiagnosisCodes: lineItemDiagnosisCodesCount[0]?.count || 0,
      },
      policies: {
        policies: policiesCount[0]?.count || 0,
        procedureCodes: policyProcedureCodesCount[0]?.count || 0,
        diagnosisCodes: policyDiagnosisCodesCount[0]?.count || 0,
        modifiers: policyModifiersCount[0]?.count || 0,
        placesOfService: policyPlacesOfServiceCount[0]?.count || 0,
        referenceDocs: policyReferenceDocsCount[0]?.count || 0,
        relatedPolicies: policyRelatedPoliciesCount[0]?.count || 0,
      },
      patterns: {
        patterns: patternsCount[0]?.count || 0,
        claimLines: patternClaimLinesCount[0]?.count || 0,
        policies: patternPoliciesCount[0]?.count || 0,
        relatedCodes: patternRelatedCodesCount[0]?.count || 0,
        evidence: patternEvidenceCount[0]?.count || 0,
        improvements: patternImprovementsCount[0]?.count || 0,
        actions: patternActionsCount[0]?.count || 0,
        snapshots: patternSnapshotsCount[0]?.count || 0,
      },
      other: {
        learningEvents: learningEventsCount[0]?.count || 0,
        providers: providersCount[0]?.count || 0,
        scenarios: scenariosCount[0]?.count || 0,
        dataSources: dataSourcesCount[0]?.count || 0,
        importHistory: importHistoryCount[0]?.count || 0,
      },
    }
  } catch (error) {
    console.error('Database stats error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch database stats',
    })
  }
})
