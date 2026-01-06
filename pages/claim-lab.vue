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
      <!-- Left Panel: Original Claim -->
      <div class="w-[30%] bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
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

        <!-- Line Items (read-only) -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Line Items</h4>
          <div class="space-y-3">
            <div
              v-for="item in originalClaim.lineItems"
              :key="item.lineNumber"
              class="bg-white border border-gray-200 rounded p-3"
            >
              <div class="font-mono text-xs text-gray-900 mb-1">{{ item.procedureCode }}</div>
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
          <h2 class="text-lg font-semibold text-gray-900">Edit & Test</h2>
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
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Run Simulation
            </button>
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
                <label class="text-xs text-gray-600 mb-1 block">Procedure Code</label>
                <input
                  v-model="item.procedureCode"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
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
              class="flex items-center gap-2 mb-2"
              :class="{
                'text-green-700': simulationResults.outcome === 'approved',
                'text-red-700': simulationResults.outcome === 'denied',
              }"
            >
              <Icon
                :name="simulationResults.outcome === 'approved' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                class="w-5 h-5"
              />
              <span class="font-semibold">{{ simulationResults.outcome === 'approved' ? 'Approved' : 'Denied' }}</span>
            </div>

            <div class="text-sm text-gray-700">
              <div v-if="simulationResults.outcome === 'approved'">
                Estimated Payment: <strong>{{ formatCurrency(simulationResults.estimatedPayment) }}</strong>
              </div>
              <div v-else>
                Reason: {{ simulationResults.reason }}
              </div>
            </div>
          </div>

          <button
            v-if="simulationResults.outcome === 'approved'"
            @click="saveLearning"
            class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Learning
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LineItem } from '~/types'

const route = useRoute()
const appStore = useAppStore()

const claimId = route.query.claim as string | undefined

const originalClaim = computed(() => {
  if (claimId) {
    const found = appStore.getClaimById(claimId)
    return found ? ensureLineItems(found) : null
  }
  // Default to first denied claim
  const firstDenied = appStore.deniedClaims[0]
  return firstDenied ? ensureLineItems(firstDenied) : null
})

const editedLineItems = ref<Array<LineItem & { modifiersInput: string }>>([])
const simulationResults = ref<any>(null)

watch(originalClaim, (claim) => {
  if (claim?.lineItems) {
    editedLineItems.value = claim.lineItems.map(item => ({
      ...JSON.parse(JSON.stringify(item)),
      modifiersInput: item.modifiers?.join(', ') || '',
    }))
  }
}, { immediate: true })

const hasChanges = computed(() => {
  if (!originalClaim.value) return false
  return JSON.stringify(originalClaim.value.lineItems) !== JSON.stringify(editedLineItems.value.map(i => {
    const { modifiersInput, ...rest } = i
    return { ...rest, modifiers: modifiersInput.split(',').map(m => m.trim()).filter(Boolean) }
  }))
})

function resetChanges() {
  if (originalClaim.value?.lineItems) {
    editedLineItems.value = originalClaim.value.lineItems.map(item => ({
      ...JSON.parse(JSON.stringify(item)),
      modifiersInput: item.modifiers?.join(', ') || '',
    }))
  }
  simulationResults.value = null
}

function runSimulation() {
  // Simple simulation logic
  const hasModifier25 = editedLineItems.value.some(item =>
    item.modifiersInput.toLowerCase().includes('25')
  )

  if (originalClaim.value?.denialReason?.includes('Modifier 25') && hasModifier25) {
    simulationResults.value = {
      outcome: 'approved',
      estimatedPayment: originalClaim.value.billedAmount * 0.85,
    }
  } else {
    simulationResults.value = {
      outcome: 'denied',
      reason: originalClaim.value?.denialReason || 'Policy violation',
    }
  }
}

function saveLearning() {
  if (!originalClaim.value) return

  appStore.addLearningMarker({
    userId: 'user-1',
    type: 'claim_corrected',
    category: 'Coding Error',
    description: `Corrected claim ${originalClaim.value.id}`,
    originalClaim: originalClaim.value,
    simulationResult: simulationResults.value,
  })

  alert('Learning saved! This will help track your progress.')
  navigateTo('/')
}
</script>
