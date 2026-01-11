# Claude Code Implementation Prompt: Phase 0

**Project**: Provider Portal - Database Migration Phase 0  
**Duration**: 3 days  
**Complexity**: Moderate (data generation algorithms)  
**Scope**: Build continuous mock data generation engine

---

## Start Here: The Challenge

The Provider Portal currently uses **static JSON data that never changes**. Your task is to build a **continuous mock data generator** that:

1. Generates realistic claims, appeals, and user events
2. Injects denial patterns naturally
3. Shows improvement when users practice
4. Integrates with the existing scenario-builder tool at `/admin/scenario-builder`
5. Stores all data in the SQLite database (tables already exist)

**Result**: Instead of static PoC, a "live" sandbox that demonstrates real business value.

---

## What You're Building

### Three Core Services

#### 1. ClaimGenerator
**File**: `server/services/claimGenerator.ts`

Generates realistic healthcare claims with:
- Configurable volume (10-1000 claims/day)
- Realistic claim structure (matches claims.json schema)
- Denial patterns (Missing Modifier 25, coding errors, etc.)
- Time-based distribution (claims arrive throughout day)
- Provider/patient variance (realistic mix)

**Key Functions**:
```typescript
// Generate single claim with optional denial pattern
generateClaim(scenario: Scenario, config?: GeneratorConfig): Claim

// Generate batch of claims
generateClaimBatch(scenario: Scenario, count: number, config?: GeneratorConfig): Claim[]

// Inject specific denial pattern into claim
withDenialPattern(claim: Claim, pattern: DenialPattern): Claim

// Add realistic variance (small amount variance from average)
withRealisticVariance(claim: Claim): Claim
```

**Usage Example**:
```typescript
// Generate 100 claims with 20% having modifier issues
const claims = await claimGenerator.generateClaimBatch(scenario, 100, {
  patterns: [
    { patternId: 'PTN-001', frequency: 0.20 }  // 20% of claims
  ]
})
```

#### 2. AppealGenerator
**File**: `server/services/appealGenerator.ts`

Generates appeals for denied claims with:
- Realistic appeal rate (40-70% of denials)
- Appeal outcomes (overturn rates vary by pattern)
- Realistic timelines (10-30 days to resolution)
- Pattern-specific overturn rates

**Key Functions**:
```typescript
// Generate appeal for a denied claim
generateAppeal(claim: Claim, scenario: Scenario): Appeal | null

// Add realistic outcome (overturn or upheld)
withOutcome(appeal: Appeal, patternId: string): Appeal

// Generate appeals batch
generateAppealBatch(claims: Claim[], scenario: Scenario): Appeal[]
```

#### 3. UserEventGenerator
**File**: `server/services/userEventGenerator.ts`

Generates realistic user interactions with:
- Practice sessions on specific patterns
- Learning progression (users improve over time)
- Correction application (user fixes applied to future claims)
- Engagement patterns (some users more active)

**Key Functions**:
```typescript
// Generate practice session for a pattern
generatePracticeSession(pattern: Pattern, user?: User): LearningEvent[]

// Generate correction applied
generateCorrectionApplied(pattern: Pattern, claim: Claim): LearningEvent

// Generate user engagement pattern (multiple sessions over time)
generateUserEngagementPattern(userId: string, patterns: Pattern[]): LearningEvent[]
```

#### 4. PatternInjector (Helper Service)
**File**: `server/services/patternInjector.ts`

Injects denial patterns naturally into claim streams:
- Specify pattern frequency (10%, 25%, 50% of claims)
- Show improvement over time (pattern frequency decreases)
- Make it realistic (not every claim, but consistent)

**Key Functions**:
```typescript
// Inject pattern into claim stream
injectPattern(claims: Claim[], pattern: DenialPattern, frequency: number): Claim[]

// Simulate pattern improvement (frequency decreases)
improvePattern(claims: Claim[], patternId: string, improvement: number): Claim[]
```

---

## Implementation Details

### 1. ClaimGenerator Service

**Location**: `server/services/claimGenerator.ts`

