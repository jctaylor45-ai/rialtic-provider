<script setup lang="ts">
/**
 * Insight/Pattern details content component
 * Displays full pattern information inside a drawer
 * Maintains data parity with original modal view
 */
import type { Pattern, ActionType } from '~/types/enhancements'
import { format } from 'date-fns'

const props = defineProps<{
  patternId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'viewClaims', pattern: Pattern): void
  (e: 'recordAction', pattern: Pattern): void
}>()

defineOptions({ name: 'InsightDetailsContent' })

// Stores
const patternsStore = usePatternsStore()

// Composables
const { formatCurrency } = useAnalytics()
const { getActionTypeLabel, getActionTypeIcon } = useActions()
const {
  getPatternTierColor,
  getPatternTierBadgeClass,
  getPatternStatusBadgeClass,
  getPatternCategoryIcon,
} = usePatterns()
const { openCodeIntelligence } = useCodeIntelligence()
const { trackInsightView, track } = useTracking()

// Get the pattern from store
const pattern = computed(() => {
  return patternsStore.getPatternById(props.patternId)
})

// Computed properties
const tierColor = computed(() => pattern.value ? getPatternTierColor(pattern.value.tier) : 'gray')
const tierBadgeClass = computed(() => pattern.value ? getPatternTierBadgeClass(pattern.value.tier) : '')
const statusBadgeClass = computed(() => pattern.value ? getPatternStatusBadgeClass(pattern.value.status) : '')
const categoryIcon = computed(() => pattern.value ? getPatternCategoryIcon(pattern.value.category) : 'heroicons:light-bulb')

const trendIcon = computed(() => {
  if (!pattern.value) return 'heroicons:minus'
  const icons = {
    up: 'heroicons:arrow-trending-up',
    down: 'heroicons:arrow-trending-down',
    stable: 'heroicons:minus',
  }
  return icons[pattern.value.score.trend]
})

const trendColor = computed(() => {
  if (!pattern.value) return 'text-neutral-600'
  const colors = {
    up: 'text-error-600',
    down: 'text-success-600',
    stable: 'text-neutral-600',
  }
  return colors[pattern.value.score.trend]
})

const progressBarColor = computed(() => {
  if (!pattern.value) return 'bg-neutral-500'
  const progress = pattern.value.learningProgress
  if (progress >= 80) return 'bg-success-500'
  if (progress >= 50) return 'bg-warning-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-error-500'
})

const progressTextColor = computed(() => {
  if (!pattern.value) return 'text-neutral-600'
  const progress = pattern.value.learningProgress
  if (progress >= 80) return 'text-success-600'
  if (progress >= 50) return 'text-warning-600'
  if (progress >= 25) return 'text-orange-600'
  return 'text-error-600'
})

// Recovery status and action category labels
const recoveryStatusLabel = computed(() => {
  if (!pattern.value) return ''
  const labels: Record<string, string> = {
    recoverable: 'Recoverable',
    partial: 'Partial Recovery',
    not_recoverable: 'Not Recoverable',
  }
  return labels[pattern.value.recoveryStatus] || pattern.value.recoveryStatus
})

const recoveryStatusBadgeClass = computed(() => {
  if (!pattern.value) return ''
  const classes: Record<string, string> = {
    recoverable: 'bg-success-100 text-success-700 border-success-200',
    partial: 'bg-warning-100 text-warning-700 border-warning-200',
    not_recoverable: 'bg-error-100 text-error-700 border-error-200',
  }
  return classes[pattern.value.recoveryStatus] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
})

const actionCategoryLabel = computed(() => {
  if (!pattern.value) return ''
  const labels: Record<string, string> = {
    coding_knowledge: 'Coding Knowledge',
    documentation: 'Documentation',
    operational_system: 'Operational',
    coverage_blindspot: 'Coverage Gap',
    payer_specific: 'Payer-Specific',
  }
  return labels[pattern.value.actionCategory] || pattern.value.actionCategory
})

const rootCauseLikelihoodClass = (likelihood: string) => {
  const classes: Record<string, string> = {
    high: 'bg-error-100 text-error-700',
    medium: 'bg-warning-100 text-warning-700',
    low: 'bg-neutral-100 text-neutral-600',
  }
  return classes[likelihood] || 'bg-neutral-100 text-neutral-600'
}

const actionPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'border-error-300 bg-error-50',
    medium: 'border-warning-300 bg-warning-50',
    low: 'border-neutral-300 bg-neutral-50',
  }
  return classes[priority] || 'border-neutral-300 bg-neutral-50'
}

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const viewAffectedClaims = () => {
  if (pattern.value) {
    emit('viewClaims', pattern.value)
  }
}

const viewCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
}

const openRecordAction = () => {
  if (pattern.value) {
    emit('recordAction', pattern.value)
  }
}

// Track root cause view
const trackRootCauseView = (rootCauseId: string, likelihood: 'high' | 'medium' | 'low') => {
  if (pattern.value) {
    track('root-cause-viewed', {
      patternId: pattern.value.id,
      rootCauseId,
      rootCauseLikelihood: likelihood,
      actionCategory: pattern.value.actionCategory,
    })
  }
}

// Track action item click
const trackActionItemClick = (
  actionItemId: string,
  actionItemType: 'short-term' | 'long-term',
  priority?: 'high' | 'medium' | 'low'
) => {
  if (pattern.value) {
    track('action-item-clicked', {
      patternId: pattern.value.id,
      actionItemId,
      actionItemType,
      actionItemPriority: priority,
      actionCategory: pattern.value.actionCategory,
      recoveryStatus: pattern.value.recoveryStatus,
    })
  }
}

// Track insight view on mount
onMounted(() => {
  if (pattern.value) {
    trackInsightView(pattern.value.id, pattern.value.category)
  }
})
</script>

