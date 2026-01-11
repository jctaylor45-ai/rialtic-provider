<script setup lang="ts">
/**
 * Side navigation component
 * Vertical navigation for sidebar menus
 */
export interface NavItem {
  id: string
  label: string
  to?: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  children?: NavItem[]
}

defineProps<{
  items: NavItem[]
  collapsed?: boolean
}>()

const route = useRoute()
const expandedGroups = ref<Set<string>>(new Set())

const isActive = (item: NavItem) => {
  if (item.to) {
    return route.path === item.to || route.path.startsWith(item.to + '/')
  }
  return false
}

const hasActiveChild = (item: NavItem) => {
  return item.children?.some(child => isActive(child))
}

const toggleGroup = (item: NavItem) => {
  if (expandedGroups.value.has(item.id)) {
    expandedGroups.value.delete(item.id)
  } else {
    expandedGroups.value.add(item.id)
  }
}

const isExpanded = (item: NavItem) => {
  return expandedGroups.value.has(item.id) || hasActiveChild(item)
}
</script>

<template>
  <nav class="space-y-1">
    <template v-for="item in items" :key="item.id">
      <!-- Group with children -->
      <div v-if="item.children?.length">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="{
            'text-primary-700 bg-primary-50': hasActiveChild(item),
            'text-neutral-600 hover:bg-neutral-100': !hasActiveChild(item),
          }"
          @click="toggleGroup(item)"
        >
          <Icon v-if="item.icon" :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!collapsed" class="flex-1 text-left">{{ item.label }}</span>
          <Icon
            v-if="!collapsed"
            name="heroicons:chevron-right"
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-90': isExpanded(item) }"
          />
        </button>

        <!-- Children -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div v-if="isExpanded(item) && !collapsed" class="mt-1 ml-4 pl-3 border-l border-neutral-200 space-y-1">
            <NuxtLink
              v-for="child in item.children"
              :key="child.id"
              :to="child.to"
              class="flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors"
              :class="{
                'text-primary-700 bg-primary-50 font-medium': isActive(child),
                'text-neutral-600 hover:bg-neutral-100': !isActive(child),
                'opacity-50 cursor-not-allowed': child.disabled,
              }"
            >
              <Icon v-if="child.icon" :name="child.icon" class="w-4 h-4 flex-shrink-0" />
              <span class="flex-1">{{ child.label }}</span>
              <span
                v-if="child.badge"
                class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-neutral-200 text-neutral-600"
              >
                {{ child.badge }}
              </span>
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <!-- Single item -->
      <NuxtLink
        v-else
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="{
          'text-primary-700 bg-primary-50': isActive(item),
          'text-neutral-600 hover:bg-neutral-100': !isActive(item),
          'opacity-50 cursor-not-allowed': item.disabled,
        }"
      >
        <Icon v-if="item.icon" :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!collapsed" class="flex-1">{{ item.label }}</span>
        <span
          v-if="item.badge && !collapsed"
          class="px-1.5 py-0.5 text-xs font-medium rounded-full"
          :class="{
            'bg-primary-100 text-primary-700': isActive(item),
            'bg-neutral-200 text-neutral-600': !isActive(item),
          }"
        >
          {{ item.badge }}
        </span>
      </NuxtLink>
    </template>
  </nav>
</template>
