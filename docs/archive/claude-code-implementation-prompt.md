# Provider Portal Enhancement - Implementation Prompt for Claude Code

## Project Context

You are implementing enhancements to an existing **Provider-Facing Claims Analytics Portal** built with Vue 3, Nuxt 3, TypeScript, and Pinia. The portal helps healthcare providers understand claim denials, identify systematic issues, and improve coding practices.

**Reference Document**: `provider-portal-enhancement-spec.md` contains the complete functional specification. Read this document thoroughly before beginning implementation.

---

## Technical Stack (Existing)

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Language**: TypeScript (strict mode)
- **State Management**: Pinia
- **Styling**: UnoCSS (Tailwind-compatible utility classes)
- **Charts**: Chart.js with vue-chartjs
- **Data**: JSON files in `/public/data/` with localStorage persistence
- **Icons**: Lucide Vue

---

## Architecture Principles

### 1. Modular Component Architecture

**Component Organization**:
```
components/
├── common/                    # Reusable UI primitives
│   ├── BaseCard.vue
│   ├── BaseButton.vue
│   ├── BaseBadge.vue
│   ├── BaseModal.vue
│   └── BaseTable.vue
├── patterns/                  # Pattern-related components
│   ├── PatternCard.vue
│   ├── PatternList.vue
│   ├── PatternTierSection.vue
│   ├── PatternStatusBadge.vue
│   ├── PatternActionDialog.vue
│   └── PatternRootCausePanel.vue
├── claims/                    # Claims-related components
│   ├── ClaimTable.vue
│   ├── ClaimPatternBadge.vue
│   └── ClaimExportButton.vue
├── insights/                  # Insights page components
│   ├── InsightsSummaryCards.vue
│   ├── InsightsViewToggle.vue
│   ├── InsightsOptionA.vue
│   └── InsightsOptionB.vue
├── roi/                       # ROI and impact components
│   ├── ROISummaryCard.vue
│   ├── ROITrendChart.vue
│   ├── ROIPatternTable.vue
│   └── ROIEngagementCorrelation.vue
├── code-intelligence/         # Code lookup modal
│   ├── CodeIntelligenceModal.vue
│   ├── CodeRequirementsTab.vue
│   ├── CodeHistoryTab.vue
│   ├── CodePayerRulesTab.vue
│   └── CodeRelatedTab.vue
└── layout/                    # Layout components
    ├── Sidebar.vue
    ├── TopBar.vue
    └── PageHeader.vue
```

**Single Responsibility**: Each component should do ONE thing well. If a component exceeds 200 lines, consider splitting it.

**Props Down, Events Up**: Components receive data via props and emit events for parent handling. Avoid direct store mutations in deep child components.

### 2. Composables for Reusable Logic

Create composables in `/composables/` for shared business logic:

```typescript
// composables/usePatternDetection.ts
export const usePatternDetection = () => {
  const claimsStore = useClaimsStore()
  
  const detectPatterns = computed(() => {
    // Pattern clustering logic
  })
  
  const scorePattern = (pattern: PatternCandidate): number => {
    // Opportunity scoring logic
  }
  
  const tierPatterns = (patterns: Pattern[]): PatternTier[] => {
    // Pareto tiering logic
  }
  
  return { detectPatterns, scorePattern, tierPatterns }
}

// composables/useEventTracking.ts
export const useEventTracking = () => {
  const track = (eventType: LearningEventType, details?: EventDetails) => {
    // Event tracking logic
  }
  
  return { track }
}

// composables/useROICalculations.ts
export const useROICalculations = () => {
  const calculateImprovement = (baseline: Metrics, current: Metrics) => {
    // ROI calculation logic
  }
  
  return { calculateImprovement }
}
```

### 3. Pinia Store Organization

Organize stores by domain, not by page:

```typescript
// stores/claims.ts - Claims data and operations
// stores/patterns.ts - Pattern detection and management
// stores/events.ts - Learning event tracking
// stores/roi.ts - ROI calculations and metrics
// stores/codeIntelligence.ts - Procedure code data
// stores/ui.ts - UI state (modals, filters, view modes)
```

