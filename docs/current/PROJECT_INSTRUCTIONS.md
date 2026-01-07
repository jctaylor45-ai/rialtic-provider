# Provider Portal - Project Instructions

**Version**: 1.0.0
**Last Updated**: January 7, 2026 at 14:40 UTC
**Status**: Active

---

## Table of Contents
1. [Setup & Development](#setup--development)
2. [Project Structure](#project-structure)
3. [Architecture & Patterns](#architecture--patterns)
4. [Adding Features](#adding-features)
5. [Working with Data](#working-with-data)
6. [Component Development](#component-development)
7. [Common Tasks](#common-tasks)
8. [Debugging & Troubleshooting](#debugging--troubleshooting)

---

## Setup & Development

### Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run generate   # Generate static site (if using SSG)
npm run preview    # Preview production build locally
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run code linter
npm run format     # Format code with Prettier
```

### Development Environment

- **Node Version**: Check `package.json` for dependencies (Nuxt 3.16.0+)
- **Browser**: Modern browsers with ES2020+ support
- **IDE**: VS Code recommended with Vue, TypeScript, and ESLint extensions
- **Data**: All data is served from `public/data/` JSON files (no backend needed)

---

## Project Structure

### Directory Organization

```
provider-portal/
├── pages/                    # Route pages (Nuxt auto-routing)
│   ├── index.vue            # Dashboard
│   ├── policies.vue         # Policy Analytics
│   ├── insights.vue         # Pattern Detection & Insights
│   ├── claim-lab.vue        # Interactive Claim Correction
│   ├── impact.vue           # Learning Impact & ROI
│   └── claims/
│       ├── index.vue        # Claims list
│       └── [id].vue         # Claim detail
│
├── components/              # Reusable Vue components
│   ├── Sidebar.vue          # Main navigation sidebar
│   ├── PatternCard.vue      # Pattern display card
│   ├── PatternDetailModal.vue
│   ├── PatternFilters.vue
│   ├── CodeIntelligenceModal.vue
│   ├── RecordActionModal.vue
│   └── [more components]
│
├── composables/             # Composition API hooks
│   ├── usePatterns.ts       # Pattern management utilities
│   ├── useAnalytics.ts      # Analytics & formatting utilities
│   ├── useCodeIntelligence.ts
│   ├── useTracking.ts       # Learning & event tracking
│   ├── useActions.ts        # Action logging
│   └── [more composables]
│
├── stores/                  # Pinia state management
│   ├── patterns.ts          # Pattern store
│   ├── analytics.ts         # Analytics calculations
│   ├── events.ts            # Event/learning marker store
│   ├── app.ts               # Global app state
│   └── [more stores]
│
├── types/                   # TypeScript type definitions
│   ├── enhancements.ts      # Pattern, evidence, improvement types
│   └── index.ts             # Other type exports
│
├── utils/                   # Utility functions
│   ├── analytics.ts         # Analytics helpers
│   ├── formatting.ts        # Format/transform helpers
│   └── [more utilities]
│
├── layouts/                 # Page layout components
│   └── default.vue          # Main layout with sidebar
│
├── public/
│   └── data/                # Mock data JSON files
│       ├── patterns.json
│       ├── claims.json
│       ├── policies.json
│       ├── insights.json
│       ├── learningMarkers.json
│       ├── learningEvents.json
│       ├── providers.json
│       └── codeIntelligence.json
│
├── app.vue                  # Root app component
├── nuxt.config.ts           # Nuxt configuration
├── tsconfig.json            # TypeScript configuration
├── uno.config.ts            # UnoCSS configuration
└── package.json
```

### Naming Conventions

**Files & Directories**
- PascalCase for components: `PatternCard.vue`, `CodeIntelligenceModal.vue`
- camelCase for composables: `usePatterns.ts`, `useAnalytics.ts`
- camelCase for utilities: `formatting.ts`, `analytics.ts`
- kebab-case for folders: `public/data/`

**Types & Interfaces**
- PascalCase: `Pattern`, `PatternScore`, `PatternAction`
- Union types suffix with Type: `PatternStatus`, `PatternTier`, `ActionType`
- Interfaces prefix noun: `PatternEvidence`, `PatternImprovement`

**Variables & Functions**
- camelCase for all variables and functions
- Prefix composable functions with `use`: `usePatterns()`, `useAnalytics()`
- Prefix private methods with underscore: `_calculateMetrics()`
- Use descriptive names: `denialRateReduction` not `drr`

---

## Architecture & Patterns

### Composables Pattern

Composables are reusable Vue 3 composition API hooks that encapsulate logic. Always extract utilities into composables:

```typescript
// composables/usePatterns.ts
export function usePatterns() {
  const patternsStore = usePatternsStore()
  
  // Public methods and state
  const getPatternColor = (tier: PatternTier) => { /* ... */ }
  const filterPatterns = (patterns: Pattern[]) => { /* ... */ }
  
  return {
    getPatternColor,
    filterPatterns,
    // ... more exports
  }
}

// In a component
<script setup lang="ts">
const { getPatternColor, filterPatterns } = usePatterns()
</script>
```

**When to create a composable:**
- Logic used in 2+ components
- Utility functions that interact with stores
- Reusable formatting or transformation logic
- Event tracking or analytics wrappers

### Store Pattern (Pinia)

Stores handle centralized state management. Use them for:
- Shared application state
- Data fetching and caching
- Complex state transformations
- Loading/error states

```typescript
// stores/patterns.ts
import { defineStore } from 'pinia'

export const usePatternsStore = defineStore('patterns', () => {
  const patterns = ref<Pattern[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions (mutations)
  async function fetchPatterns() {
    isLoading.value = true
    try {
      // Fetch logic
      patterns.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  return { patterns, isLoading, error, fetchPatterns }
})

// In components, always use the store directly
const patternsStore = usePatternsStore()
const patterns = computed(() => patternsStore.patterns)
```

### Component Structure

Follow this standard component structure:

```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Imports (in order: Vue, stores, composables, types, utils, components)
import { computed, ref } from 'vue'
import { usePatternsStore } from '~/stores/patterns'
import { usePatterns } from '~/composables/usePatterns'
import type { Pattern } from '~/types/enhancements'

// Props and emits
interface Props {
  pattern: Pattern
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [pattern: Pattern]
}>()

// Store and composables
const patternsStore = usePatternsStore()
const { getPatternColor } = usePatterns()

// Reactive state
const isOpen = ref(false)

// Computed properties
const displayColor = computed(() => getPatternColor(props.pattern.tier))

// Methods
const handleSelect = () => {
  emit('select', props.pattern)
}
</script>

<style scoped>
/* Scoped styles only */
</style>
```

### Data Flow Architecture

```
User Action → Component Method
    ↓
Action uses composable or store
    ↓
Store updates state (if needed)
    ↓
Store creates learning event
    ↓
Component computed properties update
    ↓
Template re-renders
```

---

## Adding Features

### Adding a New Page

1. **Create the page file** in `pages/`:
```vue
<!-- pages/new-feature.vue -->
<template>
  <div class="flex-1 overflow-auto p-8">
    <h1 class="text-2xl font-semibold">New Feature</h1>
    <!-- Content -->
  </div>
</template>

<script setup lang="ts">
// Page logic here
</script>
```

2. **The page is automatically routed** - accessible at `/new-feature`

3. **Add navigation** in `components/Sidebar.vue`:
```typescript
const navigationItems = [
  { label: 'Dashboard', icon: 'heroicons:home', to: '/' },
  { label: 'New Feature', icon: 'heroicons:icon-name', to: '/new-feature' },
  // ...
]
```

### Adding a New Component

1. **Create in `components/`** with PascalCase name
2. **Define props and emits** with TypeScript
3. **Use composables** for shared logic
4. **Scope all styles** with `<style scoped>`
5. **Export from component** - Nuxt auto-imports components

```vue
<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <button @click="$emit('action')">Do Something</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

withDefaults(defineProps<Props>(), {
  title: 'Default Title'
})

const emit = defineEmits<{
  action: []
}>()
</script>
```

### Adding a New Composable

```typescript
// composables/useNewFeature.ts
import { ref, computed } from 'vue'
import { useNewStore } from '~/stores/newstore'

export function useNewFeature() {
  const store = useNewStore()
  
  // Internal state (keep small, use stores for shared state)
  const localState = ref(false)
  
  // Public computed properties
  const derivedValue = computed(() => {
    return store.baseValue * 2
  })
  
  // Public methods
  const doSomething = (input: string) => {
    store.updateValue(input)
  }
  
  return {
    derivedValue,
    doSomething,
  }
}
```

### Adding a New Store

```typescript
// stores/newstore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNewStore = defineStore('newstore', () => {
  const baseValue = ref('')
  const items = ref<Item[]>([])
  const isLoading = ref(false)

  async function fetchItems() {
    isLoading.value = true
    try {
      // Fetch from public/data/ or API
      items.value = await $fetch('/data/items.json')
    } finally {
      isLoading.value = false
    }
  }

  function updateValue(newValue: string) {
    baseValue.value = newValue
  }

  return {
    baseValue,
    items,
    isLoading,
    fetchItems,
    updateValue,
  }
})
```

---

## Working with Data

### Data Sources

All data comes from JSON files in `public/data/`:

```
patterns.json      → Pattern library (15+ pattern types)
claims.json        → Claim records (100+)
policies.json      → Healthcare policies
insights.json      → Pre-computed insights
learningMarkers.json → User learning progress
learningEvents.json  → User interaction events
providers.json     → Provider network data
codeIntelligence.json → Medical coding reference
```

### Fetching Data

Data is loaded in stores using `$fetch`:

```typescript
// stores/patterns.ts
async function loadPatterns() {
  const response = await $fetch('/data/patterns.json')
  patterns.value = response.patterns
}
```

### Adding Mock Data

1. **Create/update JSON file** in `public/data/`
2. **Match TypeScript types** in `types/enhancements.ts`
3. **Load in corresponding store**
4. **Test in component** before committing

Example adding new insight type:

```json
// public/data/insights.json
{
  "insights": [
    {
      "id": "INS-001",
      "patternId": "PTN-001",
      "title": "Common Coding Mistake",
      "description": "...",
      "suggestedAction": "..."
    }
  ]
}
```

### Type-Safe Data Loading

Always define types and use them:

```typescript
import type { Pattern } from '~/types/enhancements'

const patternsStore = usePatternsStore()
const typedPatterns: Pattern[] = patternsStore.patterns // ✓ Type-safe
```

### Persistence with localStorage

Learning markers and user actions auto-persist to localStorage:

```typescript
// In composables/useTracking.ts - records are auto-saved
function recordLearningEvent(event: LearningEvent) {
  eventsStore.addEvent(event)
  // Store auto-saves to localStorage via Pinia persistence plugin
}
```

---

## Component Development

### Using Icons

Icons come from Iconify. Access them with the Icon component:

```vue
<Icon name="heroicons:chart-bar" class="w-5 h-5 text-primary-600" />
```

Available icon sets:
- `heroicons:*` - Hero Icons (primary set)
- `fluent:*` - Fluent Icons
- `ph:*` - Phosphor Icons

Find icons at: https://icones.js.org/

### Styling with UnoCSS

This project uses UnoCSS with Tailwind preset. Use utility classes:

```vue
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900">Title</h3>
  <p class="text-sm text-gray-600 mt-2">Description</p>
</div>
```

**Color Scheme:**
- Primary: `primary-50` → `primary-900` (indigo/purple)
- Status: `red-*` (critical), `green-*` (resolved), `yellow-*` (improving), `blue-*` (info)
- Neutral: `gray-*` (text, backgrounds)

### Common Patterns

**Loading State:**
```vue
<div v-if="store.isLoading" class="animate-spin">
  <Icon name="heroicons:arrow-path" />
</div>
<div v-else>
  <!-- Content -->
</div>
```

**Modal:**
```vue
<div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-lg p-6 max-w-md">
    <!-- Modal content -->
    <button @click="isOpen = false">Close</button>
  </div>
</div>
```

**Form Input:**
```vue
<input
  v-model="inputValue"
  type="text"
  placeholder="Enter value..."
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
```

**Card Grid:**
```vue
<div class="grid grid-cols-3 gap-6">
  <div v-for="item in items" :key="item.id" class="bg-white rounded-lg shadow-sm p-6">
    <!-- Card content -->
  </div>
</div>
```

---

## Common Tasks

### Task: Add a New Filter

1. **Add filter state** to page component:
```typescript
const filters = ref({
  status: 'all',
  tier: 'all',
})
```

2. **Update computed** to filter data:
```typescript
const filteredPatterns = computed(() => {
  return patternsStore.patterns.filter(p => {
    if (filters.value.status !== 'all' && p.status !== filters.value.status) return false
    if (filters.value.tier !== 'all' && p.tier !== filters.value.tier) return false
    return true
  })
})
```

3. **Add filter UI**:
```vue
<select v-model="filters.status" class="px-3 py-2 border rounded-lg">
  <option value="all">All Statuses</option>
  <option value="active">Active</option>
  <option value="resolved">Resolved</option>
</select>
```

### Task: Track a User Action

1. **Create action in composable**:
```typescript
const { recordAction } = useActions()

const handlePatternClick = (pattern: Pattern) => {
  recordAction({
    type: 'pattern-view',
    patternId: pattern.id,
    timestamp: new Date().toISOString(),
  })
}
```

2. **The action auto-saves** to localStorage via eventsStore

### Task: Calculate ROI Impact

Use the `useAnalytics` composable:

```typescript
const { calculateROI, formatCurrency } = useAnalytics()

const roiMetrics = computed(() => {
  return calculateROI({
    initialDenialRate: baselineMetrics.denialRate,
    currentDenialRate: currentMetrics.denialRate,
    totalClaimsCount: claims.length,
    avgClaimAmount: 500,
  })
})
```

### Task: Add Pattern Evidence

1. **Load claim data** from claims.json
2. **Link claims to pattern** via patternId
3. **Display in PatternDetailModal**:
```vue
<div v-for="evidence in pattern.evidence" :key="evidence.claimId">
  <div class="text-sm text-gray-600">
    Claim {{ evidence.claimId }} - {{ evidence.denialReason }}
  </div>
</div>
```

### Task: Create Learning Marker

When user completes a practice session:

```typescript
const { createLearningMarker } = useTracking()

const submitCorrectedClaim = async () => {
  const marker = {
    patternId: contextPattern.id,
    claimId: originalClaim.id,
    correctionsMade: editedClaim.lineItems,
    timestamp: new Date().toISOString(),
    sessionDuration: sessionTime,
  }
  
  createLearningMarker(marker)
  patternsStore.incrementPatternProgress(contextPattern.id)
}
```

---

## Debugging & Troubleshooting

### Common Issues

**Problem: Component not rendering**
- Check page is in `pages/` directory with correct case
- Verify Nuxt auto-import is working (check browser console)
- Ensure component imports are correct

**Problem: Store data not updating**
- Verify store action is being called
- Check localStorage has permission (dev tools → Application)
- Use Vue DevTools Pinia tab to inspect state

**Problem: Icons not showing**
- Verify icon name format: `heroicons:chart-bar`
- Check icon exists at https://icones.js.org/
- Ensure `@iconify-json/*` packages are installed

**Problem: Styles not applying**
- Check class names are UnoCSS-compatible
- Verify utility classes are spelled correctly
- Scoped styles use `<style scoped>` (case-sensitive)

### Debugging Tools

**Vue DevTools**
- Install Vue DevTools browser extension
- Inspect components in DevTools → Vue tab
- Check reactive state and computed properties

**Pinia DevTools**
- Access stores in DevTools → Pinia tab
- View state mutations in real-time
- Time-travel debug state changes

**Browser Console**
```typescript
// Check store state
console.log(usePatternsStore().patterns)

// Force re-fetch data
usePatternsStore().fetchPatterns()

// Check computed value
console.log(usePatterns().getPatternColor('high'))
```

**TypeScript Checking**
```bash
npm run typecheck  # Find type errors before runtime
```

### Performance Tips

1. **Use computed properties** instead of methods for reactive values
2. **Avoid inline object/array creation** in templates
3. **Use v-show** for frequently toggled elements (vs v-if)
4. **Lazy-load heavy components** with `defineAsyncComponent`
5. **Memoize expensive calculations** in composables

---

## Testing & Validation

### Type Safety

Always provide types:

```typescript
// ✗ Avoid
const patterns = ref([])

// ✓ Good
import type { Pattern } from '~/types/enhancements'
const patterns = ref<Pattern[]>([])
```

### Component Testing

Test components in isolation:

1. Import component in another page/component
2. Pass test props
3. Trigger interactions
4. Verify outputs

### Data Validation

Ensure mock data matches types:

```bash
npm run typecheck  # Will catch type mismatches
```

---

## Deployment & Build

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Build static site (if using SSG)
npm run generate
```

### Environment Considerations

- **localStorage**: Persists across sessions; used for learning markers
- **Public data files**: Served from `public/` directory
- **No backend**: Currently uses mock data only

---

## Quick Reference

| Task | Command | File |
|------|---------|------|
| Add page | Create `pages/name.vue` | `pages/name.vue` |
| Add component | Create `components/Name.vue` | `components/Name.vue` |
| Add composable | Create `composables/useName.ts` | `composables/useName.ts` |
| Add store | Create `stores/name.ts` | `stores/name.ts` |
| Add type | Update `types/enhancements.ts` | `types/enhancements.ts` |
| Add icon | Use `<Icon name="heroicons:name" />` | Template |
| Style element | Use UnoCSS classes | Template |
| Track action | Call `recordAction()` | Composable |
| Load data | Call store fetch method | Store/Composable |

---

## Resources

- [Nuxt 3 Documentation](https://nuxt.com)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia State Management](https://pinia.vuejs.org)
- [UnoCSS Docs](https://uno.css)
- [Iconify Icons](https://icones.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
