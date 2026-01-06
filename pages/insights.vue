<template>
  <div class="flex-1 overflow-hidden p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Pattern Detection & Insights</h1>
        <p class="text-sm text-gray-600 mt-1">
          AI-powered analysis of denial patterns and opportunities for improvement
        </p>
      </div>

      <button
        @click="refreshPatterns"
        :disabled="patternsStore.isLoading"
        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Icon
          name="heroicons:arrow-path"
          class="w-4 h-4"
          :class="{ 'animate-spin': patternsStore.isLoading }"
        />
        <span class="text-sm font-medium">Refresh</span>
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Total Patterns</div>
          <Icon name="heroicons:chart-bar" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-gray-900">
          {{ patternsStore.totalPatternsDetected }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ patternsStore.activePatterns.length }} active,
          {{ patternsStore.improvingPatterns.length }} improving
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Total at Risk</div>
          <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-red-600">
          {{ formatCurrency(patternsStore.totalAtRisk, true) }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Potential savings identified
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Critical Patterns</div>
          <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-orange-600">
          {{ patternsStore.criticalPatterns.length }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Require immediate attention
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Avg Progress</div>
          <Icon name="heroicons:academic-cap" class="w-5 h-5 text-gray-400" />
        </div>
        <div class="text-3xl font-semibold text-green-600">
          {{ patternsStore.avgLearningProgress }}%
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Overall learning progress
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Sidebar Filters -->
      <div class="col-span-3">
        <PatternFilters
          :filters="patternsStore.filters"
          :patterns="patternsStore.patterns"
          @update:filters="patternsStore.updateFilters"
        />
      </div>

      <!-- Patterns Grid -->
      <div class="col-span-9">
        <!-- Sort & View Options -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">
              Showing {{ patternsStore.filteredPatterns.length }} of {{ patternsStore.totalPatternsDetected }} patterns
            </span>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Sort by:</label>
            <select
              v-model="sortBy"
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="impact">Impact</option>
              <option value="frequency">Frequency</option>
              <option value="progress">Learning Progress</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>

        <!-- Patterns Display -->
        <div v-if="patternsStore.isLoading" class="text-center py-12">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p class="text-sm text-gray-600">Loading patterns...</p>
        </div>

        <div v-else-if="sortedPatterns.length === 0" class="text-center py-12">
          <Icon name="heroicons:magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 class="text-lg font-medium text-gray-900 mb-1">No patterns found</h3>
          <p class="text-sm text-gray-600 mb-4">Try adjusting your filters</p>
          <button
            @click="patternsStore.clearFilters()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>

        <div v-else class="space-y-4">
          <PatternCard
            v-for="pattern in sortedPatterns"
            :key="pattern.id"
            :pattern="pattern"
            @click="openPatternDetail(pattern)"
            @practice="startPractice(pattern)"
            @view-claims="viewClaims(pattern)"
            @view-details="openPatternDetail(pattern)"
            @record-action="openRecordActionModal(pattern)"
          />
        </div>

        <!-- Recently Improved Banner -->
        <div
          v-if="patternsStore.recentlyImprovedPatterns.length > 0 && !patternsStore.filters.search"
          class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-start gap-3">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-green-900 mb-1">Recent Improvements</h3>
              <p class="text-xs text-green-700 mb-2">
                {{ patternsStore.recentlyImprovedPatterns.length }} pattern(s) have shown improvement in the last 30 days
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="pattern in patternsStore.recentlyImprovedPatterns.slice(0, 3)"
                  :key="pattern.id"
                  @click="openPatternDetail(pattern)"
                  class="px-3 py-1 bg-white border border-green-300 rounded-lg text-xs font-medium text-green-800 hover:bg-green-50 transition-colors"
                >
                  {{ pattern.title }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pattern Detail Modal -->
    <PatternDetailModal
      :pattern="selectedPattern"
      :is-open="isModalOpen"
      @close="closeModal"
      @practice="startPractice"
      @view-claims="viewClaims"
    />

    <!-- Record Action Modal -->
    <RecordActionModal
      :is-open="isRecordActionModalOpen"
      :pattern="selectedPatternForAction"
      @close="closeRecordActionModal"
      @record="handleRecordAction"
    />

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
import type { Pattern, ActionType } from '~/types/enhancements'

// Stores
const patternsStore = usePatternsStore()

// Composables
const { formatCurrency } = useAnalytics()
const { startPracticeSession } = usePatterns()
const { trackInsightView } = useTracking()
const { recordAction } = useActions()
const {
  isModalOpen: isCodeIntelModalOpen,
  selectedCode,
  closeCodeIntelligence,
  navigateToCode,
} = useCodeIntelligence()

// State
const sortBy = ref<'impact' | 'frequency' | 'progress' | 'recent'>('impact')
const selectedPattern = ref<Pattern | null>(null)
const isModalOpen = ref(false)
const isRecordActionModalOpen = ref(false)
const selectedPatternForAction = ref<Pattern | null>(null)

// Load patterns on mount
onMounted(async () => {
  await patternsStore.loadPatterns()
})

// Sorted patterns based on selection
const sortedPatterns = computed(() => {
  const patterns = [...patternsStore.filteredPatterns]

  switch (sortBy.value) {
    case 'impact':
      return patterns.sort((a, b) => b.score.impact - a.score.impact)
    case 'frequency':
      return patterns.sort((a, b) => b.score.frequency - a.score.frequency)
    case 'progress':
      return patterns.sort((a, b) => a.learningProgress - b.learningProgress) // Lowest first
    case 'recent':
      return patterns.sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
    default:
      return patterns
  }
})

// Methods
const openPatternDetail = (pattern: Pattern) => {
  selectedPattern.value = pattern
  isModalOpen.value = true

  // Track insight view
  trackInsightView(pattern.id, pattern.category)
}

const closeModal = () => {
  isModalOpen.value = false
  selectedPattern.value = null
}

const startPractice = async (pattern: Pattern) => {
  closeModal()
  await startPracticeSession(pattern)
}

const viewClaims = (pattern: Pattern) => {
  closeModal()

  // Navigate to claims page with filter for this pattern's affected claims
  const claimIds = pattern.affectedClaims.join(',')
  navigateTo(`/claims?ids=${claimIds}`)
}

const refreshPatterns = async () => {
  await patternsStore.loadPatterns()
}

const openRecordActionModal = (pattern: Pattern) => {
  selectedPatternForAction.value = pattern
  isRecordActionModalOpen.value = true
}

const closeRecordActionModal = () => {
  isRecordActionModalOpen.value = false
  selectedPatternForAction.value = null
}

const handleRecordAction = async (actionType: ActionType, notes: string) => {
  if (!selectedPatternForAction.value) return

  // Record the action
  await recordAction(selectedPatternForAction.value.id, actionType, notes)

  // Close the modal
  closeRecordActionModal()
}
</script>
