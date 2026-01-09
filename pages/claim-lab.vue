<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 lg:px-7 lg:py-4 bg-white">
      <div>
        <h1 class="text-lg font-semibold text-neutral-900 lg:text-2xl">Claim Lab</h1>
        <p v-if="originalClaim" class="text-xs text-secondary-700 lg:text-sm">
          {{ originalClaim.id }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Error Message -->
        <div v-if="testError" class="text-error-600 text-xs mr-2">
          {{ testError }}
        </div>

        <!-- Run Test Button -->
        <button
          :disabled="testInProgress"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          @click="runTest"
        >
          <Icon v-if="testInProgress" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <Icon v-else name="heroicons:beaker" class="w-4 h-4" />
          <span class="hidden sm:inline">Run Test</span>
        </button>

        <!-- Add Claim Line Button -->
        <div class="relative">
          <button
            :disabled="remainingSlots === 0"
            class="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            @click="addClaimLine"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            <span class="hidden sm:inline">Add Line</span>
          </button>
          <span
            class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
            :class="remainingSlots === 0 ? 'bg-warning-500' : 'bg-success-500'"
          >
            {{ remainingSlots }}/{{ MAX_NEW_LINES }}
          </span>
        </div>

        <!-- Reset Button -->
        <button
          v-if="hasChanges"
          class="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          @click="resetChanges"
        >
          Reset
        </button>
      </div>
    </header>

    <!-- No Claim Selected State -->
    <div v-if="!originalClaim" class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <Icon name="heroicons:beaker" class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-neutral-900 mb-2">No Claim Selected</h2>
        <p class="text-neutral-600 mb-6">Select a claim to test in the Claim Lab</p>
        <button
          @click="navigateTo('/claims')"
          class="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Browse Claims
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 flex overflow-hidden">
      <!-- Spreadsheet Grid -->
      <div class="flex-1 overflow-auto" ref="gridContainer">
        <div class="claim-lab-grid">
          <!-- Row Labels (Sticky Left Column) -->
          <div class="row-labels">
            <div
              v-for="(field, index) in rowFields"
              :key="field.key"
              class="row-label"
              :class="{ 'sticky-header': index === 0 }"
            >
              {{ field.label }}
              <span v-if="field.required" class="text-error-600">*</span>
            </div>
          </div>

          <!-- Claim Line Columns -->
          <div class="claim-lines-container">
            <ClaimLabLineColumn
              v-for="(line, index) in claimLines"
              :key="line.id"
              :line="line"
              :line-number="index + 1"
              :is-new="line.isNew"
              :row-fields="rowFields"
              :existing-status="getExistingStatus(line)"
              :test-status="getTestStatus(line)"
              :test-insights="getTestInsights(line)"
              :has-edits="lineHasEdits(line.id)"
              @update:field="updateLineField"
              @remove="removeClaimLine"
            />
          </div>
        </div>
      </div>

      <!-- Status Details Panel -->
      <ClaimLabStatusPanel
        v-model:open="statusPanelOpen"
        :claim-lines="claimLines"
        :active-line-id="activeLineId"
        :test-result="testResult"
        :test-in-progress="testInProgress"
        :advice="currentAdvice"
        @select-line="selectLine"
        @run-test="runTest"
        @apply-suggestion="applySuggestion"
      />
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-500 flex items-center gap-4">
      <span><kbd class="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700">⌘</kbd> + <kbd class="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700">Enter</kbd> Run Test</span>
      <span><kbd class="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700">Esc</kbd> Close Panel</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Claim, LineItem } from '~/types'

const route = useRoute()
const appStore = useAppStore()
const patternsStore = usePatternsStore()

// Composables
const { formatCurrency } = useAnalytics()

// Constants
const MAX_NEW_LINES = 3

// Route params
const claimId = computed(() => route.query.claim as string | undefined)
const patternId = computed(() => route.query.pattern as string | undefined)

// State
const gridContainer = ref<HTMLElement | null>(null)
const statusPanelOpen = ref(false)
const activeLineId = ref<string | null>(null)
const testInProgress = ref(false)
const testError = ref('')
const testResult = ref<TestResult | null>(null)
const newLineCounter = ref(0)

