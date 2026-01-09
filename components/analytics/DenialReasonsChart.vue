<script setup lang="ts">
/**
 * Denial Reasons Chart Component
 *
 * Horizontal bar chart showing denial reason distribution.
 */

interface Cohort {
  name: string
  value: number
  percentage: number
}

interface Props {
  title?: string
  data: Cohort[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Denial Reasons',
  loading: false,
  maxItems: 8,
})

const displayData = computed(() => {
  return props.data.slice(0, props.maxItems)
})

const maxPercentage = computed(() => {
  if (displayData.value.length === 0) return 100
  return Math.max(...displayData.value.map(d => d.percentage))
})

function getBarWidth(percentage: number): string {
  return `${(percentage / maxPercentage.value) * 100}%`
}

// Color scale for bars
const colors = [
  'bg-primary-500',
  'bg-secondary-500',
  'bg-warning-500',
  'bg-error-500',
  'bg-success-500',
  'bg-primary-400',
  'bg-secondary-400',
  'bg-warning-400',
]

function getBarColor(index: number): string {
  return colors[index % colors.length] || 'bg-neutral-400'
}
</script>

<template>
  <div class="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
    <h3 class="text-sm font-medium text-neutral-700 mb-4">{{ title }}</h3>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-3 bg-neutral-200 rounded w-32 mb-1" />
        <div class="h-6 bg-neutral-100 rounded" :style="{ width: `${100 - i * 15}%` }" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="data.length === 0" class="py-8 text-center text-neutral-400">
      No denial data available
    </div>

    <!-- Chart -->
    <div v-else class="space-y-3">
      <div
        v-for="(item, index) in displayData"
        :key="item.name"
        class="group"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-neutral-700 truncate flex-1 mr-4" :title="item.name">
            {{ item.name }}
          </span>
          <span class="text-sm font-medium text-neutral-900 whitespace-nowrap">
            {{ item.value.toLocaleString() }}
            <span class="text-neutral-500 font-normal">({{ item.percentage.toFixed(1) }}%)</span>
          </span>
        </div>
        <div class="h-6 bg-neutral-100 rounded overflow-hidden">
          <div
            class="h-full rounded transition-all duration-300 group-hover:opacity-80"
            :class="getBarColor(index)"
            :style="{ width: getBarWidth(item.percentage) }"
          />
        </div>
      </div>

      <!-- Show more indicator -->
      <div v-if="data.length > maxItems" class="text-sm text-neutral-500 text-center pt-2">
        +{{ data.length - maxItems }} more reasons
      </div>
    </div>
  </div>
</template>
