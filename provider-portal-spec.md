# Provider Portal PoC - Technical Specification
## Project Brief for Claude Code Implementation

---

## Executive Summary

Build a **Provider-Facing Claims Analytics Portal** that helps healthcare providers understand claim denials, identify systematic issues, and learn how to improve coding practices. This is a proof-of-concept (PoC) with **mock data and local persistence** for stakeholder demos.

**Key Innovation**: Track provider learning behavior (via Claim Lab sandbox) and measure ROI by correlating education with improved claim submission patterns.

---

## Technical Stack

### Frontend
- **React 18+** with JavaScript (ES6+)
- **Vite** for dev server and build tooling
- **Tailwind CSS** for styling
- **Recharts** for data visualizations
- **Lucide React** for icons
- **React Router** for navigation (v6+)

### Data & Persistence
- **JSON files** for mock data (stored in `/src/data/`)
- **LocalStorage** for session persistence and "learning markers"
- **Context API** for state management
- No backend required - pure frontend PoC

### Development
- Run locally on Mac via `npm run dev`
- Hot module replacement for fast iteration
- No authentication required (single-user demo mode)

---

## Project Structure

```
provider-portal/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── MetricCard.jsx
│   │   │   ├── ClaimsTrendChart.jsx
│   │   │   ├── DenialReasonsChart.jsx
│   │   │   ├── PolicyPerformanceChart.jsx
│   │   │   ├── TopPoliciesPanel.jsx
│   │   │   ├── RecentDenialsPanel.jsx
│   │   │   └── AIInsightsPanel.jsx
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   └── DetailPanel.jsx
│   │   └── shared/
│   │       ├── Button.jsx
│   │       ├── Select.jsx
│   │       └── Card.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Policies.jsx (future)
│   │   ├── Claims.jsx (future)
│   │   ├── Insights.jsx (future)
│   │   └── ClaimLab.jsx (future)
│   ├── data/
│   │   ├── claims.json
│   │   ├── policies.json
│   │   ├── providers.json
│   │   ├── insights.json
│   │   └── learningMarkers.json
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   └── useFilters.js
│   ├── utils/
│   │   ├── calculations.js
│   │   └── formatting.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Phase 1: Dashboard Implementation

### Overview
The Dashboard is the landing page that provides an at-a-glance view of claims performance with drill-down capabilities.

---

### UI Layout

**Structure**: 
- Fixed left sidebar (260px wide)
- Top filter bar (60px height)
- Scrollable main content area
- Optional right detail panel (384px wide, slide-in overlay)

**Sidebar Navigation** (based on Rialtic design):
- Blue-to-indigo gradient background (#4F46E5 to #6366F1)
- White text
- Logo at top (white box with "R" letter)
- Practice selector dropdown (indigo-500 background)
- Navigation items:
  - Dashboard (active state: indigo-500 bg)
  - Policies
  - Claims  
  - Insights
  - Claim Lab
- Product Guide link at bottom

**Top Bar**:
- White background with bottom border
- Left side controls:
  - View mode selector: Practice View | Individual Provider | Provider Comparison
  - Provider dropdown (shows when "Individual Provider" selected)
  - Time range: Last 30/60/90 days | Custom
  - Date range pickers (from/to dates)
- Right side:
  - Current time display
  - User avatar (initials in colored circle)

**Main Content**:
- Greeting: "Good afternoon, Dr. [Name]."
- Export button (top right)
- 6 metric cards (3x2 grid)
- Claims trend chart (full width)
- Two side-by-side charts (Denial Reasons | Policy Performance)
- Three bottom panels (Top Policies | Recent Denials | AI Insights)

---

### Component Specifications

#### 1. Metric Cards (6 total)

**Layout**: 3 columns × 2 rows with 24px gap
**Card Design**:
- White background
- 1px gray-200 border
- 8px rounded corners
- 24px padding
- Hover effect: shadow-md

**Card Structure**:
```
┌─────────────────────────────────┐
│ [Icon]              [Badge]     │
│                                 │
│ 1,247              ↑ +12.3%    │
│ This period                     │
│ ─────────────────────────────   │
│ Claims Submitted                │
└─────────────────────────────────┘
```

**6 Metrics**:

1. **Claims Submitted**
   - Value: Total claims in period (e.g., "1,247")
   - Sub-value: "This period"
   - Trend: Percentage change vs. previous period
   - Icon: BarChart
   - Color: Gray

2. **Approval Rate**
   - Value: Percentage (e.g., "87.4%")
   - Sub-value: "Active"
   - Trend: Percentage point change
   - Icon: CheckCircle
   - Color: Gray

3. **Denied Claims**
   - Value: Count (e.g., "157")
   - Sub-value: "12.6% of total"
   - Trend: Percentage change (negative is good)
   - Icon: XCircle
   - Color: Gray

4. **Denied Amount**
   - Value: Dollar amount (e.g., "$42.3K")
   - Sub-value: "Potential revenue"
   - Trend: Percentage change (negative is good)
   - Icon: DollarSign
   - Color: Gray

5. **Appeal Success**
   - Value: Percentage (e.g., "68.2%")
   - Sub-value: "43 overturned"
   - Trend: Percentage point change
   - Icon: Award
   - Color: Gray

6. **Learning Impact** ⭐ (HIGHLIGHTED)
   - Value: Count of tests (e.g., "23")
   - Sub-value: "Tests completed"
   - Trend: "New metric" badge
   - Icon: TrendingUp
   - Color: **Cyan-400 border + ring-2 ring-cyan-100**
   - Badge: "New" in cyan-100 background

**Trend Indicators**:
- Green with ↑ for positive trends
- Red with ↓ for negative trends
- Font: 14px, medium weight

---

#### 2. Claims Trend Chart

**Chart Type**: Multi-line chart (Recharts LineChart)
**Dimensions**: Full width × 300px height
**Data**: 6 months of historical data

**Lines**:
- **Submitted**: Indigo (#818CF8), 2px width
- **Approved**: Green (#4ADE80), 2px width  
- **Denied**: Red (#F87171), 2px width

**Styling**:
- Grid: Light gray dashed lines (#f0f0f0)
- X-axis: Month abbreviations (Jul, Aug, Sep, Oct, Nov, Dec)
- Y-axis: Auto-scale based on data
- Dots: 4px radius, filled with line color
- Tooltip: White background, shadow
- Legend: Top-right with colored dots

**Sample Data Structure**:
```json
[
  { "month": "Jul", "submitted": 412, "approved": 362, "denied": 50 },
  { "month": "Aug", "submitted": 438, "approved": 389, "denied": 49 },
  ...
]
```

---

#### 3. Denial Reasons Chart

**Chart Type**: Grouped bar chart (Recharts BarChart)
**Dimensions**: 50% width × 300px height
**Title**: "Top Denial Reasons"
**Subtitle**: "By financial impact and claim count"

**Bars**:
- **Left Y-axis**: Dollar impact (Indigo #818CF8)
- **Right Y-axis**: Claim count (Cyan #4DD0E1)

**Data**: Top 6 denial reasons
**X-axis**: Reason names (angled -45°, 11px font)
**Footer**: "View more" link in indigo-600

**Sample Data**:
```json
[
  { 
    "reason": "Missing Modifier", 
    "active": 320000, 
    "count": 45 
  },
  ...
]
```

---

#### 4. Policy Performance Chart

**Chart Type**: Grouped bar chart (same as Denial Reasons)
**Dimensions**: 50% width × 300px height
**Title**: "Policy Performance"
**Subtitle**: "Denial and appeal rates by policy"

**Bars**: Same dual-axis as Denial Reasons
**Data**: Top 4 policies with highest denial impact
**Footer**: "View more" link

---

#### 5. Top Denial Policies Panel

**Layout**: Card with list of 3 clickable policy cards
**Title**: "Top Denial Policies"

**Policy Card** (clickable):
```
┌─────────────────────────────────────────┐
│ E&M visits missing modifier 25  [Coding]│
│ 23 claims                    $12.4K     │
└─────────────────────────────────────────┘
```

**States**:
- Default: gray-200 border
- Hover: indigo-400 border, indigo-50 background
- Click: Opens right detail panel

**Data Fields**:
- Policy name
- Category badge (Coding | Practice Pattern | Documentation)
- Claim count
- Dollar impact

---

#### 6. Recent Denied Claims Panel

**Layout**: Card with list of 3 recent denials
**Title**: "Recent Denied Claims"

**Claim Card**:
```
┌─────────────────────────────────────┐
│ CLM-2024-1247          $425        │
│ John Doe                           │
│ Missing Modifier 25                │
│ 12/15/2024                         │
└─────────────────────────────────────┘
```

**Footer**: "View all claims →" link
**Click Action**: Navigate to claim detail (future)

---

#### 7. AI Insights Panel

**Layout**: Highlighted card with gradient background
**Background**: `from-cyan-50 to-indigo-50`
**Border**: cyan-200
**Title**: "AI Insights" with TrendingUp icon

**Header Message**:
"3 patterns detected that could improve your approval rate"

**Insight Card** (3 shown):
```
┌──────────────────────────────────────────┐
│ • E&M visits missing modifier 25        │
│   $12.4K denied • 23 claims • 2 providers│
│   ⭐ 5 tests completed                   │
└──────────────────────────────────────────┘
```

**Priority Indicator**:
- Red dot for high priority
- Yellow dot for medium priority

**Footer**: "Review all insights" button (indigo-600 bg)

---

#### 8. Detail Panel (Right Slide-in)

**Trigger**: Click any policy in "Top Denial Policies"
**Animation**: Slide in from right (300ms ease)
**Overlay**: Black bg-opacity-30 covering main content
**Panel**: 384px wide, white background, shadow-2xl

**Content Structure**:
```
┌────────────────────────────────────────┐
│ [Policy Name]                    [X]   │
│                                        │
│ Category: [Badge]                      │
│ Financial Impact: $12.4K               │
│ Claims Affected: 23 claims             │
│ ────────────────────────────────────   │
│ Common Issue:                          │
│ [Yellow box with problem description]  │
│                                        │
│ How to Fix:                            │
│ [Green box with solution]              │
│                                        │
│ [🧪 Test in Claim Lab] (button)       │
└────────────────────────────────────────┘
```

**Close Actions**:
- Click X button
- Click outside overlay

---

### Filter Behavior

**View Mode Filter**:
- Options: "Practice View" | "Individual Provider" | "Provider Comparison"
- Default: "Practice View"
- When "Individual Provider" selected:
  - Show provider dropdown
  - Filter all data to selected provider
- When "Provider Comparison" selected:
  - Show multi-select provider dropdown (future enhancement)

**Time Range Filter**:
- Options: "Last 30 days" | "Last 60 days" | "Last 90 days" | "Custom range"
- Default: "Last 90 days"
- When "Custom range" selected:
  - Enable date pickers
  - Validate from < to

**Data Filtering Logic**:
All metrics, charts, and panels should update based on:
1. Selected time range
2. Selected provider (if Individual view)
3. Date range (if custom)

**Performance**: 
- Calculations should be memoized
- Use React.useMemo for expensive computations

---

### Mock Data Requirements

#### claims.json
Generate **75-100 claims** with:
- Claim ID (format: CLM-2024-XXXX)
- Provider ID (link to providers.json)
- Patient name
- Date of service
- Procedure codes (CPT/HCPCS array)
- Diagnosis codes (ICD-10 array)
- Modifiers (array, can be empty)
- Billed amount
- Paid amount
- Status: "approved" | "denied" | "pending" | "appealed"
- Denial reason (if denied)
- Policy IDs triggered (array, link to policies.json)
- Appeal status: null | "pending" | "upheld" | "overturned"
- Submission date
- Processing date

**Distribution Guidelines**:
- ~85% approved, ~12% denied, ~3% pending
- Denied claims should cluster around 10-15 unique denial patterns
- Date range: Last 6 months
- Dollar amounts: $50 - $2,500 per claim

#### policies.json
Generate **15-20 policies** with:
- Policy ID
- Policy name
- Policy mode: "active" | "observation"
- Effective date (start)
- End date (null for active)
- Description (2-3 sentences)
- Category/Topic: "DME" | "Laboratory" | "E&M" | "Surgery" | "BH" | "Cardiology"
- Logic type: "age" | "covered service" | "duplicate" | "non-covered" | "pricing" | "place of service" | "procedure code combinations" | "unit/frequency" | "modifier"
- Source: "AMA" | "Client Source" | "FDA" | "HCPCS" | "Local Coverage Article" | "Medicare Policy" | "NCCI" | "NCD"
- Procedure codes affected (array)
- Diagnosis codes affected (array, can be empty)
- Common mistake (text)
- Fix guidance (text)
- Reference documents (array of objects with title + source)

**Example Policy**:
```json
{
  "id": "POL-001",
  "name": "E&M with Procedure - Modifier 25 Required",
  "mode": "active",
  "effectiveDate": "2024-07-01",
  "endDate": null,
  "description": "When an E&M service is performed on the same day as a procedure, modifier 25 must be appended to the E&M code to indicate a significant, separately identifiable service.",
  "topic": "E&M",
  "logicType": "modifier",
  "source": "NCCI",
  "procedureCodes": ["99213", "99214", "99215"],
  "diagnosisCodes": [],
  "commonMistake": "Providers bill E&M codes on the same day as procedures without adding modifier 25, causing automatic denials.",
  "fixGuidance": "Add modifier 25 to the E&M code when performed on the same day as a procedure to indicate a significant, separately identifiable service.",
  "referenceDocs": [
    {
      "title": "NCCI Policy Manual Chapter 11",
      "source": "National Correct Coding Initiative",
      "url": null
    }
  ]
}
```

#### providers.json
Generate **3-5 providers**:
- Provider ID
- Full name (Dr. First Last)
- Specialty
- NPI number
- Total claims (calculated from claims.json)
- Approval rate (calculated)
- Denied amount (calculated)

**Example**:
```json
{
  "id": "PRV-001",
  "name": "Dr. Sarah Smith",
  "specialty": "Family Medicine",
  "npi": "1234567890",
  "totalClaims": 425,
  "approvalRate": 89.2,
  "deniedAmount": 14250
}
```

#### insights.json
Generate **5-7 AI-generated insights**:
- Insight ID
- Pattern title
- Description
- Impact (dollar amount)
- Claims affected (array of claim IDs)
- Providers affected (array of provider IDs)
- Category: "Coding" | "Practice Pattern" | "Documentation"
- Priority: "high" | "medium" | "low"
- Learning markers count (how many Claim Lab tests)
- Created date

**Example**:
```json
{
  "id": "INS-001",
  "pattern": "E&M visits missing modifier 25",
  "description": "Multiple E&M services are being billed on the same day as procedures without modifier 25, resulting in denials.",
  "impact": 12400,
  "claimIds": ["CLM-2024-1001", "CLM-2024-1023", ...],
  "providerIds": ["PRV-001", "PRV-003"],
  "category": "Coding",
  "priority": "high",
  "learningMarkersCount": 5,
  "createdDate": "2024-12-01"
}
```

#### learningMarkers.json
Structure for tracking Claim Lab usage (starts empty):
```json
[
  {
    "id": "LM-001",
    "claimId": "CLM-2024-1001",
    "providerId": "PRV-001",
    "policyId": "POL-001",
    "insightId": "INS-001",
    "originalClaim": { /* snapshot */ },
    "correctedClaim": { /* snapshot */ },
    "testDate": "2024-12-15T10:30:00Z",
    "notes": "Added modifier 25 to E&M code",
    "simulationResult": "approved"
  }
]
```

---

### Design System

**Colors** (Tailwind classes):
- Primary: `indigo-600`, `indigo-500`, `indigo-700`
- Secondary: `cyan-400`, `cyan-600`
- Success: `green-400`, `green-600`
- Error: `red-400`, `red-600`
- Warning: `yellow-400`, `yellow-600`
- Gray scale: `gray-50` through `gray-900`

**Typography**:
- Font family: Default system font stack (Tailwind default)
- Headings: `font-semibold`
- Body: `font-normal`
- Sizes:
  - H1: `text-3xl` (30px)
  - H2: `text-lg` (18px)
  - H3: `text-base` (16px)
  - Body: `text-sm` (14px)
  - Small: `text-xs` (12px)

**Spacing**:
- Card padding: `p-6` (24px)
- Grid gaps: `gap-6` (24px)
- Section margins: `mb-8` (32px)

**Borders**:
- Radius: `rounded-lg` (8px)
- Cards: `border border-gray-200`
- Highlighted cards: `border-cyan-400 ring-2 ring-cyan-100`

**Shadows**:
- Default card: `shadow-sm`
- Hover: `shadow-md`
- Detail panel: `shadow-2xl`

**Transitions**:
- All interactive elements: `transition-all` or `transition-colors`
- Duration: 200-300ms

---

### State Management

Use **React Context** for global state:

```javascript
// src/context/AppContext.jsx
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    viewMode: 'practice',
    providerId: 'all',
    timeRange: '90',
    dateFrom: null,
    dateTo: null
  });

  const [learningMarkers, setLearningMarkers] = useLocalStorage('learningMarkers', []);

  // Load static data
  const claims = useMemo(() => require('./data/claims.json'), []);
  const policies = useMemo(() => require('./data/policies.json'), []);
  const providers = useMemo(() => require('./data/providers.json'), []);
  const insights = useMemo(() => require('./data/insights.json'), []);

  // Computed/filtered data
  const filteredClaims = useMemo(() => {
    // Apply filters
  }, [claims, filters]);

  const metrics = useMemo(() => {
    // Calculate metrics from filteredClaims
  }, [filteredClaims]);

  return (
    <AppContext.Provider value={{
      filters,
      setFilters,
      claims,
      policies,
      providers,
      insights,
      filteredClaims,
      metrics,
      learningMarkers,
      setLearningMarkers
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
```

---

### Calculations & Utilities

Create `src/utils/calculations.js`:

**Required Functions**:
- `calculateApprovalRate(claims)` → percentage
- `calculateDeniedAmount(claims)` → dollar amount
- `calculateAppealSuccess(claims)` → percentage
- `getTrendPercentage(current, previous)` → percentage with +/- sign
- `filterClaimsByDateRange(claims, from, to)` → filtered claims
- `filterClaimsByProvider(claims, providerId)` → filtered claims
- `groupClaimsByMonth(claims)` → array for chart
- `getTopDenialReasons(claims, limit)` → array
- `getTopPolicies(claims, policies, limit)` → array
- `formatCurrency(amount)` → string (e.g., "$12.4K")
- `formatNumber(number)` → string (e.g., "1,247")

---

### Development Setup Instructions

**Installation**:
```bash
# Create project
npm create vite@latest provider-portal -- --template react
cd provider-portal

# Install dependencies
npm install
npm install recharts lucide-react react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Tailwind Config** (`tailwind.config.js`):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Run Dev Server**:
```bash
npm run dev
```

**Build for Production**:
```bash
npm run build
npm run preview
```

---

### Implementation Priority

**Phase 1.1 - Core Dashboard** (START HERE):
1. ✅ Set up project structure
2. ✅ Create mock data files
3. ✅ Build layout components (Sidebar, TopBar)
4. ✅ Build metric cards with sample data
5. ✅ Implement filter controls (view mode, time range)
6. ✅ Build Claims Trend chart
7. ✅ Build Denial Reasons chart
8. ✅ Build Policy Performance chart
9. ✅ Build Top Policies panel
10. ✅ Build Recent Denials panel
11. ✅ Build AI Insights panel
12. ✅ Implement detail panel (slide-in)
13. ✅ Connect filters to data
14. ✅ Test responsive behavior

**Phase 1.2 - Polish**:
- Smooth transitions
- Loading states
- Error boundaries
- Accessibility (keyboard navigation, ARIA labels)

---

### Future Phases Overview

**Phase 2: Policy Analytics Screen** (next iteration)
- Policy list table with filters
- Policy detail tabs (Overview, Technical Details, Reference Docs, Performance, Claims, Learning)
- Three-level categorization (Topic, Logic Type, Source)

**Phase 3: Claim Search & Detail Screen**
- Advanced search interface
- Full claim detail view with timeline
- Line item table with edits/policies
- Launch to Claim Lab button

**Phase 4: AI Insights Hub**
- Aggregate insights view
- Pattern cards with drill-down
- Context-specific insights
- Learning impact tracking

**Phase 5: Claim Lab**
- Three-panel layout (Original | Edit | Results)
- Real-time simulation
- Save functionality with learning markers
- Before/after comparison

**Phase 6: Impact & ROI Dashboard**
- Learning event tracking
- Behavior change metrics
- Practice scorecard
- Provider improvement trends

---

### Testing & Demo Guidelines

**Demo Scenarios**:
1. **High-level overview**: Show practice-wide metrics
2. **Provider drill-down**: Switch to individual provider view
3. **Identify issue**: Click top denial policy → see detail panel
4. **Learning insight**: Show AI Insights with Claim Lab test counts
5. **Time comparison**: Switch time ranges to show trends

**Performance Requirements**:
- Dashboard should load in < 500ms
- Filter changes should update in < 100ms
- Charts should render smoothly
- No visible lag on hover states

**Browser Support**:
- Chrome/Edge (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)

---

### Critical Success Criteria

✅ **Visually matches Rialtic design system** (indigo/cyan colors, clean cards, charts)
✅ **All filters work correctly** (view mode, provider, time range)
✅ **Charts are accurate** (data aggregates correctly)
✅ **Learning Impact metric is prominent** (highlighted card, insights status)
✅ **Detail panel provides value** (clear problem + solution)
✅ **Runs locally without issues** (Mac compatible)
✅ **Data persists for demos** (localStorage for learning markers)

---

### Questions for Implementation

Before starting, please confirm:

1. **Should I generate all mock data programmatically or would you prefer to review/edit JSON files?**
2. **Do you want sample provider names or placeholder names?**
3. **Should the date range default to last 90 days ending today, or a fixed historical range?**
4. **Any specific dental/medical specialties to focus on for realistic scenario?**
5. **Should I implement the detail panel immediately or defer to Phase 1.2?**

---

### Getting Started with Claude Code

**Step 1**: Create project structure
**Step 2**: Generate mock data files
**Step 3**: Build core layout (Sidebar + TopBar)
**Step 4**: Implement Dashboard page with all components
**Step 5**: Connect data and filters
**Step 6**: Test and refine

**Estimated completion time**: 4-6 hours of focused development

---

## Appendix: Sample Greeting Logic

```javascript
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Usage: `${getGreeting()}, Dr. ${providerName}.`
```

---

## Appendix: Sample Filter Hook

```javascript
// src/hooks/useFilters.js
export const useFilters = (claims, filters) => {
  return useMemo(() => {
    let filtered = [...claims];

    // Filter by date range
    if (filters.timeRange !== 'custom') {
      const daysAgo = parseInt(filters.timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      filtered = filtered.filter(c => new Date(c.dateOfService) >= cutoffDate);
    } else if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter(c => {
        const dos = new Date(c.dateOfService);
        return dos >= new Date(filters.dateFrom) && dos <= new Date(filters.dateTo);
      });
    }

    // Filter by provider
    if (filters.providerId !== 'all') {
      filtered = filtered.filter(c => c.providerId === filters.providerId);
    }

    return filtered;
  }, [claims, filters]);
};
```

---

**END OF SPECIFICATION**

This document should provide everything needed to build Phase 1 (Dashboard). Subsequent iterations will provide similar detailed specs for Phases 2-6.