// Place of service options (defined before use)
const placeOfServiceOptions = [
  { value: '11', label: '11 - Office' },
  { value: '21', label: '21 - Inpatient Hospital' },
  { value: '22', label: '22 - Outpatient Hospital' },
  { value: '23', label: '23 - Emergency Room' },
  { value: '24', label: '24 - Ambulatory Surgical Center' },
  { value: '31', label: '31 - Skilled Nursing Facility' },
  { value: '32', label: '32 - Nursing Facility' },
  { value: '81', label: '81 - Independent Laboratory' },
]

// Row field definitions
const rowFields = ref<RowField[]>([
  { key: 'lineNumber', label: 'Line', required: false, editable: false, type: 'display' },
  { key: 'existingStatus', label: 'Existing Status', required: false, editable: false, type: 'status' },
  { key: 'testStatus', label: 'Test Status', required: false, editable: false, type: 'status' },
  { key: 'dateOfServiceFrom', label: 'Date of Service (From)', required: true, editable: true, type: 'date' },
  { key: 'dateOfServiceTo', label: 'Date of Service (To)', required: true, editable: true, type: 'date' },
  { key: 'procedureCode', label: 'CPT/HCPCS', required: true, editable: true, type: 'code', codeType: 'procedure' },
  { key: 'ndcCode', label: 'NDC Code', required: false, editable: true, type: 'text' },
  { key: 'placeOfService', label: 'Place of Service', required: true, editable: true, type: 'select', options: placeOfServiceOptions },
  { key: 'units', label: 'Units', required: true, editable: true, type: 'number' },
  { key: 'modifier1', label: 'Modifier 1', required: false, editable: true, type: 'code', codeType: 'modifier' },
  { key: 'modifier2', label: 'Modifier 2', required: false, editable: true, type: 'code', codeType: 'modifier' },
  { key: 'modifier3', label: 'Modifier 3', required: false, editable: true, type: 'code', codeType: 'modifier' },
  { key: 'modifier4', label: 'Modifier 4', required: false, editable: true, type: 'code', codeType: 'modifier' },
  { key: 'diagnosisCode1', label: 'Diagnosis 1', required: true, editable: true, type: 'code', codeType: 'diagnosis' },
  { key: 'diagnosisCode2', label: 'Diagnosis 2', required: false, editable: true, type: 'code', codeType: 'diagnosis' },
  { key: 'diagnosisCode3', label: 'Diagnosis 3', required: false, editable: true, type: 'code', codeType: 'diagnosis' },
  { key: 'diagnosisCode4', label: 'Diagnosis 4', required: false, editable: true, type: 'code', codeType: 'diagnosis' },
  { key: 'renderingProviderNpi', label: 'Rendering Provider NPI', required: true, editable: true, type: 'text' },
  { key: 'billedAmount', label: 'Billed Amount', required: false, editable: false, type: 'currency' },
  { key: 'patientName', label: 'Patient Name', required: false, editable: false, type: 'display' },
  { key: 'memberId', label: 'Member ID', required: false, editable: false, type: 'display' },
  { key: 'patientDob', label: 'Patient DOB', required: false, editable: false, type: 'display' },
  { key: 'priorAuthNumber', label: 'Prior Auth #', required: false, editable: false, type: 'display' },
])

// Get original claim
const originalClaim = computed(() => {
  if (claimId.value) {
    return appStore.getClaimById(claimId.value) || null
  }
  // Default to first denied claim
  return appStore.deniedClaims[0] || null
})

// Get pattern context
const contextPattern = computed(() => {
  if (patternId.value) {
    return patternsStore.getPatternById(patternId.value)
  }
  return null
})

// Claim lines (editable state)
const claimLines = ref<ClaimLabLine[]>([])

// Initialize claim lines from original claim
watch(originalClaim, (claim) => {
  if (claim) {
    initializeClaimLines(claim)
  }
}, { immediate: true })

