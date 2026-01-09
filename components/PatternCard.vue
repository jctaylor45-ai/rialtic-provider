<template>
  <div
    class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
    :class="[`border-${tierColor}-200`]"
    @click="$emit('click', pattern)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-start gap-3 flex-1">
        <div
          class="p-2 rounded-lg"
          :class="`bg-${tierColor}-100`"
        >
          <Icon :name="categoryIcon" :class="`text-${tierColor}-600`" class="w-6 h-6" />
        </div>

        <div class="flex-1">
          <h3 class="text-lg font-semibold text-neutral-900 mb-1">
            {{ pattern.title }}
          </h3>
          <p class="text-sm text-neutral-600 line-clamp-2">
            {{ pattern.description }}
          </p>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2 ml-4">
        <span
          class="px-2.5 py-1 text-xs font-medium rounded-full border"
          :class="tierBadgeClass"
        >
          {{ pattern.tier.toUpperCase() }}
        </span>
        <span
          class="px-2.5 py-1 text-xs font-medium rounded-full border"
          :class="recoveryStatusBadgeClass"
        >
          {{ recoveryStatusLabel }}
        </span>
        <span
          class="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"
        >
          {{ actionCategoryLabel }}
        </span>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div>
        <div class="text-xs text-neutral-500 mb-1">Frequency</div>
        <div class="text-lg font-semibold text-neutral-900">
          {{ pattern.score.frequency }}
        </div>
        <div class="text-xs text-neutral-500">
          occurrences
        </div>
      </div>

      <div>
        <div class="text-xs text-neutral-500 mb-1">Denied</div>
        <div class="text-lg font-semibold text-neutral-900">
          {{ formatCurrency(pattern.totalAtRisk) }}
        </div>
        <div class="text-xs text-neutral-500">
          ~{{ formatCurrency(pattern.avgDenialAmount) }} avg
        </div>
      </div>

      <div>
        <div class="text-xs text-neutral-500 mb-1">Trend</div>
        <div class="flex items-center gap-1" :class="trendColor">
          <Icon :name="trendIcon" class="w-5 h-5" />
          <span class="text-lg font-semibold capitalize">{{ pattern.score.trend }}</span>
        </div>
        <div class="text-xs text-neutral-500">
          {{ pattern.score.recency }}d since last
        </div>
      </div>
    </div>

    <!-- Improvements Summary -->
    <div v-if="latestImprovement" class="mb-4 p-3 bg-success-50 rounded-lg border border-success-200">
      <div class="flex items-center gap-2 mb-1">
        <Icon name="heroicons:arrow-trending-down" class="w-4 h-4 text-success-600" />
        <span class="text-sm font-medium text-success-800">Recent Improvement</span>
      </div>
      <p class="text-xs text-success-700">
        {{ latestImprovement.metric }}: {{ Math.abs(latestImprovement.percentChange) }}% reduction
        <span class="text-success-600">({{ formatDate(latestImprovement.date) }})</span>
      </p>
    </div>

    <!-- Recent Actions -->
    <div v-if="pattern.actions && pattern.actions.length > 0" class="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
      <div class="flex items-center gap-2 mb-2">
        <Icon name="heroicons:check-badge" class="w-4 h-4 text-primary-600" />
        <span class="text-sm font-medium text-primary-800">Actions Recorded</span>
      </div>
      <div class="space-y-1">
        <div
          v-for="action in pattern.actions.slice(-2)"
          :key="action.id"
          class="text-xs text-primary-700"
        >
          <span class="font-medium">{{ formatDate(action.timestamp) }}:</span>
          {{ getActionTypeLabel(action.actionType) }}
          <span v-if="action.notes" class="text-primary-600">- {{ action.notes }}</span>
        </div>
        <button
          v-if="pattern.actions.length > 2"
          @click.stop="$emit('view-details', pattern)"
          class="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          View all {{ pattern.actions.length }} actions →
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2 mb-3">
      <button
        @click.stop="$emit('view-claims', pattern)"
        class="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="heroicons:document-text" class="w-4 h-4" />
        {{ pattern.affectedClaims.length }} Claims
      </button>

      <button
        @click.stop="$emit('view-details', pattern)"
        class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        View Details
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </button>
    </div>

    <!-- Mark Action Taken Button -->
    <button
      @click.stop="$emit('record-action', pattern)"
      class="w-full px-4 py-2 border-2 border-dashed border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center justify-center gap-2"
    >
      <Icon name="heroicons:check-circle" class="w-4 h-4" />
      Mark Action Taken
    </button>

    <!-- Related Codes (if any) -->
    <div v-if="pattern.relatedCodes && pattern.relatedCodes.length > 0" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="code in pattern.relatedCodes.slice(0, 3)"
        :key="code"
        @click.stop="viewCodeIntelligence(code)"
        class="px-2 py-1 text-xs font-mono bg-neutral-100 text-neutral-700 rounded border border-neutral-200 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
        :title="`Click to view intelligence for ${code}`"
      >
        {{ code }}
      </button>
      <span
        v-if="pattern.relatedCodes.length > 3"
        class="px-2 py-1 text-xs text-neutral-500"
      >
        +{{ pattern.relatedCodes.length - 3 }} more
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pattern } from '~/types/enhancements'
import { format } from 'date-fns'

