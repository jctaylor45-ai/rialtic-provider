/**
 * Generation Manager Service
 *
 * Manages the continuous generation of mock data.
 * Controls start/stop/status of data generation jobs.
 */

import { db } from '../database'
import {
  claims,
  claimLineItems,
  claimDiagnosisCodes,
  claimProcedureCodes,
  claimAppeals,
  learningEvents,
  patterns,
  patternClaims,
} from '../database/schema'
import { generateClaimBatch, type GeneratorConfig, type GeneratedClaim } from './claimGenerator'
import { generateAppealsForClaims, type GeneratedAppeal } from './appealGenerator'
import { generateEventBatch, type GeneratedEvent, type PatternInfo } from './userEventGenerator'
import { injectMultiplePatterns, type PatternInjectionConfig } from './patternInjector'

// =============================================================================
// TYPES
// =============================================================================

export interface GenerationConfig {
  /** Claims to generate per day */
  claimsPerDay: number
  /** Scenario ID to associate data with */
  scenarioId?: string
  /** Speed multiplier (1 = real-time, 100 = 100x faster) */
  speed: number
  /** Pattern injection configs */
  patterns: PatternInjectionConfig[]
  /** Whether to generate appeals */
  generateAppeals: boolean
  /** Whether to generate learning events */
  generateEvents: boolean
  /** Appeal rate for denied claims */
  appealRate?: number
  /** Events per day */
  eventsPerDay?: number
}

export interface GenerationStatus {
  isRunning: boolean
  startedAt: string | null
  config: GenerationConfig | null
  stats: {
    claimsGenerated: number
    appealsGenerated: number
    eventsGenerated: number
    batchesCompleted: number
    lastBatchAt: string | null
    errors: number
  }
}

// =============================================================================
// STATE
// =============================================================================

