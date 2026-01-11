<script setup lang="ts">
/**
 * Policy details content component
 * Displays full policy information inside a drawer
 * Uses PaAPI-compatible Policy format
 */
import { format, parseISO } from 'date-fns'
import type { Policy } from '~/types'
import type { Pattern } from '~/types/enhancements'
import { normalizePolicyForDisplay, type DisplayPolicy } from '~/composables/usePolicyDisplay'
import { normalizeClaimForDisplay, type DisplayClaim } from '~/composables/useClaimDisplay'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  close: []
}>()

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const analyticsStore = useAnalyticsStore()
const router = useRouter()

// Normalize policy for template display
const displayPolicy = computed<DisplayPolicy>(() => {
  return normalizePolicyForDisplay(props.policy)
})

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
    pattern.relatedPolicies?.some(rp => rp === props.policy.id)
  )
})

// Get related policies (other policies this one references) - empty for PaAPI format
const linkedPolicies = computed<Policy[]>(() => {
  return []
})

// Get claims that hit this policy
const policyClaimsData = computed(() => {
  // For PaAPI format, we filter claims that have this policy in their insights
  const rawClaims = appStore.claims
  const matchingClaims: DisplayClaim[] = []

  for (const rawClaim of rawClaims) {
    // Check if this claim has insights related to this policy
    const hasPolicy = (rawClaim as any).claimLines?.some((line: any) =>
      line.insights?.some((insight: any) => insight.policyId === props.policy.id)
    ) || (rawClaim as any).policies?.some((p: any) => p.id === props.policy.id)

    if (hasPolicy) {
      matchingClaims.push(normalizeClaimForDisplay(rawClaim as any))
    }
  }

  // Calculate summary stats
  const totalBilled = matchingClaims.reduce((sum, c) => sum + c.billedAmount, 0)
  const deniedClaims = matchingClaims.filter(c => c.status === 'denied')
  const deniedAmount = deniedClaims.reduce((sum, c) => sum + c.billedAmount, 0)

  return {
    claims: matchingClaims,
    totalCount: matchingClaims.length,
    totalBilled,
    deniedCount: deniedClaims.length,
    deniedAmount,
  }
})

// How many claims to show initially
const showAllClaims = ref(false)
const displayedClaims = computed(() => {
  if (showAllClaims.value) return policyClaimsData.value.claims
  return policyClaimsData.value.claims.slice(0, 5)
})

// Claim type icons
const getClaimTypeIcon = (claimType: string) => {
  const icons: Record<string, string> = {
    'Professional': 'heroicons:user',
    'Institutional': 'heroicons:building-office-2',
    'Dental': 'heroicons:face-smile',
    'Pharmacy': 'heroicons:beaker',
  }
  return icons[claimType] || 'heroicons:document-text'
}

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

// Navigate to claim details
const viewClaim = (claimId: string) => {
  router.push({ path: '/claims', query: { claim: claimId } })
}

