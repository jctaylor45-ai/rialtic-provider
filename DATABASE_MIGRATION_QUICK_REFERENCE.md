# Database Migration: Quick Reference Guide

**Version**: 1.0  
**Date**: January 9, 2026  
**Use This**: During implementation and as a checklist

---

## One-Pager: What's Static vs What Computes

### ❌ Currently Hardcoded (Must Fix)

```
Dashboard:
- Revenue Recovered: hardcoded to $127,500
- Patterns Improving/Stable/Regressing: filtered by static JSON data
- Recent Issues: from patterns.json (static file)

Impact Tab:
- Baseline metrics: generated from static pattern data
- Current metrics: guesswork with sparkline generation
- Denied dollars sparkline: hardcoded fallback values
```

### 🔄 Currently Computed but from Static Data (Should Compute from DB)

```
Dashboard:
- Denial Rate: calculated from claims.json in memory
- Denied Amount: sum of claims.json
- Pattern Scores: from patterns.json (never updates)
- Critical Patterns: filtered from static list

Pattern Page:
- Score (frequency, impact, trend, velocity, confidence, recency)
- Learning Progress: from static patterns.json
- Evidence count: from static array
- Practice sessions completed: hardcoded

Impact/ROI Tab:
- Estimated Savings: calculatePracticeROI() from memory
- Avoided Denials: sum of pattern frequencies
- Improved Approval Rate: calculation from static data
- Pattern Impact: per-pattern metrics from JSON
```

### ✅ Already Database-Ready (Minor Changes Only)

```
- Claims data (table exists, schema correct)
- Providers data (table exists)
- Learning Events (table exists, mostly used)
- Policies reference data (table exists)
- Policy-Procedure code mappings (table exists)
```

---

## Data Types Mapping

### Claims

**Current Source**: `public/data/claims.json`  
**Database Table**: `claims`  
**Fields Used on Dashboard**:
- `status` (denied, approved, pending)
- `billedAmount` (sum for denied amount)
- `submissionDate` (filter by date range)
- `denialReason` (group for pattern detection)

**Missing Fields to Add**:
- Link to pattern (currently inferred from denial reason)
- Line item details (some exist in DB, need to use)

---

### Patterns

**Current Source**: `public/data/patterns.json`  
**Database Table**: `patterns`  
**Fields Used on Dashboard**:
- `score` (frequency, impact, trend, velocity, confidence, recency)
- `status` ('active', 'improving', 'resolved')
- `tier` ('critical', 'high', 'medium', 'low')
- `totalAtRisk` (total potential recovery)
- `learningProgress` (0-100%)
- `improvements` (array of improvements)

**Currently Hardcoded in JSON**:
- `score.frequency` - SHOULD compute from # of denials
- `score.trend` - SHOULD compute from current vs baseline
- `learningProgress` - SHOULD track from actual user practice
- `improvements` - SHOULD auto-generate from learning events

---

### Revenue Recovered

**Current**: $127,500 hardcoded  
**Should Be**: 
```
Sum across all patterns of:
  (baseline_denial_rate - current_denial_rate) 
  × claims_in_current_period 
  × pattern.avg_denial_amount
```

**Formula in SQL**:
```sql
SELECT
  SUM(
    ((p.baseline_denial_rate - p.current_denial_rate) / 100)
    * (SELECT COUNT(*) FROM claims WHERE DATE(submission_date) >= CURRENT_DATE - 30)
    * p.avg_denial_amount
  )
FROM patterns p
WHERE p.status IN ('improving', 'resolved');
```

---

## File Organization

### Static Data (Will Eventually Retire)

```
public/data/
├── claims.json           ← Use as seed for initial DB load
├── patterns.json         ← Reference for pattern definitions
├── policies.json         ← Reference for policy rules
├── providers.json        ← Reference for provider metadata
├── learningEvents.json   ← Replace with real events
├── codeIntelligence.json ← Seed code_intelligence table
└── insights.json         ← Remove (duplicate of patterns)
```

