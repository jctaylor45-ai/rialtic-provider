<script setup lang="ts">
/**
 * Policy details content component
 * Displays full policy information inside a drawer
 * Maintains data parity with all Policy type fields
 */
import { format, parseISO } from 'date-fns'
import type { Policy } from '~/types'
import type { Pattern } from '~/types/enhancements'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

defineOptions({ name: 'PolicyDetailsContent' })

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const analyticsStore = useAnalyticsStore()
const router = useRouter()

// Composables
const { getPatternCategoryIcon } = usePatterns()
const {
  isModalOpen: isCodeIntelModalOpen,
  selectedCode,
  openCodeIntelligence,
  closeCodeIntelligence,
  navigateToCode,
} = useCodeIntelligence()

// Code intelligence access
const codeIntelligence = computed(() => analyticsStore.codeIntelligence)

// Format date
const formatDateLong = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '–'
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy')
  } catch {
    return dateStr
  }
}

// Get patterns related to this policy
const relatedPatterns = computed(() => {
  return patternsStore.patterns.filter(pattern =>
    pattern.relatedPolicies.includes(props.policy.id)
  )
})

// Get related policies (other policies this one references)
const linkedPolicies = computed(() => {
  if (!props.policy.relatedPolicies || props.policy.relatedPolicies.length === 0) return []
  return appStore.policies.filter(p => props.policy.relatedPolicies.includes(p.id))
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

// Trend icon
const getTrendIcon = (trend: string) => {
  const icons = {
    up: 'heroicons:arrow-trending-up',
    down: 'heroicons:arrow-trending-down',
    stable: 'heroicons:minus',
  }
  return icons[trend as keyof typeof icons] || 'heroicons:minus'
}

const getTrendClass = (trend: string) => {
  const classes = {
    up: 'text-error-600',
    down: 'text-success-600',
    stable: 'text-neutral-600',
  }
  return classes[trend as keyof typeof classes] || 'text-neutral-600'
}

// Navigate to pattern details
const viewPattern = (pattern: Pattern) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}

// Navigate to related policy
const viewRelatedPolicy = (policyId: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPolicyId', policyId)
  }
  router.push('/policies')
}

