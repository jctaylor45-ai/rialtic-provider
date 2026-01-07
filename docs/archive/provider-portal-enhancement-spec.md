# Provider Portal Enhancement Specification
## Comprehensive Implementation Guide

**Version**: 1.0  
**Last Updated**: January 6, 2025  
**Status**: Ready for Implementation

---

## Executive Summary

### Purpose
Enhance the existing Provider Portal to transform denial data into actionable insights that drive measurable behavior change. The tool helps providers understand denial patterns, take corrective action, and demonstrates ROI through reduced denials and appeals.

### Key Stakeholders
- **Primary**: Payers (purchasing the tool) - need proof of administrative cost reduction
- **Secondary**: Providers (using the tool) - need to improve claim acceptance rates

### Core Value Proposition
1. Surface denial patterns with root cause analysis
2. Provide clear provider actions (resubmission + practice change)
3. Track engagement and correlate with outcomes
4. Quantify administrative savings from reduced denials/appeals

---

## Integration Approach

**Philosophy**: Enhance existing pages rather than create new routes. Build toward a fully integrated system with fewer, more capable screens.

### Page Structure (No New Routes)

| Route | Current Purpose | Enhanced Purpose |
|-------|-----------------|------------------|
| `/` | Dashboard with metrics | + Pattern alerts, + ROI summary |
| `/insights` | AI insight cards | **Action-oriented pattern hub** with two view options |
| `/claims` | Claim search | + Pattern context column |
| `/claims/[id]` | Claim detail | + Policy context, + Pattern link, + Fix guidance |
| `/claim-lab` | Test corrections | + Code intelligence panel |
| `/policies` | Policy browse | Reframed as reference, sorted by impact |
| `/impact` | Learning metrics | + Full ROI dashboard, + Resolved patterns |

---

## Tool A: Denial Pattern Dashboard (Enhanced `/insights`)

### Two View Options for Customer Feedback

**Option A: Single Page with Grouped Sections**
- Summary metrics at top (4 action-type cards)
- Expandable sections for each action type
- All patterns visible, grouped by classification
- Inline expansion for full pattern detail

**Option B: Overview + Progressive Disclosure**
- Summary cards for each action type with counts
- Click card → filters/expands to show patterns of that type
- Click pattern → inline expansion with full detail
- Cleaner initial view, more clicks to detail

Both options include a **view mode toggle**:
- "Active Patterns" (default) - work to be done
- "Impact Report" - ROI metrics and resolved patterns

### Pattern Classifications

| Classification | Description | Icon |
|---------------|-------------|------|
| `process_fix` | Workflow/system issue causing repeated denials | 🔧 |
| `knowledge_gap` | Training needed on coding rules | 📚 |
| `coverage_gap` | Pre-service verification needed | ⚠️ |
| `one_off` | Isolated errors, not systematic | 🔍 |

