<template>
  <span
    v-if="status !== 'untested' || showUntested"
    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
    :class="statusClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: 'approved' | 'denied' | 'pending' | 'new' | 'untested' | 'improved'
  showUntested?: boolean
}>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'approved':
      return 'bg-success-100 text-success-700'
    case 'improved':
      return 'bg-success-100 text-success-700'
    case 'denied':
      return 'bg-error-100 text-error-700'
    case 'pending':
      return 'bg-warning-100 text-warning-700'
    case 'new':
      return 'bg-primary-100 text-primary-700'
    case 'untested':
      return 'bg-neutral-100 text-neutral-600'
    default:
      return 'bg-neutral-100 text-neutral-600'
  }
})

const dotClass = computed(() => {
  switch (props.status) {
    case 'approved':
      return 'bg-success-500'
    case 'improved':
      return 'bg-success-500'
    case 'denied':
      return 'bg-error-500'
    case 'pending':
      return 'bg-warning-500'
    case 'new':
      return 'bg-primary-500'
    case 'untested':
      return 'bg-neutral-400'
    default:
      return 'bg-neutral-400'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'approved':
      return 'Approved'
    case 'improved':
      return 'Fixed'
    case 'denied':
      return 'Denied'
    case 'pending':
      return 'Pending'
    case 'new':
      return 'New'
    case 'untested':
      return 'Untested'
    default:
      return props.status
  }
})
</script>
