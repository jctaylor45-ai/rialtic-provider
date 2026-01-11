# Database Migration Review: Static Data → Computed Values

**Version**: 1.0  
**Date**: January 9, 2026  
**Status**: Comprehensive Analysis Complete

---

## Executive Summary

This Provider Portal PoC currently loads **all data from static JSON files** and performs computations client-side. The database schema exists but is unpopulated. This document identifies:

1. **Static data sources** currently being served
2. **Computed metrics** that should be database-backed
3. **Required schema changes** to support computation
4. **Phased migration plan** to transition to live database

**Current State**: ~100% JSON-based, 0% database-driven  
**Target State**: Live claim ingestion with real-time pattern detection and metric computation

---

## Part 1: Static Data Sources Inventory

### 1.1 JSON Files Currently in Use

All data loads from `public/data/`:

| File | Records | Purpose | Status |
|------|---------|---------|--------|
| `claims.json` | 212 | Claims from July 2024 - Jan 2025 | ✅ Schema exists |
| `patterns.json` | 7 | Hardcoded denial patterns | ⚠️ Needs computation logic |
| `policies.json` | 20 | Payer policies (reference) | ✅ Schema exists |
| `providers.json` | 5 | Provider metadata | ✅ Schema exists |
| `learningEvents.json` | 107 | User interaction events | ✅ Schema exists |
| `codeIntelligence.json` | 10+ | Medical code reference | ⚠️ No schema |
| `insights.json` | 5 | Pre-computed insights | ⚠️ Duplicate of patterns |
| `learningMarkers.json` | 20 | Learning progress (legacy) | ⚠️ Replaced by learningEvents |

### 1.2 Data Load Points

**React Frontend** (`src/context/AppContext.jsx`):
```jsx
import claimsData from '../data/claims.json'
import policiesData from '../data/policies.json'
import providersData from '../data/providers.json'
import insightsData from '../data/insights.json'
```

**Nuxt Stores** (`stores/*.ts`):
- `stores/app.ts` - Loads claims via `$fetch('/data/claims.json')`
- `stores/patterns.ts` - Loads patterns via `$fetch('/data/patterns.json')`
- `stores/events.ts` - Loads learningEvents via `$fetch('/data/learningEvents.json')`
- `stores/analytics.ts` - Loads codeIntelligence via `$fetch('/data/codeIntelligence.json')`

---

## Part 2: Computed Metrics (Currently Client-Side)

### 2.1 Dashboard Metrics (`pages/index.vue`)

**Hardcoded Values**:
```typescript
// Line 500 - HARDCODED
const revenueRecovered = computed(() => {
  return 127500 // Hardcoded placeholder
})
```

**Computed from Claims**:
- `filteredDenialRate` - Calculated from claims.json, aggregated
- `filteredApprovalRate` - Inverse of denial rate
- `filteredDeniedAmount` - Sum of billed amounts for denied claims
- `filteredDeniedClaims` - Filtered by `submissionDate`
- `patternsImproving` - Filtered by `pattern.score.trend === 'down'`
- `patternsStable` - Filtered by `pattern.score.trend === 'stable'`
- `patternsRegressing` - Filtered by `pattern.score.trend === 'up'`

**Trend Calculations** (comparing 30/60/90-day windows):
- Denial rate change vs previous period
- Approval rate improvement
- Pattern frequency trend

### 2.2 Pattern Metrics (`stores/patterns.ts`, `utils/analytics.ts`)

**Pattern Score Components** (currently static in JSON):
```typescript
score: {
  frequency: number    // Count of denials
  impact: number       // Total dollars denied
  trend: 'up'|'down'|'stable'
  velocity: number     // Rate of change (denials/month)
  confidence: number   // 0-100 confidence in pattern
  recency: number      // Days since last occurrence
}
```

**Functions Computing These**:
- `calculatePatternScore(evidence)` - Aggregates from evidence array
- `calculatePatternConfidence()` - Based on evidence count, time span, consistency
- `calculateVelocity()` - Denials per month
- `calculateTrend()` - Comparing evidence buckets
- `calculatePatternTier()` - 'critical'|'high'|'medium'|'low' based on score

