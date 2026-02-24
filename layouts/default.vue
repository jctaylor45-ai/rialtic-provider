<template>
  <div class="flex flex-col h-screen">
    <PrototypeBanner />
    <div class="flex flex-1 mt-9">
      <Sidebar />
      <main class="ml-64 flex-1 overflow-y-auto flex flex-col bg-neutral-50">
        <slot />
      </main>
    </div>
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