**Required**: 
- Import from `server/database/schema` (claims table)
- Use existing claim types from `types/enhancements.ts`
- Generate realistic procedure codes (99213, 99214, 36415, etc.)
- Generate realistic diagnosis codes (I10, E11.9, Z87.891, etc.)

**Realistic Data**:
```typescript
// Provider list (from providers.json)
const PROVIDERS = [
  { id: 'PRV-001', name: 'Valley Medical Associates', npi: '9261497865' },
  { id: 'PRV-002', name: 'Cardiology Partners LLC', npi: '1234567890' },
  // ... more
]

// Common procedure codes
const PROCEDURE_CODES = ['99213', '99214', '99215', '36415', '93000', '71046']

// Common diagnosis codes
const DIAGNOSIS_CODES = ['I10', 'E11.9', 'Z87.891', 'Z79.84', 'I48.91']

// Common denial reasons
const DENIAL_REASONS = [
  'Missing Modifier 25',
  'Unbundled codes',
  'Incomplete documentation',
  'Prior authorization required',
  'Exceeds frequency limits',
  'Not medically necessary'
]

// Amount ranges
const CLAIM_AMOUNTS = {
  'E&M': { min: 150, max: 300 },
  'Procedure': { min: 200, max: 1000 },
  'Lab': { min: 50, max: 200 }
}
```

**Example Implementation**:
```typescript
export async function generateClaim(
  scenario: Scenario,
  config?: GeneratorConfig
): Promise<Claim> {
  const provider = randomChoice(PROVIDERS)
  const patient = generatePatient()
  const procedureCode = randomChoice(PROCEDURE_CODES)
  const diagnosisCodes = generateDiagnosisCodes()
  const amount = generateAmount(procedureCode)
  
  // 70% approved, 30% denied (configurable)
  const status = Math.random() < 0.30 ? 'denied' : 'approved'
  const denialReason = status === 'denied' 
    ? randomChoice(DENIAL_REASONS) 
    : null
  
  const claim: Claim = {
    id: `CLM-${Date.now()}-${randomId(4)}`,
    providerId: provider.id,
    patientName: patient.name,
    patientDob: patient.dob,
    billedAmount: amount,
    paidAmount: status === 'approved' ? amount : 0,
    dateOfService: generateRecentDate(),
    procedureCodes: [procedureCode],
    diagnosisCodes,
    status,
    denialReason,
    submissionDate: new Date().toISOString(),
    processingDate: new Date().toISOString(),
    lineItems: [
      {
        lineNumber: 1,
        procedureCode,
        billedAmount: amount,
        paidAmount: status === 'approved' ? amount : 0,
        status,
        diagnosisCodes
      }
    ]
  }
  
  return claim
}

export async function withDenialPattern(
  claim: Claim,
  pattern: DenialPattern
): Promise<Claim> {
  // Inject specific denial pattern
  if (pattern.category === 'modifier-missing') {
    claim.denialReason = 'Missing Modifier 25'
    claim.status = 'denied'
    claim.paidAmount = 0
  }
  
  return claim
}
```

---

### 2. AppealGenerator Service

**Location**: `server/services/appealGenerator.ts`

**Logic**:
- 50% of denied claims get appealed
- Pattern-specific overturn rates:
  - "Missing Modifier 25": 70% overturn (easy fix)
  - "Incomplete documentation": 40% overturn (harder to fix)
  - "Not medically necessary": 20% overturn (payer decision)

**Example**:
```typescript
export async function generateAppeal(
  claim: Claim,
  scenario: Scenario
): Promise<Appeal | null> {
  // Only appeal denied claims
  if (claim.status !== 'denied') return null
  
  // 50% of denied claims get appealed
  if (Math.random() > 0.50) return null
  
  const appeal: Appeal = {
    id: `APP-${Date.now()}`,
    claimId: claim.id,
    appealDate: addDays(new Date(claim.processingDate), randomInt(3, 10)).toISOString(),
    appealReason: claim.denialReason || 'Appeal of denial',
    appealStatus: 'pending'
  }
  
  // 10-30 days later, add outcome
  setTimeout(() => {
    const overturnRate = getOverturnRateForPattern(claim.denialReason)
    appeal.appealStatus = Math.random() < overturnRate ? 'overturned' : 'upheld'
    appeal.outcomeDate = addDays(
      new Date(appeal.appealDate), 
      randomInt(10, 30)
    ).toISOString()
  }, randomInt(10, 30) * 24 * 60 * 60 * 1000)
  
  return appeal
}
```