function initializeClaimLines(claim: Claim) {
  claimLines.value = (claim.lineItems || []).map((item, index) => ({
    id: `line-${index + 1}`,
    isNew: false,
    originalData: { ...item },
    editedData: {
      lineNumber: index + 1,
      dateOfServiceFrom: claim.dateOfService,
      dateOfServiceTo: claim.dateOfService,
      procedureCode: item.procedureCode,
      ndcCode: '',
      placeOfService: '11',
      units: item.units,
      modifier1: item.modifiers?.[0] || '',
      modifier2: item.modifiers?.[1] || '',
      modifier3: item.modifiers?.[2] || '',
      modifier4: item.modifiers?.[3] || '',
      diagnosisCode1: claim.diagnosisCodes?.[0] || '',
      diagnosisCode2: claim.diagnosisCodes?.[1] || '',
      diagnosisCode3: claim.diagnosisCodes?.[2] || '',
      diagnosisCode4: claim.diagnosisCodes?.[3] || '',
      renderingProviderNpi: claim.billingProviderNPI || '',
      billedAmount: item.billedAmount,
      patientName: claim.patientName,
      memberId: claim.memberId || '',
      patientDob: claim.patientDOB || '',
      priorAuthNumber: claim.priorAuthNumber || '',
    },
    existingInsights: claim.status === 'denied' ? [{
      type: 'denial' as const,
      reason: claim.denialReason || 'Unknown denial reason',
      code: 'DENIAL',
    }] : [],
    testInsights: [],
  }))

  // Reset state
  newLineCounter.value = 0
  testResult.value = null
  testError.value = ''
}

// Computed
const remainingSlots = computed(() => MAX_NEW_LINES - claimLines.value.filter(l => l.isNew).length)

const hasChanges = computed(() => {
  return claimLines.value.some(line => {
    if (line.isNew) return true
    return JSON.stringify(line.originalData) !== JSON.stringify(getOriginalLineData(line))
  })
})

// Methods
function getOriginalLineData(line: ClaimLabLine) {
  const original = originalClaim.value?.lineItems?.find(
    (_, i) => `line-${i + 1}` === line.id
  )
  return original || null
}

function addClaimLine() {
  if (remainingSlots.value <= 0) return

  newLineCounter.value++
  const newLineNumber = claimLines.value.length + 1

  claimLines.value.push({
    id: `new-line-${newLineCounter.value}`,
    isNew: true,
    originalData: null,
    editedData: {
      lineNumber: newLineNumber,
      dateOfServiceFrom: originalClaim.value?.dateOfService || '',
      dateOfServiceTo: originalClaim.value?.dateOfService || '',
      procedureCode: '',
      ndcCode: '',
      placeOfService: '11',
      units: 1,
      modifier1: '',
      modifier2: '',
      modifier3: '',
      modifier4: '',
      diagnosisCode1: originalClaim.value?.diagnosisCodes?.[0] || '',
      diagnosisCode2: '',
      diagnosisCode3: '',
      diagnosisCode4: '',
      renderingProviderNpi: originalClaim.value?.billingProviderNPI || '',
      billedAmount: 0,
      patientName: originalClaim.value?.patientName || '',
      memberId: originalClaim.value?.memberId || '',
      patientDob: originalClaim.value?.patientDOB || '',
      priorAuthNumber: originalClaim.value?.priorAuthNumber || '',
    },
    existingInsights: [],
    testInsights: [],
  })
}

function removeClaimLine(lineId: string) {
  const index = claimLines.value.findIndex(l => l.id === lineId)
  if (index === -1) return

  const line = claimLines.value[index]
  if (!line || !line.isNew) return // Can only remove new lines

  claimLines.value.splice(index, 1)

  // Renumber lines
  claimLines.value.forEach((l, i) => {
    l.editedData.lineNumber = i + 1
  })
}

function updateLineField(lineId: string, fieldKey: string, value: any) {
  const line = claimLines.value.find(l => l.id === lineId)
  if (line) {
    (line.editedData as any)[fieldKey] = value
  }
}

function lineHasEdits(lineId: string): boolean {
  const line = claimLines.value.find(l => l.id === lineId)
  if (!line) return false
  if (line.isNew) return true

  // Compare with original
  const original = getOriginalLineData(line)
  if (!original) return false

  return line.editedData.procedureCode !== original.procedureCode ||
    line.editedData.units !== original.units ||
    line.editedData.modifier1 !== (original.modifiers?.[0] || '') ||
    line.editedData.modifier2 !== (original.modifiers?.[1] || '') ||
    line.editedData.modifier3 !== (original.modifiers?.[2] || '') ||
    line.editedData.modifier4 !== (original.modifiers?.[3] || '')
}