**Learning Progress Metrics** (static in patterns.json):
- `learningProgress` (0-100%)
- `practiceSessionsCompleted` (count)
- `correctionsApplied` (count)

### 2.3 Impact & ROI Metrics (`pages/impact.vue`, `stores/analytics.ts`)

**Practice ROI Calculation** (`calculatePracticeROI()`):
```typescript
return {
  totalPracticeSessions: number
  totalCorrectionsApplied: number
  totalTimeInvested: number        // minutes
  estimatedSavings: number          // CALCULATED from pattern savings
  avoidedDenials: number            // Sum of pattern frequencies
  improvedApprovalRate: number      // CALCULATED
  patternsResolved: number
  patternsImproving: number
  avgCorrectionRate: number
  patternImpact: [                  // Per-pattern breakdown
    { 
      patternId, denialsBefore, denialsAfter, savingsRealized, lastPracticed 
    }
  ]
  avgSessionDuration: number
  mostPracticedPatterns: string[]
  streakDays: number
  lastActivityDate: string
}
```

**Baseline vs Current Period Metrics**:
- `baselineStart`, `baselineEnd`, `baselineClaimCount`, `baselineDenialRate`
- `currentStart`, `currentEnd`, `currentClaimCount`, `currentDenialRate`
- Generated for sparkline visualizations

**Metric Trends**:
- `denialRateChange` - Current vs baseline
- `appealRateChange` - Current vs baseline
- `deniedDollarsChange` - Current vs baseline

### 2.4 Policy Metrics (`stores/analytics.ts`)

**Per-Policy Metrics** (hardcoded in policies.json):
```typescript
{
  hitRate: number          // % of claims matching this policy
  denialRate: number       // % of matched claims denied
  appealRate: number       // % of denials appealed
  overturnRate: number     // % of appeals overturned
  impact: number           // Total dollars affected
  providersImpacted: number
  insightCount: number     // Related patterns
  trend: 'up'|'down'|'stable'
  learningMarkersCount: number
  recentTests: number
}
```

**Problem**: These should be computed by:
1. Finding all claims matching policy conditions
2. Calculating outcomes for those claims
3. Updating metrics automatically

---

## Part 3: Database Schema Gaps & Changes Needed

### 3.1 Missing Tables

**Code Intelligence** (currently in JSON, no schema):
```sql
CREATE TABLE code_intelligence (
  id TEXT PRIMARY KEY,
  procedureCode TEXT NOT NULL UNIQUE,
  cptCode TEXT,
  description TEXT,
  category TEXT,          -- 'E&M', 'Surgery', 'Diagnostic', etc.
  averageReimbursement REAL,
  commonDenialReasons TEXT, -- JSON array
  modifierRules TEXT,       -- JSON array of modifier objects
  frequencyLimits TEXT,     -- JSON
  ageRestrictions TEXT,     -- JSON
  commonMistakes TEXT,      -- JSON array
  fixGuidance TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Pattern Evidence** (exists but needs enhancement):
- Should track **snapshot date** for time-series metrics
- Needs fields for **baseline vs current** metrics

**Pattern Snapshots** (exists but underutilized):
- Should have daily/weekly aggregates
- Should auto-compute from claims data

**Learning Events** (exists but missing fields):
- No `duration` field (in metadata, should normalize)
- No `outcome` field (result of practice)
- No `correctionApplied` field

### 3.2 Computed Field Additions

#### A. Add to `patterns` table:

```sql
-- Computed metrics (should be calculated, not static)
ALTER TABLE patterns ADD COLUMN baselineStart TEXT;
ALTER TABLE patterns ADD COLUMN baselineEnd TEXT;
ALTER TABLE patterns ADD COLUMN baselineClaimCount INTEGER;
ALTER TABLE patterns ADD COLUMN baselineDeniedCount INTEGER;
ALTER TABLE patterns ADD COLUMN baselineDenialRate REAL;
ALTER TABLE patterns ADD COLUMN baselineDollarsDenied REAL;

