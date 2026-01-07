<script setup lang="ts">
/**
 * SlideDown transition component
 * Animates content sliding down from above
 */
defineOptions({ name: 'TransitionSlideDown' })
</script>

<template>
  <Transition
    name="slide-down"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <slot />
  </Transition>
</template>
