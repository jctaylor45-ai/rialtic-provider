<template>
  <div class="flex-1 overflow-y-auto p-8">
    <!-- Loading State -->
    <div v-if="appStore.isLoading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <UiLoading size="lg" class="mx-auto mb-2" />
        <p class="text-sm text-neutral-600">Loading claims...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Pattern Filter Banner -->
      <div
        v-if="patternClaimIds"
        class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <Icon v-if="isLoadingPatternClaims" name="heroicons:arrow-path" class="w-5 h-5 text-orange-600 animate-spin" />
          <Icon v-else name="heroicons:funnel" class="w-5 h-5 text-orange-600" />
          <div>
            <span class="text-sm font-medium text-orange-900">
              {{ isLoadingPatternClaims ? 'Loading' : 'Viewing' }} {{ patternLinkedClaims.length || patternClaimIds.length }} claims linked to pattern
            </span>
            <span class="text-xs text-orange-700 ml-2">
              From Insights page
            </span>
          </div>
        </div>
        <button
          @click="clearPatternFilter"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
          Clear filter
        </button>
      </div>

      <!-- Search Bar -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Claim ID</label>
            <input
              v-model="searchClaimId"
              type="text"
              placeholder="CLM-2025-XXXX"
              class="form-input w-full"
            />
          </div>

          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Patient</label>
            <input
              v-model="searchPatient"
              type="text"
              placeholder="Search by patient..."
              class="form-input w-full"
            />
          </div>

          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Procedure Code</label>
            <input
              v-model="searchProcedureCode"
              type="text"
              placeholder="CPT/HCPCS code"
              class="form-input w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <select v-model="filterStatus" class="form-input">
            <option value="all">All Statuses</option>
            <option value="paid">Paid/Approved</option>
            <option value="denied">Denied</option>
            <option value="pending">Pending</option>
            <option value="appealed">Appealed</option>
          </select>

          <select v-model="filterDateRange" class="form-input">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
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
          {{ filteredClaims.length }} claims found
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

      <!-- Results Table using TanStack -->
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
                    'text-right': header.column.id === 'billedAmount',
                    'text-center': header.column.id === 'status',
                  }"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <div
                    class="flex items-center gap-1"
                    :class="{
                      'justify-end': header.column.id === 'billedAmount',
                      'justify-center': header.column.id === 'status',
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
                :class="{ 'bg-primary-50': selectedClaimId === row.original.id }"
                @click="openClaimDrawer(row.original.id)"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="px-6 py-4"
                  :class="{
                    'text-right': cell.column.id === 'billedAmount',
                    'text-center': cell.column.id === 'status',
                  }"
                  @click="cell.column.id === 'patterns' ? $event.stopPropagation() : null"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>
              <tr v-if="filteredClaims.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-neutral-500">
                  No claims found matching your criteria
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
              to {{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredClaims.length) }}
              of {{ filteredClaims.length }} claims
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
    </div>

    <!-- Claim Details Drawer -->
    <AppDetailsDrawer
      :is-open="isDrawerOpen"
      :is-loading="false"
      width="800px"
      @close="closeDrawer"
    >
      <ClaimsClaimDetailsContent
        v-if="selectedClaimId"
        :claim-id="selectedClaimId"
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
import type { Claim } from '~/types'
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

// Computed for selected claims
const selectedClaims = computed(() => {
  const selectedIds = Object.keys(rowSelection.value).filter(id => rowSelection.value[id])
  return filteredClaims.value.filter((_, index) => selectedIds.includes(String(index)))
})

const selectedCount = computed(() => selectedClaims.value.length)
const hasSelection = computed(() => selectedCount.value > 0)

// Bulk action handlers
const handleExportSelected = () => {
  const claims = selectedClaims.value
  // Create CSV content
  const headers = ['Claim ID', 'Patient', 'Date of Service', 'Amount', 'Status', 'Denial Reason']
  const rows = claims.map(c => [
    c.id,
    c.patientName,
    c.dateOfService,
    c.billedAmount.toString(),
    c.status,
    c.denialReason || '',
  ])
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)

  toast.success(`Exported ${claims.length} claims`)
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
  excludeKeys: ['claim', 'sort', 'ids'],
  defaults: {
    status: 'all',
    dateRange: 'all',
  },
})

// Pattern-linked claims filter (from insights page)
const patternClaimIds = computed(() => {
  const idsParam = route.query.ids
  if (typeof idsParam === 'string' && idsParam.length > 0) {
    return idsParam.split(',')
  }
  return null
})

// Clear the pattern filter
const clearPatternFilter = () => {
  const { ids, ...rest } = route.query
  router.replace({ query: rest })
}

// URL-persisted sort state
const { sortState, setSortState } = useUrlSortState({
  defaultColumn: 'dateOfService',
  defaultDirection: 'desc',
})

// Local refs for input fields (synced with URL via watchers)
const searchClaimId = ref('')
const searchPatient = ref('')
const searchProcedureCode = ref('')
const filterStatus = ref('all')
const filterDateRange = ref('all')

