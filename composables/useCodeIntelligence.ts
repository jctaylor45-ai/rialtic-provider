/**
 * Composable for managing code intelligence modal
 */

export const useCodeIntelligence = () => {
  const analyticsStore = useAnalyticsStore()
  const { track } = useTracking()

  // Shared state for the modal
  const isModalOpen = useState('codeIntelligenceModalOpen', () => false)
  const selectedCode = useState<string | null>('selectedProcedureCode', () => null)

  /**
   * Open code intelligence modal for a specific procedure code
   */
  const openCodeIntelligence = (code: string) => {
    // Check if we have intelligence for this code
    const intelligence = analyticsStore.getCodeIntelligence(code)

    if (!intelligence) {
      console.warn(`No intelligence available for code: ${code}`)
      return
    }

    selectedCode.value = code
    isModalOpen.value = true

    // Track the event
    track('code-intel-viewed', {
      procedureCode: code,
      codeCategory: intelligence.category,
    })
  }

  /**
   * Close the code intelligence modal
   */
  const closeCodeIntelligence = () => {
    isModalOpen.value = false
    // Delay clearing selected code to allow exit animation
    setTimeout(() => {
      selectedCode.value = null
    }, 200)
  }

  /**
   * Navigate to a different code (keeps modal open)
   */
  const navigateToCode = (code: string) => {
    selectedCode.value = code

    // Track the navigation
    const intelligence = analyticsStore.getCodeIntelligence(code)
    if (intelligence) {
      track('code-intel-viewed', {
        procedureCode: code,
        codeCategory: intelligence.category,
      })
    }
  }

  /**
   * Check if intelligence is available for a code
   */
  const hasIntelligence = (code: string): boolean => {
    return analyticsStore.getCodeIntelligence(code) !== undefined
  }

  /**
   * Get a clickable procedure code component props
   */
  const getCodeProps = (code: string) => {
    return {
      onClick: () => openCodeIntelligence(code),
      class: hasIntelligence(code)
        ? 'cursor-pointer hover:text-primary-600 hover:underline transition-colors'
        : 'cursor-default',
      title: hasIntelligence(code) ? `Click to view intelligence for ${code}` : undefined,
    }
  }

  return {
    isModalOpen,
    selectedCode,
    openCodeIntelligence,
    closeCodeIntelligence,
    navigateToCode,
    hasIntelligence,
    getCodeProps,
  }
}
