<script setup lang="ts">
/**
 * Form select with validation using VeeValidate
 */
import { useField } from 'vee-validate'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  name: string
  label?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  hint?: string
}>(), {
  disabled: false,
  required: false,
})

// Create validator
const rules = computed(() => {
  if (props.required) {
    return (value: unknown) => {
      if (!value || value === '') {
        return 'Please select an option'
      }
      return true
    }
  }
  return undefined
})

// Use VeeValidate field
const { value, errorMessage, handleBlur, handleChange, meta } = useField<string | number>(
  () => props.name,
  rules,
  {
    validateOnValueUpdate: false,
  }
)

// Show error only after field has been touched
const hasError = computed(() => Boolean(meta.touched && errorMessage.value))

// Input classes based on state
const selectClasses = computed(() => {
  const base = 'form-input w-full'
  if (hasError.value) {
    return `${base} form-input-error`
  }
  return base
})

// Hint text to show
const hintText = computed(() => props.hint || '')
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" :for="name" class="block text-sm font-medium text-neutral-700">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>

    <!-- Select -->
    <div class="relative">
      <select
        :id="name"
        v-model="value"
        :name="name"
        :disabled="disabled"
        :class="selectClasses"
        @blur="handleBlur"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Error message -->
    <p v-if="hasError" class="text-sm text-error-600">
      {{ errorMessage }}
    </p>

    <!-- Hint text -->
    <p v-else-if="hintText" class="text-sm text-neutral-500">
      {{ hintText }}
    </p>
  </div>
</template>