ALTER TABLE patterns ADD COLUMN currentStart TEXT;
ALTER TABLE patterns ADD COLUMN currentEnd TEXT;
ALTER TABLE patterns ADD COLUMN currentClaimCount INTEGER;
ALTER TABLE patterns ADD COLUMN currentDeniedCount INTEGER;
ALTER TABLE patterns ADD COLUMN currentDenialRate REAL;
ALTER TABLE patterns ADD COLUMN currentDollarsDenied REAL;

-- Tracking fields for when metrics were last updated
ALTER TABLE patterns ADD COLUMN lastComputedAt TEXT;
ALTER TABLE patterns ADD COLUMN computationVersion INTEGER DEFAULT 1;
```

#### B. Add to `policies` table:

```sql
-- Make these computed instead of static
ALTER TABLE policies ADD COLUMN lastComputedAt TEXT;
ALTER TABLE policies ADD COLUMN computationPeriodStart TEXT;
ALTER TABLE policies ADD COLUMN computationPeriodEnd TEXT;

-- Change these from default 0 to NULL (unknown until computed)
ALTER TABLE policies MODIFY hitRate REAL DEFAULT NULL;
ALTER TABLE policies MODIFY denialRate REAL DEFAULT NULL;
ALTER TABLE policies MODIFY appealRate REAL DEFAULT NULL;
ALTER TABLE policies MODIFY overturnRate REAL DEFAULT NULL;
ALTER TABLE policies MODIFY impact REAL DEFAULT NULL;
```

#### C. Enhance `learning_events` table:

```sql
-- Normalize duration (currently in metadata)
ALTER TABLE learning_events ADD COLUMN durationMs INTEGER;

-- Track outcomes
ALTER TABLE learning_events ADD COLUMN outcomeType TEXT; -- 'correct', 'incorrect', 'skipped'
ALTER TABLE learning_events ADD COLUMN correctionApplied INTEGER(1) DEFAULT 0;

-- Link to pattern/claim
ALTER TABLE learning_events ADD COLUMN patternId TEXT REFERENCES patterns(id);
ALTER TABLE learning_events ADD COLUMN claimId TEXT REFERENCES claims(id);
```

#### D. Enhance `claim_line_items` table:

```sql
-- Track if this line item was denied
ALTER TABLE claim_line_items ADD COLUMN denialDate TEXT;
ALTER TABLE claim_line_items ADD COLUMN denialReason TEXT;
ALTER TABLE claim_line_items ADD COLUMN patternsTriggered TEXT; -- JSON array of pattern IDs
```

### 3.3 New Computed Tables

**Pattern Daily Metrics** (for trend visualization):
```sql
CREATE TABLE pattern_daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patternId TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  metricDate TEXT NOT NULL,
  claimCount INTEGER,
  deniedCount INTEGER,
  denialRate REAL,
  dollarsDenied REAL,
  appealCount INTEGER,
  overturnCount INTEGER,
  INDEX (patternId, metricDate)
);
```

**Policy Daily Metrics** (for impact tracking):
```sql
CREATE TABLE policy_daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policyId TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  metricDate TEXT NOT NULL,
  hitCount INTEGER,
  deniedCount INTEGER,
  denialRate REAL,
  dollarsDenied REAL,
  appealCount INTEGER,
  INDEX (policyId, metricDate)
);
```

**Provider Performance** (per-provider aggregates):
```sql
CREATE TABLE provider_performance (
  id TEXT PRIMARY KEY,
  providerId TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  claimCount INTEGER DEFAULT 0,
  deniedCount INTEGER DEFAULT 0,
  denialRate REAL DEFAULT 0,
  totalBilled REAL DEFAULT 0,
  totalDenied REAL DEFAULT 0,
  appealCount INTEGER DEFAULT 0,
  overturnCount INTEGER DEFAULT 0,
  lastComputedAt TEXT,
  UNIQUE (providerId)
);
```

---

## Part 4: Current Computation Dependencies

### 4.1 What Depends on Static Data?

```
pages/index.vue (Dashboard)
├── revenueRecovered ← HARDCODED: 127500
├── filteredDenialRate ← computed from claims.json
├── filteredDeniedAmount ← sum of billed amounts
├── patternsImproving ← from patterns.json (trend field)
├── recentDeniedClaims ← from claims.json (status=denied)
└── recentIssuesByPattern ← joined claim + pattern data

