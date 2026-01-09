/**
 * GET /api/v1/analytics/providers
 *
 * Provider performance analytics
 */

import { getAnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 30, 1), 365)
  const limit = Math.min(Math.max(parseInt(query.limit as string) || 20, 1), 100)
  const sortBy = (query.sortBy as string) || 'deniedAmount'

  const engine = getAnalyticsEngine()

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0]!
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]!

  let providers = await engine.getProviderPerformance(startDate, endDate)

  // Sort by specified field
  switch (sortBy) {
    case 'denialRate':
      providers = providers.sort((a, b) => parseFloat(b.denialRate) - parseFloat(a.denialRate))
      break
    case 'deniedAmount':
      providers = providers.sort((a, b) => b.deniedAmount - a.deniedAmount)
      break
    case 'totalClaims':
      providers = providers.sort((a, b) => b.totalClaims - a.totalClaims)
      break
  }

  // Calculate summary stats
  const totalProviders = providers.length
  const avgDenialRate = providers.length > 0
    ? providers.reduce((sum, p) => sum + parseFloat(p.denialRate), 0) / providers.length
    : 0
  const totalDeniedAmount = providers.reduce((sum, p) => sum + p.deniedAmount, 0)

  return {
    period: {
      days,
      startDate,
      endDate,
    },
    providers: providers.slice(0, limit),
    summary: {
      totalProviders,
      avgDenialRate: avgDenialRate.toFixed(2),
      totalDeniedAmount: Math.round(totalDeniedAmount * 100) / 100,
      providersAbove10Percent: providers.filter(p => parseFloat(p.denialRate) > 10).length,
    },
    pagination: {
      total: totalProviders,
      limit,
      hasMore: totalProviders > limit,
    },
    generatedAt: new Date().toISOString(),
  }
})
