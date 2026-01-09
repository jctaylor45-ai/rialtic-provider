<template>
  <div class="flex-1 overflow-y-auto p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-neutral-900">Policy Analytics</h1>
      <UiButton variant="outlined">
        <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        Export CSV
      </UiButton>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search policies..."
        class="form-input w-full mb-4"
      />

      <div class="flex items-center gap-4">
        <select v-model="filterTopic" class="form-input">
          <option value="all">All Topics</option>
          <option v-for="topic in uniqueTopics" :key="topic" :value="topic">
            {{ topic }}
          </option>
        </select>

        <select v-model="filterSource" class="form-input">
          <option value="all">All Sources</option>
          <option v-for="source in uniqueSources" :key="source" :value="source">
            {{ source }}
          </option>
        </select>

        <!-- Clear Filters Button -->
        <button
          v-if="hasActiveFilters"
          @click="handleClearFilters"
          class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
          Clear filters
          <span class="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded text-xs font-medium">
            {{ activeFilterCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Results Count & Bulk Actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm text-neutral-600">
        {{ filteredPolicies.length }} policies found
      </div>

      <!-- Bulk Action Bar -->
      <div
        v-if="hasSelection"
        class="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2"
      >
        <span class="text-sm font-medium text-primary-700">
          {{ selectedCount }} selected
        </span>
        <div class="h-4 w-px bg-primary-300" />
        <button
          @click="handleExportSelected"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 rounded transition-colors"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
          Export
        </button>
        <button
          @click="handleClearSelection"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-primary-100 rounded transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>

    <!-- Policies Table using TanStack -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-50">
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase tracking-wider select-none"
                :class="{
                  'cursor-pointer hover:bg-neutral-100': header.column.getCanSort(),
                  'text-right': ['hitRate', 'denialRate', 'impact'].includes(header.column.id),
                  'text-center': header.column.id === 'patterns',
                }"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <div
                  class="flex items-center gap-1"
                  :class="{
                    'justify-end': ['hitRate', 'denialRate', 'impact'].includes(header.column.id),
                    'justify-center': header.column.id === 'patterns',
                  }"
                >
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <Icon
                    v-if="header.column.getCanSort()"
                    :name="getSortIcon(header.column)"
                    class="w-4 h-4"
                    :class="header.column.getIsSorted() ? 'text-primary-600' : 'text-neutral-400'"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-primary-50 cursor-pointer transition-colors"
              :class="{ 'bg-primary-50': selectedPolicy?.id === row.original.id }"
              @click="openPolicyDrawer(row.original)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-6 py-4"
                :class="{
                  'text-right': ['hitRate', 'denialRate', 'impact'].includes(cell.column.id),
                  'text-center': cell.column.id === 'patterns',
                }"
                @click="cell.column.id === 'patterns' ? $event.stopPropagation() : null"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
        <div class="flex items-center gap-4">
          <span class="text-sm text-neutral-600">
            Showing {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}
            to {{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredPolicies.length) }}
            of {{ filteredPolicies.length }} policies
          </span>
          <select
            :value="table.getState().pagination.pageSize"
            @change="table.setPageSize(Number(($event.target as HTMLSelectElement).value))"
            class="form-input py-1 text-sm"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }} per page
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="table.setPageIndex(0)"
            :disabled="!table.getCanPreviousPage()"
            class="p-2 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="heroicons:chevron-double-left" class="w-4 h-4" />
          </button>
          <button
            @click="table.previousPage()"
            :disabled="!table.getCanPreviousPage()"
            class="p-2 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
          </button>

          <span class="text-sm text-neutral-600 px-2">
            Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
          </span>

          <button
            @click="table.nextPage()"
            :disabled="!table.getCanNextPage()"
            class="p-2 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
          </button>
          <button
            @click="table.setPageIndex(table.getPageCount() - 1)"
            :disabled="!table.getCanNextPage()"
            class="p-2 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="heroicons:chevron-double-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Policy Details Drawer -->
    <AppDetailsDrawer
      :is-open="isDrawerOpen"
      :is-loading="false"
      width="700px"
      @close="closeDrawer"
    >
      <PoliciesPolicyDetailsContent
        v-if="selectedPolicy"
        :policy="selectedPolicy"
        @close="closeDrawer"
      />
    </AppDetailsDrawer>
  </div>
</template>

<script setup lang="ts">
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
  type Column,
} from '@tanstack/vue-table'
import type { Policy } from '~/types'
import type { Pattern } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const router = useRouter()
const route = useRoute()

// Composables
const { getPatternCategoryIcon } = usePatterns()
const toast = useToast()

// Row selection state for bulk actions
const rowSelection = ref<RowSelectionState>({})

// Pagination state
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
})

const pageSizeOptions = [10, 25, 50, 100]

