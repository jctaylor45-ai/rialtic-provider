<script setup lang="ts">
/**
 * Navigation tabs component
 * Horizontal tabs for page-level or section navigation
 */
export interface NavTab {
  id: string
  label: string
  to?: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}

const props = defineProps<{
  tabs: NavTab[]
  modelValue?: string
  variant?: 'default' | 'pills' | 'underline'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

defineOptions({ name: 'NavTabs' })

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value!),
})

// For route-based tabs
const route = useRoute()
const isActive = (tab: NavTab) => {
  if (tab.to) {
    return route.path === tab.to
  }
  return activeTab.value === tab.id
}

const handleClick = (tab: NavTab) => {
  if (tab.disabled) return
  if (!tab.to) {
    activeTab.value = tab.id
  }
}

// Variant classes
const tabClasses = (tab: NavTab) => {
  const base = 'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors'
  const active = isActive(tab)
  const disabled = tab.disabled

  if (disabled) {
    return `${base} text-neutral-400 cursor-not-allowed`
  }

  switch (props.variant) {
    case 'pills':
      return active
        ? `${base} bg-primary-600 text-white rounded-lg`
        : `${base} text-neutral-600 hover:bg-neutral-100 rounded-lg`
    case 'underline':
      return active
        ? `${base} text-primary-600 border-b-2 border-primary-600 -mb-px`
        : `${base} text-neutral-600 hover:text-neutral-900 border-b-2 border-transparent -mb-px`
    default:
      return active
        ? `${base} text-primary-700 bg-primary-50 rounded-lg`
        : `${base} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg`
  }
}
</script>

<template>
  <nav
    class="flex"
    :class="{
      'gap-1': variant !== 'underline',
      'border-b border-neutral-200': variant === 'underline',
    }"
  >
    <component
      :is="tab.to ? 'NuxtLink' : 'button'"
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      :disabled="tab.disabled"
      :class="tabClasses(tab)"
      @click="handleClick(tab)"
    >
      <Icon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.badge"
        class="px-1.5 py-0.5 text-xs font-medium rounded-full"
        :class="{
          'bg-white/20 text-white': isActive(tab) && variant === 'pills',
          'bg-primary-100 text-primary-700': isActive(tab) && variant !== 'pills',
          'bg-neutral-200 text-neutral-600': !isActive(tab),
        }"
      >
        {{ tab.badge }}
      </span>
    </component>
  </nav>
</template>
