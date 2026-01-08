<script setup lang="ts">
/**
 * Page header component
 * Consistent page header with title, breadcrumbs, and actions
 */
import type { BreadcrumbItem } from './Breadcrumbs.vue'

defineProps<{
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
}>()

defineOptions({ name: 'UiPageHeader' })
</script>

<template>
  <div class="space-y-4">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs v-if="breadcrumbs?.length" :items="breadcrumbs" />

    <!-- Header Content -->
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-neutral-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-neutral-600">{{ subtitle }}</p>
      </div>

      <!-- Actions Slot -->
      <div class="flex items-center gap-3">
        <slot name="actions" />
      </div>
    </div>

    <!-- Additional Content Slot -->
    <slot />
  </div>
</template>
