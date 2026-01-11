<script setup lang="ts">
/**
 * Date range filter component
 * Combines date picker with preset selections
 */
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { onClickOutside } from '@vueuse/core'
import { useDatePresets, type DatePreset } from '~/composables/useDatePresets'

const props = withDefaults(defineProps<{
  modelValue: [Date | null, Date | null]
  label?: string
  showPresets?: boolean
  minDate?: Date
  maxDate?: Date
}>(), {
  label: 'Date Range',
  showPresets: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: [Date | null, Date | null]]
}>()

const { presets } = useDatePresets()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const activePreset = ref<string | null>(null)

// Close on click outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

// Format date for display
const formatDate = (date: Date | null): string => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Display text for button
const displayText = computed(() => {
  const [start, end] = props.modelValue
  if (!start && !end) return props.label
  if (activePreset.value) {
    const preset = presets.find(p => p.value === activePreset.value)
    if (preset) return preset.label
  }
  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`
  }
  return props.label
})

// Check if filter is active
const isActive = computed(() => {
  return props.modelValue[0] !== null || props.modelValue[1] !== null
})

// Apply preset
const applyPreset = (preset: DatePreset) => {
  activePreset.value = preset.value
  emit('update:modelValue', preset.range)
  isOpen.value = false
}

// Handle date picker change
const handleDateChange = (value: [Date, Date] | null) => {
  activePreset.value = null
  if (value) {
    emit('update:modelValue', value)
  } else {
    emit('update:modelValue', [null, null])
  }
}

// Clear selection
const clearSelection = () => {
  activePreset.value = null
  emit('update:modelValue', [null, null])
}

// Quick presets to show in dropdown
const quickPresets = computed(() => {
  return presets.filter(p =>
    ['last7days', 'last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisQuarter'].includes(p.value)
  )
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors"
      :class="{
        'border-primary-500 bg-primary-50 text-primary-700': isActive,
        'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400': !isActive,
      }"
      @click="isOpen = !isOpen"
    >
      <Icon name="heroicons:calendar" class="w-4 h-4" />
      <span>{{ displayText }}</span>
      <button
        v-if="isActive"
        type="button"
        class="ml-1 p-0.5 rounded-full hover:bg-primary-200 transition-colors"
        @click.stop="clearSelection"
      >
        <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
      </button>
      <Icon
        v-else
        name="heroicons:chevron-down"
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg"
      >
        <div class="flex">
          <!-- Presets Panel -->
          <div v-if="showPresets" class="w-40 border-r border-neutral-200 py-2">
            <div class="px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase">
              Quick Select
            </div>
            <button
              v-for="preset in quickPresets"
              :key="preset.value"
              type="button"
              class="w-full px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors"
              :class="{
                'bg-primary-50 text-primary-700': activePreset === preset.value,
                'text-neutral-700': activePreset !== preset.value,
              }"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>

          <!-- Date Picker -->
          <div class="p-3">
            <VueDatePicker
              :model-value="(modelValue as [Date, Date] | undefined)"
              range
              inline
              auto-apply
              :enable-time-picker="false"
              :min-date="minDate"
              :max-date="maxDate"
              @update:model-value="handleDateChange"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