function resetChanges() {
  if (originalClaim.value) {
    initializeClaimLines(originalClaim.value)
  }
}

function applySuggestion(lineId: string, field: string, value: string) {
  const line = claimLines.value.find(l => l.id === lineId)
  if (line) {
    (line.editedData as any)[field] = value
  }
}

function selectLine(lineId: string) {
  activeLineId.value = lineId
  statusPanelOpen.value = true

  // Scroll to line
  const index = claimLines.value.findIndex(l => l.id === lineId)
  if (index > 0 && gridContainer.value) {
    gridContainer.value.scrollLeft = index * 160
  }
}

function getExistingStatus(line: ClaimLabLine): 'approved' | 'denied' | 'pending' | 'new' {
  if (line.isNew) return 'new'
  if (line.existingInsights.some(i => i.type === 'denial')) return 'denied'
  return originalClaim.value?.status === 'approved' ? 'approved' : 'pending'
}

function getTestStatus(line: ClaimLabLine): 'approved' | 'denied' | 'untested' | 'improved' {
  if (!testResult.value) return 'untested'

  const lineResult = testResult.value.lineResults.find(r => r.lineId === line.id)
  if (!lineResult) return 'untested'

  if (lineResult.status === 'approved') {
    // Check if it improved from denied
    if (getExistingStatus(line) === 'denied') return 'improved'
    return 'approved'
  }
  return 'denied'
}

function getTestInsights(line: ClaimLabLine) {
  if (!testResult.value) return []
  const lineResult = testResult.value.lineResults.find(r => r.lineId === line.id)
  return lineResult?.insights || []
}

// Advice engine
const currentAdvice = computed(() => {
  if (!testResult.value) return null
  return testResult.value.advice
})

// Run test simulation
async function runTest() {
  if (testInProgress.value || !originalClaim.value) return

  testInProgress.value = true
  testError.value = ''

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Run the test simulation
    testResult.value = simulateClaimTest(claimLines.value)

    // Open status panel to show results
    statusPanelOpen.value = true

    // Select first line with issues
    const lineWithIssue = testResult.value.lineResults.find(r => r.status === 'denied')
    if (lineWithIssue) {
      activeLineId.value = lineWithIssue.lineId
    } else {
      const firstLine = claimLines.value[0]
      if (firstLine) {
        activeLineId.value = firstLine.id
      }
    }
  } catch (error) {
    testError.value = 'Test failed. Please check the data and try again.'
  } finally {
    testInProgress.value = false
  }
}

