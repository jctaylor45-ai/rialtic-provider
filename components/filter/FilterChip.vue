<script setup lang="ts">
/**
 * Filter chip component
 * Displays selected filter values as removable chips
 */
const props = defineProps<{
  label: string
  value?: string
  removable?: boolean
  active?: boolean
}>()

const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'click'): void
}>()

defineOptions({ name: 'FilterChip' })
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm cursor-pointer transition-colors"
    :class="{
      'bg-primary-100 text-primary-700 border border-primary-200': active,
      'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200': !active,
    }"
    @click="emit('click')"
  >
    <span class="font-medium">{{ label }}</span>
    <span v-if="value" class="text-neutral-500">{{ value }}</span>
    <button
      v-if="removable"
      type="button"
      class="ml-0.5 p-0.5 rounded-full hover:bg-neutral-300/50 transition-colors"
      @click.stop="emit('remove')"
    >
      <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
