<script setup lang="ts">
/**
 * Policy details content component
 * Displays policy information inside a drawer
 */
import type { Policy } from '~/types'
import type { Pattern } from '~/types/enhancements'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

defineOptions({ name: 'PolicyDetailsContent' })

const patternsStore = usePatternsStore()
const router = useRouter()

// Composables
const { getPatternCategoryIcon } = usePatterns()

// Get patterns related to this policy
const relatedPatterns = computed(() => {
  return patternsStore.patterns.filter(pattern =>
    pattern.relatedPolicies.includes(props.policy.id)
  )
})

// Get pattern tier badge class
const getPatternBadgeClass = (tier: string) => {
  const classes = {
    critical: 'bg-error-100 text-error-700 border-error-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-warning-100 text-warning-700 border-warning-300',
    low: 'bg-secondary-100 text-secondary-700 border-secondary-300',
  }
  return classes[tier as keyof typeof classes] || 'bg-neutral-100 text-neutral-700 border-neutral-300'
}

// Mode badge styles
const getModeClass = (mode: string) => {
  const classes = {
    'Edit': 'bg-error-100 text-error-700',
    'Informational': 'bg-secondary-100 text-secondary-700',
    'Pay & Advise': 'bg-warning-100 text-warning-700',
  }
  return classes[mode as keyof typeof classes] || 'bg-neutral-100 text-neutral-700'
}

// Navigate to pattern details
const viewPattern = (pattern: Pattern) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-neutral-200 p-6">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 pr-4">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-xl font-semibold text-neutral-900">{{ policy.name }}</h1>
            <span
              class="px-2 py-1 text-xs font-medium rounded"
              :class="getModeClass(policy.mode)"
            >
              {{ policy.mode }}
            </span>
          </div>
          <p class="text-sm text-neutral-500">{{ policy.id }}</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Hit Rate</div>
          <div class="text-lg font-semibold text-neutral-900">{{ formatPercentage(policy.hitRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Denial Rate</div>
          <div class="text-lg font-semibold text-error-700">{{ formatPercentage(policy.denialRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Impact</div>
          <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(policy.impact) }}</div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Related Patterns Alert -->
      <div v-if="relatedPatterns.length > 0" class="p-6 border-b border-neutral-200">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-start gap-3 mb-3">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-orange-900">
                {{ relatedPatterns.length }} Related Pattern{{ relatedPatterns.length > 1 ? 's' : '' }}
              </h3>
              <p class="text-xs text-orange-700 mt-1">
                Denial patterns detected that relate to this policy
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="pattern in relatedPatterns.slice(0, 3)"
              :key="pattern.id"
              class="flex items-center justify-between bg-white rounded p-2 text-sm cursor-pointer hover:bg-orange-50 transition-colors"
              @click="viewPattern(pattern)"
            >
              <div class="flex items-center gap-2">
                <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-4 h-4 text-orange-600" />
                <span class="text-neutral-900">{{ pattern.title }}</span>
              </div>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded border"
                :class="getPatternBadgeClass(pattern.tier)"
              >
                {{ pattern.tier.toUpperCase() }}
              </span>
            </div>
            <button
              v-if="relatedPatterns.length > 3"
              class="text-xs text-orange-700 hover:text-orange-800 font-medium"
              @click="router.push('/insights')"
            >
              View all {{ relatedPatterns.length }} patterns →
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-2">Description</h3>
        <p class="text-sm text-neutral-700">{{ policy.description }}</p>
      </div>

      <!-- Clinical Rationale -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-2">Clinical Rationale</h3>
        <p class="text-sm text-neutral-700">{{ policy.clinicalRationale }}</p>
      </div>

      <!-- Guidance -->
      <div class="p-6 border-b border-neutral-200">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Common Mistake</h3>
            <p class="text-sm text-neutral-700">{{ policy.commonMistake }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Fix Guidance</h3>
            <p class="text-sm text-neutral-700">{{ policy.fixGuidance }}</p>
          </div>
        </div>
      </div>

      <!-- Meta Information -->
      <div class="p-6">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-neutral-500">Topic:</span>
            <span class="ml-2 text-neutral-900">{{ policy.topic }}</span>
          </div>
          <div>
            <span class="text-neutral-500">Source:</span>
            <span class="ml-2 text-neutral-900">{{ policy.source }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="flex items-center gap-3">
        <button
          class="flex-1 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          @click="router.push('/claims?status=denied')"
        >
          View Related Claims
        </button>
        <button
          class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-white transition-colors text-sm"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
