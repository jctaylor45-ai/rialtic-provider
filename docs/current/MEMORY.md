# Provider Portal - Project Memory

**Version**: 1.1.0
**Last Updated**: January 7, 2026 at 14:40 UTC
**Status**: Active

## Purpose & Context

Jay is developing a **Provider-Facing Claims Analytics Portal**, a healthcare technology solution that transforms claim denials into learning opportunities for healthcare providers. This represents a significant innovation in healthcare payments, focusing on creating measurable behavior change and ROI tracking through interactive learning.

The core value proposition centers on helping providers:
- Improve their coding practices through actionable, pattern-based education
- Develop better standard operating procedures (SOPs) backed by evidence
- Reduce claim denials through targeted learning rather than generic reporting
- Track their own improvement and demonstrate ROI to stakeholders

The project operates within the healthcare payments ecosystem where providers struggle with complex payer policies, coding requirements, and recurring denial patterns. Success is measured through tracked learning behaviors and correlated improvements in claim submission patterns over time.

## Current Implementation Status

### ✅ Fully Implemented Modules

**1. Dashboard (index.vue)**
- Real-time metrics cards displaying: Claims Submitted, Approval Rate, Denial Rate, Denied Amount, Appeal Success Rate, Learning Impact
- Time range filtering (30/60/90 days) with responsive updates
- Trend indicators showing direction and magnitude of changes
- Drill-down capability from metrics to filtered claim views
- Export functionality UI

**2. Policy Analytics (policies.vue)**
- Comprehensive policy search and filtering interface
- Multi-dimensional filtering: Mode (Edit/Informational/Pay & Advise), Topic (Modifiers/Bundling/Medical Necessity/Frequency), Source (CMS/Payer/State)
- Dynamic sorting by Impact, Recency, Complexity
- Policy detail modal with linked denial reasons and recommended actions
- Claim count and impact amount per policy
- Color-coded policy status indicators

**3. Pattern Detection & Insights (insights.vue)**
- Active Patterns view showing critical, high, medium, low tier denial patterns
- Pattern cards displaying: title, affected claim count, financial impact, trend direction, confidence score
- Impact Report view with before/after metrics and improvement tracking
- Pattern detail modal with:
  - Evidence list (individual denied claims supporting the pattern)
  - Suggested actions for resolution
  - Learning progress tracking (0-100%)
  - Practice sessions completed counter
- Pattern-based filtering and search
- Refresh capability with loading states

**4. Claim Lab (claim-lab.vue)**
- Interactive claim editing sandbox for practice/testing scenarios
- Three-panel layout:
  - Left: Original claim summary + pattern context (if in practice mode)
  - Center: Line item editor with field-by-field corrections
  - Right: Real-time validation and feedback
- Practice mode integration: Shows learning pattern context, suggested improvements, and hints
- Claim detail display: ID, Patient Name, Date of Service, Provider, Original Denial Reason
- Line item editing with modifier/code correction support
- Pattern hints displayed during practice sessions
- Resubmission tracking and learning marker creation
- Navigation between claims

**5. Learning Impact & ROI (impact.vue)**
- Dual view toggle: Provider View / Network View
- Executive Summary displaying:
  - Denial rate reduction with before/after metrics
  - Revenue recovery from improved submissions
  - Practice improvement metrics (patterns resolved, learning progress)
  - Time-based trend visualization
- Detailed improvement breakdown by pattern
- ROI calculation showing: claims corrected, revenue impact, time invested
- Provider and payer stakeholder perspectives
- Long-form impact narrative explaining business value
- Comparison metrics showing provider performance vs. network baseline

**6. Claims Management (claims/index.vue, claims/[id].vue)**
- Claims list with sorting, filtering, and pagination
- Status badges (Paid, Denied, Appealed)
- Claim detail view with full metadata
- Navigable claim context and related information
- Integration with Claim Lab for interactive correction

### ✅ Technical Implementation

**Framework & Architecture**
- **Framework**: Nuxt 3 with Vue 3 composition API
- **Styling**: UnoCSS with Tailwind presets for utility-first design
- **State Management**: Pinia stores for patterns, analytics, events, and app state
- **Data Persistence**: localStorage for user interactions and learning progress
- **Charts**: Chart.js with vue-chartjs wrapper for analytics visualizations

**Component Structure**
- Composables for reusable logic: `usePatterns`, `useAnalytics`, `useCodeIntelligence`, `useTracking`, `useActions`
- Sidebar navigation component for portal layout
- Pattern and claim detail modals for contextual information
- Filter components for multi-dimensional filtering UI
- Record action modal for tracking user interventions

**Type Safety**
- TypeScript throughout with comprehensive type definitions
- Enhancements types defined for patterns, evidence, improvements, actions
- Type-safe event and analytics tracking structures

