<script setup lang="ts">
/**
 * Skeleton loader for stat/metric cards
 * Aligned with console-ui @rialtic/ui
 */
defineOptions({ name: 'SkeletonStat' })
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 animate-pulse">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="h-4 w-24 rounded bg-neutral-200 mb-3" />
        <div class="h-8 w-32 rounded bg-neutral-200 mb-2" />
        <div class="h-3 w-20 rounded bg-neutral-200" />
      </div>
      <div class="h-10 w-10 rounded-lg bg-neutral-200" />
    </div>
  </div>
</template>
