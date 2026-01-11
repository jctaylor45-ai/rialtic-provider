<script setup lang="ts">
/**
 * Breadcrumbs component
 * Displays navigation breadcrumb trail
 */
export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

defineProps<{
  items: BreadcrumbItem[]
  separator?: 'chevron' | 'slash'
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center">
    <ol class="flex items-center gap-1">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center"
      >
        <!-- Separator -->
        <Icon
          v-if="index > 0"
          :name="separator === 'slash' ? 'heroicons:minus' : 'heroicons:chevron-right'"
          class="w-4 h-4 mx-2 text-neutral-400 flex-shrink-0"
          :class="{ 'rotate-[70deg]': separator === 'slash' }"
        />

        <!-- Link or current page -->
        <NuxtLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
        <span
          v-else
          class="flex items-center gap-1.5 text-sm"
          :class="{
            'font-medium text-neutral-900': index === items.length - 1,
            'text-neutral-600': index < items.length - 1,
          }"
        >
          <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>
