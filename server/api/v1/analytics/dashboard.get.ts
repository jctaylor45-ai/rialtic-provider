/**
 * GET /api/v1/analytics/dashboard
 *
 * Returns comprehensive dashboard KPIs and metrics
 */

import { getAnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 30, 1), 365)

  const engine = getAnalyticsEngine()

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0]!
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]!

  const kpis = await engine.getDashboardKPIs(days)

  return {
    period: {
      days,
      startDate,
      endDate,
    },
    kpis,
    generatedAt: new Date().toISOString(),
  }
})
