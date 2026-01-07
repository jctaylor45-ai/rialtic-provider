<template>
  <div class="flex-1 overflow-y-auto p-8">
    <!-- Loading State -->
    <div v-if="appStore.isLoading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <UiLoading size="lg" class="mx-auto mb-2" />
        <p class="text-sm text-neutral-600">Loading claims...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
    <!-- Search Bar -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="flex-1">
          <label class="text-sm text-neutral-600 mb-1 block">Claim ID</label>
          <input
            v-model="searchParams.claimId"
            type="text"
            placeholder="CLM-2025-XXXX"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex-1">
          <label class="text-sm text-neutral-600 mb-1 block">Patient</label>
          <input
            v-model="searchParams.patient"
            type="text"
            placeholder="Search by patient..."
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex-1">
          <label class="text-sm text-neutral-600 mb-1 block">Procedure Code</label>
          <input
            v-model="searchParams.procedureCode"
            type="text"
            placeholder="CPT/HCPCS code"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div class="flex items-center gap-4">
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid/Approved</option>
          <option value="denied">Denied</option>
          <option value="pending">Pending</option>
          <option value="appealed">Appealed</option>
        </select>

        <select
          v-model="filters.dateRange"
          class="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-neutral-600 mb-4">
      {{ filteredClaims.length }} claims found
    </div>

    <!-- Results Table -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-50">
            <tr>
              <th
                class="text-left px-6 py-3 text-xs font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
                @click="toggleSort('id')"
              >
                <div class="flex items-center gap-1">
                  Claim ID
                  <Icon :name="getSortIcon('id')" class="w-4 h-4" :class="sortColumn === 'id' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
                @click="toggleSort('patient')"
              >
                <div class="flex items-center gap-1">
                  Patient
                  <Icon :name="getSortIcon('patient')" class="w-4 h-4" :class="sortColumn === 'patient' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
                @click="toggleSort('dateOfService')"
              >
                <div class="flex items-center gap-1">
                  Date of Service
                  <Icon :name="getSortIcon('dateOfService')" class="w-4 h-4" :class="sortColumn === 'dateOfService' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th
                class="text-right px-6 py-3 text-xs font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
                @click="toggleSort('amount')"
              >
                <div class="flex items-center justify-end gap-1">
                  Amount
                  <Icon :name="getSortIcon('amount')" class="w-4 h-4" :class="sortColumn === 'amount' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th
                class="text-center px-6 py-3 text-xs font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
                @click="toggleSort('status')"
              >
                <div class="flex items-center justify-center gap-1">
                  Status
                  <Icon :name="getSortIcon('status')" class="w-4 h-4" :class="sortColumn === 'status' ? 'text-primary-600' : 'text-neutral-400'" />
                </div>
              </th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-neutral-700">Patterns</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-neutral-700">Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
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
                <div class="text-sm text-neutral-900">{{ claim.patientName }}</div>
                <div v-if="claim.memberId" class="text-xs text-neutral-500">ID: {{ claim.memberId }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-neutral-900">{{ formatDate(claim.dateOfService) }}</div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="text-sm font-semibold text-neutral-900">{{ formatCurrency(claim.billedAmount) }}</div>
              </td>
              <td class="px-6 py-4 text-center">
                <UiStatusBadge :status="claim.status" />
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
                    class="inline-flex items-center px-2 py-0.5 text-xs text-neutral-600"
                    :title="`+${getClaimPatterns(claim.id).length - 2} more pattern(s)`"
                  >
                    +{{ getClaimPatterns(claim.id).length - 2 }}
                  </span>
                </div>
                <div v-else class="text-xs text-neutral-400">—</div>
              </td>
              <td class="px-6 py-4">
                <div v-if="claim.denialReason" class="text-sm text-neutral-700">{{ claim.denialReason }}</div>
              </td>
            </tr>
            <tr v-if="filteredClaims.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-neutral-500">
                No claims found matching your criteria
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pattern } from '~/types/enhancements'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const router = useRouter()
const route = useRoute()

// Ensure data is loaded and apply query params
onMounted(async () => {
  if (appStore.claims.length === 0 && !appStore.isLoading) {
    await appStore.initialize()
  }
  if (patternsStore.patterns.length === 0 && !patternsStore.isLoading) {
    await patternsStore.loadPatterns()
  }

  // Apply query params to filters
  if (route.query.status && typeof route.query.status === 'string') {
    filters.status = route.query.status
  }
  if (route.query.dateRange && typeof route.query.dateRange === 'string') {
    filters.dateRange = route.query.dateRange
  }
})

// Composables
const { getPatternCategoryIcon } = usePatterns()

const searchParams = reactive({
  claimId: '',
  patient: '',
  procedureCode: '',
})

const filters = reactive({
  status: 'all',
  dateRange: 'all',
})

// Sorting
const sortColumn = ref<'id' | 'patient' | 'dateOfService' | 'amount' | 'status'>('dateOfService')
const sortDirection = ref<'asc' | 'desc'>('desc')

const toggleSort = (column: typeof sortColumn.value) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = column === 'dateOfService' || column === 'amount' ? 'desc' : 'asc'
  }
}

const getSortIcon = (column: string) => {
  if (sortColumn.value !== column) return 'heroicons:chevron-up-down'
  return sortDirection.value === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'
}

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

  // Apply sorting
  const dir = sortDirection.value === 'asc' ? 1 : -1
  result.sort((a, b) => {
    switch (sortColumn.value) {
      case 'id':
        return dir * a.id.localeCompare(b.id)
      case 'patient':
        return dir * a.patientName.localeCompare(b.patientName)
      case 'dateOfService':
        return dir * (new Date(a.dateOfService).getTime() - new Date(b.dateOfService).getTime())
      case 'amount':
        return dir * (a.billedAmount - b.billedAmount)
      case 'status':
        return dir * a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  return result
})

// Get patterns matching a claim
const getClaimPatterns = (claimId: string): Pattern[] => {
  return patternsStore.getPatternsByClaim(claimId)
}

// Get pattern tier badge class
const getPatternBadgeClass = (tier: string) => {
  const classes = {
    critical: 'bg-error-100 text-error-700 border-error-300 hover:bg-error-200',
    high: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    medium: 'bg-warning-100 text-warning-700 border-warning-300 hover:bg-warning-200',
    low: 'bg-secondary-100 text-secondary-700 border-secondary-300 hover:bg-secondary-200',
  }
  return classes[tier as keyof typeof classes] || 'bg-neutral-100 text-neutral-700 border-neutral-300'
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
