<script setup lang="ts">
/**
 * StatusBadge component for claim and pattern statuses
 * Pre-configured variants for common status values
 */
import { computed } from 'vue'

const props = defineProps<{
  status: string
  size?: 'sm' | 'md'
}>()

const statusConfig = computed(() => {
  const statusLower = props.status.toLowerCase()

  switch (statusLower) {
    case 'paid':
    case 'approved':
    case 'resolved':
    case 'completed':
      return {
        bg: 'bg-success-100',
        text: 'text-success-700',
        border: 'border-success-300',
      }
    case 'denied':
    case 'rejected':
    case 'failed':
    case 'critical':
      return {
        bg: 'bg-error-100',
        text: 'text-error-700',
        border: 'border-error-300',
      }
    case 'pending':
    case 'in_progress':
    case 'processing':
      return {
        bg: 'bg-warning-100',
        text: 'text-warning-700',
        border: 'border-warning-300',
      }
    case 'active':
    case 'new':
    case 'info':
      return {
        bg: 'bg-secondary-100',
        text: 'text-secondary-700',
        border: 'border-secondary-300',
      }
    default:
      return {
        bg: 'bg-neutral-100',
        text: 'text-neutral-700',
        border: 'border-neutral-300',
      }
  }
})

const sizeClasses = computed(() => {
  return props.size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs'
})

const displayLabel = computed(() => {
  return props.status.charAt(0).toUpperCase() + props.status.slice(1).toLowerCase().replace('_', ' ')
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium border"
    :class="[statusConfig.bg, statusConfig.text, statusConfig.border, sizeClasses]"
  >
    {{ displayLabel }}
  </span>
</template>