---

### 3. UserEventGenerator Service

**Location**: `server/services/userEventGenerator.ts`

**Logic**:
- Track which patterns users practice
- Show improvement as users practice (fewer denials in future claims)
- Generate realistic practice schedules

**Example**:
```typescript
export async function generatePracticeSession(
  pattern: Pattern
): Promise<LearningEvent[]> {
  const now = new Date()
  
  const events: LearningEvent[] = [
    {
      id: `EVT-${Date.now()}-1`,
      timestamp: now.toISOString(),
      type: 'practice-started',
      context: 'claim-lab',
      patternId: pattern.id,
      metadata: { duration: 0 }
    },
    {
      id: `EVT-${Date.now()}-2`,
      timestamp: addMinutes(now, randomInt(5, 20)).toISOString(),
      type: 'practice-completed',
      context: 'claim-lab',
      patternId: pattern.id,
      metadata: { 
        duration: randomInt(300, 1200) * 1000,  // 5-20 minutes in ms
        correct: randomInt(7, 10),  // 7-10 out of 10 correct
        total: 10
      }
    },
    {
      id: `EVT-${Date.now()}-3`,
      timestamp: addMinutes(now, randomInt(21, 30)).toISOString(),
      type: 'correction-applied',
      context: 'claim-lab',
      patternId: pattern.id,
      metadata: { correction: pattern.suggestedAction }
    }
  ]
  
  return events
}
```

---

### 4. Pattern Injector Service

**Location**: `server/services/patternInjector.ts`

**Logic**:
- Mark which claims belong to which patterns
- Show pattern frequency changing over time (due to user learning)

**Example**:
```typescript
export async function injectPattern(
  claims: Claim[],
  pattern: DenialPattern,
  frequency: number
): Promise<Claim[]> {
  // frequency = 0.25 means 25% of claims have this pattern
  const countToInject = Math.floor(claims.length * frequency)
  
  // Shuffle and select random claims
  const toInject = shuffleArray(claims).slice(0, countToInject)
  
  // Inject pattern
  return Promise.all(
    claims.map(claim => {
      if (toInject.includes(claim)) {
        return withDenialPattern(claim, pattern)
      }
      return claim
    })
  )
}

export async function improvePattern(
  claims: Claim[],
  patternId: string,
  improvementFactor: number  // 0.8 = reduce frequency by 20%
): Promise<Claim[]> {
  // Find claims with this pattern
  const withPattern = claims.filter(c => c.denialReason?.includes(patternId))
  
  // Remove some (simulate improvement)
  const toRemove = Math.floor(withPattern.length * (1 - improvementFactor))
  const toRemoveSet = new Set(
    shuffleArray(withPattern).slice(0, toRemove)
  )
  
  // Update: mark as approved if in removal set
  return claims.map(claim => {
    if (toRemoveSet.has(claim)) {
      return { ...claim, status: 'approved', denialReason: null, paidAmount: claim.billedAmount }
    }
    return claim
  })
}
```

---

## Step-by-Step Implementation

### Day 1: ClaimGenerator

**Goal**: Generate realistic claims with optional denial patterns

**Tasks**:
1. Create `server/services/claimGenerator.ts`
2. Implement `generateClaim()` function
3. Implement `generateClaimBatch()` function
4. Implement `withDenialPattern()` function
5. Add helper functions (patient generation, amount variance, etc.)
6. Test: Generate 100 claims, verify structure

**Acceptance Criteria**:
- ✅ Claims match existing schema
- ✅ Denial reasons are realistic
- ✅ Amounts vary naturally
- ✅ Can generate 1000 claims in < 2 seconds
- ✅ Can inject specific patterns

---

### Day 2: AppealGenerator & UserEventGenerator

**Goal**: Generate appeals and user learning events