### New Code to Create

```
server/
├── api/
│   ├── metrics/
│   │   └── dashboard.ts        ← New: dashboard metrics endpoint
│   ├── patterns/
│   │   ├── index.ts            ← New: pattern list with scores
│   │   └── [id].ts             ← New: single pattern detail
│   ├── claims/
│   │   ├── index.ts            ← New: claims list
│   │   └── [id].ts             ← New: claim detail
│   ├── policies/
│   │   └── index.ts            ← New: policy list
│   └── admin/
│       └── claims/
│           ├── import.ts       ← New: import single claim
│           └── batch.ts        ← New: batch import
│
├── services/
│   ├── patternDetection.ts     ← New: detect patterns in claims
│   ├── metricComputation.ts    ← New: compute scores
│   ├── policyMatching.ts       ← New: match claims to policies
│   └── snapshotService.ts      ← New: create metric snapshots
│
├── jobs/
│   └── computeMetrics.ts       ← New: batch job scheduler
│
└── database/
    └── queries/
        ├── patterns.ts         ← New: pattern queries with aggregation
        ├── claims.ts           ← New: claim queries
        └── analytics.ts        ← New: analytics queries
```

---

## Database Schema Quick Lookup

### New Tables to Create

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `code_intelligence` | Procedure code reference data | `procedureCode`, `category`, `avgReimbursement`, `commonDenialReasons` |
| `pattern_daily_metrics` | Historical pattern trends | `patternId`, `metricDate`, `claimCount`, `denialRate`, `dollarsDenied` |
| `policy_daily_metrics` | Policy impact over time | `policyId`, `metricDate`, `hitCount`, `denialRate` |
| `provider_performance` | Provider-level aggregates | `providerId`, `denialRate`, `improvementTrend` |

### New Fields to Add to Existing Tables

| Table | Fields | Type | Purpose |
|-------|--------|------|---------|
| `patterns` | `baselineStart`, `baselineEnd`, `baselineDenialRate`, `baselineDollarsDenied` | TEXT, TEXT, REAL, REAL | Track improvement baseline |
| `patterns` | `currentStart`, `currentEnd`, `currentDenialRate`, `currentDollarsDenied` | TEXT, TEXT, REAL, REAL | Track current metrics |
| `patterns` | `lastComputedAt` | TEXT | Know when metrics were updated |
| `policies` | `lastComputedAt` | TEXT | Know when metrics were updated |
| `learning_events` | `durationMs`, `outcomeType`, `patternId` | INTEGER, TEXT, TEXT | Normalize and track outcomes |
| `claim_line_items` | `denialReason`, `patternsTriggered` | TEXT, TEXT | Link to denial patterns |

---

## API Endpoints to Implement

### 1. Dashboard Metrics

```
GET /api/metrics/dashboard?days=30

Response:
{
  "deniedAmount": 45234,
  "denialRate": 18.5,
  "approvalRate": 81.5,
  "totalClaims": 342,
  "deniedClaims": 63,
  "patternsDetected": 7,
  "criticalPatterns": 2,
  "revenueRecovered": 47500,        ← COMPUTED (not hardcoded!)
  "trends": {
    "denialRate": -2.3,              ← vs previous period
    "approvalRate": +2.3,
    "patternsDetected": 0
  }
}
```

### 2. Patterns List

```
GET /api/patterns?status=active&tier=critical&limit=10

Response:
{
  "patterns": [
    {
      "id": "PTN-001",
      "title": "E&M Visits Missing Modifier 25",
      "score": {
        "frequency": 28,             ← COMPUTED from claims
        "impact": 7890,              ← COMPUTED from billed amounts
        "trend": "down",             ← COMPUTED from baseline vs current
        "velocity": 4.7,             ← COMPUTED per month
        "confidence": 92,            ← COMPUTED from evidence
        "recency": 12                ← COMPUTED days
      },
      "currentDenialRate": 15,       ← COMPUTED
      "baselineDenialRate": 28,      ← COMPUTED from first period
      "learningProgress": 68,        ← COMPUTED from practice sessions
      ...
    }
  ]
}
```

