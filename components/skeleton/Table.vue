<script setup lang="ts">
/**
 * Skeleton loader for tables
 * Shows animated placeholder rows
 */
defineProps<{
  rows?: number
  columns?: number
}>()

defineOptions({ name: 'SkeletonTable' })
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
    <!-- Header -->
    <div class="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
      <div class="flex gap-4">
        <div
          v-for="col in (columns || 4)"
          :key="`header-${col}`"
          class="h-4 rounded bg-neutral-200"
          :class="col === 1 ? 'w-32' : 'w-24'"
        />
      </div>
    </div>
    <!-- Rows -->
    <div class="divide-y divide-neutral-200">
      <div
        v-for="row in (rows || 5)"
        :key="`row-${row}`"
        class="px-6 py-4"
      >
        <div class="flex gap-4 items-center">
          <div
            v-for="col in (columns || 4)"
            :key="`row-${row}-col-${col}`"
            class="h-4 rounded bg-neutral-200"
            :class="col === 1 ? 'w-40' : col === 2 ? 'w-32' : 'w-20'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
