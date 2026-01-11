# Database Migration Plan: Refined with Continuous Data Generation

**Version**: 1.1  
**Date**: January 9, 2026  
**Status**: Updated with scenario-builder as core engine

---

## What Changed

### Before
- Static JSON files seeded once
- No new data ever arrived
- `revenueRecovered` hardcoded
- Patterns never detected (frozen)

### Now
- Scenario-builder generates **continuous mock data streams**
- New claims/appeals arrive daily (realistic volume)
- User events generated continuously
- System becomes "live" with simulated production behavior

**Impact**: You move from static PoC → realistic sandbox immediately

---

## Updated Architecture

### New Data Flow

```
Scenario Builder (UI)
    ↓
Data Generation Services
├── ClaimGenerator (creates claims with patterns)
├── AppealGenerator (appeals for denied claims)
├── UserEventGenerator (practice sessions, corrections)
└── PatternInjector (introduces denial patterns naturally)
    ↓
Database (SQLite)
    ↓
Dashboard/Pages
(Read live metrics from DB)
```

### Key Insight

Instead of:
1. Seed data once → See nothing change

You get:
1. Select scenario (e.g., "100 claims/day with modifier issues")
2. Data generates continuously
3. Patterns emerge over time
4. Users see live denial trends
5. Learning shows real ROI (practice → fewer denials)

---

## Refined 5-Phase Plan

### Phase 0: Data Generation Engine (NEW - Days 1-3)
**Instead of**: Just create tables  
**Now**: Create powerful data generation system

**Tasks**:
1. Create `ClaimGenerator` service
   - Configurable claim volume
   - Inject specific denial patterns
   - Realistic dates/amounts/providers
   - Link to procedures/diagnoses

2. Create `AppealGenerator` service
   - Generate appeals for denied claims
   - Realistic appeal outcomes (50-70% overturn)
   - Track appeal timelines

3. Create `UserEventGenerator` service
   - Generate practice sessions
   - Track corrections applied
   - Create realistic learning curves

4. Create `PatternInjector` service
   - Inject patterns naturally into claims
   - Control pattern frequency
   - Show improvement over time

5. Enhance scenario-builder UI
   - Settings for data generation rate
   - Pattern selection/configuration
   - Start/stop/pause generation
   - View generated data

**Deliverable**: Scenario-builder generates realistic data streams continuously

---

### Phase 1: Database Integration (Days 4-6)
**Same as before**, but now data flows in from generator

**Changes**:
- API accepts streamed data from generator (instead of JSON load)
- Database auto-ingests claims as they're generated
- Patterns detected automatically from generated denials

**Deliverable**: Dashboard reads live-generated data from database

---

### Phase 2: Pattern Detection (Days 7-11)
**Same as before**, optimized for stream processing

**Changes**:
- Detect patterns in real-time as claims arrive
- Update metrics daily from generated data
- Show trend lines (because data continuously arrives)

**Deliverable**: Patterns emerge and improve over time in live system

---

### Phase 3: Real Data (Days 12-16)
**Same as before**, but now you have a template

Because your generator works, adding real data is easier:
- Replace generator with API connector
- Same database ingest
- Same metric computation

**Deliverable**: Can switch to real claims seamlessly

---

### Phases 4-5: Same as before
Analytics and optimization unchanged.

---

## Why This Approach Works Better

### Problem #1: "Revenue Recovered" is $127,500
**Old approach**: Calculate from static data forever  
**New approach**: Generate claims → pattern detection detects "Missing Modifier 25" → user practices → future generated claims don't have that issue → revenue recovered automatically updates

### Problem #2: "Nothing ever changes"
**Old approach**: Same dashboard metrics for months  
**New approach**: New claims arrive daily → metrics update automatically → shows learning is working

### Problem #3: "Can't show ROI"
**Old approach**: "Here's a sample..."  
**New approach**: "Run this scenario, watch as users practice, see denial rate drop from 20% → 8% in 2 weeks"

### Problem #4: "Scaling to enterprises is hard"
**Old approach**: Would need real claim data  
**New approach**: Generate 100 providers × 1000 claims/month → show scaling works → then connect real payer

---

## Scenario-Builder as The Hub

### Current State
```
/admin/scenario-builder
├── Create scenarios (configuration)
├── Seed initial data
└── Run tests
```

### Future State
```
/admin/scenario-builder
├── Create scenarios (configuration)
├── Seed initial data
├── Configure data generation
├── Monitor live generation
├── View generated claims/patterns
├── Control generation rate
├── Generate reports
└── Export/import configurations
```

---

## Implementation Approach

### Phase 0 Breakdown (Days 1-3)

**Day 1: ClaimGenerator Service**
```
server/services/claimGenerator.ts
- generateClaim(scenario, config): Claim
- generateClaimBatch(scenario, count): Claim[]
- withDenialPattern(claim, pattern): Claim
- withRealisticVariance(claim): Claim
```

