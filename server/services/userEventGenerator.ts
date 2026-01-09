/**
 * User Event Generator Service
 *
 * Generates realistic user learning events and practice sessions
 * to simulate user engagement with the portal.
 */

import type { InferInsertModel } from 'drizzle-orm'
import type { learningEvents, patterns } from '../database/schema'

// =============================================================================
// TYPES
// =============================================================================

export interface EventConfig {
  /** Scenario ID to associate events with */
  scenarioId?: string
  /** User ID (optional) */
  userId?: string
  /** Device type distribution */
  deviceDistribution?: { desktop: number; mobile: number; tablet: number }
}

export interface PatternInfo {
  id: string
  title?: string
  category?: string
}

export type EventType =
  | 'pattern_viewed'
  | 'claim_inspected'
  | 'policy_learned'
  | 'claim_lab_test'
  | 'export_claims'
  | 'practice_started'
  | 'practice_completed'
  | 'correction_applied'
  | 'action_recorded'
  | 'dashboard_viewed'
  | 'filter_applied'
  | 'insight_dismissed'
  | 'insight_expanded'

export type ContextType = 'dashboard' | 'claims' | 'insights' | 'claim-lab' | 'impact' | 'policies'

export interface GeneratedEvent {
  event: InferInsertModel<typeof learningEvents>
}

export interface PracticeSession {
  events: GeneratedEvent[]
  sessionId: string
  patternId: string
  duration: number // milliseconds
  score: { correct: number; total: number }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomId(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase()
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}

function addSeconds(date: Date, seconds: number): Date {
  const result = new Date(date)
  result.setSeconds(result.getSeconds() + seconds)
  return result
}

function generateEventId(): string {
  return `EVT-${Date.now()}-${randomId(4)}`
}

function generateSessionId(): string {
  return `SESSION-${Date.now()}-${randomId(4)}`
}

function selectDevice(distribution: { desktop: number; mobile: number; tablet: number }): 'desktop' | 'mobile' | 'tablet' {
  const rand = Math.random()
  if (rand < distribution.desktop) return 'desktop'
  if (rand < distribution.desktop + distribution.mobile) return 'mobile'
  return 'tablet'
}

// =============================================================================
// EVENT GENERATORS
// =============================================================================

/**
 * Generate a single learning event
 */
export function generateEvent(
  type: EventType,
  context: ContextType,
  config: EventConfig = {},
  metadata: Record<string, unknown> = {}
): GeneratedEvent {
  const {
    scenarioId,
    userId,
    deviceDistribution = { desktop: 0.70, mobile: 0.20, tablet: 0.10 },
  } = config

  const event: InferInsertModel<typeof learningEvents> = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type,
    context,
    userId: userId || `user-${randomInt(1, 5)}`,
    sessionId: generateSessionId(),
    deviceType: selectDevice(deviceDistribution),
    scenarioId: scenarioId || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  }

  return { event }
}

/**
 * Generate a pattern view event
 */
export function generatePatternViewEvent(
  pattern: PatternInfo,
  config: EventConfig = {}
): GeneratedEvent {
  return generateEvent('pattern_viewed', 'insights', config, {
    patternId: pattern.id,
    patternTitle: pattern.title,
    patternCategory: pattern.category,
  })
}

/**
 * Generate a claim inspection event
 */
export function generateClaimInspectionEvent(
  claimId: string,
  config: EventConfig = {},
  source: ContextType = 'claims'
): GeneratedEvent {
  return generateEvent('claim_inspected', source, config, {
    claimId,
    inspectionDuration: randomInt(10, 120) * 1000, // 10-120 seconds
  })
}

/**
 * Generate a policy learned event
 */
export function generatePolicyLearnedEvent(
  policyId: string,
  config: EventConfig = {}
): GeneratedEvent {
  return generateEvent('policy_learned', 'policies', config, {
    policyId,
    learningMethod: randomChoice(['read', 'practice', 'example']),
  })
}

/**
 * Generate a complete practice session
 */
