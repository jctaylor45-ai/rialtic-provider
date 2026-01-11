<script setup lang="ts">
/**
 * Skeleton loader for generic cards
 * Shows animated placeholder content
 */
defineProps<{
  lines?: number
  showHeader?: boolean
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 animate-pulse">
    <!-- Header -->
    <div v-if="showHeader !== false" class="flex items-center justify-between mb-4">
      <div class="h-5 w-32 rounded bg-neutral-200" />
      <div class="h-4 w-16 rounded bg-neutral-200" />
    </div>
    <!-- Content lines -->
    <div class="space-y-3">
      <div
        v-for="line in (lines || 3)"
        :key="`line-${line}`"
        class="h-4 rounded bg-neutral-200"
        :class="line === (lines || 3) ? 'w-3/4' : 'w-full'"
      />
    </div>
  </div>
</template>