**Store Pattern**:
```typescript
// stores/patterns.ts
export const usePatternsStore = defineStore('patterns', () => {
  // State
  const patterns = ref<Pattern[]>([])
  const selectedPatternId = ref<string | null>(null)
  
  // Getters (computed)
  const tieredPatterns = computed(() => {
    // Use composable for logic
  })
  
  const criticalPatterns = computed(() => 
    tieredPatterns.value.filter(p => p.tier === 'critical')
  )
  
  // Actions
  const updatePatternStatus = (patternId: string, status: PatternStatus) => {
    // Update logic
  }
  
  const recordAction = (patternId: string, action: ActionRecord) => {
    // Record action logic
  }
  
  return {
    patterns,
    selectedPatternId,
    tieredPatterns,
    criticalPatterns,
    updatePatternStatus,
    recordAction
  }
})
```

### 4. TypeScript Interfaces

Create a comprehensive types file:

```typescript
// types/index.ts

// Core entities
export interface Claim { ... }
export interface Pattern { ... }
export interface Policy { ... }
export interface Provider { ... }

// Pattern detection
export interface PatternCandidate { ... }
export interface PatternScore { ... }
export interface PatternTier { ... }

// Learning events
export interface LearningEvent { ... }
export type LearningEventType = 'pattern_viewed' | 'claims_exported' | ...

// ROI
export interface PracticeROI { ... }
export interface PatternImprovement { ... }

// Code intelligence
export interface ProcedureCodeIntelligence { ... }
```

### 5. Utility Functions

Create pure utility functions for calculations:

```typescript
// utils/calculations.ts
export const calculateDenialRate = (denied: number, total: number): number => { ... }
export const calculatePercentChange = (before: number, after: number): number => { ... }
export const formatCurrency = (amount: number): string => { ... }
export const formatPercent = (value: number, decimals?: number): string => { ... }

// utils/patternScoring.ts
export const calculateOpportunityScore = (pattern: PatternCandidate): number => { ... }
export const calculateFixabilityScore = (pattern: Pattern): number => { ... }
export const calculateRecurrenceRisk = (pattern: Pattern): number => { ... }

// utils/dateHelpers.ts
export const getDateRangeForPeriod = (days: number): DateRange => { ... }
export const isWithinPeriod = (date: string, period: DateRange): boolean => { ... }
```

---

## Implementation Tasks

### Phase 1: Foundation (Do First)

#### 1.1 Create Type Definitions
- Create `/types/index.ts` with all interfaces from the spec
- Ensure strict TypeScript compliance

#### 1.2 Create Utility Functions
- Implement all calculation utilities
- Include unit test examples in comments

#### 1.3 Generate Mock Data
- **THIS IS CRITICAL** - The demo depends on realistic, comprehensive mock data
- See "Mock Data Requirements" section below

#### 1.4 Create/Update Pinia Stores
- `stores/patterns.ts` - Pattern detection and management
- `stores/events.ts` - Learning event tracking
- `stores/roi.ts` - ROI calculations

#### 1.5 Create Composables
- `usePatternDetection.ts`
- `useEventTracking.ts`
- `useROICalculations.ts`

### Phase 2: Core Components

#### 2.1 Pattern Components
- `PatternCard.vue` - Expandable card with all sections
- `PatternTierSection.vue` - Groups patterns by tier
- `PatternActionDialog.vue` - "Mark Action Taken" modal
- `PatternStatusBadge.vue` - Status indicator

#### 2.2 ROI Components
- `ROISummaryCard.vue` - Metric cards
- `ROITrendChart.vue` - Time series with event markers
- `ROIPatternTable.vue` - Pattern-by-pattern breakdown

#### 2.3 Code Intelligence
- `CodeIntelligenceModal.vue` - Main modal container
- Tab components for each section

### Phase 3: Page Enhancements

#### 3.1 Insights Page (`/insights`)
- Implement BOTH Option A and Option B layouts
- Add toggle to switch between them
- Add "Active Patterns" / "Impact Report" view toggle
- Integrate pattern detection and tiering

#### 3.2 Dashboard (`/`)
- Add "Your Improvement" section
- Add "Top Patterns Requiring Attention" section

#### 3.3 Claims Pages
- Add pattern column to claims table
- Add pattern banner to claim detail
- Add "Why This Was Denied" section
- Add "How to Fix" section

#### 3.4 Claim Lab
- Add code reference panel
- Add pattern context when launched from insight

#### 3.5 Impact Page (`/impact`)
- Build full ROI dashboard
- Add configurable admin cost input
- Add measurement window selector
- Add payer aggregate view (separate section)