**Tasks**:
1. Create `server/services/appealGenerator.ts`
   - Generate appeals for denied claims
   - Realistic overturn rates
   - Realistic timelines

2. Create `server/services/userEventGenerator.ts`
   - Generate practice sessions
   - Generate correction events
   - Track learning progression

3. Test: Generate appeals and events, verify linkage to claims

**Acceptance Criteria**:
- ✅ Appeals link to claims correctly
- ✅ Overturn rates vary by pattern
- ✅ Learning events show progression
- ✅ Events have realistic timestamps

---

### Day 3: PatternInjector & API Integration

**Goal**: Integrate generators with scenario-builder

**Tasks**:
1. Create `server/services/patternInjector.ts`
   - Inject patterns into claim streams
   - Support pattern improvement
   - Track which claims match patterns

2. Create `server/api/admin/generation/start.post.ts`
   - Accept scenario config
   - Start continuous generation
   - Store generated data in database

3. Create `server/api/admin/generation/status.get.ts`
   - Return generation status
   - Count generated claims
   - Pattern distribution

4. Enhance scenario-builder UI
   - Add "Start Generation" button
   - Show generation status
   - Display metrics (claims/day, patterns, etc.)

5. Test: Start generation, verify data in database

**Acceptance Criteria**:
- ✅ API accepts generation config
- ✅ Claims generated and stored in database
- ✅ Pattern injection working
- ✅ UI shows real-time status
- ✅ Can start/stop generation

---

## Database Integration

### Claims table (already exists)
```typescript
// Insert generated claims
await db.insert(claims).values({
  id: claim.id,
  providerId: claim.providerId,
  patientName: claim.patientName,
  patientDob: claim.patientDob,
  dateOfService: claim.dateOfService,
  billedAmount: claim.billedAmount,
  paidAmount: claim.paidAmount,
  status: claim.status,
  denialReason: claim.denialReason,
  submissionDate: claim.submissionDate,
  processingDate: claim.processingDate,
  // ... other fields
})
```

### Pattern-Claim linking (already exists)
```typescript
// Link claim to pattern
await db.insert(patternClaims).values({
  patternId: pattern.id,
  claimId: claim.id
})
```

### Learning events (already exists)
```typescript
// Insert generated events
await db.insert(learningEvents).values({
  id: event.id,
  timestamp: event.timestamp,
  type: event.type,
  context: event.context,
  patternId: event.patternId,
  metadata: event.metadata
})
```

---

## Configuration Example

**What you'll be able to configure**:

```typescript
interface GenerationConfig {
  // Data volume
  claimsPerDay: number           // 10-1000
  appealRate: number             // 0.5 = 50% of denials
  practiceSessionsPerDay: number // 0-5
  
  // Patterns to inject
  patterns: {
    patternId: string
    frequency: number    // 0.25 = 25% of claims
    improvementRate: number  // 0.05 = 5% improvement per week
  }[]
  
  // Timeline
  duration: 'continuous' | '1-week' | '30-days'
  speed: 'real-time' | '10x' | '100x'  // 100x = 30 days data in 7 hours
  
  // Data source
  providerIds?: string[]
  scenarioId: string
}
```

**Usage**:
```typescript
// Generate realistic 30-day scenario
await generationApi.start({
  claimsPerDay: 100,
  appealRate: 0.5,
  patterns: [
    { patternId: 'PTN-001', frequency: 0.25, improvementRate: 0.05 }
  ],
  duration: '30-days',
  speed: '100x'  // Watch 30 days play out in 7 hours
})
```

---

## Testing Checklist

### Functionality Tests
- [ ] ClaimGenerator creates valid claims
- [ ] Claims have realistic amounts (variance)
- [ ] Denial patterns injected correctly
- [ ] Appeals generated for denied claims
- [ ] Overturn rates correct per pattern
- [ ] Learning events track progression
- [ ] Pattern improvement working

### Integration Tests
- [ ] Claims inserted into database
- [ ] Pattern-claim links created
- [ ] Events stored in database
- [ ] Dashboard reads generated data
- [ ] Metrics compute correctly from generated data

### Performance Tests
- [ ] Generate 1000 claims in < 5 seconds
- [ ] Database inserts < 100ms per claim
- [ ] No memory leaks in long-running generation

