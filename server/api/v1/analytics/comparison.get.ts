/**
 * GET /api/v1/analytics/comparison
 *
 * Compare metrics between two time periods
 */

import { getAnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Get custom dates or use defaults (last 30 days vs previous 30 days)
  const current = new Date()
  const defaultPeriod2End = current.toISOString().split('T')[0]!
  const defaultPeriod2Start = new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]!
  const defaultPeriod1End = defaultPeriod2Start
  const defaultPeriod1Start = new Date(
    new Date(defaultPeriod2Start).getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0]!

  const period1Start = (query.period1Start as string) || defaultPeriod1Start
  const period1End = (query.period1End as string) || defaultPeriod1End
  const period2Start = (query.period2Start as string) || defaultPeriod2Start
  const period2End = (query.period2End as string) || defaultPeriod2End

  const engine = getAnalyticsEngine()
  const comparison = await engine.comparePeriods(
    { start: period1Start, end: period1End },
    { start: period2Start, end: period2End }
  )

  return {
    comparison,
    generatedAt: new Date().toISOString(),
  }
})