### 3. Claims List

```
GET /api/claims?status=denied&dateRange=30&page=1&limit=20

Response:
{
  "claims": [
    {
      "id": "CLM-2025-3001",
      "patientName": "Doe, John",
      "billedAmount": 285,
      "status": "denied",
      "denialReason": "Missing Modifier 25",
      "matchedPatterns": ["PTN-001"],
      ...
    }
  ],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "pages": 18
  }
}
```

---

## Computation Formulas

### Pattern Score Components

```typescript
// Frequency: count of denials matching pattern
frequency = count(claims where denialReason matches pattern)

// Impact: total dollars denied
impact = sum(claims[].billedAmount where status='denied')

// Trend: compare current month to previous month
currentMonthDenials = count(claims in current month)
previousMonthDenials = count(claims in previous month)
trend = currentMonthDenials < previousMonthDenials ? 'down'
      : currentMonthDenials > previousMonthDenials ? 'up'
      : 'stable'

// Velocity: denials per month
velocity = frequency / months_since_detection

// Confidence: more evidence = higher confidence
confidence = min(frequency / 10, 1) * 100

// Recency: days since last occurrence
recency = days_since(latest claim matching pattern)

// Tier: priority based on score
tier = frequency > 20 && impact > 5000 ? 'critical'
     : frequency > 10 && impact > 2000 ? 'high'
     : frequency > 5 ? 'medium'
     : 'low'
```

### Revenue Recovered Formula

```typescript
// For each pattern
improvementRate = currentDenialRate < baselineDenialRate 
                ? (baselineDenialRate - currentDenialRate) / baselineDenialRate
                : 0

potentialSavings = frequency * avgDenialAmount
estimatedRecovery = potentialSavings * improvementRate

// Aggregate across patterns
totalRevenueRecovered = sum(estimatedRecovery for all patterns)
```

---

## Migration Checklist

### Phase 0: Setup (Days 1-2)

- [ ] Create `code_intelligence` table
- [ ] Create `pattern_daily_metrics` table
- [ ] Create `policy_daily_metrics` table
- [ ] Create `provider_performance` table
- [ ] Add computed fields to `patterns` table
- [ ] Add computed fields to `policies` table
- [ ] Add computed fields to `learning_events` table
- [ ] Write migration script
- [ ] Test migration with sample data

### Phase 1: Read Path (Days 3-5)

- [ ] Create `/api/metrics/dashboard` endpoint
- [ ] Create `/api/patterns` endpoint
- [ ] Create `/api/claims` endpoint
- [ ] Create `/api/policies` endpoint
- [ ] Update `stores/patterns.ts` to use API
- [ ] Update `stores/app.ts` to use API
- [ ] Update `stores/analytics.ts` to use API
- [ ] Test all dashboard metrics match current values
- [ ] Performance test (< 500ms response time)

### Phase 2: Computation (Days 6-10)

- [ ] Create `patternDetection.ts` service
- [ ] Create `metricComputation.ts` service
- [ ] Create `policyMatching.ts` service
- [ ] Implement cron jobs for batch updates
- [ ] Run both systems in parallel
- [ ] Validate computed metrics match
- [ ] Update pattern metrics daily
- [ ] Update policy metrics daily

### Phase 3: Real Data (Days 11-15)

- [ ] Create `/api/admin/claims/import` endpoint
- [ ] Implement claim validation
- [ ] Create pattern detection on import
- [ ] Update learning events in real-time
- [ ] Test with manual claim import
- [ ] Document admin procedures

### Phase 4: Historical Data (Days 16-20)

- [ ] Create monthly metric aggregates
- [ ] Implement lookback queries
- [ ] Build reporting views
- [ ] Create data export functionality
- [ ] Archive old claims data

### Phase 5: Optimization (Days 21+)

