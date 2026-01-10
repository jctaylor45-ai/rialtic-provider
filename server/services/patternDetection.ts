/**
 * Pattern Detection Service
 *
 * Automatically detects denial patterns by analyzing claim data.
 * Computes denial metrics and identifies common issues.
 */

import { db } from '~/server/database'
import { claims, patterns, patternClaimLines, claimLineItems } from '~/server/database/schema'
import { eq, sql, and, gte, count, sum, desc } from 'drizzle-orm'

// =============================================================================
// TYPES
// =============================================================================

export interface DetectedPattern {
  category: string
  keyword: string
  frequency: number
  denialCount: number
  totalDeniedAmount: number
  averageDenialAmount: number
  confidence: number
  claimIds: string[]
}

export interface DenialMetrics {
  totalClaims: number
  deniedClaims: number
  denialRate: number
  totalBilledAmount: number
  totalDeniedAmount: number
  averageDeniedAmount: number
  potentialRecovery: number
  topDenialReasons: Array<{
    reason: string
    count: number
    amount: number
  }>
}

// =============================================================================
// PATTERN DETECTION KEYWORDS
// =============================================================================

const PATTERN_KEYWORDS = {
  'modifier-missing': ['Modifier', 'modifier', '-25', '-59', '-76', '-77'],
  'documentation': ['documentation', 'medical necessity', 'insufficient', 'records'],
  'authorization': ['authorization', 'prior auth', 'pre-authorization', 'not authorized'],
  'bundling': ['Unbundled', 'bundle', 'bundling', 'included'],
  'frequency': ['frequency', 'limit', 'exceeded', 'too many'],
  'coding-specificity': ['specificity', 'unspecified', 'more specific', 'ICD-10'],
  'timing': ['timely', 'late', 'deadline', 'expired'],
  'medical-necessity': ['medical necessity', 'not medically necessary', 'experimental'],
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

/**
 * Detect patterns by analyzing denied claims
 * Looks for common denial reasons and procedural issues
 */
export async function detectPatterns(lookbackDays: number = 30): Promise<DetectedPattern[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString().split('T')[0] as string

  // Get all denied claims in lookback period
  const deniedClaims = await db
    .select({
      id: claims.id,
      denialReason: claims.denialReason,
      billedAmount: claims.billedAmount,
      dateOfService: claims.dateOfService,
    })
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))

  const patternsMap: Map<string, DetectedPattern> = new Map()

  for (const claim of deniedClaims) {
    if (!claim.denialReason) continue

    // Check each pattern category
    for (const [category, keywords] of Object.entries(PATTERN_KEYWORDS)) {
      const matches = keywords.some(keyword =>
        claim.denialReason?.toLowerCase().includes(keyword.toLowerCase())
      )

      if (matches) {
        addToPattern(patternsMap, category, claim)
      }
    }
  }

  // Convert to array and calculate confidence
  return Array.from(patternsMap.values())
    .map(p => ({
      ...p,
      averageDenialAmount: p.denialCount > 0 ? Math.round(p.totalDeniedAmount / p.denialCount) : 0,
      confidence: calculateConfidence(p.frequency, p.denialCount, p.totalDeniedAmount),
    }))
    .sort((a, b) => b.confidence - a.confidence)
}

function addToPattern(
  patternsMap: Map<string, DetectedPattern>,
  category: string,
  claim: { id: string; denialReason: string | null; billedAmount: number | null }
) {
  const keyword = getCategoryTitle(category)

  if (!patternsMap.has(category)) {
    patternsMap.set(category, {
      category,
      keyword,
      frequency: 0,
      denialCount: 0,
      totalDeniedAmount: 0,
      averageDenialAmount: 0,
      confidence: 0,
      claimIds: [],
    })
  }

  const pattern = patternsMap.get(category)!
  pattern.frequency++
  pattern.denialCount++
  pattern.totalDeniedAmount += claim.billedAmount || 0
  pattern.claimIds.push(claim.id)
}

function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    'modifier-missing': 'Missing or Incorrect Modifier',
    'documentation': 'Documentation Issue',
    'authorization': 'Prior Authorization Required',
    'bundling': 'Unbundled/Bundled Codes',
    'frequency': 'Frequency Limit Exceeded',
    'coding-specificity': 'Code Specificity Required',
    'timing': 'Timely Filing Issue',
    'medical-necessity': 'Medical Necessity Not Met',
  }
  return titles[category] || category
}

function calculateConfidence(frequency: number, denialCount: number, totalAmount: number): number {
  // Confidence based on:
  // - Frequency (how often it occurs)
  // - Amount at risk (higher = more important)
  // - Consistency (same pattern appearing repeatedly)

  const frequencyScore = Math.min(frequency * 5, 40) // Max 40 points
  const amountScore = Math.min(totalAmount / 1000, 40) // Max 40 points for $40k+
  const consistencyScore = Math.min((denialCount / frequency) * 20, 20) // Max 20 points

  return Math.round(frequencyScore + amountScore + consistencyScore)
}

// =============================================================================
// DENIAL METRICS
// =============================================================================

/**
 * Calculate comprehensive denial metrics for a time period
 */
