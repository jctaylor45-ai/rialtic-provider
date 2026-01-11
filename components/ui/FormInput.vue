<script setup lang="ts">
/**
 * Form input with validation using VeeValidate
 * Supports text, email, password, number, date, textarea
 */
import { useField } from 'vee-validate'
import type { BaseSchema, BaseIssue } from 'valibot'
import { toFieldValidator } from '~/utils/validation'

const props = withDefaults(defineProps<{
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  schema?: BaseSchema<unknown, unknown, BaseIssue<unknown>>
  hint?: string
  rows?: number
}>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  rows: 3,
})

// Create validator from schema if provided
const rules = computed(() => {
  if (props.schema) {
    return toFieldValidator(props.schema)
  }
  if (props.required) {
    return (value: unknown) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return 'This field is required'
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

// Show error only after field has been touched - use ref pattern for template compatibility
const hasError = computed(() => Boolean(meta.touched && errorMessage.value))

// Input classes based on state
const inputClasses = computed(() => {
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

    <!-- Input -->
    <div class="relative">
      <textarea
        v-if="type === 'textarea'"
        :id="name"
        v-model="value"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :class="inputClasses"
        @blur="handleBlur"
        @change="handleChange"
      />
      <input
        v-else
        :id="name"
        v-model="value"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        @blur="handleBlur"
        @change="handleChange"
      />

      <!-- Error icon -->
      <div v-if="hasError" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Icon name="heroicons:exclamation-circle" class="h-5 w-5 text-error-500" />
      </div>
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