- [ ] Add database indexes
- [ ] Implement query caching
- [ ] Retire JSON files
- [ ] Update documentation
- [ ] Set up monitoring and alerts

---

## Testing Checklist

### Data Validation

- [ ] Total claims match between JSON and DB
- [ ] Denied claims count matches
- [ ] Denial rate calculation matches (to 2 decimal places)
- [ ] Pattern frequency matches
- [ ] Pattern impact (total dollars) matches

### Performance Testing

- [ ] Dashboard loads in < 500ms with 1000 claims
- [ ] Pattern list loads in < 1s with 100 patterns
- [ ] Computation job completes in < 2 minutes
- [ ] No memory leaks in sustained test (1 hour)

### Business Logic Testing

- [ ] Trends calculated correctly (current vs baseline)
- [ ] Revenue recovered shows positive value
- [ ] Pattern tier assignment correct
- [ ] Learning progress reflects practice sessions
- [ ] Policy matching produces expected results

---

## Fallback & Rollback

### If Computation Fails

**Automatic Fallback**:
1. Catch error in API endpoint
2. Log error with timestamp
3. Return last-known-good cached result
4. Alert ops team

**Manual Fallback**:
```bash
# Revert to JSON-based system
# In stores/*.ts, change:
# const data = await $fetch('/api/...')
# To:
# const data = await $fetch('/data/....json')
```

**Expected Impact**: None (users see cached data from 24 hours ago)

### If Metrics Don't Match

**Troubleshooting**:
1. Compare JSON values with computed values
2. Identify which metric is off
3. Check computation logic
4. Adjust formula if needed
5. Re-run computation
6. Validate matches

**Timeline**: Can debug and fix within 4-8 hours

---

## Monitoring & Alerts

### What to Track

```
Daily:
- Computation job execution time (should be < 2 min)
- Computation job success rate (should be 100%)
- API response times (should be < 500ms)
- Data freshness (metrics should be < 24h old)

Weekly:
- Error rate in API endpoints (should be < 0.1%)
- Database disk usage (alert if > 80%)
- Query performance (slowest should be < 1s)
- Metric accuracy (spot check against manual calc)

Monthly:
- Storage growth (should track with claim volume)
- Computation efficiency (should be consistent)
- User feedback on metric accuracy
```

### Alert Thresholds

```
RED ALERTS (Immediate Action):
- Computation job failed 2x in a row
- API down time > 5 min
- Database error rate > 1%

YELLOW ALERTS (Review Soon):
- Computation job > 5 minutes
- API response > 1 second
- Metrics not updated > 48 hours
- Database disk > 80%

BLUE ALERTS (FYI):
- New pattern detected
- High-velocity pattern (trend changing fast)
- Large import completed
```

---

## Questions This Answers

**Q: Why can't we just keep using JSON?**  
A: JSON can't support real claims, real pattern detection, or auditable metrics. It's a PoC tool.

**Q: Will users notice any change?**  
A: Only positive changes - metrics will be more accurate and current. UI/UX stays the same.

**Q: What if computation has bugs?**  
A: Automatic fallback to last-known-good cached value. No user impact. Bugs take hours to fix, not days.

**Q: How do we verify metrics are correct?**  
A: Compare computed metrics vs manual spot checks for first week. Both systems run in parallel.

**Q: What's the minimum viable product?**  
A: Phase 0 + Phase 1 = Dashboard reads real claim data. That's enough to show the difference.

---

## Success Criteria

**You'll know this is working when**:

1. ✅ Dashboard shows real denial rates (not hardcoded numbers)
2. ✅ Revenue recovered is computed from actual pattern improvements
3. ✅ Patterns detected automatically as claims are imported
4. ✅ Learning events track real user practice sessions
5. ✅ All metrics update daily (not stuck on static data)
6. ✅ API response time < 500ms
7. ✅ Zero errors in computation jobs
8. ✅ Metrics match between systems for 1 week straight

---

**Reference Guide Ready For**: Implementation team  
**Last Updated**: January 9, 2026