### Pattern Card Content (Expanded State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ [Title]                                              [Classification]    │
│                                                                             │
│   IMPACT                                                                    │
│   [Claim count] · [$Amount denied] · [Codes affected] · [Providers]         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ WHY THIS HAPPENS (Policy Context)                                   │   │
│   │ [Policy name and ID]                                                │   │
│   │ [Plain English explanation of the rule]                             │   │
│   │ [View Full Policy Details]                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ ROOT CAUSE ANALYSIS                                                 │   │
│   │ Proximate Cause: [What's wrong on the claim]                        │   │
│   │ Process Gap: [What workflow is missing]                             │   │
│   │ System Gap: [What system config could help]                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ PROVIDER ACTIONS                                                    │   │
│   │                                                                     │   │
│   │ Remediation type: [Resubmission | Future Practice | Both]           │   │
│   │                                                                     │   │
│   │ Short-term: [Specific fix for existing claims]                      │   │
│   │ Long-term: [Practice/workflow change for future]                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ AFFECTED CLAIMS                                        [Export CSV] │   │
│   │ [Table: Claim ID | Patient | DOS | Amount | Status]                 │   │
│   │ [View All Claims] [Test Correction in Claim Lab]                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ LEARNING PATH (optional)                               [Start]      │   │
│   │ [Module list with durations]                                        │   │
│   │ Progress: [░░░░░░░░░░░░░░░░░░░░] 0%                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Status: [New ▼]                          [Mark Action Taken]              │
│                                                                             │
│   Actions Recorded:                                                         │
│   • [Date]: [Action type] - [Notes]                                         │
│   • [Date]: [Action type] - [Notes]                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### "Mark Action Taken" Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Record Action Taken                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ What did you do to address this pattern?                                    │
│                                                                             │
│ Action type: [Select...                                        ▼]           │
│   • Updated claims in RCM for resubmission                                  │
│   • Created/updated SOP or workflow                                         │
│   • Conducted staff training or meeting                                     │
│   • Updated system configuration                                            │
│   • Changed clinical/billing practice                                       │
│   • Other                                                                   │
│                                                                             │
│ Notes (optional):                                                           │
│ [_______________________________________________________________]          │
│                                                                             │
│ This creates a marker you can measure progress against.                     │
│                                                                             │
│                                              [Cancel]  [Record Action]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tool B: Procedure Code Intelligence

### Implementation: Contextual Modal (No Dedicated Page)

Code intelligence appears as a **modal/drawer** when clicking any procedure code anywhere in the app.

### Trigger Points
- Claim detail page (line items)
- Claim Lab (edit panel)
- Insights (affected codes list)
- Policies (procedure code chips)

### Modal Content

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Code]                                                              [X]    │
│ [Description]                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ⚠️ YOUR PRACTICE: [X] denials in last 90 days                               │
│    Primary issue: [Most common denial reason]                               │
│                                                                             │
│ TABS: [Requirements] [Your History] [Payer Rules] [Related Codes]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ REQUIREMENTS                                                                │
│                                                                             │
│ ✓ Required Diagnoses:                                                       │
│   [Grouped by category with expandable code lists]                          │
│                                                                             │
│ ✗ Contraindicated Diagnoses:                                                │
│   [List of codes that will cause denial]                                    │
│                                                                             │
│ ✓ Required Modifiers: [List or "None required"]                             │
│ ✓ Disallowed Modifiers: [List or "None"]                                    │
│ ✓ Approved Place of Service: [POS codes]                                    │
│ ✓ MUE Limit: [Units] per [period]                                           │
│ ○ Frequency Limits: [If applicable]                                         │
│                                                                             │
│ COMMON DENIAL PATTERNS                                                      │
│ [List of common mistakes with percentages]                                  │
│                                                                             │
│ [📋 Copy Required Dx List] [🧪 Test in Claim Lab]                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Additional Tabs

**Your History Tab**:
- Claims submitted / approved / denied counts
- Denial breakdown by reason
- Recent denied claims (clickable)
- "What your approved claims had" - successful diagnosis codes

**Payer Rules Tab**:
- Per-payer coverage status
- LCA references
- Fee amounts (if available)
- Key requirement differences

**Related Codes Tab**:
- Same code family
- Commonly billed together (with tips)
- NCCI edits to watch

---

## Tool C: ROI & Learning Event Tracking

### Learning Event Taxonomy

#### Tier 1: System-Generated (No User Action)
| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `pattern_identified` | System detects new pattern | patternId, timestamp, baseline metrics |
| `pattern_severity_changed` | Impact increases/decreases | patternId, previousSeverity, newSeverity |
| `claim_denied_in_pattern` | New denial matches pattern | claimId, patternId |

#### Tier 2: Passive User Events (Natural Navigation)
| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `session_started` | User logs in | providerId, timestamp |
| `dashboard_viewed` | View dashboard | providerId, timestamp |
| `pattern_viewed` | Expand pattern card | patternId, viewCount |
| `policy_context_viewed` | Expand "Why This Happens" | patternId, policyId |
| `affected_claims_viewed` | Expand claims list | patternId, claimCount |
| `claim_detail_viewed` | Click into claim | claimId, patternId (if linked) |

#### Tier 3: Active User Events (Intentional Actions)
| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `claims_exported` | Click "Export CSV" | patternId, claimIds[], count |
| `claim_lab_started` | Enter Claim Lab | claimId, patternId (if linked) |
| `claim_lab_completed` | Run simulation | claimId, changes[], result |
| `action_recorded` | Click "Record Action" | patternId, actionType, notes |
| `pattern_status_changed` | Change status dropdown | patternId, previousStatus, newStatus |

