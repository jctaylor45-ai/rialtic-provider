<script setup lang="ts">
/**
 * File preview component
 * Displays uploaded file with preview and actions
 */
export interface FilePreviewItem {
  id: string
  name: string
  size: number
  type: string
  url?: string
  progress?: number
  error?: string
}

const props = defineProps<{
  file: FilePreviewItem
  removable?: boolean
  showProgress?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Get icon based on file type
const fileIcon = computed(() => {
  const type = props.file.type
  if (type.startsWith('image/')) return 'heroicons:photo'
  if (type.startsWith('video/')) return 'heroicons:video-camera'
  if (type.startsWith('audio/')) return 'heroicons:musical-note'
  if (type === 'application/pdf') return 'heroicons:document'
  if (type.includes('spreadsheet') || type.includes('excel')) return 'heroicons:table-cells'
  if (type.includes('document') || type.includes('word')) return 'heroicons:document-text'
  return 'heroicons:paper-clip'
})

// Check if image preview is available
const isImage = computed(() => props.file.type.startsWith('image/') && props.file.url)

// Status
const isUploading = computed(() => props.file.progress !== undefined && props.file.progress < 100)
const hasError = computed(() => Boolean(props.file.error))
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 rounded-lg border"
    :class="{
      'border-error-200 bg-error-50': hasError,
      'border-neutral-200 bg-white': !hasError,
    }"
  >
    <!-- Preview/Icon -->
    <div class="flex-shrink-0">
      <img
        v-if="isImage"
        :src="file.url"
        :alt="file.name"
        class="w-10 h-10 rounded object-cover"
      />
      <div
        v-else
        class="w-10 h-10 rounded flex items-center justify-center"
        :class="{
          'bg-error-100 text-error-600': hasError,
          'bg-neutral-100 text-neutral-500': !hasError,
        }"
      >
        <Icon :name="fileIcon" class="w-5 h-5" />
      </div>
    </div>

    <!-- File Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-neutral-900 truncate">
        {{ file.name }}
      </p>
      <p class="text-xs text-neutral-500">
        {{ formatSize(file.size) }}
      </p>

      <!-- Progress Bar -->
      <div v-if="showProgress && isUploading" class="mt-1.5">
        <div class="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-600 transition-all duration-300"
            :style="{ width: `${file.progress}%` }"
          />
        </div>
      </div>

      <!-- Error Message -->
      <p v-if="hasError" class="mt-1 text-xs text-error-600">
        {{ file.error }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex-shrink-0 flex items-center gap-2">
      <!-- Upload Progress -->
      <span v-if="isUploading" class="text-xs text-neutral-500">
        {{ file.progress }}%
      </span>

      <!-- Success Check -->
      <Icon
        v-else-if="!hasError && file.progress === 100"
        name="heroicons:check-circle"
        class="w-5 h-5 text-success-500"
      />

      <!-- Remove Button -->
      <button
        v-if="removable"
        type="button"
        class="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
        @click="emit('remove', file.id)"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
