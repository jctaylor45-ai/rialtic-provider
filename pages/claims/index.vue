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
      <!-- Search Bar -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Claim ID</label>
            <input
              v-model="searchParams.claimId"
              type="text"
              placeholder="CLM-2025-XXXX"
              class="form-input w-full"
            />
          </div>

          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Patient</label>
            <input
              v-model="searchParams.patient"
              type="text"
              placeholder="Search by patient..."
              class="form-input w-full"
            />
          </div>

          <div class="flex-1">
            <label class="text-sm text-neutral-600 mb-1 block">Procedure Code</label>
            <input
              v-model="searchParams.procedureCode"
              type="text"
              placeholder="CPT/HCPCS code"
              class="form-input w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <select v-model="filters.status" class="form-input">
            <option value="all">All Statuses</option>
            <option value="paid">Paid/Approved</option>
            <option value="denied">Denied</option>
            <option value="pending">Pending</option>
            <option value="appealed">Appealed</option>
          </select>

          <select v-model="filters.dateRange" class="form-input">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-neutral-600 mb-4">
        {{ filteredClaims.length }} claims found
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
  useVueTable,
  type ColumnDef,
  type SortingState,
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

// Ensure data is loaded and apply query params
onMounted(async () => {
  if (appStore.claims.length === 0 && !appStore.isLoading) {
    await appStore.initialize()
  }
  if (patternsStore.patterns.length === 0 && !patternsStore.isLoading) {
    await patternsStore.loadPatterns()
  }

  // Apply query params to filters
  if (route.query.status && typeof route.query.status === 'string') {
    filters.status = route.query.status
  }
  if (route.query.dateRange && typeof route.query.dateRange === 'string') {
    filters.dateRange = route.query.dateRange
  }

  // Open drawer if claim ID in URL
  if (route.query.claim && typeof route.query.claim === 'string') {
    selectedClaimId.value = route.query.claim
    isDrawerOpen.value = true
  }
})

const searchParams = reactive({
  claimId: '',
  patient: '',
  procedureCode: '',
})

const filters = reactive({
  status: 'all',
  dateRange: 'all',
})

// TanStack Table sorting state
const sorting = ref<SortingState>([{ id: 'dateOfService', desc: true }])

// Filter claims based on search params and filters
const filteredClaims = computed(() => {
  let result = [...appStore.claims]

  // Search filters
  if (searchParams.claimId) {
    result = result.filter(c => c.id.toLowerCase().includes(searchParams.claimId.toLowerCase()))
  }

  if (searchParams.patient) {
    result = result.filter(c =>
      c.patientName.toLowerCase().includes(searchParams.patient.toLowerCase()) ||
      c.memberId?.toLowerCase().includes(searchParams.patient.toLowerCase())
    )
  }

  if (searchParams.procedureCode) {
    result = result.filter(c => {
      const codes = c.procedureCodes || (c.procedureCode ? [c.procedureCode] : [])
      return codes.some(code => code?.toLowerCase().includes(searchParams.procedureCode.toLowerCase()))
    })
  }

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter(c => c.status === filters.status)
  }

  // Date range filter
  if (filters.dateRange !== 'all') {
    const days = parseInt(filters.dateRange)
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
    header: 'Patterns',
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const patterns = getClaimPatterns(row.original.id)
      if (patterns.length === 0) {
        return h('div', { class: 'text-xs text-neutral-400' }, '—')
      }
      return h('div', { class: 'flex flex-wrap gap-1' }, [
        ...patterns.slice(0, 2).map(pattern =>
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
    id: 'denialReason',
    accessorKey: 'denialReason',
    header: 'Reason',
    size: 200,
    enableSorting: false,
    cell: ({ row }) => row.original.denialReason
      ? h('div', { class: 'text-sm text-neutral-700' }, row.original.denialReason)
      : null,
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
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting.value)
      : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// Get sort icon for column
const getSortIcon = (column: Column<Claim, unknown>) => {
  const sortDir = column.getIsSorted()
  if (!sortDir) return 'heroicons:chevron-up-down'
  return sortDir === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}
</script>
