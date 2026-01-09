<template>
  <div class="claim-line-column" :class="{ 'has-edits': hasEdits, 'is-new': isNew }">
    <!-- Line Number Header -->
    <div class="cell cell-header">
      <div class="flex items-center justify-between w-full">
        <span>Line {{ lineNumber }}</span>
        <div class="flex items-center gap-1">
          <span v-if="hasEdits" class="w-2 h-2 bg-primary-500 rounded-full" title="Has edits" />
          <button
            v-if="isNew"
            @click="$emit('remove', line.id)"
            class="p-0.5 text-neutral-400 hover:text-error-600 rounded"
            title="Remove line"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Existing Status -->
    <div class="cell">
      <ClaimLabStatusBadge :status="existingStatus" />
    </div>

    <!-- Test Status -->
    <div class="cell">
      <ClaimLabStatusBadge :status="testStatus" :show-untested="true" />
    </div>

    <!-- Editable Fields -->
    <template v-for="field in editableFields" :key="field.key">
      <div class="cell" :class="{ 'cell-editable': field.editable }">
        <!-- Date Input -->
        <input
          v-if="field.type === 'date' && field.editable"
          type="date"
          :value="getFieldValue(field.key)"
          @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          class="cell-input"
        />

        <!-- Text Input -->
        <input
          v-else-if="field.type === 'text' && field.editable"
          type="text"
          :value="getFieldValue(field.key)"
          @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          class="cell-input"
          placeholder="—"
        />

        <!-- Number Input -->
        <input
          v-else-if="field.type === 'number' && field.editable"
          type="number"
          min="1"
          :value="getFieldValue(field.key)"
          @input="updateField(field.key, parseInt(($event.target as HTMLInputElement).value) || 1)"
          class="cell-input"
        />

        <!-- Code Input (procedure, diagnosis, modifier) -->
        <input
          v-else-if="field.type === 'code' && field.editable"
          type="text"
          :value="getFieldValue(field.key)"
          @input="updateField(field.key, ($event.target as HTMLInputElement).value.toUpperCase())"
          class="cell-input font-mono"
          :placeholder="getCodePlaceholder(field.codeType)"
        />

        <!-- Select Input -->
        <select
          v-else-if="field.type === 'select' && field.editable"
          :value="getFieldValue(field.key)"
          @change="updateField(field.key, ($event.target as HTMLSelectElement).value)"
          class="cell-input"
        >
          <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Currency Display -->
        <span v-else-if="field.type === 'currency'" class="text-xs text-neutral-900">
          {{ formatCurrency(getFieldValue(field.key) || 0) }}
        </span>

        <!-- Status Display -->
        <span v-else-if="field.type === 'status'">
          <!-- Handled above -->
        </span>

        <!-- Display Only -->
        <span v-else class="text-xs text-neutral-700 truncate">
          {{ getFieldValue(field.key) || '—' }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface RowField {
  key: string
  label: string
  required: boolean
  editable: boolean
  type: 'display' | 'status' | 'text' | 'number' | 'date' | 'select' | 'code' | 'currency'
  codeType?: 'procedure' | 'diagnosis' | 'modifier'
  options?: { value: string; label: string }[]
}

interface ClaimLabLine {
  id: string
  isNew: boolean
  editedData: Record<string, any>
}

interface TestInsight {
  type: string
  code: string
  reason: string
  severity?: string
}

const props = defineProps<{
  line: ClaimLabLine
  lineNumber: number
  isNew: boolean
  rowFields: RowField[]
  existingStatus: 'approved' | 'denied' | 'pending' | 'new'
  testStatus: 'approved' | 'denied' | 'untested' | 'improved'
  testInsights: TestInsight[]
  hasEdits: boolean
}>()

const emit = defineEmits<{
  'update:field': [lineId: string, fieldKey: string, value: any]
  'remove': [lineId: string]
}>()

const { formatCurrency } = useAnalytics()

// Filter out the first 3 fields (line number, existing status, test status) which are handled separately
const editableFields = computed(() => props.rowFields.slice(3))

function getFieldValue(key: string): any {
  return props.line.editedData[key]
}

function updateField(key: string, value: any) {
  emit('update:field', props.line.id, key, value)
}

function getCodePlaceholder(codeType?: string): string {
  switch (codeType) {
    case 'procedure': return 'CPT'
    case 'diagnosis': return 'ICD-10'
    case 'modifier': return 'Mod'
    default: return '—'
  }
}
</script>

<style scoped>
.claim-line-column {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  border-right: 1px solid theme('colors.neutral.200');
}

.claim-line-column.is-new {
  background-color: theme('colors.primary.50');
}

.claim-line-column.has-edits:not(.is-new) {
  background-color: theme('colors.warning.50');
}

.cell {
  @apply flex items-center px-2 py-1 text-xs border-b border-neutral-200 bg-white;
  height: 36px;
  min-height: 36px;
}

.claim-line-column.is-new .cell {
  @apply bg-primary-50;
}

.claim-line-column.has-edits:not(.is-new) .cell {
  @apply bg-warning-50;
}

.cell-header {
  @apply sticky top-0 z-10 bg-neutral-50 font-medium text-neutral-900;
}

.claim-line-column.is-new .cell-header {
  @apply bg-primary-100;
}

.cell-editable {
  @apply bg-white;
}

.claim-line-column.is-new .cell-editable {
  @apply bg-white;
}

.cell-input {
  @apply w-full h-full px-1 py-0.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded;
}

.cell-input:focus {
  @apply bg-white;
}

select.cell-input {
  @apply cursor-pointer;
}
</style>