<template>
  <!-- Not Found State -->
  <div v-if="!pattern" class="flex-1 flex items-center justify-center p-8">
    <div class="text-center">
      <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-neutral-900 mb-2">Pattern Not Found</h2>
      <p class="text-neutral-600 mb-4">The pattern you're looking for doesn't exist.</p>
      <button
        @click="emit('close')"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Close
      </button>
    </div>
  </div>

  <!-- Pattern Content -->
  <div v-else class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-neutral-200 p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            :class="`bg-${tierColor}-100`"
          >
            <Icon :name="categoryIcon" :class="`text-${tierColor}-600`" class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-neutral-900">
              {{ pattern.title }}
            </h1>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full border"
                :class="tierBadgeClass"
              >
                {{ pattern.tier.toUpperCase() }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full border"
                :class="recoveryStatusBadgeClass"
              >
                {{ recoveryStatusLabel }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"
              >
                {{ actionCategoryLabel }}
              </span>
              <span class="text-xs text-neutral-500">
                ID: {{ pattern.id }}
              </span>
            </div>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-neutral-600" />
        </button>
      </div>
      <p class="text-sm text-neutral-600">
        {{ pattern.description }}
      </p>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      <!-- Key Metrics -->
      <section class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Key Metrics</h3>
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-neutral-50 rounded-lg p-4">
            <div class="text-xs text-neutral-600 mb-1">Frequency</div>
            <div class="text-2xl font-bold text-neutral-900">{{ pattern.score.frequency }}</div>
            <div class="flex items-center gap-1 mt-1 text-xs" :class="trendColor">
              <Icon :name="trendIcon" class="w-3 h-3" />
              <span>{{ pattern.score.trend }}</span>
            </div>
          </div>

          <div class="bg-neutral-50 rounded-lg p-4">
            <div class="text-xs text-neutral-600 mb-1">Total Impact</div>
            <div class="text-2xl font-bold text-neutral-900">
              {{ formatCurrency(pattern.totalAtRisk) }}
            </div>
            <div class="text-xs text-neutral-600 mt-1">
              {{ formatCurrency(pattern.avgDenialAmount) }} avg
            </div>
          </div>

          <div class="bg-neutral-50 rounded-lg p-4">
            <div class="text-xs text-neutral-600 mb-1">Confidence</div>
            <div class="text-2xl font-bold text-neutral-900">{{ pattern.score.confidence }}%</div>
            <div class="text-xs text-neutral-600 mt-1">
              {{ pattern.score.recency }}d since last
            </div>
          </div>

          <div class="bg-neutral-50 rounded-lg p-4">
            <div class="text-xs text-neutral-600 mb-1">Learning Progress</div>
            <div class="text-2xl font-bold" :class="progressTextColor">
              {{ pattern.learningProgress }}%
            </div>
            <div class="text-xs text-neutral-600 mt-1">
              {{ pattern.practiceSessionsCompleted }} sessions
            </div>
          </div>
        </div>
      </section>

      <!-- Learning Progress Bar -->
      <section class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-neutral-900">Learning Progress</h3>
          <span class="text-xs text-neutral-600">{{ pattern.correctionsApplied }} corrections applied</span>
        </div>
        <div class="w-full bg-neutral-200 rounded-full h-3">
          <div
            class="h-3 rounded-full transition-all"
            :class="progressBarColor"
            :style="{ width: `${pattern.learningProgress}%` }"
          />
        </div>
      </section>

      <!-- Actions Recorded -->
      <section v-if="pattern.actions && pattern.actions.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Actions Recorded</h3>
        <div class="space-y-3">
          <div
            v-for="action in pattern.actions"
            :key="action.id"
            class="flex items-start gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200"
          >
            <Icon :name="getActionTypeIcon(action.actionType)" class="w-5 h-5 text-primary-600 mt-0.5" />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-primary-900">
                  {{ getActionTypeLabel(action.actionType) }}
                </span>
                <span class="text-xs text-primary-600">
                  {{ formatDate(action.timestamp) }}
                </span>
              </div>
              <div v-if="action.notes" class="text-xs text-primary-700">
                {{ action.notes }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Improvements Timeline -->
      <section v-if="pattern.improvements.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Improvement History</h3>
        <div class="space-y-3">
          <div
            v-for="(improvement, index) in pattern.improvements"
            :key="index"
            class="flex items-start gap-3 p-3 bg-success-50 rounded-lg border border-success-200"
          >
            <Icon name="heroicons:arrow-trending-down" class="w-5 h-5 text-success-600 mt-0.5" />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-success-900">
                  {{ improvement.metric }}: {{ Math.abs(improvement.percentChange) }}% reduction
                </span>
                <span
                  v-if="improvement.trigger"
                  class="px-2 py-0.5 text-xs bg-success-100 text-success-700 rounded-full"
                >
                  {{ improvement.trigger }}
                </span>
              </div>
              <div class="text-xs text-success-700">
                From {{ improvement.before }} to {{ improvement.after }}
                <span class="text-success-600">• {{ formatDate(improvement.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Evidence Examples -->
      <section v-if="pattern.evidence.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Recent Evidence ({{ pattern.evidence.length }} examples)</h3>
        <div class="space-y-2">
          <div
            v-for="(evidence, index) in pattern.evidence.slice(0, 5)"
            :key="index"
            class="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
          >
            <div class="flex items-start justify-between mb-1">
              <NuxtLink
                :to="`/claims?claim=${evidence.claimId}`"
                class="text-sm font-medium text-primary-600 hover:text-primary-700 font-mono"
              >
                {{ evidence.claimId }}
              </NuxtLink>
              <span class="text-xs text-neutral-500">{{ formatDate(evidence.denialDate) }}</span>
            </div>
            <p class="text-xs text-neutral-600 mb-2">{{ evidence.denialReason }}</p>
            <div class="flex items-center gap-4 text-xs text-neutral-600">
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
          @click="viewAffectedClaims"
          class="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all {{ pattern.evidence.length }} affected claims →
        </button>
      </section>

      <!-- What's Causing This? -->
      <section v-if="pattern.possibleRootCauses && pattern.possibleRootCauses.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <Icon name="heroicons:magnifying-glass-circle" class="w-4 h-4 text-neutral-600" />
          What's Causing This?
        </h3>
        <div class="space-y-2">
          <div
            v-for="cause in pattern.possibleRootCauses"
            :key="cause.id"
            class="p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
            @click="trackRootCauseView(cause.id, cause.likelihood)"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="text-sm text-neutral-800 flex-1">{{ cause.description }}</p>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full shrink-0"
                :class="rootCauseLikelihoodClass(cause.likelihood)"
              >
                {{ cause.likelihood }} likelihood
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- What To Do -->
      <section class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <Icon name="heroicons:clipboard-document-list" class="w-4 h-4 text-neutral-600" />
          What To Do
        </h3>

        <!-- Short-Term Actions -->
        <div v-if="pattern.shortTermActions && pattern.shortTermActions.length > 0" class="mb-4">
          <h4 class="text-xs font-medium text-neutral-600 uppercase tracking-wide mb-2">Short-Term Actions</h4>
          <div class="space-y-2">
            <div
              v-for="action in pattern.shortTermActions"
              :key="action.id"
              class="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
              :class="actionPriorityClass(action.priority)"
              @click="trackActionItemClick(action.id, 'short-term', action.priority)"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <p class="text-sm font-medium text-neutral-900">{{ action.action }}</p>
                <span class="px-2 py-0.5 text-xs font-medium bg-white rounded border border-neutral-300 text-neutral-700 shrink-0">
                  {{ action.priority }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-neutral-600">
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:currency-dollar" class="w-3 h-3" />
                  {{ action.estimatedImpact }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:clock" class="w-3 h-3" />
                  {{ action.timeframe }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Long-Term Actions -->
        <div v-if="pattern.longTermActions && pattern.longTermActions.length > 0">
          <h4 class="text-xs font-medium text-neutral-600 uppercase tracking-wide mb-2">Long-Term Actions</h4>
          <div class="space-y-2">
            <div
              v-for="action in pattern.longTermActions"
              :key="action.id"
              class="p-3 bg-primary-50 rounded-lg border border-primary-200 cursor-pointer hover:shadow-sm transition-shadow"
              @click="trackActionItemClick(action.id, 'long-term')"
            >
              <p class="text-sm font-medium text-primary-900 mb-2">{{ action.action }}</p>
              <div class="flex items-center gap-2 text-xs">
                <span class="px-2 py-0.5 bg-white rounded border border-primary-200 text-primary-700">
                  {{ actionCategoryLabel }}
                </span>
                <span class="text-primary-700">→ {{ action.expectedOutcome }}</span>
              </div>
              <p v-if="action.implementationNotes" class="text-xs text-primary-600 mt-2 italic">
                {{ action.implementationNotes }}
              </p>
            </div>
          </div>
        </div>

        <!-- Fallback to suggested action if no structured actions -->
        <div
          v-if="(!pattern.shortTermActions || pattern.shortTermActions.length === 0) && (!pattern.longTermActions || pattern.longTermActions.length === 0)"
          class="p-4 bg-primary-50 rounded-lg border border-primary-200"
        >
          <p class="text-sm text-primary-900">{{ pattern.suggestedAction }}</p>
        </div>
      </section>

      <!-- Related Policies -->
      <section v-if="pattern.relatedPolicies.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Related Policies</h3>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="policyId in pattern.relatedPolicies"
            :key="policyId"
            :to="`/policies?policy=${policyId}`"
            class="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-sm font-mono text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 transition-colors"
          >
            {{ policyId }}
          </NuxtLink>
        </div>
      </section>

      <!-- Related Codes -->
      <section v-if="pattern.relatedCodes && pattern.relatedCodes.length > 0" class="mb-4">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">Related Procedure Codes</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="code in pattern.relatedCodes"
            :key="code"
            @click="viewCodeIntelligence(code)"
            class="px-3 py-1.5 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-800 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
            :title="`Click to view intelligence for ${code}`"
          >
            {{ code }}
          </button>
        </div>
      </section>

      <!-- Timestamps -->
      <div class="text-xs text-neutral-500 mt-6 pt-4 border-t border-neutral-200">
        First detected: {{ formatDate(pattern.firstDetected) }} •
        Last updated: {{ formatDate(pattern.lastUpdated) }}
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="flex items-center gap-3">
        <button
          @click="viewAffectedClaims"
          class="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-white transition-colors text-center text-sm flex items-center justify-center gap-2"
        >
          <Icon name="heroicons:document-text" class="w-4 h-4" />
          View Claims ({{ pattern.affectedClaims.length }})
        </button>
        <button
          @click="openRecordAction"
          class="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center text-sm flex items-center justify-center gap-2"
        >
          <Icon name="heroicons:clipboard-document-check" class="w-4 h-4" />
          Record Action Taken
        </button>
      </div>
    </div>
  </div>
</template>
