<script setup lang="ts">
/**
 * Fade transition component aligned with console-ui @rialtic/ui
 * Provides smooth opacity transitions for showing/hiding elements
 */
import { computed } from 'vue'

const props = defineProps<{
  appear?: boolean
  appearActiveClass?: string
  enterActiveClass?: string
  leaveActiveClass?: string
  duration?: number
  mode?: 'default' | 'out-in' | 'in-out'
}>()

defineOptions({ name: 'TransitionFade' })

const durationClass = computed(() => {
  if (props.duration) {
    return `duration-${props.duration}`
  }
  return 'duration-200'
})

const classes = computed(() => ({
  appear: !!props.appear,
  mode: props.mode,
  ...(props.appear
    ? {
        appearActiveClass: `transition-opacity ${props.appearActiveClass || durationClass.value}`,
        appearFromClass: 'opacity-0',
        appearToClass: 'opacity-100',
      }
    : null),
  enterActiveClass: `transition-opacity ${props.enterActiveClass || durationClass.value}`,
  enterFromClass: 'opacity-0',
  enterToClass: 'opacity-100',
  leaveActiveClass: `transition-opacity ${props.leaveActiveClass || durationClass.value}`,
  leaveFromClass: 'opacity-100',
  leaveToClass: 'opacity-0',
}))
</script>

<template>
  <Transition v-bind="classes" name="fade">
    <slot />
  </Transition>
</template>
