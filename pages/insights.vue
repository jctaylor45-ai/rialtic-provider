<template>
  <div class="flex-1 overflow-y-auto p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Pattern Detection & Insights</h1>
        <p class="text-sm text-gray-600 mt-1">
          AI-powered analysis of denial patterns and opportunities for improvement
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View Mode Toggle -->
        <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            @click="viewMode = 'active'"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="{
              'bg-white text-gray-900 shadow-sm': viewMode === 'active',
              'text-gray-600 hover:text-gray-900': viewMode !== 'active'
            }"
          >
            Active Patterns
          </button>
          <button
            @click="viewMode = 'impact'"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="{
              'bg-white text-gray-900 shadow-sm': viewMode === 'impact',
              'text-gray-600 hover:text-gray-900': viewMode !== 'impact'
            }"
          >
            Impact Report
          </button>
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
    </div>

    <!-- Summary Stats (Active Patterns View) -->
    <div v-if="viewMode === 'active'" class="grid grid-cols-4 gap-6 mb-6">
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

    <!-- Main Content Area (Active Patterns View) -->
    <div v-if="viewMode === 'active'" class="grid grid-cols-12 gap-6">
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

    <!-- Impact Report View -->
    <div v-else>
      <!-- Achievement Summary -->
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-8 mb-6">
        <div class="flex items-start gap-6">
          <div class="p-4 bg-white rounded-full shadow-sm">
            <Icon name="heroicons:trophy" class="w-12 h-12 text-green-600" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-green-900 mb-2">Your Impact & Achievements</h2>
            <p class="text-green-800 mb-4">
              Track your progress in resolving denial patterns and improving claim acceptance rates.
            </p>
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-gray-600 mb-1">Patterns Resolved</div>
                <div class="text-3xl font-bold text-green-600">{{ patternsStore.resolvedPatterns.length }}</div>
                <div class="text-xs text-gray-500 mt-1">Total achievements</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-gray-600 mb-1">Patterns Improving</div>
                <div class="text-3xl font-bold text-yellow-600">{{ patternsStore.improvingPatterns.length }}</div>
                <div class="text-xs text-gray-500 mt-1">In progress</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-gray-600 mb-1">Total Impact</div>
                <div class="text-3xl font-bold text-gray-900">{{ formatCurrency(totalResolvedImpact, true) }}</div>
                <div class="text-xs text-gray-500 mt-1">Savings realized</div>
              </div>
              <div class="bg-white/80 backdrop-blur rounded-lg p-4">
                <div class="text-xs text-gray-600 mb-1">Success Rate</div>
                <div class="text-3xl font-bold text-green-600">{{ successRate }}%</div>
                <div class="text-xs text-gray-500 mt-1">Patterns resolved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resolved Patterns Grid -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Resolved Patterns</h3>
          <span class="text-sm text-gray-600">{{ patternsStore.resolvedPatterns.length }} total</span>
        </div>

        <div v-if="patternsStore.resolvedPatterns.length > 0" class="grid grid-cols-2 gap-4">
          <div
            v-for="pattern in patternsStore.resolvedPatterns"
            :key="pattern.id"
            class="bg-white rounded-lg border border-green-200 p-6 hover:border-green-400 transition-colors cursor-pointer"
            @click="openPatternDetail(pattern)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-100 rounded-lg">
                  <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ pattern.title }}</h4>
                  <p class="text-xs text-gray-600 mt-0.5">{{ pattern.category }}</p>
                </div>
              </div>
              <div class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Icon name="heroicons:check-circle" class="w-3 h-3" />
                Resolved
              </div>
            </div>

            <p class="text-sm text-gray-700 mb-4 line-clamp-2">{{ pattern.description }}</p>

            <!-- Before/After Metrics -->
            <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <div class="text-xs text-gray-600 mb-1">Before</div>
                <div class="text-sm font-semibold text-red-600">{{ pattern.score.frequency }} denials</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(pattern.totalAtRisk) }} at risk</div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">After</div>
                <div class="text-sm font-semibold text-green-600">{{ calculateAfterDenials(pattern) }} denials</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(calculateSavingsRealized(pattern)) }} saved</div>
              </div>
            </div>

            <!-- Improvement Metrics -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600">
                <strong class="text-gray-900">{{ pattern.learningProgress }}%</strong> improvement
              </span>
              <span class="text-gray-600">
                <strong class="text-gray-900">{{ pattern.practiceSessionsCompleted }}</strong> sessions
              </span>
              <span class="text-gray-600">
                <strong class="text-gray-900">{{ pattern.correctionsApplied }}</strong> corrections
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
          <Icon name="heroicons:flag" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 class="text-lg font-medium text-gray-900 mb-1">No Patterns Resolved Yet</h3>
          <p class="text-sm text-gray-600 mb-4">
            Keep working on active patterns to see your achievements here
          </p>
          <button
            @click="viewMode = 'active'"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            View Active Patterns
          </button>
        </div>
      </div>

      <!-- Improving Patterns -->
      <div v-if="patternsStore.improvingPatterns.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Patterns In Progress</h3>
          <span class="text-sm text-gray-600">{{ patternsStore.improvingPatterns.length }} improving</span>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="pattern in patternsStore.improvingPatterns"
            :key="pattern.id"
            class="bg-white rounded-lg border border-yellow-200 p-4 hover:border-yellow-400 transition-colors cursor-pointer"
            @click="openPatternDetail(pattern)"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon :name="getPatternCategoryIcon(pattern.category)" class="w-4 h-4 text-yellow-600" />
              <span class="text-sm font-medium text-gray-900">{{ pattern.title }}</span>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span class="font-medium text-gray-900">{{ pattern.learningProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-yellow-500 h-2 rounded-full transition-all"
                  :style="{ width: `${pattern.learningProgress}%` }"
                />
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-gray-600">
              <span>{{ pattern.improvements.length }} improvements</span>
              <span>{{ pattern.practiceSessionsCompleted }} sessions</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress Timeline -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Your Journey</h3>
        <div v-if="patternsStore.patterns.length > 0" class="space-y-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-24 text-xs text-gray-600 pt-1">All Patterns</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div class="flex h-full">
                    <div
                      class="bg-green-500 h-full"
                      :style="{ width: `${(patternsStore.resolvedPatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.resolvedPatterns.length} resolved`"
                    />
                    <div
                      class="bg-yellow-500 h-full"
                      :style="{ width: `${(patternsStore.improvingPatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.improvingPatterns.length} improving`"
                    />
                    <div
                      class="bg-red-500 h-full"
                      :style="{ width: `${(patternsStore.activePatterns.length / patternsStore.totalPatternsDetected) * 100}%` }"
                      :title="`${patternsStore.activePatterns.length} active`"
                    />
                  </div>
                </div>
                <span class="text-xs font-medium text-gray-900">{{ patternsStore.totalPatternsDetected }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-green-500 rounded"></div>
                  <span class="text-gray-600">{{ patternsStore.resolvedPatterns.length }} Resolved</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span class="text-gray-600">{{ patternsStore.improvingPatterns.length }} Improving</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-red-500 rounded"></div>
                  <span class="text-gray-600">{{ patternsStore.activePatterns.length }} Active</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900 mb-1">{{ patternsStore.avgLearningProgress }}%</div>
              <div class="text-xs text-gray-600">Average Progress</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900 mb-1">{{ formatCurrency(totalSavingsRealized, true) }}</div>
              <div class="text-xs text-gray-600">Total Savings</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900 mb-1">{{ totalPracticeSessions }}</div>
              <div class="text-xs text-gray-600">Practice Sessions</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:chart-bar" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm">No patterns detected yet</p>
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
const { startPracticeSession, getPatternCategoryIcon } = usePatterns()
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
const viewMode = ref<'active' | 'impact'>('active')
const selectedPattern = ref<Pattern | null>(null)
const isModalOpen = ref(false)
const isRecordActionModalOpen = ref(false)
const selectedPatternForAction = ref<Pattern | null>(null)

// Load patterns on mount
onMounted(async () => {
  await patternsStore.loadPatterns()

  // Check if we should auto-open a pattern from session storage
  if (typeof window !== 'undefined') {
    const patternId = sessionStorage.getItem('openPatternId')
    if (patternId) {
      sessionStorage.removeItem('openPatternId')
      const pattern = patternsStore.getPatternById(patternId)
      if (pattern) {
        // Small delay to ensure patterns are loaded
        setTimeout(() => {
          openPatternDetail(pattern)
        }, 100)
      }
    }
  }
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

// Computed properties for Impact Report view
const totalResolvedImpact = computed(() => {
  return patternsStore.resolvedPatterns.reduce((sum, p) => sum + p.totalAtRisk, 0)
})

const successRate = computed(() => {
  const total = patternsStore.totalPatternsDetected
  if (total === 0) return 0
  return Math.round((patternsStore.resolvedPatterns.length / total) * 100)
})

const totalSavingsRealized = computed(() => {
  return patternsStore.resolvedPatterns.reduce((sum, p) => {
    const resolutionRate = p.learningProgress / 100
    return sum + (p.totalAtRisk * resolutionRate)
  }, 0)
})

const totalPracticeSessions = computed(() => {
  return patternsStore.patterns.reduce((sum, p) => sum + p.practiceSessionsCompleted, 0)
})

const calculateAfterDenials = (pattern: Pattern): number => {
  const reduction = pattern.learningProgress / 100
  return Math.round(pattern.score.frequency * (1 - reduction))
}

const calculateSavingsRealized = (pattern: Pattern): number => {
  const resolutionRate = pattern.learningProgress / 100
  return Math.round(pattern.totalAtRisk * resolutionRate)
}

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
