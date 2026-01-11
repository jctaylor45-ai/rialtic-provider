# Database Migration: Technical Implementation Guide

**Version**: 1.0  
**Date**: January 9, 2026  
**Companion to**: DATABASE_MIGRATION_REVIEW.md

---

## Table of Contents

1. [SQL Schema Changes](#sql-schema-changes)
2. [API Layer Implementation](#api-layer-implementation)
3. [Computation Service Examples](#computation-service-examples)
4. [Query Optimization](#query-optimization)
5. [Migration Script Templates](#migration-script-templates)

---

## SQL Schema Changes

### Adding Computed Fields to Existing Tables

#### 1. Patterns Table Enhancements

```sql
-- Add baseline period metrics
ALTER TABLE patterns ADD COLUMN baselineStart TEXT;
ALTER TABLE patterns ADD COLUMN baselineEnd TEXT;
ALTER TABLE patterns ADD COLUMN baselineClaimCount INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN baselineDeniedCount INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN baselineDenialRate REAL DEFAULT 0;
ALTER TABLE patterns ADD COLUMN baselineDollarsDenied REAL DEFAULT 0;

-- Add current period metrics
ALTER TABLE patterns ADD COLUMN currentStart TEXT;
ALTER TABLE patterns ADD COLUMN currentEnd TEXT;
ALTER TABLE patterns ADD COLUMN currentClaimCount INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN currentDeniedCount INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN currentDenialRate REAL DEFAULT 0;
ALTER TABLE patterns ADD COLUMN currentDollarsDenied REAL DEFAULT 0;

-- Computation tracking
ALTER TABLE patterns ADD COLUMN lastComputedAt TEXT;
ALTER TABLE patterns ADD COLUMN computationVersion INTEGER DEFAULT 1;
ALTER TABLE patterns ADD COLUMN computationStatus TEXT DEFAULT 'pending'; -- pending, computing, complete, error

-- Index for efficient lookups
CREATE INDEX idx_patterns_computed_at ON patterns(lastComputedAt);
CREATE INDEX idx_patterns_status_computed ON patterns(status, computationStatus);
```

#### 2. Policies Table Enhancements

```sql
-- Make metrics nullable (unknown until computed)
ALTER TABLE policies MODIFY hitRate REAL;
ALTER TABLE policies MODIFY denialRate REAL;
ALTER TABLE policies MODIFY appealRate REAL;
ALTER TABLE policies MODIFY overturnRate REAL;
ALTER TABLE policies MODIFY impact REAL;
ALTER TABLE policies MODIFY providersImpacted INTEGER;

-- Add computation tracking
ALTER TABLE policies ADD COLUMN lastComputedAt TEXT;
ALTER TABLE policies ADD COLUMN computationPeriodStart TEXT;
ALTER TABLE policies ADD COLUMN computationPeriodEnd TEXT;

-- Index for efficient updates
CREATE INDEX idx_policies_computed ON policies(lastComputedAt);
```

#### 3. Learning Events Enhancements

```sql
-- Normalize duration from metadata (milliseconds)
ALTER TABLE learning_events ADD COLUMN durationMs INTEGER;

-- Track practice outcomes
ALTER TABLE learning_events ADD COLUMN outcomeType TEXT CHECK(outcomeType IN ('correct', 'incorrect', 'skipped', 'incomplete'));
ALTER TABLE learning_events ADD COLUMN correctionApplied BOOLEAN DEFAULT FALSE;

-- Link to pattern and claim
ALTER TABLE learning_events ADD COLUMN patternId TEXT REFERENCES patterns(id) ON DELETE SET NULL;
ALTER TABLE learning_events ADD COLUMN claimId TEXT REFERENCES claims(id) ON DELETE SET NULL;

-- Index for efficient practice tracking
CREATE INDEX idx_learning_events_pattern ON learning_events(patternId, timestamp);
CREATE INDEX idx_learning_events_outcome ON learning_events(outcomeType, timestamp);
```

#### 4. Claim Line Items Enhancements

```sql
-- Link line items to denial reasons
ALTER TABLE claim_line_items ADD COLUMN denialDate TEXT;
ALTER TABLE claim_line_items ADD COLUMN denialReason TEXT;
ALTER TABLE claim_line_items ADD COLUMN patternsTriggered TEXT; -- JSON array of pattern IDs

-- Index for pattern matching
CREATE INDEX idx_claim_line_denial_reason ON claim_line_items(denialReason);
CREATE INDEX idx_claim_line_procedure ON claim_line_items(procedureCode);
```

### New Tables for Computed Metrics

#### 5. Pattern Daily Metrics (Time-Series)

```sql
CREATE TABLE pattern_daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patternId TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  metricDate TEXT NOT NULL,
  periodStart TEXT,        -- Period boundaries
  periodEnd TEXT,
  claimCount INTEGER DEFAULT 0,
  deniedCount INTEGER DEFAULT 0,
  denialRate REAL,
  dollarsDenied REAL DEFAULT 0,
  dollarsAtRisk REAL DEFAULT 0,
  appealCount INTEGER DEFAULT 0,
  appealRate REAL,
  overturnCount INTEGER DEFAULT 0,
  overturnRate REAL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(patternId, metricDate),
  INDEX idx_pattern_daily_date (patternId, metricDate),
  INDEX idx_pattern_daily_date_range (patternId, metricDate DESC)
);

-- Daily calculation query
-- Run once per day at midnight
INSERT INTO pattern_daily_metrics (
  patternId, metricDate, periodStart, periodEnd,
  claimCount, deniedCount, denialRate, dollarsDenied, appealCount
)
SELECT
  p.id,
  CURRENT_DATE,
  DATE(CURRENT_DATE || ' 00:00:00'),
  DATE(CURRENT_DATE || ' 23:59:59'),
  COUNT(c.id),
  COUNT(CASE WHEN c.status = 'denied' THEN 1 END),
  CAST(COUNT(CASE WHEN c.status = 'denied' THEN 1 END) AS REAL) / 
    NULLIF(COUNT(c.id), 0),
  COALESCE(SUM(CASE WHEN c.status = 'denied' THEN c.billed_amount ELSE 0 END), 0),
  COUNT(ca.id)
FROM patterns p
LEFT JOIN pattern_claims pc ON p.id = pc.pattern_id
LEFT JOIN claims c ON pc.claim_id = c.id AND DATE(c.date_of_service) = CURRENT_DATE
LEFT JOIN claim_appeals ca ON c.id = ca.claim_id AND DATE(ca.appeal_date) = CURRENT_DATE
WHERE p.status != 'archived'
GROUP BY p.id
ON CONFLICT(patternId, metricDate) DO UPDATE SET
  claimCount = excluded.claimCount,
  deniedCount = excluded.deniedCount,
  denialRate = excluded.denialRate,
  dollarsDenied = excluded.dollarsDenied,
  appealCount = excluded.appealCount;
```

#### 6. Policy Daily Metrics (Time-Series)

```sql
CREATE TABLE policy_daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policyId TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  metricDate TEXT NOT NULL,
  periodStart TEXT,
  periodEnd TEXT,
  hitCount INTEGER DEFAULT 0,           -- Claims matching this policy
  deniedCount INTEGER DEFAULT 0,
  denialRate REAL,
  dollarsDenied REAL DEFAULT 0,
  appealCount INTEGER DEFAULT 0,
  overturnCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(policyId, metricDate),
  INDEX idx_policy_daily_date (policyId, metricDate)
);
```

#### 7. Provider Performance (Aggregate)

```sql
CREATE TABLE provider_performance (
  id TEXT PRIMARY KEY,
  providerId TEXT NOT NULL UNIQUE REFERENCES providers(id) ON DELETE CASCADE,
  claimCount INTEGER DEFAULT 0,
  deniedCount INTEGER DEFAULT 0,
  denialRate REAL DEFAULT 0,
  totalBilled REAL DEFAULT 0,
  totalDenied REAL DEFAULT 0,
  appealCount INTEGER DEFAULT 0,
  overturnCount INTEGER DEFAULT 0,
  improvedPatterns INTEGER DEFAULT 0,      -- # of patterns this provider improved
  lastComputedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. Code Intelligence Table (New)

```sql
CREATE TABLE code_intelligence (
  id TEXT PRIMARY KEY,
  procedureCode TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,                          -- 'E&M', 'Surgery', 'Diagnostic', 'Lab', etc.
  averageReimbursement REAL,
  frequencyLimitCount INTEGER,            -- How many times per period
  frequencyLimitPeriod TEXT,              -- 'day', 'week', 'month', 'year'
  commonDenialReasons TEXT,               -- JSON: [{ reason, frequency, pattern_id }, ...]
  requiredModifiers TEXT,                 -- JSON: [modifier_code, ...]
  relatedCodes TEXT,                      -- JSON: [code, ...]
  ageRestrictionMin INTEGER,              -- Minimum patient age
  ageRestrictionMax INTEGER,              -- Maximum patient age
  commonMistakes TEXT,                    -- Plain text description
  fixGuidance TEXT,                       -- How to fix the most common issue
  source TEXT,                            -- 'CPT', 'ICD-10', 'HCPCS', 'Internal'
  referenceUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_code_category (category),
  INDEX idx_code_procedure (procedureCode)
);

-- Sample data
INSERT INTO code_intelligence VALUES (
  'CI-99213',
  '99213',
  'Office visit for established patient, low complexity',
  'E&M',
  185.00,
  3,
  'week',
  '[{"reason": "Missing modifier 25", "frequency": 28, "pattern_id": "PTN-001"}, {"reason": "Unbundled from procedure", "frequency": 12, "pattern_id": "PTN-003"}]',
  '["25", "76", "77", "91", "92"]',
  '["99212", "99214", "36415", "93000"]',
  18,
  NULL,
  'When billing with a procedure on same day, modifier 25 is required to indicate separate E&M service',
  'Add modifier 25 to the E&M code when billed with a procedure. Document the E&M separately in the medical record.',
  'CPT',
  'https://www.ama-assn.org/practice-management/cpt-99213',
  '2025-01-09',
  '2025-01-09'
);
```

---

## API Layer Implementation

### 1. Dashboard Metrics Endpoint

**File**: `server/api/metrics/dashboard.ts`

```typescript
import { defineEventHandler, getQuery } from 'h3'
import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '~/server/database'
import { claims, patterns } from '~/server/database/schema'
import { subDays, startOfDay, endOfDay } from 'date-fns'

interface DashboardMetrics {
  deniedAmount: number
  denialRate: number
  approvalRate: number
  totalClaims: number
  deniedClaims: number
  patternsDetected: number
  criticalPatterns: number
  revenueRecovered: number  // NO LONGER HARDCODED!
  trends: {
    denialRate: number
    approvalRate: number
    patternsDetected: number
  }
}

export default defineEventHandler(async (event): Promise<DashboardMetrics> => {
  const { days = 30 } = getQuery(event)
  const daysNum = parseInt(days as string) || 30
  
  try {
    // Time ranges
    const now = new Date()
    const currentStart = startOfDay(subDays(now, daysNum))
    const currentEnd = endOfDay(now)
    const previousStart = startOfDay(subDays(now, daysNum * 2))
    const previousEnd = endOfDay(subDays(now, daysNum))
    
    // Current period claims
    const currentClaims = await db.query.claims.findMany({
      where: and(
        gte(claims.submissionDate, currentStart.toISOString()),
        lte(claims.submissionDate, currentEnd.toISOString())
      )
    })
    
    const currentDenied = currentClaims.filter(c => c.status === 'denied')
    const deniedAmount = currentDenied.reduce((sum, c) => sum + c.billedAmount, 0)
    const denialRate = currentClaims.length > 0
      ? (currentDenied.length / currentClaims.length) * 100
      : 0
    
    // Previous period for trends
    const previousClaims = await db.query.claims.findMany({
      where: and(
        gte(claims.submissionDate, previousStart.toISOString()),
        lte(claims.submissionDate, previousEnd.toISOString())
      )
    })
    
    const previousDenied = previousClaims.filter(c => c.status === 'denied')
    const previousDenialRate = previousClaims.length > 0
      ? (previousDenied.length / previousClaims.length) * 100
      : 0
    
    // Patterns
    const allPatterns = await db.query.patterns.findMany()
    const criticalPatterns = allPatterns.filter(p => p.tier === 'critical')
    
    // Revenue recovered: sum of improvements across all patterns
    // = (baseline denial rate - current denial rate) * claims in current period * avg denial amount
    const revenueRecovered = allPatterns.reduce((total, pattern) => {
      const baselineRate = pattern.baselineDenialRate || 0
      const currentRate = pattern.currentDenialRate || 0
      const rateImprovement = baselineRate - currentRate
      const projectedSavings = rateImprovement * currentClaims.length * pattern.avgDenialAmount / 100
      return total + Math.max(0, projectedSavings)  // Only count improvements
    }, 0)
    
    return {
      deniedAmount: Math.round(deniedAmount * 100) / 100,
      denialRate: Math.round(denialRate * 100) / 100,
      approvalRate: Math.round((100 - denialRate) * 100) / 100,
      totalClaims: currentClaims.length,
      deniedClaims: currentDenied.length,
      patternsDetected: allPatterns.length,
      criticalPatterns: criticalPatterns.length,
      revenueRecovered: Math.round(revenueRecovered),
      trends: {
        denialRate: Math.round((denialRate - previousDenialRate) * 100) / 100,
        approvalRate: Math.round(((100 - denialRate) - (100 - previousDenialRate)) * 100) / 100,
        patternsDetected: 0  // Not comparable
      }
    }
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    setResponseStatus(event, 500)
    return {
      deniedAmount: 0,
      denialRate: 0,
      approvalRate: 0,
      totalClaims: 0,
      deniedClaims: 0,
      patternsDetected: 0,
      criticalPatterns: 0,
      revenueRecovered: 0,
      trends: { denialRate: 0, approvalRate: 0, patternsDetected: 0 }
    }
  }
})
```

### 2. Patterns Endpoint with Computed Scores

**File**: `server/api/patterns/index.ts`

```typescript
import { defineEventHandler, getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database'
import { patterns, patternClaims, claims } from '~/server/database/schema'
import { subMonths, differenceInMonths, differenceInDays } from 'date-fns'

interface PatternWithComputedScore {
  id: string
  title: string
  description: string
  category: string
  status: string
  tier: string
  score: {
    frequency: number
    impact: number
    trend: 'up' | 'down' | 'stable'
    velocity: number
    confidence: number
    recency: number
  }
  avgDenialAmount: number
  totalAtRisk: number
  currentDenialRate: number
  baselineDenialRate: number
  learningProgress: number
}

export default defineEventHandler(async (event): Promise<PatternWithComputedScore[]> => {
  const { status = 'all' } = getQuery(event)
  
  try {
    let patternList = await db.query.patterns.findMany()
    
    if (status !== 'all') {
      patternList = patternList.filter(p => p.status === status)
    }
    
    // For each pattern, compute current score
    const enrichedPatterns = await Promise.all(
      patternList.map(async (pattern) => {
        // Get all claims linked to this pattern
        const patternClaimsData = await db.query.patternClaims.findMany({
          where: eq(patternClaims.patternId, pattern.id),
          with: {
            claim: true
          }
        })
        
        const linkedClaims = patternClaimsData.map(pc => pc.claim)
        
        // Compute score
        const now = new Date()
        const sixMonthsAgo = subMonths(now, 6)
        
        const recentClaims = linkedClaims.filter(c => 
          new Date(c.dateOfService) >= sixMonthsAgo
        )
        
        const frequency = recentClaims.length
        const impact = recentClaims.reduce((sum, c) => sum + c.billedAmount, 0)
        
        // Recency: days since last claim in pattern
        const lastClaim = recentClaims.sort((a, b) =>
          new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime()
        )[0]
        const recency = lastClaim 
          ? differenceInDays(now, new Date(lastClaim.dateOfService))
          : 999
        
        // Trend: compare current month vs previous month
        const currentMonth = subMonths(now, 0)
        const lastMonth = subMonths(now, 1)
        
        const currentMonthCount = recentClaims.filter(c =>
          new Date(c.dateOfService) >= lastMonth
        ).length
        
        const previousMonthStart = subMonths(now, 2)
        const previousMonthCount = recentClaims.filter(c => {
          const d = new Date(c.dateOfService)
          return d >= previousMonthStart && d < lastMonth
        }).length
        
        const trend = currentMonthCount < previousMonthCount ? 'down'
                    : currentMonthCount > previousMonthCount ? 'up'
                    : 'stable'
        
        // Velocity: denials per month
        const monthsSpan = differenceInMonths(now, sixMonthsAgo) || 1
        const velocity = Math.round((frequency / monthsSpan) * 10) / 10
        
        // Confidence: more evidence = higher confidence
        const confidence = Math.min(frequency / 10, 1) * 100
        
        return {
          ...pattern,
          score: {
            frequency,
            impact,
            trend,
            velocity,
            confidence: Math.round(confidence),
            recency
          }
        }
      })
    )
    
    return enrichedPatterns
  } catch (error) {
    console.error('Patterns endpoint error:', error)
    setResponseStatus(event, 500)
    return []
  }
})
```

### 3. Claims Endpoint with Filters

**File**: `server/api/claims/index.ts`

```typescript
import { defineEventHandler, getQuery } from 'h3'
import { and, eq, like, gte, lte, inArray } from 'drizzle-orm'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { parseISO, subDays } from 'date-fns'

export default defineEventHandler(async (event) => {
  const {
    status = 'all',
    dateRange = '30',
    page = '1',
    limit = '20'
  } = getQuery(event)
  
  try {
    let whereConditions: any[] = []
    
    // Status filter
    if (status !== 'all') {
      whereConditions.push(eq(claims.status, status as string))
    }
    
    // Date range filter
    const daysBack = parseInt(dateRange as string) || 30
    const cutoffDate = subDays(new Date(), daysBack).toISOString()
    whereConditions.push(gte(claims.submissionDate, cutoffDate))
    
    // Execute query
    const claimList = await db.query.claims.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      limit: parseInt(limit as string) || 20,
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    })
    
    const total = await db.select().from(claims).where(
      whereConditions.length > 0 ? and(...whereConditions) : undefined
    )
    
    return {
      claims: claimList,
      pagination: {
        total: total.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total.length / parseInt(limit as string))
      }
    }
  } catch (error) {
    console.error('Claims endpoint error:', error)
    setResponseStatus(event, 500)
    return { claims: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } }
  }
})
```

---

## Computation Service Examples

### Pattern Detection Service

**File**: `server/services/patternDetection.ts`

```typescript
import { db } from '~/server/database'
import { patterns, claims, patternClaims, patternEvidence } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { parseISO } from 'date-fns'

/**
 * Detect patterns in claims based on denial reasons
 * Run this daily to identify new patterns
 */
export async function detectPatternsFromClaims(daysBack: number = 30) {
  console.log(`[PatternDetection] Starting pattern detection for last ${daysBack} days`)
  
  // 1. Get all denied claims in the period
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  
  const deniedClaims = await db.query.claims.findMany({
    where: and(
      eq(claims.status, 'denied'),
      gte(claims.submissionDate, cutoffDate)
    )
  })
  
  console.log(`[PatternDetection] Found ${deniedClaims.length} denied claims`)
  
  // 2. Group by denial reason
  const denialReasonGroups = new Map<string, typeof deniedClaims>()
  
  deniedClaims.forEach(claim => {
    const reason = claim.denialReason || 'Unknown'
    if (!denialReasonGroups.has(reason)) {
      denialReasonGroups.set(reason, [])
    }
    denialReasonGroups.get(reason)!.push(claim)
  })
  
  // 3. For each reason group, find or create pattern
  for (const [reason, claimsInGroup] of denialReasonGroups.entries()) {
    // Threshold: at least 5 denials in the period
    if (claimsInGroup.length < 5) continue
    
    console.log(`[PatternDetection] Processing pattern: "${reason}" (${claimsInGroup.length} occurrences)`)
    
    // Find existing pattern
    let existingPattern = await db.query.patterns.findFirst({
      where: eq(patterns.title, reason)
    })
    
    if (!existingPattern) {
      // Create new pattern
      const patternId = `PTN-${Date.now()}`
      const avgDenialAmount = claimsInGroup.reduce((sum, c) => sum + c.billedAmount, 0) / claimsInGroup.length
      const totalAtRisk = claimsInGroup.reduce((sum, c) => sum + c.billedAmount, 0)
      
      await db.insert(patterns).values({
        id: patternId,
        title: reason,
        description: `${claimsInGroup.length} claims denied for: ${reason}`,
        category: categorizeReason(reason),
        status: 'active',
        tier: 'medium',  // Will be updated by scoring
        scoreFrequency: claimsInGroup.length,
        scoreImpact: totalAtRisk,
        avgDenialAmount,
        totalAtRisk,
        firstDetected: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      })
      
      existingPattern = await db.query.patterns.findFirst({
        where: eq(patterns.id, patternId)
      })
    }
    
    // 4. Link claims to pattern
    for (const claim of claimsInGroup) {
      // Check if link exists
      const existing = await db.query.patternClaims.findFirst({
        where: and(
          eq(patternClaims.patternId, existingPattern!.id),
          eq(patternClaims.claimId, claim.id)
        )
      })
      
      if (!existing) {
        await db.insert(patternClaims).values({
          patternId: existingPattern!.id,
          claimId: claim.id
        })
      }
      
      // Add evidence
      await db.insert(patternEvidence).values({
        patternId: existingPattern!.id,
        claimId: claim.id,
        denialDate: claim.processingDate,
        denialReason: claim.denialReason,
        procedureCode: claim.lineItems?.[0]?.procedureCode,
        billedAmount: claim.billedAmount
      })
    }
    
    // 5. Update pattern metrics
    await updatePatternMetrics(existingPattern!.id)
  }
  
  console.log(`[PatternDetection] Pattern detection complete`)
}

/**
 * Categorize a denial reason into a pattern category
 */
function categorizeReason(reason: string): string {
  const lowerReason = reason.toLowerCase()
  
  if (lowerReason.includes('modifier')) return 'modifier-missing'
  if (lowerReason.includes('code') || lowerReason.includes('mismatch')) return 'code-mismatch'
  if (lowerReason.includes('documentation') || lowerReason.includes('document')) return 'documentation'
  if (lowerReason.includes('authorization') || lowerReason.includes('auth')) return 'authorization'
  if (lowerReason.includes('billing') || lowerReason.includes('bill')) return 'billing-error'
  if (lowerReason.includes('timing') || lowerReason.includes('date')) return 'timing'
  if (lowerReason.includes('medical') || lowerReason.includes('necessity')) return 'medical-necessity'
  
  return 'billing-error'  // Default
}

/**
 * Update all metrics for a pattern
 */
export async function updatePatternMetrics(patternId: string) {
  const pattern = await db.query.patterns.findFirst({
    where: eq(patterns.id, patternId)
  })
  
  if (!pattern) return
  
  // Get all linked claims
  const links = await db.query.patternClaims.findMany({
    where: eq(patternClaims.patternId, patternId),
    with: { claim: true }
  })
  
  const linkedClaims = links.map(l => l.claim)
  
  if (linkedClaims.length === 0) return
  
  // Calculate current period metrics (last 60 days)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const currentClaims = linkedClaims.filter(c => c.dateOfService >= sixtyDaysAgo)
  
  const currentDenied = currentClaims.filter(c => c.status === 'denied')
  const currentDenialRate = currentClaims.length > 0
    ? (currentDenied.length / currentClaims.length) * 100
    : 0
  const currentDollarsDenied = currentDenied.reduce((sum, c) => sum + c.billedAmount, 0)
  
  // Calculate baseline metrics (first 60 days from detection)
  const baselineStart = new Date(pattern.firstDetected)
  const baselineEnd = new Date(baselineStart.getTime() + 60 * 24 * 60 * 60 * 1000)
  
  const baselineClaims = linkedClaims.filter(c => {
    const d = new Date(c.dateOfService)
    return d >= baselineStart && d <= baselineEnd
  })
  
  const baselineDenied = baselineClaims.filter(c => c.status === 'denied')
  const baselineDenialRate = baselineClaims.length > 0
    ? (baselineDenied.length / baselineClaims.length) * 100
    : 0
  const baselineDollarsDenied = baselineDenied.reduce((sum, c) => sum + c.billedAmount, 0)
  
  // Update pattern
  await db.update(patterns)
    .set({
      baselineStart: baselineStart.toISOString(),
      baselineEnd: baselineEnd.toISOString(),
      baselineClaimCount: baselineClaims.length,
      baselineDeniedCount: baselineDenied.length,
      baselineDenialRate,
      baselineDollarsDenied,
      currentStart: sixtyDaysAgo,
      currentEnd: new Date().toISOString(),
      currentClaimCount: currentClaims.length,
      currentDeniedCount: currentDenied.length,
      currentDenialRate,
      currentDollarsDenied,
      lastComputedAt: new Date().toISOString(),
      computationStatus: 'complete'
    })
    .where(eq(patterns.id, patternId))
  
  console.log(`[PatternDetection] Updated metrics for ${patternId}`)
}
```

### Batch Computation Job

**File**: `server/jobs/computeMetrics.ts`

```typescript
import { CronJob } from 'cron'
import { detectPatternsFromClaims, updatePatternMetrics } from '~/server/services/patternDetection'
import { computePolicyMetrics } from '~/server/services/policyMetrics'
import { computeProviderPerformance } from '~/server/services/providerMetrics'
import { insertDailyMetricsSnapshots } from '~/server/services/snapshotService'

/**
 * Initialize all computation jobs
 */
export function initializeComputationJobs() {
  // Detect patterns every 6 hours
  const patternJob = new CronJob('0 */6 * * *', async () => {
    try {
      console.log('[CronJob] Starting pattern detection...')
      await detectPatternsFromClaims(30)
      console.log('[CronJob] Pattern detection complete')
    } catch (error) {
      console.error('[CronJob] Pattern detection failed:', error)
    }
  })
  
  // Update pattern metrics daily at 2 AM
  const metricsJob = new CronJob('0 2 * * *', async () => {
    try {
      console.log('[CronJob] Starting metric update...')
      const patterns = await db.query.patterns.findMany()
      for (const pattern of patterns) {
        if (pattern.status !== 'archived') {
          await updatePatternMetrics(pattern.id)
        }
      }
      console.log('[CronJob] Metric update complete')
    } catch (error) {
      console.error('[CronJob] Metric update failed:', error)
    }
  })
  
  // Compute policy metrics daily at 3 AM
  const policyJob = new CronJob('0 3 * * *', async () => {
    try {
      console.log('[CronJob] Starting policy metrics...')
      const policies = await db.query.policies.findMany()
      for (const policy of policies) {
        await computePolicyMetrics(policy.id)
      }
      console.log('[CronJob] Policy metrics complete')
    } catch (error) {
      console.error('[CronJob] Policy metrics failed:', error)
    }
  })
  
  // Compute provider performance weekly on Monday at 4 AM
  const providerJob = new CronJob('0 4 * * 1', async () => {
    try {
      console.log('[CronJob] Starting provider performance...')
      await computeProviderPerformance()
      console.log('[CronJob] Provider performance complete')
    } catch (error) {
      console.error('[CronJob] Provider performance failed:', error)
    }
  })
  
  // Insert daily metric snapshots daily at 1 AM
  const snapshotJob = new CronJob('0 1 * * *', async () => {
    try {
      console.log('[CronJob] Creating daily snapshots...')
      await insertDailyMetricsSnapshots()
      console.log('[CronJob] Snapshots created')
    } catch (error) {
      console.error('[CronJob] Snapshot creation failed:', error)
    }
  })
  
  patternJob.start()
  metricsJob.start()
  policyJob.start()
  providerJob.start()
  snapshotJob.start()
  
  console.log('[ComputationJobs] All jobs initialized')
  
  return {
    patternJob,
    metricsJob,
    policyJob,
    providerJob,
    snapshotJob
  }
}

/**
 * Stop all jobs (for cleanup)
 */
export function stopComputationJobs(jobs: any) {
  Object.values(jobs).forEach((job: any) => {
    if (job?.stop) job.stop()
  })
}
```

---

## Query Optimization

### Essential Indexes

```sql
-- Claims queries
CREATE INDEX idx_claims_status_date ON claims(status, date_of_service DESC);
CREATE INDEX idx_claims_provider_status ON claims(provider_id, status);
CREATE INDEX idx_claims_denial_reason ON claims(denial_reason);

-- Pattern queries
CREATE INDEX idx_pattern_claims_pattern ON pattern_claims(pattern_id);
CREATE INDEX idx_pattern_claims_claim ON pattern_claims(claim_id);
CREATE INDEX idx_pattern_first_detected ON patterns(first_detected);
CREATE INDEX idx_pattern_status_tier ON patterns(status, tier);

-- Learning events
CREATE INDEX idx_events_timestamp_type ON learning_events(timestamp DESC, type);
CREATE INDEX idx_events_pattern ON learning_events(pattern_id, timestamp);

-- Policy queries
CREATE INDEX idx_policy_codes ON policy_procedure_codes(code);

-- Performance queries
CREATE INDEX idx_provider_performance_denial ON provider_performance(denial_rate);
```

### Example Query Optimizations

**Slow (Without Index)**:
```sql
SELECT COUNT(*) FROM claims WHERE denial_reason = 'Missing Modifier 25' AND status = 'denied';
```

**Fast (With Index)**:
```sql
-- Index: idx_claims_denial_reason, idx_claims_status_date
SELECT COUNT(*) FROM claims 
WHERE denial_reason = 'Missing Modifier 25' 
AND status = 'denied'
AND date_of_service >= DATE('now', '-6 months');
```

**Pattern Metrics Query** (Should complete in < 100ms):
```sql
SELECT
  p.id,
  p.title,
  COUNT(DISTINCT c.id) as claim_count,
  COUNT(CASE WHEN c.status = 'denied' THEN 1 END) as denied_count,
  CAST(COUNT(CASE WHEN c.status = 'denied' THEN 1 END) AS REAL) / 
    NULLIF(COUNT(DISTINCT c.id), 0) * 100 as denial_rate,
  SUM(CASE WHEN c.status = 'denied' THEN c.billed_amount ELSE 0 END) as dollars_denied
FROM patterns p
INNER JOIN pattern_claims pc ON p.id = pc.pattern_id
INNER JOIN claims c ON pc.claim_id = c.id
WHERE p.status != 'archived'
AND c.date_of_service >= DATE('now', '-90 days')
GROUP BY p.id, p.title
ORDER BY dollars_denied DESC;
```

---

## Migration Script Templates

### 1. Seed from JSON

**File**: `server/database/seedFromJson.ts`

```typescript
import fs from 'fs'
import path from 'path'
import { db } from './index'
import { claims, patterns, policies, providers, learningEvents } from './schema'

async function seedFromJson() {
  console.log('[Seed] Starting data import from JSON...')
  
  try {
    // 1. Import claims
    const claimsPath = path.join(process.cwd(), 'public/data/claims.json')
    const claimsData = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'))
    
    console.log(`[Seed] Importing ${claimsData.claims.length} claims...`)
    for (const claim of claimsData.claims) {
      await db.insert(claims).values({
        id: claim.id,
        providerId: claim.providerId,
        claimType: claim.claimType,
        patientName: claim.patientName,
        patientDob: claim.patientDOB,
        patientSex: claim.patientSex,
        memberId: claim.memberId,
        memberGroupId: claim.memberGroupId,
        dateOfService: claim.dateOfService,
        billedAmount: claim.billedAmount,
        paidAmount: claim.paidAmount,
        status: claim.status,
        denialReason: claim.denialReason,
        submissionDate: claim.submissionDate,
        processingDate: claim.processingDate,
        createdAt: new Date().toISOString()
      }).onConflictDoNothing()
    }
    
    // 2. Import patterns
    const patternsPath = path.join(process.cwd(), 'public/data/patterns.json')
    const patternsData = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'))
    
    console.log(`[Seed] Importing ${patternsData.patterns.length} patterns...`)
    for (const pattern of patternsData.patterns) {
      await db.insert(patterns).values({
        id: pattern.id,
        title: pattern.title,
        description: pattern.description,
        category: pattern.category,
        status: pattern.status,
        tier: pattern.tier,
        scoreFrequency: pattern.score.frequency,
        scoreImpact: pattern.score.impact,
        scoreTrend: pattern.score.trend,
        scoreVelocity: pattern.score.velocity,
        scoreConfidence: pattern.score.confidence,
        scoreRecency: pattern.score.recency,
        avgDenialAmount: pattern.avgDenialAmount,
        totalAtRisk: pattern.totalAtRisk,
        learningProgress: pattern.learningProgress,
        practiceSessionsCompleted: pattern.practiceSessionsCompleted,
        correctionsApplied: pattern.correctionsApplied,
        firstDetected: pattern.firstDetected,
        lastSeen: pattern.lastSeen,
        createdAt: new Date().toISOString()
      }).onConflictDoNothing()
    }
    
    console.log('[Seed] Data import complete!')
  } catch (error) {
    console.error('[Seed] Import failed:', error)
    throw error
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFromJson().then(() => process.exit(0))
}

export { seedFromJson }
```

---

## Summary

This technical guide provides:

1. **SQL schemas** for all new tables and fields
2. **TypeScript examples** for API endpoints
3. **Service layer code** for pattern detection and metric computation
4. **Batch job scheduling** for automated updates
5. **Query optimization** strategies
6. **Migration scripts** for data import

**Next Steps**:
1. Create migration files from these schemas
2. Implement API endpoints
3. Deploy computation services
4. Seed initial data
5. Validate metrics match current values
6. Launch gradually to users

---

**Document prepared**: January 9, 2026  
**Ready for**: Implementation team
