<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-900">Filters</h3>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        Clear all
      </button>
    </div>

    <div class="space-y-4">
      <!-- Search -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">Search</label>
        <div class="relative">
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="localFilters.search"
            type="text"
            placeholder="Search patterns..."
            class="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">Status</label>
        <div class="space-y-2">
          <label
            v-for="status in statusOptions"
            :key="status.value"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="status.value"
              v-model="localFilters.status"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">{{ status.label }}</span>
            <span
              class="ml-auto px-2 py-0.5 text-xs rounded-full"
              :class="status.badgeClass"
            >
              {{ status.count }}
            </span>
          </label>
        </div>
      </div>

      <!-- Tier Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">Priority Tier</label>
        <div class="space-y-2">
          <label
            v-for="tier in tierOptions"
            :key="tier.value"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="tier.value"
              v-model="localFilters.tier"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">{{ tier.label }}</span>
            <span
              class="ml-auto px-2 py-0.5 text-xs rounded-full"
              :class="tier.badgeClass"
            >
              {{ tier.count }}
            </span>
          </label>
        </div>
      </div>

      <!-- Category Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">Category</label>
        <div class="space-y-2">
          <label
            v-for="category in categoryOptions"
            :key="category.value"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="category.value"
              v-model="localFilters.category"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">{{ category.label }}</span>
            <span class="ml-auto text-xs text-gray-500">
              {{ category.count }}
            </span>
          </label>
        </div>
      </div>

      <!-- Impact Range -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">
          Minimum Impact: {{ formatCurrency(localFilters.minImpact || 0) }}
        </label>
        <input
          v-model.number="localFilters.minImpact"
          type="range"
          min="0"
          :max="maxImpact"
          step="1000"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>{{ formatCurrency(maxImpact) }}</span>
        </div>
      </div>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200">
      <div class="text-xs font-medium text-gray-700 mb-2">Active Filters</div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(filter, index) in activeFilterTags"
          :key="index"
          class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
        >
          {{ filter }}
          <button
            @click="removeFilter(filter)"
            class="hover:text-primary-900"
          >
            <Icon name="heroicons:x-mark" class="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PatternFilters, PatternStatus, PatternTier, PatternCategory } from '~/types/enhancements'

const props = defineProps<{
  filters: PatternFilters
  patterns: any[]
}>()

const emit = defineEmits<{
  'update:filters': [filters: PatternFilters]
}>()

// Composables
const { formatCurrency } = useAnalytics()

// Local filters (v-model)
const localFilters = ref<PatternFilters>({ ...props.filters })

// Watch for changes and emit
watch(localFilters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })

// Calculate max impact from patterns
const maxImpact = computed(() => {
  if (props.patterns.length === 0) return 50000
  return Math.max(...props.patterns.map(p => p.score.impact))
})

// Status options with counts
const statusOptions = computed(() => {
  const counts = {
    active: props.patterns.filter(p => p.status === 'active').length,
    improving: props.patterns.filter(p => p.status === 'improving').length,
    resolved: props.patterns.filter(p => p.status === 'resolved').length,
    archived: props.patterns.filter(p => p.status === 'archived').length,
  }

  return [
    {
      value: 'active' as PatternStatus,
      label: 'Active',
      count: counts.active,
      badgeClass: 'bg-red-100 text-red-700',
    },
    {
      value: 'improving' as PatternStatus,
      label: 'Improving',
      count: counts.improving,
      badgeClass: 'bg-yellow-100 text-yellow-700',
    },
    {
      value: 'resolved' as PatternStatus,
      label: 'Resolved',
      count: counts.resolved,
      badgeClass: 'bg-green-100 text-green-700',
    },
  ]
})

// Tier options with counts
const tierOptions = computed(() => {
  const counts = {
    critical: props.patterns.filter(p => p.tier === 'critical').length,
    high: props.patterns.filter(p => p.tier === 'high').length,
    medium: props.patterns.filter(p => p.tier === 'medium').length,
    low: props.patterns.filter(p => p.tier === 'low').length,
  }

  return [
    {
      value: 'critical' as PatternTier,
      label: 'Critical',
      count: counts.critical,
      badgeClass: 'bg-red-100 text-red-700',
    },
    {
      value: 'high' as PatternTier,
      label: 'High',
      count: counts.high,
      badgeClass: 'bg-orange-100 text-orange-700',
    },
    {
      value: 'medium' as PatternTier,
      label: 'Medium',
      count: counts.medium,
      badgeClass: 'bg-yellow-100 text-yellow-700',
    },
    {
      value: 'low' as PatternTier,
      label: 'Low',
      count: counts.low,
      badgeClass: 'bg-blue-100 text-blue-700',
    },
  ]
})

// Category options with counts
const categoryOptions = computed(() => {
  const categoryCounts = new Map<PatternCategory, number>()

  props.patterns.forEach(p => {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1)
  })

  const categoryLabels: Record<PatternCategory, string> = {
    'modifier-missing': 'Modifier Missing',
    'code-mismatch': 'Code Mismatch',
    'documentation': 'Documentation',
    'authorization': 'Authorization',
    'billing-error': 'Billing Error',
    'timing': 'Timing',
    'coding-specificity': 'Code Specificity',
    'medical-necessity': 'Medical Necessity',
  }

  return Array.from(categoryCounts.entries()).map(([value, count]) => ({
    value,
    label: categoryLabels[value] || value,
    count,
  }))
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    (localFilters.value.status && localFilters.value.status.length > 0) ||
    (localFilters.value.tier && localFilters.value.tier.length > 0) ||
    (localFilters.value.category && localFilters.value.category.length > 0) ||
    (localFilters.value.minImpact && localFilters.value.minImpact > 0) ||
    (localFilters.value.search && localFilters.value.search.length > 0)
  )
})

// Active filter tags
const activeFilterTags = computed(() => {
  const tags: string[] = []

  if (localFilters.value.search) {
    tags.push(`Search: "${localFilters.value.search}"`)
  }

  if (localFilters.value.status) {
    localFilters.value.status.forEach(s => {
      tags.push(`Status: ${s}`)
    })
  }

  if (localFilters.value.tier) {
    localFilters.value.tier.forEach(t => {
      tags.push(`Tier: ${t}`)
    })
  }

  if (localFilters.value.category) {
    localFilters.value.category.forEach(c => {
      tags.push(`Category: ${c}`)
    })
  }

  if (localFilters.value.minImpact && localFilters.value.minImpact > 0) {
    tags.push(`Min Impact: ${formatCurrency(localFilters.value.minImpact)}`)
  }

  return tags
})

// Clear all filters
const clearFilters = () => {
  localFilters.value = {
    status: [],
    tier: [],
    category: [],
    minImpact: 0,
    search: '',
  }
}

// Remove individual filter
const removeFilter = (filterTag: string) => {
  if (filterTag.startsWith('Search:')) {
    localFilters.value.search = ''
  } else if (filterTag.startsWith('Status:')) {
    const status = filterTag.split(': ')[1] as PatternStatus
    localFilters.value.status = localFilters.value.status?.filter(s => s !== status) || []
  } else if (filterTag.startsWith('Tier:')) {
    const tier = filterTag.split(': ')[1] as PatternTier
    localFilters.value.tier = localFilters.value.tier?.filter(t => t !== tier) || []
  } else if (filterTag.startsWith('Category:')) {
    const category = filterTag.split(': ')[1] as PatternCategory
    localFilters.value.category = localFilters.value.category?.filter(c => c !== category) || []
  } else if (filterTag.startsWith('Min Impact:')) {
    localFilters.value.minImpact = 0
  }
}
</script>
