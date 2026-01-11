<script setup lang="ts">
/**
 * Date picker component using @vuepic/vue-datepicker
 * Styled to match Rialtic theme
 */
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const props = withDefaults(defineProps<{
  modelValue?: Date | string | null
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  range?: boolean
  multiCalendars?: boolean
  enableTimePicker?: boolean
  monthPicker?: boolean
  yearPicker?: boolean
  weekPicker?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  format?: string
  previewFormat?: string
  clearable?: boolean
}>(), {
  disabled: false,
  required: false,
  range: false,
  multiCalendars: false,
  enableTimePicker: false,
  monthPicker: false,
  yearPicker: false,
  weekPicker: false,
  clearable: true,
  format: 'MM/dd/yyyy',
  previewFormat: 'MMMM dd, yyyy',
})

const emit = defineEmits<{
  'update:modelValue': [value: Date | string | null]
}>()

const internalValue = computed({
  get: () => props.modelValue ?? null,
  set: (value) => emit('update:modelValue', value),
})

const hintText = computed(() => props.hint || '')
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-neutral-700">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>

    <!-- Date Picker -->
    <VueDatePicker
      v-model="internalValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :range="range"
      :multi-calendars="multiCalendars"
      :enable-time-picker="enableTimePicker"
      :month-picker="monthPicker"
      :year-picker="yearPicker"
      :week-picker="weekPicker"
      :min-date="minDate"
      :max-date="maxDate"
      :format="format"
      :preview-format="previewFormat"
      :clearable="clearable"
      auto-apply
      :teleport="true"
      input-class-name="dp-custom-input"
      menu-class-name="dp-custom-menu"
    >
      <template #input-icon>
        <Icon name="heroicons:calendar" class="w-5 h-5 text-neutral-400" />
      </template>
      <template #clear-icon>
        <Icon name="heroicons:x-mark" class="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
      </template>
    </VueDatePicker>

    <!-- Hint text -->
    <p v-if="hintText" class="text-sm text-neutral-500">
      {{ hintText }}
    </p>
  </div>
</template>

<style>
/* Custom styling to match Rialtic theme */
.dp-custom-input {
  @apply w-full px-4 py-2 border border-neutral-300 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply text-sm text-neutral-900 placeholder-neutral-400;
  @apply disabled:bg-neutral-100 disabled:cursor-not-allowed;
}

.dp-custom-menu {
  @apply border border-neutral-200 shadow-lg rounded-lg;
}

/* Override default datepicker colors */
:root {
  --dp-primary-color: #3F52BC;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #E8EAF7;
  --dp-border-color: #DCE1EA;
  --dp-menu-border-color: #DCE1EA;
  --dp-border-color-hover: #3F52BC;
  --dp-disabled-color: #B4BFD2;
  --dp-scroll-bar-background: #F5F6F8;
  --dp-scroll-bar-color: #9BAAC4;
  --dp-success-color: #00A788;
  --dp-success-color-disabled: #D1ECE6;
  --dp-icon-color: #9BAAC4;
  --dp-danger-color: #E45D7B;
  --dp-highlight-color: rgba(63, 82, 188, 0.1);
  --dp-font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dp__theme_light {
  --dp-background-color: #ffffff;
  --dp-text-color: #293446;
  --dp-hover-color: #F5F6F8;
  --dp-hover-text-color: #293446;
  --dp-hover-icon-color: #707683;
  --dp-primary-color: #3F52BC;
  --dp-primary-disabled-color: #C6CAEB;
  --dp-secondary-color: #E8EAF7;
  --dp-border-color: #DCE1EA;
  --dp-menu-border-color: #DCE1EA;
  --dp-border-color-hover: #3F52BC;
  --dp-disabled-color: #EBEFF2;
  --dp-disabled-color-text: #B4BFD2;
  --dp-icon-color: #9BAAC4;
  --dp-highlight-color: rgba(63, 82, 188, 0.1);
}
</style>
