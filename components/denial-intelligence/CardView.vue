<template>
  <div class="space-y-4">
    <template v-for="item in items" :key="item.id">
      <PatternCard
        v-if="item.type === 'active'"
        :pattern="item.pattern"
        @click="$emit('select', item)"
        @view-claims="$emit('viewClaims', item)"
        @view-details="$emit('select', item)"
        @record-action="$emit('recordAction', item)"
      />
      <DenialIntelligencePolicyCard
        v-else
        :item="item"
        @click="$emit('select', item)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DenialIntelligenceItem } from '~/types/denial-intelligence'

defineProps<{
  items: DenialIntelligenceItem[]
}>()

defineEmits<{
  select: [item: DenialIntelligenceItem]
  viewClaims: [item: DenialIntelligenceItem]
  recordAction: [item: DenialIntelligenceItem]
}>()
</script>
