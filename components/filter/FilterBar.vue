<script setup lang="ts">
/**
 * Filter bar component
 * Horizontal bar containing filter controls with clear all functionality
 */
defineProps<{
  activeFilterCount?: number
}>()

const emit = defineEmits<{
  (e: 'clear-all'): void
}>()

defineOptions({ name: 'FilterBar' })
</script>

<template>
  <div class="flex items-center gap-3 py-3 px-4 bg-neutral-50 rounded-lg border border-neutral-200">
    <!-- Filter Icon -->
    <div class="flex items-center gap-2 text-neutral-600">
      <Icon name="heroicons:funnel" class="w-5 h-5" />
      <span class="text-sm font-medium">Filters</span>
    </div>

    <!-- Divider -->
    <div class="w-px h-6 bg-neutral-300" />

    <!-- Filter Controls Slot -->
    <div class="flex-1 flex flex-wrap items-center gap-2">
      <slot />
    </div>

    <!-- Clear All Button -->
    <button
      v-if="activeFilterCount && activeFilterCount > 0"
      type="button"
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
      @click="emit('clear-all')"
    >
      <Icon name="heroicons:x-mark" class="w-4 h-4" />
      <span>Clear all ({{ activeFilterCount }})</span>
    </button>
  </div>
</template>
