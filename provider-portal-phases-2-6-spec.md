# Provider Portal - Phases 2-6 Implementation Specification
## Building on Completed Dashboard

---

## Overview

This document provides detailed specifications for implementing the remaining Provider Portal modules. The Dashboard (Phase 1) is complete and serving as the foundation. These specifications build upon that foundation and integrate seamlessly with existing components.

**Modules Covered**:
- Phase 2: Policy Analytics
- Phase 3: Claim Lab (Interactive Learning Sandbox)
- Phase 4: Claim Search & Detail
- Phase 5: AI Insights Hub
- Phase 6: Impact & ROI Dashboard

---

## Implementation Order

**Build in this sequence** to maintain working functionality at each step:

1. **Phase 2**: Policy Analytics (enables policy research workflow)
2. **Phase 4**: Claim Search & Detail (enables claim lookup workflow)
3. **Phase 5**: AI Insights Hub (aggregates pattern insights)
4. **Phase 3**: Claim Lab (requires Phases 2 & 4 to be complete)
5. **Phase 6**: Impact & ROI (final reporting layer)

**Why this order?** Claim Lab is the most complex and requires working Policy Analytics and Claim Detail pages to launch from.

---

## Phase 2: Policy Analytics

### Purpose
Deep dive into which policies are causing issues, with comprehensive policy information and learning tracking.

### Route
- Path: `/policies`
- Component: `src/pages/Policies.jsx`

### Page Layout

```
┌────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "Policies" + User Info                  │
├────────────────────────────────────────────────────────────┤
│         │ Search & Filter Bar (5 controls + Export)        │
│         │ "X policies" results count                       │
│ Nav     ├────────────────────────────────────────────────┬─┤
│         │                                                │D│
│ Fixed   │ Policy Table (8 columns, sortable)            │e│
│         │ - Click row → opens detail panel              │t│
│         │                                                │a│
│         │                                                │i│
│         │                                                │l│
│         │                                                │ │
│         │                                                │P│
│         │                                                │a│
│         │                                                │n│
│         │                                                │e│
│         │                                                │l│
└─────────┴────────────────────────────────────────────────┴─┘
```

### Core Components

#### A. Search & Filter Bar

**Location**: Below top bar, sticky on scroll
**Background**: White with bottom border

**Controls** (left to right):
1. **Search Input**:
   - Width: flex-1, min-w-[300px]
   - Placeholder: "Search policies..."
   - Icon: Search (lucide-react)
   - Debounce: 300ms
   - Searches: Policy name, policy ID
   
2. **Mode Filter**:
   - Dropdown: All Modes | Active | Observation
   - Default: All Modes
   
3. **Topic Filter**:
   - Dropdown: All Topics | DME | Laboratory | E&M | Surgery | BH | Cardiology | Radiology
   - Default: All Topics
   
4. **Logic Type Filter**:
   - Dropdown: All Logic Types | Modifier | Duplicate | Medical Necessity | Authorization | Unit/Frequency | Code Combinations | Age | Covered Service | Pricing | Place of Service
   - Default: All Logic Types
   
5. **Source Filter**:
   - Dropdown: All Sources | NCCI | Medicare Policy | LCD | NCD | Client Source | HCPCS | AMA | FDA
   - Default: All Sources
   
6. **Export Button**:
   - Icon: Download
   - Action: Export filtered results as CSV
   - Position: Right-aligned

**Results Count** (below filters):
- Format: "X policies"
- Updates as filters change

#### B. Policy Table

**Columns** (8 total):

| Column | Width | Alignment | Content | Sortable |
|--------|-------|-----------|---------|----------|
| Policy | 25% | Left | Name (bold) + ID (monospace, gray) | Yes (alphabetical) |
| Category | 20% | Left | 3 badges (Topic, Logic Type, Source) | No |
| Hit Rate | 10% | Right | Percentage | Yes |
| Denial Rate | 10% | Right | Percentage (red) | Yes |
| Appeal Rate | 10% | Right | Percentage | Yes |
| Overturn Rate | 10% | Right | Percentage (green) | Yes |
| Impact | 10% | Right | Dollar amount ($X.XK) | Yes (default sort) |
| Trend | 5% | Center | ↑/↓/— icon | No |

**Row Styling**:
- Default: white background
- Hover: indigo-50 background
- Selected: indigo-50 background + indigo-400 left border (4px)
- Cursor: pointer

**Badge Colors**:
- Topic: `bg-indigo-100 text-indigo-700`
- Logic Type: `bg-cyan-100 text-cyan-700`
- Source: `bg-gray-100 text-gray-700`

**Trend Icons**:
- Up (red): `<TrendingUp className="w-4 h-4 text-red-500" />`
- Down (green): `<TrendingDown className="w-4 h-4 text-green-500" />`
- Stable (gray): Empty div

**Interaction**:
- Click row → opens detail panel
- Click again → closes panel
- Clicking different row → switches to that policy

#### C. Policy Detail Panel

**Layout**:
- Position: Fixed right side
- Width: 480px
- Background: White
- Shadow: shadow-xl
- Border: Left border only (gray-200)
- Z-index: 40

**Header Section**:
```
┌────────────────────────────────────────┐
│ E&M with Procedure - Modifier 25    [X]│
│ [Active] Since 2024-07-01              │
│ [E&M] [Modifier] [NCCI]                │
└────────────────────────────────────────┘
```

**Tab Navigation**:
6 tabs in horizontal scrollable container:
1. Overview (FileText icon)
2. Technical (Code icon)
3. References (BookOpen icon)
4. Performance (BarChart3 icon)
5. Claims (AlertCircle icon)
6. Learning (Award icon)

**Tab Styling**:
- Active: `border-b-2 border-indigo-600 text-indigo-600`
- Inactive: `border-b-2 border-transparent text-gray-600 hover:text-gray-900`
- Icon size: w-4 h-4
- Padding: px-4 py-3

**Tab Content** (scrollable):

**1. Overview Tab**:
```jsx
<div className="space-y-6">
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
    <p className="text-sm text-gray-700 leading-relaxed">{policy.description}</p>
  </div>
  
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-2">Clinical Rationale</h4>
    <p className="text-sm text-gray-700 leading-relaxed">{policy.clinicalRationale}</p>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">Common Issue</h4>
      <p className="text-sm text-gray-700">{policy.commonMistake}</p>
    </div>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">How to Fix</h4>
      <p className="text-sm text-gray-700">{policy.fixGuidance}</p>
    </div>
  </div>
</div>
```

**2. Technical Tab**:
- Procedure Codes: Chips in `bg-indigo-100 text-indigo-700 font-mono`
- Diagnosis Codes: Chips in `bg-cyan-100 text-cyan-700 font-mono`
- Modifiers: Chips in `bg-purple-100 text-purple-700 font-mono`
- Technical Details card: Gray background with key-value pairs

