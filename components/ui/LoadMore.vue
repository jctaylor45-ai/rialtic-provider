<template>
  <div class="flex items-center justify-center py-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-2 text-neutral-600">
      <UiLoading size="sm" />
      <span class="text-sm">Loading more...</span>
    </div>

    <!-- All loaded state -->
    <div v-else-if="loadedAll" class="text-sm text-neutral-500">
      <span v-if="(total ?? 0) > 0">
        All {{ total }} {{ total === 1 ? 'item' : 'items' }} loaded
      </span>
      <span v-else>No items to load</span>
    </div>

    <!-- Progress indicator (when not loading and not all loaded) -->
    <div v-else-if="(loaded ?? 0) > 0 && (total ?? 0) > 0" class="text-sm text-neutral-500">
      Loaded {{ loaded }} of {{ total }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { loading = false, loadedAll = false, total = 0, loaded = 0 } = defineProps<{
  loading?: boolean
  loadedAll?: boolean
  total?: number
  loaded?: number
}>()
</script>
