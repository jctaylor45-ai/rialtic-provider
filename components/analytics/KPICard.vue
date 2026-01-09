<script setup lang="ts">
/**
 * KPI Card Component
 *
 * Displays a single KPI metric with optional trend indicator and sparkline.
 */

interface Props {
  title: string
  value: string | number
  unit?: string
  prefix?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'stable'
  trendPositive?: 'up' | 'down' // Which direction is considered positive
  sparklineData?: number[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  prefix: '',
  trendPositive: 'down', // Default: down is good (lower denial rate)
  loading: false,
})

const trendClass = computed(() => {
  if (!props.trend || props.trend === 'stable') return 'text-neutral-500'
  const isPositive = props.trend === props.trendPositive
  return isPositive ? 'text-success-600' : 'text-error-600'
})

const trendIcon = computed(() => {
  if (!props.trend || props.trend === 'stable') return 'minus'
  return props.trend === 'up' ? 'arrow-trending-up' : 'arrow-trending-down'
})

// Simple sparkline rendering
const sparklinePath = computed(() => {
  if (!props.sparklineData || props.sparklineData.length < 2) return ''

  const data = props.sparklineData
  const width = 80
  const height = 24
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
})
</script>

<template>
  <div class="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
    <!-- Loading state -->
    <template v-if="loading">
      <div class="animate-pulse">
        <div class="h-4 bg-neutral-200 rounded w-24 mb-2" />
        <div class="h-8 bg-neutral-200 rounded w-32 mb-2" />
        <div class="h-3 bg-neutral-200 rounded w-16" />
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-neutral-600 mb-1">
            {{ title }}
          </p>
          <p class="text-2xl font-semibold text-neutral-900">
            {{ prefix }}{{ typeof value === 'number' ? value.toLocaleString() : value }}{{ unit }}
          </p>
        </div>

        <!-- Sparkline -->
        <div v-if="sparklineData && sparklineData.length > 1" class="ml-4">
          <svg width="80" height="24" class="overflow-visible">
            <path
              :d="sparklinePath"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="trendClass"
            />
          </svg>
        </div>
      </div>

      <!-- Change indicator -->
      <div v-if="change !== undefined" class="mt-2 flex items-center gap-1">
        <component
          :is="`heroicons:${trendIcon}`"
          class="w-4 h-4"
          :class="trendClass"
        />
        <span class="text-sm" :class="trendClass">
          {{ change > 0 ? '+' : '' }}{{ change.toFixed(1) }}%
        </span>
        <span v-if="changeLabel" class="text-sm text-neutral-500 ml-1">
          {{ changeLabel }}
        </span>
      </div>
    </template>
  </div>
</template>
