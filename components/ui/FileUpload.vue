<script setup lang="ts">
/**
 * File upload component
 * Supports drag-and-drop with validation
 */
const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
}>(), {
  accept: '*',
  multiple: false,
  maxSize: 10,
  maxFiles: 10,
  disabled: false,
})

const emit = defineEmits<{
  upload: [files: File[]]
  error: [message: string]
}>()

const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const maxSizeBytes = computed(() => props.maxSize * 1024 * 1024)

const acceptedTypes = computed(() => {
  if (props.accept === '*') return []
  return props.accept.split(',').map(t => t.trim())
})

const validateFile = (file: File): string | null => {
  // Check size
  if (file.size > maxSizeBytes.value) {
    return `File "${file.name}" exceeds maximum size of ${props.maxSize}MB`
  }

  // Check type
  if (acceptedTypes.value.length > 0) {
    const fileType = file.type
    const fileExt = `.${file.name.split('.').pop()}`
    const isValid = acceptedTypes.value.some(type => {
      if (type.startsWith('.')) {
        return fileExt.toLowerCase() === type.toLowerCase()
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1))
      }
      return fileType === type
    })
    if (!isValid) {
      return `File "${file.name}" is not an accepted file type`
    }
  }

  return null
}

const handleFiles = (fileList: FileList | null) => {
  if (!fileList || fileList.length === 0) return

  const files = Array.from(fileList)

  // Check max files
  if (!props.multiple && files.length > 1) {
    emit('error', 'Only one file can be uploaded at a time')
    return
  }

  if (files.length > props.maxFiles) {
    emit('error', `Maximum ${props.maxFiles} files can be uploaded at once`)
    return
  }

  // Validate each file
  const validFiles: File[] = []
  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      emit('error', error)
      return
    }
    validFiles.push(file)
  }

  emit('upload', validFiles)

  // Reset input
  if (inputRef.value) {
    inputRef.value.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (props.disabled) return
  handleFiles(event.dataTransfer?.files ?? null)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleClick = () => {
  if (!props.disabled) {
    inputRef.value?.click()
  }
}

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  handleFiles(target.files)
}

// Format accepted types for display
const acceptedTypesDisplay = computed(() => {
  if (props.accept === '*') return 'All files'
  return acceptedTypes.value
    .map(t => t.startsWith('.') ? t.toUpperCase() : t)
    .join(', ')
})
</script>

<template>
  <div
    class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
    :class="{
      'border-primary-500 bg-primary-50': isDragging,
      'border-neutral-300 hover:border-neutral-400': !isDragging && !disabled,
      'border-neutral-200 bg-neutral-50 cursor-not-allowed': disabled,
    }"
    @drop.prevent="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @click="handleClick"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleInputChange"
    />

    <div class="space-y-2">
      <div
        class="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
        :class="{
          'bg-primary-100 text-primary-600': isDragging,
          'bg-neutral-100 text-neutral-400': !isDragging,
        }"
      >
        <Icon name="heroicons:cloud-arrow-up" class="w-6 h-6" />
      </div>

      <div>
        <p class="text-sm font-medium text-neutral-700">
          <span v-if="isDragging">Drop files here</span>
          <span v-else>
            Drag and drop files or
            <span class="text-primary-600">browse</span>
          </span>
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          {{ acceptedTypesDisplay }} • Max {{ maxSize }}MB
          <span v-if="multiple"> • Up to {{ maxFiles }} files</span>
        </p>
      </div>
    </div>
  </div>
</template>
