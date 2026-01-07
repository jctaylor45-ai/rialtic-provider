<script setup lang="ts">
/**
 * Card component aligned with console-ui patterns
 * Standard container with consistent styling
 */
defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: boolean
  hoverable?: boolean
}>()

defineOptions({ name: 'UiCard' })
</script>

<template>
  <div
    class="bg-white rounded-lg border border-neutral-200"
    :class="{
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md' || !padding,
      'p-8': padding === 'lg',
      'shadow-sm': shadow !== false,
      'hover:border-primary-300 hover:shadow-md transition-all cursor-pointer': hoverable,
    }"
  >
    <slot />
  </div>
</template>
