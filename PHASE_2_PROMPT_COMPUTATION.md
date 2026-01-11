# 🚀 Claude Code: Phase 2 - Computation Engine

**Copy everything below** and paste into Claude Code in VS Code.

---

# Phase 2: Build Server-Side Metric Computation Engine

## Context

Phase 1 is complete - the dashboard reads live data from the database. Now move all metric calculations from client-side (static arrays) to server-side (real-time from database).

**Timeline**: 5 days
**Deliverable**: Dashboard shows computed metrics (denial rate, appeals outcomes, learning progress, pattern detection) that update in real-time as new claims are generated

## Phase 2 Responsibilities

1. Compute pattern frequency from claim stream
2. Calculate denial metrics (rate, amounts, reasons)
3. Track learning event outcomes
4. Calculate revenue recovery potential
5. Detect emerging patterns automatically
6. Track trends vs. baseline

## Architecture Overview

```
Claims in DB
    ↓
Pattern Detection (auto-detect from claim data)
    ↓
Metric Computation (denial rate, recovery potential, etc)
    ↓
Snapshot Storage (historical data for trends)
    ↓
API endpoints (/api/v1/metrics/*)
    ↓
Dashboard (displays computed, not hardcoded)
```

## Day 1: Pattern Detection Engine

### Create `server/services/patternDetection.ts`

```typescript
import { db } from '~/server/database'
import { claims, patterns } from '~/server/database/schema'
import { eq, sql, and, gte, lt } from 'drizzle-orm'

interface DetectedPattern {
  category: string
  keyword: string
  frequency: number
  denialCount: number
  averageDenialAmount: number
  confidence: number
}

/**
 * Detect patterns by analyzing claims
 * Looks for common denials and procedural issues
 */
export async function detectPatterns(lookbackDays: number = 30): Promise<DetectedPattern[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString()

  // Get all denied claims in lookback period
  const deniedClaims = await db
    .select()
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))

  const patterns: Map<string, DetectedPattern> = new Map()

  for (const claim of deniedClaims) {
    // Pattern: Missing modifiers (common denial reason)
    if (claim.denialReason?.includes('Modifier')) {
      addPattern(patterns, 'modifier-missing', 'Missing Modifier', claim)
    }

    // Pattern: Documentation issues
    if (claim.denialReason?.includes('documentation') || claim.denialReason?.includes('medical')) {
      addPattern(patterns, 'documentation', 'Documentation Issue', claim)
    }

    // Pattern: Bundling/unbundling
    if (claim.denialReason?.includes('Unbundled') || claim.denialReason?.includes('bundle')) {
      addPattern(patterns, 'bundling', 'Unbundled Codes', claim)
    }

    // Pattern: Authorization
    if (claim.denialReason?.includes('authorization') || claim.denialReason?.includes('prior')) {
      addPattern(patterns, 'auth-required', 'Prior Auth Required', claim)
    }

    // Pattern: Frequency limits
    if (claim.denialReason?.includes('frequency') || claim.denialReason?.includes('limit')) {
      addPattern(patterns, 'frequency', 'Frequency Limit Exceeded', claim)
    }
  }

  // Convert to array and calculate confidence
  return Array.from(patterns.values()).map(p => ({
    ...p,
    confidence: calculateConfidence(p.frequency, p.denialCount)
  }))
}

function addPattern(
  patterns: Map<string, DetectedPattern>,
  category: string,
  keyword: string,
  claim: any
) {
  if (!patterns.has(category)) {
    patterns.set(category, {
      category,
      keyword,
      frequency: 0,
      denialCount: 0,
      averageDenialAmount: 0,
      confidence: 0
    })
  }

  const pattern = patterns.get(category)!
  pattern.frequency++
  pattern.denialCount++
  pattern.averageDenialAmount += claim.billedAmount || 0
}

function calculateConfidence(frequency: number, denialCount: number): number {
  // Confidence = (denials / total occurrences) * frequency
  // Higher is more important
  const denialRate = denialCount / frequency
  return Math.min(100, Math.round((denialRate * frequency) / 10))
}

/**
 * Calculate denial metrics
 */
export async function calculateDenialMetrics(lookbackDays: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString()

  // Total claims
  const allClaims = await db
    .select({ count: sql<number>`count(*)` })
    .from(claims)
    .where(gte(claims.dateOfService, startDateStr))

  // Denied claims
  const deniedClaims = await db
    .select({ count: sql<number>`count(*)` })
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))

  // Denied amounts
  const deniedAmounts = await db
    .select({ total: sql<number>`SUM(${claims.billedAmount})` })
    .from(claims)
    .where(and(
      eq(claims.status, 'denied'),
      gte(claims.dateOfService, startDateStr)
    ))

  const totalCount = allClaims[0]?.count || 1
  const deniedCount = deniedClaims[0]?.count || 0
  const deniedTotal = deniedAmounts[0]?.total || 0

  return {
    totalClaims: totalCount,
    deniedClaims: deniedCount,
    denialRate: ((deniedCount / totalCount) * 100).toFixed(2),
    potentialRecovery: deniedTotal,
    averageDeniedAmount: deniedTotal > 0 ? Math.round(deniedTotal / deniedCount) : 0
  }
}
```