**3. References Tab**:
- List of clickable document cards
- Each card shows: Title, Source, Document type badge
- Hover: border-indigo-300
- Icon: ChevronRight

**4. Performance Tab**:
- 4 metric cards (2x2 grid)
  - Hit Rate
  - Denial Rate
  - Appeal Rate
  - Overturn Rate
- Financial Impact: Large highlighted number
- Provider Impact: Count of affected providers

**5. Claims Tab**:
- List of recent claims (5 shown)
- Each claim card:
  - Claim ID (monospace)
  - Patient name
  - Date
  - Amount
  - Status badge (Denied/Appealed/Pending)
- "View all claims →" link at bottom
- Click → navigate to Claim Detail

**6. Learning Tab** ⭐:
```jsx
<div className="space-y-6">
  {/* Learning Markers Card */}
  <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 border border-cyan-200 rounded-lg p-4">
    <div className="flex items-center gap-3 mb-3">
      <Award className="w-6 h-6 text-indigo-600" />
      <div>
        <div className="text-2xl font-semibold text-gray-900">{policy.learningMarkersCount}</div>
        <div className="text-sm text-gray-600">Providers tested corrections</div>
      </div>
    </div>
    <div className="text-xs text-gray-600">{policy.recentTests} tests in the last 7 days</div>
  </div>
  
  {/* Common Mistakes */}
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Mistakes</h4>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-gray-700">{policy.commonMistake}</p>
    </div>
  </div>
  
  {/* Coding Guidance */}
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Coding Guidance</h4>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-sm text-gray-700">{policy.fixGuidance}</p>
    </div>
  </div>
  
  {/* Recent Learning Activity */}
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Learning Activity</h4>
    <div className="space-y-2">
      {/* Timeline items */}
    </div>
  </div>
  
  {/* CTA Button */}
  <button className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
    🧪 Test in Claim Lab
  </button>
</div>
```

### State Management

Add to existing AppContext:

```javascript
const [selectedPolicy, setSelectedPolicy] = useState(null);
const [policyFilters, setPolicyFilters] = useState({
  search: '',
  mode: 'all',
  topic: 'all',
  logicType: 'all',
  source: 'all'
});
const [policySortBy, setPolicySortBy] = useState({ column: 'impact', direction: 'desc' });
```

### Navigation Integration

**From Dashboard**:
- Click "Top Policies" panel → navigate to `/policies`
- Click policy in detail panel → navigate to `/policies` with that policy selected
- Click "View more" on Policy Performance chart → navigate to `/policies`

**To Other Pages**:
- Click "Test in Claim Lab" → navigate to `/claim-lab` with policy context
- Click claim in Claims tab → navigate to `/claims/:claimId`

### Data Requirements

Expand `policies.json` to include:

```json
{
  "id": "POL-001",
  "name": "E&M with Procedure - Modifier 25 Required",
  "mode": "active",
  "effectiveDate": "2024-07-01",
  "endDate": null,
  "description": "When an E&M service is performed on the same day as a procedure...",
  "clinicalRationale": "Modifier 25 is necessary to differentiate an evaluation...",
  "topic": "E&M",
  "logicType": "Modifier",
  "source": "NCCI",
  "hitRate": 45,
  "denialRate": 78,
  "appealRate": 65,
  "overturnRate": 82,
  "impact": 306218,
  "insightCount": 3147,
  "providersImpacted": 1497,
  "trend": "down",
  "procedureCodes": ["99213", "99214", "99215"],
  "diagnosisCodes": ["Z00.00", "Z00.01"],
  "modifiers": ["25"],
  "placeOfService": [],
  "ageRestrictions": null,
  "frequencyLimits": null,
  "commonMistake": "Providers bill E&M codes on the same day...",
  "fixGuidance": "Add modifier 25 to the E&M code when performed...",
  "referenceDocs": [
    {
      "title": "NCCI Policy Manual Chapter 11",
      "source": "National Correct Coding Initiative",
      "url": null,
      "type": "primary"
    }
  ],
  "relatedPolicies": ["POL-002", "POL-005"],
  "learningMarkersCount": 23,
  "recentTests": 5
}
```

Generate **15-20 policies** with variety across topics, logic types, and sources.

---

## Phase 4: Claim Search & Detail

### Purpose
Find specific claims and understand line-by-line denial reasons with ability to launch into Claim Lab.

### Routes
- Search page: `/claims`
- Detail page: `/claims/:claimId`

### Search Page Layout

```
┌────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "Claims" + User Info                │
├────────────────────────────────────────────────────────┤
│         │ Search Bar (3 inputs + 5 filters)            │
│         │ Quick Filters (4 preset buttons)             │
│ Nav     ├────────────────────────────────────────────┬─┤
│         │                                            │ │
│ Fixed   │ Results Table                              │ │
│         │ - Claim ID | Patient | Date | Amount |    │ │
│         │   Status | Reason                          │ │
│         │ - Click row → navigate to detail           │ │
│         │                                            │ │
└─────────┴────────────────────────────────────────────┴─┘
```

### Search Interface Components

#### A. Search Bar

**Layout**: 3 primary search fields in a row

```jsx
<div className="flex items-center gap-4 mb-4">
  <div className="flex-1">
    <label className="text-sm text-gray-600 mb-1 block">Claim ID</label>
    <input 
      type="text"
      placeholder="CLM-2024-XXXX"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
    />
  </div>
  <div className="flex-1">
    <label className="text-sm text-gray-600 mb-1 block">Patient/Member ID</label>
    <input 
      type="text"
      placeholder="Search by patient..."
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
    />
  </div>
  <div className="flex-1">
    <label className="text-sm text-gray-600 mb-1 block">Procedure Code</label>
    <input 
      type="text"
      placeholder="CPT/HCPCS code"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
    />
  </div>
</div>
```

#### B. Filter Dropdowns

**5 filters** in a row:
1. Status: All | Approved | Denied | Pending | Appealed
2. Date Range: Last 7 Days | Last 30 Days | Last 90 Days | Custom
3. Provider: Dropdown of providers (if practice view)
4. Policy Hit: Dropdown of policies
5. Denial Reason: Dropdown of reasons

#### C. Quick Filters

**4 preset buttons**:
```jsx
<div className="flex items-center gap-2 mb-4">
  <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
    My Denied Claims
  </button>
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
    Appealed This Month
  </button>
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
    High $ Impact (&gt;$500)
  </button>
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
    Recent (Last 7 Days)
  </button>
</div>
```

#### D. Results Table

**Columns**:
- Claim ID (monospace, link)
- Patient Name
- Date of Service
- Amount ($ billed)
- Status (badge: green/red/yellow/blue)
- Denial Reason (if applicable)

