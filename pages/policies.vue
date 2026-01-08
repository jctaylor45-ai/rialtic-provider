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
        <select v-model="filters.mode" class="form-input">
          <option value="all">All Modes</option>
          <option value="Edit">Edit</option>
          <option value="Informational">Informational</option>
          <option value="Pay & Advise">Pay & Advise</option>
        </select>

        <select v-model="filters.topic" class="form-input">
          <option value="all">All Topics</option>
          <option value="Modifiers">Modifiers</option>
          <option value="Bundling">Bundling</option>
          <option value="Medical Necessity">Medical Necessity</option>
          <option value="Frequency">Frequency</option>
        </select>

        <select v-model="filters.source" class="form-input">
          <option value="all">All Sources</option>
          <option value="CMS">CMS</option>
          <option value="Payer">Payer</option>
          <option value="State">State</option>
        </select>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-neutral-600 mb-4">
      {{ filteredPolicies.length }} policies found
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
  useVueTable,
  type ColumnDef,
  type SortingState,
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

const searchQuery = ref('')
const filters = reactive({
  mode: 'all',
  topic: 'all',
  source: 'all',
})

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

// TanStack Table sorting state - default to impact descending
const sorting = ref<SortingState>([{ id: 'impact', desc: true }])

// Filter policies based on search and filters
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

  if (filters.mode !== 'all') {
    result = result.filter(p => p.mode === filters.mode)
  }

  if (filters.topic !== 'all') {
    result = result.filter(p => p.topic === filters.topic)
  }

  if (filters.source !== 'all') {
    result = result.filter(p => p.source === filters.source)
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

// Mode badge styles
const getModeClass = (mode: string) => {
  const classes = {
    'Edit': 'bg-error-100 text-error-700',
    'Informational': 'bg-secondary-100 text-secondary-700',
    'Pay & Advise': 'bg-warning-100 text-warning-700',
  }
  return classes[mode as keyof typeof classes] || 'bg-neutral-100 text-neutral-700'
}

// Column definitions for TanStack Table
const columns: ColumnDef<Policy>[] = [
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
    id: 'mode',
    accessorKey: 'mode',
    header: 'Mode',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => h('span', {
      class: `px-2 py-1 text-xs font-medium rounded ${getModeClass(row.original.mode)}`,
    }, row.original.mode),
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
