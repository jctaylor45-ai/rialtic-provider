<script setup lang="ts">
/**
 * Policy details content component
 * Displays full policy information inside a drawer
 * Uses PaAPI-compatible Policy format
 */
import { format, parseISO } from 'date-fns'
import type { Policy } from '~/types'
import { normalizePolicyForDisplay, type DisplayPolicy } from '~/composables/usePolicyDisplay'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  close: []
}>()

const analyticsStore = useAnalyticsStore()
const router = useRouter()

// Normalize policy for template display
const displayPolicy = computed<DisplayPolicy>(() => {
  return normalizePolicyForDisplay(props.policy)
})

// Composables
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

// Get related policies (other policies this one references) - empty for PaAPI format
const linkedPolicies = computed<Policy[]>(() => {
  return []
})


// Navigate to related policy
const viewRelatedPolicy = (policyId: string) => {
  navigateTo(`/provider-portal/denial-intelligence?policy=${policyId}`)
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

      <!-- Source Badge -->
      <div v-if="policy.source" class="mt-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg border border-neutral-200">
          <Icon name="heroicons:building-office" class="w-4 h-4 text-neutral-500" />
          {{ policy.source }}
        </span>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Policy Details Grid -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-4">Policy Details</h3>
        <div class="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <div class="text-neutral-500 text-xs mb-1">Topic</div>
            <div class="text-neutral-900 font-medium">{{ displayPolicy.topicName || '–' }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Logic Type</div>
            <div class="text-neutral-900 font-medium">{{ displayPolicy.logicType || '–' }}</div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs mb-1">Effective Date</div>
            <div class="text-neutral-900 font-medium">{{ formatDateLong(displayPolicy.effectiveDate) }}</div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-2">Description</h3>
        <div class="text-sm text-neutral-700 prose prose-sm max-w-none" v-html="renderMarkdown(policy.description)" />
      </div>

      <!-- Clinical Rationale -->
      <div v-if="displayPolicy.clinicalRationale" class="p-6 border-b border-neutral-200">
        <h3 class="text-sm font-semibold text-neutral-900 mb-2">Clinical Rationale</h3>
        <div class="text-sm text-neutral-700 prose prose-sm max-w-none" v-html="renderMarkdown(displayPolicy.clinicalRationale)" />
      </div>

      <!-- Guidance -->
      <div v-if="displayPolicy.commonMistake || displayPolicy.fixGuidance" class="p-6 border-b border-neutral-200">
        <div class="grid grid-cols-1 gap-4">
          <div v-if="displayPolicy.commonMistake">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Common Mistake</h3>
            <div class="text-sm text-neutral-700 prose prose-sm max-w-none" v-html="renderMarkdown(displayPolicy.commonMistake)" />
          </div>
          <div v-if="displayPolicy.fixGuidance">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2">Fix Guidance</h3>
            <div class="text-sm text-neutral-700 prose prose-sm max-w-none" v-html="renderMarkdown(displayPolicy.fixGuidance)" />
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

    </div>

    <!-- Footer Actions -->
    <div class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="flex items-center gap-3">
        <button
          class="flex-1 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          @click="router.push('/provider-portal/claims?status=denied')"
        >
          View Related Claims
        </button>
        <NuxtLink
          to="/provider-portal/claim-lab"
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
