# Provider Portal: Specification vs. Codebase Comparison

## Executive Summary

After reviewing both the specification documents and the actual codebase (via FUNCTIONALITY_AUDIT.md, AUDIT_REPORT.md, and RIALTIC_STACK_AUDIT.md), I've identified the current implementation state, gaps, and expansion opportunities.

**Overall Status**: The PoC is **functionally complete for Phase 1** with all 6 main pages working. However, there are significant gaps in Phase 2-6 features, and several spec'd enhancements from the enhancement-spec have not been implemented.

---

## Part 1: Tech Stack Deviation

### Spec vs. Reality

| Aspect | Original Spec | Actual Implementation | Impact |
|--------|--------------|----------------------|--------|
| **Framework** | React 18+ | Vue 3 + Nuxt 3 | ✅ Better - matches Rialtic stack |
| **Build Tool** | Vite | Vite (via Nuxt) | ✅ Same |
| **Styling** | Tailwind CSS | UnoCSS (Tailwind preset) | ✅ Compatible |
| **Charts** | Recharts | Chart.js + vue-chartjs | ⚠️ Different API, same capability |
| **Icons** | Lucide React | Heroicons/Iconify | ✅ Similar |
| **State** | React Context | Pinia | ✅ Better - more robust |
| **Routing** | React Router v6 | Nuxt file-based | ✅ Simpler |
| **TypeScript** | Not in spec | Fully implemented | ✅ Added value |

**Assessment**: The tech stack deviation was intentional and beneficial - the codebase now matches Rialtic's production stack, making future integration easier.

---

## Part 2: Feature Implementation Status

### Pages/Routes

| Page | Spec'd | Built | Functional | Notes |
|------|--------|-------|------------|-------|
| **Dashboard** (`/`) | ✅ | ✅ | ✅ | Core metrics, charts, panels all working |
| **Policies** (`/policies`) | ✅ | ✅ | ✅ | Table + detail panel working |
| **Claims** (`/claims`) | ✅ | ✅ | ✅ | Search + claim detail working |
| **Insights** (`/insights`) | ✅ | ✅ | ⚠️ | Working but missing Option A/B toggle |
| **Claim Lab** (`/claim-lab`) | ✅ | ✅ | ✅ | 3-panel layout, simulation, save markers |
| **Impact** (`/impact`) | ✅ | ✅ | ⚠️ | Scorecard works, charts are placeholder |

### Dashboard Components

| Component | Spec'd | Built | Notes |
|-----------|--------|-------|-------|
| 6 Metric Cards | ✅ | ✅ | All working with trends |
| Learning Impact (highlighted) | ✅ | ✅ | Cyan border + ring effect |
| Claims Trend Chart | ✅ | ✅ | 6-month line chart |
| Denial Reasons Chart | ✅ | ✅ | Grouped bar chart |
| Policy Performance Chart | ✅ | ✅ | Grouped bar chart |
| Top Policies Panel | ✅ | ✅ | Clickable with detail panel |
| Recent Denials Panel | ✅ | ✅ | Links to claim detail |
| AI Insights Panel | ✅ | ✅ | Gradient background, pattern cards |
| Filter Bar (View/Time/Provider) | ✅ | ✅ | All filters working |
| Detail Panel (slide-in) | ✅ | ✅ | Policy details on click |

### Policy Analytics Components

| Component | Spec'd | Built | Notes |
|-----------|--------|-------|-------|
| Search & Filters | ✅ | ✅ | Working |
| Policy Table (8 columns) | ✅ | ✅ | Sortable |
| Policy Detail Panel | ✅ | ✅ | Basic info shown |
| 6-Tab Detail View | ✅ | ⚠️ | **Simplified** - not all tabs |
| Learning Tab | ✅ | ⚠️ | Basic version only |
| "Test in Claim Lab" CTA | ✅ | ✅ | Works |

### Claim Lab Components

