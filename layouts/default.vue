<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <main class="ml-64 flex-1 overflow-hidden flex flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Initialize all stores and load data
const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()
const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  // Initialize all stores in parallel
  await Promise.all([
    appStore.initialize(),
    patternsStore.loadPatterns(),
    eventsStore.loadEvents(),
    analyticsStore.initialize(),
  ])

  // Load user events from localStorage
  eventsStore.loadUserEvents()
})
</script>
