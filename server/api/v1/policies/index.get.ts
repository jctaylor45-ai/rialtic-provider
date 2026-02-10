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
} from '~/server/database/schema'
import { eq, desc, and, like, sql, count, sum } from 'drizzle-orm'
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

    // First, compute metrics for all policies from claim_line_policies
    // Hit Rate = % of claim lines that hit the policy
    // Denial Rate = % of claim lines that hit the policy that are denied
    const [totalClaimLinesResult] = await db
      .select({ count: count() })
      .from(claimLineItems)

    const totalClaimLines = totalClaimLinesResult?.count || 1 // Avoid division by zero

    // Get policy metrics aggregated from claim_line_policies
    const policyMetrics = await db
      .select({
        policyId: claimLinePolicies.policyId,
        totalHits: count(),
        deniedHits: sql<number>`SUM(CASE WHEN ${claimLinePolicies.isDenied} = 1 THEN 1 ELSE 0 END)`,
        totalImpact: sql<number>`COALESCE(SUM(${claimLinePolicies.deniedAmount}), 0)`,
      })
      .from(claimLinePolicies)
      .groupBy(claimLinePolicies.policyId)

    // Create a map for quick lookup
    // Rates are stored as whole number percentages (3 = 3%) for consistency with rest of app
    const metricsMap = new Map(
      policyMetrics.map(m => [m.policyId, {
        hitRate: (m.totalHits / totalClaimLines) * 100,
        denialRate: m.totalHits > 0 ? ((m.deniedHits || 0) / m.totalHits) * 100 : 0,
        impact: m.totalImpact || 0,
      }])
    )

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

    // Bulk-fetch all related data in parallel (5 queries total instead of 5 * N)
    const [
      allProcedureCodes,
      allDiagnosisCodes,
      allModifiers,
      allPlacesOfService,
      allReferenceDocs,
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

    // Transform policies using bulk-fetched related data
    const transformedPolicies = policiesList.map((policy) => {
      const basePolicy = policyListAdapter(
        policy as unknown as DbPolicy,
        procedureCodesByPolicy.get(policy.id) || [],
        diagnosisCodesByPolicy.get(policy.id) || [],
        modifiersByPolicy.get(policy.id) || [],
        placesByPolicy.get(policy.id) || [],
        (refDocsByPolicy.get(policy.id) || []) as DbReferenceDoc[],
      )

      // Merge computed metrics from claim_line_policies
      const metrics = metricsMap.get(policy.id)
      if (metrics) {
        return {
          ...basePolicy,
          hit_rate: metrics.hitRate,
          denial_rate: metrics.denialRate,
          impact: metrics.impact,
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