const props = defineProps<{
  pattern: Pattern
}>()

defineEmits<{
  click: [pattern: Pattern]
  'view-claims': [pattern: Pattern]
  'view-details': [pattern: Pattern]
  'record-action': [pattern: Pattern]
}>()

// Composables
const {
  getPatternTierColor,
  getPatternTierBadgeClass,
  getPatternStatusBadgeClass,
  getPatternCategoryIcon,
} = usePatterns()

const { formatCurrency } = useAnalytics()
const { getActionTypeLabel } = useActions()
const { openCodeIntelligence } = useCodeIntelligence()

// Computed properties
const tierColor = computed(() => getPatternTierColor(props.pattern.tier))
const tierBadgeClass = computed(() => getPatternTierBadgeClass(props.pattern.tier))
const statusBadgeClass = computed(() => getPatternStatusBadgeClass(props.pattern.status))
const categoryIcon = computed(() => getPatternCategoryIcon(props.pattern.category))

// Recovery status badge styling and labels
const recoveryStatusBadgeClass = computed(() => {
  const classes: Record<string, string> = {
    recoverable: 'bg-success-100 text-success-700 border-success-200',
    partial: 'bg-warning-100 text-warning-700 border-warning-200',
    not_recoverable: 'bg-error-100 text-error-700 border-error-200',
  }
  return classes[props.pattern.recoveryStatus] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
})

const recoveryStatusLabel = computed(() => {
  const labels: Record<string, string> = {
    recoverable: 'Recoverable',
    partial: 'Partial',
    not_recoverable: 'Not Recoverable',
  }
  return labels[props.pattern.recoveryStatus] || props.pattern.recoveryStatus
})

// Action category label
const actionCategoryLabel = computed(() => {
  const labels: Record<string, string> = {
    coding_knowledge: 'Coding Knowledge',
    documentation: 'Documentation',
    operational_system: 'System/Process',
    coverage_blindspot: 'Coverage Gap',
    payer_specific: 'Payer-Specific',
  }
  return labels[props.pattern.actionCategory] || props.pattern.actionCategory
})

const trendIcon = computed(() => {
  const icons = {
    up: 'heroicons:arrow-trending-up',
    down: 'heroicons:arrow-trending-down',
    stable: 'heroicons:minus',
  }
  return icons[props.pattern.score.trend]
})

const trendColor = computed(() => {
  const colors = {
    up: 'text-error-600',
    down: 'text-success-600',
    stable: 'text-neutral-600',
  }
  return colors[props.pattern.score.trend]
})

const latestImprovement = computed(() => {
  if (props.pattern.improvements.length === 0) return null
  return props.pattern.improvements[props.pattern.improvements.length - 1]
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const viewCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
}
</script>