#### Tier 4: Outcome Events (System-Computed)
| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `denial_rate_improved` | Rate drops below baseline | patternId, baseline, current, window |
| `pattern_auto_resolved` | Rate near zero | patternId, resolutionDate |

### Event Data Model

```typescript
interface LearningEvent {
  id: string
  timestamp: string  // ISO datetime
  providerId: string
  
  eventType: string  // from taxonomy above
  
  // Context (populated based on event type)
  patternId?: string
  policyId?: string
  claimId?: string
  claimIds?: string[]  // for exports
  
  // Event-specific details
  details?: {
    // For pattern_viewed
    viewCount?: number
    
    // For claims_exported
    exportedCount?: number
    
    // For claim_lab_completed
    originalClaim?: object
    modifiedClaim?: object
    changesApplied?: string[]
    simulationResult?: 'approved' | 'denied'
    
    // For action_recorded
    actionType?: string
    notes?: string
    
    // For pattern_status_changed
    previousStatus?: string
    newStatus?: string
    
    // For outcome events
    baselineValue?: number
    currentValue?: number
    measurementWindow?: number
  }
  
  engagementPoints?: number  // for scoring (future use)
}
```

### Pattern Data Model (Enhanced)

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
  
  // Status tracking
  status: 'new' | 'in_progress' | 'resolved'
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
  }>
  
  // Actions recorded
  actionsRecorded: Array<{
    id: string
    timestamp: string
    actionType: string
    notes?: string
  }>
  
  // Metrics
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
  
  // Improvement (calculated)
  improvement?: {
    denialRateChange: number
    denialRateChangePercent: number
    dollarsImpact: number
    measurementWindow: number  // days
  }
  
  // Engagement
  engagement: {
    firstViewedDate?: string
    totalViews: number
    claimLabTests: number
    claimsExported: number
  }
  
  // Learning path (optional)
  learningPath?: {
    modules: Array<{ title: string; duration: number; completed: boolean }>
    progress: number
  }
}
```

### Practice-Level ROI Model

```typescript
interface PracticeROI {
  providerId: string
  
  // Configuration
  config: {
    adminCostPerAppeal: number  // User-configurable input
    measurementWindows: number[]  // [30, 60, 90, 180, 360]
    defaultWindow: number
  }
  
  // Time periods
  baselinePeriod: { start: string; end: string }
  currentPeriod: { start: string; end: string }
  
  // Aggregate metrics
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
  
  // Calculated improvement
  improvement: {
    denialRateChange: number
    denialRateChangePercent: number
    appealsAvoided: number
    estimatedAdminSavings: number  // appeals avoided × cost per appeal
  }
  
  // Engagement summary
  engagement: {
    patternsIdentified: number
    patternsViewed: number
    patternsInProgress: number
    patternsResolved: number
    claimLabTestsCompleted: number
    actionsRecorded: number
  }
  
  // Pattern breakdown
  patternBreakdown: Array<{
    patternId: string
    patternTitle: string
    status: string
    engagementLevel: 'high' | 'medium' | 'low' | 'none'
    denialRateBefore: number
    denialRateAfter: number
    improvement: number
  }>
  
  // Time series for charts
  timeSeries: Array<{
    period: string  // "2024-10"
    denialRate: number
    claimCount: number
    engagementEvents: number
    actionsRecorded: number
  }>
}
```

### Pattern Detection Logic

#### Philosophy: Relative Significance, Not Fixed Thresholds

The app automatically determines what's meaningful for EACH provider based on their data. No configuration required - the system surfaces the biggest opportunities first.

#### Step 1: Cluster Denials

Group denied claims by commonality:
- Same denial reason
- Same procedure code family
- Same policy triggered
- Same root cause category
- Combinations of above

Each cluster is a **candidate pattern**.

#### Step 2: Filter Viable Patterns

Absolute minimums to filter noise:
```typescript
const isViablePattern = (candidate: PatternCandidate): boolean => {
  if (candidate.claimCount < 2) return false      // Single claims aren't patterns
  if (candidate.dollarImpact < 100) return false  // Trivial amounts
  
  // Statistical significance based on provider size
  const totalDenials = getTotalDeniedClaims()
  const minVolumeShare = totalDenials > 100 ? 0.02 : 0.05  // 2% or 5%
  
  if (candidate.claimCount / totalDenials < minVolumeShare) {
    return false
  }
  
  return true
}
```

#### Step 3: Score Each Pattern

```typescript
interface PatternScore {
  patternId: string
  
