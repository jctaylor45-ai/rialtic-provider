<script setup lang="ts">
/**
 * Button component aligned with console-ui @rialtic/ui
 * Supports variants: filled (default), outlined, text
 * Supports sizes: default, sm, xs
 * Supports loading state with spinner
 */
withDefaults(
  defineProps<{
    disabled?: boolean
    loading?: boolean
    size?: 'sm' | 'xs'
    type?: 'button' | 'submit' | 'reset'
    variant?: 'filled' | 'outlined' | 'text'
    loadingPosition?: 'left' | 'center'
  }>(),
  {
    variant: 'filled',
    loadingPosition: 'left',
    type: 'button',
  },
)

defineOptions({ name: 'UiButton' })
</script>

<template>
  <button
    class="btn relative flex outline-none focus:ring-2 focus:ring-secondary-300"
    :class="{
      'pointer-events-none': loading,
      'btn-filled': variant === 'filled',
      'btn-outlined': variant === 'outlined',
      'btn-text': variant === 'text',
      'text-sm py-1.5 px-3': size === 'sm',
      'text-xs py-1 px-2': size === 'xs',
    }"
    :disabled="disabled || loading"
    :type="type"
  >
    <div
      :class="{
        'ml-6': loading && loadingPosition === 'left',
        'opacity-40': loading,
      }"
    >
      <slot />
    </div>

    <div
      v-if="loading"
      :class="[
        'absolute z-10 flex items-center',
        loadingPosition === 'left'
          ? 'left-2'
          : 'inset-0 h-full flex-1 -translate-x-1 transform justify-center',
      ]"
    >
      <div class="i-ph-circle-notch-bold h-4 w-4 animate-spin" />
    </div>
  </button>
</template>
