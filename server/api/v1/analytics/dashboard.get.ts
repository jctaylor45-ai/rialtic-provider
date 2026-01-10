/**
 * GET /api/v1/analytics/dashboard
 *
 * Returns comprehensive dashboard KPIs and metrics.
 * Data source is determined by app settings (local DB or PaAPI).
 */

import { getAnalyticsEngine } from '~/server/services/analyticsEngine'
import { getDataSourceConfig, fetchDashboardFromPaAPI } from '~/server/utils/dataSource'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 30, 1), 365)

  // Check data source configuration
  const dataSourceConfig = await getDataSourceConfig()

  // If PaAPI is configured, fetch from remote
  if (dataSourceConfig.source === 'paapi' && dataSourceConfig.paapi) {
    try {
      const response = await fetchDashboardFromPaAPI(dataSourceConfig.paapi, { days })

      // Validate basic structure
      if (response && response.kpis) {
        return response
      }
      console.warn('Invalid dashboard response from PaAPI, falling back to local')
    } catch (error) {
      console.error('PaAPI dashboard fetch failed, falling back to local:', error)
      // Fall through to local analytics engine
    }
  }

  // Local analytics engine
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
