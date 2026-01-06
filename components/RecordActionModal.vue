<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="flex items-center justify-center min-h-screen px-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
        <!-- Header -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Record Action Taken</h2>
          <p class="text-sm text-gray-600 mt-1">
            Track what you've done to address this pattern
          </p>
        </div>

        <!-- Pattern Info -->
        <div v-if="pattern" class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="text-sm font-medium text-gray-900">{{ pattern.title }}</div>
          <div class="text-xs text-gray-600 mt-1">{{ pattern.affectedClaims.length }} affected claims</div>
        </div>

        <!-- Action Type Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            What did you do to address this pattern?
          </label>
          <select
            v-model="selectedActionType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select an action...</option>
            <option value="resubmission">Updated claims in RCM for resubmission</option>
            <option value="workflow-update">Created/updated SOP or workflow</option>
            <option value="staff-training">Conducted staff training or meeting</option>
            <option value="system-config">Updated system configuration</option>
            <option value="practice-change">Changed clinical/billing practice</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Notes -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Add any additional details about the action you took..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            This creates a marker you can measure progress against.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <button
            @click="$emit('close')"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            @click="handleRecordAction"
            :disabled="!selectedActionType"
            class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record Action
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pattern, ActionType } from '~/types/enhancements'

const props = defineProps<{
  isOpen: boolean
  pattern: Pattern | null
}>()

const emit = defineEmits<{
  close: []
  record: [actionType: ActionType, notes: string]
}>()

// State
const selectedActionType = ref<ActionType | ''>('')
const notes = ref('')

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedActionType.value = ''
    notes.value = ''
  }
})

// Handle record action
const handleRecordAction = () => {
  if (!selectedActionType.value) return

  emit('record', selectedActionType.value as ActionType, notes.value)
  emit('close')
}
</script>