**Data Layer**
- Mock data files in `public/data/` directory:
  - `patterns.json`: Denial pattern library with 15+ pattern types
  - `claims.json`: 100+ claim records with denial reasons and metadata
  - `policies.json`: Healthcare policy database with coverage rules
  - `insights.json`: Pre-generated insights and correlations
  - `learningMarkers.json`: Educational engagement tracking
  - `learningEvents.json`: User interaction event log
  - `providers.json`: Provider network metadata
  - `codeIntelligence.json`: Medical coding reference data

**Styling System**
- Consistent color scheme: Primary indigo/purple with status colors (red for critical, green for resolved, yellow for improving)
- Card-based layout pattern throughout
- Responsive grid layouts using UnoCSS
- Hover states and transitions for interactive elements
- Badge/pill components for status and category indicators

### 📋 Core Features Implemented

**Pattern-Based Learning System**
- Patterns tracked with: frequency, impact ($), trend direction, confidence score, recency
- Pattern tiers (critical → high → medium → low) drive priority
- Pattern status lifecycle: active → improving → resolved → archived
- Evidence collection: Each pattern linked to specific denied claims
- Learning progress per pattern tracked as percentage (0-100%)
- Practice sessions counter per pattern
- Related policy connections for context

**Interactive Claim Correction (Claim Lab)**
- Original claim comparison with corrected version
- Line item detail editing
- Real-time validation feedback
- Modifier and code correction suggestions
- Practice mode with learning context and hints
- Learning marker creation on successful corrections

**ROI & Impact Measurement**
- Baseline metrics captured (denial rate %, appeal success rate, average denial amount)
- Current metrics tracked with delta calculation
- Impact per pattern improvement
- Revenue recovery calculation
- Provider improvement narrative generation
- Network-wide comparison and benchmarking

**User Engagement Tracking**
- Learning event recording (view, interact, complete)
- Practice session tracking
- Action logging (resubmission, workflow update, staff training, system config, practice change)
- Improvement correlation with user actions
- Learning marker creation and completion

**Analytics & Reporting**
- Metric trend calculation (up/down/stable)
- Denial reason grouping and sorting
- Policy performance scoring
- Pattern impact ranking
- Time-series metrics for dashboard trends
- Export capability (UI in place, backend integration pending)

### 🔄 Data Flow & Interactions

1. **Dashboard** → Filter by timeframe → Drill to specific claim status
2. **Policies** → Search/filter → View detail modal → See linked denials
3. **Insights** → View active patterns → Click pattern → Detail modal → Practice mode
4. **Claim Lab** → Select claim → Edit corrections → Submit → Create learning marker
5. **Impact** → View baseline vs. current → See pattern-by-pattern improvements

### 🏗️ Architecture Patterns

**Composables Pattern**
- `usePatterns()`: Pattern management, filtering, status colors
- `useAnalytics()`: Number/currency/percentage formatting, metric calculations
- `useCodeIntelligence()`: Medical coding suggestions and validation
- `useTracking()`: Event and learning marker recording
- `useActions()`: Action logging for intervention tracking

**Store Pattern (Pinia)**
- `patternsStore`: Pattern CRUD, loading states, filtering
- `analyticsStore`: Metric calculations, trend analysis
- `eventsStore`: Event logging and queries
- `appStore`: Global UI state, navigation, preferences

**Component Reusability**
- Modal components for details: `PatternDetailModal`, `CodeIntelligenceModal`, `RecordActionModal`
- Filter components: `PatternFilters`, `ClaimFilters`
- Shared utilities for formatting and calculations
- Consistent card layout patterns

## Key Learnings & Design Principles

**Pattern-Based vs. Statistical Approach**
- Denials grouped by root cause (pattern) rather than just listing statistics
- Each pattern includes specific evidence (claimed claims) and actionable remediation
- Focus on teaching root causes: modifier knowledge, documentation gaps, workflow issues, policy blindspots

**"Fix It Once" Philosophy**
- Patterns represent systemic issues worth addressing permanently
- Tools designed to create lasting improvements in provider practices
- ROI justification for continued investment in the platform

**Measurable Learning & Behavior Change**
- Learning progress tracked per pattern and provider
- Practice sessions create engagement data
- Corrections applied create improvement signals
- Impact tied to specific user actions (not just time passing)
- Before/after metrics demonstrate business value

**Hierarchical Priority System**
- Pattern tiers (critical → high → medium → low) drive focus
- Status lifecycle (active → improving → resolved) shows progression
- Frequency + Impact + Recency scoring determines pattern ranking
- Confidence score prevents false positives from distracting providers

**Multi-Stakeholder Design**
- Provider perspective: "What should I fix?" and "Am I improving?"
- Payer perspective: "Is this provider making progress?" and "What's the ROI?"
- Network view enables benchmarking and best practice identification

## Technical Stack & Tools

**Frontend**
- Nuxt 3 (Vue 3 framework)
- TypeScript for type safety
- UnoCSS for styling (Tailwind-compatible)
- Chart.js for analytics visualizations
- Pinia for state management
- Vue 3 Composition API