export function generatePracticeSession(
  pattern: PatternInfo,
  config: EventConfig = {}
): PracticeSession {
  const sessionId = generateSessionId()
  const events: GeneratedEvent[] = []
  const startTime = new Date()

  // Session duration: 5-20 minutes
  const durationMinutes = randomInt(5, 20)
  const durationMs = durationMinutes * 60 * 1000

  // Practice score: typically 60-100%
  const total = 10
  const correct = randomInt(6, 10)

  // Event 1: Practice started
  const startEvent = generateEvent('practice_started', 'claim-lab', config, {
    patternId: pattern.id,
    patternTitle: pattern.title,
    sessionId,
  })
  startEvent.event.timestamp = startTime.toISOString()
  startEvent.event.sessionId = sessionId
  events.push(startEvent)

  // Event 2: Multiple claim inspections during practice (3-8 claims)
  const claimCount = randomInt(3, 8)
  for (let i = 0; i < claimCount; i++) {
    const inspectionTime = addMinutes(startTime, randomInt(1, durationMinutes - 2))
    const inspectEvent = generateEvent('claim_inspected', 'claim-lab', config, {
      claimId: `CLM-PRACTICE-${randomId(6)}`,
      patternId: pattern.id,
      sessionId,
      practiceAttempt: i + 1,
    })
    inspectEvent.event.timestamp = inspectionTime.toISOString()
    inspectEvent.event.sessionId = sessionId
    events.push(inspectEvent)
  }

  // Event 3: Practice completed
  const endTime = addMinutes(startTime, durationMinutes)
  const completeEvent = generateEvent('practice_completed', 'claim-lab', config, {
    patternId: pattern.id,
    sessionId,
    duration: durationMs,
    score: { correct, total },
    accuracy: Math.round((correct / total) * 100),
  })
  completeEvent.event.timestamp = endTime.toISOString()
  completeEvent.event.sessionId = sessionId
  events.push(completeEvent)

  // Event 4: Correction applied (if score was good enough)
  if (correct >= 7) {
    const correctionTime = addSeconds(endTime, randomInt(30, 300))
    const correctionEvent = generateEvent('correction_applied', 'claim-lab', config, {
      patternId: pattern.id,
      sessionId,
      correctionType: pattern.category === 'modifier-missing' ? 'add_modifier' : 'update_workflow',
    })
    correctionEvent.event.timestamp = correctionTime.toISOString()
    correctionEvent.event.sessionId = sessionId
    events.push(correctionEvent)
  }

  return {
    events,
    sessionId,
    patternId: pattern.id,
    duration: durationMs,
    score: { correct, total },
  }
}

/**
 * Generate a batch of mixed learning events
 */
export function generateEventBatch(
  count: number,
  patterns: PatternInfo[],
  config: EventConfig = {}
): GeneratedEvent[] {
  const events: GeneratedEvent[] = []
  const eventTypes: Array<{ type: EventType; context: ContextType; weight: number }> = [
    { type: 'dashboard_viewed', context: 'dashboard', weight: 0.15 },
    { type: 'pattern_viewed', context: 'insights', weight: 0.20 },
    { type: 'claim_inspected', context: 'claims', weight: 0.25 },
    { type: 'policy_learned', context: 'policies', weight: 0.10 },
    { type: 'filter_applied', context: 'claims', weight: 0.15 },
    { type: 'export_claims', context: 'claims', weight: 0.05 },
    { type: 'insight_expanded', context: 'insights', weight: 0.05 },
    { type: 'claim_lab_test', context: 'claim-lab', weight: 0.05 },
  ]

  for (let i = 0; i < count; i++) {
    // Select event type based on weight
    const rand = Math.random()
    let cumulative = 0
    let selectedType = eventTypes[0]!

    for (const eventType of eventTypes) {
      cumulative += eventType.weight
      if (rand < cumulative) {
        selectedType = eventType
        break
      }
    }

    // Generate appropriate event
    const pattern = patterns.length > 0 ? randomChoice(patterns) : { id: 'PTN-DEFAULT', title: 'Sample Pattern', category: 'modifier-missing' }

    let event: GeneratedEvent

    switch (selectedType.type) {
      case 'pattern_viewed':
        event = generatePatternViewEvent(pattern, config)
        break
      case 'claim_inspected':
        event = generateClaimInspectionEvent(`CLM-${randomId(8)}`, config, selectedType.context)
        break
      case 'policy_learned':
        event = generatePolicyLearnedEvent(`POL-${randomId(4)}`, config)
        break
      default:
        event = generateEvent(selectedType.type, selectedType.context, config, {
          patternId: pattern.id,
        })
    }

    events.push(event)
  }

  return events
}

/**
 * Generate events clustered around specific dates (simulates user activity spikes)
 */
export function generateClusteredEvents(
  clusterDates: string[],
  eventsPerCluster: number,
  patterns: PatternInfo[],
  config: EventConfig = {}
): GeneratedEvent[] {
  const allEvents: GeneratedEvent[] = []

  for (const dateStr of clusterDates) {
    const baseDate = new Date(dateStr)

    // Generate events throughout the day
    for (let i = 0; i < eventsPerCluster; i++) {
      const events = generateEventBatch(1, patterns, config)

      // Adjust timestamp to be on the cluster date
      const hourOffset = randomInt(8, 18) // Business hours
      const minuteOffset = randomInt(0, 59)
      const eventDate = new Date(baseDate)
      eventDate.setHours(hourOffset, minuteOffset, randomInt(0, 59))

      events[0]!.event.timestamp = eventDate.toISOString()
      allEvents.push(events[0]!)
    }
  }

  return allEvents
}

/**
 * Calculate engagement metrics from events
 */
export function calculateEngagementMetrics(events: GeneratedEvent[]): {
  totalEvents: number
  uniqueSessions: number
  eventsByType: Record<string, number>
  eventsByContext: Record<string, number>
  avgSessionDuration: number
} {
  const sessions = new Set<string>()
  const eventsByType: Record<string, number> = {}
  const eventsByContext: Record<string, number> = {}

  for (const { event } of events) {
    if (event.sessionId) {
      sessions.add(event.sessionId)
    }

    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

    if (event.context) {
      eventsByContext[event.context] = (eventsByContext[event.context] || 0) + 1
    }
  }

  return {
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    eventsByType,
    eventsByContext,
    avgSessionDuration: 0, // Would need session start/end to calculate
  }
}