**Interaction**:
- Click row → navigate to `/claims/:claimId`
- Hover → background change

### Claim Detail Page Layout

```
┌────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "Claim Detail" + User Info          │
├────────────────────────────────────────────────────────┤
│         │ Header: Claim ID + Patient + Provider        │
│         │ Status Badge + $ Amounts                     │
│ Nav     ├────────────────────────────────────────────┬─┤
│         │ Timeline Visualization                     │A│
│ Fixed   │ (Submitted → Processed → Denied → etc)     │c│
│         ├────────────────────────────────────────────┤t│
│         │ Line Items Table (expandable rows)         │i│
│         │ - Procedure | Modifier | Dx | $ | Status   │o│
│         │ - Expand → Edits Fired + Policies          │n│
│         ├────────────────────────────────────────────┤s│
│         │ Denial Information Panel (if denied)       │ │
│         │ - Primary reason + policy reference        │B│
│         │ - AI Insight with guidance                 │u│
│         ├────────────────────────────────────────────┤t│
│         │ Related Claims                             │t│
│         │ - Same patient / Same procedure            │o│
│         │                                            │n│
│         │                                            │s│
└─────────┴────────────────────────────────────────────┴─┘
```

### Claim Detail Components

#### A. Header Section

```jsx
<div className="bg-white border-b border-gray-200 p-6">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{claim.id}</h1>
      <div className="text-sm text-gray-600">
        Patient: {claim.patientName} • DOB: {claim.patientDOB}
      </div>
      <div className="text-sm text-gray-600">
        Provider: {claim.providerName} • DOS: {claim.dateOfService}
      </div>
    </div>
    <div className="text-right">
      <StatusBadge status={claim.status} />
      <div className="text-sm text-gray-600 mt-2">
        Billed: <span className="font-semibold">${claim.billedAmount}</span>
      </div>
      <div className="text-sm text-gray-600">
        Paid: <span className="font-semibold">${claim.paidAmount}</span>
      </div>
    </div>
  </div>
</div>
```

#### B. Timeline Visualization

```jsx
<div className="bg-white border-b border-gray-200 p-6">
  <div className="flex items-center justify-between relative">
    {/* Progress line */}
    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
    
    {/* Timeline steps */}
    {timeline.map((step, idx) => (
      <div key={idx} className="relative z-10 flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step.completed ? 'bg-indigo-600' : 'bg-gray-300'
        }`}>
          <step.icon className="w-4 h-4 text-white" />
        </div>
        <div className="mt-2 text-xs font-medium text-gray-900">{step.label}</div>
        <div className="text-xs text-gray-500">{step.date}</div>
      </div>
    ))}
  </div>