let generationInterval: ReturnType<typeof setInterval> | null = null
let generationStatus: GenerationStatus = {
  isRunning: false,
  startedAt: null,
  config: null,
  stats: {
    claimsGenerated: 0,
    appealsGenerated: 0,
    eventsGenerated: 0,
    batchesCompleted: 0,
    lastBatchAt: null,
    errors: 0,
  },
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Insert generated claims into database
 */
async function insertClaims(generatedClaims: GeneratedClaim[]): Promise<number> {
  let inserted = 0

  for (const generated of generatedClaims) {
    try {
      // Insert claim
      await db.insert(claims).values(generated.claim).onConflictDoNothing()

      // Insert line items
      for (const lineItem of generated.lineItems) {
        await db.insert(claimLineItems).values(lineItem).onConflictDoNothing()
      }

      // Insert diagnosis codes
      for (const dx of generated.diagnosisCodes) {
        await db.insert(claimDiagnosisCodes).values(dx).onConflictDoNothing()
      }

      // Insert procedure codes
      for (const proc of generated.procedureCodes) {
        await db.insert(claimProcedureCodes).values(proc).onConflictDoNothing()
      }

      inserted++
    } catch (error) {
      console.error('Error inserting claim:', error)
      generationStatus.stats.errors++
    }
  }

  return inserted
}

/**
 * Insert generated appeals into database
 */
async function insertAppeals(generatedAppeals: GeneratedAppeal[]): Promise<number> {
  let inserted = 0

  for (const generated of generatedAppeals) {
    try {
      // If appeal has scheduled resolution, apply it
      const appeal = generated.scheduledResolution
        ? {
            ...generated.appeal,
            appealOutcome: generated.scheduledResolution.outcome,
            outcomeDate: generated.scheduledResolution.outcomeDate,
            outcomeNotes: generated.scheduledResolution.outcome === 'overturned'
              ? 'Appeal approved. Claim will be reprocessed for payment.'
              : 'Appeal denied. Original denial reason upheld.',
          }
        : generated.appeal

      await db.insert(claimAppeals).values(appeal).onConflictDoNothing()
      inserted++
    } catch (error) {
      console.error('Error inserting appeal:', error)
      generationStatus.stats.errors++
    }
  }

  return inserted
}

/**
 * Insert generated learning events into database
 */
async function insertEvents(generatedEvents: GeneratedEvent[]): Promise<number> {
  let inserted = 0

  for (const generated of generatedEvents) {
    try {
      await db.insert(learningEvents).values(generated.event).onConflictDoNothing()
      inserted++
    } catch (error) {
      console.error('Error inserting event:', error)
      generationStatus.stats.errors++
    }
  }

  return inserted
}

/**
 * Link claims to patterns in database
 */
async function linkClaimsToPatterns(generatedClaims: GeneratedClaim[], patternConfigs: PatternInjectionConfig[]): Promise<void> {
  for (const claim of generatedClaims) {
    if (claim.claim.status === 'denied' && claim.claim.denialReason) {
      // Find matching pattern
      for (const config of patternConfigs) {
        if (claim.claim.denialReason.toLowerCase().includes(config.denialReason.toLowerCase().split(' ')[0]!.toLowerCase())) {
          try {
            await db.insert(patternClaims).values({
              patternId: config.patternId,
              claimId: claim.claim.id,
            }).onConflictDoNothing()
          } catch {
            // Ignore - pattern might not exist yet
          }
          break
        }
      }
    }
  }
}

// =============================================================================
// GENERATION BATCH
// =============================================================================

/**
 * Run a single generation batch
 */
async function runGenerationBatch(config: GenerationConfig): Promise<void> {
  try {
    const batchSize = 10 // Claims per batch

    // Calculate date range (past 90 days for realistic spread)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)

    // Generate claims
    const generatorConfig: GeneratorConfig = {
      denialRate: 0.15, // Base rate before pattern injection
      scenarioId: config.scenarioId,
      dateRange: { start: startDate, end: endDate },
    }

    let generatedClaims = generateClaimBatch(batchSize, generatorConfig)

    // Inject patterns
    if (config.patterns.length > 0) {
      const { claims: injectedClaims } = injectMultiplePatterns(generatedClaims, config.patterns)
      generatedClaims = injectedClaims
    }

    // Insert claims
    const claimsInserted = await insertClaims(generatedClaims)
    generationStatus.stats.claimsGenerated += claimsInserted

    // Link claims to patterns
    if (config.patterns.length > 0) {
      await linkClaimsToPatterns(generatedClaims, config.patterns)
    }

    // Generate appeals for denied claims
    if (config.generateAppeals) {
      const deniedClaims = generatedClaims
        .filter(c => c.claim.status === 'denied')
        .map(c => ({
          id: c.claim.id,
          status: c.claim.status,
          denialReason: c.claim.denialReason ?? null,
          processingDate: c.claim.processingDate ?? null,
        }))

      const appeals = generateAppealsForClaims(deniedClaims, {
        appealRate: config.appealRate ?? 0.40,
      })

      const appealsInserted = await insertAppeals(appeals)
      generationStatus.stats.appealsGenerated += appealsInserted
    }

    // Generate learning events
    if (config.generateEvents) {
      const eventCount = Math.ceil((config.eventsPerDay || 20) / (config.claimsPerDay / batchSize))
      const patternInfos: PatternInfo[] = config.patterns.map(p => ({
        id: p.patternId,
        category: p.category,
      }))

      const events = generateEventBatch(eventCount, patternInfos, {
        scenarioId: config.scenarioId,
      })

      const eventsInserted = await insertEvents(events)
      generationStatus.stats.eventsGenerated += eventsInserted
    }

    generationStatus.stats.batchesCompleted++
    generationStatus.stats.lastBatchAt = new Date().toISOString()
  } catch (error) {
    console.error('Generation batch error:', error)
    generationStatus.stats.errors++
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Start continuous data generation
 */
export function startGeneration(config: GenerationConfig): { success: boolean; message: string } {
  if (generationStatus.isRunning) {
    return { success: false, message: 'Generation already running' }
  }

  // Calculate interval based on claims per day and speed
  const batchSize = 10
  const batchesPerDay = config.claimsPerDay / batchSize
  const msPerDay = 24 * 60 * 60 * 1000
  const intervalMs = Math.max(1000, (msPerDay / batchesPerDay) / config.speed)

  // Reset stats
  generationStatus = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    config,
    stats: {
      claimsGenerated: 0,
      appealsGenerated: 0,
      eventsGenerated: 0,
      batchesCompleted: 0,
      lastBatchAt: null,
      errors: 0,
    },
  }

  // Start generation loop
  generationInterval = setInterval(() => {
    runGenerationBatch(config)
  }, intervalMs)

  // Run first batch immediately
  runGenerationBatch(config)

  return {
    success: true,
    message: `Generation started: ${config.claimsPerDay} claims/day at ${config.speed}x speed (batch every ${Math.round(intervalMs / 1000)}s)`,
  }
}

/**
 * Stop data generation
 */
export function stopGeneration(): { success: boolean; message: string; stats: GenerationStatus['stats'] } {
  if (!generationStatus.isRunning) {
    return {
      success: false,
      message: 'Generation not running',
      stats: generationStatus.stats,
    }
  }

  if (generationInterval) {
    clearInterval(generationInterval)
    generationInterval = null
  }

  const stats = { ...generationStatus.stats }

  generationStatus = {
    ...generationStatus,
    isRunning: false,
  }

  return {
    success: true,
    message: 'Generation stopped',
    stats,
  }
}

/**
 * Get current generation status
 */
export function getGenerationStatus(): GenerationStatus {
  return { ...generationStatus }
}

/**
 * Run a single batch manually (for testing)
 */
export async function runSingleBatch(config: GenerationConfig): Promise<{
  success: boolean
  stats: {
    claimsGenerated: number
    appealsGenerated: number
    eventsGenerated: number
  }
}> {
  const startStats = { ...generationStatus.stats }

  await runGenerationBatch(config)

  return {
    success: true,
    stats: {
      claimsGenerated: generationStatus.stats.claimsGenerated - startStats.claimsGenerated,
      appealsGenerated: generationStatus.stats.appealsGenerated - startStats.appealsGenerated,
      eventsGenerated: generationStatus.stats.eventsGenerated - startStats.eventsGenerated,
    },
  }
}