// Show code intelligence
const showCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
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
            <Icon
              v-if="policy.trend"
              :name="getTrendIcon(policy.trend)"
              class="w-4 h-4"
              :class="getTrendClass(policy.trend)"
              :title="`Trend: ${policy.trend}`"
            />
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

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Hit Rate</div>
          <div class="text-lg font-semibold text-neutral-900">{{ formatPercentage(policy.hitRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Denial Rate</div>
          <div class="text-lg font-semibold text-error-700">{{ formatPercentage(policy.denialRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Appeal Rate</div>
          <div class="text-lg font-semibold text-warning-700">{{ formatPercentage(policy.appealRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Overturn Rate</div>
          <div class="text-lg font-semibold text-success-700">{{ formatPercentage(policy.overturnRate) }}</div>
        </div>
      </div>

      <!-- Secondary Metrics -->
      <div class="grid grid-cols-4 gap-3 mt-3">
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Total Impact</div>
          <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(policy.impact) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Insight Count</div>
          <div class="text-lg font-semibold text-neutral-900">{{ policy.insightCount }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Providers Impacted</div>
          <div class="text-lg font-semibold text-neutral-900">{{ policy.providersImpacted }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Recent Tests</div>
          <div class="text-lg font-semibold text-neutral-900">{{ policy.recentTests }}</div>
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

      <!-- Policy Details Grid -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Policy Details</h3>
        <div class="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <div class="text-neutral-500 text-xs mb-1">Topic</div>
            <div class="text-neutral-900 font-medium">{{ policy.topic }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Source</div>
            <div class="text-neutral-900 font-medium">{{ policy.source }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Logic Type</div>
            <div class="text-neutral-900 font-medium">{{ policy.logicType || '–' }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Effective Date</div>
            <div class="text-neutral-900 font-medium">{{ formatDateLong(policy.effectiveDate) }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Learning Markers</div>
            <div class="text-neutral-900 font-medium">{{ policy.learningMarkersCount }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Trend</div>
            <div class="flex items-center gap-1">
              <Icon :name="getTrendIcon(policy.trend)" class="w-4 h-4" :class="getTrendClass(policy.trend)" />
              <span class="text-neutral-900 font-medium capitalize">{{ policy.trend }}</span>
            </div>
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

      <!-- Applicable Codes -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Applicable Codes</h3>

        <!-- Procedure Codes -->
        <div v-if="policy.procedureCodes && policy.procedureCodes.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Procedure Codes (CPT/HCPCS)</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="code in policy.procedureCodes"
              :key="code"
              class="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-mono rounded border border-primary-200 hover:bg-primary-100 transition-colors"
              :class="{ 'cursor-pointer': codeIntelligence.has(code) }"
              @click="codeIntelligence.has(code) ? showCodeIntelligence(code) : null"
            >
              {{ code }}
              <Icon v-if="codeIntelligence.has(code)" name="heroicons:information-circle" class="w-3 h-3 ml-1 inline" />
            </button>
          </div>
        </div>

        <!-- Diagnosis Codes -->
        <div v-if="policy.diagnosisCodes && policy.diagnosisCodes.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Diagnosis Codes (ICD-10)</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="code in policy.diagnosisCodes"
              :key="code"
              class="px-2 py-1 bg-secondary-50 text-secondary-700 text-xs font-mono rounded border border-secondary-200"
            >
              {{ code }}
            </span>
          </div>
        </div>

        <!-- Modifiers -->
        <div v-if="policy.modifiers && policy.modifiers.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Modifiers</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="modifier in policy.modifiers"
              :key="modifier"
              class="px-2 py-1 bg-warning-50 text-warning-700 text-xs font-mono rounded border border-warning-200"
            >
              {{ modifier }}
            </span>
          </div>
        </div>

        <!-- Place of Service -->
        <div v-if="policy.placeOfService && policy.placeOfService.length > 0">
          <div class="text-xs text-neutral-600 mb-2">Place of Service</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="pos in policy.placeOfService"
              :key="pos"
              class="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-mono rounded border border-neutral-200"
            >
              {{ pos }}
            </span>
          </div>
        </div>

        <!-- No codes message -->
        <div v-if="!policy.procedureCodes?.length && !policy.diagnosisCodes?.length && !policy.modifiers?.length && !policy.placeOfService?.length" class="text-sm text-neutral-500">
          No specific codes configured for this policy.
        </div>
      </div>

      <!-- Restrictions -->
      <div v-if="policy.ageRestrictions || policy.frequencyLimits" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Restrictions</h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- Age Restrictions -->
          <div v-if="policy.ageRestrictions" class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Age Restrictions</div>
            <div class="text-sm font-medium text-neutral-900">
              <span v-if="policy.ageRestrictions.min !== undefined && policy.ageRestrictions.max !== undefined">
                {{ policy.ageRestrictions.min }} - {{ policy.ageRestrictions.max }} years
              </span>
              <span v-else-if="policy.ageRestrictions.min !== undefined">
                {{ policy.ageRestrictions.min }}+ years
              </span>
              <span v-else-if="policy.ageRestrictions.max !== undefined">
                Up to {{ policy.ageRestrictions.max }} years
              </span>
            </div>
          </div>

          <!-- Frequency Limits -->
          <div v-if="policy.frequencyLimits" class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Frequency Limits</div>
            <div class="text-sm font-medium text-neutral-900">
              {{ policy.frequencyLimits.count }} per {{ policy.frequencyLimits.period }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reference Documents -->
      <div v-if="policy.referenceDocs && policy.referenceDocs.length > 0" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Reference Documents</h3>
        <div class="space-y-2">
          <a
            v-for="doc in policy.referenceDocs"
            :key="doc.url"
            :href="doc.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-neutral-500" />
              <div>
                <div class="text-sm font-medium text-neutral-900">{{ doc.title }}</div>
                <div class="text-xs text-neutral-500">{{ doc.source }}</div>
              </div>
            </div>
            <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4 text-neutral-400" />
          </a>
        </div>
      </div>

      <!-- Related Policies -->
      <div v-if="linkedPolicies.length > 0" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Related Policies</h3>
        <div class="space-y-2">
          <div
            v-for="relPolicy in linkedPolicies"
            :key="relPolicy.id"
            class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
            @click="viewRelatedPolicy(relPolicy.id)"
          >
            <div>
              <div class="text-sm font-medium text-neutral-900">{{ relPolicy.name }}</div>
              <div class="text-xs text-neutral-500">{{ relPolicy.id }}</div>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded"
              :class="getModeClass(relPolicy.mode)"
            >
              {{ relPolicy.mode }}
            </span>
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
        <NuxtLink
          to="/claim-lab"
          class="flex-1 py-2 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors text-sm text-center no-underline"
        >
          Test in Claim Lab
        </NuxtLink>
        <button
          class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-white transition-colors text-sm"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Code Intelligence Modal -->
    <CodeIntelligenceModal
      :code="selectedCode"
      :is-open="isCodeIntelModalOpen"
      @close="closeCodeIntelligence"
      @navigate-to-code="navigateToCode"
    />
  </div>
</template>
