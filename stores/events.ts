import { defineStore } from 'pinia'
import type { LearningEvent, EventType, EventContext, EventFilters, EventMetadata } from '~/types/enhancements'
import { groupEventsByPeriod, calculateEngagementScore } from '~/utils/analytics'

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [] as LearningEvent[],
    isLoading: false,
    error: null as string | null,
    filters: {
      type: [],
      context: [],
      dateRange: undefined,
      patternId: undefined,
      claimId: undefined,
    } as EventFilters,
  }),

  getters: {
    // Filtered events
    filteredEvents: (state) => {
      let filtered = [...state.events]

      // Type filter
      if (state.filters.type && state.filters.type.length > 0) {
        filtered = filtered.filter(e => state.filters.type!.includes(e.type))
      }

      // Context filter
      if (state.filters.context && state.filters.context.length > 0) {
        filtered = filtered.filter(e => state.filters.context!.includes(e.context))
      }

      // Date range filter
      if (state.filters.dateRange) {
        const start = new Date(state.filters.dateRange.start)
        const end = new Date(state.filters.dateRange.end)
        filtered = filtered.filter(e => {
          const eventDate = new Date(e.timestamp)
          return eventDate >= start && eventDate <= end
        })
      }

      // Pattern ID filter
      if (state.filters.patternId) {
        filtered = filtered.filter(e =>
          e.metadata.patternId === state.filters.patternId
        )
      }

      // Claim ID filter
      if (state.filters.claimId) {
        filtered = filtered.filter(e =>
          e.metadata.claimId === state.filters.claimId
        )
      }

      return filtered
    },

    // Events by type
    practiceEvents: (state) => state.events.filter(e =>
      e.type === 'practice-started' || e.type === 'practice-completed'
    ),
    completedPracticeSessions: (state) => state.events.filter(e =>
      e.type === 'practice-completed'
    ),
    correctionEvents: (state) => state.events.filter(e =>
      e.type === 'correction-applied'
    ),
    claimEvents: (state) => state.events.filter(e =>
      e.type === 'claim-submitted' || e.type === 'claim-reviewed'
    ),

    // Recent events (last 7 days)
    recentEvents: (state) => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      return state.events
        .filter(e => new Date(e.timestamp) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },

    // Today's events
    todayEvents: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return state.events.filter(e => {
        const eventDate = new Date(e.timestamp)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.getTime() === today.getTime()
      })
    },

    // Stats
    totalEvents: (state) => state.events.length,
    totalPracticeSessions: (state) => state.events.filter(e =>
      e.type === 'practice-completed'
    ).length,
    totalCorrections: (state) => state.events.filter(e =>
      e.type === 'correction-applied'
    ).length,

    // Engagement metrics
    engagementScore: (state) => calculateEngagementScore(state.events),

    avgSessionDuration: (state) => {
      const completedSessions = state.events.filter(e =>
        e.type === 'practice-completed' && e.metadata.duration
      )
      if (completedSessions.length === 0) return 0

      const totalDuration = completedSessions.reduce((sum, e) =>
        sum + (e.metadata.duration || 0), 0
      )
      return Math.round(totalDuration / completedSessions.length / 1000) // Convert to seconds
    },

    // Events grouped by time period
    eventsByDay: (state) => groupEventsByPeriod(state.events, 'day'),
    eventsByWeek: (state) => groupEventsByPeriod(state.events, 'week'),
    eventsByMonth: (state) => groupEventsByPeriod(state.events, 'month'),

    // Most active patterns (based on practice events)
    mostPracticedPatterns: (state) => {
      const patternCounts = new Map<string, number>()

      state.events
        .filter(e => e.type === 'practice-completed' && e.metadata.patternId)
        .forEach(e => {
          const patternId = e.metadata.patternId!
          patternCounts.set(patternId, (patternCounts.get(patternId) || 0) + 1)
        })

      return Array.from(patternCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([patternId, count]) => ({ patternId, count }))
    },

    // Streak calculation (consecutive days with activity)
    currentStreak: (state) => {
      const sortedEvents = [...state.events]
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

        const dateKey = eventDate.toISOString().split('T')[0]
        uniqueDays.add(dateKey)
      }

      return uniqueDays.size
    },
  },

  actions: {
    async loadEvents() {
      this.isLoading = true
      this.error = null
      try {
        const data = await $fetch<{ events: LearningEvent[] }>('/data/learningEvents.json')
        this.events = data.events.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      } catch (error) {
        console.error('Failed to load events:', error)
        this.error = 'Failed to load event data'
      } finally {
        this.isLoading = false
      }
    },

    getEventById(id: string): LearningEvent | undefined {
      return this.events.find(e => e.id === id)
    },

    getEventsByPattern(patternId: string): LearningEvent[] {
      return this.events.filter(e => e.metadata.patternId === patternId)
    },

    getEventsByClaim(claimId: string): LearningEvent[] {
      return this.events.filter(e => e.metadata.claimId === claimId)
    },

    getEventsBySession(sessionId: string): LearningEvent[] {
      return this.events.filter(e => e.sessionId === sessionId)
    },

    getEventsByType(type: EventType): LearningEvent[] {
      return this.events.filter(e => e.type === type)
    },

    updateFilters(filters: Partial<EventFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {
        type: [],
        context: [],
        dateRange: undefined,
        patternId: undefined,
        claimId: undefined,
      }
    },

    // Track a new event
    trackEvent(
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
        sessionId: this.getCurrentSessionId(),
        deviceType: this.getDeviceType(),
      }

      this.events.unshift(event) // Add to beginning for chronological order

      // Persist to localStorage for future sessions
      this.persistEvent(event)

      return event
    },

    getCurrentSessionId(): string {
      if (import.meta.client) {
        let sessionId = sessionStorage.getItem('currentSessionId')
        if (!sessionId) {
          sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          sessionStorage.setItem('currentSessionId', sessionId)
        }
        return sessionId
      }
      return 'SESSION-SERVER'
    },

    getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
      if (import.meta.client) {
        const width = window.innerWidth
        if (width < 768) return 'mobile'
        if (width < 1024) return 'tablet'
      }
      return 'desktop'
    },

    persistEvent(event: LearningEvent) {
      if (import.meta.client) {
        const stored = localStorage.getItem('userEvents')
        const userEvents = stored ? JSON.parse(stored) : []
        userEvents.push(event)

        // Keep only last 100 user events in localStorage
        if (userEvents.length > 100) {
          userEvents.shift()
        }

        localStorage.setItem('userEvents', JSON.stringify(userEvents))
      }
    },

    loadUserEvents() {
      if (import.meta.client) {
        const stored = localStorage.getItem('userEvents')
        if (stored) {
          try {
            const userEvents = JSON.parse(stored)
            // Merge with existing events, avoiding duplicates
            const existingIds = new Set(this.events.map(e => e.id))
            const newEvents = userEvents.filter((e: LearningEvent) => !existingIds.has(e.id))
            this.events = [...this.events, ...newEvents].sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          } catch (error) {
            console.error('Failed to load user events:', error)
          }
        }
      }
    },
  },
})