export async function calculateDenialMetrics(lookbackDays: number = 30): Promise<DenialMetrics> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString().split('T')[0] as string

  // Total claims in period
  const [totalResult] = await db
    .select({ count: count(), total: sum(claims.billedAmount) })
    .from(claims)
    .where(gte(claims.dateOfService, startDateStr))

  // Denied claims
  const [deniedResult] = await db
    .select({ count: count(), total: sum(claims.billedAmount) })
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))

  // Top denial reasons
  const topReasons = await db
    .select({
      reason: claims.denialReason,
      count: sql<number>`count(*)`,
      amount: sum(claims.billedAmount),
    })
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))
    .groupBy(claims.denialReason)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  const totalClaims = totalResult?.count || 0
  const deniedClaims = deniedResult?.count || 0
  const totalBilledAmount = Number(totalResult?.total) || 0
  const totalDeniedAmount = Number(deniedResult?.total) || 0

  return {
    totalClaims,
    deniedClaims,
    denialRate: totalClaims > 0 ? Math.round((deniedClaims / totalClaims) * 10000) / 100 : 0,
    totalBilledAmount,
    totalDeniedAmount,
    averageDeniedAmount: deniedClaims > 0 ? Math.round(totalDeniedAmount / deniedClaims) : 0,
    potentialRecovery: Math.round(totalDeniedAmount * 0.4), // Estimate 40% recoverable
    topDenialReasons: topReasons.map(r => ({
      reason: r.reason || 'Unknown',
      count: r.count,
      amount: Number(r.amount) || 0,
    })),
  }
}

// =============================================================================
// PATTERN-CLAIM LINE LINKING
// =============================================================================

/**
 * Link detected patterns to claim lines in the database
 * Patterns link to claim LINES, not claims - denials happen at line level
 * Updates the patternClaimLines junction table
 */
export async function linkPatternsToDatabase(detectedPatterns: DetectedPattern[]): Promise<number> {
  let linked = 0

  for (const detected of detectedPatterns) {
    // Find or create pattern in database
    const [existingPattern] = await db
      .select()
      .from(patterns)
      .where(eq(patterns.category, detected.category as typeof patterns.category.enumValues[number]))
      .limit(1)

    if (existingPattern) {
      // For each claim, link its denied line items to the pattern
      for (const claimId of detected.claimIds) {
        // Get line items for this claim
        const lineItems = await db
          .select()
          .from(claimLineItems)
          .where(eq(claimLineItems.claimId, claimId))

        for (const lineItem of lineItems) {
          try {
            await db.insert(patternClaimLines).values({
              patternId: existingPattern.id,
              lineItemId: lineItem.id,
              deniedAmount: lineItem.billedAmount || 0,
              denialDate: new Date().toISOString().split('T')[0],
            }).onConflictDoNothing()
            linked++
          } catch {
            // Ignore duplicate links
          }
        }
      }

      // Update pattern metrics - totalAtRisk is computed from linked lines
      const [totalResult] = await db
        .select({
          totalAtRisk: sql<number>`COALESCE(SUM(${patternClaimLines.deniedAmount}), 0)`,
          lineCount: count(),
        })
        .from(patternClaimLines)
        .where(eq(patternClaimLines.patternId, existingPattern.id))

      await db
        .update(patterns)
        .set({
          currentClaimCount: totalResult?.lineCount || 0,
          currentDollarsDenied: totalResult?.totalAtRisk || 0,
          totalAtRisk: totalResult?.totalAtRisk || 0,
          scoreFrequency: detected.frequency,
          scoreImpact: totalResult?.totalAtRisk || 0,
          scoreConfidence: detected.confidence / 100,
        })
        .where(eq(patterns.id, existingPattern.id))
    }
  }

  return linked
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Calculate denial trend over multiple periods
 */
export async function calculateDenialTrend(periods: number = 4, periodDays: number = 7) {
  const trends = []

  for (let i = 0; i < periods; i++) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - (i * periodDays))
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - periodDays)

    const startDateStr = startDate.toISOString().split('T')[0] as string
    const endDateStr = endDate.toISOString().split('T')[0] as string

    const [totalResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(
        gte(claims.dateOfService, startDateStr),
        sql`${claims.dateOfService} < ${endDateStr}`
      ))

    const [deniedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(and(
        eq(claims.status, 'denied'),
        gte(claims.dateOfService, startDateStr),
        sql`${claims.dateOfService} < ${endDateStr}`
      ))

    const total = totalResult?.count || 0
    const denied = deniedResult?.count || 0

    trends.unshift({
      period: i + 1,
      startDate: startDateStr,
      endDate: endDateStr,
      totalClaims: total,
      deniedClaims: denied,
      denialRate: total > 0 ? Math.round((denied / total) * 10000) / 100 : 0,
    })
  }

  // Calculate trend direction
  const firstPeriod = trends[0]
  const lastPeriod = trends[trends.length - 1]
  const trend = lastPeriod && firstPeriod
    ? lastPeriod.denialRate < firstPeriod.denialRate ? 'improving'
    : lastPeriod.denialRate > firstPeriod.denialRate ? 'worsening'
    : 'stable'
    : 'stable'

  return {
    periods: trends,
    trend,
    change: lastPeriod && firstPeriod
      ? Math.round((lastPeriod.denialRate - firstPeriod.denialRate) * 100) / 100
      : 0,
  }
}
