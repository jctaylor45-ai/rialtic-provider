/**
 * Pattern Detection Metrics API Endpoint
 *
 * GET /api/v1/metrics/patterns
 *
 * Returns auto-detected denial patterns from claim analysis.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { detectPatterns, linkPatternsToDatabase } from '~/server/services/patternDetection'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30
    const linkToDb = query.link === 'true'

    const detected = await detectPatterns(days)

    // Optionally link detected patterns to database
    let linkedCount = 0
    if (linkToDb) {
      linkedCount = await linkPatternsToDatabase(detected)
    }

    return {
      detectedPatterns: detected,
      summary: {
        totalDetected: detected.length,
        totalClaimsAffected: detected.reduce((sum, p) => sum + p.denialCount, 0),
        totalAmountAtRisk: detected.reduce((sum, p) => sum + p.totalDeniedAmount, 0),
        topCategories: detected.slice(0, 5).map(p => ({
          category: p.category,
          keyword: p.keyword,
          confidence: p.confidence,
        })),
      },
      linked: linkToDb ? linkedCount : null,
      period: { days },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Pattern detection error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to detect patterns',
    })
  }
})
