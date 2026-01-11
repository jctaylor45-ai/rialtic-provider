<script setup lang="ts" generic="TData">
/**
 * DataTable component using TanStack Table
 * Provides sorting, row selection, and virtual scrolling
 */
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/vue-table'
import { useVirtualizer } from '@tanstack/vue-virtual'

const props = withDefaults(defineProps<{
  data: TData[]
  columns: ColumnDef<TData, any>[]
  enableSorting?: boolean
  enableRowSelection?: boolean
  enableVirtualization?: boolean
  rowHeight?: number
  containerHeight?: string
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
}>(), {
  enableSorting: true,
  enableRowSelection: false,
  enableVirtualization: false,
  rowHeight: 56,
  containerHeight: '600px',
  loading: false,
  emptyMessage: 'No data available',
})

const emit = defineEmits<{
  'update:sorting': [value: SortingState]
  'update:rowSelection': [value: RowSelectionState]
  rowClick: [row: TData]
}>()

// State
const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})

// Table container ref for virtualization
const tableContainerRef = ref<HTMLDivElement | null>(null)

// Sorting handler
const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
  const newValue = typeof updaterOrValue === 'function'
    ? updaterOrValue(sorting.value)
    : updaterOrValue
  sorting.value = newValue
  emit('update:sorting', newValue)
}

// Row selection handler
const onRowSelectionChange: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
  const newValue = typeof updaterOrValue === 'function'
    ? updaterOrValue(rowSelection.value)
    : updaterOrValue
  rowSelection.value = newValue
  emit('update:rowSelection', newValue)
}

// Create table instance
const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  enableSorting: props.enableSorting,
  enableRowSelection: props.enableRowSelection,
  onSortingChange,
  onRowSelectionChange,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// Get all rows
const rows = computed(() => table.getRowModel().rows)

// Virtual row handling - only create when enabled and container exists
const virtualizer = props.enableVirtualization
  ? useVirtualizer({
      get count() {
        return rows.value.length
      },
      getScrollElement: () => tableContainerRef.value,
      estimateSize: () => props.rowHeight,
      overscan: 10,
    })
  : null

const virtualRows = computed(() => {
  if (!virtualizer) return null
  return virtualizer.value.getVirtualItems()
})

const totalSize = computed(() => {
  if (!virtualizer) return 0
  return virtualizer.value.getTotalSize()
})

// Row click handler
const handleRowClick = (row: TData) => {
  if (props.onRowClick) {
    props.onRowClick(row)
  }
  emit('rowClick', row)
}

// Get sort icon based on column sort state
const getSortIcon = (columnId: string) => {
  const sortState = sorting.value.find(s => s.id === columnId)
  if (!sortState) return 'heroicons:chevron-up-down'
  return sortState.desc ? 'heroicons:chevron-down' : 'heroicons:chevron-up'
}

const isSorted = (columnId: string) => {
  return sorting.value.some(s => s.id === columnId)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UiLoading size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="data.length === 0" class="flex flex-col items-center justify-center py-12">
      <Icon name="heroicons:inbox" class="w-12 h-12 text-neutral-300 mb-3" />
      <p class="text-sm text-neutral-500">{{ emptyMessage }}</p>
    </div>

    <!-- Table -->
    <div
      v-else
      ref="tableContainerRef"
      class="overflow-auto"
      :style="enableVirtualization ? { height: containerHeight } : {}"
    >
      <table class="w-full">
        <thead class="bg-neutral-50 sticky top-0 z-10">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase tracking-wider select-none"
              :class="{
                'cursor-pointer hover:bg-neutral-100': header.column.getCanSort(),
              }"
              :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <div class="flex items-center gap-1">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <Icon
                  v-if="header.column.getCanSort()"
                  :name="getSortIcon(header.column.id)"
                  class="w-4 h-4"
                  :class="isSorted(header.column.id) ? 'text-primary-600' : 'text-neutral-400'"
                />
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-neutral-200">
          <!-- Non-virtualized rows -->
          <template v-if="!enableVirtualization">
            <tr
              v-for="row in rows"
              :key="row.id"
              class="hover:bg-primary-50 transition-colors"
              :class="{ 'cursor-pointer': onRowClick }"
              @click="handleRowClick(row.original)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-6 py-4"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </template>

          <!-- Virtualized rows -->
          <template v-else-if="virtualRows">
            <tr :style="{ height: `${virtualRows[0]?.start ?? 0}px` }" />
            <template v-for="virtualRow in virtualRows" :key="virtualRow.index">
              <tr
                v-if="rows[virtualRow.index]"
                class="hover:bg-primary-50 transition-colors"
                :class="{ 'cursor-pointer': onRowClick }"
                :style="{ height: `${virtualRow.size}px` }"
                @click="handleRowClick(rows[virtualRow.index]!.original)"
              >
                <td
                  v-for="cell in rows[virtualRow.index]!.getVisibleCells()"
                  :key="cell.id"
                  class="px-6 py-4"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>
            </template>
            <tr :style="{ height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px` }" />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
