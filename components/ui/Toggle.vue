<script setup lang="ts">
/**
 * Toggle/Switch component
 * Accessible toggle switch with labels
 */
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

defineOptions({ name: 'UiToggle' })

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

// Size classes
const switchSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-4'
    case 'lg':
      return 'w-14 h-7'
    default:
      return 'w-11 h-6'
  }
})

const knobSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3 h-3'
    case 'lg':
      return 'w-6 h-6'
    default:
      return 'w-5 h-5'
  }
})

const translateClasses = computed(() => {
  if (!props.modelValue) return 'translate-x-0.5'
  switch (props.size) {
    case 'sm':
      return 'translate-x-4'
    case 'lg':
      return 'translate-x-7'
    default:
      return 'translate-x-5'
  }
})
</script>

<template>
  <label
    class="inline-flex items-start gap-3 cursor-pointer"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <!-- Switch -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      :class="[
        switchSizeClasses,
        modelValue ? 'bg-primary-600' : 'bg-neutral-300',
      ]"
      @click="toggle"
    >
      <span
        class="pointer-events-none inline-block rounded-full bg-white shadow transform transition duration-200 ease-in-out"
        :class="[knobSizeClasses, translateClasses]"
        :style="{ marginTop: size === 'sm' ? '2px' : '2px' }"
      />
    </button>

    <!-- Label -->
    <div v-if="label || description" class="flex-1">
      <span v-if="label" class="text-sm font-medium text-neutral-900">
        {{ label }}
      </span>
      <p v-if="description" class="text-sm text-neutral-500">
        {{ description }}
      </p>
    </div>
  </label>
</template>
