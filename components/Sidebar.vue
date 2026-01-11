<template>
  <div class="fixed left-0 top-0 h-screen w-64 bg-neutral-900 text-white flex flex-col">
    <!-- Logo Section -->
    <div class="p-6 border-b border-neutral-700">
      <img
        src="/assets/rialtic_logo_white.svg"
        alt="Rialtic"
        class="h-8 w-auto"
      />
    </div>

    <!-- Practice Selector -->
    <div class="p-4">
      <select
        v-model="selectedPractice"
        class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-sm"
      >
        <option value="practice-1">Main Practice</option>
      </select>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.id"
        :to="item.path"
        class="w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm transition-colors no-underline"
        :class="isActive(item.path)
          ? 'bg-primary-600 text-white'
          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'"
      >
        <Icon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Admin Section -->
    <div class="p-4 border-t border-neutral-700">
      <div class="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide mb-2">
        <Icon name="heroicons:cog-6-tooth" class="w-4 h-4" />
        <span>Admin</span>
      </div>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in adminItems"
          :key="item.id"
          :to="item.path"
          class="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors no-underline"
          :class="isActive(item.path)
            ? 'bg-neutral-700 text-white'
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'"
        >
          <Icon :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
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

const adminItems = [
  { id: 'config', label: 'Configuration', icon: 'heroicons:adjustments-horizontal', path: '/admin/config' },
  { id: 'data-source', label: 'Data Source', icon: 'heroicons:server-stack', path: '/admin/data-source' },
  { id: 'database', label: 'Database', icon: 'heroicons:circle-stack', path: '/admin/database' },
  { id: 'scenario-builder', label: 'Scenario Builder', icon: 'heroicons:wrench-screwdriver', path: '/admin/scenario-builder' },
]

function isActive(path: string): boolean {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
