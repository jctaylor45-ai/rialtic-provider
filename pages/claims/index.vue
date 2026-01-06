<template>
  <div class="flex-1 overflow-hidden p-8">
    <!-- Search Bar -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="flex-1">
          <label class="text-sm text-gray-600 mb-1 block">Claim ID</label>
          <input
            v-model="searchParams.claimId"
            type="text"
            placeholder="CLM-2025-XXXX"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex-1">
          <label class="text-sm text-gray-600 mb-1 block">Patient</label>
          <input
            v-model="searchParams.patient"
            type="text"
            placeholder="Search by patient..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex-1">
          <label class="text-sm text-gray-600 mb-1 block">Procedure Code</label>
          <input
            v-model="searchParams.procedureCode"
            type="text"
            placeholder="CPT/HCPCS code"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div class="flex items-center gap-4">
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="pending">Pending</option>
          <option value="appealed">Appealed</option>
        </select>

        <select
          v-model="filters.dateRange"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-gray-600 mb-4">
      {{ filteredClaims.length }} claims found
    </div>

    <!-- Results Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Claim ID</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Patient</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Date of Service</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-gray-700">Amount</th>
              <th class="text-center px-6 py-3 text-xs font-semibold text-gray-700">Status</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Patterns</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-700">Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="claim in filteredClaims"
              :key="claim.id"
              class="hover:bg-primary-50 cursor-pointer transition-colors"
              @click="navigateTo(`/claims/${claim.id}`)"
            >
              <td class="px-6 py-4">
                <div class="font-mono text-sm text-primary-600 font-medium">{{ claim.id }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ claim.patientName }}</div>
                <div v-if="claim.memberId" class="text-xs text-gray-500">ID: {{ claim.memberId }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ formatDate(claim.dateOfService) }}</div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(claim.billedAmount) }}</div>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="{
                    'bg-green-100 text-green-700': claim.status === 'approved',
                    'bg-red-100 text-red-700': claim.status === 'denied',
                    'bg-yellow-100 text-yellow-700': claim.status === 'pending',
                    'bg-blue-100 text-blue-700': claim.status === 'appealed',
                  }"
                >
                  {{ claim.status.charAt(0).toUpperCase() + claim.status.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4" @click.stop>
                <div v-if="getClaimPatterns(claim.id).length > 0" class="flex flex-wrap gap-1">
                  <button
                    v-for="pattern in getClaimPatterns(claim.id).slice(0, 2)"
                    :key="pattern.id"
                    @click="viewPattern(pattern)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-colors"
                    :class="getPatternBadgeClass(pattern.tier)"
                    :title="pattern.title"
                  >
                    <Icon :name="getPatternIcon(pattern.category)" class="w-3 h-3" />
                    <span>{{ pattern.tier.charAt(0).toUpperCase() + pattern.tier.slice(1) }}</span>
                  </button>
                  <span
                    v-if="getClaimPatterns(claim.id).length > 2"
                    class="inline-flex items-center px-2 py-0.5 text-xs text-gray-600"
                    :title="`+${getClaimPatterns(claim.id).length - 2} more pattern(s)`"
                  >
                    +{{ getClaimPatterns(claim.id).length - 2 }}
                  </span>
                </div>
                <div v-else class="text-xs text-gray-400">—</div>
              </td>
              <td class="px-6 py-4">
                <div v-if="claim.denialReason" class="text-sm text-gray-700">{{ claim.denialReason }}</div>
              </td>
            </tr>
            <tr v-if="filteredClaims.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                No claims found matching your criteria
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pattern } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const router = useRouter()

// Composables
const { getPatternCategoryIcon } = usePatterns()

const searchParams = reactive({
  claimId: '',
  patient: '',
  procedureCode: '',
})

const filters = reactive({
  status: 'all',
  dateRange: '90',
})

const filteredClaims = computed(() => {
  let result = [...appStore.claims]

  // Search filters
  if (searchParams.claimId) {
    result = result.filter(c => c.id.toLowerCase().includes(searchParams.claimId.toLowerCase()))
  }

  if (searchParams.patient) {
    result = result.filter(c =>
      c.patientName.toLowerCase().includes(searchParams.patient.toLowerCase()) ||
      c.memberId?.toLowerCase().includes(searchParams.patient.toLowerCase())
    )
  }

  if (searchParams.procedureCode) {
    result = result.filter(c => {
      const codes = c.procedureCodes || (c.procedureCode ? [c.procedureCode] : [])
      return codes.some(code => code?.toLowerCase().includes(searchParams.procedureCode.toLowerCase()))
    })
  }

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter(c => c.status === filters.status)
  }

  // Date range filter
  if (filters.dateRange !== 'all') {
    const days = parseInt(filters.dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    result = result.filter(c => new Date(c.dateOfService) >= cutoffDate)
  }

  return result.sort((a, b) => new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime())
})

// Get patterns matching a claim
const getClaimPatterns = (claimId: string): Pattern[] => {
  return patternsStore.getPatternsByClaim(claimId)
}

// Get pattern tier badge class
const getPatternBadgeClass = (tier: string) => {
  const classes = {
    critical: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  }
  return classes[tier as keyof typeof classes] || 'bg-gray-100 text-gray-700 border-gray-300'
}

// Get pattern category icon
const getPatternIcon = (category: string) => {
  return getPatternCategoryIcon(category)
}

// Navigate to pattern details in insights page
const viewPattern = (pattern: Pattern) => {
  // Store the pattern ID in session storage so insights page can open it
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openPatternId', pattern.id)
  }
  router.push('/insights')
}
</script>