</div>
```

#### C. Line Items Table

**Expandable rows**:
```jsx
<table className="w-full">
  <thead>
    <tr className="bg-gray-50">
      <th className="w-8"></th>
      <th className="text-left px-4 py-3">Line</th>
      <th className="text-left px-4 py-3">Procedure Code</th>
      <th className="text-left px-4 py-3">Modifier</th>
      <th className="text-left px-4 py-3">Diagnosis Codes</th>
      <th className="text-right px-4 py-3">Units</th>
      <th className="text-right px-4 py-3">Billed</th>
      <th className="text-right px-4 py-3">Paid</th>
      <th className="text-center px-4 py-3">Status</th>
    </tr>
  </thead>
  <tbody>
    {claim.lineItems.map(item => (
      <>
        {/* Main row */}
        <tr 
          key={item.lineNumber}
          onClick={() => toggleExpand(item.lineNumber)}
          className="border-t cursor-pointer hover:bg-gray-50"
        >
          <td className="px-4 py-3">
            {expanded === item.lineNumber ? <ChevronDown /> : <ChevronRight />}
          </td>
          <td className="px-4 py-3">{item.lineNumber}</td>
          <td className="px-4 py-3 font-mono">{item.procedureCode}</td>
          <td className="px-4 py-3">{item.modifiers.join(', ')}</td>
          <td className="px-4 py-3">{item.diagnosisCodes.join(', ')}</td>
          <td className="px-4 py-3 text-right">{item.units}</td>
          <td className="px-4 py-3 text-right">${item.billedAmount}</td>
          <td className="px-4 py-3 text-right">${item.paidAmount}</td>
          <td className="px-4 py-3 text-center">
            <StatusBadge status={item.status} />
          </td>
        </tr>
        
        {/* Expanded content */}
        {expanded === item.lineNumber && (
          <tr className="bg-gray-50">
            <td colSpan="9" className="px-4 py-4">
              <div className="space-y-3">
                {/* Edits Fired */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Edits Fired</h4>
                  <div className="space-y-1">
                    {item.editsFired.map(edit => (
                      <div key={edit} className="text-sm text-gray-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        {edit}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Policies Triggered */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Policies Triggered</h4>
                  <div className="space-y-1">
                    {item.policiesTriggered.map(policyId => (
                      <button 
                        key={policyId}
                        onClick={() => navigate(`/policies?selected=${policyId}`)}
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {getPolicyName(policyId)}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    ))}
  </tbody>
</table>
```

#### D. Denial Information Panel

**Only show if claim is denied**:

```jsx
{claim.status === 'denied' && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Denial Information</h3>
    
    {/* Primary Denial Reason */}
    <div className="mb-4">
      <div className="text-sm text-gray-600 mb-1">Primary Denial Reason</div>
      <div className="text-base font-semibold text-red-900">{claim.denialReason}</div>
    </div>
    
    {/* Policy Reference */}
    <div className="mb-4">
      <div className="text-sm text-gray-600 mb-1">Policy Reference</div>
      <button 
        onClick={() => navigate(`/policies?selected=${claim.policyId}`)}
        className="text-indigo-600 hover:underline flex items-center gap-1"
      >
        {claim.policyName}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    
    {/* AI Insight */}
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Insight</h4>
          <p className="text-sm text-gray-700 mb-3">
            This claim was denied because {claim.aiInsight.explanation}
          </p>
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="text-xs font-semibold text-gray-900 mb-1">To fix this:</div>
            <p className="text-sm text-gray-700">{claim.aiInsight.guidance}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

#### E. Actions Panel

**Fixed right side** (similar to policy detail panel):

```jsx
<div className="w-80 bg-white border-l border-gray-200 p-6 space-y-4">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
  
  {/* Primary CTA */}
  <button className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
    🧪 Test in Claim Lab
  </button>
  
  {/* Secondary Actions */}
  {claim.appealStatus && (
    <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
      View Appeal History
    </button>
  )}
  
  <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
    Download EOB
  </button>
  
  <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
    Export Details
  </button>
  
  {/* Related Claims */}
  <div className="pt-4 border-t border-gray-200">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Related Claims</h4>
    <div className="space-y-2">
      {relatedClaims.map(related => (
        <button 
          key={related.id}
          onClick={() => navigate(`/claims/${related.id}`)}
          className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50"
        >
          <div className="text-xs text-gray-500">{related.id}</div>
          <div className="text-sm text-gray-900">{related.description}</div>
        </button>
      ))}
    </div>
  </div>
</div>
```

### Navigation Integration

**From Dashboard**:
- Click "Recent Denials" panel → navigate to `/claims`
- Click specific claim → navigate to `/claims/:claimId`

**From Policy Analytics**:
- Click claim in Claims tab → navigate to `/claims/:claimId`

**To Claim Lab**:
- Click "Test in Claim Lab" → navigate to `/claim-lab` with claim context

---

## Phase 5: AI Insights Hub

### Purpose
Aggregate view of all detected patterns with actionable guidance and learning tracking.

### Route
- Path: `/insights`
- Component: `src/pages/Insights.jsx`

### Page Layout

```
┌────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "AI Insights" + User Info           │
├────────────────────────────────────────────────────────┤
│         │ Summary Header (patterns + impact + claims)  │
│         │ Time Period Selector + 3 Filters             │
│ Nav     ├────────────────────────────────────────────┬─┤
│         │                                            │I│
│ Fixed   │ Pattern Cards (sorted by impact)           │n│
│         │ - Priority indicator                       │s│
│         │ - Pattern title + description              │i│
│         │ - Financial impact                         │g│
│         │ - Provider impact                          │h│
│         │ - Learning status ⭐                       │t│
│         │ - Progress bar                             │ │
│         │ - "Review Pattern" CTA                     │D│
│         │ - Click → opens detail panel               │e│
│         │                                            │t│
│         │                                            │a│
│         │                                            │i│
│         │                                            │l│
└─────────┴────────────────────────────────────────────┴─┘
```

### Components

#### A. Summary Header

```jsx
<div className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white p-8 rounded-lg mb-6">
  <h1 className="text-3xl font-semibold mb-4">
    {insights.length} patterns detected that could improve your approval rate
  </h1>
  <div className="grid grid-cols-3 gap-6">
    <div>
      <div className="text-sm opacity-80">Potential Savings</div>
      <div className="text-2xl font-semibold">{formatCurrency(totalImpact)}</div>
    </div>
    <div>
      <div className="text-sm opacity-80">Affected Claims</div>
      <div className="text-2xl font-semibold">{totalClaims}</div>
    </div>
    <div>
      <div className="text-sm opacity-80">Providers Affected</div>
      <div className="text-2xl font-semibold">{totalProviders}</div>
    </div>
  </div>
</div>
```

#### B. Filter Bar

```jsx
<div className="flex items-center gap-4 mb-6">
  <select className="px-3 py-2 border rounded-lg">
    <option value="all">All Categories</option>
    <option value="coding">Coding</option>
    <option value="practice">Practice Pattern</option>
    <option value="documentation">Documentation</option>
  </select>
  
  <select className="px-3 py-2 border rounded-lg">
    <option value="all">All Priorities</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
  
  <select className="px-3 py-2 border rounded-lg">
    <option value="all">All Status</option>
    <option value="new">New</option>
    <option value="in-progress">In Progress</option>
    <option value="resolved">Resolved</option>
  </select>
</div>
```

#### C. Pattern Cards

```jsx
{insights.map(insight => (
  <div 
    key={insight.id}
    onClick={() => setSelectedInsight(insight)}
    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer mb-4"
  >
    {/* Priority Indicator */}
    <div className="flex items-start gap-4 mb-4">
      <div className={`w-3 h-3 rounded-full mt-1.5 ${
        insight.priority === 'high' ? 'bg-red-500' :
        insight.priority === 'medium' ? 'bg-yellow-500' :
        'bg-gray-400'
      }`}></div>
      
      <div className="flex-1">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {insight.pattern}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">
          {insight.description}
        </p>
        
        {/* Impact Metrics */}
        <div className="flex items-center gap-6 mb-3 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">{formatCurrency(insight.impact)}</span>
            <span>denied</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{insight.claimIds.length} claims</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{insight.providerIds.length} providers</span>
          </div>
        </div>
        
        {/* Learning Status */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-cyan-600" />
            <span className="text-cyan-600 font-medium">
              {insight.learningMarkersCount} tests completed
            </span>
          </div>
          
          {/* Trend */}
          <div className="flex items-center gap-1 text-sm">
            {insight.trend === 'improving' ? (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Improving</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Getting worse</span>
              </>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Learning Progress</span>
            <span>{Math.round((insight.learningMarkersCount / insight.providerIds.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-cyan-600 rounded-full h-2"
              style={{ width: `${Math.round((insight.learningMarkersCount / insight.providerIds.length) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Example Claims Link */}
        <button className="text-sm text-indigo-600 hover:underline">
          See {Math.min(3, insight.claimIds.length)} example claims →
        </button>
      </div>
      
      {/* Category Badge */}
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        insight.category === 'Coding' ? 'bg-indigo-100 text-indigo-700' :
        insight.category === 'Practice Pattern' ? 'bg-cyan-100 text-cyan-700' :
        'bg-purple-100 text-purple-700'
      }`}>
        {insight.category}
      </span>
    </div>
    
    {/* Review Button */}
    <div className="flex justify-end">
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Review Pattern
      </button>
    </div>
  </div>
))}
```

#### D. Insight Detail Panel

**Right side panel** (480px wide, similar to policy detail):

```jsx
<div className="space-y-6">
  {/* Header */}
  <div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">{insight.pattern}</h2>
    <div className="flex items-center gap-2">
      <PriorityBadge priority={insight.priority} />
      <CategoryBadge category={insight.category} />
      <span className="text-xs text-gray-500">Detected {insight.detectedDate}</span>
    </div>
  </div>
  
  {/* Problem Explanation */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2">Problem</h3>
    <p className="text-sm text-gray-700">{insight.guidance.problem}</p>
  </div>
  
  {/* Visual Examples */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Before/After Example</h3>
    <div className="space-y-2">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-red-900 mb-1">
          <XCircle className="w-4 h-4" />
          <span className="font-semibold">Wrong</span>
        </div>
        <code className="text-sm text-gray-700">{insight.guidance.examples[0].wrong}</code>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-green-900 mb-1">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold">Right</span>
        </div>
        <code className="text-sm text-gray-700">{insight.guidance.examples[0].right}</code>
      </div>
    </div>
  </div>
  
  {/* Affected Claims */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Affected Claims</h3>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {insight.claimIds.slice(0, 5).map(claimId => (
        <button
          key={claimId}
          onClick={() => navigate(`/claims/${claimId}`)}
          className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50"
        >
          <div className="text-xs text-gray-500 font-mono">{claimId}</div>
        </button>
      ))}
    </div>
    <button className="w-full mt-2 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
      View all {insight.claimIds.length} claims →
    </button>
  </div>
  
  {/* Related Policies */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Policies</h3>
    <div className="space-y-2">
      {insight.policyIds.map(policyId => (
        <button
          key={policyId}
          onClick={() => navigate(`/policies?selected=${policyId}`)}
          className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-between"
        >
          <span className="text-sm text-gray-900">{getPolicyName(policyId)}</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      ))}
    </div>
  </div>
  
  {/* Learning Impact */}
  <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 border border-cyan-200 rounded-lg p-4">
    <div className="flex items-center gap-3 mb-3">
      <Award className="w-6 h-6 text-indigo-600" />
      <div>
        <div className="text-2xl font-semibold text-gray-900">{insight.learningMarkersCount}</div>
        <div className="text-sm text-gray-600">Providers tested corrections</div>
      </div>
    </div>
    
    {/* Recent Activity Timeline */}
    <div className="text-xs text-gray-600 space-y-1">
      <div>Dr. Sarah Smith tested correction - 2 hours ago</div>
      <div>Dr. Michael Johnson tested correction - 1 day ago</div>
      <div>Dr. Priya Patel tested correction - 2 days ago</div>
    </div>
  </div>
  
  {/* Guidance */}
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-900 mb-2">How to Fix</h3>
    <p className="text-sm text-gray-700">{insight.guidance.solution}</p>
  </div>
  
  {/* CTAs */}
  <div className="space-y-2">
    <button className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
      🧪 Test a Correction in Claim Lab
    </button>
    <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
      Mark as Acknowledged
    </button>
  </div>
</div>
```

### Navigation Integration

**From Dashboard**:
- Click AI Insights widget → navigate to `/insights`
- Click "Review all insights" → navigate to `/insights`

**From Policies**:
- Pattern detection shows related insights

**To Claim Lab**:
- Click "Test a Correction" → navigate to `/claim-lab` with insight context

---

## Phase 3: Claim Lab (Interactive Learning Sandbox)

**BUILD THIS AFTER PHASES 2, 4, AND 5 ARE COMPLETE**

### Purpose
Interactive environment to test claim corrections and create learning markers for ROI tracking.

### Route
- Path: `/claim-lab`
- Component: `src/pages/ClaimLab.jsx`
- Can be launched with context from: Policy detail, Claim detail, or Insight detail

### Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "Claim Lab" + Context Info                  │
├────────────────────────────────────────────────────────────────┤
│         ┌──────────┬────────────────┬─────────────┬───────────┐│
│         │          │                │             │           ││
│ Nav     │ Original │ Edit Workspace │ Results     │ Guidance  ││
│         │ (30%)    │ (40%)          │ (30%)       │ (sidebar) ││
│ Fixed   │          │                │             │           ││
│         │ Read-    │ Editable       │ Before/     │ AI        ││
│         │ only     │ Fields         │ After       │ Tips      ││
│         │          │                │ Comparison  │           ││
│         │ Edits    │ [Run Sim]      │             │ Ref       ││
│         │ Fired    │ [Reset]        │ Payment     │ Docs      ││
│         │          │                │ Est.        │           ││
└─────────└──────────┴────────────────┴─────────────┴───────────┘│
```

### Three-Panel Layout

#### Left Panel: Original Claim (30% width, fixed)

```jsx
<div className="bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-900 mb-2">Original Submission</h3>
    <div className="text-xs text-gray-600 space-y-1">
      <div>Claim ID: {claim.id}</div>
      <div>Patient: {claim.patientName}</div>
      <div>DOS: {claim.dateOfService}</div>
      <div>Provider: {claim.providerName}</div>
    </div>
  </div>
  
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <XCircle className="w-4 h-4 text-red-500" />
      <span className="text-sm font-semibold text-gray-900">Denied</span>
    </div>
    <div className="bg-red-50 border border-red-200 rounded p-3">
      <div className="text-xs text-red-900">{claim.denialReason}</div>
    </div>
  </div>
  
  {/* Line Items (read-only) */}
  <div>
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h4>
    <div className="space-y-3">
      {claim.lineItems.map(item => (
        <div key={item.lineNumber} className="bg-white border border-gray-200 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Line {item.lineNumber}</div>
          <div className="font-mono text-sm text-gray-900 mb-1">{item.procedureCode}</div>
          {item.modifiers.length > 0 && (
            <div className="text-xs text-gray-600">Modifiers: {item.modifiers.join(', ')}</div>
          )}
          <div className="text-xs text-gray-600">Dx: {item.diagnosisCodes.join(', ')}</div>
          <div className="text-xs text-gray-600">Units: {item.units}</div>
          <div className="text-xs font-semibold text-gray-900 mt-2">${item.billedAmount}</div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Edits/Policies Fired */}
  <div className="mt-6">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Edits Fired</h4>
    <div className="space-y-2">
      {claim.lineItems.flatMap(item => item.editsFired).map((edit, idx) => (
        <div key={idx} className="flex items-start gap-2 text-xs">
          <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{edit}</span>
        </div>
      ))}
    </div>
  </div>
  
  <div className="mt-6">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">Policies Triggered</h4>
    <div className="space-y-2">
      {claim.lineItems.flatMap(item => item.policiesTriggered).map((policyId, idx) => (
        <button
          key={idx}
          onClick={() => window.open(`/policies?selected=${policyId}`, '_blank')}
          className="w-full text-left text-xs text-indigo-600 hover:underline"
        >
          {getPolicyName(policyId)}
        </button>
      ))}
    </div>
  </div>
</div>
```

#### Center Panel: Editable Workspace (40% width)

```jsx
<div className="bg-white p-6 overflow-y-auto">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Corrections</h3>
  
  {/* Line Items (editable) */}
  <div className="space-y-6">
    {editedClaim.lineItems.map((item, idx) => (
      <div key={idx} className="border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-900 mb-4">Line {item.lineNumber}</div>
        
        {/* Procedure Code */}
        <div className="mb-4">
          <label className="text-xs text-gray-600 mb-1 block">Procedure Code</label>
          <input
            type="text"
            value={item.procedureCode}
            onChange={(e) => updateLineItem(idx, 'procedureCode', e.target.value)}
            className={`w-full px-3 py-2 border rounded font-mono text-sm ${
              item.procedureCode !== claim.lineItems[idx].procedureCode 
                ? 'bg-yellow-50 border-yellow-400' 
                : 'border-gray-300'
            }`}
          />
        </div>
        
        {/* Modifiers */}
        <div className="mb-4">
          <label className="text-xs text-gray-600 mb-1 block">Modifiers</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={item.modifiers.join(', ')}
              onChange={(e) => updateLineItem(idx, 'modifiers', e.target.value.split(',').map(m => m.trim()))}
              placeholder="25, 59, etc."
              className={`flex-1 px-3 py-2 border rounded font-mono text-sm ${
                JSON.stringify(item.modifiers) !== JSON.stringify(claim.lineItems[idx].modifiers)
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'border-gray-300'
              }`}
            />
          </div>
        </div>
        
        {/* Diagnosis Codes */}
        <div className="mb-4">
          <label className="text-xs text-gray-600 mb-1 block">Diagnosis Codes</label>
          <input
            type="text"
            value={item.diagnosisCodes.join(', ')}
            onChange={(e) => updateLineItem(idx, 'diagnosisCodes', e.target.value.split(',').map(d => d.trim()))}
            className={`w-full px-3 py-2 border rounded font-mono text-sm ${
              JSON.stringify(item.diagnosisCodes) !== JSON.stringify(claim.lineItems[idx].diagnosisCodes)
                ? 'bg-yellow-50 border-yellow-400'
                : 'border-gray-300'
            }`}
          />
        </div>
        
        {/* Units */}
        <div className="mb-4">
          <label className="text-xs text-gray-600 mb-1 block">Units</label>
          <input
            type="number"
            value={item.units}
            onChange={(e) => updateLineItem(idx, 'units', parseInt(e.target.value))}
            className={`w-24 px-3 py-2 border rounded text-sm ${
              item.units !== claim.lineItems[idx].units
                ? 'bg-yellow-50 border-yellow-400'
                : 'border-gray-300'
            }`}
          />
        </div>
        
        {/* Date of Service */}
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Date of Service</label>
          <input
            type="date"
            value={item.dateOfService}
            onChange={(e) => updateLineItem(idx, 'dateOfService', e.target.value)}
            className={`px-3 py-2 border rounded text-sm ${
              item.dateOfService !== claim.lineItems[idx].dateOfService
                ? 'bg-yellow-50 border-yellow-400'
                : 'border-gray-300'
            }`}
          />
        </div>
      </div>
    ))}
  </div>
  
  {/* Action Buttons */}
  <div className="mt-6 flex items-center gap-3">
    <button
      onClick={runSimulation}
      disabled={!hasChanges}
      className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Run Simulation
    </button>
    <button
      onClick={resetToOriginal}
      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      Reset to Original
    </button>
  </div>
  
  {/* Change Summary */}
  {hasChanges && (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
      <div className="text-xs font-semibold text-blue-900 mb-1">Changes Made:</div>
      <ul className="text-xs text-blue-800 space-y-1">
        {getChangesSummary().map((change, idx) => (
          <li key={idx}>• {change}</li>
        ))}
      </ul>
    </div>
  )}
</div>
```

#### Right Panel: Simulation Results (30% width)

```jsx
<div className="bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Simulation Results</h3>
  
  {!simulationRun ? (
    <div className="text-center text-gray-500 py-12">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm">Make changes and run simulation to see results</p>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-600 mb-2">BEFORE</div>
          <div className="bg-white border border-red-200 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-900">Denied</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>{originalResults.editsFired.length} edits fired</div>
              <div>${claim.paidAmount} paid</div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-600 mb-2">AFTER</div>
          <div className={`bg-white border rounded p-3 ${
            simulationResults.outcome === 'approved' 
              ? 'border-green-200' 
              : 'border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {simulationResults.outcome === 'approved' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-900">Would Approve</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-900">Still Denied</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>{simulationResults.editsFired.length} edits fired</div>
              <div>${simulationResults.estimatedPayment} would be paid</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edits Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Edits Analysis</h4>
        
        {/* Passed Edits */}
        {simulationResults.editsPassed.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-green-700 font-semibold mb-1">
              ✅ {simulationResults.editsPassed.length} Edits Would Pass
            </div>
            <div className="space-y-1">
              {simulationResults.editsPassed.map((edit, idx) => (
                <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Failed Edits */}
        {simulationResults.editsFailed.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-red-700 font-semibold mb-1">
              ❌ {simulationResults.editsFailed.length} Edits Would Still Fire
            </div>
            <div className="space-y-1">
              {simulationResults.editsFailed.map((edit, idx) => (
                <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* New Edits */}
        {simulationResults.newEdits.length > 0 && (
          <div>
            <div className="text-xs text-orange-700 font-semibold mb-1">
              🆕 {simulationResults.newEdits.length} New Edits Would Fire
            </div>
            <div className="space-y-1">
              {simulationResults.newEdits.map((edit, idx) => (
                <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Policy Impact */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Policy Impact</h4>
        <div className="space-y-2">
          {simulationResults.policies.map((policy, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{policy.name}</span>
              {policy.triggered ? (
                <XCircle className="w-3 h-3 text-red-500" />
              ) : (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Payment Calculation */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Estimate</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Billed Amount:</span>
            <span className="font-semibold">${claim.billedAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Allowed:</span>
            <span className="font-semibold">${simulationResults.estimatedAllowed}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-900 font-semibold">Estimated Payment:</span>
            <span className="text-lg font-bold text-green-600">${simulationResults.estimatedPayment}</span>
          </div>
        </div>
      </div>
      
      {/* Save Test Button */}
      <button
        onClick={() => setSaveDialogOpen(true)}
        className="w-full py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
      >
        💾 Save This Test
      </button>
    </div>
  )}
</div>
```

#### Guidance Sidebar (Collapsible, 300px when open)

```jsx
<div className={`bg-white border-l border-gray-200 p-6 overflow-y-auto transition-all ${
  guidanceOpen ? 'w-80' : 'w-0 p-0'
}`}>
  {guidanceOpen && (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Guidance</h3>
        <button onClick={() => setGuidanceOpen(false)}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* AI Suggestions */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">AI Suggestions</h4>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-gray-700 mb-3">
            Based on the denial reason, consider:
          </p>
          <ul className="text-sm text-gray-700 space-y-2">
            {aiSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Reference Materials */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Reference Materials</h4>
        <div className="space-y-2">
          {referenceDocs.map((doc, idx) => (
            <button
              key={idx}
              className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50"
            >
              <div className="text-xs font-semibold text-gray-900">{doc.title}</div>
              <div className="text-xs text-gray-500">{doc.source}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Similar Approved Claims */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Similar Approved Claims</h4>
        <div className="space-y-2">
          {similarClaims.map((claim, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-2">
              <div className="text-xs text-gray-500 font-mono mb-1">{claim.id}</div>
              <div className="text-xs text-gray-700">{claim.codes}</div>
              <button className="text-xs text-indigo-600 hover:underline mt-1">
                Use as template
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )}
</div>
```

### Save Test Dialog (Modal)

```jsx
{saveDialogOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Test</h2>
      
      {/* Auto-generated summary */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-900 mb-2 block">Test Summary</label>
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="text-sm text-gray-700 space-y-1">
            {getChangesSummary().map((change, idx) => (
              <div key={idx}>• {change}</div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Notes field */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-900 mb-2 block">
          Notes <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={saveNotes}
          onChange={(e) => setSaveNotes(e.target.value)}
          placeholder="What did you learn from this test?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded resize-none text-sm"
        />
      </div>
      
      {/* Tags */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-900 mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {['Coding Error', 'Modifier Issue', 'Documentation Problem', 'Other'].map(tag => (
            <button
              key={tag}
              onClick={() => setSaveTag(tag)}
              className={`px-3 py-1 rounded-full text-xs ${
                saveTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveLearningMarker}
          className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          Save Test
        </button>
        <button
          onClick={() => setSaveDialogOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

### Learning Marker Creation ⭐

**Critical Function** - This is the ROI tracking mechanism:

```javascript
const saveLearningMarker = async () => {
  const learningMarker = {
    id: `LM-${Date.now()}`,
    claimId: claim.id,
    providerId: currentProvider.id,
    policyId: claim.policyId,
    insightId: contextInsightId, // if launched from insight
    testDate: new Date().toISOString(),
    originalClaim: claim,
    correctedClaim: editedClaim,
    changes: getChangesSummary(),
    notes: saveNotes,
    category: saveTag,
    simulationResult: {
      outcome: simulationResults.outcome,
      editsPassed: simulationResults.editsPassed.length,
      editsFailed: simulationResults.editsFailed.length,
      estimatedPayment: simulationResults.estimatedPayment
    }
  };
  
  // Save to localStorage
  const existingMarkers = JSON.parse(localStorage.getItem('learningMarkers') || '[]');
  existingMarkers.push(learningMarker);
  localStorage.setItem('learningMarkers', JSON.stringify(existingMarkers));
  
  // Show success message
  showToast('Test saved! This will help track your learning progress.');
  
  // Navigate back or show confirmation
  setSaveDialogOpen(false);
  navigate('/dashboard');
};
```

### Simulation Logic (Hard-coded for PoC)

```javascript
const runSimulation = () => {
  // Hard-coded logic for demo
  const results = {
    outcome: 'approved', // or 'denied'
    editsPassed: [],
    editsFailed: [],
    newEdits: [],
    policies: [],
    estimatedAllowed: 0,
    estimatedPayment: 0
  };
  
  // Check if modifier 25 was added
  const hasModifier25 = editedClaim.lineItems.some(item => 
    item.modifiers.includes('25') && !claim.lineItems.find(orig => 
      orig.lineNumber === item.lineNumber
    ).modifiers.includes('25')
  );
  
  if (hasModifier25) {
    results.outcome = 'approved';
    results.editsPassed.push('Modifier 25 requirement met');
    results.editsFailed = [];
    results.estimatedPayment = claim.billedAmount;
  } else {
    results.outcome = 'denied';
    results.editsFailed.push('Missing modifier 25');
    results.estimatedPayment = 0;
  }
  
  setSimulationResults(results);
  setSimulationRun(true);
};
```

### Navigation Integration

**Launch Points**:
1. Policy Detail → "Test in Claim Lab" button
2. Claim Detail → "Test in Claim Lab" button
3. Insight Detail → "Test a Correction" button

**Context Passing**:
```javascript
// From Policy Detail
navigate('/claim-lab', { 
  state: { 
    sourceType: 'policy',
    policyId: selectedPolicy.id,
    claimId: selectedClaim.id
  }
});

// From Claim Detail
navigate('/claim-lab', {
  state: {
    sourceType: 'claim',
    claimId: claim.id
  }
});

// From Insight Detail
navigate('/claim-lab', {
  state: {
    sourceType: 'insight',
    insightId: insight.id,
    claimId: selectedClaim.id
  }
});
```

---

## Phase 6: Impact & ROI Dashboard

### Purpose
Simple reporting view showing learning activity and preliminary ROI metrics.

### Route
- Path: `/impact`
- Component: `src/pages/Impact.jsx`

### Page Layout

```
┌────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar: "Learning Impact" + User Info       │
├────────────────────────────────────────────────────────┤
│         │ Practice Scorecard (3 key metrics)           │
│         ├────────────────────────────────────────────┬─┤
│ Nav     │                                            │ │
│         │ Provider Leaderboard                       │ │
│ Fixed   │ - Provider | Tests | Denial Δ | $ Impact  │ │
│         │                                            │ │
│         ├────────────────────────────────────────────┤ │
│         │ Learning Impact Table                      │ │
│         │ - Pattern | Tests | Behavior | $ Impact   │ │
│         │                                            │ │
│         ├────────────────────────────────────────────┤ │
│         │ Time-Series Chart                          │ │
│         │ - Denial rate over time with test markers │ │
└─────────┴────────────────────────────────────────────┴─┘
```

### Components

#### A. Practice Scorecard

```jsx
<div className="grid grid-cols-3 gap-6 mb-8">
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="text-sm text-gray-600 mb-2">Overall Improvement</div>
    <div className="text-3xl font-semibold text-green-600 mb-1">-4.2%</div>
    <div className="text-xs text-gray-500">Denial rate since tool launch</div>
  </div>
  
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="text-sm text-gray-600 mb-2">Learning Activity</div>
    <div className="text-3xl font-semibold text-indigo-600 mb-1">23</div>
    <div className="text-xs text-gray-500">Tests completed by 5 providers</div>
  </div>
  
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="text-sm text-gray-600 mb-2">Potential Savings</div>
    <div className="text-3xl font-semibold text-cyan-600 mb-1">$18.4K</div>
    <div className="text-xs text-gray-500">Recovered through corrections</div>
  </div>
</div>
```

#### B. Provider Leaderboard

```jsx
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Improvement Leaderboard</h2>
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Rank</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Provider</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Tests Completed</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Denial Rate Δ</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">$ Impact</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {providerStats.map((provider, idx) => (
        <tr key={provider.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-900">#{idx + 1}</td>
          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{provider.name}</td>
          <td className="px-4 py-3 text-sm text-right">{provider.testsCompleted}</td>
          <td className="px-4 py-3 text-sm text-right">
            <span className={provider.denialRateChange < 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
              {provider.denialRateChange > 0 ? '+' : ''}{provider.denialRateChange}%
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
            {formatCurrency(provider.impact)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### C. Learning Impact Table

```jsx
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Impact by Pattern</h2>
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Insight Pattern</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Tests Completed</th>
        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Behavior Change</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">$ Impact</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {insightStats.map(stat => (
        <tr key={stat.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-900">{stat.pattern}</td>
          <td className="px-4 py-3 text-sm text-right">{stat.testsCompleted}</td>
          <td className="px-4 py-3 text-center">
            {stat.behaviorChange === 'yes' && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                <CheckCircle className="w-3 h-3 mr-1" />
                Yes ({stat.providersImproved} providers)
              </span>
            )}
            {stat.behaviorChange === 'pending' && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </span>
            )}
            {stat.behaviorChange === 'no' && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                No
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
            {formatCurrency(stat.impact)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### D. Time-Series Chart

```jsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Denial Rate Trend</h2>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={timeSeriesData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="week" />
      <YAxis />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="denialRate" 
        stroke="#818CF8" 
        strokeWidth={2}
        dot={{ fill: '#818CF8', r: 4 }}
      />
      {/* Annotations for Claim Lab tests */}
      {testMarkers.map(marker => (
        <ReferenceLine 
          key={marker.week}
          x={marker.week}
          stroke="#4DD0E1"
          strokeDasharray="3 3"
          label={{ value: `${marker.count} tests`, position: 'top' }}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
  <div className="mt-4 text-xs text-gray-600 flex items-center gap-2">
    <div className="flex items-center gap-1">
      <div className="w-3 h-0.5 bg-indigo-400"></div>
      <span>Denial Rate</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-3 h-0.5 bg-cyan-400 border-dashed"></div>
      <span>Claim Lab Tests</span>
    </div>
  </div>
</div>
```

---

## Global State Management Updates

Update `AppContext` to include:

```javascript
export const AppProvider = ({ children }) => {
  // Existing state
  const [filters, setFilters] = useState({...});
  
  // New state for Phase 2-6
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [learningMarkers, setLearningMarkers] = useLocalStorage('learningMarkers', []);
  const [claimLabContext, setClaimLabContext] = useState(null);
  
  // Load all data
  const claims = useMemo(() => require('./data/claims.json'), []);
  const policies = useMemo(() => require('./data/policies.json'), []);
  const providers = useMemo(() => require('./data/providers.json'), []);
  const insights = useMemo(() => require('./data/insights.json'), []);
  
  // Computed values
  const providerStats = useMemo(() => {
    // Calculate provider improvement stats from learningMarkers
  }, [learningMarkers, claims, providers]);
  
  const insightStats = useMemo(() => {
    // Calculate insight impact stats
  }, [learningMarkers, insights]);
  
  return (
    <AppContext.Provider value={{
      // All state and computed values
      filters,
      setFilters,
      claims,
      policies,
      providers,
      insights,
      selectedPolicy,
      setSelectedPolicy,
      selectedClaim,
      setSelectedClaim,
      selectedInsight,
      setSelectedInsight,
      learningMarkers,
      setLearningMarkers,
      claimLabContext,
      setClaimLabContext,
      providerStats,
      insightStats
    }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

## Routing Setup

Update `App.jsx`:

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import ClaimDetail from './pages/ClaimDetail';
import Insights from './pages/Insights';
import ClaimLab from './pages/ClaimLab';
import Impact from './pages/Impact';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/claims/:claimId" element={<ClaimDetail />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/claim-lab" element={<ClaimLab />} />
          <Route path="/impact" element={<Impact />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
```

---

## Data Files to Expand

### claims.json Additions

Add line-level detail:
```json
{
  "lineItems": [
    {
      "lineNumber": 1,
      "procedureCode": "99213",
      "modifiers": [],
      "diagnosisCodes": ["Z00.00"],
      "units": 1,
      "billedAmount": 100.00,
      "paidAmount": 0.00,
      "status": "denied",
      "editsFired": ["Missing modifier 25", "E&M with procedure same day"],
      "policiesTriggered": ["POL-001"]
    }
  ],
  "aiInsight": {
    "explanation": "the E&M service was performed on the same day as a procedure without modifier 25",
    "guidance": "Add modifier 25 to the E&M code (99213-25) to indicate it was a separately identifiable service"
  }
}
```

### Generate 75-100 complete claims across all providers and time periods

---

## Testing Checklist

### Phase 2: Policy Analytics
- [ ] Search filters work correctly
- [ ] Table sorting functions
- [ ] Row selection opens detail panel
- [ ] All 6 tabs display correct content
- [ ] Learning tab shows test counts
- [ ] Navigation to Claim Lab works
- [ ] Export button generates CSV

### Phase 4: Claim Search & Detail
- [ ] All search fields work
- [ ] Quick filters apply correctly
- [ ] Claim detail loads properly
- [ ] Timeline visualization accurate
- [ ] Line items expand/collapse
- [ ] Policy links navigate correctly
- [ ] "Test in Claim Lab" button works
- [ ] Related claims display

### Phase 5: AI Insights Hub
- [ ] Filters update pattern cards
- [ ] Sort by impact works
- [ ] Learning progress bars accurate
- [ ] Detail panel shows all content
- [ ] Navigation to claims works
- [ ] Navigation to policies works
- [ ] "Test a Correction" launches Claim Lab

### Phase 3: Claim Lab
- [ ] Original claim displays correctly
- [ ] All fields editable
- [ ] Change highlighting works
- [ ] Simulation runs successfully
- [ ] Results display accurately
- [ ] Save dialog opens
- [ ] Learning marker created
- [ ] Saved to localStorage
- [ ] Guidance sidebar functional
- [ ] Context passed from other pages

### Phase 6: Impact & ROI
- [ ] Scorecard metrics calculated correctly
- [ ] Leaderboard sorts by improvement
- [ ] Learning impact table accurate
- [ ] Time-series chart displays
- [ ] Test markers annotated on chart
- [ ] Export functionality works

---

## Performance Optimization

### Code Splitting
```javascript
// Lazy load heavy components
const ClaimLab = lazy(() => import('./pages/ClaimLab'));
const Insights = lazy(() => import('./pages/Insights'));
```

### Memoization
```javascript
// Memoize expensive calculations
const filteredPolicies = useMemo(() => {
  return policies.filter(/* filter logic */);
}, [policies, filters]);
```

### Virtual Scrolling (if needed)
For tables with 100+ rows, consider `react-window` or `react-virtual`

---

## Accessibility Requirements

- Keyboard navigation (Tab, Enter, Esc)
- ARIA labels on all interactive elements
- Focus management in modals
- Screen reader compatibility
- High contrast mode support

---

## Browser Testing

Test on:
- Chrome (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)

---

## Final Integration Checklist

- [ ] All routes defined in App.jsx
- [ ] All navigation links functional
- [ ] Context data flows correctly
- [ ] Learning markers save to localStorage
- [ ] Learning markers display throughout app
- [ ] Export functions work
- [ ] No console errors
- [ ] No broken links
- [ ] Data persistence works across sessions
- [ ] All CTAs lead to correct destinations

---

**END OF SPECIFICATION**

This document provides everything needed to build Phases 2-6 of the Provider Portal. Build in the recommended order: Policy Analytics → Claim Search → Insights Hub → Claim Lab → Impact Dashboard.
