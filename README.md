# Provider Portal - PoC

A healthcare provider-facing claims analytics portal built with React, Vite, and Tailwind CSS.

## Features

### Phase 1.1 - Core Dashboard ✅

- **6 Metric Cards** with trend indicators
  - Claims Submitted
  - Approval Rate
  - Denied Claims
  - Denied Amount
  - Appeal Success
  - Learning Impact (highlighted)

- **Interactive Charts**
  - Claims Trend (6-month line chart)
  - Denial Reasons (grouped bar chart)
  - Policy Performance (grouped bar chart)

- **Information Panels**
  - Top Denial Policies (clickable)
  - Recent Denied Claims
  - AI Insights (gradient background)

- **Advanced Features**
  - Filter by view mode (Practice/Individual Provider/Comparison)
  - Time range filtering (30/60/90 days or custom)
  - Slide-in detail panel for policies
  - Real-time clock display
  - Responsive layout with fixed sidebar

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Router v6** - Navigation

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173 to view the app.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard/          # Dashboard-specific components
│   │   ├── MetricCard.jsx
│   │   ├── ClaimsTrendChart.jsx
│   │   ├── DenialReasonsChart.jsx
│   │   ├── PolicyPerformanceChart.jsx
│   │   ├── TopPoliciesPanel.jsx
│   │   ├── RecentDenialsPanel.jsx
│   │   └── AIInsightsPanel.jsx
│   ├── Layout/             # Layout components
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   └── DetailPanel.jsx
│   └── shared/             # Reusable components
│       ├── Button.jsx
│       ├── Select.jsx
│       └── Card.jsx
├── pages/
│   └── Dashboard.jsx       # Main dashboard page
├── data/                   # Mock data (JSON)
│   ├── claims.json         # 90 sample claims
│   ├── policies.json       # 10 policies
│   ├── providers.json      # 4 providers
│   ├── insights.json       # 5 AI insights
│   └── learningMarkers.json
├── hooks/
│   └── useLocalStorage.js  # LocalStorage hook
├── utils/
│   ├── calculations.js     # Data calculation functions
│   └── formatting.js       # Formatting utilities
├── context/
│   └── AppContext.jsx      # Global state management
├── App.jsx
├── main.jsx
└── index.css
```

## Data

The app uses realistic mock data stored in JSON files:

- **90 Claims** spanning last 6 months (85% approved, 12% denied, 3% pending)
- **10 Policies** covering various denial patterns
- **4 Providers** across different specialties
- **5 AI Insights** highlighting systematic issues

## Key Interactions

1. **View Mode Switching**: Toggle between Practice View and Individual Provider
2. **Time Range Filtering**: Last 30/60/90 days or custom date range
3. **Policy Details**: Click any policy in "Top Denial Policies" to see detail panel
4. **Charts**: Hover over charts for detailed tooltips
5. **Learning Impact**: Highlighted metric card showing Claim Lab test count

## Design System

### Colors
- Primary: Indigo (600/500/700)
- Secondary: Cyan (400/600)
- Success: Green (400/600)
- Error: Red (400/600)
- Gradient: Blue-to-indigo sidebar, cyan-to-indigo insights panel

### Typography
- Font: System font stack
- Headings: Semibold weight
- Body: Normal weight

### Components
- Cards: White background, gray-200 border, 8px radius
- Hover: Shadow-md transition
- Highlighted cards: Cyan-400 border with ring

## Future Phases

- **Phase 2**: Policy Analytics Screen
- **Phase 3**: Claim Search & Detail
- **Phase 4**: AI Insights Hub
- **Phase 5**: Claim Lab (Interactive Testing)
- **Phase 6**: ROI Dashboard

## Notes

- No backend required - pure frontend PoC
- Data persists in LocalStorage for learning markers
- Optimized for Chrome/Edge, Safari, and Firefox (latest 2 versions)
- Dashboard loads in < 500ms
- Filter updates in < 100ms

## License

Proprietary - For demonstration purposes only