  // Raw metrics
  claimCount: number
  dollarImpact: number
  denialRate: number
  
  // Relative metrics (compared to THIS provider)
  volumePercentile: number      // % of their denials
  impactPercentile: number      // % of their denied dollars
  rateDeviation: number         // How far above baseline?
  
  // Actionability factors
  fixabilityScore: number       // 1-10, affects rank only
  recurrenceRisk: number        // 1-10
  
  // Composite
  opportunityScore: number
}

const calculateOpportunityScore = (pattern: PatternCandidate): number => {
  const weights = {
    impactShare: 0.35,
    volumeShare: 0.20,
    rateDeviation: 0.20,
    fixability: 0.15,
    recurrence: 0.10
  }
  
  // Normalize each factor to 0-100 scale and apply weights
  // Higher score = bigger opportunity
}
```

#### Step 4: Tier by Cumulative Impact (Pareto Approach)

```typescript
const tierPatterns = (patterns: PatternCandidate[]): PatternTier[] => {
  const sorted = patterns.sort((a, b) => b.opportunityScore - a.opportunityScore)
  
  let cumulativeImpact = 0
  const totalDeniedDollars = getTotalDeniedDollars()
  
  // Critical: Top 50% of $ impact
  // Significant: Next 25% (cumulative 75%)
  // Moderate: Next 15% (cumulative 90%)
  // Minor: Remaining 10%
  
  // Default view shows Critical + Significant (80% of impact)
}
```

#### Step 5: Surface to Provider

**Default View**: Patterns covering top 80% of denied dollars
**Expanded View**: "Show more" reveals moderate + minor patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DENIAL PATTERNS                                                             │
│                                                                             │
│ Showing: Top opportunities (covering 80% of denied dollars)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔴 CRITICAL (3 patterns · $12,400 · 67% of denied dollars)                  │
│ [Pattern cards expanded...]                                                 │
│                                                                             │
│ 🟡 SIGNIFICANT (2 patterns · $3,200 · 17% of denied dollars)                │
│ [Pattern cards expanded...]                                                 │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 📊 Below the line: 4 more patterns · $2,800 · 15% of denied dollars         │
│    [Expand to see smaller opportunities →]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Fixability & Recurrence Scoring

These affect RANK only, not whether patterns are shown.

**Fixability Score (1-10)**:
| Classification | Base Score | Adjustments |
|---------------|------------|-------------|
| `one_off` | 9 | Just fix the claim |
| `process_fix` | 8 | System/workflow change |
| `knowledge_gap` | 6 | Training needed |
| `coverage_gap` | 4 | Pre-service changes |

Adjustments: +1 if pure system fix, -2 if requires physician action, -2 if future practice only

**Recurrence Risk (1-10)**:
- High (8-10): Consistent pattern over 2+ months, process gap
- Medium (5-7): Occasional issue, depends on cases
- Low (1-4): One-off error, unlikely to repeat

#### Edge Cases

**New Provider (< 60-90 days data)**:
- Show advisory that pattern detection needs more history
- Display "early signals" marked as preliminary

**Well-Performing Practice (few denials)**:
- Celebrate performance
- Show remaining opportunities as "minor optimizations"

**Large Practice (many patterns)**:
- Aggregate related patterns into groups
- Show count at group level
- Drill-down reveals individual patterns
- (Note: Aggregation deferred for PoC, patterns shown individually)

**All Top Patterns Addressed**:
- Celebrate progress with improvement metrics
- Automatically reveal next tier of opportunities

#### Minimum Data Requirements

- **Minimum history**: 60-90 days of claims data
- **Rationale**: Aligns with typical claims processing cycles
- **Behavior**: System shows "building profile" state until threshold met

---

## Dashboard Enhancements (`/`)

### Add: "Your Improvement" Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ YOUR IMPROVEMENT                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ Denial Rate   │ │ Patterns      │ │ Claim Lab     │ │ Est. Admin    │   │
│  │               │ │ Addressed     │ │ Tests         │ │ Savings       │   │
│  │   11.2%       │ │               │ │               │ │               │   │
│  │   ↓ 6.8pts    │ │   3 of 5      │ │     23        │ │   $8,400      │   │
│  │   from 18.0%  │ │   60%         │ │   this qtr    │ │   this qtr    │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add: "Top Patterns" Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP PATTERNS REQUIRING ATTENTION                            [View All →]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔧 DME claims missing attestation modifiers                                 │
│    12 claims · $4,200 · Process Fix                         [Review →]     │
│                                                                             │
│ 📚 Missing required diagnoses for diagnostic tests                          │
│    9 claims · $3,400 · Knowledge Gap                        [Review →]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Claims Enhancements (`/claims`)

### Add: Pattern Column

| Claim ID | Patient | DOS | Amount | Status | **Pattern** |
|----------|---------|-----|--------|--------|-------------|
| CLM-2024-8834 | J. Smith | 12/12/24 | $400 | Denied | 🔧 DME Modifier |
| CLM-2024-8291 | M. Johnson | 12/08/24 | $350 | Denied | 🔧 DME Modifier |
| CLM-2024-8102 | R. Davis | 12/03/24 | $425 | Denied | 📚 Missing Dx |

Pattern badge links to that pattern in `/insights`.

---

## Claim Detail Enhancements (`/claims/[id]`)

### Add: Pattern Banner (if claim belongs to pattern)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ PART OF A LARGER PATTERN                                                 │
│                                                                             │
│ This claim is one of 12 denied for "DME claims missing attestation          │
│ modifiers" — a process fix that could recover $4,200.                       │
│                                                                             │
│ [View Pattern in Insights →]                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add: Policy Context Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WHY THIS WAS DENIED                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Policy: LCA A52508 - Hospital Beds and Accessories                          │
│                                                                             │
│ [Plain English explanation of the rule and why this claim violated it]      │
│                                                                             │
│ [View Full Policy]                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add: Fix Guidance Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOW TO FIX THIS CLAIM                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ To get this claim paid, update in your RCM system:                          │
│                                                                             │
│ 1. [Specific step]                                                          │
│ 2. [Specific step]                                                          │
│                                                                             │
│ [Test This Correction in Claim Lab]                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Claim Lab Enhancements (`/claim-lab`)

### Add: Collapsible Code Reference Panel

When editing a procedure code, show a mini code intelligence card:
- Code description
- Required modifiers
- Required diagnoses (condensed)
- MUE limit
- Practice history (denied count)

Panel is collapsible to preserve workspace.

### Add: Pattern Context (When Launched from Insight)

If user clicked "Test in Claim Lab" from a pattern:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Testing pattern: DME claims missing attestation modifiers                   │
│ This is one of 12 claims affected by this pattern.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Policies Enhancements (`/policies`)

### Rename to "Policy Reference"

Signals this is reference material, not a starting point.

### Default Sort by Practice Impact

Instead of alphabetical, sort by dollar impact on this practice.

### Add: Pattern Link Column

| Policy | Topic | Your Impact | Related Pattern |
|--------|-------|-------------|-----------------|
| LCA A52508 | DME | $4,200 | 🔧 DME Modifier |

---

## Impact Dashboard Enhancements (`/impact`)

### Full ROI Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEARNING IMPACT & ROI                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ EXECUTIVE SUMMARY                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Since adopting this tool, your practice has:                            │ │
│ │ • Reduced denial rate by [X]% ([before]% → [after]%)                    │ │
│ │ • Addressed [X] of [Y] identified patterns                              │ │
│ │ • Reduced appeals by [X]%                                               │ │
│ │ • Saved an estimated $[X] in administrative costs                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ SETTINGS                                                                    │
│ Admin cost per appeal: [$___________]  (used in savings calculations)       │
│ Measurement window: [30d] [60d] [90d ●] [180d] [360d]                       │
│                                                                             │
│ TREND ANALYSIS                                                              │
│ [Chart: Denial rate over time with engagement event markers]                │
│                                                                             │
│ PATTERN-BY-PATTERN IMPACT                                                   │
│ [Table: Pattern | Engagement | Before | After | Change | Status]            │
│                                                                             │
│ ENGAGEMENT → OUTCOME CORRELATION                                            │
│ [Chart showing correlation between engagement level and improvement]        │
│                                                                             │
│ RESOLVED PATTERNS                                                           │
│ [Cards for each resolved pattern with before/after metrics]                 │
│                                                                             │
│ RECENT ACTIVITY                                                             │
│ [Timeline of learning events]                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Payer Aggregate View (Basic)

Separate section or tab showing aggregate data across all providers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NETWORK IMPACT (Payer View)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Providers using tool: [X]                                                   │
│ Average denial rate improvement: [X]%                                       │
│ Total appeals avoided: [X]                                                  │
│ Total admin savings: $[X]                                                   │
│                                                                             │
│ PROVIDER BREAKDOWN                                                          │
│ [Table: Provider | Engagement | Improvement | Status]                       │
│                                                                             │
│ CORRELATION PROOF                                                           │
│ High engagement providers: [X]% avg improvement                             │
│ Low engagement providers: [X]% avg improvement                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Updated Navigation

```
SIDEBAR
───────────────────────────
[Logo] Provider Portal

