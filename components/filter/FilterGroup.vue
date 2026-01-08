<script setup lang="ts">
/**
 * Filter group component
 * Container for organizing multiple filter controls
 */
defineProps<{
  label?: string
  collapsible?: boolean
}>()

defineOptions({ name: 'FilterGroup' })

const isExpanded = ref(true)
</script>

<template>
  <div class="space-y-3">
    <!-- Group Header -->
    <div
      v-if="label"
      class="flex items-center justify-between"
      :class="{ 'cursor-pointer': collapsible }"
      @click="collapsible && (isExpanded = !isExpanded)"
    >
      <h3 class="text-sm font-semibold text-neutral-700">{{ label }}</h3>
      <button
        v-if="collapsible"
        type="button"
        class="p-1 rounded hover:bg-neutral-100 transition-colors"
      >
        <Icon
          name="heroicons:chevron-down"
          class="w-4 h-4 text-neutral-500 transition-transform"
          :class="{ 'rotate-180': !isExpanded }"
        />
      </button>
    </div>

    <!-- Group Content -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-show="!collapsible || isExpanded" class="flex flex-wrap gap-2">
        <slot />
      </div>
    </Transition>
  </div>
</template>
