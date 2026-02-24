<template>
  <div
    class="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer opacity-70"
    @click="$emit('click', item)"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-start gap-3 flex-1">
        <div class="p-2 rounded-lg bg-neutral-100">
          <Icon name="heroicons:document-text" class="w-5 h-5 text-neutral-500" />
        </div>
        <div class="flex-1">
          <h3 class="text-base font-semibold text-neutral-900 mb-1">{{ item.title }}</h3>
          <p class="text-xs text-neutral-500">{{ item.policy.id }}</p>
        </div>
      </div>
      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
        Inactive
      </span>
    </div>

    <!-- Metadata -->
    <div class="flex items-center gap-4 mb-3">
      <span v-if="item.topic" class="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded">
        {{ item.topic }}
      </span>
      <span v-if="item.source" class="text-xs text-neutral-500">
        {{ item.source }}
      </span>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-3 gap-4">
      <div>
        <div class="text-xs text-neutral-500 mb-0.5">Applicable Codes</div>
        <div class="text-sm font-semibold text-neutral-900">{{ applicableCodeCount }}</div>
      </div>
      <div v-if="item.policy.hit_rate">
        <div class="text-xs text-neutral-500 mb-0.5">Hit Rate</div>
        <div class="text-sm font-semibold text-neutral-900">{{ formatPercentage(item.policy.hit_rate) }}</div>
      </div>
      <div v-if="item.policy.denial_rate">
        <div class="text-xs text-neutral-500 mb-0.5">Denial Rate</div>
        <div class="text-sm font-semibold text-neutral-900">{{ formatPercentage(item.policy.denial_rate) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InactiveDenialItem } from '~/types/denial-intelligence'

const props = defineProps<{
  item: InactiveDenialItem
}>()

defineEmits<{
  click: [item: InactiveDenialItem]
}>()

const applicableCodeCount = computed(() => {
  const details = props.item.policy.policy_details
  if (!details) return 0
  return (details.cpt_codes?.length || 0) +
    (details.hcpcs_codes?.length || 0) +
    (details.icd_codes?.length || 0)
})

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}
</script>
