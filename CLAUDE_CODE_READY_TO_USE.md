# 🚀 Claude Code: Ready-to-Use Prompt

**Copy everything below** and paste into Claude Code in VS Code.

---

# Phase 0: Build Continuous Mock Data Generation Engine

## Project Context

The Provider Portal is a healthcare claims analytics tool. Currently it uses **static JSON files that never change**, making it impossible to demonstrate real value. Your task is to build a **data generation engine** that continuously creates realistic claims, appeals, and user learning events.

**Result**: Instead of static PoC → live sandbox showing real business value (patterns detected → users learn → denial rate improves).

## What You're Building

Three core services + API integration:

1. **ClaimGenerator** - Creates realistic healthcare claims with optional denial patterns
2. **AppealGenerator** - Generates appeals for denied claims with realistic outcomes
3. **UserEventGenerator** - Creates practice sessions showing learning progression
4. **PatternInjector** - Injects denial patterns naturally into claim streams
5. **API Integration** - Connects to scenario-builder UI at `/admin/scenario-builder`

## Key Requirements

- TypeScript with strict types
- Realistic healthcare data (procedure codes, diagnosis codes, amounts)
- Configurable pattern injection
- Database integration (SQLite already set up)
- No hardcoded values
- Well-tested code

## Timeline

- **Day 1**: ClaimGenerator service
- **Day 2**: AppealGenerator & UserEventGenerator services
- **Day 3**: PatternInjector + API integration + UI

## Success Criteria

After 3 days:
- Scenario-builder has "Start Generation" button
- Clicking generates 100+ realistic claims/day
- Data persists in database
- Dashboard metrics update from generated data
- Can run for hours without memory issues

---

## Phase 0: Implementation Plan

### Day 1: ClaimGenerator Service

Create **`server/services/claimGenerator.ts`** with these functions:

```typescript
/**
 * Generate single claim with optional denial pattern
 */
export async function generateClaim(
  scenario: Scenario,
  config?: GeneratorConfig
): Promise<Claim> {
  // Realistic provider
  const provider = randomChoice(PROVIDERS)
  
  // Realistic patient
  const patient = {
    name: generateRealisticName(),
    dob: generateRealisticDOB(),
    id: generateMemberId()
  }
  
  // Realistic procedure
  const procedureCode = randomChoice(['99213', '99214', '99215', '36415', '93000'])
  
  // Realistic diagnosis codes
  const diagnosisCodes = ['I10', 'E11.9', 'Z87.891', 'Z79.84']
  
  // 70% approved, 30% denied (configurable)
  const isDenied = Math.random() < (config?.denialRate || 0.30)
  
  const claim: Claim = {
    id: `CLM-${Date.now()}-${randomId(4)}`,
    providerId: provider.id,
    claimType: 'Professional',
    patientName: patient.name,
    patientDob: patient.dob,
    patientSex: randomChoice(['male', 'female']),
    memberId: patient.id,
    billedAmount: generateRealisticAmount(procedureCode),
    paidAmount: isDenied ? 0 : generateRealisticAmount(procedureCode),
    dateOfService: generateRecentDate(),
    procedureCodes: [procedureCode],
    diagnosisCodes,
    status: isDenied ? 'denied' : 'approved',
    denialReason: isDenied ? randomChoice(DENIAL_REASONS) : null,
    submissionDate: new Date().toISOString(),
    processingDate: new Date().toISOString(),
    lineItems: [
      {
        lineNumber: 1,
        procedureCode,
        billedAmount: generateRealisticAmount(procedureCode),
        paidAmount: isDenied ? 0 : generateRealisticAmount(procedureCode),
        status: isDenied ? 'denied' : 'approved',
        diagnosisCodes
      }
    ]
  }
  
  return claim
}

/**
 * Generate batch of claims
 */
export async function generateClaimBatch(
  scenario: Scenario,
  count: number,
  config?: GeneratorConfig
): Promise<Claim[]> {
  const claims: Claim[] = []
  for (let i = 0; i < count; i++) {
    const claim = await generateClaim(scenario, config)
    claims.push(claim)
  }
  return claims
}

/**
 * Inject denial pattern into claim
 */
export async function withDenialPattern(
  claim: Claim,
  pattern: { id: string; category: string }
): Promise<Claim> {
  if (pattern.category === 'modifier-missing') {
    claim.denialReason = 'Missing Modifier 25'
    claim.status = 'denied'
    claim.paidAmount = 0
  } else if (pattern.category === 'documentation') {
    claim.denialReason = 'Incomplete documentation'
    claim.status = 'denied'
    claim.paidAmount = 0
  }
  return claim
}
```

