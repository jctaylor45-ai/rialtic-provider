# Database Migration: Executive Summary

**Version**: 1.0  
**Date**: January 9, 2026  
**Audience**: Product, Engineering, Stakeholders

---

## The Current State

Your Provider Portal is built on **static JSON files** serving hardcoded data. Every metric you see on the dashboard—denial rates, revenue recovered, pattern analysis—is computed from sample data that was created months ago and never updates.

**Current Data Flow**:
```
JSON Files (public/data/) → Browser Load → Client-Side Calculation → Display
```

This works great for a PoC, but makes it impossible to:
- Track real claim outcomes
- Detect actual denial patterns
- Show real ROI from learning
- Support multiple practices or payers
- Audit how metrics are calculated

---

## Why This Matters

### The "Revenue Recovered" Problem

Look at your dashboard's Revenue Recovered metric:

```typescript
// pages/index.vue, line 500
const revenueRecovered = computed(() => {
  return 127500 // Hardcoded placeholder
})
```

This number is **hardcoded to $127,500**. It doesn't change. It's not real.

### What Should Happen

When a practice uses Claim Lab to practice fixing a pattern, then applies that correction to real claims:

1. ✅ Upload real claims → Database
2. ✅ Pattern detection runs → Identifies "Missing Modifier 25" issues
3. ✅ Provider practices in Claim Lab → Records improvement
4. ✅ Provider applies fix to future claims → Denial rate drops
5. ✅ Dashboard updates automatically → Shows "$47,500 recovered this month"

**Today**: None of this is possible. Everything is static.

---

## The Opportunity

### What We're Asking You To Do

Migrate from static JSON to a **live database** with **automated computation**. This means:

- **Real claim data** flows in from your payer/clearinghouse API
- **Pattern detection** identifies actual denial trends automatically
- **Learning is tracked** - we know when providers practice and when they apply fixes
- **Metrics compute automatically** - dashboard updates daily with real numbers
- **ROI is measurable** - "We recovered $2.3M in denied claims last quarter"

### The Timeline

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **0: Setup** | 2 days | Create database tables, prepare infrastructure |
| **1: Read Path** | 3 days | Dashboard starts reading from database |
| **2: Computation** | 5 days | Metrics compute on server, not client |
| **3: Real Data** | 5 days | Accept real claims via API |
| **4: Analytics** | 5 days | Historical trends and reports |
| **5: Optimize** | 5+ days | Performance tuning, cleanup |

**Total**: 3-4 weeks for a fully functional system

### What Gets Better

#### For Users (Providers)
- ✅ See real claims in their account
- ✅ Track actual denial patterns
- ✅ Practice on patterns that matter to them
- ✅ See real ROI from using the tool
- ✅ Export reports for hospital administration

#### For Your Business
- ✅ Demonstrate real value (not fake metrics)
- ✅ Support enterprise customers (multi-provider, multi-payer)
- ✅ Charge based on actual results
- ✅ Defend math with audit logs
- ✅ Scale to thousands of claims per day

---

## What Needs to Change

### 1. Database Schema (Add 4 New Tables)

Currently, your database exists but is empty. We need to add:

| Table | Purpose | Example Records |
|-------|---------|-----------------|
| `code_intelligence` | Procedure code reference | "99213: E&M visit, requires modifier 25" |
| `pattern_daily_metrics` | Historical pattern trends | "Jan 9: Modifier 25 issue → 28 denials" |
| `policy_daily_metrics` | Policy impact tracking | "Jan 9: Policy 001 → 5% denial rate" |
| `provider_performance` | Provider-level aggregates | "Dr. Smith: 15% denial rate, improving" |

**Total new schema**: ~200 lines of SQL

### 2. API Layer (Add 5 New Endpoints)

Replace JSON file loads with real API calls:

| Endpoint | Purpose | Current |
|----------|---------|---------|
| `GET /api/metrics/dashboard` | Dashboard numbers | `fetch('/data/claims.json')` |
| `GET /api/patterns` | Pattern list with scores | Load from `patterns.json` |
| `GET /api/claims` | Claim list with filters | Load from `claims.json` |
| `GET /api/policies` | Policy metrics | Load from `policies.json` |
| `POST /api/admin/claims/import` | Ingest real claims | **NEW** |

**Total new code**: ~300 lines of TypeScript

### 3. Computation Engine (Add 3 Services)

Move calculation from browser to server:

| Service | Purpose | Runs |
|---------|---------|------|
| `patternDetection` | Identify new patterns in claims | Every 6 hours |
| `metricComputation` | Update pattern/policy scores | Daily at 2 AM |
| `policyMatching` | Link claims to policies | As claims arrive |

**Total new code**: ~600 lines of TypeScript

### 4. Frontend Updates (Minor Changes)

Update stores to use API instead of JSON:

```typescript
// BEFORE (loads static JSON)
const patterns = await $fetch('/data/patterns.json')

// AFTER (loads computed data)
const patterns = await $fetch('/api/patterns?status=active')
```

**Total changes**: ~100 lines, mostly in stores

---

## Risk Assessment

