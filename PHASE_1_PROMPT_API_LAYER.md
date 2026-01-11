# 🚀 Claude Code: Phase 1 - API Layer

**Copy everything below** and paste into Claude Code in VS Code.

---

# Phase 1: Build Database-Backed API Layer

## Context

Phase 0 is complete - you have continuous mock data flowing into the database. Now replace all hardcoded JSON data loads with database queries. After this phase, the dashboard will read live data instead of static files.

**Timeline**: 3 days
**Deliverable**: Dashboard reads from `/api/v1/claims`, `/api/v1/patterns`, `/api/v1/policies` instead of JSON files

## Phase 1 Responsibilities

1. Create 8 API endpoints to query generated data
2. Replace Pinia store `$fetch` calls to use database instead of JSON
3. Update components to use new endpoints
4. Add error handling and fallbacks
5. Ensure response times < 500ms

## Day 1: Core API Endpoints

### Create `server/api/v1/claims/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 100
    const offset = parseInt(query.offset as string) || 0
    const status = query.status as string | undefined
    const startDate = query.startDate as string | undefined
    const endDate = query.endDate as string | undefined

    let whereConditions: any[] = []

    if (status) {
      whereConditions.push(eq(claims.status, status))
    }

    if (startDate) {
      whereConditions.push(gte(claims.dateOfService, startDate))
    }

    if (endDate) {
      whereConditions.push(lte(claims.dateOfService, endDate))
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const claimsList = await db
      .select()
      .from(claims)
      .where(where)
      .orderBy(desc(claims.dateOfService))
      .limit(limit)
      .offset(offset)

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(claims)
      .where(where)

    return {
      data: claimsList,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount[0]?.count || 0)
      }
    }
  } catch (error) {
    console.error('Claims endpoint error:', error)
    return { error: 'Failed to fetch claims' }
  }
})
```

### Create `server/api/v1/claims/summary.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { claims } from '~/server/database/schema'
import { sql, count, eq, sum } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Total claims
    const totalClaims = await db
      .select({ count: count() })
      .from(claims)

    // Denied claims
    const deniedClaims = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.status, 'denied'))

    // Billed amount
    const billedTotal = await db
      .select({ total: sum(claims.billedAmount) })
      .from(claims)

    // Paid amount
    const paidTotal = await db
      .select({ total: sum(claims.paidAmount) })
      .from(claims)

    // Denied amount
    const deniedTotal = await db
      .select({ total: sum(claims.billedAmount) })
      .from(claims)
      .where(eq(claims.status, 'denied'))

    // Denial rate
    const totalCount = totalClaims[0]?.count || 0
    const deniedCount = deniedClaims[0]?.count || 0
    const denialRate = totalCount > 0 ? (deniedCount / totalCount) * 100 : 0

    return {
      totalClaims: totalCount,
      deniedClaims: deniedCount,
      denialRate: denialRate.toFixed(2),
      billedAmount: billedTotal[0]?.total || 0,
      paidAmount: paidTotal[0]?.total || 0,
      deniedAmount: deniedTotal[0]?.total || 0,
      period: { days, startDate: startDateStr }
    }
  } catch (error) {
    console.error('Claims summary error:', error)
    return { error: 'Failed to fetch claims summary' }
  }
})
```

### Create `server/api/v1/patterns/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { patterns } from '~/server/database/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0

    const patternsList = await db
      .select()
      .from(patterns)
      .orderBy(desc(patterns.frequency))
      .limit(limit)
      .offset(offset)

    return {
      data: patternsList,
      pagination: {
        limit,
        offset,
        total: patternsList.length
      }
    }
  } catch (error) {
    console.error('Patterns endpoint error:', error)
    return { error: 'Failed to fetch patterns' }
  }
})
```

### Create `server/api/v1/patterns/[id].get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { patterns, patternSnapshots } from '~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const [pattern] = await db
      .select()
      .from(patterns)
      .where(eq(patterns.id, id!))

    if (!pattern) {
      throw new Error('Pattern not found')
    }

    // Get recent snapshots for trend
    const snapshots = await db
      .select()
      .from(patternSnapshots)
      .where(eq(patternSnapshots.patternId, id!))
      .orderBy(desc(patternSnapshots.snapshotDate))
      .limit(30)

    return {
      ...pattern,
      history: snapshots
    }
  } catch (error) {
    console.error('Pattern detail error:', error)
    return { error: 'Failed to fetch pattern' }
  }
})
```

### Create `server/api/v1/providers/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { providers } from '~/server/database/schema'
import { sql, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const providersList = await db
      .select({
        id: providers.id,
        name: providers.name,
        npi: providers.npi,
        type: providers.type,
        createdAt: providers.createdAt
      })
      .from(providers)

    return {
      data: providersList,
      total: providersList.length
    }
  } catch (error) {
    console.error('Providers endpoint error:', error)
    return { error: 'Failed to fetch providers' }
  }
})
```

### Create `server/api/v1/policies/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { policies } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const policiesList = await db
      .select()
      .from(policies)

    return {
      data: policiesList,
      total: policiesList.length
    }
  } catch (error) {
    console.error('Policies endpoint error:', error)
    return { error: 'Failed to fetch policies' }
  }
})
```

### Create `server/api/v1/insights/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { patterns, claims } from '~/server/database/schema'
import { sql, count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Get top patterns by frequency
    const topPatterns = await db
      .select({
        id: patterns.id,
        name: patterns.name,
        category: patterns.category,
        frequency: patterns.frequency,
        impact: patterns.impact,
        description: patterns.description
      })
      .from(patterns)
      .orderBy(desc(patterns.frequency))
      .limit(10)

    // Get recent claims by status
    const recentClaimed = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.status, 'denied'))

    return {
      topPatterns,
      deniedClaimsCount: recentClaimed[0]?.count || 0,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Insights endpoint error:', error)
    return { error: 'Failed to fetch insights' }
  }
})
```

**Day 1 Success**: All 8 endpoints working, responses < 500ms, data matches database

---

## Day 2: Update Pinia Stores

### Update `stores/app.ts`

Replace the static `$fetch('public/data/claims.json')` with:

```typescript
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const claims = ref<Claim[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load claims from database API
  async function loadClaims(filters?: { status?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (filters?.status) query.append('status', filters.status)
      if (filters?.limit) query.append('limit', filters.limit.toString())

      const response = await $fetch(`/api/v1/claims?${query.toString()}`)
      claims.value = response.data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load claims'
      console.error('Error loading claims:', err)
    } finally {
      loading.value = false
    }
  }

  // Load summary stats
  async function loadSummary() {
    try {
      const response = await $fetch('/api/v1/claims/summary')
      return response
    } catch (err) {
      console.error('Error loading summary:', err)
      return null
    }
  }

  return {
    claims,
    loading,
    error,
    loadClaims,
    loadSummary
  }
})
```

### Update `stores/patterns.ts`

```typescript
import { defineStore } from 'pinia'

