<template>
  <div class="fixed left-0 top-9 h-[calc(100vh-2.25rem)] w-64 bg-neutral-900 text-white flex flex-col">
    <!-- Prototype Switcher -->
    <div class="relative border-b border-neutral-700">
      <button
        class="w-full p-4 flex items-center gap-3 hover:bg-neutral-800 transition-colors text-left"
        @click="dropdownOpen = !dropdownOpen"
      >
        <img
          src="/assets/rialtic_logo_white.svg"
          alt="Rialtic"
          class="h-7 w-auto"
        />
        <Icon name="heroicons:chevron-up-down" class="w-4 h-4 text-neutral-400 ml-auto" />
      </button>

      <!-- Dropdown Panel -->
      <div
        v-if="dropdownOpen"
        ref="dropdownRef"
        class="absolute top-full left-0 right-0 bg-neutral-800 border-b border-neutral-700 shadow-lg z-50"
      >
        <div class="p-2">
          <div class="text-xs text-neutral-500 font-medium uppercase tracking-wide px-3 py-2">
            Prototypes
          </div>
          <button
            v-for="proto in prototypes"
            :key="proto.id"
            class="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
            :class="proto.enabled
              ? 'hover:bg-neutral-700 cursor-pointer'
              : 'opacity-50 cursor-default'"
            :disabled="!proto.enabled"
            @click="selectPrototype(proto)"
          >
            <Icon :name="proto.icon" class="w-5 h-5 mt-0.5 flex-shrink-0 text-neutral-300" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-white truncate">{{ proto.name }}</span>
                <Icon
                  v-if="activePrototype.id === proto.id"
                  name="heroicons:check-circle-solid"
                  class="w-4 h-4 text-success-500 flex-shrink-0"
                />
                <span
                  v-if="!proto.enabled"
                  class="text-xs px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400 flex-shrink-0"
                >
                  Coming Soon
                </span>
              </div>
              <p class="text-xs text-neutral-400 mt-0.5">{{ proto.description }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Practice Selector -->
    <div class="p-4">
      <select
        :value="appStore.selectedPracticeId || ''"
        class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-sm"
        @change="onPracticeChange"
      >
        <option value="">All Practices</option>
        <option
          v-for="practice in appStore.practices"
          :key="practice.id"
          :value="practice.id"
        >
          {{ practice.name }}
        </option>
      </select>
      <!-- Time Range Selector -->
      <select
        :value="appStore.selectedTimeRange"
        class="w-full mt-2 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-sm"
        @change="onTimeRangeChange"
      >
        <option :value="30">Last 30 days</option>
        <option :value="60">Last 60 days</option>
        <option :value="90">Last 90 days</option>
        <option :value="180">Last 180 days</option>
        <option :value="365">Last 365 days</option>
      </select>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 overflow-y-auto">
      <NuxtLink
        v-for="item in activeNav.main"
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
    <div v-if="activeNav.admin.length" class="p-4 border-t border-neutral-700">
      <div class="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide mb-2">
        <Icon name="heroicons:cog-6-tooth" class="w-4 h-4" />
        <span>Admin</span>
      </div>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in activeNav.admin"
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
const { prototypes, activePrototype, activeNav, navigateToPrototype } = usePrototypes()
const appStore = useAppStore()
const patternsStore = usePatternsStore()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

async function onPracticeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  await appStore.setSelectedPractice(value || null)
  await patternsStore.loadPatterns()
}

async function onTimeRangeChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  await appStore.setTimeRange(value)
  await patternsStore.loadPatterns()
}

function selectPrototype(proto: { id: string; enabled: boolean }) {
  if (!proto.enabled) return
  navigateToPrototype(proto.id)
  dropdownOpen.value = false
}

function isActive(path: string): boolean {
  const prefix = activePrototype.value.routePrefix
  // Dashboard is exact match to the prefix
  if (path === prefix && route.path === prefix) return true
  if (path === prefix && route.path === prefix + '/') return true
  // Other items are prefix-match but not the root
  if (path !== prefix && route.path.startsWith(path)) return true
  return false
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (dropdownOpen.value && dropdownRef.value && !dropdownRef.value.parentElement?.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