| Component | Spec'd | Built | Notes |
|-----------|--------|-------|-------|
| 3-Panel Layout | ✅ | ✅ | Original / Edit / Results |
| Query Param Loading | ✅ | ✅ | `?claim=` supported |
| Editable Fields | ✅ | ✅ | Codes, units, modifiers |
| Run Simulation | ✅ | ✅ | Button works |
| Results Display | ✅ | ✅ | Approval/denial + payment |
| Save Learning Marker | ✅ | ✅ | Persists to localStorage |
| Guidance Panel | ✅ | ⚠️ | **Missing** - not implemented |
| Code Intelligence | ✅ | ❌ | **Not built** |

### Impact Dashboard Components

| Component | Spec'd | Built | Notes |
|-----------|--------|-------|-------|
| Practice Scorecard | ✅ | ✅ | 5 metrics displayed |
| Recent Activity List | ✅ | ✅ | Shows learning markers |
| Provider Leaderboard | ✅ | ❌ | **Not built** |
| Time Series Charts | ✅ | ⚠️ | Chart.js installed, placeholder in UI |
| ROI Calculator | ✅ | ❌ | **Not built** |
| Before/After Comparison | ✅ | ❌ | **Not built** |
| Export Functionality | ✅ | ❌ | **Not built** |

---

## Part 3: Enhancement Spec Features (Not Implemented)

The `provider-portal-enhancement-spec.md` describes significant enhancements that have **not been built**:

### Tool A: Denial Pattern Dashboard - NOT IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Pattern Classifications (process_fix, knowledge_gap, etc.) | ❌ | Data model not created |
| Option A vs Option B View Toggle | ❌ | Only one view exists |
| Pattern Card Expanded State | ⚠️ | Basic version only |
| Root Cause Analysis Panel | ❌ | Not built |
| Provider Actions Section | ❌ | Not built |
| "Mark Action Taken" Dialog | ❌ | Not built |
| Actions Recorded History | ❌ | Not built |
| Pattern Status Workflow | ❌ | Not built |

### Tool B: Procedure Code Intelligence - NOT IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Code Intelligence Modal | ❌ | Not built |
| Requirements Tab | ❌ | Not built |
| Practice History Tab | ❌ | Not built |
| Payer Rules Tab | ❌ | Not built |
| Related Codes Tab | ❌ | Not built |
| Click-to-lookup from anywhere | ❌ | Not built |

### Tool C: ROI Dashboard - PARTIALLY IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Summary Header | ⚠️ | Basic version only |
| Metric Cards Row | ⚠️ | Exists but not to spec |
| Time Period Selector | ❌ | Not built |
| Trend Charts | ⚠️ | Placeholder only |
| Resolved Patterns Table | ❌ | Not built |
| Engagement Correlation | ❌ | Not built |
| Admin Cost Calculator | ❌ | Not built |
| Payer Aggregate View | ❌ | Not built |

### Enhanced Claims List - NOT IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Pattern Context Column | ❌ | Not added |
| Pattern Badge on Claims | ❌ | Not added |
| Filter by Pattern | ❌ | Not added |

### Enhanced Claim Detail - PARTIALLY IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Timeline Visualization | ⚠️ | Basic version |
| Policy Context Panel | ⚠️ | Basic version |
| Pattern Link | ❌ | Not added |
| Fix Guidance | ❌ | Not added |

---

## Part 4: Data Gaps

### Current Mock Data

| Dataset | Spec'd Volume | Actual Volume | Status |
|---------|--------------|---------------|--------|
| Claims | 150-200 | ~90 | ⚠️ Need more |
| Policies | 20-25 | 10 | ⚠️ Need more |
| Providers | 5-6 | 4 | ✅ Close enough |
| Insights | 5-7 patterns | 5 | ✅ OK |
| Learning Markers | Pre-populated | Empty start | ⚠️ Need demo data |

### Missing Data Models

| Data Type | Status | Notes |
|-----------|--------|-------|
| Patterns (with classifications) | ❌ | Needed for Tool A |
| Learning Events (detailed) | ❌ | Only basic markers exist |
| Code Intelligence | ❌ | Needed for Tool B |
| Provider ROI Metrics | ❌ | Needed for Tool C |
| Baseline/Comparison Data | ❌ | Needed for ROI proof |

---

## Part 5: Priority Gaps (What to Build Next)

### Tier 1: Critical for Demo Value

These features are essential to demonstrate the core value proposition:

