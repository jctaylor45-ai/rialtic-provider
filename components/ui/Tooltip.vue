<script setup lang="ts">
/**
 * Simple tooltip component
 * Shows tooltip on hover/focus
 */
import { ref } from 'vue'

defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  disabled?: boolean
}>()

defineOptions({ name: 'UiTooltip' })

const isVisible = ref(false)

const show = () => {
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
}
</script>

<template>
  <div
    class="relative inline-block"
    @mouseenter="!disabled && show()"
    @mouseleave="hide()"
    @focusin="!disabled && show()"
    @focusout="hide()"
  >
    <slot />
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible && !disabled"
        class="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-neutral-900 rounded shadow-lg whitespace-nowrap"
        :class="{
          'bottom-full left-1/2 -translate-x-1/2 mb-2': position === 'top' || !position,
          'top-full left-1/2 -translate-x-1/2 mt-2': position === 'bottom',
          'right-full top-1/2 -translate-y-1/2 mr-2': position === 'left',
          'left-full top-1/2 -translate-y-1/2 ml-2': position === 'right',
        }"
        role="tooltip"
      >
        {{ text }}
        <!-- Arrow -->
        <div
          class="absolute w-2 h-2 bg-neutral-900 transform rotate-45"
          :class="{
            'top-full left-1/2 -translate-x-1/2 -mt-1': position === 'top' || !position,
            'bottom-full left-1/2 -translate-x-1/2 -mb-1': position === 'bottom',
            'left-full top-1/2 -translate-y-1/2 -ml-1': position === 'left',
            'right-full top-1/2 -translate-y-1/2 -mr-1': position === 'right',
          }"
        />
      </div>
    </Transition>
  </div>
</template>
