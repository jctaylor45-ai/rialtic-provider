<template>
  <!-- Redirect to claims list with drawer open -->
  <div class="flex-1 p-8">
    <div class="flex items-center justify-center h-64">
      <div class="text-center">
        <UiLoading size="lg" class="mx-auto mb-4" />
        <p class="text-neutral-600">Loading claim details...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Claim detail page - redirects to claims list with drawer open
 * This allows direct URLs to claims to work while using the drawer pattern
 */
const route = useRoute()
const router = useRouter()

const claimId = route.params.id as string

// Redirect to claims list with drawer open
onMounted(() => {
  router.replace({ path: '/claims', query: { claim: claimId } })
})
</script>
