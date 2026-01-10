<script setup lang="ts">
/**
 * Claim details content component
 * Displays full claim information inside a drawer
 * Maintains data parity with original full-page view
 * Enhanced with line-level denial analysis and recovery status
 */
import { format, parseISO } from 'date-fns'
import type { Pattern } from '~/types/enhancements'
import type { Claim } from '~/types'
import { useClaimRecovery } from '~/composables/useClaimRecovery'

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

// Recovery status composable
const {
  computeLineRecovery,
  getPolicyDetails,
  getRecoveryStatusColor,
  getRecoveryStatusBgColor,
  getRecoveryStatusLabel,
  getRecoveryStatusIcon,
} = useClaimRecovery()

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

// Fetch full claim details from API (includes line items)
const claimData = ref<Claim | null>(null)
const isLoadingClaim = ref(false)
const claimError = ref<string | null>(null)

async function fetchClaimDetails() {
  isLoadingClaim.value = true
  claimError.value = null
  try {
    const response = await $fetch<Claim>(`/api/v1/claims/${props.claimId}`)
    claimData.value = response
  } catch (err) {
    console.error('Failed to fetch claim details:', err)
    claimError.value = 'Failed to load claim details'
    // Fall back to store data if API fails
    const storeClaim = appStore.getClaimById(props.claimId)
    if (storeClaim) {
      claimData.value = ensureLineItems(storeClaim)
    }
  } finally {
    isLoadingClaim.value = false
  }
}

// Fetch claim details when claimId changes
watch(() => props.claimId, () => {
  fetchClaimDetails()
}, { immediate: true })

const claim = computed(() => {
  return claimData.value ? ensureLineItems(claimData.value) : null
})

// Track expanded lines
const expandedLines = ref<number[]>([])

// Auto-expand denied lines on claim load
watch(() => claim.value, (newClaim) => {
  if (newClaim?.lineItems) {
    expandedLines.value = newClaim.lineItems
      .filter(line => line.status === 'denied')
      .map(line => line.lineNumber)
  }
}, { immediate: true })

// Toggle line expansion
const toggleLineExpansion = (lineNumber: number) => {
  const index = expandedLines.value.indexOf(lineNumber)
  if (index === -1) {
    expandedLines.value.push(lineNumber)
  } else {
    expandedLines.value.splice(index, 1)
  }
}

const isLineExpanded = (lineNumber: number) => expandedLines.value.includes(lineNumber)

// Compute enriched line items with policy details and recovery
const enrichedLineItems = computed(() => {
  if (!claim.value?.lineItems) return []

  return claim.value.lineItems.map(line => {
    // Use policies from API response (line.policies) instead of policiesTriggered
    const apiPolicies = line.policies || []

    // Transform API policy data to the format expected by the template
    const policyDetails = apiPolicies.map((p: NonNullable<typeof line.policies>[number]) => {
      // Get additional policy info from store if available
      const storePolicy = appStore.policies.find(sp => sp.id === p.policyId)
      return {
        policyId: p.policyId,
        policyName: p.policyName,
        logicType: storePolicy?.logicType || p.policyMode || 'Edit',
        description: p.denialReason || storePolicy?.description || '',
        fixGuidance: storePolicy?.fixGuidance || 'Review and correct the issue before resubmission',
        isDenied: p.isDenied,
        deniedAmount: p.deniedAmount,
      }
    })

    // Extract policy IDs for recovery computation
    const policyIds = apiPolicies.map((p: NonNullable<typeof line.policies>[number]) => p.policyId)
    const recovery = computeLineRecovery(
      policyIds,
      line.editsFired || []
    )

    return {
      ...line,
      policyDetails,
      recovery,
    }
  })
})