#### 3.6 Policies Page
- Rename to "Policy Reference"
- Change default sort to impact
- Add pattern link column

### Phase 4: Event Tracking Integration

#### 4.1 Implement Passive Tracking
- Track page views, pattern expansions, policy views
- Store events in localStorage

#### 4.2 Implement Active Tracking
- Track exports, Claim Lab tests, action recordings
- Include full context in event details

---

## Mock Data Requirements

**THIS SECTION IS CRITICAL FOR A SUCCESSFUL DEMO**

### Data Generation Principles

1. **Tell a Story**: The data should demonstrate the ROI narrative
   - Provider starts with high denial rate
   - Engages with tool (learning events)
   - Denial rate improves over time
   - Clear correlation between engagement and outcomes

2. **Realistic Volume**: Enough data to be believable
   - 200+ claims over 6+ months
   - 5-7 distinct patterns
   - Multiple providers (3-5)
   - Time series showing trends

3. **Edge Cases**: Include scenarios for all UI states
   - New patterns (no engagement)
   - In-progress patterns (some engagement)
   - Resolved patterns (high engagement, improved metrics)
   - High-performing provider (few denials)

### Required Data Files

#### `claims.json` (200+ claims)

```typescript
interface Claim {
  id: string                    // "CLM-2024-XXXX"
  providerId: string
  patientName: string
  dateOfService: string         // ISO date
  submissionDate: string
  processingDate: string
  status: 'approved' | 'denied' | 'pending' | 'appealed'
  
  // Financial
  billedAmount: number
  paidAmount: number
  
  // Clinical
  lineItems: Array<{
    lineNumber: number
    procedureCode: string
    modifiers: string[]
    diagnosisCodes: string[]
    units: number
    billedAmount: number
    paidAmount: number
    status: string
  }>
  
  // Denial info (if denied)
  denialReason?: string
  denialCode?: string
  policyIds?: string[]
  
  // Pattern linkage
  patternId?: string            // Links to detected pattern
  
  // Appeal info
  appealStatus?: 'pending' | 'upheld' | 'overturned'
  appealDate?: string
  appealOutcome?: string
}
```

**Data Distribution**:
- Months 1-2 (baseline): ~18% denial rate
- Months 3-4 (engagement begins): ~14% denial rate  
- Months 5-6 (improvement): ~10% denial rate
- Denied claims MUST cluster into the 5-7 patterns

#### `patterns.json` (5-7 patterns)

```typescript
interface Pattern {
  id: string
  title: string
  classification: 'process_fix' | 'knowledge_gap' | 'coverage_gap' | 'one_off'
  
  // Evidence
  evidence: {
    claimCount: number
    dollarImpact: number
    procedureCodes: string[]
    policyIds: string[]
    denialReasons: string[]
    dateRange: { first: string; last: string }
    affectedProviders: string[]
    affectedClaimIds: string[]
  }
  
  // Root cause
  rootCause: {
    proximateCause: string
    processGap: string
    systemGap?: string
    knowledgeGap?: string
  }
  
  // Actions
  remediationType: 'resubmission' | 'future_practice' | 'both'
  suggestedActions: {
    shortTerm: string
    longTerm: string
  }
  
  // Policy context
  relatedPolicies: Array<{
    policyId: string
    policyName: string
    explanation: string
  }>
  
  // Status
  status: 'new' | 'in_progress' | 'resolved'
  statusHistory: Array<{ status: string; timestamp: string; notes?: string }>
  actionsRecorded: Array<{
    id: string
    timestamp: string
    actionType: string
    notes?: string
  }>
  
  // Metrics for ROI
  baseline: {
    capturedDate: string
    periodStart: string
    periodEnd: string
    claimCount: number
    deniedCount: number
    denialRate: number
    dollarsDenied: number
  }
  
  current: {
    updatedDate: string
    periodStart: string
    periodEnd: string
    claimCount: number
    deniedCount: number
    denialRate: number
    dollarsDenied: number
  }
  
  // Engagement
  engagement: {
    firstViewedDate?: string
    totalViews: number
    claimLabTests: number
    claimsExported: number
  }
  
  // Scoring (pre-calculated for mock)
  opportunityScore: number
  tier: 'critical' | 'significant' | 'moderate' | 'minor'
}
```

**Required Patterns**:

