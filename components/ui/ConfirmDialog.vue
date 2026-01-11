<script setup lang="ts">
/**
 * Confirm dialog component
 * Pre-configured dialog for confirmation actions
 */
const props = withDefaults(defineProps<{
  id: string
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'warning'
  loading?: boolean
}>(), {
  title: 'Confirm',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<{ show: () => void; hide: () => void } | null>(null)

// Button classes based on variant
const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'btn btn-error'
    case 'warning':
      return 'btn btn-warning'
    default:
      return 'btn btn-primary'
  }
})

// Icon based on variant
const icon = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'heroicons:exclamation-triangle'
    case 'warning':
      return 'heroicons:exclamation-circle'
    default:
      return 'heroicons:question-mark-circle'
  }
})

const iconClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'text-error-500'
    case 'warning':
      return 'text-warning-500'
    default:
      return 'text-primary-500'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  dialogRef.value?.hide()
  emit('cancel')
}

// Expose methods
const show = () => dialogRef.value?.show()
const hide = () => dialogRef.value?.hide()

defineExpose({ show, hide })
</script>

<template>
  <UiDialog
    :id="id"
    ref="dialogRef"
    :title="title"
    size="sm"
    :show-close="false"
  >
    <div class="flex gap-4">
      <div class="flex-shrink-0">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="{
            'bg-error-100': variant === 'danger',
            'bg-warning-100': variant === 'warning',
            'bg-primary-100': variant === 'default',
          }"
        >
          <Icon :name="icon" class="w-6 h-6" :class="iconClass" />
        </div>
      </div>
      <div class="flex-1">
        <p class="text-sm text-neutral-700">{{ message }}</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        :class="confirmButtonClass"
        :disabled="loading"
        @click="handleConfirm"
      >
        <Icon
          v-if="loading"
          name="heroicons:arrow-path"
          class="w-4 h-4 animate-spin mr-2"
        />
        {{ confirmText }}
      </button>
    </template>
  </UiDialog>
</template>
