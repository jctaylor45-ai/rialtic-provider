/**
 * Policies List API Endpoint
 *
 * GET /api/v1/policies
 *
 * Returns paginated policies list with impact metrics.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '~/server/database'
import { policies, policyProcedureCodes, policyDiagnosisCodes } from '~/server/database/schema'
import { eq, desc, and, like, sql, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const offset = parseInt(query.offset as string) || 0
    const mode = query.mode as string | undefined
    const topic = query.topic as string | undefined
    const search = query.search as string | undefined

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
      .select({
        id: policies.id,
        name: policies.name,
        mode: policies.mode,
        effectiveDate: policies.effectiveDate,
        description: policies.description,
        clinicalRationale: policies.clinicalRationale,
        topic: policies.topic,
        logicType: policies.logicType,
        source: policies.source,
        hitRate: policies.hitRate,
        denialRate: policies.denialRate,
        appealRate: policies.appealRate,
        overturnRate: policies.overturnRate,
        impact: policies.impact,
        insightCount: policies.insightCount,
        providersImpacted: policies.providersImpacted,
        trend: policies.trend,
        commonMistake: policies.commonMistake,
        fixGuidance: policies.fixGuidance,
      })
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

    // Get procedure and diagnosis codes for each policy
    const policiesWithCodes = await Promise.all(
      policiesList.map(async (policy) => {
        const procedureCodes = await db
          .select({ code: policyProcedureCodes.code })
          .from(policyProcedureCodes)
          .where(eq(policyProcedureCodes.policyId, policy.id))

        const diagnosisCodes = await db
          .select({ code: policyDiagnosisCodes.code })
          .from(policyDiagnosisCodes)
          .where(eq(policyDiagnosisCodes.policyId, policy.id))

        return {
          ...policy,
          procedureCodes: procedureCodes.map(c => c.code),
          diagnosisCodes: diagnosisCodes.map(c => c.code),
        }
      })
    )

    return {
      data: policiesWithCodes,
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
