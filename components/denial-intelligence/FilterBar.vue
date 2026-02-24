<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
    <!-- Search -->
    <input
      :value="searchQuery"
      @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="Search issues and policies..."
      class="form-input w-full mb-4"
    />

    <!-- Filter Row -->
    <div class="flex items-center gap-3 flex-wrap">
      <!-- Topic -->
      <select
        :value="filterTopic"
        @change="$emit('update:filterTopic', ($event.target as HTMLSelectElement).value)"
        class="form-input text-sm"
      >
        <option value="all">All Topics</option>
        <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
      </select>

      <!-- Source -->
      <select
        :value="filterSource"
        @change="$emit('update:filterSource', ($event.target as HTMLSelectElement).value)"
        class="form-input text-sm"
      >
        <option value="all">All Sources</option>
        <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
      </select>

      <!-- Tier -->
      <select
        :value="filterTier"
        @change="$emit('update:filterTier', ($event.target as HTMLSelectElement).value)"
        class="form-input text-sm"
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
        class="form-input text-sm"
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
        class="form-input text-sm"
      >
        <option value="all">All Recovery</option>
        <option value="recoverable">Recoverable</option>
        <option value="partial">Partial</option>
        <option value="not_recoverable">Not Recoverable</option>
      </select>

      <div class="flex-1" />

      <!-- Active issues only toggle (hidden when practice is selected) -->
      <label
        v-if="!hasPracticeSelected"
        class="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none"
      >
        <input
          type="checkbox"
          :checked="!showInactive"
          @change="$emit('update:showInactive', !($event.target as HTMLInputElement).checked)"
          class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        Active issues only
      </label>

      <!-- Clear filters -->
      <button
        v-if="hasActiveFilters"
        @click="$emit('clearFilters')"
        class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
        Clear
        <span class="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded text-xs font-medium">
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
  'update:showInactive': [value: boolean]
  clearFilters: []
}>()
</script>