// Test simulation logic with advice generation
function simulateClaimTest(lines: ClaimLabLine[]): TestResult {
  const lineResults: LineTestResult[] = []
  const overallAdvice: AdviceItem[] = []
  let overallStatus: 'approved' | 'denied' = 'approved'

  for (const line of lines) {
    const insights: TestInsight[] = []
    let lineStatus: 'approved' | 'denied' = 'approved'

    const data = line.editedData

    // Check for missing modifier 25 on E&M with same-day procedure
    if (isEMCode(data.procedureCode) && hasOtherProcedures(lines, line.id)) {
      const hasModifier25 = [data.modifier1, data.modifier2, data.modifier3, data.modifier4]
        .some(m => m === '25')

      if (!hasModifier25) {
        lineStatus = 'denied'
        insights.push({
          type: 'denial',
          code: 'MOD-25',
          reason: 'E&M service billed on same day as procedure requires modifier 25',
          severity: 'high',
        })
        overallAdvice.push({
          lineId: line.id,
          action: 'Add modifier 25 to the E&M code',
          explanation: 'When an E&M service (99201-99215) is billed on the same day as a procedure, modifier 25 is required to indicate the E&M was a separately identifiable service.',
          field: 'modifier1',
          suggestedValue: '25',
        })
      }
    }

    // Check for modifier 59 on potentially bundled procedures
    if (isProcedurePotentiallyBundled(data.procedureCode, lines, line.id)) {
      const hasModifier59 = [data.modifier1, data.modifier2, data.modifier3, data.modifier4]
        .some(m => m === '59' || m === 'XE' || m === 'XP' || m === 'XS' || m === 'XU')

      if (!hasModifier59) {
        lineStatus = 'denied'
        insights.push({
          type: 'denial',
          code: 'BUNDLE',
          reason: 'Procedure may be bundled with another service on this claim',
          severity: 'medium',
        })
        overallAdvice.push({
          lineId: line.id,
          action: 'Consider adding modifier 59 or appropriate X modifier',
          explanation: 'This procedure may be bundled with another service. If the services were distinct, add modifier 59 (or XE, XP, XS, XU) to indicate they were separate and identifiable.',
          field: 'modifier1',
          suggestedValue: '59',
        })
      }
    }

    // Check for prior authorization requirement
    if (requiresPriorAuth(data.procedureCode) && !data.priorAuthNumber) {
      lineStatus = 'denied'
      insights.push({
        type: 'denial',
        code: 'AUTH',
        reason: 'Prior authorization required for this procedure',
        severity: 'high',
      })
      overallAdvice.push({
        lineId: line.id,
        action: 'Obtain prior authorization before resubmitting',
        explanation: 'This procedure requires prior authorization. Contact the payer to obtain authorization, then resubmit with the authorization number.',
        field: 'priorAuthNumber',
        suggestedValue: null,
      })
    }

    // Check for diagnosis code specificity
    if (data.diagnosisCode1 && !isSpecificDiagnosis(data.diagnosisCode1)) {
      lineStatus = 'denied'
      insights.push({
        type: 'denial',
        code: 'DX-SPEC',
        reason: 'Diagnosis code lacks required specificity',
        severity: 'medium',
      })
      overallAdvice.push({
        lineId: line.id,
        action: 'Use a more specific diagnosis code',
        explanation: 'The diagnosis code provided is too general. Review documentation and code to the highest level of specificity supported.',
        field: 'diagnosisCode1',
        suggestedValue: null,
      })
    }

    // Check for medical necessity (diagnosis-procedure match)
    if (data.procedureCode && data.diagnosisCode1) {
      if (!isDiagnosisProcedureMatch(data.diagnosisCode1, data.procedureCode)) {
        insights.push({
          type: 'warning',
          code: 'MED-NEC',
          reason: 'Diagnosis may not support medical necessity for this procedure',
          severity: 'low',
        })
        overallAdvice.push({
          lineId: line.id,
          action: 'Verify diagnosis supports medical necessity',
          explanation: 'The diagnosis code may not clearly establish medical necessity for this procedure. Review documentation to ensure the diagnosis appropriately supports the service.',
          field: 'diagnosisCode1',
          suggestedValue: null,
        })
      }
    }

    // If line was previously denied but now passes all checks
    if (lineStatus === 'approved' && line.existingInsights.some(i => i.type === 'denial')) {
      insights.push({
        type: 'success',
        code: 'FIXED',
        reason: 'Previous denial reason has been addressed',
        severity: 'info',
      })
    }

    if (lineStatus === 'denied') {
      overallStatus = 'denied'
    }

    lineResults.push({
      lineId: line.id,
      status: lineStatus,
      insights,
    })
  }

  // Calculate estimated payment if approved
  const estimatedPayment = overallStatus === 'approved'
    ? lines.reduce((sum, l) => sum + (l.editedData.billedAmount || 0), 0) * 0.85
    : 0

  return {
    status: overallStatus,
    lineResults,
    advice: overallAdvice,
    estimatedPayment,
    summary: overallStatus === 'approved'
      ? 'All claim lines pass validation. Estimated payment shown.'
      : `${lineResults.filter(r => r.status === 'denied').length} line(s) have issues that need to be addressed.`,
  }
}

// Helper functions for test simulation
function isEMCode(code: string): boolean {
  if (!code) return false
  const emRanges = [
    { start: 99201, end: 99215 },
    { start: 99221, end: 99223 },
    { start: 99231, end: 99233 },
    { start: 99281, end: 99285 },
  ]
  const numCode = parseInt(code, 10)
  return emRanges.some(r => numCode >= r.start && numCode <= r.end)
}