### Low Risk
- ✅ Database schema is already defined (you have `drizzle.config.ts`)
- ✅ API layer is straightforward REST
- ✅ Can run in parallel with current JSON system
- ✅ Zero breaking changes to user experience

### Medium Risk
- ⚠️ Computation algorithms must match current results exactly
- ⚠️ Performance must stay < 500ms for dashboard
- ⚠️ Metric definitions need documentation

### Mitigation
1. **Run in parallel** - Both systems for 1 week, validate results match
2. **Gradual rollout** - 10% of users → 50% → 100%
3. **Monitoring** - Track computation time, error rates, data quality
4. **Rollback plan** - Can switch back to JSON in 5 minutes

---

## Business Impact

### Pricing & GTM
**Current**: "Here's a PoC with sample data"  
**Future**: "See real claims, real patterns, real ROI"

This changes your value prop from demo → production.

### Customer Types You Can Now Serve

| Type | Requires | Enabled By? |
|------|----------|-----------|
| Small practice (1 provider, 100 claims/month) | Basic analytics | Now ✅ |
| Hospital system (50 providers, 50K claims/month) | Real data, scaling | After this |
| Payer network (1000 providers, 1M claims/month) | Enterprise APIs, audit | After this |
| Insurance company (internal) | White-label, admin controls | After this |

### Expected Outcomes
- ✅ 5-10x better demo (real data beats sample data)
- ✅ Can sign 1-2 enterprise pilots
- ✅ Clear path to integration APIs
- ✅ Defensible ROI claims

---

## Investment

### Engineering Time
- **Development**: 100-120 hours (3 weeks, 1 senior engineer)
- **Testing**: 20-30 hours
- **Documentation**: 10-15 hours
- **Total**: ~150 hours ($15-30K depending on cost)

### Infrastructure
- **Database**: Already have SQLite, can scale to PostgreSQL later
- **Compute**: Current server handles 1M+ claims
- **No new infrastructure needed**

### Opportunity Cost
**What you CANNOT do without this**:
- Sell to enterprise customers
- Charge based on ROI
- Demonstrate real value
- Scale beyond 10 providers
- Build integrations

---

## Decision Points

### Go / No-Go

**GO IF**:
- You're planning to sell this to enterprises
- You want to demonstrate real ROI
- You have real claim data available
- You can dedicate 1 engineer for 3 weeks

**NO-GO IF**:
- This is just for internal use
- You don't have real claim data
- Budget/timeline is extremely tight
- You want to pivot to different approach

### Recommended Path Forward

1. **Week 1**: Review this analysis with team
2. **Week 2**: Technical deepdive with engineering lead
3. **Week 3**: Decide go/no-go
4. **Week 4+**: Execute Phase 0-1 in parallel with current development

---

## FAQ

### "How long until we lose the JSON files?"

Gradual transition:
- Week 1-2: API loads from JSON (fallback)
- Week 3-4: API computes from database
- Week 5+: JSON files optional (kept for backup)

### "Will users see any changes?"

No changes to UI/UX. Metrics will become:
- More accurate
- More current (real data instead of 6-month-old sample)
- Traceable (can audit how they're calculated)

### "What if computation breaks?"

Automatic fallback to JSON. Within 5 minutes of alert, can revert.

### "Do we need to change our database?"

No, SQLite works fine. Can upgrade to PostgreSQL later without schema changes.

### "What about user data privacy?"

Add admin controls for data retention, masking PII, HIPAA compliance in Phase 4.

---

## Attachments

This analysis includes:

1. **DATABASE_MIGRATION_REVIEW.md** - Comprehensive 15-section analysis
   - Inventory of all static data
   - Computed metrics breakdown
   - Schema gaps and changes needed
   - Phased migration plan (5 phases)
   - Implementation checklist

2. **DATABASE_MIGRATION_TECHNICAL.md** - Technical deep-dive
   - SQL schemas with examples
   - TypeScript API code snippets
   - Computation service examples
   - Query optimization strategies
   - Migration scripts

3. **This document** - Executive summary

---

## Recommendation

**Proceed with Phase 0 (Setup) immediately**, with Phase 1 (Read Path) starting in parallel.

This de-risks the project by:
1. Setting up infrastructure early
2. Validating schema design
3. Running both systems side-by-side
4. Catching issues before full rollout

If Phase 1 succeeds (metrics match, performance acceptable), proceed to Phase 2. If issues found, easy to adjust without impacting users.

---

## Next Meeting

Suggest: 30-minute technical review with
- Product lead
- Engineering lead  
- Data/Analytics lead

**Agenda**:
1. Questions on this analysis (15 min)
2. Database schema review (5 min)
3. Timeline/resource confirmation (5 min)
4. Go/no-go decision (5 min)

---

## Metrics to Track Going Forward

Once implemented, track these weekly:

| Metric | Target | Purpose |
|--------|--------|---------|
| API response time | < 500ms | Performance |
| Computation runtime | < 120s | Efficiency |
| Data freshness | < 24h old | Relevance |
| Metric accuracy | 100% match | Quality |
| Error rate | < 0.1% | Reliability |

---

**Prepared by**: AI Code Review  
**Date**: January 9, 2026  
**Status**: Ready for review and decision

