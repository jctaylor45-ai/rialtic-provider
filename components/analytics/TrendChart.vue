<script setup lang="ts">
/**
 * Trend Chart Component
 *
 * Simple SVG-based line/bar chart for displaying trends.
 */

interface DataPoint {
  date: string
  value: number
}

interface Props {
  title: string
  data: DataPoint[]
  type?: 'line' | 'bar'
  color?: string
  unit?: string
  height?: number
  loading?: boolean
  showGrid?: boolean
  showLabels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  color: '#3b82f6', // primary-500
  unit: '',
  height: 200,
  loading: false,
  showGrid: true,
  showLabels: true,
})

const chartWidth = 600
const chartHeight = props.height
const padding = { top: 20, right: 20, bottom: 40, left: 60 }

const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

// Computed values for scaling
const minValue = computed(() => {
  if (props.data.length === 0) return 0
  return Math.min(...props.data.map(d => d.value)) * 0.9
})

const maxValue = computed(() => {
  if (props.data.length === 0) return 100
  return Math.max(...props.data.map(d => d.value)) * 1.1
})

const yScale = (value: number) => {
  const range = maxValue.value - minValue.value || 1
  return innerHeight - ((value - minValue.value) / range) * innerHeight
}

const xScale = (index: number) => {
  if (props.data.length <= 1) return innerWidth / 2
  return (index / (props.data.length - 1)) * innerWidth
}

// Generate line path
const linePath = computed(() => {
  if (props.data.length === 0) return ''

  const points = props.data.map((d, i) => {
    const x = padding.left + xScale(i)
    const y = padding.top + yScale(d.value)
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
})

// Generate area path (for filled area under line)
const areaPath = computed(() => {
  if (props.data.length === 0) return ''

  const points = props.data.map((d, i) => {
    const x = padding.left + xScale(i)
    const y = padding.top + yScale(d.value)
    return `${x},${y}`
  })

  const firstX = padding.left + xScale(0)
  const lastX = padding.left + xScale(props.data.length - 1)
  const bottomY = padding.top + innerHeight

  return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`
})

// Y-axis ticks
const yTicks = computed(() => {
  const tickCount = 5
  const range = maxValue.value - minValue.value
  const step = range / (tickCount - 1)

  return Array.from({ length: tickCount }, (_, i) => {
    const value = minValue.value + step * i
    return {
      value: Math.round(value * 100) / 100,
      y: padding.top + yScale(value),
    }
  })
})

// X-axis labels (show every nth label to avoid crowding)
const xLabels = computed(() => {
  if (props.data.length === 0) return []

  const maxLabels = 7
  const step = Math.max(1, Math.floor(props.data.length / maxLabels))

  return props.data
    .filter((_, i) => i % step === 0 || i === props.data.length - 1)
    .map((d, i, arr) => {
      const originalIndex = props.data.findIndex(od => od.date === d.date)
      return {
        label: formatDate(d.date),
        x: padding.left + xScale(originalIndex),
      }
    })
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatValue(value: number): string {
  if (props.unit === '$') {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  if (props.unit === '%') {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

// Tooltip state
const hoveredPoint = ref<{ x: number; y: number; data: DataPoint } | null>(null)

function handleMouseMove(event: MouseEvent) {
  if (props.data.length === 0) return

  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const x = event.clientX - rect.left - padding.left
  const index = Math.round((x / innerWidth) * (props.data.length - 1))

  if (index >= 0 && index < props.data.length) {
    const point = props.data[index]!
    hoveredPoint.value = {
      x: padding.left + xScale(index),
      y: padding.top + yScale(point.value),
      data: point,
    }
  }
}

function handleMouseLeave() {
  hoveredPoint.value = null
}
</script>

<template>
  <div class="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
    <h3 class="text-sm font-medium text-neutral-700 mb-4">{{ title }}</h3>

    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse" :style="{ height: `${height}px` }">
      <div class="h-full bg-neutral-100 rounded" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="data.length === 0"
      :style="{ height: `${height}px` }"
      class="flex items-center justify-center text-neutral-400"
    >
      No data available
    </div>

    <!-- Chart -->
    <svg
      v-else
      :width="chartWidth"
      :height="chartHeight"
      class="w-full"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      preserveAspectRatio="xMidYMid meet"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- Grid lines -->
      <g v-if="showGrid" class="text-neutral-200">
        <line
          v-for="tick in yTicks"
          :key="tick.value"
          :x1="padding.left"
          :y1="tick.y"
          :x2="chartWidth - padding.right"
          :y2="tick.y"
          stroke="currentColor"
          stroke-dasharray="4,4"
        />
      </g>

      <!-- Y-axis labels -->
      <g v-if="showLabels" class="text-neutral-500 text-xs">
        <text
          v-for="tick in yTicks"
          :key="tick.value"
          :x="padding.left - 8"
          :y="tick.y + 4"
          text-anchor="end"
          fill="currentColor"
        >
          {{ formatValue(tick.value) }}
        </text>
      </g>

      <!-- X-axis labels -->
      <g v-if="showLabels" class="text-neutral-500 text-xs">
        <text
          v-for="label in xLabels"
          :key="label.label"
          :x="label.x"
          :y="chartHeight - 10"
          text-anchor="middle"
          fill="currentColor"
        >
          {{ label.label }}
        </text>
      </g>

      <!-- Area fill (for line chart) -->
      <path
        v-if="type === 'line'"
        :d="areaPath"
        :fill="color"
        fill-opacity="0.1"
      />

      <!-- Line -->
      <path
        v-if="type === 'line'"
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Bars -->
      <g v-if="type === 'bar'">
        <rect
          v-for="(d, i) in data"
          :key="d.date"
          :x="padding.left + xScale(i) - (innerWidth / data.length) * 0.4"
          :y="padding.top + yScale(d.value)"
          :width="(innerWidth / data.length) * 0.8"
          :height="innerHeight - yScale(d.value)"
          :fill="color"
          fill-opacity="0.8"
          rx="2"
        />
      </g>

      <!-- Hover point -->
      <g v-if="hoveredPoint">
        <circle
          :cx="hoveredPoint.x"
          :cy="hoveredPoint.y"
          r="4"
          :fill="color"
          stroke="white"
          stroke-width="2"
        />
        <line
          :x1="hoveredPoint.x"
          :y1="padding.top"
          :x2="hoveredPoint.x"
          :y2="padding.top + innerHeight"
          stroke="currentColor"
          stroke-dasharray="4,4"
          class="text-neutral-300"
        />
      </g>
    </svg>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="hoveredPoint"
        class="fixed z-50 bg-neutral-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
        :style="{
          left: `${hoveredPoint.x}px`,
          top: `${hoveredPoint.y - 30}px`,
          transform: 'translateX(-50%)',
        }"
      >
        <div class="font-medium">{{ formatDate(hoveredPoint.data.date) }}</div>
        <div>{{ formatValue(hoveredPoint.data.value) }}</div>
      </div>
    </Teleport>
  </div>
</template>
