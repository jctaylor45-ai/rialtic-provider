/**
 * Layout state composable
 * Manages layout state for drawer panels and navigation
 * Aligned with console-ui pattern
 */
import { useLocalStorage } from '@vueuse/core'

export interface LayoutOptions {
  detailsPanelWidth?: number
  sideNavMini?: boolean
}

export function useLayoutState(options?: LayoutOptions) {
  const opts = {
    detailsPanelWidth: options?.detailsPanelWidth ?? 768,
    sideNavMini: options?.sideNavMini ?? false,
  }

  // Persistent storage using localStorage
  const detailsPanelWidth = useLocalStorage<number>(
    '@rialtic/app-layout:detailsPanelWidth',
    opts.detailsPanelWidth,
  )

  const sideNavMini = useLocalStorage<boolean>(
    '@rialtic/app-layout:sideNavMini',
    opts.sideNavMini,
  )

  // Reactive state (session-based)
  const isDrawerOpen = useState<boolean>('@rialtic/app-layout:isDrawerOpen', () => false)
  const viewWidth = useState<number>('@rialtic/app-layout:viewWidth', () => 0)
  const isScrolling = useState<boolean>('@rialtic/app-layout:isScrolling', () => false)

  // Open drawer
  const openDrawer = () => {
    isDrawerOpen.value = true
  }

  // Close drawer
  const closeDrawer = () => {
    isDrawerOpen.value = false
  }

  // Toggle drawer
  const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  // Toggle sidebar mini mode
  const toggleSideNav = () => {
    sideNavMini.value = !sideNavMini.value
  }

  return {
    // State
    detailsPanelWidth,
    isDrawerOpen,
    isScrolling,
    sideNavMini,
    viewWidth,
    // Actions
    openDrawer,
    closeDrawer,
    toggleDrawer,
    toggleSideNav,
  }
}
