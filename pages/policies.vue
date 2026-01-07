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
              @click="selectedPolicy = row.original"
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

    <!-- Policy Detail Modal -->
    <div
      v-if="selectedPolicy"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="selectedPolicy = null"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white border-b border-neutral-200 p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-neutral-900 mb-2">{{ selectedPolicy.name }}</h2>
              <p class="text-sm text-neutral-600">{{ selectedPolicy.id }}</p>
            </div>
            <button @click="selectedPolicy = null" class="text-neutral-400 hover:text-neutral-600">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Related Patterns Alert -->
          <div v-if="getPolicyPatterns(selectedPolicy.id).length > 0" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-600 mt-0.5" />
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-orange-900 mb-2">Active Denial Patterns Related to This Policy</h3>
                <p class="text-xs text-orange-700 mb-3">
                  {{ getPolicyPatterns(selectedPolicy.id).length }} pattern(s) detected that relate to this policy
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="pattern in getPolicyPatterns(selectedPolicy.id)"
                    :key="pattern.id"
                    class="bg-white border border-orange-200 rounded p-3"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Icon :name="getPatternIcon(pattern.category)" class="w-4 h-4 text-orange-600" />
                        <span class="text-sm font-medium text-neutral-900">{{ pattern.title }}</span>
                      </div>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded-full border"
                        :class="getPatternBadgeClass(pattern.tier)"
                      >
                        {{ pattern.tier.charAt(0).toUpperCase() + pattern.tier.slice(1) }}
                      </span>
                    </div>
                    <p class="text-xs text-neutral-600 mb-2">{{ pattern.description }}</p>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 text-xs text-neutral-600">
                        <span>{{ pattern.score.frequency }} occurrences</span>
                        <span>{{ formatCurrency(pattern.totalAtRisk) }} at risk</span>
                      </div>
                      <button
                        @click="viewPattern(pattern)"
                        class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Description</h3>
            <p class="text-sm text-neutral-700">{{ selectedPolicy.description }}</p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Clinical Rationale</h3>
            <p class="text-sm text-neutral-700">{{ selectedPolicy.clinicalRationale }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 mb-2">Common Mistake</h3>
              <p class="text-sm text-neutral-700">{{ selectedPolicy.commonMistake }}</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 mb-2">Fix Guidance</h3>
              <p class="text-sm text-neutral-700">{{ selectedPolicy.fixGuidance }}</p>
            </div>
          </div>

          <!-- Impact Metrics -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
            <div class="bg-neutral-50 rounded-lg p-3">
              <div class="text-xs text-neutral-600 mb-1">Hit Rate</div>
              <div class="text-lg font-semibold text-neutral-900">{{ formatPercentage(selectedPolicy.hitRate) }}</div>
              <div class="text-xs text-neutral-500 mt-1">of claims affected</div>
            </div>
            <div class="bg-neutral-50 rounded-lg p-3">
              <div class="text-xs text-neutral-600 mb-1">Denial Rate</div>
              <div class="text-lg font-semibold text-error-700">{{ formatPercentage(selectedPolicy.denialRate) }}</div>
              <div class="text-xs text-neutral-500 mt-1">when policy triggered</div>
            </div>
            <div class="bg-neutral-50 rounded-lg p-3">
              <div class="text-xs text-neutral-600 mb-1">Total Impact</div>
              <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(selectedPolicy.impact) }}</div>
              <div class="text-xs text-neutral-500 mt-1">estimated savings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

// Composables
const { getPatternCategoryIcon } = usePatterns()

const searchQuery = ref('')
const filters = reactive({
  mode: 'all',
  topic: 'all',
  source: 'all',
})

const selectedPolicy = ref<Policy | null>(null)

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

// Check for policy to open from session storage
onMounted(() => {
  if (typeof window !== 'undefined') {
    const policyId = sessionStorage.getItem('openPolicyId')
    if (policyId) {
      sessionStorage.removeItem('openPolicyId')
      const policy = appStore.policies.find(p => p.id === policyId)
      if (policy) {
        selectedPolicy.value = policy
      }
    }
  }
})
</script>