// Computed for selected policies
const selectedPolicies = computed(() => {
  const selectedIds = Object.keys(rowSelection.value).filter(id => rowSelection.value[id])
  return filteredPolicies.value.filter((_, index) => selectedIds.includes(String(index)))
})

const selectedCount = computed(() => selectedPolicies.value.length)
const hasSelection = computed(() => selectedCount.value > 0)

// Bulk action handlers
const handleExportSelected = () => {
  const policies = selectedPolicies.value
  // Create CSV content
  const headers = ['Policy ID', 'Name', 'Topic', 'Source', 'Hit Rate', 'Denial Rate', 'Impact']
  const rows = policies.map(p => [
    p.id,
    p.name,
    p.topic,
    p.source,
    (p.hitRate * 100).toFixed(1) + '%',
    (p.denialRate * 100).toFixed(1) + '%',
    p.impact.toString(),
  ])
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `policies-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)

  toast.success(`Exported ${policies.length} policies`)
}

const handleClearSelection = () => {
  rowSelection.value = {}
}

// URL-persisted filter state
const {
  normalizedParams,
  setUrlParam,
  setUrlParamDebounced,
  clearUrlParams,
  hasActiveFilters,
  activeFilterCount,
} = useUrlParamsState({
  excludeKeys: ['policy', 'sort'],
  defaults: {
    topic: 'all',
    source: 'all',
  },
})

// URL-persisted sort state
const { sortState, setSortState } = useUrlSortState({
  defaultColumn: 'impact',
  defaultDirection: 'desc',
})

// Local refs for input fields (synced with URL via watchers)
const searchQuery = ref('')
const filterTopic = ref('all')
const filterSource = ref('all')

// Sync URL params to local refs on mount and route changes
const syncFromUrl = () => {
  searchQuery.value = normalizedParams.value.search || ''
  filterTopic.value = normalizedParams.value.topic || 'all'
  filterSource.value = normalizedParams.value.source || 'all'
}

// Watch for URL changes (e.g., back/forward navigation)
watch(() => route.query, syncFromUrl, { immediate: true })

// Watch local refs and sync to URL
watch(searchQuery, (val) => setUrlParamDebounced('search', val || null))
watch(filterTopic, (val) => setUrlParam('topic', val === 'all' ? null : val))
watch(filterSource, (val) => setUrlParam('source', val === 'all' ? null : val))

const selectedPolicy = ref<Policy | null>(null)
const isDrawerOpen = ref(false)

// Open policy in drawer
const openPolicyDrawer = (policy: Policy) => {
  selectedPolicy.value = policy
  isDrawerOpen.value = true
  // Update URL without navigation
  router.replace({ query: { ...route.query, policy: policy.id } })
}

// Close drawer
const closeDrawer = () => {
  isDrawerOpen.value = false
  selectedPolicy.value = null
  // Remove policy from URL
  const { policy, ...rest } = route.query
  router.replace({ query: rest })
}

// Clear all filters
const handleClearFilters = () => {
  searchQuery.value = ''
  filterTopic.value = 'all'
  filterSource.value = 'all'
  clearUrlParams()
}

// TanStack Table sorting state - synced with URL
const sorting = computed<SortingState>(() => {
  if (sortState.value) {
    return [{ id: sortState.value.column, desc: sortState.value.direction === 'desc' }]
  }
  return [{ id: 'impact', desc: true }]
})

// Dynamic filter options from policy data
const uniqueTopics = computed(() => {
  const topics = new Set(appStore.policies.map(p => p.topic).filter(Boolean))
  return Array.from(topics).sort()
})

const uniqueSources = computed(() => {
  const sources = new Set(appStore.policies.map(p => p.source).filter(Boolean))
  return Array.from(sources).sort()
})

// Filter policies based on search and filters (now using URL-synced refs)
const filteredPolicies = computed(() => {
  let result = appStore.policies

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  if (filterTopic.value !== 'all') {
    result = result.filter(p => p.topic === filterTopic.value)
  }

  if (filterSource.value !== 'all') {
    result = result.filter(p => p.source === filterSource.value)
  }

  return result
})

// Get patterns related to a policy
const getPolicyPatterns = (policyId: string): Pattern[] => {
  return patternsStore.patterns.filter(pattern =>
    pattern.relatedPolicies.includes(policyId)
  )
}

// Get pattern tier badge class
const getPatternBadgeClass = (tier: string) => {
  const classes = {
    critical: 'bg-error-100 text-error-700 border-error-300 hover:bg-error-200',
    high: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    medium: 'bg-warning-100 text-warning-700 border-warning-300 hover:bg-warning-200',
    low: 'bg-secondary-100 text-secondary-700 border-secondary-300 hover:bg-secondary-200',
  }
  return classes[tier as keyof typeof classes] || 'bg-neutral-100 text-neutral-700 border-neutral-300'
}

// Get pattern category icon
const getPatternIcon = (category: string) => {
  return getPatternCategoryIcon(category)
}

// Navigate to pattern details in insights page
const viewPattern = (pattern: Pattern) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}

// Column definitions for TanStack Table
const columns: ColumnDef<Policy>[] = [
  // Selection checkbox column
  {
    id: 'select',
    size: 40,
    enableSorting: false,
    header: ({ table }) => h('input', {
      type: 'checkbox',
      class: 'w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer',
      checked: table.getIsAllPageRowsSelected(),
      indeterminate: table.getIsSomePageRowsSelected(),
      onChange: (e: Event) => table.toggleAllPageRowsSelected((e.target as HTMLInputElement).checked),
      onClick: (e: Event) => e.stopPropagation(),
    }),
    cell: ({ row }) => h('input', {
      type: 'checkbox',
      class: 'w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer',
      checked: row.getIsSelected(),
      disabled: !row.getCanSelect(),
      onChange: row.getToggleSelectedHandler(),
      onClick: (e: Event) => e.stopPropagation(),
    }),
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Policy Name',
    size: 250,
    cell: ({ row }) => h('div', {}, [
      h('div', { class: 'font-medium text-sm text-neutral-900' }, row.original.name),
      h('div', { class: 'text-xs text-neutral-500' }, row.original.id),
    ]),
  },
  {
    id: 'topic',
    accessorKey: 'topic',
    header: 'Topic',
    size: 140,
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-700' }, row.original.topic),
  },
  {
    id: 'patterns',
    header: 'Related Patterns',
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const patterns = getPolicyPatterns(row.original.id)
      if (patterns.length === 0) {
        return h('div', { class: 'text-xs text-neutral-400' }, '—')
      }
      return h('div', { class: 'flex justify-center gap-1' }, [
        ...patterns.slice(0, 2).map(pattern =>
          h('button', {
            class: `inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${getPatternBadgeClass(pattern.tier)}`,
            title: pattern.title,
            onClick: (e: Event) => {
              e.stopPropagation()
              viewPattern(pattern)
            },
          }, [
            h(resolveComponent('Icon'), { name: getPatternIcon(pattern.category), class: 'w-3 h-3' }),
          ])
        ),
        patterns.length > 2
          ? h('span', {
              class: 'inline-flex items-center px-2 py-0.5 text-xs text-neutral-600',
              title: `+${patterns.length - 2} more pattern(s)`,
            }, `+${patterns.length - 2}`)
          : null,
      ])
    },
  },
  {
    id: 'hitRate',
    accessorKey: 'hitRate',
    header: 'Hit Rate',
    size: 100,
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-900' }, formatPercentage(row.original.hitRate)),
  },
  {
    id: 'denialRate',
    accessorKey: 'denialRate',
    header: 'Denial Rate',
    size: 100,
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-900' }, formatPercentage(row.original.denialRate)),
  },
  {
    id: 'impact',
    accessorKey: 'impact',
    header: 'Impact',
    size: 110,
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-neutral-900' }, formatCurrency(row.original.impact)),
  },
]

// Create TanStack Table instance
const table = useVueTable({
  get data() {
    return filteredPolicies.value
  },
  columns,
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get pagination() {
      return pagination.value
    },
  },
  enableRowSelection: true,
  onSortingChange: (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting.value)
      : updaterOrValue
    // Sync to URL
    const firstSort = newSorting[0]
    if (firstSort) {
      setSortState(firstSort.id, firstSort.desc ? 'desc' : 'asc')
    }
  },
  onRowSelectionChange: (updaterOrValue) => {
    rowSelection.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection.value)
      : updaterOrValue
  },
  onPaginationChange: (updaterOrValue) => {
    pagination.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(pagination.value)
      : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

// Get sort icon for column
const getSortIcon = (column: Column<Policy, unknown>) => {
  const sortDir = column.getIsSorted()
  if (!sortDir) return 'heroicons:chevron-up-down'
  return sortDir === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}

// Check for policy to open from session storage or URL
onMounted(() => {
  if (typeof window !== 'undefined') {
    // Check session storage first
    const policyId = sessionStorage.getItem('openPolicyId')
    if (policyId) {
      sessionStorage.removeItem('openPolicyId')
      const policy = appStore.policies.find(p => p.id === policyId)
      if (policy) {
        openPolicyDrawer(policy)
        return
      }
    }

    // Check URL query params
    if (route.query.policy && typeof route.query.policy === 'string') {
      const policy = appStore.policies.find(p => p.id === route.query.policy)
      if (policy) {
        selectedPolicy.value = policy
        isDrawerOpen.value = true
      }
    }
  }
})
</script>
