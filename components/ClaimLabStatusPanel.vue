<template>
  <aside
    class="status-panel border-l border-neutral-200 bg-white shadow-lg transition-all duration-300"
    :class="open ? 'w-[400px]' : 'w-16'"
  >
    <!-- Collapsed State -->
    <button
      v-if="!open"
      @click="open = true"
      class="w-full h-full flex flex-col items-center justify-center py-6 text-secondary-700 hover:text-secondary-800 hover:bg-neutral-50"
    >
      <Icon name="heroicons:chevron-left" class="w-5 h-5 mb-2" />
      <span class="text-xs font-medium writing-vertical">Status Details</span>
    </button>

    <!-- Expanded State -->
    <div v-else class="h-full flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-neutral-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900">Status Details</h2>
          <button
            @click="open = false"
            class="p-1 text-neutral-400 hover:text-neutral-600 rounded hover:bg-neutral-100"
          >
            <Icon name="heroicons:chevron-right" class="w-5 h-5" />
          </button>
        </div>

        <!-- Claim Line Tabs -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="line in claimLines"
            :key="line.id"
            @click="$emit('select-line', line.id)"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5"
            :class="activeLineId === line.id
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'"
          >
            Line {{ line.editedData.lineNumber }}
            <span
              v-if="testResult"
              class="w-2 h-2 rounded-full"
              :class="getLineStatusDotClass(line.id)"
            />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="activeLine" class="p-6">
          <!-- Overall Test Result -->
          <div v-if="testResult" class="mb-6 p-4 rounded-lg border" :class="overallResultClass">
            <div class="flex items-center gap-2 mb-2">
              <Icon
                :name="testResult.status === 'approved' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                class="w-6 h-6"
                :class="testResult.status === 'approved' ? 'text-success-600' : 'text-error-600'"
              />
              <span class="text-lg font-semibold" :class="testResult.status === 'approved' ? 'text-success-700' : 'text-error-700'">
                {{ testResult.status === 'approved' ? 'Approved' : 'Needs Attention' }}
              </span>
            </div>
            <p class="text-sm text-neutral-700">{{ testResult.summary }}</p>
            <div v-if="testResult.status === 'approved' && testResult.estimatedPayment > 0" class="mt-3 pt-3 border-t border-neutral-200">
              <div class="text-xs text-neutral-600">Estimated Payment</div>
              <div class="text-2xl font-bold text-success-600">{{ formatCurrency(testResult.estimatedPayment) }}</div>
            </div>
          </div>

          <!-- Existing Status Section -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-neutral-900 mb-3">Existing Status</h3>
            <ClaimLabStatusBadge :status="getExistingStatusForLine(activeLine)" />

            <div v-if="activeLine.existingInsights.length > 0" class="mt-3 space-y-2">
              <div
                v-for="(insight, idx) in activeLine.existingInsights"
                :key="idx"
                class="p-3 bg-error-50 border border-error-200 rounded-lg"
              >
                <div class="flex items-center gap-2 mb-1">
                  <Icon name="heroicons:exclamation-triangle" class="w-4 h-4 text-error-600" />
                  <span class="text-xs font-medium text-error-700">{{ insight.code || 'Denial' }}</span>
                </div>
                <p class="text-sm text-error-800">{{ insight.reason }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-neutral-500 mt-2">No existing issues for this line.</p>
          </div>

          <!-- Test Status Section -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-neutral-900 mb-3">Test Status</h3>

            <div v-if="!testResult" class="text-center py-6">
              <Icon name="heroicons:beaker" class="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p class="text-sm text-neutral-500 mb-3">Run test to see results</p>
              <button
                :disabled="testInProgress"
                @click="$emit('run-test')"
                class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
              >
                <Icon v-if="testInProgress" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                <Icon v-else name="heroicons:beaker" class="w-4 h-4" />
                Run Test
              </button>
            </div>

            <template v-else>
              <ClaimLabStatusBadge :status="getTestStatusForLine(activeLine)" :show-untested="true" />

              <div v-if="lineTestInsights.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="(insight, idx) in lineTestInsights"
                  :key="idx"
                  class="p-3 rounded-lg border"
                  :class="getInsightClass(insight)"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <Icon :name="getInsightIcon(insight)" class="w-4 h-4" :class="getInsightIconClass(insight)" />
                    <span class="text-xs font-medium" :class="getInsightLabelClass(insight)">{{ insight.code }}</span>
                    <span v-if="insight.severity && insight.severity !== 'info'" class="text-xs px-1.5 py-0.5 rounded" :class="getSeverityClass(insight.severity)">
                      {{ insight.severity }}
                    </span>
                  </div>
                  <p class="text-sm" :class="getInsightTextClass(insight)">{{ insight.reason }}</p>
                </div>
              </div>
              <p v-else class="text-sm text-success-600 mt-2 flex items-center gap-2">
                <Icon name="heroicons:check-circle" class="w-4 h-4" />
                No issues detected for this line.
              </p>
            </template>
          </div>

          <!-- Advice Section -->
          <div v-if="lineAdvice.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Icon name="heroicons:light-bulb" class="w-4 h-4 text-warning-500" />
              How to Fix
            </h3>

            <div class="space-y-3">
              <div
                v-for="(item, idx) in lineAdvice"
                :key="idx"
                class="p-4 bg-warning-50 border border-warning-200 rounded-lg"
              >
                <h4 class="text-sm font-semibold text-warning-800 mb-2">{{ item.action }}</h4>
                <p class="text-sm text-warning-700 mb-3">{{ item.explanation }}</p>

                <div v-if="item.suggestedValue" class="flex items-center gap-2">
                  <span class="text-xs text-warning-600">Suggested:</span>
                  <code class="px-2 py-1 bg-white border border-warning-300 rounded text-xs font-mono text-warning-800">
                    {{ item.suggestedValue }}
                  </code>
                  <button
                    @click="applySuggestion(item)"
                    class="px-2 py-1 bg-warning-600 text-white text-xs font-medium rounded hover:bg-warning-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="testResult && testResult.status === 'approved' && getTestStatusForLine(activeLine) === 'improved'" class="p-4 bg-success-50 border border-success-200 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:check-badge" class="w-5 h-5 text-success-600" />
              <span class="text-sm font-semibold text-success-700">Issue Resolved!</span>
            </div>
            <p class="text-sm text-success-700">
              Your changes have addressed the previous denial reason. This claim line would now be approved.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="testResult && testResult.status === 'approved'" class="p-4 border-t border-neutral-200 bg-neutral-50">
        <button
          class="w-full py-3 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="heroicons:document-arrow-down" class="w-5 h-5" />
          Export Corrected Claim
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface ClaimLabLine {
  id: string
  isNew: boolean
  editedData: {
    lineNumber: number
    [key: string]: any
  }
  existingInsights: TestInsight[]
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

const props = defineProps<{
  claimLines: ClaimLabLine[]
  activeLineId: string | null
  testResult: TestResult | null
  testInProgress: boolean
  advice: AdviceItem[] | null
}>()

const emit = defineEmits<{
  'select-line': [lineId: string]
  'run-test': []
  'apply-suggestion': [lineId: string, field: string, value: string]
}>()

const open = defineModel<boolean>('open', { default: false })

const { formatCurrency } = useAnalytics()

// Active line
const activeLine = computed(() => {
  if (!props.activeLineId) return props.claimLines[0] || null
  return props.claimLines.find(l => l.id === props.activeLineId) || null
})

// Line test insights
const lineTestInsights = computed(() => {
  if (!props.testResult || !activeLine.value) return []
  const result = props.testResult.lineResults.find(r => r.lineId === activeLine.value!.id)
  return result?.insights || []
})

// Line advice
const lineAdvice = computed(() => {
  if (!props.advice || !activeLine.value) return []
  return props.advice.filter(a => a.lineId === activeLine.value!.id)
})

// Overall result styling
const overallResultClass = computed(() => {
  if (!props.testResult) return 'bg-neutral-50 border-neutral-200'
  return props.testResult.status === 'approved'
    ? 'bg-success-50 border-success-200'
    : 'bg-error-50 border-error-200'
})

// Helper functions
function getExistingStatusForLine(line: ClaimLabLine): 'approved' | 'denied' | 'pending' | 'new' {
  if (line.isNew) return 'new'
  if (line.existingInsights.some(i => i.type === 'denial')) return 'denied'
  return 'pending'
}

function getTestStatusForLine(line: ClaimLabLine): 'approved' | 'denied' | 'untested' | 'improved' {
  if (!props.testResult) return 'untested'
  const result = props.testResult.lineResults.find(r => r.lineId === line.id)
  if (!result) return 'untested'

  if (result.status === 'approved') {
    if (getExistingStatusForLine(line) === 'denied') return 'improved'
    return 'approved'
  }
  return 'denied'
}

function getLineStatusDotClass(lineId: string): string {
  const line = props.claimLines.find(l => l.id === lineId)
  if (!line) return 'bg-neutral-400'

  const status = getTestStatusForLine(line)
  switch (status) {
    case 'approved':
    case 'improved':
      return 'bg-success-500'
    case 'denied':
      return 'bg-error-500'
    default:
      return 'bg-neutral-400'
  }
}

function getInsightClass(insight: TestInsight): string {
  switch (insight.type) {
    case 'denial':
      return 'bg-error-50 border-error-200'
    case 'warning':
      return 'bg-warning-50 border-warning-200'
    case 'success':
      return 'bg-success-50 border-success-200'
    default:
      return 'bg-neutral-50 border-neutral-200'
  }
}

function getInsightIcon(insight: TestInsight): string {
  switch (insight.type) {
    case 'denial':
      return 'heroicons:x-circle'
    case 'warning':
      return 'heroicons:exclamation-triangle'
    case 'success':
      return 'heroicons:check-circle'
    default:
      return 'heroicons:information-circle'
  }
}

function getInsightIconClass(insight: TestInsight): string {
  switch (insight.type) {
    case 'denial':
      return 'text-error-600'
    case 'warning':
      return 'text-warning-600'
    case 'success':
      return 'text-success-600'
    default:
      return 'text-neutral-500'
  }
}

function getInsightLabelClass(insight: TestInsight): string {
  switch (insight.type) {
    case 'denial':
      return 'text-error-700'
    case 'warning':
      return 'text-warning-700'
    case 'success':
      return 'text-success-700'
    default:
      return 'text-neutral-700'
  }
}

function getInsightTextClass(insight: TestInsight): string {
  switch (insight.type) {
    case 'denial':
      return 'text-error-800'
    case 'warning':
      return 'text-warning-800'
    case 'success':
      return 'text-success-700'
    default:
      return 'text-neutral-700'
  }
}

function getSeverityClass(severity: string): string {
  switch (severity) {
    case 'high':
      return 'bg-error-100 text-error-700'
    case 'medium':
      return 'bg-warning-100 text-warning-700'
    case 'low':
      return 'bg-neutral-100 text-neutral-700'
    default:
      return 'bg-neutral-100 text-neutral-600'
  }
}

function applySuggestion(item: AdviceItem) {
  if (item.suggestedValue) {
    emit('apply-suggestion', item.lineId, item.field, item.suggestedValue)
  }
}
</script>

<style scoped>
.status-panel {
  @apply flex flex-col h-full;
}

.writing-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
</style>
