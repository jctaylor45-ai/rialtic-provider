<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 px-4 py-3 mb-6 space-y-2">
    <!-- Row 1: Search (full width) -->
    <div class="relative">
      <Icon name="heroicons:magnifying-glass" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      <input
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search patterns and policies..."
        class="form-input pl-8 py-1.5 text-sm w-full"
      />
    </div>

    <!-- Row 2: All dropdowns in a single non-wrapping horizontal line -->
    <div class="flex items-center gap-2 overflow-x-auto">
      <!-- Topic -->
      <select
        :value="filterTopic"
        @change="$emit('update:filterTopic', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 120px; max-width: 180px;"
      >
        <option value="all">All Topics</option>
        <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
      </select>

      <!-- Source -->
      <select
        :value="filterSource"
        @change="$emit('update:filterSource', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 120px; max-width: 180px;"
      >
        <option value="all">All Sources</option>
        <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
      </select>

      <!-- Tier -->
      <select
        :value="filterTier"
        @change="$emit('update:filterTier', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 100px; max-width: 140px;"
      >
        <option value="all">All Tiers</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <!-- Status -->
      <select
        :value="filterStatus"
        @change="$emit('update:filterStatus', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 110px; max-width: 150px;"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="improving">Improving</option>
        <option value="resolved">Resolved</option>
      </select>

      <!-- Recovery Status -->
      <select
        :value="filterRecoveryStatus"
        @change="$emit('update:filterRecoveryStatus', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 110px; max-width: 160px;"
      >
        <option value="all">All Recovery</option>
        <option value="recoverable">Recoverable</option>
        <option value="partial">Partial</option>
        <option value="not_recoverable">Not Recoverable</option>
      </select>

      <!-- Appeal Rate -->
      <select
        :value="filterAppealRate"
        @change="$emit('update:filterAppealRate', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 120px; max-width: 160px;"
      >
        <option value="all">All Appeal Rates</option>
        <option value="0">0%</option>
        <option value="1-25">1-25%</option>
        <option value="26-50">26-50%</option>
        <option value="51-75">51-75%</option>
        <option value="76-100">76-100%</option>
      </select>

      <!-- Overturn Rate -->
      <select
        :value="filterOverturnRate"
        @change="$emit('update:filterOverturnRate', ($event.target as HTMLSelectElement).value)"
        class="form-input py-1.5 text-sm flex-shrink-0"
        style="min-width: 130px; max-width: 170px;"
      >
        <option value="all">All Overturn Rates</option>
        <option value="0">0%</option>
        <option value="1-25">1-25%</option>
        <option value="26-50">26-50%</option>
        <option value="51-75">51-75%</option>
        <option value="76-100">76-100%</option>
      </select>

      <div class="w-px h-6 bg-neutral-200 flex-shrink-0" />

      <!-- Active issues only toggle -->
      <label
        v-if="!hasPracticeSelected"
        class="flex items-center gap-1.5 text-sm text-neutral-700 cursor-pointer select-none flex-shrink-0 whitespace-nowrap"
      >
        <input
          type="checkbox"
          :checked="!showInactive"
          @change="$emit('update:showInactive', !($event.target as HTMLInputElement).checked)"
          class="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        Active only
      </label>

      <!-- Clear filters -->
      <button
        v-if="hasActiveFilters"
        @click="$emit('clearFilters')"
        class="flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors flex-shrink-0 whitespace-nowrap"
      >
        <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
        Clear
        <span class="bg-neutral-200 text-neutral-700 px-1 py-0.5 rounded text-xs font-medium leading-none">
          {{ activeFilterCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string
  filterTopic: string
  filterSource: string
  filterTier: string
  filterStatus: string
  filterRecoveryStatus: string
  filterAppealRate: string
  filterOverturnRate: string
  showInactive: boolean
  hasPracticeSelected: boolean
  hasActiveFilters: boolean
  activeFilterCount: number
  topics: string[]
  sources: string[]
}>()

defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterTopic': [value: string]
  'update:filterSource': [value: string]
  'update:filterTier': [value: string]
  'update:filterStatus': [value: string]
  'update:filterRecoveryStatus': [value: string]
  'update:filterAppealRate': [value: string]
  'update:filterOverturnRate': [value: string]
  'update:showInactive': [value: boolean]
  clearFilters: []
}>()
</script>