export const usePatternsStore = defineStore('patterns', () => {
  const patterns = ref<Pattern[]>([])
  const loading = ref(false)

  async function loadPatterns() {
    loading.value = true
    try {
      const response = await $fetch('/api/v1/patterns')
      patterns.value = response.data || []
    } catch (err) {
      console.error('Error loading patterns:', err)
    } finally {
      loading.value = false
    }
  }

  async function getPatternDetail(id: string) {
    try {
      return await $fetch(`/api/v1/patterns/${id}`)
    } catch (err) {
      console.error('Error loading pattern:', err)
      return null
    }
  }

  return {
    patterns,
    loading,
    loadPatterns,
    getPatternDetail
  }
})
```

### Update `stores/analytics.ts`

```typescript
import { defineStore } from 'pinia'

export const useAnalyticsStore = defineStore('analytics', () => {
  const insights = ref<any>(null)
  const providers = ref<any[]>([])

  async function loadInsights() {
    try {
      insights.value = await $fetch('/api/v1/insights')
    } catch (err) {
      console.error('Error loading insights:', err)
    }
  }

  async function loadProviders() {
    try {
      const response = await $fetch('/api/v1/providers')
      providers.value = response.data || []
    } catch (err) {
      console.error('Error loading providers:', err)
    }
  }

  return {
    insights,
    providers,
    loadInsights,
    loadProviders
  }
})
```

**Day 2 Success**: Stores use database API, components still work without changes

---

## Day 3: Update Pages & Error Handling

### Update `pages/index.vue`

Replace hardcoded values:

```vue
<script setup lang="ts">
const appStore = useAppStore()
const analyticsStore = useAnalyticsStore()