| # | Title | Classification | Status | Tier | Story |
|---|-------|---------------|--------|------|-------|
| 1 | DME claims missing attestation modifiers | process_fix | resolved | critical | Was 45% denial rate, now 12% after SOP created |
| 2 | Missing required diagnoses for diagnostic tests | knowledge_gap | resolved | critical | Training completed, 38%→15% |
| 3 | E&M services on same day as procedures | knowledge_gap | resolved | significant | Modifier 25 training, 22%→8% |
| 4 | Wrong place of service for orthotics | process_fix | in_progress | significant | User has viewed, exported, testing fixes |
| 5 | NCCI edit violations | knowledge_gap | new | moderate | Just detected, no engagement yet |
| 6 | Services without prior authorization | coverage_gap | new | moderate | Future practice change needed |
| 7 | One-off coding errors | one_off | in_progress | minor | Individual claim corrections |

#### `learningEvents.json` (100+ events)

```typescript
interface LearningEvent {
  id: string
  timestamp: string
  providerId: string
  eventType: string
  patternId?: string
  policyId?: string
  claimId?: string
  details?: Record<string, any>
}
```

**Event Distribution**:
- Spread across 4-5 months
- More events on patterns that show improvement
- Correlation: resolved patterns should have 10+ events each
- New patterns should have 0-1 events

**Event Types to Include**:
- `session_started` - 30+ occurrences
- `dashboard_viewed` - 40+ occurrences
- `pattern_viewed` - 50+ occurrences (concentrated on resolved patterns)
- `policy_context_viewed` - 30+ occurrences
- `claims_exported` - 10+ occurrences
- `claim_lab_completed` - 20+ occurrences (key engagement signal)
- `action_recorded` - 8+ occurrences (on resolved patterns)
- `pattern_status_changed` - 6+ occurrences

#### `codeIntelligence.json` (15-20 codes)

```typescript
interface ProcedureCodeIntelligence {
  code: string
  description: string
  category: string
  
  requirements: {
    requiredDiagnoses: Array<{ category: string; codes: string[]; description: string }>
    contraindicatedDiagnoses: Array<{ code: string; reason: string }>
    requiredModifiers: string[]
    disallowedModifiers: string[]
    approvedPOS: string[]
    mueLimit: { units: number; period: string; mai: string }
    frequencyLimits?: string
  }
  
  practiceHistory: {
    claimsSubmitted: number
    approved: number
    denied: number
    deniedAmount: number
    denialBreakdown: Array<{ reason: string; count: number; percent: number }>
    recentDenials: string[]  // claim IDs
    approvedDiagnoses: string[]  // commonly successful dx codes
  }
  
  payerRules: Array<{
    payerName: string
    coverage: 'covered' | 'not_covered' | 'conditional'
    lcaNumber?: string
    fee?: number
    keyRequirements?: string
  }>
  
  relatedCodes: {
    sameFamily: Array<{ code: string; description: string }>
    commonlyBilledWith: Array<{ code: string; tip: string }>
    ncciEdits: Array<{ code: string; relationship: string; modifier?: string }>
  }
}
```

**Codes to Include**:
- E0260, E0784, A4253 (DME - modifier issues)
- 95921, 95923 (diagnostic - diagnosis requirements)
- 99213, 99214, 99215 (E&M - modifier 25 issues)
- L2780, L1830 (orthotics - POS issues)
- Codes involved in NCCI edits

#### `practiceROI.json` (aggregate metrics)

```typescript
interface PracticeROI {
  providerId: string
  
  config: {
    adminCostPerAppeal: number  // Default: 400, user-adjustable
    measurementWindows: number[]
    defaultWindow: number
  }
  
  baselinePeriod: { start: string; end: string }
  currentPeriod: { start: string; end: string }
  
  baseline: {
    totalClaims: number
    deniedClaims: number
    denialRate: number
    dollarsDenied: number
    appealsFiled: number
    appealsOverturned: number
  }
  
  current: {
    totalClaims: number
    deniedClaims: number
    denialRate: number
    dollarsDenied: number
    appealsFiled: number
    appealsOverturned: number
  }
  
  improvement: {
    denialRateChange: number
    denialRateChangePercent: number
    appealsAvoided: number
    estimatedAdminSavings: number
  }
  
  engagement: {
    patternsIdentified: number
    patternsViewed: number
    patternsInProgress: number
    patternsResolved: number
    claimLabTestsCompleted: number
    actionsRecorded: number
  }
  
  patternBreakdown: Array<{
    patternId: string
    patternTitle: string
    status: string
    engagementLevel: 'high' | 'medium' | 'low' | 'none'
    denialRateBefore: number
    denialRateAfter: number
    improvement: number
  }>
  
  timeSeries: Array<{
    period: string
    denialRate: number
    claimCount: number
    engagementEvents: number
    actionsRecorded: number
  }>
}
```