**Day 1 Success**: Pattern detection working, denial metrics calculated

---

## Day 2: Learning Metrics & Progress Tracking

### Create `server/services/learningMetrics.ts`

```typescript
import { db } from '~/server/database'
import { learningEvents, patterns } from '~/server/database/schema'
import { eq, and, gte, sql, count } from 'drizzle-orm'

/**
 * Calculate learning progress for a pattern
 */
export async function calculateLearningProgress(patternId: string) {
  // Get all learning events for this pattern
  const events = await db
    .select()
    .from(learningEvents)
    .where(eq(learningEvents.patternId, patternId))

  const totalSessions = new Set()
  let totalCorrect = 0
  let totalQuestions = 0

  for (const event of events) {
    if (event.type === 'practice-started') {
      totalSessions.add(event.sessionId)
    }
    if (event.type === 'practice-completed') {
      const metadata = event.metadata as any
      totalCorrect += metadata?.correct || 0
      totalQuestions += metadata?.total || 0
    }
  }

  const accuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0

  return {
    patternId,
    sessionsCompleted: totalSessions.size,
    questionsAttempted: totalQuestions,
    correctAnswers: totalCorrect,
    accuracy: parseFloat(accuracy as string),
    lastPracticed: events.length > 0 ? events[events.length - 1].timestamp : null
  }
}

/**
 * Calculate overall learning stats
 */
export async function calculateGlobalLearningStats() {
  const patterns = await db.select().from(patterns)

  const stats = await Promise.all(
    patterns.map(p => calculateLearningProgress(p.id))
  )

  const avgAccuracy = stats.reduce((sum, s) => sum + s.accuracy, 0) / stats.length
  const totalSessions = stats.reduce((sum, s) => sum + s.sessionsCompleted, 0)
  const totalQuestions = stats.reduce((sum, s) => sum + s.questionsAttempted, 0)

  return {
    averageAccuracy: avgAccuracy.toFixed(1),
    totalPracticeSessions: totalSessions,
    totalQuestionsAnswered: totalQuestions,
    patternsWithProgress: stats.filter(s => s.sessionsCompleted > 0).length,
    detailedProgress: stats
  }
}

/**
 * Calculate practice ROI for a pattern
 * How much money saved by learning this pattern
 */
export async function calculatePracticeROI(patternId: string, lookbackDays: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const startDateStr = startDate.toISOString()

  // Get learning progress
  const progress = await calculateLearningProgress(patternId)

  // Get historical denied amount for this pattern
  const pattern = await db.select().from(patterns).where(eq(patterns.id, patternId))
  const patternData = pattern[0]

  if (!patternData || progress.sessionsCompleted === 0) {
    return {
      patternId,
      estimatedMonthlyRecovery: 0,
      roi: 0,
      timeToROI: 'N/A'
    }
  }

  // Estimate: each session improves performance by 5-10%
  const improvementPerSession = 7 // percent
  const currentImprovement = Math.min(
    progress.sessionsCompleted * improvementPerSession,
    80 // Max 80% improvement
  )

  // If pattern has $10k denied amount per month, improvement = recovery
  const estimatedMonthlyRecovery = Math.round(
    (patternData.impactPotential || 0) * (currentImprovement / 100)
  )

  return {
    patternId,
    estimatedMonthlyRecovery,
    currentImprovement,
    sessionsCompleted: progress.sessionsCompleted,
    roi: estimatedMonthlyRecovery > 0 ? 'Positive' : 'In Progress'
  }
}
```

**Day 2 Success**: Learning metrics calculated, ROI computed, progress tracked

---

## Day 3: Snapshot Storage & Trends

### Create `server/services/snapshotEngine.ts`

