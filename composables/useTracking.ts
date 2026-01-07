/**
 * Composable for event tracking and analytics
 */

import { useEventsStore } from '~/stores/events'
import type { EventType, EventContext, EventMetadata } from '~/types/enhancements'

export function useTracking() {
  const eventsStore = useEventsStore()
  const route = useRoute()

  // Get current context from route
  const getCurrentContext = (): EventContext => {
    const path = route.path
    if (path === '/') return 'dashboard'
    if (path.startsWith('/claims')) return 'claims'
    if (path.startsWith('/insights')) return 'insights'
    if (path.startsWith('/claim-lab')) return 'claim-lab'
    if (path.startsWith('/impact')) return 'impact'
    if (path.startsWith('/policies')) return 'policies'
    return 'dashboard'
  }

  // Track a generic event
  const track = (type: EventType, metadata?: EventMetadata) => {
    const context = getCurrentContext()
    return eventsStore.trackEvent(type, context, metadata)
  }

  // Track page view
  const trackPageView = (duration?: number) => {
    const context = getCurrentContext()
    track(`${context}-viewed` as EventType, { duration })
  }

  // Track claim submission
  const trackClaimSubmission = (claimId: string, status: string, billedAmount: number) => {
    track('claim-submitted', {
      claimId,
      claimStatus: status,
      billedAmount,
    })
  }

  // Track claim review
  const trackClaimReview = (claimId: string, duration: number) => {
    track('claim-reviewed', {
      claimId,
      duration,
    })
  }

  // Track insight view
  const trackInsightView = (patternId: string, patternCategory: import('~/types/enhancements').PatternCategory) => {
    track('insight-viewed', {
      patternId,
      patternCategory,
    })
  }

  // Track insight dismissal
  const trackInsightDismissal = (patternId: string) => {
    track('insight-dismissed', {
      patternId,
    })
  }

  // Track practice session start
  const trackPracticeStart = (patternId: string, practiceType: 'guided' | 'free-form' = 'guided') => {
    track('practice-started', {
      patternId,
      practiceType,
    })
  }

  // Track practice session completion
  const trackPracticeCompletion = (
    patternId: string,
    duration: number,
    correctionsCount: number
  ) => {
    track('practice-completed', {
      patternId,
      duration,
      success: true,
      correctionsCount,
    })
  }

  // Track correction applied
  const trackCorrection = (claimId: string, patternId: string, action: string) => {
    track('correction-applied', {
      claimId,
      patternId,
      action,
    })
  }

  // Track code lookup
  const trackCodeLookup = (procedureCode: string, codeCategory: string) => {
    track('code-lookup', {
      procedureCode,
      codeCategory,
    })
  }

  // Track policy view
  const trackPolicyView = (policyId: string, policyMode: string, duration?: number) => {
    track('policy-viewed', {
      policyId,
      policyMode,
      duration,
    })
  }

  // Auto-track page views with duration
  let pageViewStart: number | null = null

  const startPageViewTracking = () => {
    pageViewStart = Date.now()
  }

  const endPageViewTracking = () => {
    if (pageViewStart) {
      const duration = Date.now() - pageViewStart
      trackPageView(duration)
      pageViewStart = null
    }
  }

  // Use onMounted and onBeforeUnmount for automatic page view tracking
  onMounted(() => {
    startPageViewTracking()
  })

  onBeforeUnmount(() => {
    endPageViewTracking()
  })

  return {
    // Store access
    eventsStore,

    // Generic tracking
    track,
    getCurrentContext,

    // Specific tracking methods
    trackPageView,
    trackClaimSubmission,
    trackClaimReview,
    trackInsightView,
    trackInsightDismissal,
    trackPracticeStart,
    trackPracticeCompletion,
    trackCorrection,
    trackCodeLookup,
    trackPolicyView,

    // Page view duration tracking
    startPageViewTracking,
    endPageViewTracking,
  }
}
