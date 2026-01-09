<script setup lang="ts">
/**
 * Insight/Pattern details content component
 * Displays full pattern information inside a drawer
 * Restructured per product spec with root cause analysis and remediation guidance
 */
import type { Pattern, ActionType, ActionCategory } from '~/types/enhancements'
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
const eventsStore = useEventsStore()

// Composables
const { formatCurrency } = useAnalytics()
const { getActionTypeLabel, getActionTypeIcon } = useActions()
const {
  getPatternTierColor,
  getPatternTierBadgeClass,
  getPatternCategoryIcon,
} = usePatterns()
const { openCodeIntelligence } = useCodeIntelligence()
const { trackInsightView } = useTracking()

// Get the pattern from store
const pattern = computed(() => {
  return patternsStore.getPatternById(props.patternId)
})

// Computed properties
const tierColor = computed(() => pattern.value ? getPatternTierColor(pattern.value.tier) : 'gray')
const tierBadgeClass = computed(() => pattern.value ? getPatternTierBadgeClass(pattern.value.tier) : '')
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

// Action Category helpers
const getActionCategoryLabel = (category: ActionCategory): string => {
  const labels: Record<ActionCategory, string> = {
    coding_knowledge: 'Coding Knowledge',
    documentation: 'Documentation',
    operational_system: 'System/Process',
    coverage_blindspot: 'Coverage Gap',
    payer_specific: 'Payer-Specific',
  }
  return labels[category] || category
}

const getActionCategoryClass = (category: ActionCategory): string => {
  const classes: Record<ActionCategory, string> = {
    coding_knowledge: 'bg-secondary-100 text-secondary-700',
    documentation: 'bg-primary-100 text-primary-700',
    operational_system: 'bg-warning-100 text-warning-700',
    coverage_blindspot: 'bg-error-100 text-error-700',
    payer_specific: 'bg-warning-50 text-warning-600',
  }
  return classes[category] || 'bg-neutral-100 text-neutral-700'
}

// Recovery Status helpers
const getRecoveryStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    recoverable: 'Recoverable',
    partial: 'Partially Recoverable',
    not_recoverable: 'Not Recoverable',
  }
  return labels[status] || status
}

const getRecoveryStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    recoverable: 'bg-success-100 text-success-700',
    partial: 'bg-warning-100 text-warning-700',
    not_recoverable: 'bg-error-100 text-error-700',
  }
  return classes[status] || 'bg-neutral-100 text-neutral-700'
}

const getRecoveryBoxClass = (status: string): string => {
  const classes: Record<string, string> = {
    recoverable: 'bg-success-50 border-success-200',
    partial: 'bg-warning-50 border-warning-200',
    not_recoverable: 'bg-error-50 border-error-200',
  }
  return classes[status] || 'bg-neutral-50 border-neutral-200'
}

const getRecoveryIcon = (status: string): string => {
  const icons: Record<string, string> = {
    recoverable: 'heroicons:check-circle',
    partial: 'heroicons:exclamation-circle',
    not_recoverable: 'heroicons:x-circle',
  }
  return icons[status] || 'heroicons:question-mark-circle'
}