**Data & Storage**
- localStorage for persistent state
- JSON mock data files (patterns, claims, policies, insights, events)
- Structured type definitions enabling future API integration

**Development Environment**
- macOS-based development
- Local Nuxt dev server
- Mock data enabling offline development
- No backend dependencies (currently)

**Design System**
- Rialtic design system colors (indigo/purple primary)
- Status color convention: red (critical/denied), green (resolved/approved), yellow (improving), blue (info)
- Card-based layout pattern
- Consistent spacing and typography
- Responsive grid layouts

## Next Implementation Steps

### High Priority
1. **Export/Download Functionality**
   - CSV export from Claims, Policies, Patterns, Impact views
   - PDF report generation for impact dashboard
   - Data formatting for compliance (HIPAA-safe anonymization)

2. **Advanced Filtering & Persistence**
   - Multi-select filters for patterns
   - Filter state persistence in localStorage
   - Saved filter views/favorites

3. **Learning Module Polish**
   - Animated transitions in Claim Lab
   - Inline code intelligence suggestions
   - Pattern hint system refinement
   - Practice difficulty levels or tiered scenarios

4. **Impact Metrics Enhancement**
   - More granular ROI calculation (cost of denials, resubmission costs)
   - Comparison to payer benchmarks
   - Predictive models for estimated impact of pattern resolution
   - Network-wide aggregate insights

### Medium Priority
5. **API Integration Layer**
   - Replace mock data with real API calls
   - Real-time pattern detection from claims feed
   - Dynamic policy updates from payer sources
   - Event streaming for learning tracking

6. **Authentication & Multi-User**
   - Provider organization login
   - Role-based access (Provider, Billing Manager, Executive)
   - Multi-provider network comparison
   - Organizational hierarchy support

7. **Advanced Reporting**
   - Customizable dashboards per role
   - Scheduled report emails
   - Comparative analysis tools
   - Trend forecasting

### Lower Priority
8. **Mobile Responsiveness**
   - Tablet/mobile layouts for claims browsing
   - Touch-optimized Claim Lab interface
   - Mobile-friendly report views

9. **Analytics Enhancement**
   - A/B testing of pattern presentation formats
   - User interaction telemetry
   - Feature usage analytics
   - Learning outcome correlation analysis

## Success Metrics

The platform succeeds when:
1. **Provider behavior change is measurable**: Practice sessions lead to specific claim corrections
2. **ROI is demonstrable**: Reduced denial rate clearly correlates with learning engagement
3. **Patterns drive action**: Providers apply suggested fixes to their workflows
4. **Engagement is sustained**: Recurring use of Claim Lab and pattern insights
5. **Payer satisfaction increases**: Measurable improvement in provider claim quality
6. **Network effects emerge**: Best practices spread across provider network based on insights

## Current Blockers & Considerations

- **Mock data currency**: Patterns and insights currently static; real-time updates needed
- **Export implementation**: UI present but backend export logic needed
- **Scaling claims**: 100 claims sufficient for MVP but will need pagination optimization
- **Performance at scale**: Chart rendering and pattern filtering need optimization for larger datasets
- **Real policy data**: Current policy library is representative but not authoritative

## Development Notes for AI Assistants

When modifying or extending this project:

1. **Type Safety Priority**: Maintain strong typing throughout; use `types/enhancements.ts` as reference
2. **Pattern-Centric Design**: All features should enhance pattern understanding and resolution
3. **Learning Tracking**: Any new features should include learning event logging
4. **Composable Extraction**: Extract reusable logic into composables; avoid component-specific utilities
5. **Data Integrity**: localStorage persistence requires careful transaction management
6. **Accessibility**: Maintain keyboard navigation and ARIA labels in interactive components
7. **Performance**: Watch Chart.js memory with large datasets; consider virtual scrolling
8. **Testing Data**: Keep `public/data/` files representative but realistic
9. **Error States**: All async operations should show loading and error states
10. **User Feedback**: Track user intent through learning markers and action logs

## File Structure Reference

```
/Users/jaytaylor/Desktop/Provider Portal/
├── pages/              # Main portal pages
│   ├── index.vue       # Dashboard
│   ├── policies.vue    # Policy Analytics
│   ├── insights.vue    # Pattern Detection & Insights
│   ├── claim-lab.vue   # Interactive Claim Correction Sandbox
│   ├── impact.vue      # Learning Impact & ROI Dashboard
│   └── claims/         # Claims management
├── components/         # Reusable Vue components
├── composables/        # Composition API utilities
├── stores/             # Pinia state management
├── types/              # TypeScript definitions
├── utils/              # Utility functions
├── public/data/        # Mock data JSON files
├── layouts/            # Page layouts
└── [config files]      # Nuxt, TypeScript, UnoCSS configs
```