---

## Coding Standards

### Vue Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, watch } from 'vue'
import { usePatternStore } from '@/stores/patterns'
import type { Pattern } from '@/types'

// 2. Props & Emits
const props = defineProps<{
  pattern: Pattern
  expanded?: boolean
}>()

const emit = defineEmits<{
  (e: 'expand', patternId: string): void
  (e: 'action-recorded', action: ActionRecord): void
}>()

// 3. Composables & Stores
const store = usePatternStore()
const { track } = useEventTracking()

// 4. Reactive State
const isExpanded = ref(props.expanded ?? false)

// 5. Computed Properties
const tierColor = computed(() => {
  const colors = {
    critical: 'red',
    significant: 'yellow',
    moderate: 'blue',
    minor: 'gray'
  }
  return colors[props.pattern.tier]
})

// 6. Methods
const handleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    track('pattern_viewed', { patternId: props.pattern.id })
  }
  emit('expand', props.pattern.id)
}

// 7. Watchers (if needed)
watch(() => props.expanded, (val) => {
  isExpanded.value = val ?? false
})
</script>

<template>
  <!-- Template with clear structure -->
</template>

<style scoped>
/* Minimal custom styles, prefer UnoCSS utilities */
</style>
```

### Naming Conventions

- **Files**: PascalCase for components (`PatternCard.vue`), camelCase for utilities (`patternScoring.ts`)
- **Components**: PascalCase (`<PatternCard />`)
- **Props/Events**: camelCase (`@action-recorded`)
- **CSS Classes**: kebab-case or UnoCSS utilities
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### Error Handling

```typescript
// Always handle potential errors gracefully
const loadPatterns = async () => {
  try {
    const data = await fetchPatterns()
    patterns.value = data
  } catch (error) {
    console.error('Failed to load patterns:', error)
    // Show user-friendly message
    toast.error('Unable to load patterns. Please refresh.')
  }
}
```

---

## Testing the Demo

After implementation, verify these scenarios work:

### Scenario 1: First-Time User View
- Dashboard shows improvement metrics
- Top patterns visible
- Insights shows all patterns tiered correctly

### Scenario 2: Investigate a Pattern
- Expand pattern card
- See policy context
- View affected claims
- Export claims list (event tracked)

### Scenario 3: Test in Claim Lab
- Launch from pattern or claim
- See code intelligence panel
- Make corrections
- Run simulation (event tracked)

### Scenario 4: Record Action
- Click "Mark Action Taken"
- Select action type
- Add notes
- See action recorded on pattern

### Scenario 5: View ROI
- Switch to "Impact Report" view
- See before/after metrics
- See correlation between engagement and outcomes
- Adjust measurement window
- See resolved patterns with improvement stats

### Scenario 6: Code Lookup
- Click any procedure code
- See modal with all tabs
- Requirements, history, payer rules, related codes

### Scenario 7: Payer View
- Navigate to Impact page
- See aggregate provider metrics
- See correlation proof (high engagement = better outcomes)

---

## Final Checklist

Before considering implementation complete:

- [ ] All type definitions created
- [ ] All utility functions implemented
- [ ] Mock data generated with correct distribution
- [ ] All stores created and functional
- [ ] Insights page with BOTH Option A and Option B
- [ ] Dashboard enhancements complete
- [ ] Claims pages enhanced
- [ ] Claim Lab enhanced
- [ ] Impact page complete with payer view
- [ ] Code Intelligence modal working
- [ ] Event tracking capturing all events
- [ ] ROI calculations working correctly
- [ ] All demo scenarios tested

---

## Questions to Consider During Implementation

If you encounter ambiguity:

1. **When in doubt, keep it simple** - This is a PoC, not production
2. **Prioritize the story** - ROI narrative is more important than edge cases
3. **Mock data is king** - If the data doesn't support the demo, fix the data
4. **Two options for Insights** - Build both, let users toggle between them
5. **Track everything** - More events are better than fewer

Good luck! The spec document has all the details - this prompt is your implementation guide.
