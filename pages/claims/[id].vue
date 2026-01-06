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
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">{{ claim.id }}</h1>
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
                'bg-green-100 text-green-700': claim.status === 'approved',
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
                  <span class="font-mono text-sm text-gray-900">{{ item.procedureCode }}</span>
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
                      'bg-green-100 text-green-700': (item.status || claim.status) === 'approved',
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

      <!-- Denial Information -->
      <div v-if="claim.status === 'denied'" class="px-6 pb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Denial Information</h3>

          <div class="mb-4">
            <div class="text-sm text-gray-600 mb-1">Primary Denial Reason</div>
            <div class="text-base font-semibold text-red-900">{{ claim.denialReason }}</div>
          </div>

          <div v-if="claim.aiInsight" class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon name="heroicons:light-bulb" class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="text-sm font-semibold text-gray-900 mb-2">AI Insight</h4>
                <p class="text-sm text-gray-700 mb-3">
                  This claim was denied because {{ claim.aiInsight.explanation }}
                </p>
                <div class="bg-green-50 border border-green-200 rounded p-3">
                  <div class="text-xs font-semibold text-gray-900 mb-1">To fix this:</div>
                  <p class="text-sm text-gray-700">{{ claim.aiInsight.guidance }}</p>
                </div>
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
</template>

<script setup lang="ts">
const route = useRoute()
const appStore = useAppStore()

const claimId = route.params.id as string

const claim = computed(() => {
  const foundClaim = appStore.getClaimById(claimId)
  return foundClaim ? ensureLineItems(foundClaim) : null
})
</script>