```typescript
import { db } from '~/server/database'
import { patternSnapshots, policyDailyMetrics } from '~/server/database/schema'
import { patterns } from '~/server/database/schema'
import { detectPatterns, calculateDenialMetrics } from './patternDetection'
import { calculateLearningProgress } from './learningMetrics'

/**
 * Create daily snapshot of all metrics
 * Run this once per day to track trends
 */
export async function createDailySnapshot() {
  const today = new Date().toISOString().split('T')[0]

  // Snapshot each pattern's metrics
  const allPatterns = await db.select().from(patterns)

  for (const pattern of allPatterns) {
    const denialMetrics = await calculateDenialMetrics(30)
    const progress = await calculateLearningProgress(pattern.id)

    await db.insert(patternSnapshots).values({
      id: `SNAP-${Date.now()}`,
      patternId: pattern.id,
      snapshotDate: today,
      frequency: pattern.frequency || 0,
      denialCount: denialMetrics.deniedClaims,
      averageAmount: denialMetrics.averageDeniedAmount,
      accuracy: progress.accuracy,
      sessionsCompleted: progress.sessionsCompleted,
      trend: calculateTrend(pattern.id, today)
    }).onConflictDoNothing()
  }

  return { snapshotsCreated: allPatterns.length, date: today }
}

function calculateTrend(patternId: string, date: string): string {
  // This will be computed by comparing to previous snapshot
  // For now: placeholder
  return 'stable'
}

/**
 * Get trend for pattern over time
 */
export async function getPatternTrend(patternId: string, days: number = 30) {
  const snapshots = await db
    .select()
    .from(patternSnapshots)
    .where(eq(patternSnapshots.patternId, patternId))
    .orderBy(desc(patternSnapshots.snapshotDate))
    .limit(days)

  if (snapshots.length < 2) return null

  const newest = snapshots[0]
  const oldest = snapshots[snapshots.length - 1]

  const frequencyChange = ((newest.frequency - oldest.frequency) / oldest.frequency) * 100
  const accuracyChange = newest.accuracy - oldest.accuracy

  return {
    patternId,
    period: { days, from: oldest.snapshotDate, to: newest.snapshotDate },
    frequency: { start: oldest.frequency, end: newest.frequency, change: frequencyChange },
    accuracy: { start: oldest.accuracy, end: newest.accuracy, change: accuracyChange },
    trend: frequencyChange < -10 ? 'improving' : frequencyChange > 10 ? 'worsening' : 'stable'
  }
}
```

**Day 3 Success**: Snapshots created daily, trends calculated, historical data stored

---

## Day 4: Computation API Endpoints

### Create `server/api/v1/metrics/denial.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { calculateDenialMetrics } from '~/server/services/patternDetection'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const metrics = await calculateDenialMetrics(days)

    return {
      metrics,
      period: { days },
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Denial metrics error:', error)
    return { error: 'Failed to calculate denial metrics' }
  }
})
```

### Create `server/api/v1/metrics/patterns.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { detectPatterns } from '~/server/services/patternDetection'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const detected = await detectPatterns(days)

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence)

    return {
      detectedPatterns: detected,
      period: { days },
      totalDetected: detected.length
    }
  } catch (error) {
    console.error('Pattern detection error:', error)
    return { error: 'Failed to detect patterns' }
  }
})
```

### Create `server/api/v1/metrics/learning.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { calculateGlobalLearningStats } from '~/server/services/learningMetrics'

export default defineEventHandler(async (event) => {
  try {
    const stats = await calculateGlobalLearningStats()

    return {
      stats,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Learning metrics error:', error)
    return { error: 'Failed to calculate learning metrics' }
  }
})
```

### Create `server/api/v1/metrics/roi.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { calculatePracticeROI } from '~/server/services/learningMetrics'
import { db } from '~/server/database'
import { patterns } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const allPatterns = await db.select().from(patterns)

    const roiResults = await Promise.all(
      allPatterns.map(p => calculatePracticeROI(p.id, days))
    )

    // Sort by estimated recovery
    roiResults.sort((a, b) => b.estimatedMonthlyRecovery - a.estimatedMonthlyRecovery)

    const totalRecovery = roiResults.reduce((sum, r) => sum + r.estimatedMonthlyRecovery, 0)

    return {
      roi: roiResults,
      summary: {
        totalEstimatedMonthlyRecovery: totalRecovery,
        patternsWithROI: roiResults.filter(r => r.estimatedMonthlyRecovery > 0).length
      },
      period: { days }
    }
  } catch (error) {
    console.error('ROI metrics error:', error)
    return { error: 'Failed to calculate ROI' }
  }
})
```

**Day 4 Success**: All metric endpoints working, returning computed values

---

## Day 5: Update Dashboard & Cron Jobs

### Create `server/services/scheduledJobs.ts`

```typescript
import { createDailySnapshot } from './snapshotEngine'