**Helper functions you'll need**:
```typescript
const PROVIDERS = [
  { id: 'PRV-001', name: 'Valley Medical Associates', npi: '9261497865' },
  { id: 'PRV-002', name: 'Cardiology Partners LLC', npi: '1234567890' },
  // Add 3-5 more
]

const DENIAL_REASONS = [
  'Missing Modifier 25',
  'Unbundled codes',
  'Incomplete documentation',
  'Prior authorization required',
  'Exceeds frequency limits',
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateRealisticAmount(procedureCode: string): number {
  const ranges: Record<string, { min: number; max: number }> = {
    '99213': { min: 150, max: 250 },
    '99214': { min: 250, max: 350 },
    '99215': { min: 350, max: 450 },
    '36415': { min: 100, max: 200 },
    '93000': { min: 200, max: 400 }
  }
  const range = ranges[procedureCode] || { min: 100, max: 500 }
  return Math.floor(Math.random() * (range.max - range.min + 1) + range.min)
}

function generateRecentDate(): string {
  const now = new Date()
  const days = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

function generateRealisticName(): string {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Maria']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Garcia', 'Brown', 'Davis']
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
}

function generateRealisticDOB(): string {
  const today = new Date()
  const age = Math.floor(Math.random() * 50) + 18 // 18-68 years old
  const dob = new Date(today.getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
  return dob.toISOString().split('T')[0]
}

function generateMemberId(): string {
  return `${Math.floor(Math.random() * 1000)}-${randomChoice(['DG', 'KL', 'MP'])}-${Math.floor(Math.random() * 9999999)}-${Math.floor(Math.random() * 9)}`
}

function randomId(length: number): string {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase()
}
```

**Day 1 Success**: Can generate 100 claims in < 2 seconds, claims match schema, denial patterns work.

---

### Day 2: AppealGenerator & UserEventGenerator

Create **`server/services/appealGenerator.ts`**:

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
  
  // Determine outcome based on denial reason
  const overturnRate = getOverturnRateForDenial(claim.denialReason)
  
  // Simul-ate resolution in 10-30 days
  setTimeout(() => {
    appeal.appealStatus = Math.random() < overturnRate ? 'overturned' : 'upheld'
    appeal.outcomeDate = addDays(new Date(appeal.appealDate), randomInt(10, 30)).toISOString()
  }, randomInt(10, 30) * 24 * 60 * 60 * 1000)
  
  return appeal
}

