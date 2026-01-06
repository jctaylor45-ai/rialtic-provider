<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <main class="ml-64 flex-1 overflow-hidden flex flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Initialize the app store and load data
const appStore = useAppStore()

onMounted(async () => {
  await appStore.initialize()
})
</script>
