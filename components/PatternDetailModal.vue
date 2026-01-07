<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && pattern"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class="p-2 rounded-lg"
                    :class="`bg-${tierColor}-100`"
                  >
                    <Icon :name="categoryIcon" :class="`text-${tierColor}-600`" class="w-6 h-6" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-900">
                      {{ pattern.title }}
                    </h2>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded-full border"
                        :class="tierBadgeClass"
                      >
                        {{ pattern.tier.toUpperCase() }}
                      </span>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded-full border"
                        :class="statusBadgeClass"
                      >
                        {{ pattern.status }}
                      </span>
                      <span class="text-xs text-gray-500">
                        ID: {{ pattern.id }}
                      </span>
                    </div>
                  </div>
                </div>
                <p class="text-sm text-gray-600">
                  {{ pattern.description }}
                </p>
              </div>

              <button
                @click="close"
                class="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <!-- Key Metrics -->
              <section class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
                <div class="grid grid-cols-4 gap-4">
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-xs text-gray-600 mb-1">Frequency</div>
                    <div class="text-2xl font-bold text-gray-900">{{ pattern.score.frequency }}</div>
                    <div class="flex items-center gap-1 mt-1 text-xs" :class="trendColor">
                      <Icon :name="trendIcon" class="w-3 h-3" />
                      <span>{{ pattern.score.trend }}</span>
                    </div>
                  </div>

                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-xs text-gray-600 mb-1">Total Impact</div>
                    <div class="text-2xl font-bold text-gray-900">
                      {{ formatCurrency(pattern.totalAtRisk) }}
                    </div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ formatCurrency(pattern.avgDenialAmount) }} avg
                    </div>
                  </div>

                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-xs text-gray-600 mb-1">Confidence</div>
                    <div class="text-2xl font-bold text-gray-900">{{ pattern.score.confidence }}%</div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ pattern.score.recency }}d since last
                    </div>
                  </div>

                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-xs text-gray-600 mb-1">Learning Progress</div>
                    <div class="text-2xl font-bold" :class="progressTextColor">
                      {{ pattern.learningProgress }}%
                    </div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ pattern.practiceSessionsCompleted }} sessions
                    </div>
                  </div>
                </div>
              </section>

              <!-- Learning Progress Bar -->
              <section class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-gray-900">Learning Progress</h3>
                  <span class="text-xs text-gray-600">{{ pattern.correctionsApplied }} corrections applied</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all"
                    :class="progressBarColor"
                    :style="{ width: `${pattern.learningProgress}%` }"
                  />
                </div>
              </section>

              <!-- Actions Recorded -->
              <section v-if="pattern.actions && pattern.actions.length > 0" class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Actions Recorded</h3>
                <div class="space-y-3">
                  <div
                    v-for="action in pattern.actions"
                    :key="action.id"
                    class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <Icon :name="getActionTypeIcon(action.actionType)" class="w-5 h-5 text-blue-600 mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-medium text-blue-900">
                          {{ getActionTypeLabel(action.actionType) }}
                        </span>
                        <span class="text-xs text-blue-600">
                          {{ formatDate(action.timestamp) }}
                        </span>
                      </div>
                      <div v-if="action.notes" class="text-xs text-blue-700">
                        {{ action.notes }}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Improvements Timeline -->
              <section v-if="pattern.improvements.length > 0" class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Improvement History</h3>
                <div class="space-y-3">
                  <div
                    v-for="(improvement, index) in pattern.improvements"
                    :key="index"
                    class="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <Icon name="heroicons:arrow-trending-down" class="w-5 h-5 text-green-600 mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-medium text-green-900">
                          {{ improvement.metric }}: {{ Math.abs(improvement.percentChange) }}% reduction
                        </span>
                        <span
                          v-if="improvement.trigger"
                          class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                        >
                          {{ improvement.trigger }}
                        </span>
                      </div>
                      <div class="text-xs text-green-700">
                        From {{ improvement.before }} to {{ improvement.after }}
                        <span class="text-green-600">• {{ formatDate(improvement.date) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Evidence Examples -->
              <section v-if="pattern.evidence.length > 0" class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Recent Evidence ({{ pattern.evidence.length }} examples)</h3>
                <div class="space-y-2">
                  <div
                    v-for="(evidence, index) in pattern.evidence.slice(0, 5)"
                    :key="index"
                    class="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div class="flex items-start justify-between mb-1">
                      <NuxtLink
                        :to="`/claims/${evidence.claimId}`"
                        class="text-sm font-medium text-primary-600 hover:text-primary-700 font-mono"
                      >
                        {{ evidence.claimId }}
                      </NuxtLink>
                      <span class="text-xs text-gray-500">{{ formatDate(evidence.denialDate) }}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-2">{{ evidence.denialReason }}</p>
                    <div class="flex items-center gap-4 text-xs text-gray-600">
                      <span v-if="evidence.procedureCode" class="flex items-center gap-1">
                        Code:
                        <button
                          @click.stop="viewCodeIntelligence(evidence.procedureCode)"
                          class="font-mono hover:text-primary-600 hover:underline cursor-pointer"
                          :title="`Click to view intelligence for ${evidence.procedureCode}`"
                        >
                          {{ evidence.procedureCode }}
                        </button>
                      </span>
                      <span v-if="evidence.modifier">Modifier: {{ evidence.modifier }}</span>
                      <span class="font-medium">{{ formatCurrency(evidence.billedAmount) }}</span>
                    </div>
                  </div>
                </div>
                <button
                  v-if="pattern.evidence.length > 5"
                  @click="viewAllClaims"
                  class="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all {{ pattern.evidence.length }} affected claims →
                </button>
              </section>

              <!-- Suggested Action -->
              <section class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Suggested Action</h3>
                <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p class="text-sm text-blue-900">{{ pattern.suggestedAction }}</p>
                </div>
              </section>

              <!-- Related Policies -->
              <section v-if="pattern.relatedPolicies.length > 0" class="mb-6">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Related Policies</h3>
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    v-for="policyId in pattern.relatedPolicies"
                    :key="policyId"
                    :to="`/policies?id=${policyId}`"
                    class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-colors"
                  >
                    {{ policyId }}
                  </NuxtLink>
                </div>
              </section>

              <!-- Related Codes -->
              <section v-if="pattern.relatedCodes && pattern.relatedCodes.length > 0" class="mb-4">
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Related Procedure Codes</h3>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="code in pattern.relatedCodes"
                    :key="code"
                    @click="viewCodeIntelligence(code)"
                    class="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
                    :title="`Click to view intelligence for ${code}`"
                  >
                    {{ code }}
                  </button>
                </div>
              </section>
            </div>

            <!-- Footer Actions -->
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div class="text-xs text-gray-500">
                First detected: {{ formatDate(pattern.firstDetected) }} •
                Last updated: {{ formatDate(pattern.lastUpdated) }}
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="viewAffectedClaims"
                  class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
                >
                  View Claims ({{ pattern.affectedClaims.length }})
                </button>
                <button
                  @click="startPractice"
                  class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Icon name="heroicons:academic-cap" class="w-4 h-4" />
                  Practice This Pattern
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Pattern } from '~/types/enhancements'
import { format } from 'date-fns'

const props = defineProps<{
  pattern: Pattern | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  practice: [pattern: Pattern]
  viewClaims: [pattern: Pattern]
}>()

// Composables
const { getActionTypeLabel, getActionTypeIcon } = useActions()

const {
  getPatternTierColor,
  getPatternTierBadgeClass,
  getPatternStatusBadgeClass,
  getPatternCategoryIcon,
} = usePatterns()

const { formatCurrency } = useAnalytics()
const { openCodeIntelligence } = useCodeIntelligence()

// Computed properties
const tierColor = computed(() => props.pattern ? getPatternTierColor(props.pattern.tier) : 'gray')
const tierBadgeClass = computed(() => props.pattern ? getPatternTierBadgeClass(props.pattern.tier) : '')
const statusBadgeClass = computed(() => props.pattern ? getPatternStatusBadgeClass(props.pattern.status) : '')
const categoryIcon = computed(() => props.pattern ? getPatternCategoryIcon(props.pattern.category) : 'heroicons:light-bulb')

const trendIcon = computed(() => {
  if (!props.pattern) return 'heroicons:minus'
  const icons = {
    up: 'heroicons:arrow-trending-up',
    down: 'heroicons:arrow-trending-down',
    stable: 'heroicons:minus',
  }
  return icons[props.pattern.score.trend]
})

const trendColor = computed(() => {
  if (!props.pattern) return 'text-gray-600'
  const colors = {
    up: 'text-red-600',
    down: 'text-green-600',
    stable: 'text-gray-600',
  }
  return colors[props.pattern.score.trend]
})

const progressBarColor = computed(() => {
  if (!props.pattern) return 'bg-gray-500'
  const progress = props.pattern.learningProgress
  if (progress >= 80) return 'bg-green-500'
  if (progress >= 50) return 'bg-yellow-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-red-500'
})

const progressTextColor = computed(() => {
  if (!props.pattern) return 'text-gray-600'
  const progress = props.pattern.learningProgress
  if (progress >= 80) return 'text-green-600'
  if (progress >= 50) return 'text-yellow-600'
  if (progress >= 25) return 'text-orange-600'
  return 'text-red-600'
})

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const close = () => {
  emit('close')
}

const startPractice = () => {
  if (props.pattern) {
    emit('practice', props.pattern)
  }
}

const viewAffectedClaims = () => {
  if (props.pattern) {
    emit('viewClaims', props.pattern)
  }
}

const viewAllClaims = () => {
  viewAffectedClaims()
}

const viewCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
}

// Close on Escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