const summary = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  await appStore.loadClaims({ limit: 500 })
  summary.value = await appStore.loadSummary()
  await analyticsStore.loadInsights()
  loading.value = false
})

// Remove hardcoded values like revenueRecovered = 127500
// Use computed values instead:

const revenueRecovered = computed(() => {
  const denied = summary.value?.deniedAmount || 0
  // Potential recovery (what was denied)
  return denied
})

const denialRate = computed(() => {
  return summary.value?.denialRate || 0
})
</script>
```

### Add Global Error Boundary

Create `components/ErrorBoundary.vue`:

```vue
<template>
  <div v-if="error" class="error-container p-4 bg-red-50 border border-red-200 rounded">
    <h3 class="font-bold text-red-800">Error Loading Data</h3>
    <p class="text-red-600">{{ error }}</p>
    <button 
      @click="retry" 
      class="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
const error = ref<string | null>(null)

async function retry() {
  error.value = null
  // Trigger parent reload
  window.location.reload()
}

// Catch errors from child components
defineExpose({ setError: (msg: string) => { error.value = msg } })
</script>
```

### Add Response Caching

Create `composables/useApiCache.ts`:

```typescript
export function useApiCache() {
  const cache = new Map<string, { data: any; timestamp: number }>()
  const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

  async function cached<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    const data = await fetcher()
    cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  function invalidate(pattern?: string) {
    if (!pattern) {
      cache.clear()
    } else {
      for (const [key] of cache) {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      }
    }
  }

  return { cached, invalidate }
}
```

**Day 3 Success**: No hardcoded values, all data from database, error handling in place

---

## Implementation Checklist

- [ ] Day 1: All 8 API endpoints created and tested
- [ ] Day 1: Response times < 500ms verified
- [ ] Day 2: Pinia stores updated to use APIs
- [ ] Day 2: No more JSON file loads
- [ ] Day 3: All pages reading from store
- [ ] Day 3: Error boundaries in place
- [ ] Day 3: Response caching implemented

## Testing

```bash
# Check API endpoints
curl http://localhost:3000/api/v1/claims
curl http://localhost:3000/api/v1/claims/summary
curl http://localhost:3000/api/v1/patterns
curl http://localhost:3000/api/v1/insights

# Check database data
sqlite3 provider-portal.db "SELECT COUNT(*) FROM claims;"
```

## Success Criteria

- ✅ Dashboard loads data from database APIs
- ✅ No JSON files loaded in browser
- ✅ Response times < 500ms
- ✅ Error handling for failed requests
- ✅ Caching prevents excessive queries
- ✅ All components work without modification

## Commits

```
git commit -m "Phase 1 Day 1: API endpoints for claims, patterns, providers"
git commit -m "Phase 1 Day 2: Pinia stores updated to use database APIs"
git commit -m "Phase 1 Day 3: Pages refactored, error handling added"
```

---

**Next Phase**: Phase 2 (Computation Engine) will move metric calculations from client to server.

Good luck! This phase transforms the app from static JSON to live database-backed.