// Sync URL params to local refs on mount and route changes
const syncFromUrl = () => {
  searchClaimId.value = normalizedParams.value.claimId || ''
  searchPatient.value = normalizedParams.value.patient || ''
  searchProcedureCode.value = normalizedParams.value.procedureCode || ''
  filterStatus.value = normalizedParams.value.status || 'all'
  filterDateRange.value = normalizedParams.value.dateRange || 'all'
}

// Watch for URL changes (e.g., back/forward navigation)
watch(() => route.query, syncFromUrl, { immediate: true })

// Watch local refs and sync to URL
watch(searchClaimId, (val) => setUrlParamDebounced('claimId', val || null))
watch(searchPatient, (val) => setUrlParamDebounced('patient', val || null))
watch(searchProcedureCode, (val) => setUrlParamDebounced('procedureCode', val || null))
watch(filterStatus, (val) => setUrlParam('status', val === 'all' ? null : val))
watch(filterDateRange, (val) => setUrlParam('dateRange', val === 'all' ? null : val))

// Drawer state
const isDrawerOpen = ref(false)
const selectedClaimId = ref<string | null>(null)

// Open claim in drawer
const openClaimDrawer = (claimId: string) => {
  selectedClaimId.value = claimId
  isDrawerOpen.value = true
  // Update URL without navigation
  router.replace({ query: { ...route.query, claim: claimId } })
}

// Close drawer
const closeDrawer = () => {
  isDrawerOpen.value = false
  selectedClaimId.value = null
  // Remove claim from URL
  const { claim, ...rest } = route.query
  router.replace({ query: rest })
}

// Clear all filters
const handleClearFilters = () => {
  searchClaimId.value = ''
  searchPatient.value = ''
  searchProcedureCode.value = ''
  filterStatus.value = 'all'
  filterDateRange.value = 'all'
  clearUrlParams()
}

// State for pattern-linked claims fetched directly from API
const patternLinkedClaims = ref<typeof appStore.claims>([])
const isLoadingPatternClaims = ref(false)

// Fetch pattern-linked claims directly from API when IDs are in URL
async function fetchPatternLinkedClaims(ids: string[]) {
  if (ids.length === 0) return
  isLoadingPatternClaims.value = true
  try {
    const response = await $fetch<{ data: typeof appStore.claims }>('/api/v1/claims', {
      params: { ids: ids.join(','), limit: 500 }
    })
    patternLinkedClaims.value = response.data
  } catch (err) {
    console.error('Failed to fetch pattern-linked claims:', err)
    patternLinkedClaims.value = []
  } finally {
    isLoadingPatternClaims.value = false
  }
}

// Watch for changes to ids query param
watch(() => route.query.ids, async (newIds) => {
  if (typeof newIds === 'string' && newIds.length > 0) {
    await fetchPatternLinkedClaims(newIds.split(','))
  } else {
    patternLinkedClaims.value = []
  }
}, { immediate: true })

// Ensure data is loaded and apply query params
onMounted(async () => {
  if (appStore.claims.length === 0 && !appStore.isLoading) {
    await appStore.initialize()
  }
  if (patternsStore.patterns.length === 0 && !patternsStore.isLoading) {
    await patternsStore.loadPatterns()
  }

  // Fetch pattern-linked claims if IDs in URL
  if (route.query.ids && typeof route.query.ids === 'string') {
    await fetchPatternLinkedClaims(route.query.ids.split(','))
  }

  // Open drawer if claim ID in URL
  if (route.query.claim && typeof route.query.claim === 'string') {
    selectedClaimId.value = route.query.claim
    isDrawerOpen.value = true
  }
})

// TanStack Table sorting state - synced with URL
const sorting = computed<SortingState>(() => {
  if (sortState.value) {
    return [{ id: sortState.value.column, desc: sortState.value.direction === 'desc' }]
  }
  return [{ id: 'dateOfService', desc: true }]
})

// Filter claims based on search params and filters (now using URL-synced refs)
const filteredClaims = computed(() => {
  // When viewing pattern-linked claims, use the API-fetched claims instead of store
  let result = patternClaimIds.value && patternClaimIds.value.length > 0
    ? [...patternLinkedClaims.value]
    : [...appStore.claims]

  // Search filters
  if (searchClaimId.value) {
    result = result.filter(c => c.id.toLowerCase().includes(searchClaimId.value.toLowerCase()))
  }

  if (searchPatient.value) {
    result = result.filter(c =>
      c.patientName.toLowerCase().includes(searchPatient.value.toLowerCase()) ||
      c.memberId?.toLowerCase().includes(searchPatient.value.toLowerCase())
    )
  }

  if (searchProcedureCode.value) {
    result = result.filter(c => {
      const codes = c.procedureCodes || (c.procedureCode ? [c.procedureCode] : [])
      return codes.some(code => code?.toLowerCase().includes(searchProcedureCode.value.toLowerCase()))
    })
  }

  // Status filter
  if (filterStatus.value !== 'all') {
    result = result.filter(c => c.status === filterStatus.value)
  }

  // Date range filter
  if (filterDateRange.value !== 'all') {
    const days = parseInt(filterDateRange.value)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    result = result.filter(c => new Date(c.dateOfService) >= cutoffDate)
  }

  return result
})