**Day 2: AppealGenerator & UserEventGenerator**
```
server/services/appealGenerator.ts
- generateAppeal(claim, scenario): Appeal
- withOverturnOutcome(appeal): Appeal

server/services/userEventGenerator.ts
- generatePracticeSession(pattern): LearningEvent[]
- generateCorrection(pattern, claim): LearningEvent
- generateEngagementPattern(user): LearningEvent[]
```

**Day 3: PatternInjector & Scheduler**
```
server/services/patternInjector.ts
- injectPattern(claims, pattern, frequency): Claim[]
- improvePattern(pattern, improvement): Claim[]

server/jobs/continuousGeneration.ts
- startGeneration(scenario)
- stopGeneration()
- pauseGeneration()
```

**Day 3: Scenario-Builder API Extensions**
```
POST /api/admin/generation/start
POST /api/admin/generation/stop
POST /api/admin/generation/pause
GET /api/admin/generation/status
POST /api/admin/generation/config
```

---

## What Claude Code Will Build

The Claude Code implementation will:

1. ✅ Create data generation services
2. ✅ Connect scenario-builder UI to generators
3. ✅ Set up continuous data stream to database
4. ✅ Build monitoring dashboard for generation
5. ✅ Create realistic claim/appeal/event generators
6. ✅ Implement pattern injection logic
7. ✅ Add scheduling/job management
8. ✅ Write tests for generators

---

## Example Scenarios

Once built, you can run:

### Scenario: "Standard Practice"
- 100 claims/day
- 20% denial rate (baseline)
- 5 patterns detected (various)
- Users practice 2 sessions/week
- Rate improves to 12% over 4 weeks

### Scenario: "High-Volume Clinic"
- 500 claims/day
- 2 providers
- 15% denial rate
- Focus on modifier and documentation issues
- Show $50K monthly recovery potential

### Scenario: "Hospital System"
- 5000 claims/day
- 20 providers
- Multiple payers
- Complex patterns
- Show enterprise-scale value

### Scenario: "Improvement Story"
- Start: 25% denial rate
- Pattern: "Missing modifier 25" (30% of denials)
- User practices intensively
- Generated claims improve naturally
- End: 8% denial rate, $200K recovered

---

## Benefits for Your Business

### Demo Power
"Watch this 2-week scenario play out in 5 minutes" is more powerful than any static data.

### Sales Tool
Generate custom scenarios for each prospect:
- "Your denial patterns" (from their data)
- "Projected improvement" (from learning)
- "Revenue recovery" (with real numbers)

### Testing
Test scaling, performance, edge cases with generated data.

### Development
Developers can add features without waiting for real data.

### Product Validation
Quickly test product changes on realistic data streams.

---

## Modified Success Criteria

### Phase 0 (New)
- ✅ Scenario-builder generates configurable claim streams
- ✅ Claims include realistic denial patterns
- ✅ Appeals generated for denied claims
- ✅ User events show practice/learning
- ✅ Data flows into database automatically
- ✅ Can start/stop generation easily

### Phases 1-2 (Existing, optimized for streams)
- ✅ Dashboard metrics update daily with new data
- ✅ Patterns detected automatically
- ✅ Learning shows real improvement
- ✅ Revenue recovered calculated from actual improvements

### Phase 3+ (Existing)
- ✅ Easy switchover to real claims
- ✅ No schema/logic changes needed

---

## Timeline (Refined)

| Phase | Duration | Focus | Owner |
|-------|----------|-------|-------|
| 0 | 3 days | Data generation engine | Claude Code |
| 1 | 3 days | API layer + database | Claude Code |
| 2 | 5 days | Metric computation | Claude Code |
| 3 | 3 days | Real data connector | Claude Code |
| 4 | 5 days | Analytics/reporting | Claude Code |
| 5 | 5+ days | Optimization/cleanup | Claude Code |
| **Total** | **2-3 weeks** | **Fully live system** | **1 engineer** |

**Faster than expected** because mock data solves "cold start" problem

---

## What This Unlocks

### Immediately (Week 1)
- Realistic demo that changes daily
- Show pattern detection working
- Show learning improving metrics
- Prove system can handle volume

### Week 2
- Add real claims from payer
- Show system seamlessly handles both
- Customer sees "this works"

### Week 3+
- Scale to multiple customers
- Each has their own scenarios
- Each shows real ROI

---

## Next: Claude Code Prompt

See separate prompt document (below) for specific implementation instructions for Claude Code to execute Phase 0.

---

**Ready for**: Claude Code implementation  
**Focus**: Phase 0 - Data Generation Engine  
**Duration**: 3 days  
**Complexity**: High (realistic generators) but clear scope