const getConfidenceClass = (confidence: string): string => {
  const classes: Record<string, string> = {
    high: 'bg-error-100 text-error-700',
    medium: 'bg-warning-100 text-warning-700',
    low: 'bg-neutral-100 text-neutral-600',
  }
  return classes[confidence] || 'bg-neutral-100 text-neutral-600'
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

// Signal capture handlers per prompt spec
const handleExportClaims = () => {
  if (pattern.value) {
    eventsStore.trackEvent('insight-export-claims', 'insights', {
      patternId: pattern.value.id,
      claimCount: pattern.value.shortTermAction.claimCount,
      amount: pattern.value.shortTermAction.amount,
    })
    // TODO: Implement actual export functionality
  }
}

const handleMarkClaimsFix = () => {
  if (pattern.value) {
    eventsStore.trackEvent('insight-claims-fixed', 'insights', {
      patternId: pattern.value.id,
    })
    // TODO: Update pattern status or create action record
  }
}

const handleMarkRootCauseAddressed = () => {
  if (pattern.value) {
    eventsStore.trackEvent('insight-root-cause-addressed', 'insights', {
      patternId: pattern.value.id,
      actionCategory: pattern.value.actionCategory,
    })
    // TODO: Update pattern status or create action record
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
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getActionCategoryClass(pattern.actionCategory)"
              >
                {{ getActionCategoryLabel(pattern.actionCategory) }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getRecoveryStatusClass(pattern.recoveryStatus)"
              >
                {{ getRecoveryStatusLabel(pattern.recoveryStatus) }}
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
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      <!-- Overview Metrics -->
      <section class="mb-6">
        <div class="flex items-center gap-6 text-sm">
          <div>
            <span class="text-neutral-600">Frequency:</span>
            <span class="font-semibold text-neutral-900 ml-1">{{ pattern.score.frequency }}</span>
          </div>
          <div>
            <span class="text-neutral-600">Denied:</span>
            <span class="font-semibold text-neutral-900 ml-1">{{ formatCurrency(pattern.totalAtRisk) }}</span>
          </div>
          <div class="flex items-center gap-1" :class="trendColor">
            <Icon :name="trendIcon" class="w-4 h-4" />
            <span class="text-sm capitalize">{{ pattern.score.trend }}</span>
          </div>
        </div>
        <p class="text-sm text-neutral-600 mt-3">
          {{ pattern.description }}
        </p>
      </section>

      <!-- What's Causing This? -->
      <section v-if="pattern.possibleRootCauses && pattern.possibleRootCauses.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">What's Causing This?</h3>
        <div class="space-y-3">
          <div
            v-for="(rootCause, index) in pattern.possibleRootCauses"
            :key="index"
            class="p-3 rounded-lg border"
            :class="index === 0 ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium" :class="index === 0 ? 'text-primary-900' : 'text-neutral-700'">
                {{ getActionCategoryLabel(rootCause.category) }}
              </span>
              <span class="text-xs px-1.5 py-0.5 rounded" :class="getConfidenceClass(rootCause.confidence)">
                {{ rootCause.confidence }} confidence
              </span>
            </div>
            <p class="text-sm text-neutral-600">{{ rootCause.explanation }}</p>
            <div v-if="rootCause.signals.length" class="mt-2 text-xs text-neutral-500">
              Signals: {{ rootCause.signals.join(' • ') }}
            </div>
          </div>
        </div>
        <p class="text-xs text-neutral-500 mt-2 italic">
          Guidance below covers applicable remediation scenarios.
        </p>
      </section>

      <!-- What To Do -->
      <section class="mb-6">
        <h3 class="text-sm font-semibold text-neutral-900 mb-3">What To Do</h3>

        <!-- For Existing Claims -->
        <div class="mb-4">
          <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">For Existing Claims</h4>
          <div class="p-4 rounded-lg border" :class="getRecoveryBoxClass(pattern.recoveryStatus)">
            <div class="flex items-center gap-2 mb-2">
              <Icon :name="getRecoveryIcon(pattern.recoveryStatus)" class="w-5 h-5" />
              <span class="font-medium">{{ getRecoveryStatusLabel(pattern.recoveryStatus) }}</span>
            </div>

            <div v-if="pattern.recoveryStatus !== 'not_recoverable'">
              <p class="text-sm mb-2">
                {{ pattern.shortTermAction.claimCount }} claims recoverable
                ({{ formatCurrency(pattern.shortTermAction.amount) }})
              </p>
              <p class="text-sm text-neutral-700 mb-3">{{ pattern.shortTermAction.description }}</p>
              <div class="flex items-center gap-2">
                <button
                  @click="handleExportClaims"
                  class="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  Export Claims
                </button>
                <button
                  @click="handleMarkClaimsFix"
                  class="px-3 py-1.5 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                >
                  Mark Claims Fixed
                </button>
              </div>
            </div>

            <div v-else>
              <p class="text-sm text-neutral-700 mb-2">{{ pattern.shortTermAction.description }}</p>
              <p class="text-sm font-medium text-error-700">
                Lost revenue: {{ formatCurrency(pattern.totalAtRisk) }}
              </p>
            </div>
          </div>
        </div>

        <!-- To Prevent Future Denials -->
        <div>
          <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">To Prevent Future Denials</h4>
          <div class="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <p class="text-sm text-neutral-700 mb-3">{{ pattern.longTermAction.description }}</p>
            <div class="space-y-2">
              <p class="text-xs font-semibold text-neutral-900">Recommended Actions:</p>
              <ul class="space-y-1">
                <li
                  v-for="(step, index) in pattern.longTermAction.steps"
                  :key="index"
                  class="text-sm text-neutral-700 flex items-start gap-2"
                >
                  <span class="text-neutral-400">•</span>
                  <span>{{ step }}</span>
                </li>
              </ul>
            </div>
            <button
              @click="handleMarkRootCauseAddressed"
              class="mt-3 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-white"
            >
              Mark Root Cause Addressed
            </button>
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
          View all {{ pattern.evidence.length }} affected claims
        </button>
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
          class="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-white transition-colors text-center text-sm"
        >
          View All Claims ({{ pattern.affectedClaims.length }})
        </button>
        <button
          @click="openRecordAction"
          class="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center text-sm flex items-center justify-center gap-2"
        >
          <Icon name="heroicons:clipboard-document-check" class="w-4 h-4" />
          Record Action
        </button>
      </div>
    </div>
  </div>
</template>
