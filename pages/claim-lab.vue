<template>
  <div class="flex-1 flex overflow-hidden">
    <div v-if="!originalClaim" class="flex-1 p-8">
      <div class="text-center py-12">
        <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No Claim Selected</h2>
        <p class="text-gray-600 mb-4">Please select a claim to test in the lab.</p>
        <button
          @click="navigateTo('/claims')"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Browse Claims
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Left Panel: Original Claim & Pattern Context -->
      <div class="w-[30%] bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
        <!-- Pattern Context (if practicing a pattern) -->
        <div v-if="contextPattern" class="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:academic-cap" class="w-5 h-5 text-primary-600" />
            <h3 class="text-sm font-semibold text-primary-900">Practice Mode</h3>
          </div>
          <div class="mb-3">
            <div class="text-xs text-primary-700 mb-1">Pattern</div>
            <div class="font-medium text-sm text-primary-900">{{ contextPattern.title }}</div>
          </div>
          <div class="bg-white border border-primary-200 rounded p-3">
            <div class="text-xs text-primary-900 font-medium mb-1">Your Goal:</div>
            <p class="text-xs text-gray-700">{{ contextPattern.suggestedAction }}</p>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs">
            <span class="text-primary-700">{{ contextPattern.learningProgress }}% learned</span>
            <span class="text-primary-600">{{ contextPattern.practiceSessionsCompleted }} sessions</span>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">Original Submission</h3>
          <div class="text-xs text-gray-600 space-y-1">
            <div>Claim ID: {{ originalClaim.id }}</div>
            <div>Patient: {{ originalClaim.patientName }}</div>
            <div>DOS: {{ originalClaim.dateOfService }}</div>
            <div>Provider: {{ originalClaim.providerName || 'N/A' }}</div>
          </div>
        </div>

        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="heroicons:x-circle" class="w-4 h-4 text-red-500" />
            <span class="text-sm font-semibold text-gray-900">Denied</span>
          </div>
          <div class="bg-red-50 border border-red-200 rounded p-3">
            <div class="text-xs text-red-900">{{ originalClaim.denialReason }}</div>
          </div>
        </div>

        <!-- Pattern Hints -->
        <div v-if="contextPattern" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:light-bulb" class="w-4 h-4 text-blue-600" />
            <span class="text-xs font-semibold text-blue-900">Pattern Hints</span>
          </div>
          <ul class="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li v-for="(hint, index) in patternHints" :key="index">{{ hint }}</li>
          </ul>
        </div>

        <!-- Line Items (read-only) -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Original Line Items</h4>
          <div class="space-y-3">
            <div
              v-for="item in originalClaim.lineItems"
              :key="item.lineNumber"
              class="bg-white border border-gray-200 rounded p-3"
            >
              <div class="flex items-center gap-2 mb-1">
                <button
                  v-if="hasCodeIntelligence(item.procedureCode)"
                  @click="viewCodeIntelligence(item.procedureCode)"
                  class="font-mono text-xs text-primary-600 hover:text-primary-700 hover:underline cursor-pointer flex items-center gap-1"
                  :title="`View intelligence for ${item.procedureCode}`"
                >
                  {{ item.procedureCode }}
                  <Icon name="heroicons:information-circle" class="w-3 h-3" />
                </button>
                <span v-else class="font-mono text-xs text-gray-900">{{ item.procedureCode }}</span>
              </div>
              <div class="text-xs text-gray-600">
                Modifiers: {{ item.modifiers?.join(', ') || 'None' }}
              </div>
              <div class="text-xs text-gray-600">
                Units: {{ item.units }} • {{ formatCurrency(item.billedAmount) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Editable Workspace -->
      <div class="flex-1 bg-white p-6 overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Edit & Test</h2>
            <p class="text-sm text-gray-600">Make changes to fix the denial</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="hasChanges"
              @click="resetChanges"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              :disabled="!hasChanges"
              @click="runSimulation"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Icon name="heroicons:beaker" class="w-4 h-4" />
              Run Simulation
            </button>
          </div>
        </div>

        <!-- Changes Summary -->
        <div v-if="changesSummary.length > 0" class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="text-sm font-medium text-yellow-900 mb-2">Changes Made:</div>
          <ul class="text-sm text-yellow-800 space-y-1">
            <li v-for="(change, index) in changesSummary" :key="index" class="flex items-start gap-2">
              <Icon name="heroicons:arrow-right" class="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{{ change }}</span>
            </li>
          </ul>
        </div>

        <!-- Code Intelligence Helper -->
        <div v-if="selectedCodeForHelp" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:light-bulb" class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-blue-900">Code Intelligence: {{ selectedCodeForHelp.code }}</h4>
                <button
                  @click="selectedCodeForHelp = null"
                  class="text-blue-400 hover:text-blue-600"
                >
                  <Icon name="heroicons:x-mark" class="w-4 h-4" />
                </button>
              </div>
              <p class="text-xs text-blue-800 mb-3">{{ selectedCodeForHelp.description }}</p>

              <!-- Quick Stats -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-white rounded p-2 border border-blue-200">
                  <div class="text-xs text-blue-700">Your Approval Rate</div>
                  <div class="text-sm font-semibold text-blue-900">{{ selectedCodeForHelp.yourApprovalRate.toFixed(1) }}%</div>
                </div>
                <div v-if="selectedCodeForHelp.nationalApprovalRate !== undefined" class="bg-white rounded p-2 border border-blue-200">
                  <div class="text-xs text-blue-700">National Avg</div>
                  <div class="text-sm font-semibold text-blue-900">{{ selectedCodeForHelp.nationalApprovalRate.toFixed(1) }}%</div>
                </div>
              </div>

              <!-- Common Issues -->
              <div v-if="selectedCodeForHelp.commonDenialReasons && selectedCodeForHelp.commonDenialReasons.length > 0" class="mb-3">
                <div class="text-xs font-medium text-blue-900 mb-1">Common Denial Reasons:</div>
                <ul class="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                  <li v-for="(reason, idx) in selectedCodeForHelp.commonDenialReasons.slice(0, 2)" :key="idx">
                    {{ reason }}
                  </li>
                </ul>
              </div>

              <!-- Required Modifiers -->
              <div v-if="selectedCodeForHelp.requiredModifiers && selectedCodeForHelp.requiredModifiers.length > 0" class="mb-2">
                <div class="text-xs font-medium text-blue-900 mb-1">Required Modifiers:</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="mod in selectedCodeForHelp.requiredModifiers"
                    :key="mod.code"
                    class="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-mono border border-red-300"
                    :title="mod.description"
                  >
                    {{ mod.code }}
                  </span>
                </div>
              </div>

              <button
                @click="openCodeIntelligence(selectedCodeForHelp.code)"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View full details →
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="space-y-6">
          <div
            v-for="(item, index) in editedLineItems"
            :key="index"
            class="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900">Line {{ index + 1 }}</h4>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs text-gray-600">Procedure Code</label>
                  <button
                    v-if="hasCodeIntelligence(item.procedureCode)"
                    @click="showCodeHelp(item.procedureCode)"
                    class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Icon name="heroicons:information-circle" class="w-3 h-3" />
                    Help
                  </button>
                </div>
                <input
                  v-model="item.procedureCode"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  @blur="checkCodeIntelligence(item.procedureCode)"
                />
              </div>

              <div>
                <label class="text-xs text-gray-600 mb-1 block">Units</label>
                <input
                  v-model.number="item.units"
                  type="number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div class="col-span-2">
                <label class="text-xs text-gray-600 mb-1 block">Modifiers (comma-separated)</label>
                <input
                  v-model="item.modifiersInput"
                  type="text"
                  placeholder="e.g., 25, 59"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @input="detectChanges"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Results -->
      <div class="w-[30%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Simulation Results</h3>

        <div v-if="!simulationResults" class="text-center py-12">
          <Icon name="heroicons:beaker" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-sm text-gray-600">Run a simulation to see results</p>
        </div>

        <div v-else class="space-y-4">
          <div class="bg-white border rounded-lg p-4">
            <div
              class="flex items-center gap-2 mb-3"
              :class="{
                'text-green-700': simulationResults.outcome === 'approved',
                'text-red-700': simulationResults.outcome === 'denied',
              }"
            >
              <Icon
                :name="simulationResults.outcome === 'approved' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                class="w-6 h-6"
              />
              <span class="font-semibold text-lg">{{ simulationResults.outcome === 'approved' ? 'Approved' : 'Denied' }}</span>
            </div>

            <div class="text-sm text-gray-700 space-y-2">
              <div v-if="simulationResults.outcome === 'approved'">
                <div class="text-xs text-gray-600 mb-1">Estimated Payment</div>
                <div class="text-2xl font-semibold text-green-600">
                  {{ formatCurrency(simulationResults.estimatedPayment) }}
                </div>
              </div>
              <div v-else class="bg-red-50 border border-red-200 rounded p-3">
                <div class="text-xs text-red-900 font-medium mb-1">Denial Reason:</div>
                <div class="text-sm text-red-800">{{ simulationResults.reason }}</div>
              </div>
            </div>

            <!-- Corrections Applied -->
            <div v-if="simulationResults.correctionsApplied && simulationResults.correctionsApplied.length > 0" class="mt-4 pt-4 border-t border-gray-200">
              <div class="text-xs font-medium text-gray-900 mb-2">Corrections Applied:</div>
              <div class="space-y-1">
                <div
                  v-for="(correction, index) in simulationResults.correctionsApplied"
                  :key="index"
                  class="flex items-start gap-2 text-xs text-gray-700"
                >
                  <Icon name="heroicons:check" class="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{{ correction }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Success Actions -->
          <div v-if="simulationResults.outcome === 'approved'" class="space-y-2">
            <button
              @click="saveLearning"
              class="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="heroicons:check-circle" class="w-5 h-5" />
              Save Learning
            </button>

            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-xs text-green-900">
                <strong>Great job!</strong> Your corrections would likely result in approval.
                {{ contextPattern ? 'This practice session will count towards your learning progress.' : '' }}
              </div>
            </div>
          </div>

          <!-- Try Again -->
          <button
            v-else
            @click="simulationResults = null"
            class="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Pattern Progress -->
        <div v-if="contextPattern && simulationResults?.outcome === 'approved'" class="mt-6 pt-6 border-t border-gray-200">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Pattern Progress</h4>
          <div class="bg-white border border-gray-200 rounded-lg p-3">
            <div class="text-xs text-gray-600 mb-2">{{ contextPattern.title }}</div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                class="bg-green-500 h-2 rounded-full transition-all"
                :style="{ width: `${contextPattern.learningProgress}%` }"
              />
            </div>
            <div class="text-xs text-gray-600">
              {{ contextPattern.learningProgress }}% learned
            </div>
          </div>
        </div>
      </div>
    </template>

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
import type { LineItem } from '~/types'
import type { Pattern, ProcedureCodeIntelligence } from '~/types/enhancements'

const route = useRoute()
const appStore = useAppStore()
const patternsStore = usePatternsStore()
const eventsStore = useEventsStore()
const analyticsStore = useAnalyticsStore()

// Composables
const { formatCurrency } = useAnalytics()
const { completePracticeSession, recordCorrection } = usePatterns()
const { trackPracticeStart, trackPracticeCompletion, trackCorrection } = useTracking()
const {
  isModalOpen: isCodeIntelModalOpen,
  selectedCode,
  openCodeIntelligence,
  closeCodeIntelligence,
  navigateToCode,
  hasIntelligence,
} = useCodeIntelligence()

// Code intelligence helper state
const selectedCodeForHelp = ref<ProcedureCodeIntelligence | null>(null)

const claimId = route.query.claim as string | undefined
const patternId = route.query.pattern as string | undefined

// Session start time for tracking
const sessionStartTime = ref(Date.now())

const originalClaim = computed(() => {
  if (claimId) {
    const found = appStore.getClaimById(claimId)
    return found ? ensureLineItems(found) : null
  }
  // Default to first denied claim
  const firstDenied = appStore.deniedClaims[0]
  return firstDenied ? ensureLineItems(firstDenied) : null
})

// Get pattern context if practicing a specific pattern
const contextPattern = computed(() => {
  if (patternId) {
    return patternsStore.getPatternById(patternId)
  }
  // If no pattern specified but claim has matching patterns, use primary
  if (originalClaim.value) {
    const matchingPatterns = patternsStore.getPatternsByClaim(originalClaim.value.id)
    if (matchingPatterns.length > 0) {
      const tierPriority = { critical: 4, high: 3, medium: 2, low: 1 }
      return matchingPatterns.sort((a, b) =>
        tierPriority[b.tier] - tierPriority[a.tier]
      )[0]
    }
  }
  return null
})

// Pattern-specific hints
const patternHints = computed(() => {
  if (!contextPattern.value) return []

  const hints: string[] = []
  const category = contextPattern.value.category

  if (category === 'modifier-missing') {
    hints.push('Check if E&M codes need modifier 25')
    hints.push('Look for same-day procedures')
    hints.push('Add modifiers in comma-separated format')
  } else if (category === 'authorization') {
    hints.push('Verify prior authorization requirements')
    hints.push('Check for high-value procedures')
  } else if (category === 'documentation') {
    hints.push('Ensure all fields are properly documented')
    hints.push('Check diagnosis code specificity')
  } else if (category === 'code-mismatch') {
    hints.push('Review CCI bundling edits')
    hints.push('Check for unbundling violations')
  }

  return hints
})

const editedLineItems = ref<Array<LineItem & { modifiersInput: string }>>([])
const simulationResults = ref<any>(null)
const correctionsCount = ref(0)

watch(originalClaim, (claim) => {
  if (claim?.lineItems) {
    editedLineItems.value = claim.lineItems.map(item => ({
      ...JSON.parse(JSON.stringify(item)),
      modifiersInput: item.modifiers?.join(', ') || '',
    }))
  }
}, { immediate: true })

// Track practice session start
onMounted(() => {
  if (contextPattern.value) {
    trackPracticeStart(contextPattern.value.id)
  }
})

const hasChanges = computed(() => {
  if (!originalClaim.value) return false
  return JSON.stringify(originalClaim.value.lineItems) !== JSON.stringify(editedLineItems.value.map(i => {
    const { modifiersInput, ...rest } = i
    return { ...rest, modifiers: modifiersInput.split(',').map(m => m.trim()).filter(Boolean) }
  }))
})

// Track what changes were made
const changesSummary = computed(() => {
  if (!originalClaim.value || !hasChanges.value) return []

  const changes: string[] = []
  editedLineItems.value.forEach((edited, index) => {
    const original = originalClaim.value?.lineItems?.[index]
    if (!original) return

    if (edited.procedureCode !== original.procedureCode) {
      changes.push(`Line ${index + 1}: Changed code from ${original.procedureCode} to ${edited.procedureCode}`)
    }

    const originalMods = original.modifiers?.join(', ') || ''
    if (edited.modifiersInput !== originalMods) {
      changes.push(`Line ${index + 1}: Updated modifiers to "${edited.modifiersInput}"`)
    }

    if (edited.units !== original.units) {
      changes.push(`Line ${index + 1}: Changed units from ${original.units} to ${edited.units}`)
    }
  })

  return changes
})

function detectChanges() {
  // Real-time change detection for UX feedback
}

function resetChanges() {
  if (originalClaim.value?.lineItems) {
    editedLineItems.value = originalClaim.value.lineItems.map(item => ({
      ...JSON.parse(JSON.stringify(item)),
      modifiersInput: item.modifiers?.join(', ') || '',
    }))
  }
  simulationResults.value = null
  correctionsCount.value = 0
}

function runSimulation() {
  if (!originalClaim.value) return

  const correctionsApplied: string[] = []
  let outcome: 'approved' | 'denied' = 'denied'
  let reason = originalClaim.value.denialReason || 'Policy violation'

  // Check for modifier 25 correction
  const hasModifier25 = editedLineItems.value.some(item =>
    item.modifiersInput.toLowerCase().includes('25')
  )

  if (originalClaim.value.denialReason?.includes('Modifier 25') && hasModifier25) {
    outcome = 'approved'
    correctionsApplied.push('Added modifier 25 to E&M service')
    correctionsCount.value++
  }

  // Check for prior authorization (simulated)
  if (originalClaim.value.denialReason?.includes('Authorization') ||
      originalClaim.value.denialReason?.includes('Prior Auth')) {
    // In real scenario, would check if auth was obtained
    reason = 'Prior authorization required - would need to obtain before resubmission'
  }

  // Check for documentation improvements
  if (originalClaim.value.denialReason?.includes('Documentation')) {
    const hasDetailedCodes = editedLineItems.value.every(item => item.procedureCode.length >= 5)
    if (hasDetailedCodes) {
      outcome = 'approved'
      correctionsApplied.push('Improved documentation specificity')
      correctionsCount.value++
    }
  }

  // Check for bundling corrections
  if (originalClaim.value.denialReason?.includes('Bundling') ||
      originalClaim.value.denialReason?.includes('Unbundling')) {
    // Simplified check - removed problematic bundled codes
    if (originalClaim.value.lineItems && editedLineItems.value.length < originalClaim.value.lineItems.length) {
      outcome = 'approved'
      correctionsApplied.push('Removed bundled procedure codes')
      correctionsCount.value++
    }
  }

  simulationResults.value = {
    outcome,
    estimatedPayment: outcome === 'approved' ? originalClaim.value.billedAmount * 0.85 : 0,
    reason: outcome === 'denied' ? reason : undefined,
    correctionsApplied,
  }
}

function saveLearning() {
  if (!originalClaim.value || !simulationResults.value) return

  const duration = Date.now() - sessionStartTime.value

  // Save learning marker
  appStore.addLearningMarker({
    userId: 'user-1',
    type: 'claim_corrected',
    category: contextPattern.value?.category || 'Coding Error',
    description: `Corrected claim ${originalClaim.value.id}${contextPattern.value ? ` - ${contextPattern.value.title}` : ''}`,
    originalClaim: originalClaim.value,
    simulationResult: simulationResults.value,
  })

  // Track practice completion
  if (contextPattern.value) {
    completePracticeSession(
      contextPattern.value.id,
      duration,
      correctionsCount.value
    )

    trackPracticeCompletion(
      contextPattern.value.id,
      duration,
      correctionsCount.value
    )

    // Record each correction
    changesSummary.value.forEach(change => {
      recordCorrection(contextPattern.value!.id, originalClaim.value!.id, change)
      trackCorrection(originalClaim.value!.id, contextPattern.value!.id, change)
    })
  }

  alert(`Learning saved! ${correctionsCount.value} correction(s) applied. ${contextPattern.value ? 'Pattern progress updated.' : ''}`)
  navigateTo('/')
}

// Code intelligence helper functions
const hasCodeIntelligence = (code: string): boolean => {
  return hasIntelligence(code)
}

const viewCodeIntelligence = (code: string) => {
  openCodeIntelligence(code)
}

const showCodeHelp = (code: string) => {
  const intelligence = analyticsStore.getCodeIntelligence(code)
  if (intelligence) {
    selectedCodeForHelp.value = intelligence
  }
}

const checkCodeIntelligence = (code: string) => {
  // Auto-show help when a code with intelligence is entered
  if (hasCodeIntelligence(code) && !selectedCodeForHelp.value) {
    showCodeHelp(code)
  }
}
</script>