function getOverturnRateForDenial(denialReason: string | null): number {
  // Higher overturn rate for easier issues to fix
  if (denialReason?.includes('Modifier')) return 0.70
  if (denialReason?.includes('documentation')) return 0.40
  if (denialReason?.includes('medically necessary')) return 0.20
  return 0.50
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
```

Create **`server/services/userEventGenerator.ts`**:

```typescript
export async function generatePracticeSession(
  pattern: Pattern,
  userId?: string
): Promise<LearningEvent[]> {
  const now = new Date()
  const sessionId = `SESSION-${Date.now()}`
  
  const events: LearningEvent[] = [
    {
      id: `EVT-${Date.now()}-1`,
      timestamp: now.toISOString(),
      type: 'practice-started',
      context: 'claim-lab',
      patternId: pattern.id,
      sessionId,
      metadata: {}
    },
    {
      id: `EVT-${Date.now()}-2`,
      timestamp: addMinutes(now, randomInt(5, 20)).toISOString(),
      type: 'practice-completed',
      context: 'claim-lab',
      patternId: pattern.id,
      sessionId,
      metadata: {
        duration: randomInt(300, 1200) * 1000, // 5-20 minutes in ms
        correct: randomInt(7, 10),
        total: 10
      }
    },
    {
      id: `EVT-${Date.now()}-3`,
      timestamp: addMinutes(now, randomInt(21, 30)).toISOString(),
      type: 'correction-applied',
      context: 'claim-lab',
      patternId: pattern.id,
      sessionId,
      metadata: {
        correction: pattern.suggestedAction
      }
    }
  ]
  
  return events
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}
```

**Day 2 Success**: Appeals generated with correct outcomes, learning events show practice progression.

---

### Day 3: PatternInjector & API Integration

Create **`server/services/patternInjector.ts`**:

```typescript
export async function injectPattern(
  claims: Claim[],
  patternId: string,
  frequency: number  // 0.25 = 25% of claims
): Promise<Claim[]> {
  const countToInject = Math.floor(claims.length * frequency)
  
  // Shuffle and select random claims
  const shuffled = [...claims].sort(() => Math.random() - 0.5)
  const toInject = shuffled.slice(0, countToInject)
  const toInjectSet = new Set(toInject)
  
  // Inject pattern
  return claims.map(claim => {
    if (toInjectSet.has(claim)) {
      return {
        ...claim,
        status: 'denied',
        paidAmount: 0,
        denialReason: 'Missing Modifier 25' // or pattern-specific reason
      }
    }
    return claim
  })
}
```

Create **`server/api/admin/generation/start.post.ts`**:

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { generateClaimBatch } from '~/server/services/claimGenerator'
import { generateAppeal } from '~/server/services/appealGenerator'
import { injectPattern } from '~/server/services/patternInjector'

let generationJob: NodeJS.Timeout | null = null
let generationActive = false

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { claimsPerDay = 100, patterns = [], speed = 'real-time' } = body
    
    if (generationActive) {
      throw new Error('Generation already running')
    }
    
    generationActive = true
    
    // Calculate interval: how often to generate new batch
    const batchSize = 10
    const intervalMs = speed === '100x' ? (24 * 60 * 60 * 1000) / claimsPerDay / 100 : (24 * 60 * 60 * 1000) / claimsPerDay
    
    generationJob = setInterval(async () => {
      try {
        // Generate claims
        const newClaims = await generateClaimBatch({}, batchSize)
        
        // Inject patterns
        let injectedClaims = newClaims
        for (const pattern of patterns) {
          injectedClaims = await injectPattern(injectedClaims, pattern.patternId, pattern.frequency)
        }
        
        // Insert into database
        for (const claim of injectedClaims) {
          await db.insert(claims).values({
            id: claim.id,
            providerId: claim.providerId,
            claimType: claim.claimType,
            patientName: claim.patientName,
            patientDob: claim.patientDob,
            patientSex: claim.patientSex,
            memberId: claim.memberId,
            billedAmount: claim.billedAmount,
            paidAmount: claim.paidAmount,
            dateOfService: claim.dateOfService,
            status: claim.status,
            denialReason: claim.denialReason,
            submissionDate: claim.submissionDate,
            processingDate: claim.processingDate,
            createdAt: new Date().toISOString()
          }).onConflictDoNothing()
        }
      } catch (error) {
        console.error('Generation error:', error)
      }
    }, intervalMs)
    
    return { status: 'started', claimsPerDay, speed }
  } catch (error) {
    return { error: error.message }
  }
})
```

Create **`server/api/admin/generation/status.get.ts`**:

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { count } from 'drizzle-orm'

let generationActive = false

export default defineEventHandler(async (event) => {
  try {
    const claimCount = await db.select({ count: count() }).from(claims)
    
    return {
      status: generationActive ? 'running' : 'stopped',
      claimsGenerated: claimCount[0]?.count || 0,
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    return { error: error.message }
  }
})
```

**Day 3 Success**: Start/stop generation, data flows to database, status endpoint works.

---

## Key Implementation Notes

### Database Integration

Claims already have a table. Use:
```typescript
import { db } from '~/server/database'
import { claims, learningEvents, claimAppeals } from '~/server/database/schema'
```

### Realistic Data

Use the helper functions from Day 1. Key ranges:
- Claim amounts: $100-$1000
- Procedure codes: 99213, 99214, 99215, 36415, 93000
- Diagnosis codes: I10, E11.9, Z87.891, Z79.84, I48.91
- Denial rate: 20-30% (configurable)

### Performance

- Generate 10 claims at a time
- Insert batch into database (avoid 1-by-1)
- Use `onConflictDoNothing()` for safety
- No memory leaks (use intervals, not promises)

### Testing

After each day:
```bash
npm run dev
# Claims should be generating and showing in database
# Check: SELECT * FROM claims ORDER BY created_at DESC LIMIT 10
```

---

## Files to Create

```
server/
├── services/
│   ├── claimGenerator.ts
│   ├── appealGenerator.ts
│   ├── userEventGenerator.ts
│   └── patternInjector.ts
└── api/admin/generation/
    ├── start.post.ts
    ├── status.get.ts
    └── stop.post.ts
```

## Success Metrics

- ✅ ClaimGenerator creates realistic claims
- ✅ AppealGenerator creates appeals
- ✅ UserEventGenerator creates learning events
- ✅ Data persists in database
- ✅ Can start/stop generation
- ✅ No memory leaks
- ✅ All TypeScript

## Commits

```
git commit -m "Phase 0 Day 1: ClaimGenerator service complete"
git commit -m "Phase 0 Day 2: AppealGenerator & UserEventGenerator complete"
git commit -m "Phase 0 Day 3: PatternInjector & API integration complete"
```

---

## Questions?

Refer to `CLAUDE_CODE_PROMPT_PHASE_0.md` in the workspace for complete specification including:
- More code examples
- Testing details
- Database integration specifics
- Configuration options

**Good luck! After 3 days, this Phase 0 engine becomes the foundation for everything else.**

