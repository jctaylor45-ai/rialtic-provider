<script setup lang="ts">
/**
 * Dropdown menu component
 * Accessible dropdown with menu items
 */
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  type Placement,
} from '@floating-ui/vue'
import { onClickOutside } from '@vueuse/core'

export interface MenuItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

const props = withDefaults(defineProps<{
  items: MenuItem[]
  placement?: Placement
  width?: string
}>(), {
  placement: 'bottom-end',
  width: '12rem',
})

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
}>()

defineOptions({ name: 'UiDropdownMenu' })

const isOpen = ref(false)
const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(
  referenceEl,
  floatingEl,
  {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
    ],
  }
)

// Close on click outside
onClickOutside(floatingEl, (event) => {
  if (!referenceEl.value?.contains(event.target as Node)) {
    isOpen.value = false
  }
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const selectItem = (item: MenuItem) => {
  if (item.disabled || item.divider) return
  emit('select', item)
  isOpen.value = false
}

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

// Item classes
const itemClasses = (item: MenuItem) => {
  if (item.divider) return ''

  const base = 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors'

  if (item.disabled) {
    return `${base} text-neutral-400 cursor-not-allowed`
  }

  if (item.danger) {
    return `${base} text-error-600 hover:bg-error-50`
  }

  return `${base} text-neutral-700 hover:bg-neutral-100`
}

// Expose methods
const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }

defineExpose({ open, close, toggle, isOpen })
</script>

<template>
  <div class="inline-block" @keydown="handleKeyDown">
    <!-- Trigger -->
    <div ref="referenceEl" @click="toggle">
      <slot name="trigger" :is-open="isOpen" />
    </div>

    <!-- Menu -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="floatingEl"
          class="z-50 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
          :style="{ ...floatingStyles, width }"
          role="menu"
        >
          <template v-for="item in items" :key="item.id">
            <!-- Divider -->
            <div
              v-if="item.divider"
              class="my-1 border-t border-neutral-200"
              role="separator"
            />

            <!-- Menu Item -->
            <button
              v-else
              type="button"
              role="menuitem"
              :disabled="item.disabled"
              :class="itemClasses(item)"
              @click="selectItem(item)"
            >
              <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