Practice: [Dropdown]
───────────────────────────

📊 Dashboard

💡 Denial Patterns
   (badge showing active pattern count)

🔍 Claims

🧪 Claim Lab

📈 Learning Impact

───────────────────────────
Reference

📋 Policy Reference
───────────────────────────
```

---

## Mock Data Requirements

### Claims Data
- 200+ claims over 6+ month period
- Mix of approved/denied/pending
- Denied claims clustered around 5-7 distinct patterns
- Time series showing improvement for "resolved" patterns
- Include claims that can be resubmitted AND claims requiring practice change

### Patterns Data
- 5-7 patterns across all classification types
- 2-3 in "resolved" status with before/after metrics
- 1-2 in "in_progress" status
- 1-2 in "new" status
- Actions recorded on resolved patterns

### Learning Events Data
- Events spread across 3-6 month period
- Correlation between events and outcome improvements
- Variety of event types showing realistic usage patterns

### Provider ROI Data
- Baseline vs. current metrics showing improvement
- Time series data for trend charts
- Pattern-level breakdown

### Code Intelligence Data
- 10-15 procedure codes with full requirement data
- Practice history showing denial patterns
- Payer-specific rules

---

## Implementation Priority

### Phase 1: Foundation
1. Add learning event tracking infrastructure
2. Create pattern data model and sample data
3. Transform `/insights` with both view options (A and B)
4. Add pattern cards with full content structure

### Phase 2: Integration
5. Add ROI section to Dashboard
6. Add pattern context to Claims list and Claim Detail
7. Implement "Mark Action Taken" workflow
8. Create code intelligence modal

### Phase 3: ROI Dashboard
9. Build full `/impact` ROI dashboard
10. Add time series charts
11. Implement measurement window selection
12. Add configurable admin cost input

### Phase 4: Polish
13. Add Claim Lab code reference panel
14. Enhance Policies page with impact sorting
15. Add payer aggregate view
16. Fine-tune mock data for compelling demo

---

## Future Considerations (Post-PoC)

- User ID/Role tracking for multi-user practices
- Configurable pattern detection thresholds
- Engagement scoring and weighting
- A/B testing of view options based on customer feedback
- Real-time event streaming to backend
- Advanced attribution modeling
- Predictive analytics for pattern detection

---

## Appendix: Event Tracking Implementation

### Passive Tracking (Example)

```typescript
// Composable for tracking
const useTracking = () => {
  const track = (eventType: string, details?: object) => {
    const event: LearningEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      providerId: currentProvider.value.id,
      eventType,
      details
    }
    
    // Store locally
    learningEvents.value.push(event)
    
    // Persist to localStorage
    saveLearningEvents()
  }
  
  return { track }
}

// Usage in component
const { track } = useTracking()

const handlePatternExpand = (patternId: string) => {
  track('pattern_viewed', { patternId })
  expandedPatterns.value.add(patternId)
}
```

### Export Tracking (Example)

```typescript
const handleExportClaims = (patternId: string, claimIds: string[]) => {
  track('claims_exported', {
    patternId,
    claimIds,
    exportedCount: claimIds.length
  })
  
  // Generate and download CSV
  downloadCSV(claims.filter(c => claimIds.includes(c.id)))
}
```

---

**END OF SPECIFICATION**
