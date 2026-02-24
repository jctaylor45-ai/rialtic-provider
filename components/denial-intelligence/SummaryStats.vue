<template>
  <div class="grid grid-cols-4 gap-6 mb-6">
    <!-- Total Active Issues -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-neutral-600">Active Issues</div>
        <Icon name="heroicons:shield-exclamation" class="w-5 h-5 text-neutral-400" />
      </div>
      <div class="text-3xl font-semibold text-neutral-900">
        {{ stats.totalActive }}
      </div>
      <div class="text-xs text-neutral-500 mt-1">
        AI-detected denial patterns
      </div>
    </div>

    <!-- Pattern Trends -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-neutral-600">Pattern Trends</div>
        <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-neutral-400" />
      </div>
      <div class="flex items-center gap-4 mt-1">
        <div class="flex items-center gap-1">
          <Icon name="heroicons:arrow-trending-down" class="w-4 h-4 text-success-600" />
          <span class="text-lg font-semibold text-success-600">{{ stats.improving }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="heroicons:minus" class="w-4 h-4 text-neutral-500" />
          <span class="text-lg font-semibold text-neutral-600">{{ stats.stable }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="heroicons:arrow-trending-up" class="w-4 h-4 text-error-600" />
          <span class="text-lg font-semibold text-error-600">{{ stats.regressing }}</span>
        </div>
      </div>
      <div class="text-xs text-neutral-500 mt-2">
        Improving / Stable / Regressing
      </div>
    </div>

    <!-- Recoverable Revenue -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-neutral-600">Recoverable Revenue</div>
        <Icon name="heroicons:arrow-path-rounded-square" class="w-5 h-5 text-neutral-400" />
      </div>
      <div class="text-3xl font-semibold text-success-600">
        {{ formatCurrency(stats.totalRecoverableRevenue, true) }}
      </div>
      <div class="text-xs text-neutral-500 mt-1">
        Estimated recoverable amount
      </div>
    </div>

    <!-- Denied Dollars -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-neutral-600">Denied Dollars</div>
        <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-neutral-400" />
      </div>
      <div class="text-3xl font-semibold text-error-600">
        {{ formatCurrency(stats.totalDeniedDollars, true) }}
      </div>
      <div class="text-xs text-neutral-500 mt-1">
        Total at risk across all patterns
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    totalActive: number
    improving: number
    stable: number
    regressing: number
    totalRecoverableRevenue: number
    totalDeniedDollars: number
  }
}>()

const { formatCurrency } = useAnalytics()
</script>
