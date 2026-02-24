# Provider Portal — Development Guidelines for Claude Code

**These rules are mandatory. Every rule exists because of a real bug, wasted time, or architectural regression. Do not skip steps to save time — shortcuts create debt that costs 10× more to fix later.**

---

## Table of Contents

1. [BEFORE YOU WRITE ANY CODE](#1-before-you-write-any-code)
2. [No Assumptions — Verify Everything](#2-no-assumptions--verify-everything)
3. [No Tech Debt Without Approval](#3-no-tech-debt-without-approval)
4. [True Modular Architecture](#4-true-modular-architecture)
5. [Dependency Direction Rules](#5-dependency-direction-rules)
6. [Project Structure](#6-project-structure)
7. [Module Boundaries](#7-module-boundaries)
8. [Type Safety](#8-type-safety)
9. [Styling Standards (CRITICAL)](#9-styling-standards-critical)
10. [Component Development](#10-component-development)
11. [Composables Pattern](#11-composables-pattern)
12. [Store Pattern (Pinia)](#12-store-pattern-pinia)
13. [Data & Mock Data](#13-data--mock-data)
14. [Error Handling](#14-error-handling)
15. [Healthcare Domain Rules](#15-healthcare-domain-rules)
16. [File Size Limits](#16-file-size-limits)
17. [Verify Your Work](#17-verify-your-work)
18. [Definition of Done](#18-definition-of-done)
19. [Common Patterns](#19-common-patterns)
20. [Quick Reference Card](#20-quick-reference-card)

---

## 1. BEFORE YOU WRITE ANY CODE

**This is the most important section. Read it every time.**

Before implementing ANY feature, fix, or modification:

### Step 1: Understand the Data Model

```bash
# Look up ACTUAL type definitions — NEVER guess field names
grep -r "interface\|type " types/ --include="*.ts"
# Check what the store provides
cat stores/patterns.ts
# Check the mock data shape
cat public/data/patterns.json | head -50
```

**NEVER assume a field exists on a type.** If you need `pattern.recoveryRate`, search for it first. If it doesn't exist, ask — don't invent it.

### Step 2: Find Existing Implementations

```bash
# Search for similar functionality that already exists
grep -r "functionName\|featureName" composables/ stores/ utils/ --include="*.ts"
# Search for the component you're about to create — it may already exist
find components/ -name "*keyword*" -type f
# Search for how data is currently used
grep -r "usePatterns\|patternsStore" pages/ components/ --include="*.vue" --include="*.ts" -l
```

**If a working implementation exists, USE IT. Do not create a new version.**

### Step 3: Verify the Data Contract

Before writing UI code that consumes a store or composable:
1. Read the store to see what it actually returns
2. Read the composable to see what methods/computed values it exposes
3. Verify the field names match between the data source and your UI code

```bash
# Find the store
cat stores/patterns.ts
# Find the composable
cat composables/usePatterns.ts
# Check the type definitions
cat types/enhancements.ts
```

### Step 4: Read Relevant Documentation

```bash
# Check current implementation status
cat docs/current/MEMORY.md
# Check styling rules
cat docs/current/STYLE_GUIDE.md
# Check coding rules
cat docs/current/.claude-code-rules.md
```

### Step 5: Plan Before Coding

For any task involving more than a single file change:
1. List every file that needs to change
2. Identify which existing composables/components to reuse
3. Identify the dependency direction (see Section 5)
4. Only then start coding

### What Happens When You Skip These Steps

You produce code that:
- Uses `gray-500` instead of `neutral-500` (wrong design tokens)
- References `pattern.status` when the actual field is `pattern.trend`
- Creates a new utility when `useAnalytics()` already provides it
- Breaks the composables pattern by putting business logic in components

**Every assumption you skip verifying is a bug waiting to happen.**

---

## 2. No Assumptions — Verify Everything

### Data Fields

| Instead of... | Do this... |
|---|---|
| Assuming a type has a field | `grep -r "fieldName" types/enhancements.ts` |
| Assuming JSON data shape | `cat public/data/patterns.json \| head -50` |
| Assuming a computed value exists | Read the store or composable that should provide it |
| Assuming a status enum value | Search for the enum/union type definition |

### Existing Code

| Instead of... | Do this... |
|---|---|
| Writing a new formatting function | `grep -r "formatCurrency\|formatPercent" composables/ utils/` |
| Creating a new modal component | `find components/ -name "*Modal*"` and check if one exists |
| Writing a new utility | Search `utils/` and `composables/` for existing implementations |
| Creating a new filter | Check if `PatternFilters.vue` or similar already handles it |

### Store & Composable Returns

| Instead of... | Do this... |
|---|---|
| Assuming what a store provides | Read the store's `return` statement |
| Assuming a composable method exists | Read the composable's exports |
| Assuming reactive state shape | Check the `ref()` and `computed()` definitions |

### Rule: When in Doubt, Read the Code. When Not in Doubt, Read the Code Anyway.

---

## 3. No Tech Debt Without Approval

### Rule: Always Apply Fixes Consistently Across the Codebase

When fixing a bug, implementing a pattern, or making any change that affects multiple files:

1. **Search the codebase** for ALL instances of the pattern being fixed
2. **Fix ALL instances** in a single effort, not just the one you're working on
3. **If fixing all instances is not feasible**, ASK before proceeding with a partial fix

### What Counts as Tech Debt

- Fixing a bug in one page but leaving the same bug in 5 other pages
- Using `neutral-500` in new code while old code still uses `gray-500`
- Creating a one-off helper instead of using/extending a composable
- Duplicating a component instead of extracting a reusable one
- Adding inline business logic when it belongs in a store or composable

### Before Creating Any One-Off Solution, STOP and Ask:

- "I found this pattern in X files. Should I fix all of them now?"
- "A reusable composable for this already exists. Should I use it or is there a reason this needs to be different?"
- "The proper fix requires changes to Y files. Full fix or just this file?"

---

## 4. True Modular Architecture

### What Modular Architecture IS

A component/composable is modular when:
1. **It exists in exactly ONE place** — no copies or near-copies anywhere
2. **It is imported everywhere it's needed** — not recreated
3. **Changing it in one place changes behavior everywhere**
4. **It has a clear, single responsibility**
5. **It is independently testable**

### What Modular Architecture IS NOT

❌ **Creating identical logic in different locations:**
```
# WRONG — formatting logic duplicated
pages/insights.vue         # inline formatCurrency()
pages/impact.vue           # different inline formatCurrency()
```

❌ **Recreating composable logic in a component:**
```typescript
// WRONG — This function already exists in usePatterns()
function getPatternColor(tier: string) {
  if (tier === 'critical') return 'red-500'  // Also wrong color token!
}
```

❌ **Putting business logic in page components:**
```typescript
// WRONG — ROI calculation belongs in useAnalytics() or a store
const roi = computed(() => {
  return claims.filter(c => c.status === 'denied').reduce(...)
})
```

### How to Do It Right

✅ **One composable, imported everywhere:**
```typescript
// composables/usePatterns.ts  ← THE composable
export function usePatterns() {
  const getPatternColor = (tier: PatternTier) => { /* ... */ }
  return { getPatternColor }
}

// Any component that needs it  ← Import it
const { getPatternColor } = usePatterns()
```

✅ **One utility function, imported everywhere:**
```typescript
// utils/formatting.ts  ← THE function
export function formatCurrency(amount: number): string { /* ... */ }

// Everywhere that needs currency display  ← Import it (auto-imported by Nuxt)
const display = formatCurrency(pattern.financialImpact)
```

### The Duplication Check

Before creating ANY new component, function, or composable:

```bash
# Is there already a component that does this?
grep -r "ComponentName\|similar-name" components/ --include="*.vue" -l

# Is there already a function that does this?
grep -r "functionName\|similarFunction" composables/ utils/ --include="*.ts" -l

# Is there already a modal for this domain?
find components/ -name "*Modal*" -o -name "*modal*"
```

**If something similar exists: extend it, parameterize it, or import it. Do NOT recreate it.**

---

## 5. Dependency Direction Rules

Dependencies flow ONE direction. Violations create tangled, untestable code.

```
┌─────────────────────────────────────────────────┐
│  Pages (pages/*.vue)                            │
│  ↓ imports from                                 │
├─────────────────────────────────────────────────┤
│  Components (components/*.vue)                  │
│  ↓ imports from                                 │
├─────────────────────────────────────────────────┤
│  Composables (composables/use*.ts)              │
│  ↓ imports from                                 │
├─────────────────────────────────────────────────┤
│  Stores (stores/*.ts)                           │
│  ↓ imports from                                 │
├─────────────────────────────────────────────────┤
│  Data (public/data/*.json via $fetch)           │
└─────────────────────────────────────────────────┘

Cross-cutting (importable by any layer):
  - Types (types/*.ts)
  - Utils (utils/*.ts)
```

### Allowed Imports

| Layer | May Import From |
|---|---|
| **Pages** | Components, Composables, Stores, Types, Utils |
| **Components** | Composables, Types, Utils. **NEVER** Stores directly (use composables as intermediary when practical) |
| **Composables** | Stores, Types, Utils. **NEVER** Components |
| **Stores** | Types, Utils, `$fetch` for data loading. **NEVER** Components or Composables |
| **Utils** | Types only. **NEVER** Stores, Composables, or Components |

### The Role of Each Layer

| Layer | Responsibility | Does NOT do |
|---|---|---|
| **Pages** | Route handling, layout, composing components | Complex business logic |
| **Components** | UI rendering, user interaction, emitting events | Data fetching, complex calculations |
| **Composables** | Reusable logic, store orchestration, formatting | Rendering, data persistence |
| **Stores** | State management, data loading, caching | Rendering, routing |
| **Utils** | Pure functions, formatting, calculations | Side effects, state management |

---

## 6. Project Structure

```
provider-portal/
├── pages/                       # Route pages (Nuxt auto-routing)
│   ├── index.vue               # Dashboard — KPIs, trends, navigation
│   ├── policies.vue            # Policy Analytics — policy library, impact sorting
│   ├── insights.vue            # Pattern Detection — tier-based prioritization
│   ├── claim-lab.vue           # Claim Lab — interactive correction sandbox
│   ├── impact.vue              # Impact/ROI — engagement-to-outcome correlation
│   └── claims/
│       ├── index.vue           # Claims list — search, filter, sort
│       └── [id].vue            # Claim detail — line items, pattern context
│
├── components/                  # Reusable Vue components
│   ├── Sidebar.vue             # Main navigation sidebar
│   ├── PatternCard.vue         # Pattern display card
│   ├── PatternDetailModal.vue  # Pattern detail overlay
│   ├── PatternFilters.vue      # Pattern filtering controls
│   ├── CodeIntelligenceModal.vue
│   ├── RecordActionModal.vue
│   └── [domain-specific components]
│
├── composables/                 # Composition API hooks
│   ├── usePatterns.ts          # Pattern utilities (colors, filtering, formatting)
│   ├── useAnalytics.ts         # Analytics & ROI calculations
│   ├── useCodeIntelligence.ts  # Medical coding reference lookups
│   ├── useTracking.ts          # Learning marker & event tracking
│   └── useActions.ts           # Action logging
│
├── stores/                      # Pinia state management
│   ├── app.ts                  # Global app state, claims loading
│   ├── patterns.ts             # Pattern library state
│   ├── analytics.ts            # Analytics calculations, code intelligence
│   └── events.ts               # Learning events & markers
│
├── types/                       # TypeScript type definitions
│   ├── enhancements.ts         # Core types: Pattern, Evidence, Improvement
│   └── index.ts                # Additional type exports
│
├── utils/                       # Pure utility functions
│   ├── analytics.ts            # Analytics helpers
│   └── formatting.ts           # Format/transform helpers
│
├── layouts/
│   └── default.vue             # Main layout with sidebar
│
├── public/data/                 # Mock JSON data
│   ├── claims.json             # 106+ claims spanning 180 days
│   ├── patterns.json           # 15+ denial pattern types
│   ├── policies.json           # 20 payer policies
│   ├── insights.json           # Pre-computed insights
│   ├── learningMarkers.json    # Learning progress records
│   ├── learningEvents.json     # User interaction events
│   ├── providers.json          # Provider metadata
│   └── codeIntelligence.json   # Medical coding reference
│
├── docs/
│   ├── current/                # Active documentation
│   │   ├── MEMORY.md           # Current implementation status
│   │   ├── STYLE_GUIDE.md      # UI/UX design standards
│   │   ├── .claude-code-rules.md
│   │   └── PROJECT_INSTRUCTIONS.md
│   └── archive/                # Outdated docs (never reference these)
│
├── app.vue                      # Root app component
├── nuxt.config.ts               # Nuxt configuration (SPA mode, no SSR)
├── uno.config.ts                # UnoCSS config — Rialtic design tokens
├── vitest.config.ts             # Test configuration
├── tsconfig.json
└── package.json
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase `.vue` | `PatternCard.vue` |
| Composables | camelCase `use*.ts` | `usePatterns.ts` |
| Stores | camelCase `.ts` | `patterns.ts` |
| Utils | camelCase `.ts` | `formatting.ts` |
| Types/Interfaces | PascalCase | `Pattern`, `PatternTier` |
| Pages | kebab-case `.vue` | `claim-lab.vue` |
| Data files | camelCase `.json` | `learningMarkers.json` |
| Variables/Functions | camelCase | `denialRateReduction` not `drr` |
| Composable functions | Prefix `use` | `usePatterns()`, `useAnalytics()` |

---

## 7. Module Boundaries

### Rule: Use Nuxt Auto-Imports

Nuxt auto-imports components, composables, and utils. Do NOT add manual imports for these:

```typescript
// ✅ CORRECT — Nuxt auto-imports composables
const { getPatternColor } = usePatterns()

// ❌ UNNECESSARY — Don't manually import auto-imported items
import { usePatterns } from '~/composables/usePatterns'
```

### Exceptions Where Manual Import IS Required

- Types: `import type { Pattern } from '~/types/enhancements'`
- Store access: `import { usePatternsStore } from '~/stores/patterns'`
- Third-party libraries

### Adding New Components

1. Create the component file in `components/`
2. It's automatically available in all templates (Nuxt auto-import)
3. Use PascalCase for the filename — it becomes the component name

---

## 8. Type Safety

### Rule: NEVER Use `any`

```typescript
// ❌ NEVER
const patterns: any[] = []
function processData(data: any) { ... }

// ✅ ALWAYS
import type { Pattern } from '~/types/enhancements'
const patterns = ref<Pattern[]>([])
function processData(data: Pattern) { ... }
```

### Typing Reactive State

```typescript
// ❌ Avoid — loses type information
const patterns = ref([])

// ✅ Good — explicit type
const patterns = ref<Pattern[]>([])
const selectedPattern = ref<Pattern | null>(null)
```

### Typing Composable Returns

```typescript
// Always type composable return values for clarity
export function usePatterns() {
  const getPatternColor = (tier: PatternTier): string => { /* ... */ }
  const filterPatterns = (patterns: Pattern[], filters: FilterState): Pattern[] => { /* ... */ }

  return { getPatternColor, filterPatterns }
}
```

### Typing Emits and Props

```typescript
// ✅ Use TypeScript interfaces for props
interface Props {
  pattern: Pattern
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

// ✅ Type emits
const emit = defineEmits<{
  select: [pattern: Pattern]
  dismiss: []
}>()
```

---

## 9. Styling Standards (CRITICAL)

### Rialtic Design System Color Tokens

This project uses the Rialtic design system. Colors are defined in `uno.config.ts`. **NEVER use raw Tailwind colors.**

### PROHIBITED Colors → Required Replacements

| ❌ NEVER USE | ✅ USE INSTEAD | Notes |
|---|---|---|
| `gray-*` | `neutral-*` | All grays use Rialtic neutral palette |
| `green-*` | `success-*` | Success states, resolved items |
| `red-*` | `error-*` | Error states, critical tier |
| `blue-*` | `secondary-*` or `primary-*` | Info states, links, moderate tier |
| `indigo-*` | `primary-*` | Primary brand color |
| `yellow-*` | `warning-*` | Warning states, significant tier |
| `purple-*` | `primary-*` | Use primary palette |

### Color Token Reference

```
primary-*     → Indigo/purple brand colors (50–900)
secondary-*   → Cyan/blue accent colors (50–900)
tertiary-*    → Teal accent colors (50–900)
neutral-*     → Gray scale (50–900)
success-*     → Green (50–900)
warning-*     → Yellow/amber (50–900)
error-*       → Red/pink (100, 300, 500, 700)
surface       → White background
surface-bg    → Light gray background (#F5F6F8)
```

### Pattern Tier Color Mapping

| Tier | Background | Text | Border |
|---|---|---|---|
| Critical | `error-light` / `error-100` | `error-700` | `error-500` |
| Significant | `warning-50` / `warning-100` | `warning-700` / `warning-800` | `warning-400` |
| Moderate | `secondary-50` | `secondary-700` / `secondary-800` | `secondary-400` |
| Minor | `neutral-50` / `neutral-100` | `neutral-700` | `neutral-300` |

### Status Color Coding

| Status | Color Token | Usage |
|---|---|---|
| Critical / Error | `error-*` | Critical patterns, failed validations, denied claims |
| Warning / In Progress | `warning-*` | Significant patterns, pending items, improving trends |
| Success / Resolved | `success-*` | Resolved patterns, successful corrections, approved claims |
| Info / Neutral | `secondary-*` | Moderate patterns, informational items |
| Inactive / Disabled | `neutral-*` | Disabled actions, secondary text, minor patterns |

### Component Shortcuts (from `uno.config.ts`)

Use these instead of rebuilding styles:

```
btn              → Base button styles
btn-primary      → Primary action button
btn-outlined     → Outlined/secondary button
btn-text         → Text-only button/link
card             → Card container (bg-surface shadow rounded-lg)
form-input       → Standard form input styling
form-input-error → Error state form input
checkbox         → Styled checkbox
```

### Typography Shortcuts

```
h1, h2, h3, h4  → Heading styles
body-1           → Standard body text
body-2           → Smaller body text
```

### Icons

Use **Heroicons** as the primary icon set:

```vue
<Icon name="heroicons:chart-bar" class="w-5 h-5 text-primary-600" />
```

Find icons at: https://icones.js.org/

### Before Writing Any Styling

```bash
# Check if a shortcut already exists
grep -r "shortcut-name\|class-pattern" uno.config.ts
# Check STYLE_GUIDE for guidance
cat docs/current/STYLE_GUIDE.md
```

---

## 10. Component Development

### Standard Component Structure

Follow this order in every component:

```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// 1. Type imports
import type { Pattern } from '~/types/enhancements'

// 2. Props and emits
interface Props {
  pattern: Pattern
}
const props = defineProps<Props>()
const emit = defineEmits<{ select: [pattern: Pattern] }>()

// 3. Composables (auto-imported)
const { getPatternColor } = usePatterns()

// 4. Reactive state
const isOpen = ref(false)

// 5. Computed properties
const displayColor = computed(() => getPatternColor(props.pattern.tier))

// 6. Methods
const handleSelect = () => emit('select', props.pattern)
</script>

<style scoped>
/* Scoped styles only — prefer UnoCSS classes in template */
</style>
```

### Common UI Patterns

**Loading State:**
```vue
<div v-if="store.isLoading" class="flex items-center justify-center p-8">
  <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
</div>
<div v-else><!-- Content --></div>
```

**Empty State:**
```vue
<div v-if="!items.length" class="text-center py-12">
  <Icon name="heroicons:inbox" class="w-12 h-12 text-neutral-300 mx-auto mb-4" />
  <p class="text-neutral-600">No patterns found matching your filters.</p>
</div>
```

**Card Grid:**
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div v-for="item in items" :key="item.id" class="card p-6">
    <!-- Card content -->
  </div>
</div>
```

**Modal:**
```vue
<div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-surface rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
    <!-- Modal content -->
    <button @click="isOpen = false" class="btn-outlined">Close</button>
  </div>
</div>
```

---

## 11. Composables Pattern

### When to Create a Composable

- Logic used in 2+ components
- Utility functions that interact with stores
- Reusable formatting or transformation logic
- Event tracking or analytics wrappers

### Composable Structure

```typescript
// composables/useNewFeature.ts
import type { SomeType } from '~/types/enhancements'

export function useNewFeature() {
  const store = useSomeStore()

  // Internal state (keep small, use stores for shared state)
  const localState = ref(false)

  // Public computed properties
  const derivedValue = computed(() => store.baseValue * 2)

  // Public methods
  const doSomething = (input: SomeType) => {
    store.updateValue(input)
  }

  return {
    derivedValue,
    doSomething,
  }
}
```

### Existing Composables — ALWAYS Check Before Creating New Ones

| Composable | Provides |
|---|---|
| `usePatterns()` | Pattern colors, filtering, tier logic, formatting |
| `useAnalytics()` | ROI calculations, currency/percent formatting, metrics |
| `useTracking()` | Learning marker creation, event recording |
| `useActions()` | Action logging for user interactions |
| `useCodeIntelligence()` | Medical code lookups, CPT/HCPCS reference |

---

## 12. Store Pattern (Pinia)

### Store Structure

```typescript
// stores/newstore.ts
import { defineStore } from 'pinia'

export const useNewStore = defineStore('newstore', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchItems() {
    isLoading.value = true
    error.value = null
    try {
      items.value = await $fetch('/data/items.json')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load items'
    } finally {
      isLoading.value = false
    }
  }

  // Getters (computed)
  const activeItems = computed(() => items.value.filter(i => i.status === 'active'))

  return { items, isLoading, error, fetchItems, activeItems }
})
```

### Store Rules

1. **Always use Composition API style** (`setup` function syntax)
2. **Always handle loading and error states**
3. **Load data via `$fetch('/data/*.json')`** — data comes from `public/data/`
4. **Persist user actions to localStorage** via Pinia persistence when needed

---

## 13. Data & Mock Data

### Data Sources

All data comes from JSON files in `public/data/`. There is no backend.

| File | Purpose |
|---|---|
| `claims.json` | Claim records with line-level details |
| `patterns.json` | Denial pattern library with tier classifications |
| `policies.json` | Healthcare payer policies |
| `insights.json` | Pre-computed pattern insights |
| `learningMarkers.json` | User learning progress records |
| `learningEvents.json` | User interaction event stream |
| `providers.json` | Provider metadata (NPI, specialty) |
| `codeIntelligence.json` | Medical coding reference (CPT, HCPCS, ICD-10) |

### Adding/Modifying Mock Data

1. **Match TypeScript types** in `types/enhancements.ts`
2. **Create/update JSON** in `public/data/`
3. **Load in corresponding store** via `$fetch`
4. **Ensure data tells an ROI story** — mock data should demonstrate correlation between engagement and improvement

### Healthcare Data Principles

- **Claim lines are the unit of evaluation**, not entire claims
- Every denied claim line should link to a pattern
- Recovery status must distinguish "recoverable" from "fixed at root cause"
- Provider improvement should correlate with portal engagement
- Use realistic CPT/HCPCS codes and modifier scenarios

---

## 14. Error Handling

### Rule: NEVER Silently Swallow Errors

```typescript
// ❌ CATASTROPHICALLY WRONG
try {
  await store.fetchPatterns()
} catch (error) {
  console.error('Error:', error)
  // User never knows something failed
}

// ✅ CORRECT — Error propagates to UI
async function fetchPatterns() {
  isLoading.value = true
  error.value = null
  try {
    patterns.value = await $fetch('/data/patterns.json')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load patterns'
    throw e // Re-throw if caller needs to know
  } finally {
    isLoading.value = false
  }
}
```

### Always Show User Feedback

```vue
<!-- Error state in template -->
<div v-if="store.error" class="p-4 rounded-lg bg-error-light text-error-700">
  <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 inline mr-2" />
  {{ store.error }}
</div>
```

---

## 15. Healthcare Domain Rules

### Terminology Accuracy

These terms have specific meanings in this product. Use them correctly:

| Term | Definition | ❌ Don't Confuse With |
|---|---|---|
| **Sticky Denial** | Denial that is upheld — real savings | "Good denial" |
| **Churn Denial** | Denial overturned on appeal — admin waste | "Bad denial" |
| **Claim Line** | Individual service on a claim (unit of evaluation) | "Claim" (which has multiple lines) |
| **Pattern** | Systematic denial issue across multiple claims | "Individual denial reason" |
| **Learning Marker** | Record of interactive learning behavior | "Page view" or "click" |
| **Fix It Once** | Systematic fix addressing root cause | "Fix this claim" |
| **Recovery Status** | Whether denied amount can be recovered | "Appeal status" |

### Pattern Tier System

Patterns are classified by financial impact share:

| Tier | Share of Denied $ | Priority |
|---|---|---|
| Critical | Top 50% | Immediate action required |
| Significant | Next 25% | High priority |
| Moderate | Next 15% | Medium priority |
| Minor | Remaining 10% | Low priority |

### ROI Framing

Always frame ROI as **concrete dollar recovery**, not abstract percentages:
- ✅ "You're now collecting $12,800 more per month"
- ❌ "Your denial rate improved by 2.3%"

Administrative cost avoidance ($300–700 per appeal avoided) is often more compelling than denial savings.

---

## 16. File Size Limits

### Rule: No Component File Over 300 Lines

When a component exceeds 300 lines, extract:

**For page components** — extract sub-components:
```
pages/insights.vue (main file, ~200 lines)
components/
├── PatternCard.vue
├── PatternFilters.vue
└── PatternDetailModal.vue
```

**For complex components** — extract sections:
```
components/
├── ClaimDetail.vue (main, ~200 lines)
├── ClaimDetailLines.vue (line items section)
└── ClaimDetailActions.vue (action buttons)
```

---

## 17. Verify Your Work

### After EVERY Change

```bash
# 1. Type check — catches type errors, missing fields, wrong imports
npx vue-tsc --noEmit

# 2. Verify no prohibited colors were introduced
grep -rn "text-gray-\|bg-gray-\|border-gray-\|text-green-\|bg-green-\|text-red-\|bg-red-\|text-blue-\|bg-blue-\|text-indigo-\|bg-indigo-\|text-yellow-\|bg-yellow-" pages/ components/ layouts/ --include="*.vue"

# 3. Verify no duplicate implementations
grep -r "NewFunctionName" composables/ utils/ --include="*.ts"

# 4. Build check (if significant changes)
npm run build
```

### After Creating a New Component

```bash
# Verify it uses correct color tokens
grep -n "gray-\|green-\|red-\|blue-\|indigo-\|yellow-" components/NewComponent.vue

# Verify it follows the component structure (template, script setup, scoped style)
head -5 components/NewComponent.vue
```

### After Creating a New Composable

```bash
# Verify it doesn't duplicate existing functionality
grep -r "functionName" composables/ --include="*.ts"

# Verify it uses proper types
grep "any" composables/useNewFeature.ts
```

---

## 18. Definition of Done

A task is DONE when ALL of the following are true:

- [ ] **Type check passes**: `npx vue-tsc --noEmit`
- [ ] **No `any` types** in new or modified code
- [ ] **No prohibited color tokens** (gray, green, red, blue, indigo, yellow)
- [ ] **Rialtic design tokens used** (primary, secondary, neutral, success, warning, error)
- [ ] **No duplicate implementations** — searched codebase first
- [ ] **Existing composables reused** where applicable
- [ ] **Component structure followed** (template → script setup → scoped style)
- [ ] **Types defined** for all props, emits, and reactive state
- [ ] **Error states handled** — loading and error UI in place
- [ ] **Field names verified** against `types/enhancements.ts` and JSON data
- [ ] **File size under 300 lines** — split if necessary
- [ ] **Healthcare terminology accurate** (see Section 15)
- [ ] **ROI framed as dollar amounts** where applicable
- [ ] **Committed and pushed** with descriptive message

---

## 19. Common Patterns

### Creating a New Page

1. Create `pages/new-feature.vue`
2. Add navigation in `components/Sidebar.vue`
3. Use existing composables for data access
4. Follow component structure (Section 10)
5. Use Rialtic color tokens (Section 9)

### Adding a New Filter

1. Add filter state to page: `const filters = ref({ status: 'all', tier: 'all' })`
2. Create computed for filtered data
3. Add filter UI using `form-input` shortcut or `<select>`
4. Check if `PatternFilters.vue` can be extended instead of creating new

### Tracking a User Action

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

### Calculating ROI Impact

```typescript
const { calculateROI, formatCurrency } = useAnalytics()

const roiMetrics = computed(() => calculateROI({
  initialDenialRate: baselineMetrics.denialRate,
  currentDenialRate: currentMetrics.denialRate,
  totalClaimsCount: claims.length,
  avgClaimAmount: 500,
}))
```

---

## 20. Quick Reference Card

| Rule | Summary |
|---|---|
| **Before You Code** | Search codebase, verify field names, read existing implementations |
| **No Assumptions** | Look up every type, field name, and composable method |
| **No Tech Debt** | Fix all instances of a pattern, not just one |
| **True Modularity** | One composable/component, one location, imported everywhere |
| **Dependency Direction** | Pages → Components → Composables → Stores → Data |
| **Type Safety** | NEVER use `any` — use proper types from `types/enhancements.ts` |
| **Color Tokens** | NEVER `gray/green/red/blue/indigo/yellow` → ALWAYS `neutral/success/error/secondary/primary/warning` |
| **Component Structure** | template → script setup → scoped style |
| **Composables First** | Check existing composables before writing new logic |
| **Error Handling** | Never silently swallow errors; show user feedback |
| **Healthcare Terms** | Claim lines (not claims), sticky vs churn, patterns (not individual denials) |
| **ROI Framing** | Dollar amounts, not percentages |
| **File Size** | No file over 300 lines |
| **Verify** | `npx vue-tsc --noEmit` + check prohibited colors + check duplicates |

---

## Related Documentation

| Document | Location | Purpose |
|---|---|---|
| **MEMORY.md** | `docs/current/MEMORY.md` | Current implementation status |
| **STYLE_GUIDE.md** | `docs/current/STYLE_GUIDE.md` | UI/UX design standards |
| **PROJECT_INSTRUCTIONS.md** | `docs/current/PROJECT_INSTRUCTIONS.md` | Developer patterns & setup |
| **.claude-code-rules.md** | `docs/current/.claude-code-rules.md` | Auto-commit, documentation standards |
| **Product Spec** | Project Knowledge | Comprehensive product specification |
| **Feature Specs** | Project Knowledge | Detailed feature specifications |