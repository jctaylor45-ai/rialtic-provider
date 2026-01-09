/**
 * GET /api/v1/analytics/trends
 *
 * Returns time-series trend data for specified metrics
 */

import { getAnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 90, 1), 365)
  const groupBy = (query.groupBy as 'day' | 'week' | 'month') || 'day'
  const metric = (query.metric as string) || 'denialRate'

  const engine = getAnalyticsEngine()

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0]!
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]!

  let data
  switch (metric) {
    case 'denialRate':
      data = await engine.getDenialRateTrend(startDate, endDate, groupBy)
      break
    case 'revenueImpact':
      data = await engine.getRevenueImpactTrend(startDate, endDate)
      break
    case 'claimVolume':
      data = await engine.getClaimVolumeByStatus(startDate, endDate, groupBy)
      break
    default:
      data = await engine.getDenialRateTrend(startDate, endDate, groupBy)
  }

  return {
    metric,
    period: {
      days,
      startDate,
      endDate,
      groupBy,
    },
    data,
    generatedAt: new Date().toISOString(),
  }
})
