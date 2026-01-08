<script setup lang="ts">
/**
 * Claim details content component
 * Displays claim information inside a drawer
 */
import { format, parseISO } from 'date-fns'
import type { Pattern } from '~/types/enhancements'

const props = defineProps<{
  claimId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

defineOptions({ name: 'ClaimDetailsContent' })

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const analyticsStore = useAnalyticsStore()

// Composables
const { getPatternCategoryIcon, getPatternTierBadgeClass, startPracticeSession } = usePatterns()
const { formatCurrency } = useAnalytics()
const { trackClaimReview } = useTracking()
const {
  isModalOpen: isCodeIntelModalOpen,
  selectedCode,
  openCodeIntelligence,
  closeCodeIntelligence,
  navigateToCode,
} = useCodeIntelligence()

// Format date as "Mar 12, 2018"
const formatDateLong = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '–'
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy')
  } catch {
    return dateStr
  }
}

const claim = computed(() => {
  const foundClaim = appStore.getClaimById(props.claimId)
  return foundClaim ? ensureLineItems(foundClaim) : null
})

// Get patterns that match this claim
const matchingPatterns = computed(() => {
  if (!claim.value) return []
  return patternsStore.getPatternsByClaim(claim.value.id)
})

// Primary pattern (highest tier)
const primaryPattern = computed(() => {
  if (matchingPatterns.value.length === 0) return null
  const tierPriority = { critical: 4, high: 3, medium: 2, low: 1 }
  return matchingPatterns.value.sort((a, b) =>
    tierPriority[b.tier] - tierPriority[a.tier]
  )[0]
})

// Total risk from all matching patterns
const totalPatternRisk = computed(() => {
  return matchingPatterns.value.reduce((sum, p) => sum + p.avgDenialAmount, 0)
})

// Get related policy for this claim
const relatedPolicy = computed(() => {
  if (!claim.value || !claim.value.policyIds || claim.value.policyIds.length === 0) return null
  return appStore.policies.find(p => claim.value!.policyIds!.includes(p.id)) || null
})

// Code intelligence access
const codeIntelligence = computed(() => analyticsStore.codeIntelligence)

// Methods
const practicePattern = async (pattern: Pattern) => {
  await startPracticeSession(pattern)
}

const showCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
}

const viewPolicy = (policy: any) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPolicyId', policy.id)
  }
  navigateTo('/policies')
}

// Track claim view
onMounted(() => {
  if (claim.value) {
    trackClaimReview(claim.value.id, 0)
  }
})
</script>

<template>
  <!-- Not Found State -->
  <div v-if="!claim" class="flex-1 flex items-center justify-center p-8">
    <div class="text-center">
      <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-neutral-900 mb-2">Claim Not Found</h2>
      <p class="text-neutral-600 mb-4">The claim you're looking for doesn't exist.</p>
      <button
        @click="emit('close')"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Close
      </button>
    </div>
  </div>

  <!-- Claim Content -->
  <div v-else class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-neutral-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-neutral-900">{{ claim.id }}</h1>
          <span
            class="px-3 py-1 text-sm font-medium rounded"
            :class="{
              'bg-success-100 text-success-700': claim.status === 'approved' || claim.status === 'paid',
              'bg-error-100 text-error-700': claim.status === 'denied',
              'bg-warning-100 text-warning-700': claim.status === 'pending',
              'bg-secondary-100 text-secondary-700': claim.status === 'appealed',
            }"
          >
            {{ claim.status.charAt(0).toUpperCase() + claim.status.slice(1) }}
          </span>
        </div>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      <!-- Claim Header Grid -->
      <div class="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
        <div>
          <div class="text-neutral-500 text-xs mb-1">Patient</div>
          <div class="text-neutral-900 font-medium">{{ claim.patientName }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Date of Service</div>
          <div class="text-neutral-900 font-medium">{{ formatDateLong(claim.dateOfService) }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Billed Amount</div>
          <div class="text-neutral-900 font-medium">{{ formatCurrency(claim.billedAmount) }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Member ID</div>
          <div class="text-neutral-900 font-medium">{{ claim.memberId || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Provider</div>
          <div class="text-neutral-900 font-medium">{{ claim.providerName || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Amount Paid</div>
          <div class="text-neutral-900 font-medium">{{ formatCurrency(claim.paidAmount || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Pattern Matches -->
      <div v-if="matchingPatterns.length > 0" class="p-6 border-b border-neutral-200">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-start gap-3 mb-3">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-orange-900">
                {{ matchingPatterns.length }} Matching Pattern{{ matchingPatterns.length > 1 ? 's' : '' }}
              </h3>
            </div>
          </div>
          <div class="space-y-2">
            <div
              v-for="pattern in matchingPatterns.slice(0, 3)"
              :key="pattern.id"
              class="flex items-center justify-between bg-white rounded p-2 text-sm"
            >
              <div class="flex items-center gap-2">
                <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-4 h-4 text-orange-600" />
                <span class="text-neutral-900">{{ pattern.title }}</span>
              </div>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="getPatternTierBadgeClass(pattern.tier)"
              >
                {{ pattern.tier.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="p-6 border-b border-neutral-200">
        <h2 class="text-sm font-semibold text-neutral-900 mb-3">Line Items</h2>
        <div class="space-y-3">
          <div
            v-for="item in claim.lineItems"
            :key="item.lineNumber"
            class="bg-neutral-50 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-neutral-600">Line {{ item.lineNumber }}</span>
                <span class="font-mono text-sm font-medium text-primary-700">{{ item.procedureCode }}</span>
              </div>
              <span class="text-sm font-semibold text-neutral-900">{{ formatCurrency(item.billedAmount) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span class="text-neutral-500">Units:</span>
                <span class="ml-1 text-neutral-900">{{ item.units || 1 }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Modifiers:</span>
                <span class="ml-1 text-neutral-900 font-mono">{{ item.modifiers?.join(', ') || '–' }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Paid:</span>
                <span class="ml-1 text-neutral-900">{{ formatCurrency(item.paidAmount || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Denial Reason -->
      <div v-if="claim.status === 'denied'" class="p-6 border-b border-neutral-200">
        <div class="bg-error-50 border border-error-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:x-circle" class="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-sm font-semibold text-error-900 mb-1">Denial Reason</h3>
              <p class="text-sm text-error-800">{{ claim.denialReason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Fix Guidance -->
      <div v-if="claim.status === 'denied' && primaryPattern" class="p-6">
        <div class="bg-success-50 border border-success-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:wrench-screwdriver" class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-sm font-semibold text-success-900 mb-1">How to Fix</h3>
              <p class="text-sm text-success-800 mb-3">{{ primaryPattern.suggestedAction }}</p>
              <button
                @click="practicePattern(primaryPattern)"
                class="px-3 py-1.5 bg-success-600 text-white text-xs font-medium rounded hover:bg-success-700 transition-colors"
              >
                Practice in Claim Lab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/claim-lab?claim=${claim.id}`"
          class="flex-1 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center text-sm no-underline"
        >
          Open in Claim Lab
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