// Summary stats for denied lines
const lineSummary = computed(() => {
  const lines = enrichedLineItems.value
  const deniedLines = lines.filter(l => l.status === 'denied')
  const deniedAmount = deniedLines.reduce((sum, l) => sum + (l.billedAmount || 0), 0)
  const recoverableAmount = deniedLines
    .filter(l => l.recovery.status !== 'not_recoverable')
    .reduce((sum, l) => sum + (l.billedAmount || 0), 0)

  return {
    total: lines.length,
    denied: deniedLines.length,
    deniedAmount,
    recoverableAmount,
    notRecoverableAmount: deniedAmount - recoverableAmount,
  }
})

// Navigate to Claim Lab with line focus
const testLineInClaimLab = (lineNumber: number) => {
  const patternId = matchingPatterns.value[0]?.id
  navigateTo({
    path: '/claim-lab',
    query: {
      claim: claim.value?.id,
      pattern: patternId || undefined,
      focusLine: lineNumber.toString(),
    },
  })
}

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
  <!-- Loading State -->
  <div v-if="isLoadingClaim" class="flex-1 flex items-center justify-center p-8">
    <div class="text-center">
      <UiLoading size="lg" class="mx-auto mb-4" />
      <p class="text-sm text-neutral-600">Loading claim details...</p>
    </div>
  </div>

  <!-- Not Found State -->
  <div v-else-if="!claim" class="flex-1 flex items-center justify-center p-8">
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

      <!-- Claim Header Grid - Full data -->
      <div class="grid grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <!-- Row 1 -->
        <div>
          <div class="text-neutral-500 text-xs mb-1">Claim type</div>
          <div class="text-neutral-900 font-medium">{{ claim.claimType || 'Professional' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Patient name</div>
          <div class="text-neutral-900 font-medium">{{ claim.patientName }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Patient birthdate</div>
          <div class="text-neutral-900 font-medium">{{ claim.patientDOB ? formatDateLong(claim.patientDOB) : '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Patient sex</div>
          <div class="text-neutral-900 font-medium">{{ claim.patientSex || '–' }}</div>
        </div>

        <!-- Row 2 -->
        <div>
          <div class="text-neutral-500 text-xs mb-1">Date(s) of service</div>
          <div class="text-neutral-900 font-medium">
            {{ formatDateLong(claim.dateOfService) }}{{ claim.dateOfServiceEnd && claim.dateOfServiceEnd !== claim.dateOfService ? ' – ' + formatDateLong(claim.dateOfServiceEnd) : '' }}
          </div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Member ID</div>
          <div class="text-neutral-900 font-medium">{{ claim.memberId || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Member group ID</div>
          <div class="text-neutral-900 font-medium">{{ claim.memberGroupId || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Total charged</div>
          <div class="text-neutral-900 font-medium">{{ formatCurrency(claim.billedAmount) }}</div>
        </div>

        <!-- Row 3 -->
        <div class="col-span-2">
          <div class="text-neutral-500 text-xs mb-1">Billing provider ID</div>
          <div class="text-neutral-900 font-medium">{{ claim.providerName || 'no name' }}</div>
          <div class="text-xs text-neutral-600 mt-0.5">
            <span v-if="claim.billingProviderTIN">TIN: {{ claim.billingProviderTIN }}</span>
            <span v-if="claim.billingProviderTIN && claim.billingProviderNPI"> · </span>
            <span v-if="claim.billingProviderNPI">NPI: {{ claim.billingProviderNPI }}</span>
            <span v-if="!claim.billingProviderTIN && !claim.billingProviderNPI">–</span>
          </div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Billing provider taxonomy</div>
          <div class="text-neutral-900 font-medium">{{ claim.billingProviderTaxonomy || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Specialty codes</div>
          <div class="text-neutral-900 font-medium">{{ claim.specialtyCodes?.join(', ') || '–' }}</div>
        </div>

        <!-- Row 4 -->
        <div>
          <div class="text-neutral-500 text-xs mb-1">Prior auth #</div>
          <div class="text-neutral-900 font-medium">{{ claim.priorAuthNumber || '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">LTSS indicator</div>
          <div class="text-neutral-900 font-medium">{{ claim.ltssIndicator === true ? 'Yes' : claim.ltssIndicator === false ? 'No' : '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Par indicator</div>
          <div class="text-neutral-900 font-medium">{{ claim.parIndicator === true ? 'Yes' : claim.parIndicator === false ? 'No' : '–' }}</div>
        </div>
        <div>
          <div class="text-neutral-500 text-xs mb-1">Amount paid</div>
          <div class="text-neutral-900 font-medium">{{ formatCurrency(claim.paidAmount || 0) }}</div>
        </div>

        <!-- Row 5 - Diagnosis codes (full width) -->
        <div class="col-span-4">
          <div class="text-neutral-500 text-xs mb-1">Diagnosis codes</div>
          <div class="text-neutral-900 font-medium font-mono">
            {{ claim.diagnosisCodes?.join(' ,  ') || '–' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Pattern Matches (if any) -->
      <div v-if="matchingPatterns.length > 0" class="p-6">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-4">
            <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-orange-900 mb-1">
                {{ matchingPatterns.length }} Matching Pattern{{ matchingPatterns.length > 1 ? 's' : '' }} Detected
              </h3>
              <p class="text-sm text-orange-800">
                This claim matches known denial patterns. Review the patterns below for guidance on how to avoid similar denials.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="pattern in matchingPatterns"
              :key="pattern.id"
              class="bg-white border border-orange-200 rounded-lg p-4 hover:border-orange-400 cursor-pointer transition-colors"
              @click="navigateTo(`/insights`)"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-3">
                  <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 class="font-medium text-neutral-900">{{ pattern.title }}</h4>
                    <p class="text-xs text-neutral-600 mt-0.5">{{ pattern.category }}</p>
                  </div>
                </div>
                <span
                  class="px-2 py-1 text-xs font-medium rounded border"
                  :class="getPatternTierBadgeClass(pattern.tier)"
                >
                  {{ pattern.tier.toUpperCase() }}
                </span>
              </div>

              <p class="text-sm text-neutral-700 mb-3">{{ pattern.description }}</p>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 text-xs text-neutral-600">
                  <span>{{ pattern.score.frequency }} occurrences</span>
                  <span>{{ formatCurrency(pattern.avgDenialAmount) }} avg denial</span>
                  <span>{{ pattern.learningProgress }}% learned</span>
                </div>
                <button
                  class="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors"
                  @click.stop="practicePattern(pattern)"
                >
                  Practice
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <NuxtLink
              to="/insights"
              class="text-sm font-medium text-orange-700 hover:text-orange-800 no-underline flex items-center gap-1"
            >
              View all patterns
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Line-Level Analysis Summary -->
      <div v-if="claim.status === 'denied' && lineSummary.denied > 0" class="px-6 pb-6">
        <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-neutral-900 mb-3">LINE-BY-LINE ANALYSIS</h3>

          <div class="flex items-center gap-6 text-sm">
            <div>
              <span class="text-neutral-600">Lines Denied:</span>
              <span class="font-semibold text-error-600 ml-1">
                {{ lineSummary.denied }} of {{ lineSummary.total }}
              </span>
            </div>
            <div>
              <span class="text-neutral-600">Amount at Risk:</span>
              <span class="font-semibold text-neutral-900 ml-1">
                {{ formatCurrency(lineSummary.deniedAmount) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-success-600">
                <Icon name="heroicons:check-circle" class="w-4 h-4" />
                {{ formatCurrency(lineSummary.recoverableAmount) }} recoverable
              </span>
              <span v-if="lineSummary.notRecoverableAmount > 0" class="inline-flex items-center gap-1 text-error-600">
                <Icon name="heroicons:x-circle" class="w-4 h-4" />
                {{ formatCurrency(lineSummary.notRecoverableAmount) }} not recoverable
              </span>
            </div>
          </div>

          <p class="text-xs text-neutral-500 mt-2">
            Expand each line below to see policy failures and recovery guidance
          </p>
        </div>
      </div>

      <!-- Line Items with Expandable Rows -->
      <div class="px-6 pb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">Line Items</h3>
          <span class="text-sm text-neutral-500">{{ enrichedLineItems.length }} lines</span>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <!-- Header Row -->
          <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-600 uppercase tracking-wide">
            <div class="col-span-1">Ln</div>
            <div class="col-span-2">Code</div>
            <div class="col-span-1">Mod</div>
            <div class="col-span-3">Diagnosis</div>
            <div class="col-span-1 text-center">Units</div>
            <div class="col-span-2 text-right">Charge</div>
            <div class="col-span-2 text-center">Status</div>
          </div>

          <!-- Line Item Rows -->
          <div v-for="line in enrichedLineItems" :key="line.lineNumber" class="border-b border-neutral-100 last:border-b-0">
            <!-- Main Row (always visible) -->
            <div
              class="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer hover:bg-neutral-50 transition-colors"
              :class="{ 'bg-error-50/30': line.status === 'denied' }"
              @click="toggleLineExpansion(line.lineNumber)"
            >
              <div class="col-span-1 text-sm text-neutral-600">{{ line.lineNumber }}</div>
              <div class="col-span-2">
                <button
                  @click.stop="showCodeIntelligence(line.procedureCode)"
                  class="font-mono text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {{ line.procedureCode }}
                </button>
              </div>
              <div class="col-span-1 text-sm text-neutral-600">
                {{ line.modifiers?.join(', ') || '—' }}
              </div>
              <div class="col-span-3 text-sm text-neutral-600 truncate" :title="line.diagnosisCodes?.join(', ')">
                {{ line.diagnosisCodes?.slice(0, 2).join(', ') || claim.diagnosisCodes?.slice(0, 2).join(', ') }}
                <span v-if="(line.diagnosisCodes?.length || claim.diagnosisCodes?.length || 0) > 2" class="text-neutral-400">
                  +{{ (line.diagnosisCodes?.length || claim.diagnosisCodes?.length || 0) - 2 }}
                </span>
              </div>
              <div class="col-span-1 text-sm text-neutral-600 text-center">{{ line.units }}</div>
              <div class="col-span-2 text-sm font-medium text-neutral-900 text-right">
                {{ formatCurrency(line.billedAmount) }}
              </div>
              <div class="col-span-2 flex items-center justify-center gap-2">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-success-100 text-success-700': line.status === 'approved' || line.status === 'paid',
                    'bg-error-100 text-error-700': line.status === 'denied',
                    'bg-warning-100 text-warning-700': line.status === 'pending',
                  }"
                >
                  <Icon
                    :name="line.status === 'denied' ? 'heroicons:x-circle' : 'heroicons:check-circle'"
                    class="w-3 h-3"
                  />
                  {{ line.status }}
                </span>
                <Icon
                  :name="isLineExpanded(line.lineNumber) ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                  class="w-4 h-4 text-neutral-400"
                />
              </div>
            </div>

            <!-- Expanded Detail (conditional) -->
            <div
              v-if="isLineExpanded(line.lineNumber)"
              class="px-4 py-4 bg-neutral-50 border-t border-neutral-200"
            >
              <!-- Policy Failures (stacked cards) -->
              <div v-if="line.policyDetails && line.policyDetails.length > 0" class="mb-4">
                <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                  Policy Failures ({{ line.policyDetails.length }})
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="policy in line.policyDetails"
                    :key="policy.policyId"
                    class="bg-white border border-neutral-200 rounded-lg p-3"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <span class="text-xs font-mono text-neutral-500">{{ policy.policyId }}</span>
                        <h5 class="text-sm font-medium text-neutral-900">{{ policy.policyName }}</h5>
                      </div>
                      <span class="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                        {{ policy.logicType }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-600 mb-2">{{ policy.description }}</p>
                    <button
                      @click="viewPolicy(appStore.policies.find(p => p.id === policy.policyId))"
                      class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Full Policy →
                    </button>
                  </div>
                </div>
              </div>

              <!-- Edits Fired (fallback if no policy details) -->
              <div v-else-if="line.editsFired && line.editsFired.length > 0" class="mb-4">
                <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                  Denial Reasons
                </h4>
                <ul class="space-y-1">
                  <li v-for="(edit, idx) in line.editsFired" :key="idx" class="flex items-start gap-2 text-sm text-neutral-700">
                    <Icon name="heroicons:exclamation-triangle" class="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                    {{ edit }}
                  </li>
                </ul>
              </div>

              <!-- Recovery Status -->
              <div v-if="line.status === 'denied'" class="mb-4">
                <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                  Recovery Status
                </h4>
                <div
                  class="flex items-start gap-3 p-3 rounded-lg border"
                  :class="getRecoveryStatusBgColor(line.recovery.status)"
                >
                  <Icon
                    :name="getRecoveryStatusIcon(line.recovery.status)"
                    class="w-5 h-5 flex-shrink-0"
                    :class="getRecoveryStatusColor(line.recovery.status)"
                  />
                  <div>
                    <div class="font-medium" :class="getRecoveryStatusColor(line.recovery.status)">
                      {{ getRecoveryStatusLabel(line.recovery.status) }}
                    </div>
                    <p class="text-sm text-neutral-700 mt-1">{{ line.recovery.guidance }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="line.status === 'denied'" class="flex items-center gap-3">
                <button
                  @click="testLineInClaimLab(line.lineNumber)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Icon name="heroicons:beaker" class="w-4 h-4" />
                  Test This Line in Claim Lab
                </button>
                <button
                  v-if="primaryPattern"
                  @click="navigateTo(`/insights?pattern=${primaryPattern.id}`)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  View Pattern →
                </button>
              </div>

              <!-- Approved line message -->
              <div v-if="line.status !== 'denied'" class="text-sm text-success-600 flex items-center gap-2">
                <Icon name="heroicons:check-circle" class="w-5 h-5" />
                This line has no policy failures
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WHY THIS WAS DENIED -->
      <div v-if="claim.status === 'denied'" class="px-6 pb-6">
        <div class="bg-error-50 border border-error-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-6">
            <Icon name="heroicons:x-circle" class="w-6 h-6 text-error-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-error-900 mb-2">WHY THIS WAS DENIED</h3>
              <div class="text-base font-semibold text-error-900 mb-3">{{ claim.denialReason }}</div>

              <!-- Related Policy -->
              <div v-if="relatedPolicy" class="bg-white border border-neutral-200 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="text-xs text-neutral-600 mb-1">Policy Reference</div>
                    <div class="font-medium text-neutral-900">{{ relatedPolicy.name }}</div>
                    <div class="text-xs text-neutral-500">{{ relatedPolicy.id }}</div>
                  </div>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="{
                      'bg-error-100 text-error-700': relatedPolicy.mode === 'Edit',
                      'bg-secondary-100 text-secondary-700': relatedPolicy.mode === 'Informational',
                      'bg-warning-100 text-warning-700': relatedPolicy.mode === 'Pay & Advise',
                    }"
                  >
                    {{ relatedPolicy.mode }}
                  </span>
                </div>
                <p class="text-sm text-neutral-700 mb-3 mt-3">{{ relatedPolicy.description }}</p>
                <div class="flex items-center gap-2">
                  <button
                    @click="viewPolicy(relatedPolicy)"
                    class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Full Policy →
                  </button>
                </div>
              </div>

              <!-- Pattern Context (if no policy found) -->
              <div v-else-if="primaryPattern" class="bg-white border border-neutral-200 rounded-lg p-4">
                <p class="text-sm text-neutral-700">
                  This claim matches a known denial pattern: <span class="font-semibold">{{ primaryPattern.title }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HOW TO FIX THIS CLAIM -->
      <div v-if="claim.status === 'denied'" class="px-6 pb-6">
        <div class="bg-success-50 border border-success-200 rounded-lg p-6">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:wrench-screwdriver" class="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-success-900 mb-2">HOW TO FIX THIS CLAIM</h3>

              <!-- Pattern-Based Fix Guidance -->
              <div v-if="primaryPattern">
                <p class="text-sm text-neutral-700 mb-4">
                  {{ primaryPattern.suggestedAction }}
                </p>

                <!-- Step-by-step guidance from policy -->
                <div v-if="relatedPolicy" class="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
                  <div class="text-xs font-semibold text-neutral-900 mb-2">Common Mistake:</div>
                  <p class="text-sm text-neutral-700 mb-3">{{ relatedPolicy.commonMistake }}</p>
                  <div class="text-xs font-semibold text-neutral-900 mb-2">Fix Guidance:</div>
                  <p class="text-sm text-neutral-700">{{ relatedPolicy.fixGuidance }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="practicePattern(primaryPattern)"
                    class="px-4 py-2 bg-success-600 text-white text-sm font-medium rounded-lg hover:bg-success-700 transition-colors"
                  >
                    Test This Correction in Claim Lab
                  </button>
                  <button
                    @click="navigateTo(`/insights`)"
                    class="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    View Pattern Details
                  </button>
                </div>
              </div>

              <!-- Legacy AI Insight -->
              <div v-else-if="claim.aiInsight">
                <p class="text-sm text-neutral-700 mb-4">
                  {{ claim.aiInsight.explanation }}
                </p>
                <div class="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
                  <div class="text-xs font-semibold text-neutral-900 mb-2">Recommended Action:</div>
                  <p class="text-sm text-neutral-700">{{ claim.aiInsight.guidance }}</p>
                </div>
                <button
                  @click="navigateTo(`/claim-lab?claim=${claim.id}`)"
                  class="px-4 py-2 bg-success-600 text-white text-sm font-medium rounded-lg hover:bg-success-700 transition-colors"
                >
                  Test This Correction in Claim Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submission Timeline -->
      <div class="px-6 pb-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Submission Timeline</h3>
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-secondary-500 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-neutral-900">Submitted</div>
                <div class="text-xs text-neutral-600">{{ formatDate(claim.submissionDate) }}</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-neutral-400 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-neutral-900">Processed</div>
                <div class="text-xs text-neutral-600">{{ formatDate(claim.processingDate) }}</div>
              </div>
            </div>
            <div v-if="claim.status === 'denied'" class="flex items-start gap-3">
              <div class="w-2 h-2 bg-error-500 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-neutral-900">Denied</div>
                <div class="text-xs text-neutral-600">{{ claim.denialReason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Panel -->
      <div class="px-6 pb-6">
        <div class="grid grid-cols-2 gap-4">
          <!-- Pattern Insights -->
          <div v-if="matchingPatterns.length > 0" class="bg-orange-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-orange-900 mb-3">Pattern Insights</h4>
            <div class="space-y-2">
              <div>
                <div class="text-xs text-orange-700">Matching Patterns</div>
                <div class="text-2xl font-semibold text-orange-900">{{ matchingPatterns.length }}</div>
              </div>
              <div>
                <div class="text-xs text-orange-700">Total At Risk</div>
                <div class="text-lg font-semibold text-orange-900">{{ formatCurrency(totalPatternRisk) }}</div>
              </div>
            </div>
          </div>

          <!-- Procedure Code Intelligence -->
          <div v-if="claim.procedureCodes && claim.procedureCodes.length > 0" class="bg-neutral-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-neutral-900 mb-3">Procedure Codes</h4>
            <div class="space-y-2">
              <div
                v-for="code in claim.procedureCodes"
                :key="code"
                class="flex items-center justify-between p-2 bg-white rounded border border-neutral-200"
              >
                <span class="font-mono text-sm text-neutral-900">{{ code }}</span>
                <button
                  v-if="codeIntelligence.has(code)"
                  @click="showCodeIntelligence(code)"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Details
                </button>
              </div>
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
          class="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center text-sm no-underline"
        >
          Test in Claim Lab
        </NuxtLink>
        <button class="px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-white transition-colors">
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        </button>
        <button class="px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-white transition-colors text-sm">
          Export
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
