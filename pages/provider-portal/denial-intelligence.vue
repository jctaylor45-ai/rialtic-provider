<template>
  <div class="flex h-full">
    <!-- Main Content Area -->
    <div
      class="flex-1 overflow-y-auto p-8 transition-all duration-300"
      :class="{ 'mr-[800px]': isDrawerOpen }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Denial Intelligence</h1>
          <p class="text-sm text-neutral-600 mt-1">
            AI-powered analysis of denial patterns, policies, and opportunities for improvement
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UiButton
            variant="outlined"
            @click="handleRefresh"
            :disabled="patternsStore.isLoading"
            :loading="patternsStore.isLoading"
          >
            <Icon v-if="!patternsStore.isLoading" name="heroicons:arrow-path" class="w-4 h-4" />
            Refresh
          </UiButton>
        </div>
      </div>

      <!-- Summary Stats -->
      <DenialIntelligenceSummaryStats :stats="summaryStats" />

      <!-- Filter Bar -->
      <DenialIntelligenceFilterBar
        :search-query="searchQuery"
        :filter-topic="filterTopic"
        :filter-source="filterSource"
        :filter-tier="filterTier"
        :filter-status="filterStatus"
        :filter-recovery-status="filterRecoveryStatus"
        :filter-appeal-rate="filterAppealRate"
        :filter-overturn-rate="filterOverturnRate"
        :show-inactive="showInactive"
        :has-practice-selected="!!appStore.selectedPracticeId"
        :has-active-filters="hasActiveFilters"
        :active-filter-count="activeFilterCount"
        :topics="uniqueTopics"
        :sources="uniqueSources"
        @update:search-query="searchQuery = $event"
        @update:filter-topic="filterTopic = $event"
        @update:filter-source="filterSource = $event"
        @update:filter-tier="filterTier = $event"
        @update:filter-status="filterStatus = $event"
        @update:filter-recovery-status="filterRecoveryStatus = $event"
        @update:filter-appeal-rate="filterAppealRate = $event"
        @update:filter-overturn-rate="filterOverturnRate = $event"
        @update:show-inactive="setShowInactive($event)"
        @clear-filters="handleClearFilters"
      />

      <!-- View Toggle + Results Count -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-neutral-600">
            Showing {{ allFilteredItems.length }}
            <template v-if="showInactive">
              ({{ sortedActiveItems.length }} active, {{ filteredInactiveItems.length }} inactive)
            </template>
            items
          </span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-neutral-600">Sort by:</label>
          <select
            :value="sortState?.column || 'impact'"
            @change="setSortState(($event.target as HTMLSelectElement).value, sortState?.direction || 'desc')"
            class="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="impact">Impact</option>
            <option value="denialRate">Denial Rate</option>
            <option value="frequency">Frequency</option>
            <option value="recent">Recent</option>
          </select>
          <div class="h-6 w-px bg-neutral-300 mx-1" />
          <button
            @click="setViewMode('card')"
            class="p-2 rounded-lg transition-colors"
            :class="viewMode === 'card' ? 'bg-primary-100 text-primary-700' : 'text-neutral-400 hover:text-neutral-600'"
          >
            <Icon name="heroicons:squares-2x2" class="w-5 h-5" />
          </button>
          <button
            @click="setViewMode('table')"
            class="p-2 rounded-lg transition-colors"
            :class="viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-neutral-400 hover:text-neutral-600'"
          >
            <Icon name="heroicons:table-cells" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="patternsStore.isLoading" class="text-center py-12">
        <UiLoading size="lg" class="mx-auto mb-2" />
        <p class="text-sm text-neutral-600">Loading denial intelligence...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="allFilteredItems.length === 0" class="text-center py-12">
        <Icon name="heroicons:magnifying-glass" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <h3 class="text-lg font-medium text-neutral-900 mb-1">No items found</h3>
        <p class="text-sm text-neutral-600 mb-4">Try adjusting your filters or enabling inactive policies</p>
        <UiButton @click="handleClearFilters">Clear Filters</UiButton>
      </div>

      <!-- Card View -->
      <DenialIntelligenceCardView
        v-else-if="viewMode === 'card'"
        :items="allFilteredItems"
        @select="handleSelectItem"
        @view-claims="handleViewClaims"
        @record-action="handleRecordAction"
      />

      <!-- Table View -->
      <DenialIntelligenceTableView
        v-else
        :items="allFilteredItems"
        @select="handleSelectItem"
      />
    </div>

    <!-- Slide-out Drawer -->
    <Transition name="slide">
      <div
        v-if="isDrawerOpen && openDrawerItem"
        class="fixed top-0 right-0 h-full w-[800px] bg-white shadow-2xl border-l border-neutral-200 z-40 flex flex-col"
      >
        <DenialIntelligenceDrawerContent
          :item="openDrawerItem"
          @close="closeDrawer"
          @view-claims="handleViewClaimsFromDrawer"
          @record-action="handleRecordActionFromDrawer"
        />
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isDrawerOpen"
        class="fixed inset-0 bg-black/20 z-30"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Record Action Modal -->
    <RecordActionModal
      :is-open="isRecordActionModalOpen"
      :pattern="selectedPatternForAction"
      @close="closeRecordActionModal"
      @record="handleRecordActionSubmit"
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
import type { DenialIntelligenceItem } from '~/types/denial-intelligence'

