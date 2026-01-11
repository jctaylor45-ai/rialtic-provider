<script setup lang="ts">
/**
 * Chip/Badge component aligned with console-ui @rialtic/ui
 * Used for status indicators, tags, and labels
 */
import { computed } from 'vue'

export interface ChipColorConfig {
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
    size?: 'sm' | 'md'
    removable?: boolean
    colorConfig?: ChipColorConfig
  }>(),
  {
    variant: 'default',
    size: 'md',
  },
)

defineEmits<{
  remove: []
}>()

const variantClasses = computed(() => {
  if (props.colorConfig) {
    return [
      props.colorConfig.backgroundColor,
      props.colorConfig.borderColor ? `border ${props.colorConfig.borderColor}` : '',
      props.colorConfig.textColor,
    ].filter(Boolean).join(' ')
  }

  switch (props.variant) {
    case 'success':
      return 'bg-success-100 text-success-700 border border-success-300'
    case 'error':
      return 'bg-error-100 text-error-700 border border-error-300'
    case 'warning':
      return 'bg-warning-100 text-warning-700 border border-warning-300'
    case 'info':
      return 'bg-secondary-100 text-secondary-700 border border-secondary-300'
    case 'neutral':
      return 'bg-neutral-100 text-neutral-700 border border-neutral-300'
    default:
      return 'bg-primary-100 text-primary-700 border border-primary-300'
  }
})

const sizeClasses = computed(() => {
  return props.size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap"
    :class="[variantClasses, sizeClasses]"
  >
    <span>{{ label }}</span>
    <button
      v-if="removable"
      type="button"
      class="ml-1 rounded-full hover:bg-neutral-200 p-0.5 transition-colors"
      aria-label="Remove"
      @click.stop="$emit('remove')"
    >
      <Icon name="heroicons:x-mark" class="w-3 h-3" />
    </button>
  </span>
</template>
