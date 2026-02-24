<template>
  <div class="flex flex-col h-full">
    <!-- Drawer Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
      <h2 class="text-lg font-semibold text-neutral-900 truncate pr-4">
        {{ item.title }}
      </h2>
      <button
        @click="$emit('close')"
        class="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        <Icon name="heroicons:x-mark" class="w-5 h-5" />
      </button>
    </div>

    <!-- Inactive policy banner -->
    <div
      v-if="item.type === 'inactive'"
      class="mx-6 mt-4 p-3 bg-success-50 border border-success-200 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <Icon name="heroicons:check-circle" class="w-5 h-5 text-success-600" />
        <span class="text-sm font-medium text-success-800">
          This policy has not triggered any denials for this practice
        </span>
      </div>
    </div>

    <!-- Tabs for active items -->
    <div v-if="item.type === 'active'" class="flex flex-col flex-1 overflow-hidden">
      <div class="px-6 pt-4 flex-shrink-0">
        <UiTabs
          :tabs="activeTabs"
          :model-value="activeTab"
          variant="bordered"
          @update:model-value="activeTab = $event"
        >
          <template #issue-details>
            <div class="overflow-y-auto" style="max-height: calc(100vh - 180px)">
              <InsightsInsightDetailsContent
                :pattern-id="item.pattern.id"
                @close="$emit('close')"
                @view-claims="$emit('viewClaims', item)"
                @record-action="$emit('recordAction', item)"
              />
            </div>
          </template>

          <template #policy-reference>
            <div class="overflow-y-auto" style="max-height: calc(100vh - 180px)">
              <template v-if="item.policies.length > 0">
                <div v-for="(policy, idx) in item.policies" :key="policy.id">
                  <div
                    v-if="item.policies.length > 1"
                    class="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700"
                  >
                    Policy {{ idx + 1 }} of {{ item.policies.length }}: {{ policy.name }}
                  </div>
                  <PoliciesPolicyDetailsContent
                    :policy="policy"
                    @close="$emit('close')"
                  />
                </div>
              </template>
              <div v-else class="p-8 text-center text-neutral-500">
                <Icon name="heroicons:document-text" class="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                <p class="text-sm">No linked policies found</p>
              </div>
            </div>
          </template>
        </UiTabs>
      </div>
    </div>

    <!-- Single tab for inactive items -->
    <div v-else class="flex-1 overflow-y-auto">
      <PoliciesPolicyDetailsContent
        :policy="item.policy"
        @close="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DenialIntelligenceItem } from '~/types/denial-intelligence'
import type { Tab } from '~/components/ui/Tabs.vue'

defineProps<{
  item: DenialIntelligenceItem
}>()

defineEmits<{
  close: []
  viewClaims: [item: DenialIntelligenceItem]
  recordAction: [item: DenialIntelligenceItem]
}>()

const activeTab = ref('issue-details')

const activeTabs: Tab[] = [
  { id: 'issue-details', label: 'Issue Details', icon: 'heroicons:shield-exclamation' },
  { id: 'policy-reference', label: 'Policy Reference', icon: 'heroicons:document-text' },
]
</script>
