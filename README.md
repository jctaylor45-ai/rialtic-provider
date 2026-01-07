# Provider Portal

**Version**: 1.0.0
**Last Updated**: January 7, 2026 at 14:30 UTC
**Status**: Production-Ready MVP

---

## Overview

A healthcare provider-facing claims analytics portal that transforms claim denials into learning opportunities. Built with Nuxt 3, Vue 3, TypeScript, and Pinia.

### Key Value Proposition

- **Pattern Detection**: Identify systematic denial patterns across your claims
- **Interactive Learning**: Practice corrections in a safe sandbox (Claim Lab)
- **ROI Tracking**: Measure and demonstrate improvement over time
- **Actionable Insights**: Clear guidance on fixing root causes

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nuxt 3** | 3.16.0+ | Meta-framework |
| **Vue 3** | 3.5.x | UI framework |
| **TypeScript** | 5.7.x | Type safety |
| **Pinia** | 2.2.x | State management |
| **UnoCSS** | 0.64.x | Styling (Tailwind preset) |
| **Chart.js** | 4.x | Data visualization |

---

## Project Structure

```
provider-portal/
├── pages/                    # Route pages (Nuxt auto-routing)
│   ├── index.vue            # Dashboard with metrics
│   ├── policies.vue         # Policy analytics
│   ├── insights.vue         # Pattern detection
│   ├── claim-lab.vue        # Interactive correction sandbox
│   ├── impact.vue           # ROI dashboard
│   └── claims/
│       ├── index.vue        # Claims list
│       └── [id].vue         # Claim detail
├── components/              # Reusable Vue components
├── composables/             # Composition API hooks
├── stores/                  # Pinia state management
├── types/                   # TypeScript definitions
├── utils/                   # Utility functions
├── public/data/             # Mock JSON data
└── docs/                    # Documentation
    └── archive/             # Archived historical docs
```

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard with KPIs, trends, and drill-down navigation |
| `/claims` | Claims list with search, filter, and sort |
| `/claims/[id]` | Claim detail with line items and pattern context |
| `/policies` | Policy analytics with impact sorting |
| `/insights` | Active patterns with tier-based prioritization |
| `/claim-lab` | Interactive claim correction sandbox |
| `/impact` | ROI dashboard with provider/network views |

---

## Data

All data is served from JSON files in `public/data/`:

| File | Records | Purpose |
|------|---------|---------|
| `claims.json` | 106 | Claims spanning last 180 days |
| `patterns.json` | 15+ | Denial pattern library |
| `policies.json` | 20 | Payer policy database |
| `insights.json` | 5 | AI-generated insights |
| `learningMarkers.json` | 20 | Learning event records |
| `providers.json` | 5 | Provider metadata |
| `codeIntelligence.json` | 10+ | Medical coding reference |

---

## Documentation

```
docs/
├── current/                 # Active documentation
│   ├── INDEX.md            # Documentation index
│   ├── MEMORY.md           # Project context & status
│   ├── PROJECT_INSTRUCTIONS.md  # Developer guide
│   └── .claude-code-rules.md    # AI behavior rules
└── archive/                 # Superseded documentation
    └── ARCHIVE_INDEX.md    # Archive manifest
```

| Document | Location | Purpose |
|----------|----------|---------|
| `README.md` | Root | Master document - project overview |
| `MEMORY.md` | docs/current/ | Comprehensive project context |
| `PROJECT_INSTRUCTIONS.md` | docs/current/ | Developer guide and patterns |
| `.claude-code-rules.md` | docs/current/ | AI assistant rules |

---

## Recent Changes

### v1.0.0 (January 7, 2026)
- Added sortable columns to all data tables
- Added drill-down navigation from dashboard metrics
- Fixed double percentage symbol display issue
- Enhanced claim header with full field set
- Enhanced line items with rendering provider details
- Implemented 30/60/90 day time range filter on dashboard
- Updated claims data with 180-day date range
- Consolidated and versioned all documentation

---

## License

Proprietary - For demonstration purposes only
