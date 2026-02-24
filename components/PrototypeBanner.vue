<template>
  <div class="fixed top-0 left-0 right-0 z-100 h-9 flex items-center justify-center border-b bg-warning-50 border-warning-300 text-warning-800 text-sm font-medium">
    <Icon name="heroicons:exclamation-triangle" class="w-4 h-4 mr-1.5" />
    Prototype: {{ activePrototype.name }} · Not Production Software
  </div>
</template>

<script setup lang="ts">
const { activePrototype } = usePrototypes()
</script>
