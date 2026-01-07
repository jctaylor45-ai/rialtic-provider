import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LearningEvent, EventType, EventContext, EventFilters, EventMetadata } from '~/types/enhancements'
import { groupEventsByPeriod, calculateEngagementScore } from '~/utils/analytics'

export const useEventsStore = defineStore('events', () => {
  // State
  const events = ref<LearningEvent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<EventFilters>({
    type: [],
    context: [],
    dateRange: undefined,
    patternId: undefined,
    claimId: undefined,
  })

  // Getters
  const filteredEvents = computed(() => {
    let filtered = [...events.value]

    if (filters.value.type && filters.value.type.length > 0) {
      filtered = filtered.filter(e => filters.value.type!.includes(e.type))
    }

    if (filters.value.context && filters.value.context.length > 0) {
      filtered = filtered.filter(e => filters.value.context!.includes(e.context))
    }

    if (filters.value.dateRange) {
      const start = new Date(filters.value.dateRange.start)
      const end = new Date(filters.value.dateRange.end)
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.timestamp)
        return eventDate >= start && eventDate <= end
      })
    }

    if (filters.value.patternId) {
      filtered = filtered.filter(e => e.metadata.patternId === filters.value.patternId)
    }

    if (filters.value.claimId) {
      filtered = filtered.filter(e => e.metadata.claimId === filters.value.claimId)
    }

    return filtered
  })

  const practiceEvents = computed(() =>
    events.value.filter(e => e.type === 'practice-started' || e.type === 'practice-completed')
  )

  const completedPracticeSessions = computed(() =>
    events.value.filter(e => e.type === 'practice-completed')
  )

  const correctionEvents = computed(() =>
    events.value.filter(e => e.type === 'correction-applied')
  )

  const claimEvents = computed(() =>
    events.value.filter(e => e.type === 'claim-submitted' || e.type === 'claim-reviewed')
  )

  const recentEvents = computed(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return events.value
      .filter(e => new Date(e.timestamp) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  })

  const todayEvents = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return events.value.filter(e => {
      const eventDate = new Date(e.timestamp)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === today.getTime()
    })
  })

  const totalEvents = computed(() => events.value.length)

  const totalPracticeSessions = computed(() =>
    events.value.filter(e => e.type === 'practice-completed').length
  )

  const totalCorrections = computed(() =>
    events.value.filter(e => e.type === 'correction-applied').length
  )

  const engagementScore = computed(() => calculateEngagementScore(events.value))

  const avgSessionDuration = computed(() => {
    const completedSessions = events.value.filter(e =>
      e.type === 'practice-completed' && e.metadata.duration
    )
    if (completedSessions.length === 0) return 0

    const totalDuration = completedSessions.reduce((sum, e) =>
      sum + (e.metadata.duration || 0), 0
    )
    return Math.round(totalDuration / completedSessions.length / 1000)
  })

  const eventsByDay = computed(() => groupEventsByPeriod(events.value, 'day'))
  const eventsByWeek = computed(() => groupEventsByPeriod(events.value, 'week'))
  const eventsByMonth = computed(() => groupEventsByPeriod(events.value, 'month'))

  const mostPracticedPatterns = computed(() => {
    const patternCounts = new Map<string, number>()

    events.value
      .filter(e => e.type === 'practice-completed' && e.metadata.patternId)
      .forEach(e => {
        const patternId = e.metadata.patternId!
        patternCounts.set(patternId, (patternCounts.get(patternId) || 0) + 1)
      })

    return Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([patternId, count]) => ({ patternId, count }))
  })

  const currentStreak = computed(() => {
    const sortedEvents = [...events.value]
      .filter(e => e.type === 'practice-completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (sortedEvents.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    const uniqueDays = new Set<string>()

    for (const event of sortedEvents) {
      const eventDate = new Date(event.timestamp)
      eventDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > streak) break

      const dateKey = eventDate.toISOString().split('T')[0] || ''
      uniqueDays.add(dateKey)
    }

    return uniqueDays.size
  })

  // Actions
  async function loadEvents() {
    isLoading.value = true
    error.value = null
    try {
      const data = await $fetch<{ events: LearningEvent[] }>('/data/learningEvents.json')
      events.value = data.events.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (err) {
      console.error('Failed to load events:', err)
      error.value = 'Failed to load event data'
    } finally {
      isLoading.value = false
    }
  }

  function getEventById(id: string): LearningEvent | undefined {
    return events.value.find(e => e.id === id)
  }

  function getEventsByPattern(patternId: string): LearningEvent[] {
    return events.value.filter(e => e.metadata.patternId === patternId)
  }

  function getEventsByClaim(claimId: string): LearningEvent[] {
    return events.value.filter(e => e.metadata.claimId === claimId)
  }

  function getEventsBySession(sessionId: string): LearningEvent[] {
    return events.value.filter(e => e.sessionId === sessionId)
  }

  function getEventsByType(type: EventType): LearningEvent[] {
    return events.value.filter(e => e.type === type)
  }

  function updateFilters(newFilters: Partial<EventFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      type: [],
      context: [],
      dateRange: undefined,
      patternId: undefined,
      claimId: undefined,
    }
  }

  function getCurrentSessionId(): string {
    if (import.meta.client) {
      let sessionId = sessionStorage.getItem('currentSessionId')
      if (!sessionId) {
        sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        sessionStorage.setItem('currentSessionId', sessionId)
      }
      return sessionId
    }
    return 'SESSION-SERVER'
  }

  function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (import.meta.client) {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
    }
    return 'desktop'
  }

  function persistEvent(event: LearningEvent) {
    if (import.meta.client) {
      const stored = localStorage.getItem('userEvents')
      const userEvents = stored ? JSON.parse(stored) : []
      userEvents.push(event)

      if (userEvents.length > 100) {
        userEvents.shift()
      }

      localStorage.setItem('userEvents', JSON.stringify(userEvents))
    }
  }

  function trackEvent(
    type: EventType,
    context: EventContext,
    metadata: EventMetadata = {}
  ) {
    const event: LearningEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      context,
      metadata,
      sessionId: getCurrentSessionId(),
      deviceType: getDeviceType(),
    }

    events.value.unshift(event)
    persistEvent(event)

    return event
  }

  function loadUserEvents() {
    if (import.meta.client) {
      const stored = localStorage.getItem('userEvents')
      if (stored) {
        try {
          const userEvents = JSON.parse(stored)
          const existingIds = new Set(events.value.map(e => e.id))
          const newEvents = userEvents.filter((e: LearningEvent) => !existingIds.has(e.id))
          events.value = [...events.value, ...newEvents].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        } catch (err) {
          console.error('Failed to load user events:', err)
        }
      }
    }
  }

  return {
    // State
    events,
    isLoading,
    error,
    filters,
    // Getters
    filteredEvents,
    practiceEvents,
    completedPracticeSessions,
    correctionEvents,
    claimEvents,
    recentEvents,
    todayEvents,
    totalEvents,
    totalPracticeSessions,
    totalCorrections,
    engagementScore,
    avgSessionDuration,
    eventsByDay,
    eventsByWeek,
    eventsByMonth,
    mostPracticedPatterns,
    currentStreak,
    // Actions
    loadEvents,
    getEventById,
    getEventsByPattern,
    getEventsByClaim,
    getEventsBySession,
    getEventsByType,
    updateFilters,
    clearFilters,
    trackEvent,
    loadUserEvents,
  }
})