1. **Pattern Classifications & Workflow**
   - Add pattern types (process_fix, knowledge_gap, coverage_gap, one_off)
   - Implement pattern status flow (new → in_progress → resolved)
   - Build "Mark Action Taken" dialog
   - This is THE differentiator - providers don't just see data, they take action

2. **ROI Time Series Charts**
   - Chart.js is installed but not wired up
   - Need before/after visualization showing improvement
   - This proves the tool works to payer stakeholders

3. **Code Intelligence Modal**
   - Provides instant value when providers click any code
   - Reduces friction in learning journey
   - Connects across all pages

### Tier 2: High Value Additions

4. **Insights Option A/B Toggle**
   - Spec'd for customer feedback
   - Easy to build, high UX impact

5. **Provider Leaderboard**
   - Shows engagement across practice
   - Motivates behavior change

6. **Expanded Mock Data**
   - 200+ claims with time series patterns
   - Pre-populated learning markers showing realistic usage

### Tier 3: Nice to Have

7. **Guidance Panel in Claim Lab**
   - Shows policy context while editing

8. **Export Functionality**
   - CSV export for claims, patterns, ROI data

9. **Pattern → Claim Connection**
   - Click pattern to see affected claims
   - Click claim to see triggering patterns

---

## Part 6: Recommendations

### Immediate Actions

1. **Update Pattern Data Model**
   ```typescript
   interface Pattern {
     id: string
     title: string
     description: string
     classification: 'process_fix' | 'knowledge_gap' | 'coverage_gap' | 'one_off'
     status: 'new' | 'in_progress' | 'resolved'
     claimCount: number
     deniedAmount: number
     affectedProviders: string[]
     affectedCodes: string[]
     policyId: string
     rootCause: {
       proximate: string
       processGap: string
       systemGap: string
     }
     actions: {
       shortTerm: string
       longTerm: string
     }
     actionsRecorded: ActionRecord[]
     createdAt: string
     resolvedAt?: string
   }
   ```

2. **Wire Up Chart.js**
   - Impact Dashboard needs real charts, not placeholders
   - Claims trend is working; replicate pattern for ROI

3. **Build Code Intelligence Modal**
   - Create as global component
   - Trigger from any procedure code click
   - Start with basic info, expand tabs later

### Short-Term (1-2 weeks)

4. Implement full Pattern workflow (status changes, action recording)
5. Add Insights page Option A/B toggle
6. Expand mock data to 200+ claims with improvement patterns
7. Add provider leaderboard to Impact page

### Medium-Term (3-4 weeks)

8. Full ROI Dashboard with time series and cost calculator
9. Payer aggregate view (network-wide metrics)
10. Export functionality
11. Claim ↔ Pattern bidirectional navigation

---

## Appendix: File Structure Comparison

### Spec'd Structure (React)
```
src/
├── components/Dashboard/
├── components/Layout/
├── components/shared/
├── pages/
├── data/
├── hooks/
├── utils/
├── context/
└── App.jsx
```

### Actual Structure (Nuxt/Vue)
```
├── components/           # Vue SFCs
├── composables/          # Vue composition functions
├── layouts/              # Page layouts
├── pages/                # File-based routing
├── public/data/          # JSON mock data
├── stores/               # Pinia stores
├── types/                # TypeScript definitions
├── utils/                # Helper functions
└── app.vue               # Root component
```

**Assessment**: Structure is well-organized and follows Nuxt conventions. No restructuring needed.

---

## Summary

| Category | Spec Completion | Notes |
|----------|----------------|-------|
| **Dashboard** | 95% | Minor polish needed |
| **Policies** | 85% | Need expanded detail tabs |
| **Claims** | 80% | Need pattern integration |
| **Insights** | 60% | Need Option A/B, pattern workflow |
| **Claim Lab** | 75% | Need guidance panel, code lookup |
| **Impact** | 40% | Need charts, ROI calculator |
| **Enhancement Spec** | 20% | Most features not started |
| **Mock Data** | 50% | Need more volume, patterns |

**Overall PoC Readiness**: 65% complete

**To reach demo-ready (85%+)**: Focus on Tier 1 gaps (pattern workflow, ROI charts, code intelligence)