### Data Quality Tests
- [ ] Generated claims match schema
- [ ] No missing required fields
- [ ] Realistic distributions (amounts, providers)
- [ ] Patterns realistic (not every claim)

---

## Deliverables (Day 3)

When complete, you'll have:

1. ✅ `server/services/claimGenerator.ts` (200+ lines)
2. ✅ `server/services/appealGenerator.ts` (100+ lines)
3. ✅ `server/services/userEventGenerator.ts` (150+ lines)
4. ✅ `server/services/patternInjector.ts` (100+ lines)
5. ✅ `server/api/admin/generation/start.post.ts` (50+ lines)
6. ✅ `server/api/admin/generation/status.get.ts` (30+ lines)
7. ✅ `server/api/admin/generation/stop.post.ts` (20+ lines)
8. ✅ Enhanced scenario-builder UI
9. ✅ Database integration tested
10. ✅ All tests passing

**Result**: Continuous mock data generation engine ready for phases 1-5

---

## What Happens Next (After Phase 0)

Once this is complete:

**Phase 1**: Database reads this generated data (no more JSON)  
**Phase 2**: Metrics compute from generated data (patterns auto-detected)  
**Phase 3**: Real claims plug in (same pipeline)  
**Phases 4-5**: Analytics and scaling  

**Result**: 2-week demo showing full value: patterns detected → users learn → denial rate improves → revenue recovered

---

## Code Quality Requirements

### All Code Must Have:
- ✅ TypeScript with strict types
- ✅ JSDoc comments for functions
- ✅ Error handling (try/catch)
- ✅ No hardcoded values (use constants)
- ✅ Realistic data ranges
- ✅ Tests for key functions

### Style:
- Use existing code style from project
- Follow naming conventions from other services
- Import from `drizzle-orm` for database
- Use `date-fns` for date manipulation

---

## Success Criteria (When to Stop)

You're done when:

1. ✅ Scenario-builder has "Start Generation" button
2. ✅ Clicking it generates 100+ realistic claims/day
3. ✅ Claims appear in database within seconds
4. ✅ Appeals generated for ~50% of denials
5. ✅ Learning events show user practice
6. ✅ Dashboard metrics update from generated data
7. ✅ Can run for hours without memory issues
8. ✅ Generation shows patterns naturally
9. ✅ All tests passing
10. ✅ Code well-documented

---

## Quick Reference: Key Files to Create

| File | Purpose | Size |
|------|---------|------|
| `server/services/claimGenerator.ts` | Generate claims | 200 lines |
| `server/services/appealGenerator.ts` | Generate appeals | 100 lines |
| `server/services/userEventGenerator.ts` | Generate events | 150 lines |
| `server/services/patternInjector.ts` | Inject patterns | 100 lines |
| `server/api/admin/generation/start.post.ts` | Start endpoint | 50 lines |
| `server/api/admin/generation/status.get.ts` | Status endpoint | 30 lines |
| `server/api/admin/generation/stop.post.ts` | Stop endpoint | 20 lines |
| **Total** | **Complete system** | **650 lines** |

---

## Recommended Workflow

### Each Day
1. Code implementation (2-3 hours)
2. Test thoroughly (1 hour)
3. Commit with clear message (30 min)
4. Review and document (30 min)

### End of Day 3
- All services complete
- All tests passing
- Scenario-builder integrated
- Ready for Phase 1

---

## Questions to Keep in Mind While Implementing

- **Realism**: Do generated claims look real to a healthcare person?
- **Distribution**: Are amounts, providers, diagnoses realistic?
- **Patterns**: Do injected patterns feel natural (not every claim)?
- **Improvement**: Can users practice and see denial rate improve?
- **Performance**: Can system handle 1000 claims/minute?
- **Auditability**: Can you trace where each generated claim came from?

---

**Ready to Start**: This prompt is your complete specification  
**Duration**: 3 days  
**Success**: Dashboard shows live, continuously-improving metrics  
**Next Phase**: Database integration (Phase 1, will be easier)

Good luck! This Phase 0 is the foundation for everything else.

