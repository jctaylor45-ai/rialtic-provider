<template>
  <div
    ref="tableContainerRef"
    class="relative overflow-auto"
    :style="{ height: `${height}px` }"
    @scroll="onVirtualScroll"
  >
    <div :style="{ height: `${totalSize}px` }">
      <table class="w-full" style="display: grid">
        <!-- Header -->
        <thead class="sticky top-0 z-10 bg-neutral-50">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="flex w-full border-b border-neutral-200"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="flex items-center px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none"
              :class="{
                'cursor-pointer hover:bg-neutral-100': header.column.getCanSort(),
                'justify-end': (header.column.columnDef.meta as ColumnMeta)?.align === 'right',
                'justify-center': (header.column.columnDef.meta as ColumnMeta)?.align === 'center',
              }"
              :style="{ width: `${header.getSize()}px` }"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <div
                class="flex items-center gap-1"
                :class="{
                  'justify-end': (header.column.columnDef.meta as ColumnMeta)?.align === 'right',
                  'justify-center': (header.column.columnDef.meta as ColumnMeta)?.align === 'center',
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

        <!-- Loading skeleton -->
        <tbody v-if="!firstDataLoaded && loading" class="bg-white">
          <tr
            v-for="i in 10"
            :key="`skeleton-${i}`"
            class="flex w-full animate-pulse border-b border-neutral-200"
          >
            <td
              v-for="header in table.getHeaderGroups()[0]?.headers"
              :key="`${header.id}-skeleton`"
              class="px-6 py-4"
              :style="{ width: `${header.getSize()}px` }"
            >
              <div class="h-5 w-full rounded bg-neutral-200" />
            </td>
          </tr>
        </tbody>

        <!-- Virtual rows -->
        <tbody
          v-else
          class="bg-white relative"
          :style="{ display: 'grid', height: `${totalSize}px` }"
        >
          <template v-for="virtualRow in virtualRows" :key="virtualRow.index">
            <tr
              v-if="rows[virtualRow.index]"
              :ref="(el) => measureElement(el as Element)"
              class="flex w-full border-b border-neutral-200 hover:bg-primary-50 transition-colors absolute"
              :class="{
                'bg-primary-50': activeId && getRowId(rows[virtualRow.index]!.original) === activeId,
                'cursor-pointer': clickable,
              }"
              :style="{
                transform: `translateY(${virtualRow.start}px)`,
                width: '100%',
              }"
              :data-index="virtualRow.index"
              @click="clickable && rows[virtualRow.index] ? $emit('click:row', rows[virtualRow.index]!) : undefined"
            >
              <td
                v-for="cell in rows[virtualRow.index]!.getVisibleCells()"
                :key="cell.id"
                class="flex items-center px-6 py-4 text-sm"
                :class="{
                  'justify-end': (cell.column.columnDef.meta as ColumnMeta)?.align === 'right',
                  'justify-center': (cell.column.columnDef.meta as ColumnMeta)?.align === 'center',
                }"
                :style="{ width: `${cell.column.getSize()}px` }"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Append slot for loading indicator -->
      <div v-if="$slots.append" class="sticky left-0">
        <slot name="append" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="firstDataLoaded && !loading && rows.length === 0"
      class="absolute inset-0 flex items-center justify-center"
    >
      <slot name="empty">
        <p class="text-neutral-500">No data found</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type Column,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/vue-table'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useDebounceFn } from '@vueuse/core'

interface ColumnMeta {
  align?: 'left' | 'right' | 'center'
}

const props = withDefaults(defineProps<{
  data: T[]
  columns: ColumnDef<T, any>[]
  height: number
  loading?: boolean
  firstDataLoaded?: boolean
  activeId?: string | null
  clickable?: boolean
  overscan?: number
  rowHeight?: number
  getRowId?: (row: T) => string
}>(), {
  loading: false,
  firstDataLoaded: true,
  activeId: null,
  clickable: true,
  overscan: 15,
  rowHeight: 57,
  getRowId: (row: T) => (row as any).id,
})

const sorting = defineModel<SortingState>('sorting', { default: () => [] })

const emit = defineEmits<{
  'click:row': [row: Row<T>]
  'load-more': []
}>()

// TanStack Table
const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualSorting: true,
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
  getRowId: (row) => props.getRowId(row),
})

const rows = computed(() => table.getRowModel().rows)

// Virtual scrolling
const tableContainerRef = ref<HTMLElement | null>(null)

const rowVirtualizer = useVirtualizer(computed(() => ({
  count: rows.value.length,
  estimateSize: () => props.rowHeight,
  getScrollElement: () => tableContainerRef.value,
  overscan: props.overscan,
})))

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

function measureElement(el: Element | null): void {
  if (!el) return
  rowVirtualizer.value.measureElement(el)
}

// Scroll handler for infinite loading
const onVirtualScroll = useDebounceFn((event: Event) => {
  const el = event.target as HTMLElement
  const buffer = 50 // pixels from bottom to trigger load

  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= buffer

  if (atBottom && !props.loading) {
    emit('load-more')
  }
}, 600)

// Sort icon helper
function getSortIcon(column: Column<T, unknown>): string {
  const sortDir = column.getIsSorted()
  if (!sortDir) return 'heroicons:chevron-up-down'
  return sortDir === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}

// Expose table for external access
defineExpose({ table })
</script>