// Get patterns matching a claim
const getClaimPatterns = (claimId: string): Pattern[] => {
  return patternsStore.getPatternsByClaim(claimId)
}

// Get pattern info for sorting and display
const getClaimPatternInfo = (claimId: string) => {
  const patterns = patternsStore.getPatternsByClaim(claimId)
  if (patterns.length === 0) return { display: null, sortValue: '', patterns: [] as Pattern[] }
  const firstPattern = patterns[0]
  if (patterns.length === 1 && firstPattern) return {
    display: firstPattern.title,
    sortValue: firstPattern.title,
    patterns,
  }
  return {
    display: `${patterns.length} patterns`,
    sortValue: patterns.map(p => p.title).sort().join(', '),
    patterns,
  }
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

// Navigate to pattern details in insights page
const viewPattern = (pattern: Pattern) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}

// Column definitions for TanStack Table
const columns: ColumnDef<Claim>[] = [
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
    id: 'id',
    accessorKey: 'id',
    header: 'Claim ID',
    size: 140,
    cell: ({ row }) => h('div', { class: 'font-mono text-sm text-primary-600 font-medium' }, row.original.id),
  },
  {
    id: 'patient',
    accessorFn: (row) => row.patientName,
    header: 'Patient',
    size: 180,
    cell: ({ row }) => h('div', {}, [
      h('div', { class: 'text-sm text-neutral-900' }, row.original.patientName),
      row.original.memberId
        ? h('div', { class: 'text-xs text-neutral-500' }, `ID: ${row.original.memberId}`)
        : null,
    ]),
  },
  {
    id: 'dateOfService',
    accessorKey: 'dateOfService',
    header: 'Date of Service',
    size: 130,
    cell: ({ row }) => h('div', { class: 'text-sm text-neutral-900' }, formatDate(row.original.dateOfService)),
  },
  {
    id: 'billedAmount',
    accessorKey: 'billedAmount',
    header: 'Amount',
    size: 110,
    cell: ({ row }) => h('div', { class: 'text-sm font-semibold text-neutral-900' }, formatCurrency(row.original.billedAmount)),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => h(resolveComponent('UiStatusBadge'), { status: row.original.status }),
  },
  {
    id: 'patterns',
    accessorFn: (row) => getClaimPatternInfo(row.id).sortValue,
    header: 'Patterns',
    size: 150,
    enableSorting: true,
    sortingFn: 'alphanumeric',
    cell: ({ row }) => {
      const info = getClaimPatternInfo(row.original.id)
      if (!info.display) {
        return h('div', { class: 'text-xs text-neutral-400' }, '—')
      }

      // Single pattern - show full title
      const firstPattern = info.patterns[0]
      if (info.patterns.length === 1 && firstPattern) {
        return h('button', {
          class: `inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${getPatternBadgeClass(firstPattern.tier)}`,
          title: firstPattern.title,
          onClick: (e: Event) => {
            e.stopPropagation()
            viewPattern(firstPattern)
          },
        }, [
          h(resolveComponent('Icon'), { name: getPatternCategoryIcon(firstPattern.category), class: 'w-3 h-3' }),
          h('span', {}, firstPattern.tier.charAt(0).toUpperCase() + firstPattern.tier.slice(1)),
        ])
      }

      // Multiple patterns - show count with tooltip
      return h('div', { class: 'flex flex-wrap gap-1' }, [
        ...info.patterns.slice(0, 2).map(pattern =>
          h('button', {
            class: `inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${getPatternBadgeClass(pattern.tier)}`,
            title: pattern.title,
            onClick: (e: Event) => {
              e.stopPropagation()
              viewPattern(pattern)
            },
          }, [
            h(resolveComponent('Icon'), { name: getPatternCategoryIcon(pattern.category), class: 'w-3 h-3' }),
            h('span', {}, pattern.tier.charAt(0).toUpperCase() + pattern.tier.slice(1)),
          ])
        ),
        info.patterns.length > 2
          ? h('span', {
              class: 'inline-flex items-center px-2 py-0.5 text-xs text-neutral-600',
              title: info.patterns.slice(2).map(p => p.title).join('\n'),
            }, `+${info.patterns.length - 2}`)
          : null,
      ])
    },
  },
  {
    id: 'denialReason',
    accessorKey: 'denialReason',
    header: 'Denial Reason',
    size: 200,
    enableSorting: true,
    sortingFn: 'alphanumeric',
    cell: ({ row }) => {
      const reason = row.original.denialReason
      if (!reason) return h('span', { class: 'text-neutral-400' }, '—')
      return h('span', { class: 'text-sm text-neutral-700' }, reason)
    },
  },
]

// Create TanStack Table instance
const table = useVueTable({
  get data() {
    return filteredClaims.value
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
const getSortIcon = (column: Column<Claim, unknown>) => {
  const sortDir = column.getIsSorted()
  if (!sortDir) return 'heroicons:chevron-up-down'
  return sortDir === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}
</script>
