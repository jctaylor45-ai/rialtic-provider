<template>
  <div class="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-600 to-primary-700 text-white flex flex-col">
    <div class="p-6">
      <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
        <span class="text-primary-600 font-bold text-2xl">R</span>
      </div>

      <select
        v-model="selectedPractice"
        class="w-full px-3 py-2 bg-primary-500 border border-primary-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white mb-6"
      >
        <option value="practice-1">Main Practice</option>
      </select>
    </div>

    <nav class="flex-1 px-3">
      <NuxtLink
        v-for="item in navItems"
        :key="item.id"
        :to="item.path"
        class="w-full flex items-center gap-3 px-3 py-3 mb-1 rounded-lg text-sm transition-colors no-underline"
        :class="isActive(item.path) ? 'bg-primary-500 text-white' : 'text-primary-100 hover:bg-primary-500/50'"
      >
        <Icon :name="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="p-6 border-t border-primary-500">
      <button class="flex items-center gap-2 text-primary-100 hover:text-white text-sm transition-colors">
        <Icon name="heroicons:book-open" class="w-4 h-4" />
        <span>Product Guide</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const selectedPractice = ref('practice-1')

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'heroicons:squares-2x2', path: '/' },
  { id: 'policies', label: 'Policies', icon: 'heroicons:document-text', path: '/policies' },
  { id: 'claims', label: 'Claims', icon: 'heroicons:clipboard-document-list', path: '/claims' },
  { id: 'insights', label: 'Insights', icon: 'heroicons:light-bulb', path: '/insights' },
  { id: 'claim-lab', label: 'Claim Lab', icon: 'heroicons:beaker', path: '/claim-lab' },
  { id: 'impact', label: 'Impact', icon: 'heroicons:chart-bar', path: '/impact' },
]

function isActive(path: string): boolean {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}
</script>

<style scoped>
/* Override NuxtLink default styling */
a {
  text-decoration: none;
}
</style>
