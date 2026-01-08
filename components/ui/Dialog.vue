<script setup lang="ts">
/**
 * Accessible dialog component using a11y-dialog
 * Provides modal dialogs with proper ARIA attributes and focus management
 */
import A11yDialog from 'a11y-dialog'

const props = withDefaults(defineProps<{
  id: string
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  showClose?: boolean
}>(), {
  size: 'md',
  closeOnBackdrop: true,
  showClose: true,
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
}>()

defineOptions({ name: 'UiDialog' })

const dialogRef = ref<HTMLElement | null>(null)
const dialogInstance = ref<A11yDialog | null>(null)
const isOpen = ref(false)

// Size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm'
    case 'md':
      return 'max-w-md'
    case 'lg':
      return 'max-w-lg'
    case 'xl':
      return 'max-w-xl'
    case 'full':
      return 'max-w-4xl'
    default:
      return 'max-w-md'
  }
})

// Initialize dialog
onMounted(() => {
  if (dialogRef.value) {
    dialogInstance.value = new A11yDialog(dialogRef.value)

    dialogInstance.value.on('show', () => {
      isOpen.value = true
      emit('open')
    })

    dialogInstance.value.on('hide', () => {
      isOpen.value = false
      emit('close')
    })
  }
})

// Cleanup
onUnmounted(() => {
  dialogInstance.value?.destroy()
})

// Expose methods
const show = () => dialogInstance.value?.show()
const hide = () => dialogInstance.value?.hide()

defineExpose({ show, hide, isOpen })
</script>

<template>
  <div
    :id="id"
    ref="dialogRef"
    class="dialog-container"
    aria-hidden="true"
  >
    <!-- Backdrop -->
    <div
      class="dialog-overlay fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-200"
      :data-a11y-dialog-hide="closeOnBackdrop"
    />

    <!-- Dialog Content -->
    <div
      class="dialog-content fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 scale-95 transition-all duration-200"
      role="document"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full"
        :class="sizeClasses"
      >
        <!-- Header -->
        <div class="flex items-start justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 :id="`${id}-title`" class="text-lg font-semibold text-neutral-900">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="mt-1 text-sm text-neutral-600">
              {{ subtitle }}
            </p>
          </div>
          <button
            v-if="showClose"
            type="button"
            class="p-2 -m-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            data-a11y-dialog-hide
            aria-label="Close dialog"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.dialog-container[aria-hidden='true'] {
  display: none;
}

.dialog-container:not([aria-hidden='true']) .dialog-overlay {
  opacity: 1;
}

.dialog-container:not([aria-hidden='true']) .dialog-content {
  opacity: 1;
  transform: scale(1);
}
</style>