// Get status badge class
const getStatusClass = (status: string) => {
  const classes = {
    approved: 'bg-success-100 text-success-700',
    paid: 'bg-success-100 text-success-700',
    denied: 'bg-error-100 text-error-700',
    pending: 'bg-warning-100 text-warning-700',
    appealed: 'bg-secondary-100 text-secondary-700',
  }
  return classes[status as keyof typeof classes] || 'bg-neutral-100 text-neutral-700'
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
          <div class="text-lg font-semibold text-neutral-900">{{ formatPercentage(displayPolicy.hitRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Denial Rate</div>
          <div class="text-lg font-semibold text-error-700">{{ formatPercentage(displayPolicy.denialRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Appeal Rate</div>
          <div class="text-lg font-semibold text-warning-700">{{ formatPercentage(displayPolicy.appealRate) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Overturn Rate</div>
          <div class="text-lg font-semibold text-success-700">{{ formatPercentage(displayPolicy.overturnRate) }}</div>
        </div>
      </div>

      <!-- Secondary Metrics -->
      <div class="grid grid-cols-4 gap-3 mt-3">
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Total Impact</div>
          <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(displayPolicy.impact) }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Insight Count</div>
          <div class="text-lg font-semibold text-neutral-900">{{ displayPolicy.insightCount }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Providers Impacted</div>
          <div class="text-lg font-semibold text-neutral-900">{{ displayPolicy.providersImpacted }}</div>
        </div>
        <div class="bg-neutral-50 rounded-lg p-3">
          <div class="text-xs text-neutral-600 mb-1">Recent Tests</div>
          <div class="text-lg font-semibold text-neutral-900">{{ displayPolicy.recentTests }}</div>
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
            <div class="text-neutral-900 font-medium">{{ displayPolicy.topicName || '–' }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Mode</div>
            <div class="text-neutral-900 font-medium">{{ displayPolicy.mode }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Logic Type</div>
            <div class="text-neutral-900 font-medium">{{ displayPolicy.logicType || '–' }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Effective Date</div>
            <div class="text-neutral-900 font-medium">{{ formatDateLong(displayPolicy.effectiveDate) }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Trend</div>
            <div class="flex items-center gap-1">
              <Icon :name="getTrendIcon(displayPolicy.trend || '')" class="w-4 h-4" :class="getTrendClass(displayPolicy.trend || '')" />
              <span class="text-neutral-900 font-medium capitalize">{{ displayPolicy.trend || '–' }}</span>
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
      <div v-if="displayPolicy.clinicalRationale" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-2">Clinical Rationale</h3>
        <p class="text-sm text-neutral-700">{{ displayPolicy.clinicalRationale }}</p>
      </div>

      <!-- Guidance -->
      <div v-if="displayPolicy.commonMistake || displayPolicy.fixGuidance" class="p-6 border-b border-neutral-200">
        <div class="grid grid-cols-1 gap-4">
          <div v-if="displayPolicy.commonMistake">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Common Mistake</h3>
            <p class="text-sm text-neutral-700">{{ displayPolicy.commonMistake }}</p>
          </div>
          <div v-if="displayPolicy.fixGuidance">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Fix Guidance</h3>
            <p class="text-sm text-neutral-700">{{ displayPolicy.fixGuidance }}</p>
          </div>
        </div>
      </div>

      <!-- Applicable Codes -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Applicable Codes</h3>

        <!-- Procedure Codes -->
        <div v-if="displayPolicy.procedureCodes && displayPolicy.procedureCodes.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Procedure Codes (CPT/HCPCS)</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="code in displayPolicy.procedureCodes"
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
        <div v-if="displayPolicy.diagnosisCodes && displayPolicy.diagnosisCodes.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Diagnosis Codes (ICD-10)</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="code in displayPolicy.diagnosisCodes"
              :key="code"
              class="px-2 py-1 bg-secondary-50 text-secondary-700 text-xs font-mono rounded border border-secondary-200"
            >
              {{ code }}
            </span>
          </div>
        </div>

        <!-- Modifiers -->
        <div v-if="displayPolicy.modifiers && displayPolicy.modifiers.length > 0" class="mb-4">
          <div class="text-xs text-neutral-600 mb-2">Modifiers</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="modifier in displayPolicy.modifiers"
              :key="modifier"
              class="px-2 py-1 bg-warning-50 text-warning-700 text-xs font-mono rounded border border-warning-200"
            >
              {{ modifier }}
            </span>
          </div>
        </div>

        <!-- Place of Service -->
        <div v-if="displayPolicy.placesOfService && displayPolicy.placesOfService.length > 0">
          <div class="text-xs text-neutral-600 mb-2">Place of Service</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="pos in displayPolicy.placesOfService"
              :key="pos"
              class="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-mono rounded border border-neutral-200"
            >
              {{ pos }}
            </span>
          </div>
        </div>

        <!-- No codes message -->
        <div v-if="!displayPolicy.procedureCodes?.length && !displayPolicy.diagnosisCodes?.length && !displayPolicy.modifiers?.length && !displayPolicy.placesOfService?.length" class="text-sm text-neutral-500">
          No specific codes configured for this policy.
        </div>
      </div>

      <!-- Restrictions -->
      <div v-if="displayPolicy.age_restrictions || displayPolicy.frequency_limits" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Restrictions</h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- Age Restrictions -->
          <div v-if="displayPolicy.age_restrictions" class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Age Restrictions</div>
            <div class="text-sm font-medium text-neutral-900">
              <span v-if="displayPolicy.age_restrictions.min !== undefined && displayPolicy.age_restrictions.max !== undefined">
                {{ displayPolicy.age_restrictions.min }} - {{ displayPolicy.age_restrictions.max }} years
              </span>
              <span v-else-if="displayPolicy.age_restrictions.min !== undefined">
                {{ displayPolicy.age_restrictions.min }}+ years
              </span>
              <span v-else-if="displayPolicy.age_restrictions.max !== undefined">
                Up to {{ displayPolicy.age_restrictions.max }} years
              </span>
            </div>
          </div>

          <!-- Frequency Limits -->
          <div v-if="displayPolicy.frequency_limits" class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Frequency Limits</div>
            <div class="text-sm font-medium text-neutral-900">
              {{ displayPolicy.frequency_limits.count }} per {{ displayPolicy.frequency_limits.period }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reference Documents -->
      <div v-if="displayPolicy.referenceDocs && displayPolicy.referenceDocs.length > 0" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Reference Documents</h3>
        <div class="space-y-2">
          <a
            v-for="doc in displayPolicy.referenceDocs"
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
            <Icon name="heroicons:chevron-right" class="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>

      <!-- Claims Hitting This Policy -->
      <div class="p-6 border-b border-neutral-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-neutral-900">Claims Hitting This Policy</h3>
          <span class="text-xs text-neutral-500">{{ policyClaimsData.totalCount }} total</span>
        </div>

        <!-- Summary Stats -->
        <div v-if="policyClaimsData.totalCount > 0" class="grid grid-cols-4 gap-3 mb-4">
          <div class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Total Claims</div>
            <div class="text-lg font-semibold text-neutral-900">{{ policyClaimsData.totalCount }}</div>
          </div>
          <div class="bg-neutral-50 rounded-lg p-3">
            <div class="text-xs text-neutral-600 mb-1">Total Billed</div>
            <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(policyClaimsData.totalBilled) }}</div>
          </div>
          <div class="bg-error-50 rounded-lg p-3">
            <div class="text-xs text-error-600 mb-1">Denied Claims</div>
            <div class="text-lg font-semibold text-error-700">{{ policyClaimsData.deniedCount }}</div>
          </div>
          <div class="bg-error-50 rounded-lg p-3">
            <div class="text-xs text-error-600 mb-1">Denied Amount</div>
            <div class="text-lg font-semibold text-error-700">{{ formatCurrency(policyClaimsData.deniedAmount) }}</div>
          </div>
        </div>

        <!-- Claims List -->
        <div v-if="policyClaimsData.totalCount > 0" class="space-y-2">
          <div
            v-for="claim in displayedClaims"
            :key="claim.id"
            class="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-colors"
            @click="viewClaim(claim.id)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-sm font-medium text-primary-600">{{ claim.id }}</span>
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  :class="getStatusClass(claim.status)"
                >
                  {{ claim.status.charAt(0).toUpperCase() + claim.status.slice(1) }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-neutral-600">
                <span>{{ claim.patientName }}</span>
                <span>{{ formatDateLong(claim.dateOfService) }}</span>
                <span v-if="claim.denialReason" class="text-error-600 truncate max-w-48" :title="claim.denialReason">
                  {{ claim.denialReason }}
                </span>
              </div>
            </div>
            <div class="text-right pl-4">
              <div class="text-sm font-semibold text-neutral-900">{{ formatCurrency(claim.billedAmount) }}</div>
              <div v-if="claim.paidAmount" class="text-xs text-success-600">Paid: {{ formatCurrency(claim.paidAmount) }}</div>
            </div>
          </div>

          <!-- Show More/Less Button -->
          <div v-if="policyClaimsData.totalCount > 5" class="pt-2">
            <button
              class="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              @click="showAllClaims = !showAllClaims"
            >
              {{ showAllClaims ? 'Show Less' : `Show All ${policyClaimsData.totalCount} Claims` }}
            </button>
          </div>
        </div>

        <!-- No Claims Message -->
        <div v-else class="text-center py-8">
          <Icon name="heroicons:document-magnifying-glass" class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p class="text-sm text-neutral-500">No claims have hit this policy yet.</p>
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
