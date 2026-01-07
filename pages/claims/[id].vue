<template>
  <div v-if="!claim" class="flex-1 p-8">
    <div class="text-center py-12">
      <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Claim Not Found</h2>
      <p class="text-gray-600 mb-4">The claim you're looking for doesn't exist.</p>
      <button
        @click="navigateTo('/claims')"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Back to Claims
      </button>
    </div>
  </div>

  <div v-else class="flex-1 overflow-hidden flex">
    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 p-6">
        <div class="flex items-center gap-2 mb-2">
          <button
            @click="navigateTo('/claims')"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5 text-gray-600" />
          </button>
          <h1 class="text-2xl font-semibold text-gray-900">{{ claim.id }}</h1>
        </div>

        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-600">
              Patient: {{ claim.patientName }} • DOB: {{ claim.patientDOB || 'N/A' }}
            </div>
            <div class="text-sm text-gray-600">
              Provider: {{ claim.providerName || 'N/A' }} • DOS: {{ formatDate(claim.dateOfService) }}
            </div>
          </div>
          <div class="text-right">
            <span
              class="px-3 py-1 text-sm font-medium rounded"
              :class="{
                'bg-green-100 text-green-700': claim.status === 'approved' || claim.status === 'paid',
                'bg-red-100 text-red-700': claim.status === 'denied',
                'bg-yellow-100 text-yellow-700': claim.status === 'pending',
                'bg-blue-100 text-blue-700': claim.status === 'appealed',
              }"
            >
              {{ claim.status.charAt(0).toUpperCase() + claim.status.slice(1) }}
            </span>
            <div class="text-sm text-gray-600 mt-2">
              Billed: <span class="font-semibold">{{ formatCurrency(claim.billedAmount) }}</span>
            </div>
            <div class="text-sm text-gray-600">
              Paid: <span class="font-semibold">{{ formatCurrency(claim.paidAmount || 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Matches (if denied) -->
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
                    <h4 class="font-medium text-gray-900">{{ pattern.title }}</h4>
                    <p class="text-xs text-gray-600 mt-0.5">{{ pattern.category }}</p>
                  </div>
                </div>
                <span
                  class="px-2 py-1 text-xs font-medium rounded border"
                  :class="getPatternTierBadgeClass(pattern.tier)"
                >
                  {{ pattern.tier.toUpperCase() }}
                </span>
              </div>

              <p class="text-sm text-gray-700 mb-3">{{ pattern.description }}</p>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 text-xs text-gray-600">
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
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-700">Line</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-700">Procedure Code</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-700">Modifiers</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-700">Units</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-700">Billed</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-700">Paid</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in claim.lineItems"
                :key="item.lineNumber"
                class="border-t"
              >
                <td class="px-4 py-3 text-sm text-gray-900">{{ item.lineNumber }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-gray-900">{{ item.procedureCode }}</span>
                    <button
                      v-if="codeIntelligence.has(item.procedureCode)"
                      @click="showCodeIntelligence(item.procedureCode)"
                      class="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="View code intelligence"
                    >
                      <Icon name="heroicons:information-circle" class="w-4 h-4 text-primary-600" />
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700">
                  {{ item.modifiers?.join(', ') || '-' }}
                </td>
                <td class="px-4 py-3 text-right text-sm text-gray-900">{{ item.units || 1 }}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-900">
                  {{ formatCurrency(item.billedAmount) }}
                </td>
                <td class="px-4 py-3 text-right text-sm text-gray-900">
                  {{ formatCurrency(item.paidAmount || 0) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="{
                      'bg-green-100 text-green-700': (item.status || claim.status) === 'approved' || (item.status || claim.status) === 'paid',
                      'bg-red-100 text-red-700': (item.status || claim.status) === 'denied',
                      'bg-yellow-100 text-yellow-700': (item.status || claim.status) === 'pending',
                    }"
                  >
                    {{ ((item.status || claim.status).charAt(0).toUpperCase() + (item.status || claim.status).slice(1)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- WHY THIS WAS DENIED -->
      <div v-if="claim.status === 'denied'" class="px-6 pb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-6">
            <Icon name="heroicons:x-circle" class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 mb-2">WHY THIS WAS DENIED</h3>
              <div class="text-base font-semibold text-red-900 mb-3">{{ claim.denialReason }}</div>

              <!-- Related Policy -->
              <div v-if="relatedPolicy" class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="text-xs text-gray-600 mb-1">Policy Reference</div>
                    <div class="font-medium text-gray-900">{{ relatedPolicy.name }}</div>
                    <div class="text-xs text-gray-500">{{ relatedPolicy.id }}</div>
                  </div>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="{
                      'bg-red-100 text-red-700': relatedPolicy.mode === 'Edit',
                      'bg-blue-100 text-blue-700': relatedPolicy.mode === 'Informational',
                      'bg-yellow-100 text-yellow-700': relatedPolicy.mode === 'Pay & Advise',
                    }"
                  >
                    {{ relatedPolicy.mode }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 mb-3 mt-3">{{ relatedPolicy.description }}</p>
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
              <div v-else-if="primaryPattern" class="bg-white border border-gray-200 rounded-lg p-4">
                <p class="text-sm text-gray-700">
                  This claim matches a known denial pattern: <span class="font-semibold">{{ primaryPattern.title }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HOW TO FIX THIS CLAIM -->
      <div v-if="claim.status === 'denied'" class="px-6 pb-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:wrench-screwdriver" class="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-green-900 mb-2">HOW TO FIX THIS CLAIM</h3>

              <!-- Pattern-Based Fix Guidance -->
              <div v-if="primaryPattern">
                <p class="text-sm text-gray-700 mb-4">
                  {{ primaryPattern.suggestedAction }}
                </p>

                <!-- Step-by-step guidance from policy -->
                <div v-if="relatedPolicy" class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <div class="text-xs font-semibold text-gray-900 mb-2">Common Mistake:</div>
                  <p class="text-sm text-gray-700 mb-3">{{ relatedPolicy.commonMistake }}</p>
                  <div class="text-xs font-semibold text-gray-900 mb-2">Fix Guidance:</div>
                  <p class="text-sm text-gray-700">{{ relatedPolicy.fixGuidance }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="practicePattern(primaryPattern)"
                    class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Test This Correction in Claim Lab
                  </button>
                  <button
                    @click="navigateTo(`/insights`)"
                    class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Pattern Details
                  </button>
                </div>
              </div>

              <!-- Legacy AI Insight -->
              <div v-else-if="claim.aiInsight">
                <p class="text-sm text-gray-700 mb-4">
                  {{ claim.aiInsight.explanation }}
                </p>
                <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <div class="text-xs font-semibold text-gray-900 mb-2">Recommended Action:</div>
                  <p class="text-sm text-gray-700">{{ claim.aiInsight.guidance }}</p>
                </div>
                <button
                  @click="navigateTo(`/claim-lab?claim=${claim.id}`)"
                  class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Submission Timeline</h3>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Submitted</div>
                <div class="text-xs text-gray-600">{{ formatDate(claim.submissionDate) }}</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-gray-400 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Processed</div>
                <div class="text-xs text-gray-600">{{ formatDate(claim.processingDate) }}</div>
              </div>
            </div>
            <div v-if="claim.status === 'denied'" class="flex items-start gap-3">
              <div class="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900">Denied</div>
                <div class="text-xs text-gray-600">{{ claim.denialReason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Panel (Right Sidebar) -->
    <div class="w-80 bg-white border-l border-gray-200 p-6 space-y-4 overflow-y-auto">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

      <NuxtLink
        :to="`/claim-lab?claim=${claim.id}`"
        class="block w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center no-underline"
      >
        Test in Claim Lab
      </NuxtLink>

      <!-- Quick Stats -->
      <div v-if="matchingPatterns.length > 0" class="border-t border-gray-200 pt-4">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Pattern Insights</h4>
        <div class="space-y-3">
          <div class="bg-orange-50 rounded-lg p-3">
            <div class="text-xs text-orange-700 mb-1">Matching Patterns</div>
            <div class="text-2xl font-semibold text-orange-900">{{ matchingPatterns.length }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-xs text-blue-700 mb-1">Total At Risk</div>
            <div class="text-lg font-semibold text-blue-900">
              {{ formatCurrency(totalPatternRisk) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Procedure Code Intelligence -->
      <div v-if="claim.procedureCodes && claim.procedureCodes.length > 0" class="border-t border-gray-200 pt-4">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Procedure Codes</h4>
        <div class="space-y-2">
          <div
            v-for="code in claim.procedureCodes"
            :key="code"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span class="font-mono text-sm text-gray-900">{{ code }}</span>
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

      <div class="border-t border-gray-200 pt-4 space-y-2">
        <button class="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
            Download EOB
          </div>
        </button>

        <button class="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Export Details
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

<script setup lang="ts">
import type { Pattern } from '~/types/enhancements'

const route = useRoute()
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

const claimId = route.params.id as string

const claim = computed(() => {
  const foundClaim = appStore.getClaimById(claimId)
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

  // Sort by tier priority: critical > high > medium > low
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
  // Store the policy ID in session storage so policies page can open it
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
