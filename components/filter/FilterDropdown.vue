<script setup lang="ts">
/**
 * Filter dropdown component
 * Dropdown with checkbox/radio options for filtering
 */
import { onClickOutside } from '@vueuse/core'

export interface FilterOption {
  value: string | number
  label: string
  count?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: (string | number)[]
  options: FilterOption[]
  label: string
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  showCounts?: boolean
  maxHeight?: string
}>(), {
  multiple: true,
  searchable: false,
  showCounts: false,
  maxHeight: '300px',
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

// Close on click outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

// Selected count for badge
const selectedCount = computed(() => props.modelValue.length)

// Check if option is selected
const isSelected = (value: string | number) => {
  return props.modelValue.includes(value)
}

// Toggle option selection
const toggleOption = (value: string | number) => {
  if (props.multiple) {
    const newValue = isSelected(value)
      ? props.modelValue.filter(v => v !== value)
      : [...props.modelValue, value]
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', [value])
    isOpen.value = false
  }
}

// Clear all selections
const clearAll = () => {
  emit('update:modelValue', [])
}

// Select all options
const selectAll = () => {
  const allValues = props.options
    .filter(opt => !opt.disabled)
    .map(opt => opt.value)
  emit('update:modelValue', allValues)
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors"
      :class="{
        'border-primary-500 bg-primary-50 text-primary-700': selectedCount > 0,
        'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400': selectedCount === 0,
      }"
      @click="isOpen = !isOpen"
    >
      <span>{{ label }}</span>
      <span
        v-if="selectedCount > 0"
        class="px-1.5 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full"
      >
        {{ selectedCount }}
      </span>
      <Icon
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
        class="absolute z-50 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg"
      >
        <!-- Search -->
        <div v-if="searchable" class="p-2 border-b border-neutral-200">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="placeholder || 'Search...'"
            class="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Actions -->
        <div v-if="multiple" class="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
          <button
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700 font-medium"
            @click="selectAll"
          >
            Select all
          </button>
          <button
            type="button"
            class="text-xs text-neutral-600 hover:text-neutral-700 font-medium"
            @click="clearAll"
          >
            Clear
          </button>
        </div>

        <!-- Options List -->
        <div class="overflow-y-auto" :style="{ maxHeight }">
          <div
            v-for="option in filteredOptions"
            :key="option.value"
            class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': option.disabled }"
            @click="!option.disabled && toggleOption(option.value)"
          >
            <!-- Checkbox/Radio -->
            <div
              class="w-4 h-4 border rounded flex items-center justify-center flex-shrink-0"
              :class="{
                'border-primary-600 bg-primary-600': isSelected(option.value),
                'border-neutral-300': !isSelected(option.value),
                'rounded-full': !multiple,
              }"
            >
              <Icon
                v-if="isSelected(option.value)"
                name="heroicons:check"
                class="w-3 h-3 text-white"
              />
            </div>

            <!-- Label -->
            <span class="flex-1 text-sm text-neutral-900">{{ option.label }}</span>

            <!-- Count -->
            <span v-if="showCounts && option.count !== undefined" class="text-xs text-neutral-500">
              {{ option.count }}
            </span>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredOptions.length === 0"
            class="px-3 py-4 text-sm text-neutral-500 text-center"
          >
            No options found
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
