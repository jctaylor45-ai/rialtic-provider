<script setup lang="ts">
/**
 * Rich text editor component using Tiptap
 * Provides WYSIWYG editing with formatting toolbar
 */
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  minHeight?: string
  maxHeight?: string
}>(), {
  modelValue: '',
  placeholder: 'Start writing...',
  disabled: false,
  minHeight: '150px',
  maxHeight: '400px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary-600 underline',
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

// Watch for disabled changes
watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

// Cleanup
onUnmounted(() => {
  editor.value?.destroy()
})

// Toolbar buttons
const toolbarButtons = [
  { action: 'bold', icon: 'heroicons:bold', title: 'Bold', isActive: () => editor.value?.isActive('bold') },
  { action: 'italic', icon: 'heroicons:italic', title: 'Italic', isActive: () => editor.value?.isActive('italic') },
  { action: 'underline', icon: 'heroicons:underline', title: 'Underline', isActive: () => editor.value?.isActive('underline') },
  { action: 'strike', icon: 'heroicons:strikethrough', title: 'Strikethrough', isActive: () => editor.value?.isActive('strike') },
  { action: 'divider' },
  { action: 'bulletList', icon: 'heroicons:list-bullet', title: 'Bullet List', isActive: () => editor.value?.isActive('bulletList') },
  { action: 'orderedList', icon: 'heroicons:numbered-list', title: 'Numbered List', isActive: () => editor.value?.isActive('orderedList') },
  { action: 'divider' },
  { action: 'blockquote', icon: 'heroicons:chat-bubble-bottom-center-text', title: 'Quote', isActive: () => editor.value?.isActive('blockquote') },
  { action: 'codeBlock', icon: 'heroicons:code-bracket', title: 'Code Block', isActive: () => editor.value?.isActive('codeBlock') },
  { action: 'divider' },
  { action: 'undo', icon: 'heroicons:arrow-uturn-left', title: 'Undo' },
  { action: 'redo', icon: 'heroicons:arrow-uturn-right', title: 'Redo' },
]

const handleAction = (action: string) => {
  if (!editor.value) return

  switch (action) {
    case 'bold':
      editor.value.chain().focus().toggleBold().run()
      break
    case 'italic':
      editor.value.chain().focus().toggleItalic().run()
      break
    case 'underline':
      editor.value.chain().focus().toggleUnderline().run()
      break
    case 'strike':
      editor.value.chain().focus().toggleStrike().run()
      break
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run()
      break
    case 'blockquote':
      editor.value.chain().focus().toggleBlockquote().run()
      break
    case 'codeBlock':
      editor.value.chain().focus().toggleCodeBlock().run()
      break
    case 'undo':
      editor.value.chain().focus().undo().run()
      break
    case 'redo':
      editor.value.chain().focus().redo().run()
      break
  }
}
</script>

<template>
  <div class="border border-neutral-300 rounded-lg overflow-hidden" :class="{ 'opacity-50': disabled }">
    <!-- Toolbar -->
    <div class="flex items-center gap-0.5 p-2 border-b border-neutral-200 bg-neutral-50">
      <template v-for="button in toolbarButtons" :key="button.action">
        <div v-if="button.action === 'divider'" class="w-px h-5 mx-1 bg-neutral-300" />
        <button
          v-else
          type="button"
          class="p-1.5 rounded transition-colors"
          :class="{
            'bg-primary-100 text-primary-700': button.isActive?.(),
            'text-neutral-600 hover:bg-neutral-200': !button.isActive?.(),
          }"
          :title="button.title"
          :disabled="disabled"
          @click="handleAction(button.action)"
        >
          <Icon :name="button.icon!" class="w-4 h-4" />
        </button>
      </template>
    </div>

    <!-- Editor -->
    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-4 overflow-y-auto focus:outline-none"
      :style="{ minHeight, maxHeight }"
    />
  </div>
</template>

<style>
/* Tiptap editor styles */
.ProseMirror {
  outline: none;
  min-height: inherit;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9BAAC4;
  pointer-events: none;
  height: 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
}

.ProseMirror blockquote {
  border-left: 3px solid #DCE1EA;
  padding-left: 1em;
  margin-left: 0;
  color: #707683;
}

.ProseMirror pre {
  background: #293446;
  color: #F5F6F8;
  padding: 0.75em 1em;
  border-radius: 0.5em;
  font-family: monospace;
}

.ProseMirror code {
  background: #F5F6F8;
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-family: monospace;
}

.ProseMirror pre code {
  background: none;
  padding: 0;
}
</style>
