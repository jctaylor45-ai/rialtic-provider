<script setup lang="ts">
/**
 * Tabs component
 * Accessible tabs with panel content
 */
export interface Tab {
  id: string
  label: string
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  tabs: Tab[]
  modelValue: string
  variant?: 'default' | 'pills' | 'bordered'
}>(), {
  variant: 'default',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

defineOptions({ name: 'UiTabs' })

const selectTab = (tab: Tab) => {
  if (!tab.disabled) {
    emit('update:modelValue', tab.id)
  }
}

// Tab button classes
const tabClasses = (tab: Tab) => {
  const isActive = props.modelValue === tab.id
  const base = 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'

  if (tab.disabled) {
    return `${base} text-neutral-400 cursor-not-allowed`
  }

  switch (props.variant) {
    case 'pills':
      return isActive
        ? `${base} bg-primary-600 text-white rounded-lg shadow-sm`
        : `${base} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg`
    case 'bordered':
      return isActive
        ? `${base} text-primary-600 border-b-2 border-primary-600 -mb-px bg-white`
        : `${base} text-neutral-600 hover:text-neutral-900 border-b-2 border-transparent -mb-px`
    default:
      return isActive
        ? `${base} text-primary-700 bg-primary-50 rounded-lg`
        : `${base} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg`
  }
}

// Container classes based on variant
const containerClasses = computed(() => {
  switch (props.variant) {
    case 'bordered':
      return 'flex border-b border-neutral-200'
    case 'pills':
      return 'flex gap-1 p-1 bg-neutral-100 rounded-lg'
    default:
      return 'flex gap-1'
  }
})
</script>

<template>
  <div>
    <!-- Tab List -->
    <div :class="containerClasses" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :id="`tab-${tab.id}`"
        :tabindex="modelValue === tab.id ? 0 : -1"
        :class="tabClasses(tab)"
        @click="selectTab(tab)"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="mt-4">
      <template v-for="tab in tabs" :key="tab.id">
        <div
          v-show="modelValue === tab.id"
          :id="`panel-${tab.id}`"
          role="tabpanel"
          :aria-labelledby="`tab-${tab.id}`"
          :tabindex="0"
        >
          <slot :name="tab.id" />
        </div>
      </template>
    </div>
  </div>
</template>
