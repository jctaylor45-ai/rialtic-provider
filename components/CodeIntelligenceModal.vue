<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && codeData"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 rounded-lg bg-primary-100">
                      <Icon name="heroicons:code-bracket" class="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-gray-900">
                        {{ codeData.code }} - {{ codeData.description }}
                      </h2>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                          {{ codeData.category }}
                        </span>
                        <span v-if="codeData.warnings && codeData.warnings.length > 0" class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-300">
                          <Icon name="heroicons:exclamation-triangle" class="w-3 h-3 inline mr-1" />
                          Warnings
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Performance Badge -->
                  <div class="flex items-center gap-4 mt-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-600">Your Approval Rate:</span>
                      <span class="text-sm font-semibold" :class="approvalRateColor">
                        {{ codeData.yourApprovalRate.toFixed(1) }}%
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-600">National Avg:</span>
                      <span class="text-sm font-semibold text-gray-700">
                        {{ codeData.nationalApprovalRate.toFixed(1) }}%
                      </span>
                    </div>
                    <div v-if="performanceGap !== 0" class="flex items-center gap-1">
                      <Icon :name="performanceGap > 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                            :class="performanceGap > 0 ? 'text-green-600' : 'text-red-600'"
                            class="w-4 h-4" />
                      <span class="text-xs font-medium" :class="performanceGap > 0 ? 'text-green-600' : 'text-red-600'">
                        {{ Math.abs(performanceGap).toFixed(1) }}% {{ performanceGap > 0 ? 'above' : 'below' }} avg
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  @click="close"
                  class="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Tabs -->
              <div class="flex items-center gap-1 mt-4 border-b border-gray-200 -mb-px">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
                  :class="activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <!-- Overview Tab -->
              <div v-if="activeTab === 'overview'">
                <!-- Warnings (if any) -->
                <section v-if="codeData.warnings && codeData.warnings.length > 0" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-600 mt-0.5" />
                    <div class="flex-1">
                      <h3 class="text-sm font-semibold text-red-900 mb-2">Important Warnings</h3>
                      <ul class="space-y-1">
                        <li v-for="(warning, idx) in codeData.warnings" :key="idx" class="text-sm text-red-700">
                          • {{ warning }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <!-- Common Denial Reasons -->
                <section v-if="codeData.commonDenialReasons && codeData.commonDenialReasons.length > 0" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Common Denial Reasons</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(reason, idx) in codeData.commonDenialReasons"
                      :key="idx"
                      class="p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div class="flex items-start gap-2">
                        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-orange-600 mt-0.5" />
                        <span class="text-sm text-orange-900">{{ reason }}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Best Practices -->
                <section v-if="codeData.bestPractices && codeData.bestPractices.length > 0" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Best Practices</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(practice, idx) in codeData.bestPractices"
                      :key="idx"
                      class="p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div class="flex items-start gap-2">
                        <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-600 mt-0.5" />
                        <span class="text-sm text-green-900">{{ practice }}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Modifiers -->
                <section v-if="hasModifiers" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Modifiers</h3>
                  <div class="space-y-3">
                    <!-- Required Modifiers -->
                    <div v-if="codeData.requiredModifiers && codeData.requiredModifiers.length > 0">
                      <h4 class="text-xs font-medium text-gray-700 mb-2">Required</h4>
                      <div class="space-y-2">
                        <div
                          v-for="modifier in codeData.requiredModifiers"
                          :key="modifier.code"
                          class="p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div class="flex items-start justify-between">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-1">
                                <span class="font-mono text-sm font-semibold text-red-900">{{ modifier.code }}</span>
                                <span class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Required</span>
                              </div>
                              <p class="text-xs text-red-700 mb-1">{{ modifier.description }}</p>
                              <p class="text-xs text-red-600">{{ modifier.usage }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Optional Modifiers -->
                    <div v-if="codeData.optionalModifiers && codeData.optionalModifiers.length > 0">
                      <h4 class="text-xs font-medium text-gray-700 mb-2">Optional / Conditional</h4>
                      <div class="space-y-2">
                        <div
                          v-for="modifier in codeData.optionalModifiers"
                          :key="modifier.code"
                          class="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div class="flex items-start justify-between">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-1">
                                <span class="font-mono text-sm font-semibold text-blue-900">{{ modifier.code }}</span>
                                <span v-if="modifier.required" class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  Conditionally Required
                                </span>
                              </div>
                              <p class="text-xs text-blue-700 mb-1">{{ modifier.description }}</p>
                              <p class="text-xs text-blue-600">{{ modifier.usage }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Documentation Requirements -->
                <section v-if="codeData.documentationRequirements && codeData.documentationRequirements.length > 0" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Documentation Requirements</h3>
                  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <ul class="space-y-2">
                      <li v-for="(req, idx) in codeData.documentationRequirements" :key="idx" class="flex items-start gap-2">
                        <Icon name="heroicons:document-text" class="w-4 h-4 text-gray-600 mt-0.5" />
                        <span class="text-sm text-gray-700">{{ req }}</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <!-- Typical Diagnosis Codes -->
                <section v-if="codeData.typicalDiagnosisCodes && codeData.typicalDiagnosisCodes.length > 0" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Typical Diagnosis Codes</h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="diagCode in codeData.typicalDiagnosisCodes"
                      :key="diagCode"
                      class="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono text-gray-800"
                    >
                      {{ diagCode }}
                    </span>
                  </div>
                </section>

                <!-- Recent Policy Changes -->
                <section v-if="codeData.recentPolicyChanges && codeData.recentPolicyChanges.length > 0" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Recent Policy Changes</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(change, idx) in codeData.recentPolicyChanges"
                      :key="idx"
                      class="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div class="flex items-start gap-2">
                        <Icon name="heroicons:information-circle" class="w-4 h-4 text-blue-600 mt-0.5" />
                        <span class="text-sm text-blue-900">{{ change }}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Your History Tab -->
              <div v-if="activeTab === 'history'">
                <!-- Summary Stats -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="text-xs text-gray-600 mb-1">Total Submissions</div>
                    <div class="text-2xl font-bold text-gray-900">{{ totalSubmissions }}</div>
                    <div class="text-xs text-gray-600 mt-1">Last 6 months</div>
                  </div>
                  <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div class="text-xs text-gray-600 mb-1">Approved</div>
                    <div class="text-2xl font-bold text-green-700">{{ totalApprovals }}</div>
                    <div class="text-xs text-gray-600 mt-1">{{ codeData.yourApprovalRate.toFixed(1) }}% rate</div>
                  </div>
                  <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div class="text-xs text-gray-600 mb-1">Denied</div>
                    <div class="text-2xl font-bold text-red-700">{{ totalDenials }}</div>
                    <div class="text-xs text-gray-600 mt-1">{{ denialRate.toFixed(1) }}% rate</div>
                  </div>
                </div>

                <!-- Usage History Chart -->
                <section class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Monthly Performance</h3>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600">Month</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600">Submissions</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600">Approved</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600">Denied</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600">Approval Rate</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600">Avg Reimbursement</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200">
                        <tr v-for="history in sortedHistory" :key="history.month" class="hover:bg-gray-50">
                          <td class="px-4 py-3 text-gray-900 font-medium">{{ formatMonth(history.month) }}</td>
                          <td class="px-4 py-3 text-center text-gray-700">{{ history.submissions }}</td>
                          <td class="px-4 py-3 text-center text-green-700 font-medium">{{ history.approvals }}</td>
                          <td class="px-4 py-3 text-center text-red-700 font-medium">{{ history.denials }}</td>
                          <td class="px-4 py-3 text-center">
                            <span class="font-medium" :class="getApprovalRateColor(history.approvals / history.submissions * 100)">
                              {{ (history.approvals / history.submissions * 100).toFixed(1) }}%
                            </span>
                          </td>
                          <td class="px-4 py-3 text-right text-gray-900 font-mono">
                            {{ formatCurrency(history.avgReimbursement) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <!-- Common Denial Reasons by Month -->
                <section v-if="hasHistoricalDenialReasons" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-3">Denial Reason Trends</h3>
                  <div class="space-y-3">
                    <div v-for="history in sortedHistory.filter(h => h.commonDenialReasons && h.commonDenialReasons.length > 0)" :key="history.month">
                      <div class="text-xs font-medium text-gray-600 mb-2">{{ formatMonth(history.month) }}</div>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="reason in history.commonDenialReasons"
                          :key="reason"
                          class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-lg border border-orange-200"
                        >
                          {{ reason }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Payer Rules Tab -->
              <div v-if="activeTab === 'payer-rules'">
                <div v-if="codeData.payerRules && codeData.payerRules.length > 0" class="space-y-4">
                  <div
                    v-for="rule in codeData.payerRules"
                    :key="rule.payerId"
                    class="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <h4 class="text-sm font-semibold text-gray-900">{{ rule.payerName }}</h4>
                        <span class="text-xs text-gray-500 font-mono">{{ rule.payerId }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span v-if="rule.authRequired" class="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full border border-orange-300">
                          <Icon name="heroicons:shield-exclamation" class="w-3 h-3 inline mr-1" />
                          Prior Auth Required
                        </span>
                        <span v-if="rule.frequencyLimit" class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full border border-blue-300">
                          {{ rule.frequencyLimit }}
                        </span>
                      </div>
                    </div>

                    <div class="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p class="text-sm text-gray-700">{{ rule.rule }}</p>
                    </div>

                    <div class="flex items-center gap-4 text-xs text-gray-600">
                      <span>Effective: {{ formatDate(rule.effectiveDate) }}</span>
                      <span v-if="rule.modifierRequirements && rule.modifierRequirements.length > 0">
                        Required Modifiers:
                        <span class="font-mono font-medium text-gray-900">{{ rule.modifierRequirements.join(', ') }}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-12">
                  <Icon name="heroicons:information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p class="text-sm text-gray-600">No specific payer rules documented for this code</p>
                </div>
              </div>

              <!-- Related Codes Tab -->
              <div v-if="activeTab === 'related-codes'">
                <div v-if="codeData.relatedCodes && codeData.relatedCodes.length > 0" class="space-y-4">
                  <div
                    v-for="related in codeData.relatedCodes"
                    :key="related.code"
                    class="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
                    @click="navigateToCode(related.code)"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-semibold text-gray-900 font-mono">{{ related.code }}</span>
                          <span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                            {{ related.relationship }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700 mb-2">{{ related.description }}</p>
                        <p class="text-xs text-gray-600">{{ related.note }}</p>
                      </div>
                      <Icon name="heroicons:arrow-right" class="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-12">
                  <Icon name="heroicons:code-bracket" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p class="text-sm text-gray-600">No related codes documented</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div class="text-xs text-gray-500">
                Last updated: {{ formatDate(codeData.lastUpdated) }}
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="close"
                  class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
                >
                  Close
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
import type { ProcedureCodeIntelligence } from '~/types/enhancements'
import { format } from 'date-fns'

const props = defineProps<{
  code: string | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  navigateToCode: [code: string]
}>()

// Composables
const analyticsStore = useAnalyticsStore()
const { formatCurrency } = useAnalytics()

// State
const activeTab = ref<'overview' | 'history' | 'payer-rules' | 'related-codes'>('overview')

const tabs = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'history' as const, label: 'Your History' },
  { id: 'payer-rules' as const, label: 'Payer Rules' },
  { id: 'related-codes' as const, label: 'Related Codes' },
]

// Computed
const codeData = computed<ProcedureCodeIntelligence | undefined>(() => {
  if (!props.code) return undefined
  return analyticsStore.getCodeIntelligence(props.code)
})

const approvalRateColor = computed(() => {
  if (!codeData.value) return 'text-gray-700'
  const rate = codeData.value.yourApprovalRate
  const national = codeData.value.nationalApprovalRate

  if (rate >= national) return 'text-green-600'
  if (rate >= national - 5) return 'text-yellow-600'
  return 'text-red-600'
})

const performanceGap = computed(() => {
  if (!codeData.value) return 0
  return codeData.value.yourApprovalRate - codeData.value.nationalApprovalRate
})

const hasModifiers = computed(() => {
  if (!codeData.value) return false
  return (codeData.value.requiredModifiers && codeData.value.requiredModifiers.length > 0) ||
         (codeData.value.optionalModifiers && codeData.value.optionalModifiers.length > 0)
})

const sortedHistory = computed(() => {
  if (!codeData.value || !codeData.value.usageHistory) return []
  return [...codeData.value.usageHistory].sort((a, b) => b.month.localeCompare(a.month))
})

const totalSubmissions = computed(() => {
  if (!codeData.value || !codeData.value.usageHistory) return 0
  return codeData.value.usageHistory.reduce((sum, h) => sum + h.submissions, 0)
})

const totalApprovals = computed(() => {
  if (!codeData.value || !codeData.value.usageHistory) return 0
  return codeData.value.usageHistory.reduce((sum, h) => sum + h.approvals, 0)
})

const totalDenials = computed(() => {
  if (!codeData.value || !codeData.value.usageHistory) return 0
  return codeData.value.usageHistory.reduce((sum, h) => sum + h.denials, 0)
})

const denialRate = computed(() => {
  if (totalSubmissions.value === 0) return 0
  return (totalDenials.value / totalSubmissions.value) * 100
})

const hasHistoricalDenialReasons = computed(() => {
  if (!codeData.value || !codeData.value.usageHistory) return false
  return codeData.value.usageHistory.some(h => h.commonDenialReasons && h.commonDenialReasons.length > 0)
})

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const formatMonth = (monthString: string) => {
  // monthString format: "2024-07"
  const [year, month] = monthString.split('-')
  return format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMM yyyy')
}

const getApprovalRateColor = (rate: number) => {
  if (!codeData.value) return 'text-gray-700'
  const national = codeData.value.nationalApprovalRate

  if (rate >= national) return 'text-green-600'
  if (rate >= national - 5) return 'text-yellow-600'
  return 'text-red-600'
}

const close = () => {
  emit('close')
  // Reset to overview tab when closing
  setTimeout(() => {
    activeTab.value = 'overview'
  }, 200)
}

const navigateToCode = (code: string) => {
  emit('navigateToCode', code)
  // Switch to the new code without closing the modal
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
