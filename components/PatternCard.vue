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
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            {{ pattern.title }}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-2">
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
          :class="statusBadgeClass"
        >
          {{ pattern.status }}
        </span>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div>
        <div class="text-xs text-gray-500 mb-1">Frequency</div>
        <div class="text-lg font-semibold text-gray-900">
          {{ pattern.score.frequency }}
        </div>
        <div class="flex items-center gap-1 text-xs" :class="trendColor">
          <Icon :name="trendIcon" class="w-3 h-3" />
          <span>{{ pattern.score.trend }}</span>
        </div>
      </div>

      <div>
        <div class="text-xs text-gray-500 mb-1">Impact</div>
        <div class="text-lg font-semibold text-gray-900">
          {{ formatCurrency(pattern.score.impact) }}
        </div>
        <div class="text-xs text-gray-500">
          ~{{ formatCurrency(pattern.avgDenialAmount) }} avg
        </div>
      </div>

      <div>
        <div class="text-xs text-gray-500 mb-1">Confidence</div>
        <div class="text-lg font-semibold text-gray-900">
          {{ pattern.score.confidence }}%
        </div>
        <div class="text-xs text-gray-500">
          {{ pattern.score.recency }}d ago
        </div>
      </div>
    </div>

    <!-- Learning Progress -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-700">Learning Progress</span>
        <span class="text-xs font-semibold" :class="progressTextColor">
          {{ pattern.learningProgress }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all"
          :class="progressBarColor"
          :style="{ width: `${pattern.learningProgress}%` }"
        />
      </div>
      <div class="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <span>{{ pattern.practiceSessionsCompleted }} sessions</span>
        <span>{{ pattern.correctionsApplied }} corrections</span>
      </div>
    </div>

    <!-- Improvements Summary -->
    <div v-if="pattern.improvements.length > 0" class="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
      <div class="flex items-center gap-2 mb-1">
        <Icon name="heroicons:arrow-trending-down" class="w-4 h-4 text-green-600" />
        <span class="text-sm font-medium text-green-800">Recent Improvement</span>
      </div>
      <p class="text-xs text-green-700">
        {{ latestImprovement.metric }}: {{ Math.abs(latestImprovement.percentChange) }}% reduction
        <span class="text-green-600">({{ formatDate(latestImprovement.date) }})</span>
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2">
      <button
        @click.stop="$emit('practice', pattern)"
        class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="heroicons:academic-cap" class="w-4 h-4" />
        Practice
      </button>

      <button
        @click.stop="$emit('view-claims', pattern)"
        class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Icon name="heroicons:document-text" class="w-4 h-4" />
        {{ pattern.affectedClaims.length }}
      </button>

      <button
        @click.stop="$emit('view-details', pattern)"
        class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </button>
    </div>

    <!-- Related Codes (if any) -->
    <div v-if="pattern.relatedCodes && pattern.relatedCodes.length > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="code in pattern.relatedCodes.slice(0, 3)"
        :key="code"
        class="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded border border-gray-200"
      >
        {{ code }}
      </span>
      <span
        v-if="pattern.relatedCodes.length > 3"
        class="px-2 py-1 text-xs text-gray-500"
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
  practice: [pattern: Pattern]
  viewClaims: [pattern: Pattern]
  viewDetails: [pattern: Pattern]
}>()

// Composables
const {
  getPatternTierColor,
  getPatternTierBadgeClass,
  getPatternStatusBadgeClass,
  getPatternCategoryIcon,
} = usePatterns()

const { formatCurrency } = useAnalytics()

// Computed properties
const tierColor = computed(() => getPatternTierColor(props.pattern.tier))
const tierBadgeClass = computed(() => getPatternTierBadgeClass(props.pattern.tier))
const statusBadgeClass = computed(() => getPatternStatusBadgeClass(props.pattern.status))
const categoryIcon = computed(() => getPatternCategoryIcon(props.pattern.category))

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
    up: 'text-red-600',
    down: 'text-green-600',
    stable: 'text-gray-600',
  }
  return colors[props.pattern.score.trend]
})

const progressBarColor = computed(() => {
  const progress = props.pattern.learningProgress
  if (progress >= 80) return 'bg-green-500'
  if (progress >= 50) return 'bg-yellow-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-red-500'
})

const progressTextColor = computed(() => {
  const progress = props.pattern.learningProgress
  if (progress >= 80) return 'text-green-600'
  if (progress >= 50) return 'text-yellow-600'
  if (progress >= 25) return 'text-orange-600'
  return 'text-red-600'
})

const latestImprovement = computed(() => {
  if (props.pattern.improvements.length === 0) return null
  return props.pattern.improvements[props.pattern.improvements.length - 1]
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>
