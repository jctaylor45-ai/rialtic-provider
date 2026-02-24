/**
 * Policies List API Endpoint
 *
 * GET /api/v1/policies
 *
 * Returns paginated policies list in PaAPI-compatible format.
 * Data source is determined by app settings (local DB or PaAPI).
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import {
  policies,
  policyProcedureCodes,
  policyDiagnosisCodes,
  policyModifiers,
  policyPlacesOfService,
  policyReferenceDocs,
  claimLinePolicies,
  claimLineItems,
  claims,
  claimAppeals,
  patternClaimLines,
  patterns,
} from '~/server/database/schema'
import { eq, desc, and, like, sql, count } from 'drizzle-orm'
import { policyListAdapter, type DbPolicy, type DbReferenceDoc } from '~/server/utils/policyAdapter'
import { getDataSourceConfig, fetchFromPaAPI } from '~/server/utils/dataSource'

interface PaapiPoliciesResponse {
  data: unknown[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawLimit = parseInt(query.limit as string)
    // limit=0 means "return all"; otherwise default to 50
    const limit = rawLimit === 0 ? 0 : (rawLimit || 50)
    const offset = parseInt(query.offset as string) || 0
    const mode = query.mode as string | undefined
    const topic = query.topic as string | undefined
    const search = query.search as string | undefined

    // Check data source configuration
    const dataSourceConfig = await getDataSourceConfig()

    // If PaAPI is configured, fetch from remote
    if (dataSourceConfig.source === 'paapi' && dataSourceConfig.paapi) {
      const params: Record<string, string | number | undefined> = {
        limit,
        offset,
        mode,
        topic,
        search,
      }

      const response = await fetchFromPaAPI<PaapiPoliciesResponse>(
        dataSourceConfig.paapi,
        '/api/v1/policies',
        { params }
      )

      return response
    }

    // Local database source

    // Compute comprehensive metrics for policies with claim data.
    // claim_line_policies only contains denied claim lines, so we derive the
    // true denial rate from the linked patterns' current_denial_rate.

    const [totalClaimsResult] = await db
      .select({ count: count() })
      .from(claims)

    const totalClaimsCount = totalClaimsResult?.count || 1

    // Run 3 targeted queries in parallel to avoid cross-join inflation
    const [coreMetrics, appealMetrics, patternMetrics] = await Promise.all([
      // Query A: Core metrics per policy (denied counts, impact, providers)
      db
        .select({
          policyId: claimLinePolicies.policyId,
          deniedLines: count(),
          totalImpact: sql<number>`COALESCE(SUM(${claimLinePolicies.deniedAmount}), 0)`,
          deniedClaims: sql<number>`COUNT(DISTINCT ${claims.id})`,
          providersImpacted: sql<number>`COUNT(DISTINCT ${claims.providerId})`,
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .innerJoin(claims, eq(claimLineItems.claimId, claims.id))
        .groupBy(claimLinePolicies.policyId),

      // Query B: Appeal metrics per policy
      db
        .select({
          policyId: claimLinePolicies.policyId,
          appealsFiled: sql<number>`COUNT(DISTINCT CASE WHEN ${claimAppeals.appealFiled} = 1 THEN ${claimAppeals.claimId} END)`,
          overturned: sql<number>`COUNT(DISTINCT CASE WHEN ${claimAppeals.appealOutcome} = 'overturned' THEN ${claimAppeals.claimId} END)`,
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .innerJoin(claimAppeals, eq(claimLineItems.claimId, claimAppeals.claimId))
        .groupBy(claimLinePolicies.policyId),

      // Query C: Distinct (policy, pattern, denialRate) triples via claim chain
      db
        .selectDistinct({
          policyId: claimLinePolicies.policyId,
          patternId: patternClaimLines.patternId,
          currentDenialRate: patterns.currentDenialRate,
        })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id))
        .innerJoin(patternClaimLines, eq(claimLineItems.id, patternClaimLines.lineItemId))
        .innerJoin(patterns, eq(patternClaimLines.patternId, patterns.id)),
    ])

    // Build lookup maps
    const appealMap = new Map(appealMetrics.map(m => [m.policyId, m]))

    // Aggregate pattern data per policy from the distinct triples
    const patternDataByPolicy = new Map<string, { patternCount: number; avgDenialRate: number }>()
    const tempMap = new Map<string, { patternIds: Set<string>; totalRate: number }>()
    for (const link of patternMetrics) {
      const existing = tempMap.get(link.policyId) || { patternIds: new Set<string>(), totalRate: 0 }
      if (!existing.patternIds.has(link.patternId)) {
        existing.patternIds.add(link.patternId)
        existing.totalRate += link.currentDenialRate || 0
      }
      tempMap.set(link.policyId, existing)
    }
    for (const [policyId, data] of tempMap) {
      patternDataByPolicy.set(policyId, {
        patternCount: data.patternIds.size,
        avgDenialRate: data.patternIds.size > 0 ? data.totalRate / data.patternIds.size : 0,
      })
    }

    // Create a unified metrics map
    // Rates are whole number percentages (8 = 8%) for consistency with rest of app
    const metricsMap = new Map<string, {
      hitRate: number
      denialRate: number
      appealRate: number
      overturnRate: number
      impact: number
      insightCount: number
      providersImpacted: number
    }>()

    for (const core of coreMetrics) {
      const appeal = appealMap.get(core.policyId)
      const patternData = patternDataByPolicy.get(core.policyId)

      const deniedClaims = Number(core.deniedClaims) || 0
      const appealsFiled = Number(appeal?.appealsFiled) || 0
      const overturned = Number(appeal?.overturned) || 0
      const avgDenialRate = patternData?.avgDenialRate || 0

      // Denial rate from linked patterns (stored as decimal 0.08 → convert to 8%)
      const denialRate = avgDenialRate * 100

      // Hit rate: estimate total claims evaluated from denied count and denial rate,
      // then express as % of total claims
      const estimatedEvaluated = avgDenialRate > 0 ? deniedClaims / avgDenialRate : deniedClaims
      const hitRate = (estimatedEvaluated / totalClaimsCount) * 100

      // Appeal rate: appeals filed / denied claims
      const appealRate = deniedClaims > 0 ? (appealsFiled / deniedClaims) * 100 : 0

      // Overturn rate: overturned / appeals filed
      const overturnRate = appealsFiled > 0 ? (overturned / appealsFiled) * 100 : 0

      metricsMap.set(core.policyId, {
        hitRate: Math.round(hitRate * 100) / 100,
        denialRate: Math.round(denialRate * 100) / 100,
        appealRate: Math.round(appealRate * 100) / 100,
        overturnRate: Math.round(overturnRate * 100) / 100,
        impact: Number(core.totalImpact) || 0,
        insightCount: patternData?.patternCount || 0,
        providersImpacted: Number(core.providersImpacted) || 0,
      })
    }

    // Build where conditions
    const whereConditions: ReturnType<typeof eq>[] = []

    if (mode) {
      whereConditions.push(eq(policies.mode, mode as typeof policies.mode.enumValues[number]))
    }

    if (topic) {
      whereConditions.push(eq(policies.topic, topic))
    }

    if (search) {
      whereConditions.push(like(policies.name, `%${search}%`))
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Query policies (limit=0 means return all)
    const policiesQuery = db
      .select()
      .from(policies)
      .where(where)
      .orderBy(desc(policies.impact), desc(policies.denialRate))

    if (limit > 0) {
      policiesQuery.limit(limit).offset(offset)
    }

    const policiesList = await policiesQuery

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(policies)
      .where(where)

    const total = totalResult?.count || 0

    // Bulk-fetch all related data in parallel (6 queries total instead of 6 * N)
    const [
      allProcedureCodes,
      allDiagnosisCodes,
      allModifiers,
      allPlacesOfService,
      allReferenceDocs,
      claimDerivedCodes,
    ] = await Promise.all([
      db.select({ policyId: policyProcedureCodes.policyId, code: policyProcedureCodes.code })
        .from(policyProcedureCodes),
      db.select({ policyId: policyDiagnosisCodes.policyId, code: policyDiagnosisCodes.code })
        .from(policyDiagnosisCodes),
      db.select({ policyId: policyModifiers.policyId, modifier: policyModifiers.modifier })
        .from(policyModifiers),
      db.select({ policyId: policyPlacesOfService.policyId, placeOfService: policyPlacesOfService.placeOfService })
        .from(policyPlacesOfService),
      db.select()
        .from(policyReferenceDocs),
      // Fallback: derive procedure codes from linked claim lines for policies without junction table codes
      db.selectDistinct({
        policyId: claimLinePolicies.policyId,
        procedureCode: claimLineItems.procedureCode,
      })
        .from(claimLinePolicies)
        .innerJoin(claimLineItems, eq(claimLinePolicies.lineItemId, claimLineItems.id)),
    ])

    // Group related data by policyId for O(1) lookup
    const procedureCodesByPolicy = new Map<string, string[]>()
    for (const row of allProcedureCodes) {
      const arr = procedureCodesByPolicy.get(row.policyId) || []
      arr.push(row.code)
      procedureCodesByPolicy.set(row.policyId, arr)
    }

    const diagnosisCodesByPolicy = new Map<string, string[]>()
    for (const row of allDiagnosisCodes) {
      const arr = diagnosisCodesByPolicy.get(row.policyId) || []
      arr.push(row.code)
      diagnosisCodesByPolicy.set(row.policyId, arr)
    }

    const modifiersByPolicy = new Map<string, string[]>()
    for (const row of allModifiers) {
      const arr = modifiersByPolicy.get(row.policyId) || []
      arr.push(row.modifier)
      modifiersByPolicy.set(row.policyId, arr)
    }

    const placesByPolicy = new Map<string, string[]>()
    for (const row of allPlacesOfService) {
      const arr = placesByPolicy.get(row.policyId) || []
      arr.push(row.placeOfService)
      placesByPolicy.set(row.policyId, arr)
    }

    const refDocsByPolicy = new Map<string, typeof allReferenceDocs>()
    for (const row of allReferenceDocs) {
      const arr = refDocsByPolicy.get(row.policyId) || []
      arr.push(row)
      refDocsByPolicy.set(row.policyId, arr)
    }

    // Claim-derived procedure codes as fallback for policies without junction table codes
    const claimCodesByPolicy = new Map<string, string[]>()
    for (const row of claimDerivedCodes) {
      const arr = claimCodesByPolicy.get(row.policyId) || []
      arr.push(row.procedureCode)
      claimCodesByPolicy.set(row.policyId, arr)
    }

    // Transform policies using bulk-fetched related data
    const transformedPolicies = policiesList.map((policy) => {
      // Use junction table codes, falling back to claim-derived codes
      const junctionCodes = procedureCodesByPolicy.get(policy.id) || []
      const procCodes = junctionCodes.length > 0 ? junctionCodes : (claimCodesByPolicy.get(policy.id) || [])

      const basePolicy = policyListAdapter(
        policy as unknown as DbPolicy,
        procCodes,
        diagnosisCodesByPolicy.get(policy.id) || [],
        modifiersByPolicy.get(policy.id) || [],
        placesByPolicy.get(policy.id) || [],
        (refDocsByPolicy.get(policy.id) || []) as DbReferenceDoc[],
      )

      // Fix generic common_mistake for scenario stubs (e.g. "Common in modifier missing patterns")
      if (basePolicy.common_mistake && /^Common in .+ patterns$/.test(basePolicy.common_mistake)) {
        basePolicy.common_mistake = `Submitting claims that do not meet this policy's requirements: ${policy.name.toLowerCase()}.`
      }

      // Merge computed metrics from claim data
      const metrics = metricsMap.get(policy.id)
      if (metrics) {
        return {
          ...basePolicy,
          hit_rate: metrics.hitRate,
          denial_rate: metrics.denialRate,
          appeal_rate: metrics.appealRate,
          overturn_rate: metrics.overturnRate,
          impact: metrics.impact,
          insight_count: metrics.insightCount,
          providers_impacted: metrics.providersImpacted,
        }
      }

      return basePolicy
    })

    return {
      data: transformedPolicies,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total,
      },
    }
  } catch (error) {
    console.error('Policies endpoint error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch policies',
    })
  }
})
