<script setup lang="ts">
/**
 * Claim details content component
 * Displays full claim information inside a drawer
 * Maintains data parity with original full-page view
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

      <!-- Line Items -->
      <div class="p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Line Items</h2>
        <div class="space-y-4">
          <div
            v-for="item in claim.lineItems"
            :key="item.lineNumber"
            class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
          >
            <!-- Line Header -->
            <div class="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-sm font-semibold text-neutral-900">Line {{ item.lineNumber }}</span>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-medium text-primary-700">{{ item.procedureCode }}</span>
                  <button
                    v-if="codeIntelligence.has(item.procedureCode)"
                    @click="showCodeIntelligence(item.procedureCode)"
                    class="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="View code intelligence"
                  >
                    <Icon name="heroicons:information-circle" class="w-4 h-4 text-primary-600" />
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm font-semibold text-neutral-900">{{ formatCurrency(item.billedAmount) }}</span>
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="{
                    'bg-success-100 text-success-700': (item.status || claim.status) === 'approved' || (item.status || claim.status) === 'paid',
                    'bg-error-100 text-error-700': (item.status || claim.status) === 'denied',
                    'bg-warning-100 text-warning-700': (item.status || claim.status) === 'pending',
                  }"
                >
                  {{ ((item.status || claim.status).charAt(0).toUpperCase() + (item.status || claim.status).slice(1)) }}
                </span>
              </div>
            </div>

            <!-- Line Details Grid -->
            <div class="p-4">
              <div class="grid grid-cols-6 gap-x-6 gap-y-3 text-sm">
                <!-- Row 1 -->
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Date(s) of service</div>
                  <div class="text-neutral-900 font-medium">
                    {{ formatDateLong(item.dateOfService || claim.dateOfService) }}{{ item.dateOfServiceEnd && item.dateOfServiceEnd !== item.dateOfService ? ' – ' + formatDateLong(item.dateOfServiceEnd) : '' }}
                  </div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">CPT®/HCPCS</div>
                  <div class="text-neutral-900 font-medium font-mono">{{ item.procedureCode }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">NDC</div>
                  <div class="text-neutral-900 font-medium font-mono">{{ item.ndcCode || '–' }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Days or units</div>
                  <div class="text-neutral-900 font-medium">{{ item.units || 1 }} {{ item.unitsType || 'UN' }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Charges</div>
                  <div class="text-neutral-900 font-medium">{{ formatCurrency(item.billedAmount) }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Place of service</div>
                  <div class="text-neutral-900 font-medium">{{ item.placeOfService || '–' }}</div>
                </div>

                <!-- Row 2 -->
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Modifier</div>
                  <div class="text-neutral-900 font-medium font-mono">{{ item.modifiers?.join(', ') || '–' }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Diagnosis 1</div>
                  <div class="text-neutral-900 font-medium font-mono">{{ item.diagnosisCodes?.[0] || claim.diagnosisCodes?.[0] || '–' }}</div>
                </div>
                <div class="col-span-2">
                  <div class="text-neutral-500 text-xs mb-1">Additional diagnoses</div>
                  <div class="text-neutral-900 font-medium font-mono">
                    {{ (item.diagnosisCodes?.slice(1) || claim.diagnosisCodes?.slice(1))?.join(' ,  ') || '–' }}
                  </div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Par indicator</div>
                  <div class="text-neutral-900 font-medium">{{ item.parIndicator === true ? 'Yes' : item.parIndicator === false ? 'No' : '–' }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Bypass code</div>
                  <div class="text-neutral-900 font-medium">{{ item.bypassCode || '–' }}</div>
                </div>

                <!-- Row 3 - Rendering Provider -->
                <div class="col-span-3">
                  <div class="text-neutral-500 text-xs mb-1">Rendering provider ID</div>
                  <div class="text-neutral-900 font-medium">{{ item.renderingProviderName || 'No Name' }}</div>
                  <div v-if="item.renderingProviderNPI" class="text-xs text-neutral-600 mt-0.5">NPI: {{ item.renderingProviderNPI }}</div>
                </div>
                <div class="col-span-2">
                  <div class="text-neutral-500 text-xs mb-1">Rendering provider taxonomy</div>
                  <div class="text-neutral-900 font-medium">{{ item.renderingProviderTaxonomy || 'None provided' }}</div>
                </div>
                <div>
                  <div class="text-neutral-500 text-xs mb-1">Paid</div>
                  <div class="text-neutral-900 font-medium">{{ formatCurrency(item.paidAmount || 0) }}</div>
                </div>
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