function hasOtherProcedures(lines: ClaimLabLine[], excludeLineId: string): boolean {
  return lines.some(l => l.id !== excludeLineId && l.editedData.procedureCode && !isEMCode(l.editedData.procedureCode))
}

function isProcedurePotentiallyBundled(code: string, lines: ClaimLabLine[], excludeLineId: string): boolean {
  if (!code) return false
  // Simplified bundling check - in reality would check CCI edits
  const bundledPairs: Record<string, string[]> = {
    '36415': ['36416', '99211', '99212'],
    '99213': ['99214', '99215'],
  }
  const otherCodes = lines
    .filter(l => l.id !== excludeLineId)
    .map(l => l.editedData.procedureCode)

  return bundledPairs[code]?.some(bundled => otherCodes.includes(bundled)) || false
}

function requiresPriorAuth(code: string): boolean {
  if (!code) return false
  // High-value procedures that typically require prior auth
  const authRequiredCodes = ['27447', '27130', '63030', '22551', '22612', '29881']
  return authRequiredCodes.includes(code)
}

function isSpecificDiagnosis(code: string): boolean {
  if (!code) return false
  // ICD-10 codes should generally be 4+ characters for specificity
  return code.length >= 4
}

function isDiagnosisProcedureMatch(diagnosis: string, procedure: string): boolean {
  // Simplified check - in reality would use medical necessity edits
  // For demo, assume match if diagnosis starts with certain prefixes for certain procedures
  if (!diagnosis || !procedure) return true
  return true // Simplified for demo
}

// Keyboard shortcuts
onKeyStroke('Enter', (e) => {
  if ((e.metaKey || e.ctrlKey) && !testInProgress.value && originalClaim.value) {
    e.preventDefault()
    runTest()
  }
})

onKeyStroke('Escape', () => {
  statusPanelOpen.value = false
})

// Types
interface RowField {
  key: string
  label: string
  required: boolean
  editable: boolean
  type: 'display' | 'status' | 'text' | 'number' | 'date' | 'select' | 'code' | 'currency'
  codeType?: 'procedure' | 'diagnosis' | 'modifier'
  options?: { value: string; label: string }[]
}

interface ClaimLabLine {
  id: string
  isNew: boolean
  originalData: LineItem | null
  editedData: ClaimLineData
  existingInsights: TestInsight[]
  testInsights: TestInsight[]
}

interface ClaimLineData {
  lineNumber: number
  dateOfServiceFrom: string
  dateOfServiceTo: string
  procedureCode: string
  ndcCode: string
  placeOfService: string
  units: number
  modifier1: string
  modifier2: string
  modifier3: string
  modifier4: string
  diagnosisCode1: string
  diagnosisCode2: string
  diagnosisCode3: string
  diagnosisCode4: string
  renderingProviderNpi: string
  billedAmount: number
  patientName: string
  memberId: string
  patientDob: string
  priorAuthNumber: string
}

interface TestInsight {
  type: 'denial' | 'warning' | 'success' | 'info'
  code: string
  reason: string
  severity?: 'high' | 'medium' | 'low' | 'info'
}

interface LineTestResult {
  lineId: string
  status: 'approved' | 'denied'
  insights: TestInsight[]
}

interface AdviceItem {
  lineId: string
  action: string
  explanation: string
  field: string
  suggestedValue: string | null
}

interface TestResult {
  status: 'approved' | 'denied'
  lineResults: LineTestResult[]
  advice: AdviceItem[]
  estimatedPayment: number
  summary: string
}
</script>

<style scoped>
.claim-lab-grid {
  display: grid;
  grid-template-columns: 200px auto;
  min-width: fit-content;
}

.row-labels {
  position: sticky;
  left: 0;
  z-index: 10;
  background: white;
  border-right: 1px solid theme('colors.neutral.200');
}

.row-label {
  @apply flex items-center px-4 py-2 text-xs text-neutral-700 bg-white border-b border-neutral-200;
  height: 36px;
}

.row-label.sticky-header {
  @apply sticky top-0 z-20 bg-neutral-50 font-medium;
}

.claim-lines-container {
  display: flex;
  overflow-x: auto;
}

@media (min-width: 1024px) {
  .claim-lab-grid {
    grid-template-columns: 220px auto;
  }
}
</style>
