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
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
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
    // This gives us hit rate, denial rate, and impact based on actual claims
    const [totalClaimsResult] = await db
      .select({ count: count() })
      .from(claims)

    const totalClaims = totalClaimsResult?.count || 1 // Avoid division by zero

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
    const metricsMap = new Map(
      policyMetrics.map(m => [m.policyId, {
        hitRate: m.totalHits / totalClaims,
        denialRate: m.totalHits > 0 ? (m.deniedHits || 0) / m.totalHits : 0,
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

    // Query policies
    const policiesList = await db
      .select()
      .from(policies)
      .where(where)
      .orderBy(desc(policies.impact), desc(policies.denialRate))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(policies)
      .where(where)

    const total = totalResult?.count || 0

    // Get all related data for each policy and transform to PaAPI format
    const transformedPolicies = await Promise.all(
      policiesList.map(async (policy) => {
        // Fetch all related codes in parallel
        const [procedureCodes, diagnosisCodes, modifiers, placesOfService, referenceDocs] = await Promise.all([
          db.select({ code: policyProcedureCodes.code })
            .from(policyProcedureCodes)
            .where(eq(policyProcedureCodes.policyId, policy.id)),
          db.select({ code: policyDiagnosisCodes.code })
            .from(policyDiagnosisCodes)
            .where(eq(policyDiagnosisCodes.policyId, policy.id)),
          db.select({ modifier: policyModifiers.modifier })
            .from(policyModifiers)
            .where(eq(policyModifiers.policyId, policy.id)),
          db.select({ placeOfService: policyPlacesOfService.placeOfService })
            .from(policyPlacesOfService)
            .where(eq(policyPlacesOfService.policyId, policy.id)),
          db.select()
            .from(policyReferenceDocs)
            .where(eq(policyReferenceDocs.policyId, policy.id)),
        ])

        const basePolicy = policyListAdapter(
          policy as unknown as DbPolicy,
          procedureCodes.map(c => c.code),
          diagnosisCodes.map(c => c.code),
          modifiers.map(m => m.modifier),
          placesOfService.map(p => p.placeOfService),
          referenceDocs as DbReferenceDoc[],
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
    )

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
