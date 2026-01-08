<script setup lang="ts">
/**
 * Details Drawer component
 * Slide-out panel for displaying detail views
 * Aligned with console-ui pattern
 */
import { onKeyStroke } from '@vueuse/core'

const props = withDefaults(defineProps<{
  isOpen: boolean
  isLoading?: boolean
  hasFirstDataLoaded?: boolean
  width?: string
  showOverlay?: boolean
}>(), {
  isLoading: false,
  hasFirstDataLoaded: true,
  width: '768px',
  showOverlay: true,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

defineOptions({ name: 'AppDetailsDrawer' })

// Close on escape key
onKeyStroke('Escape', () => {
  if (props.isOpen) {
    emit('close')
  }
})

// Show skeleton when loading and no data yet
const isSkeletonActive = computed(() => {
  return props.isLoading && !props.hasFirstDataLoaded
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && showOverlay"
        class="fixed inset-0 z-40 bg-black/30"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="fixed top-0 right-0 bottom-0 z-50 flex h-screen w-full flex-col border-l border-neutral-200 bg-white shadow-xl transform-gpu md:w-auto"
        :style="{ maxWidth: width }"
        aria-label="details-drawer"
        data-component="details_drawer"
      >
        <!-- Loading skeleton -->
        <TransitionFade mode="out-in">
          <div v-if="isSkeletonActive" class="animate-pulse p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="h-8 bg-neutral-200 rounded w-48" />
              <div class="h-8 w-8 bg-neutral-200 rounded" />
            </div>
            <div class="space-y-4">
              <div class="h-4 bg-neutral-200 rounded w-full" />
              <div class="h-4 bg-neutral-200 rounded w-3/4" />
              <div class="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
            <div class="mt-8 space-y-4">
              <div class="h-32 bg-neutral-200 rounded" />
              <div class="h-32 bg-neutral-200 rounded" />
            </div>
          </div>

          <div v-else class="flex flex-col h-full overflow-hidden">
            <!-- Header slot -->
            <slot name="header" />

            <!-- Main content -->
            <div class="flex-1 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer slot -->
            <div v-if="$slots.footer" class="border-t border-neutral-200">
              <slot name="footer" />
            </div>
          </div>
        </TransitionFade>
      </aside>
    </Transition>
  </Teleport>
</template>