pages/impact.vue (ROI Dashboard)
├── baselineMetrics ← calculated from claims.json in dateRange
├── currentMetrics ← calculated from claims.json in dateRange
├── patternPerformance ← loop through patterns, calculate metrics
├── denialRateSparkline ← generateSparklineData() with hardcoded fallback values
└── all financial metrics ← sum/aggregate from static arrays

stores/patterns.ts
├── patterns ← loaded from patterns.json (static)
├── totalAtRisk ← sum of pattern.totalAtRisk (static)
├── avgLearningProgress ← average of hardcoded values
└── recentlyImprovedPatterns ← filter by improvement date

stores/analytics.ts
├── practiceROI ← calculatePracticeROI() from memory
├── codeIntelligence ← loaded from codeIntelligence.json (static)
└── dashboardMetrics ← aggregated from stores (all static)
```

### 4.2 Functions That Need to Change

**High Priority** (actively used):
- `calculatePatternScore()` - Needs to query claims table
- `calculatePracticeROI()` - Needs to sum learning events from DB
- `calculatePatternTier()` - Needs live score
- `calculateDenialRate()` - Needs claims aggregation
- Dashboard metrics computation - All should use DB queries

**Medium Priority** (impact tab):
- `calculateMetricTrend()` - Needs historical snapshots
- Sparkline generation - Should use `pattern_daily_metrics` table
- `patternPerformance` computation - Should use pattern snapshots

**Lower Priority** (supporting):
- `calculateEngagementScore()` - Can stay computed from events
- `calculateLearningVelocity()` - Can stay computed from snapshots

---

## Part 5: Migration Plan (Phased Approach)

### Phase 0: Preparation (Days 1-2)
**Goal**: Set up infrastructure for database-backed data

**Tasks**:
1. Create new tables:
   - `code_intelligence`
   - `pattern_daily_metrics`
   - `policy_daily_metrics`
   - `provider_performance`

2. Add computed fields to existing tables:
   - `patterns` (baseline/current metrics)
   - `policies` (computation tracking)
   - `learning_events` (normalized duration, outcomes)

3. Create migration script to populate new tables from JSON

4. Create database seeding strategy for test data

**Deliverable**: 
- Updated `server/database/schema.ts` with new tables
- Migration scripts in `server/database/migrations/`
- Seed script populating from JSON with timestamps

---

### Phase 1: Read Path (Days 3-5)
**Goal**: Make dashboard read from database instead of JSON

**Tasks**:
1. Create API routes in `server/api/`:
   - `/api/metrics/dashboard` - Returns dashboard metrics
   - `/api/patterns` - Returns patterns with computed scores
   - `/api/claims` - Returns claim list with filters
   - `/api/insights` - Returns top patterns for insight card

2. Create database query layer:
   - `server/database/queries/patterns.ts` - Pattern queries with aggregation
   - `server/database/queries/claims.ts` - Claims with denial metrics
   - `server/database/queries/analytics.ts` - ROI calculations

3. Update stores to use API:
   - `stores/patterns.ts` - Call `/api/patterns`
   - `stores/app.ts` - Call `/api/claims`
   - `stores/analytics.ts` - Call `/api/insights`

4. Keep fallback to JSON for dev/testing

**Testing**:
- Verify dashboard metrics match current values
- Verify pattern lists and scores are identical
- Test performance with 1000+ claims

**Deliverable**: 
- All dashboard metrics served from database
- API layer complete
- Performance acceptable (< 500ms response time)

---

### Phase 2: Computation (Days 6-10)
**Goal**: Move metric calculation from client to server

**Tasks**:
1. Create computation engine:
   - `server/services/patternDetection.ts` - Identify new patterns in claims
   - `server/services/metricComputation.ts` - Calculate baseline/current metrics
   - `server/services/policyMatching.ts` - Match claims to policies

2. Implement batch computation jobs:
   - Daily pattern score recalculation
   - Daily policy metric updates
   - Weekly provider performance aggregation

3. Update tables with computed values:
   - Populate `pattern_daily_metrics` from claims
   - Populate `policy_daily_metrics` from claims
   - Update `patterns.baselineX` and `patterns.currentX` fields

4. Create stored procedures for complex aggregations:
   - `compute_pattern_metrics(patternId, periodStart, periodEnd)`
   - `compute_policy_metrics(policyId, periodStart, periodEnd)`
   - `compute_provider_performance(providerId)`

**Challenges**:
- Deciding time windows for baseline vs current
- Handling retroactive pattern detection (old claims)
- Versioning metric definitions

**Deliverable**:
- All pattern metrics computed on server
- All policy metrics computed on server
- Batch jobs running successfully
- Dashboard values match previous results

---

### Phase 3: Real-Time Data (Days 11-15)
**Goal**: Support live claim ingestion

**Tasks**:
1. Create claim ingestion API:
   - `POST /api/admin/claims/import` - Single claim
   - `POST /api/admin/claims/batch` - Bulk import
   - Validate claim structure before insert

2. Create pattern detection triggers:
   - On claim insert, check if it matches existing patterns
   - Create new patterns if threshold of similar denials met
   - Update pattern metrics immediately

3. Update learning events to be real:
   - Replace static learningEvents.json with actual events
   - Track when users practice patterns
   - Track actual corrections applied to claims

4. Create admin dashboard for data management:
   - View imported claims
   - Trigger manual metric recalculation
   - See computation job status

**Deliverable**:
- Claims can be manually ingested
- Pattern detection works on new claims
- Real learning events tracked
- Metrics update on demand

---

### Phase 4: Historical Data & Analytics (Days 16-20)
**Goal**: Support historical analysis and trend reporting

**Tasks**:
1. Create historical data layer:
   - `pattern_monthly_metrics` - Monthly aggregates
   - `claim_monthly_metrics` - Monthly claim stats
   - `provider_quarterly_metrics` - Quarterly provider performance

2. Implement lookback queries:
   - Baseline period calculation (e.g., 90 days before first detection)
   - Trend line calculation (deny rate trajectory)
   - Improvement tracking over time

3. Create reporting queries:
   - "Patterns improving most" (deny rate reduction)
   - "Highest impact patterns" (dollars at risk)
   - "Most practiced patterns" (user engagement)

4. Build export functionality:
   - CSV export of claims data
   - PDF reports for pattern analysis
   - Excel dashboards with dynamic data

**Deliverable**:
- Historical analysis available
- Trend reports working
- Data export capabilities
- All previous reports still work

---

### Phase 5: Optimization & Cleanup (Days 21+)
**Goal**: Optimize performance and retire JSON files

**Tasks**:
1. Database optimization:
   - Add indexes on frequently queried columns
   - Create materialized views for complex queries
   - Archive old claim data (> 2 years)

2. Performance tuning:
   - Cache frequently accessed patterns (Redis/in-memory)
   - Implement query result caching
   - Batch metric computations into off-peak hours

3. Remove JSON dependencies:
   - Delete `public/data/` files
   - Remove JSON import statements
   - Remove fallback logic

4. Documentation:
   - Update README with database architecture
   - Document computation algorithms
   - Create runbooks for operations

**Deliverable**:
- Fully database-driven system
- Performance optimized
- Clean codebase without JSON files
- Complete documentation

---

## Part 6: Detailed Computation Algorithms

### 6.1 Pattern Score Calculation

**Input**: All claims matching a pattern (claim.denialReason matches pattern definition)

**Computation**:
```typescript
function computePatternScore(patternId: string, periodEnd: Date = now) {
  const periodStart = subMonths(periodEnd, 6) // 6-month lookback
  
  const claimsInPattern = db.query(
    `SELECT * FROM claims 
     WHERE denial_reason LIKE ? 
     AND date_of_service >= ? AND date_of_service <= ?`,
    [patternId, periodStart, periodEnd]
  )
  
  // Frequency: count of denials
  const frequency = claimsInPattern.length
  
  // Impact: total billed amount
  const impact = claimsInPattern.reduce((sum, c) => sum + c.billedAmount, 0)
  
  // Recency: days since last occurrence
  const lastOccurrence = claimsInPattern[0].dateOfService
  const recency = differenceInDays(periodEnd, lastOccurrence)
  
  // Trend: deny rate in current period vs previous period
  const currentPeriod = subMonths(periodEnd, 1)
  const previousPeriod = subMonths(currentPeriod, 1)
  
  const currentDenials = claimsInPattern.filter(
    c => c.dateOfService >= currentPeriod
  ).length
  const currentTotal = db.query(
    `SELECT COUNT(*) FROM claims 
     WHERE date_of_service >= ? AND date_of_service <= ?`,
    [currentPeriod, periodEnd]
  ).length
  const currentDenialRate = currentTotal > 0 ? currentDenials / currentTotal : 0
  
  const previousDenials = claimsInPattern.filter(
    c => c.dateOfService >= previousPeriod && c.dateOfService < currentPeriod
  ).length
  const previousTotal = db.query(
    `SELECT COUNT(*) FROM claims 
     WHERE date_of_service >= ? AND date_of_service < ?`,
    [previousPeriod, currentPeriod]
  ).length
  const previousDenialRate = previousTotal > 0 ? previousDenials / previousTotal : 0
  
  const trend = currentDenialRate < previousDenialRate ? 'down' 
              : currentDenialRate > previousDenialRate ? 'up' 
              : 'stable'
  
  // Velocity: denials per month
  const monthsSpan = differenceInMonths(periodEnd, periodStart) || 1
  const velocity = frequency / monthsSpan
  
  // Confidence: based on evidence count and consistency
  const consistency = /* check if denials are spread over time */
  const confidence = calculatePatternConfidence(frequency, monthsSpan, consistency)
  
  return { frequency, impact, trend, velocity, confidence, recency }
}
```

### 6.2 Baseline vs Current Period Calculation

**Used by**: Impact tab for trend visualization

```typescript
function computeBaselineAndCurrent(
  patternId: string,
  analysisDate: Date = now
) {
  const pattern = db.patterns.get(patternId)
  
  // Determine baseline period (first 30-90 days after detection)
  const baselineStart = pattern.firstDetected
  const baselineEnd = addDays(baselineStart, 60)
  
  // Determine current period (most recent 60 days)
  const currentEnd = analysisDate
  const currentStart = subDays(currentEnd, 60)
  
  // Get all claims matching pattern in each period
  const baselineClaims = queryClaims({
    patternId,
    dateRange: [baselineStart, baselineEnd]
  })
  
  const currentClaims = queryClaims({
    patternId,
    dateRange: [currentStart, currentEnd]
  })
  
  // Calculate metrics for each period
  const baselineMetrics = {
    claimCount: baselineClaims.length,
    deniedCount: baselineClaims.filter(c => c.status === 'denied').length,
    denialRate: deniedCount / claimCount,
    dollarsDenied: sumBilledAmounts(baselineClaims),
    appealCount: baselineClaims.filter(c => c.appealStatus).length
  }
  
  const currentMetrics = {
    claimCount: currentClaims.length,
    deniedCount: currentClaims.filter(c => c.status === 'denied').length,
    denialRate: deniedCount / claimCount,
    dollarsDenied: sumBilledAmounts(currentClaims),
    appealCount: currentClaims.filter(c => c.appealStatus).length
  }
  
  // Store in pattern_snapshots table for history
  db.patternSnapshots.insert({
    patternId,
    snapshotDate: analysisDate.toISOString(),
    periodStart: baselineStart.toISOString(),
    periodEnd: baselineEnd.toISOString(),
    ...baselineMetrics
  })
  
  // Also update patterns table current fields
  db.patterns.update(patternId, {
    currentStart,
    currentEnd,
    currentClaimCount: currentMetrics.claimCount,
    currentDeniedCount: currentMetrics.deniedCount,
    currentDenialRate: currentMetrics.denialRate,
    currentDollarsDenied: currentMetrics.dollarsDenied
  })
  
  return { baselineMetrics, currentMetrics }
}
```

### 6.3 Policy Metrics Calculation

**Used by**: Policies page to show which policies have most impact

```typescript
function computePolicyMetrics(
  policyId: string,
  periodEnd: Date = now
) {
  const period = subMonths(periodEnd, 3) // 3-month window
  
  // Find all claims matching this policy's codes
  const policy = db.policies.get(policyId)
  const procedureCodes = policy.procedureCodes // junction table
  
  const matchingClaims = db.query(
    `SELECT c.* FROM claims c
     INNER JOIN claim_line_items cli ON c.id = cli.claim_id
     WHERE cli.procedure_code IN (${procedureCodes.join(',')})
     AND c.date_of_service >= ? AND c.date_of_service <= ?`,
    [period, periodEnd]
  )
  
  // Calculate metrics
  const hitRate = matchingClaims.length / totalClaimsInPeriod * 100
  const deniedClaims = matchingClaims.filter(c => c.status === 'denied')
  const denialRate = deniedClaims.length / matchingClaims.length * 100
  const appealedDenials = deniedClaims.filter(c => c.appealStatus)
  const appealRate = appealedDenials.length / deniedClaims.length * 100
  const overturnedAppeals = appealedDenials.filter(c => c.appealStatus === 'overturned')
  const overturnRate = overturnedAppeals.length / appealedDenials.length * 100
  
  // Impact: potential revenue if policy were perfect
  const impact = deniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)
  
  // Provider impact
  const providersImpacted = new Set(
    matchingClaims.map(c => c.providerId)
  ).size
  
  // Related patterns
  const relatedPatterns = db.query(
    `SELECT DISTINCT p.id FROM patterns p
     INNER JOIN pattern_related_codes prc ON p.id = prc.pattern_id
     WHERE prc.code IN (${procedureCodes.join(',')})
     AND p.status != 'resolved'`
  )
  
  // Trend: compare this period to previous
  const previousPeriod = subMonths(period, 3)
  const previousDenialRate = /* calculate same way for previous period */
  const trend = currentDenialRate < previousDenialRate ? 'down'
              : currentDenialRate > previousDenialRate ? 'up'
              : 'stable'
  
  // Store metrics
  db.policies.update(policyId, {
    hitRate,
    denialRate,
    appealRate,
    overturnRate,
    impact,
    providersImpacted,
    insightCount: relatedPatterns.length,
    trend,
    lastComputedAt: periodEnd.toISOString()
  })
}
```

---

## Part 7: Implementation Checklist

### Data Layer Setup
- [ ] Create `code_intelligence` table
- [ ] Create `pattern_daily_metrics` table
- [ ] Create `policy_daily_metrics` table
- [ ] Create `provider_performance` table
- [ ] Add computed fields to `patterns` table
- [ ] Add computed fields to `policies` table
- [ ] Normalize `learning_events` fields
- [ ] Create migration script
- [ ] Create seeding script

### API Layer
- [ ] Create `/api/metrics/dashboard` endpoint
- [ ] Create `/api/patterns` endpoint with filtering
- [ ] Create `/api/claims` endpoint with filtering
- [ ] Create `/api/policies` endpoint
- [ ] Create `/api/insights` endpoint
- [ ] Add authentication/authorization
- [ ] Add error handling
- [ ] Add response caching

### Computation Services
- [ ] Create pattern detection service
- [ ] Create metric computation service
- [ ] Create policy matching service
- [ ] Implement batch job scheduler
- [ ] Create stored procedures
- [ ] Add logging/monitoring
- [ ] Handle edge cases (no data, etc.)

### Frontend Updates
- [ ] Update `stores/patterns.ts` to use API
- [ ] Update `stores/app.ts` to use API
- [ ] Update `stores/analytics.ts` to use API
- [ ] Update `stores/events.ts` to use API
- [ ] Remove hardcoded `revenueRecovered` value
- [ ] Add loading states to pages
- [ ] Add error handling
- [ ] Test all dashboard metrics

### Testing & Validation
- [ ] Unit tests for computation functions
- [ ] Integration tests for API endpoints
- [ ] Data validation (claims → patterns)
- [ ] Performance tests (1000+ claims)
- [ ] Backward compatibility tests
- [ ] User acceptance testing
- [ ] Document test results

### Deployment & Cleanup
- [ ] Database migration scripts
- [ ] Backup strategy
- [ ] Rollback plan
- [ ] Remove JSON files
- [ ] Update documentation
- [ ] Performance monitoring
- [ ] Success criteria met

---

## Part 8: Success Criteria

### Functional
1. ✅ All dashboard metrics compute from database
2. ✅ Pattern scores recalculate automatically daily
3. ✅ Policy metrics reflect actual claim outcomes
4. ✅ Revenue recovered value is computed (not hardcoded)
5. ✅ Baseline vs current metrics track improvement
6. ✅ Learning events are real user actions

### Performance
1. ✅ Dashboard loads in < 500ms
2. ✅ Pattern list loads in < 1s
3. ✅ Handles 1000+ claims without lag
4. ✅ Metric recalculation runs in < 2 minutes
5. ✅ Memory usage stable (no memory leaks)

### Quality
1. ✅ No hardcoded values in metrics
2. ✅ All computations auditable (logged)
3. ✅ Data consistency maintained
4. ✅ Historical data preserved
5. ✅ All tests passing

---

## Part 9: Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Metric computation differs from current | High | Medium | Run both systems in parallel, validate results |
| Performance degradation | High | Medium | Test with 10k claims before rollout |
| Data loss during migration | Critical | Low | 3x backups, rollback plan tested |
| Complexity of new patterns | Medium | High | Start with simple rule-based patterns |
| User confusion with real data | Medium | Low | Communication plan, beta testing |
| Computation jobs fail silently | High | Medium | Monitoring + alerts + logs |

---

## Part 10: Success Metrics & Monitoring

### What to Track
1. **Data freshness**: When were metrics last computed?
2. **Computation accuracy**: Do results match manual spot checks?
3. **Pattern quality**: Are detected patterns real?
4. **Performance**: Query response times?
5. **Data volume**: How many claims per day?

### Alerts to Set Up
1. Computation job failed
2. Metric computation > 5 minutes
3. API response time > 1 second
4. Database disk usage > 80%
5. Claims imported but not matched to patterns

---

## Summary Table: What Stays Static vs What Computes

| Item | Current | Target | Complexity |
|------|---------|--------|-----------|
| Claims data | ✅ JSON | 📊 DB | Low |
| Pattern list | 🔄 JSON (static patterns) | 🔄 Auto-detect | **High** |
| Pattern scores | 🔄 Static in JSON | 🔄 Computed daily | Medium |
| Policy metrics | 🔄 Static in JSON | 🔄 Computed daily | Medium |
| Learning events | ✅ JSON (mock) | 📊 Real events | Low |
| Dashboard metrics | 🔄 Client-computed | 🔄 Server-computed | Low |
| Revenue recovered | ❌ Hardcoded 127500 | 🔄 Computed | Low |
| Provider performance | ❌ Not tracked | 🔄 Computed | Medium |
| Code intelligence | ✅ JSON reference | 📊 DB | Low |

**Legend**: ✅ Keep as-is | 📊 Static data → DB | 🔄 Compute from data | ❌ Missing

---

## Next Steps

1. **Review** this document with team
2. **Prioritize** phases based on business need
3. **Start Phase 0** immediately (setup)
4. **Run Phase 1 parallel** with current system (read from DB, fallback to JSON)
5. **Validate** each phase before proceeding
6. **Document** learnings for future reference

---

**Document prepared**: January 9, 2026  
**Ready for**: Team review and prioritization