const appStore = useAppStore()
const patternsStore = usePatternsStore()
const { trackInsightView } = useTracking()
const { recordAction } = useActions()
const {
  isModalOpen: isCodeIntelModalOpen,
  selectedCode,
  closeCodeIntelligence,
  navigateToCode,
} = useCodeIntelligence()

const {
  allFilteredItems,
  sortedActiveItems,
  filteredInactiveItems,
  summaryStats,
  searchQuery,
  filterTopic,
  filterSource,
  filterTier,
  filterStatus,
  filterRecoveryStatus,
  filterAppealRate,
  filterOverturnRate,
  uniqueTopics,
  uniqueSources,
  hasActiveFilters,
  activeFilterCount,
  handleClearFilters,
  sortState,
  setSortState,
  viewMode,
  setViewMode,
  showInactive,
  setShowInactive,
  openDrawerItem,
  isDrawerOpen,
  openDrawer,
  closeDrawer,
} = useDenialIntelligence()

// Record action modal state
const isRecordActionModalOpen = ref(false)
const selectedPatternForAction = ref<Pattern | null>(null)

// Load data on mount
onMounted(async () => {
  await patternsStore.loadPatterns()
})

// Escape key to close drawer
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDrawerOpen.value) {
      closeDrawer()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})

const handleRefresh = async () => {
  await patternsStore.loadPatterns()
}

const handleSelectItem = (item: DenialIntelligenceItem) => {
  openDrawer(item)
  if (item.type === 'active') {
    trackInsightView(item.pattern.id, item.pattern.category)
  }
}

const handleViewClaims = (item: DenialIntelligenceItem) => {
  if (item.type === 'active') {
    const claimIds = item.pattern.affectedClaims.join(',')
    navigateTo(`/provider-portal/claims?ids=${claimIds}`)
  }
}

const handleViewClaimsFromDrawer = (item: DenialIntelligenceItem) => {
  closeDrawer()
  handleViewClaims(item)
}

const handleRecordAction = (item: DenialIntelligenceItem) => {
  if (item.type === 'active') {
    selectedPatternForAction.value = item.pattern
    isRecordActionModalOpen.value = true
  }
}

const handleRecordActionFromDrawer = (item: DenialIntelligenceItem) => {
  handleRecordAction(item)
}

const closeRecordActionModal = () => {
  isRecordActionModalOpen.value = false
  selectedPatternForAction.value = null
}

const handleRecordActionSubmit = async (actionType: ActionType, notes: string) => {
  if (!selectedPatternForAction.value) return
  await recordAction(selectedPatternForAction.value.id, actionType, notes)
  closeRecordActionModal()
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
