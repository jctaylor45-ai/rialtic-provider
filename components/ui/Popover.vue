<script setup lang="ts">
/**
 * Popover component using Floating UI
 * Provides accessible popovers with smart positioning
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

const props = withDefaults(defineProps<{
  placement?: Placement
  trigger?: 'click' | 'hover'
  closeOnClickOutside?: boolean
}>(), {
  placement: 'bottom-start',
  trigger: 'click',
  closeOnClickOutside: true,
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
}>()

defineOptions({ name: 'UiPopover' })

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
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
  }
)

// Close on click outside
onClickOutside(floatingEl, (event) => {
  if (props.closeOnClickOutside && !referenceEl.value?.contains(event.target as Node)) {
    close()
  }
})

const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

const open = () => {
  isOpen.value = true
  emit('open')
}

const close = () => {
  isOpen.value = false
  emit('close')
}

// Handle hover trigger
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

const handleMouseEnter = () => {
  if (props.trigger !== 'hover') return
  if (hoverTimeout) clearTimeout(hoverTimeout)
  open()
}

const handleMouseLeave = () => {
  if (props.trigger !== 'hover') return
  hoverTimeout = setTimeout(close, 150)
}

onUnmounted(() => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
})

// Expose methods
defineExpose({ open, close, toggle, isOpen })
</script>

<template>
  <div class="inline-block">
    <!-- Trigger -->
    <div
      ref="referenceEl"
      @click="trigger === 'click' && toggle()"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <slot name="trigger" :is-open="isOpen" />
    </div>

    <!-- Popover Content -->
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
          class="z-50 bg-white border border-neutral-200 rounded-lg shadow-lg"
          :style="floatingStyles"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <slot :close="close" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
