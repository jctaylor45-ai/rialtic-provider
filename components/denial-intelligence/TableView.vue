<template>
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
                'text-right': ['impact', 'denialRate', 'frequency'].includes(header.column.id),
              }"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <div
                class="flex items-center gap-1"
                :class="{ 'justify-end': ['impact', 'denialRate', 'frequency'].includes(header.column.id) }"
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
            @click="$emit('select', row.original)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-6 py-4"
              :class="{ 'text-right': ['impact', 'denialRate', 'frequency'].includes(cell.column.id) }"
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
          to {{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, items.length) }}
          of {{ items.length }}
        </span>
        <select
          :value="table.getState().pagination.pageSize"
          @change="table.setPageSize(Number(($event.target as HTMLSelectElement).value))"
          class="form-input py-1 text-sm"
        >
          <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">
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
</template>

<script setup lang="ts">
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type Column,
} from '@tanstack/vue-table'
import type { DenialIntelligenceItem } from '~/types/denial-intelligence'

const props = defineProps<{
  items: DenialIntelligenceItem[]
}>()

defineEmits<{
  select: [item: DenialIntelligenceItem]
}>()

const { formatCurrency } = useAnalytics()

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
})

const sorting = ref<SortingState>([{ id: 'impact', desc: true }])

const tierBadgeClass = (tier: string) => {
  const classes: Record<string, string> = {
    critical: 'bg-error-100 text-error-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-warning-100 text-warning-700',
    low: 'bg-secondary-100 text-secondary-700',
  }
  return classes[tier] || 'bg-neutral-100 text-neutral-600'
}

const columns: ColumnDef<DenialIntelligenceItem>[] = [
  {
    id: 'type',
    header: 'Type',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.type === 'active') {
        return h('span', {
          class: `px-2 py-0.5 text-xs font-medium rounded-full ${tierBadgeClass(row.original.tier)}`,
        }, row.original.tier.toUpperCase())
      }
      return h('span', {
        class: 'px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600',
      }, 'Inactive')
    },
  },
  {
    id: 'name',
    accessorKey: 'title',
    header: 'Name',
    size: 280,
    cell: ({ row }) => h('div', {}, [
      h('div', { class: 'font-medium text-sm text-neutral-900' }, row.original.title),
      h('div', { class: 'text-xs text-neutral-500' }, row.original.id),
    ]),
  },
  {
    id: 'topic',
    accessorKey: 'topic',
    header: 'Topic',
    size: 140,
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-700' }, row.original.topic || '\u2014'),
  },
  {
    id: 'source',
    accessorKey: 'source',
    header: 'Source',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-700' }, row.original.source || '\u2014'),
  },
  {
    id: 'frequency',
    header: 'Frequency',
    size: 100,
    accessorFn: (row) => row.type === 'active' ? row.pattern.score.frequency : 0,
    cell: ({ row }) => {
      if (row.original.type === 'inactive') return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
      return h('span', { class: 'text-sm text-neutral-900' }, row.original.pattern.score.frequency.toString())
    },
  },
  {
    id: 'denialRate',
    header: 'Denial Rate',
    size: 100,
    accessorFn: (row) => row.type === 'active' ? (row.pattern.currentDenialRate || 0) : 0,
    cell: ({ row }) => {
      if (row.original.type === 'inactive') {
        const rate = row.original.policy.denial_rate
        if (!rate) return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
        return h('span', { class: 'text-sm text-neutral-900' }, `${(rate * 100).toFixed(1)}%`)
      }
      const rate = row.original.pattern.currentDenialRate
      if (!rate) return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
      return h('span', { class: 'text-sm text-neutral-900' }, `${rate.toFixed(1)}%`)
    },
  },
  {
    id: 'impact',
    header: 'Impact',
    size: 120,
    accessorFn: (row) => row.type === 'active' ? row.pattern.totalAtRisk : (row.policy?.impact || 0),
    cell: ({ row }) => {
      const val = row.original.type === 'active'
        ? row.original.pattern.totalAtRisk
        : (row.original.policy.impact || 0)
      if (!val) return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
      return h('span', { class: 'text-sm font-semibold text-neutral-900' }, formatCurrency(val))
    },
  },
  {
    id: 'trend',
    header: 'Trend',
    size: 80,
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.type === 'inactive') return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
      const trend = row.original.pattern.score.trend
      const iconMap = { up: 'heroicons:arrow-trending-up', down: 'heroicons:arrow-trending-down', stable: 'heroicons:minus' }
      const colorMap = { up: 'text-error-600', down: 'text-success-600', stable: 'text-neutral-500' }
      return h('div', { class: `flex items-center gap-1 ${colorMap[trend]}` }, [
        h(resolveComponent('Icon'), { name: iconMap[trend], class: 'w-4 h-4' }),
        h('span', { class: 'text-xs capitalize' }, trend),
      ])
    },
  },
  {
    id: 'recoveryStatus',
    header: 'Recovery',
    size: 110,
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.type === 'inactive') return h('span', { class: 'text-sm text-neutral-400' }, '\u2014')
      const status = row.original.pattern.recoveryStatus
      const labelMap: Record<string, string> = { recoverable: 'Recoverable', partial: 'Partial', not_recoverable: 'Not Recoverable' }
      const classMap: Record<string, string> = {
        recoverable: 'bg-success-100 text-success-700',
        partial: 'bg-warning-100 text-warning-700',
        not_recoverable: 'bg-error-100 text-error-700',
      }
      return h('span', {
        class: `px-2 py-0.5 text-xs font-medium rounded-full ${classMap[status] || 'bg-neutral-100 text-neutral-600'}`,
      }, labelMap[status] || status)
    },
  },
]

const table = useVueTable({
  get data() {
    return props.items
  },
  columns,
  state: {
    get sorting() { return sorting.value },
    get pagination() { return pagination.value },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

const getSortIcon = (column: Column<DenialIntelligenceItem, unknown>) => {
  const dir = column.getIsSorted()
  if (!dir) return 'heroicons:chevron-up-down'
  return dir === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}
</script>