let snapshotJobScheduled = false

/**
 * Initialize scheduled jobs
 * Runs once at server startup
 */
export function initializeScheduledJobs() {
  if (snapshotJobScheduled) return

  // Run daily snapshot at 2 AM
  scheduleJob('0 2 * * *', async () => {
    try {
      console.log('Running daily metric snapshot...')
      const result = await createDailySnapshot()
      console.log('Snapshot complete:', result)
    } catch (error) {
      console.error('Snapshot failed:', error)
    }
  })

  snapshotJobScheduled = true
  console.log('Scheduled jobs initialized')
}

function scheduleJob(cron: string, job: () => Promise<void>) {
  // Using a simple interval-based scheduler
  // For production, use node-cron or bull
  const intervals: Record<string, NodeJS.Timer> = {}

  if (!intervals[cron]) {
    intervals[cron] = setInterval(job, 24 * 60 * 60 * 1000) // Daily
  }
}
```

### Update `pages/index.vue` to use computed metrics

```vue
<script setup lang="ts">
const appStore = useAppStore()
const metricsLoading = ref(true)
const metrics = ref<any>(null)

onMounted(async () => {
  await appStore.loadClaims()
  
  // Load computed metrics from server
  try {
    metrics.value = await $fetch('/api/v1/metrics/denial')
  } catch (error) {
    console.error('Failed to load metrics:', error)
  } finally {
    metricsLoading.value = false
  }
})

// All metrics now come from database computation, not hardcoded
const denialRate = computed(() => metrics.value?.metrics?.denialRate || 0)
const revenueRecovered = computed(() => metrics.value?.metrics?.potentialRecovery || 0)
</script>

<template>
  <div class="dashboard">
    <h1 class="text-3xl font-bold">Claims Analytics</h1>
    
    <div class="metrics-grid">
      <Card title="Denial Rate">
        <p class="text-4xl font-bold">{{ denialRate }}%</p>
      </Card>
      
      <Card title="Recovery Potential">
        <p class="text-4xl font-bold">${{ (revenueRecovered / 1000).toFixed(1) }}K</p>
      </Card>
    </div>
  </div>
</template>
```

**Day 5 Success**: Dashboard uses computed metrics, scheduled jobs running

---

## Implementation Checklist

- [ ] Day 1: Pattern detection engine working
- [ ] Day 1: Denial metrics calculated correctly
- [ ] Day 2: Learning progress tracked
- [ ] Day 2: Practice ROI computed
- [ ] Day 3: Daily snapshots created
- [ ] Day 3: Trends calculated from historical data
- [ ] Day 4: All metric endpoints returning data
- [ ] Day 5: Dashboard displays computed values
- [ ] Day 5: Scheduled jobs running

## Testing

```bash
# Test pattern detection
curl http://localhost:3000/api/v1/metrics/patterns

# Test denial metrics
curl http://localhost:3000/api/v1/metrics/denial

# Test learning stats
curl http://localhost:3000/api/v1/metrics/learning

# Test ROI
curl http://localhost:3000/api/v1/metrics/roi

# Check database snapshots
sqlite3 provider-portal.db "SELECT COUNT(*) FROM patternSnapshots;"
```

## Success Criteria

- ✅ All metrics computed from database (not hardcoded)
- ✅ Pattern detection works automatically
- ✅ Learning progress tracked and ROI calculated
- ✅ Historical snapshots stored for trends
- ✅ API endpoints returning computed values
- ✅ Dashboard updates reflect live data changes
- ✅ No static values in code

## Commits

```
git commit -m "Phase 2 Day 1: Pattern detection engine"
git commit -m "Phase 2 Day 2: Learning metrics and ROI calculation"
git commit -m "Phase 2 Day 3: Snapshot storage and trend tracking"
git commit -m "Phase 2 Day 4: Metric computation API endpoints"
git commit -m "Phase 2 Day 5: Dashboard refactor to use computed metrics"
```

---

**Next Phase**: Phase 3 (Real Data Integration) connects real claim sources

Good luck! This phase transforms the system from static to truly live and analytical.
