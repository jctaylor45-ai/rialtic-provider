/**
 * Data Ingestion Pipeline
 *
 * Orchestrates importing claim data from external sources.
 * Handles validation, transformation, deduplication, and storage.
 */

import { db } from '~/server/database'
import {
  claims,
  claimProcedureCodes,
  claimDiagnosisCodes,
  claimAppeals,
  providers,
} from '~/server/database/schema'
import { eq, sql } from 'drizzle-orm'

import { DataSourceAdapter } from './adapters/baseAdapter'
import type {
  InternalClaim,
  InternalAppeal,
  ExternalClaim,
  ValidationResult,
} from './adapters/baseAdapter'

// =============================================================================
// TYPES
// =============================================================================

export interface IngestionConfig {
  /** Skip validation errors and continue importing valid records */
  skipInvalid?: boolean
  /** Update existing records if sourceId matches */
  upsert?: boolean
  /** Batch size for database inserts */
  batchSize?: number
  /** Dry run - validate only, don't insert */
  dryRun?: boolean
  /** Scenario ID to associate with imported claims */
  scenarioId?: string
}

export interface IngestionResult {
  success: boolean
  sourceType: string
  startTime: string
  endTime: string
  durationMs: number
  stats: {
    fetched: number
    validated: number
    validationErrors: number
    inserted: number
    updated: number
    skipped: number
    duplicates: number
  }
  errors: Array<{
    record: number
    sourceId?: string
    errors: string[]
  }>
}

export interface IngestionProgress {
  phase: 'connecting' | 'fetching' | 'validating' | 'transforming' | 'inserting' | 'complete' | 'error'
  current: number
  total: number
  message: string
}

type ProgressCallback = (progress: IngestionProgress) => void

// =============================================================================
// INGESTION PIPELINE CLASS
// =============================================================================

export class IngestionPipeline {
  private adapter: DataSourceAdapter
  private config: IngestionConfig
  private onProgress?: ProgressCallback

  constructor(adapter: DataSourceAdapter, config: IngestionConfig = {}) {
    this.adapter = adapter
    this.config = {
      skipInvalid: false,
      upsert: true,
      batchSize: 100,
      dryRun: false,
      ...config,
    }
  }

  /**
   * Set progress callback for real-time status updates
   */
  setProgressCallback(callback: ProgressCallback): void {
    this.onProgress = callback
  }

  /**
   * Run the full ingestion pipeline
   */
  async run(): Promise<IngestionResult> {
    const startTime = new Date()
    const result: IngestionResult = {
      success: false,
      sourceType: this.adapter.sourceType,
      startTime: startTime.toISOString(),
      endTime: '',
      durationMs: 0,
      stats: {
        fetched: 0,
        validated: 0,
        validationErrors: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        duplicates: 0,
      },
      errors: [],
    }

    try {
      // Phase 1: Connect
      this.reportProgress('connecting', 0, 1, 'Connecting to data source...')
      if (!this.adapter.isConnected()) {
        throw new Error('Adapter not connected. Call adapter.connect() first.')
      }

      // Phase 2: Fetch claims
      this.reportProgress('fetching', 0, 0, 'Fetching claims from source...')
      const externalClaims = await this.adapter.fetchClaims()
      result.stats.fetched = externalClaims.length
      this.reportProgress('fetching', externalClaims.length, externalClaims.length, `Fetched ${externalClaims.length} claims`)

      if (externalClaims.length === 0) {
        result.success = true
        result.endTime = new Date().toISOString()
        result.durationMs = Date.now() - startTime.getTime()
        return result
      }

      // Phase 3: Validate
      this.reportProgress('validating', 0, externalClaims.length, 'Validating claims...')
      const validatedClaims: Array<{ external: ExternalClaim; validation: ValidationResult }> = []

      for (let i = 0; i < externalClaims.length; i++) {
        const external = externalClaims[i]!
        const validation = this.adapter.validate(external)

        if (validation.valid) {
          validatedClaims.push({ external, validation })
          result.stats.validated++
        } else {
          result.stats.validationErrors++
          result.errors.push({
            record: i + 1,
            errors: validation.errors,
          })

          if (!this.config.skipInvalid) {
            throw new Error(`Validation failed at record ${i + 1}: ${validation.errors.join(', ')}`)
          }
        }

        if (i % 100 === 0) {
          this.reportProgress('validating', i + 1, externalClaims.length, `Validated ${i + 1}/${externalClaims.length}`)
        }
      }

      // Phase 4: Transform
      this.reportProgress('transforming', 0, validatedClaims.length, 'Transforming claims...')
      const transformedClaims: InternalClaim[] = []

      for (let i = 0; i < validatedClaims.length; i++) {
        const { external } = validatedClaims[i]!
        const internal = this.adapter.transformClaim(external)
        transformedClaims.push(internal)

        if (i % 100 === 0) {
          this.reportProgress('transforming', i + 1, validatedClaims.length, `Transformed ${i + 1}/${validatedClaims.length}`)
        }
      }

      // Phase 5: Insert/Update
      if (!this.config.dryRun) {
        this.reportProgress('inserting', 0, transformedClaims.length, 'Inserting claims into database...')
        await this.insertClaims(transformedClaims, result)
      } else {
        result.stats.skipped = transformedClaims.length
        this.reportProgress('complete', transformedClaims.length, transformedClaims.length, 'Dry run complete')
      }

      // Fetch and process appeals if supported
      const externalAppeals = await this.adapter.fetchAppeals()
      if (externalAppeals.length > 0) {
        await this.processAppeals(externalAppeals)
      }

      result.success = true
    } catch (error) {
      this.reportProgress('error', 0, 0, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.errors.push({
        record: -1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      })
    }

    result.endTime = new Date().toISOString()
    result.durationMs = Date.now() - startTime.getTime()
    this.reportProgress('complete', result.stats.inserted, result.stats.fetched, 'Ingestion complete')

    return result
  }

  /**
   * Insert claims into the database
   */
  private async insertClaims(claims: InternalClaim[], result: IngestionResult): Promise<void> {
    const batchSize = this.config.batchSize || 100

    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize)

      for (const claim of batch) {
        try {
          // Check for existing claim by sourceId
          const existingClaim = claim.sourceId
            ? await this.findExistingClaim(claim.sourceId, claim.sourceSystem)
            : null

          if (existingClaim) {
            if (this.config.upsert) {
              await this.updateClaim(existingClaim.id, claim)
              result.stats.updated++
            } else {
              result.stats.duplicates++
            }
          } else {
            await this.insertClaim(claim)
            result.stats.inserted++
          }
        } catch (error) {
          result.stats.skipped++
          result.errors.push({
            record: i,
            sourceId: claim.sourceId,
            errors: [error instanceof Error ? error.message : 'Insert failed'],
          })

          if (!this.config.skipInvalid) {
            throw error
          }
        }
      }

      this.reportProgress('inserting', Math.min(i + batchSize, claims.length), claims.length, `Inserted ${Math.min(i + batchSize, claims.length)}/${claims.length}`)
    }
  }

  /**
   * Find existing claim by source ID
   */
  private async findExistingClaim(sourceId: string, sourceSystem?: string) {
    // Search for claim with matching sourceId in aiInsight JSON or by ID pattern
    const [existing] = await db
      .select()
      .from(claims)
      .where(sql`${claims.id} LIKE ${`%${sourceId}%`}`)
      .limit(1)

    return existing || null
  }

  /**
   * Insert a single claim with related data
   */
  private async insertClaim(claim: InternalClaim): Promise<void> {
    // Ensure provider exists
    await this.ensureProvider(claim.providerId, claim.providerName)

    // Insert claim
    await db.insert(claims).values({
      id: claim.id,
      providerId: claim.providerId,
      providerName: claim.providerName,
      claimType: claim.claimType as 'Professional' | 'Institutional' | 'Dental' | 'Pharmacy',
      patientName: claim.patientName,
      patientDob: claim.patientDob,
      patientSex: claim.patientSex as 'male' | 'female' | 'unknown',
      memberId: claim.memberId,
      dateOfService: claim.dateOfService,
      billedAmount: claim.billedAmount,
      paidAmount: claim.paidAmount,
      status: claim.status,
      denialReason: claim.denialReason,
      submissionDate: claim.submissionDate,
      processingDate: claim.processingDate,
      scenarioId: this.config.scenarioId,
      aiInsight: {
        explanation: `Imported from ${claim.sourceSystem}`,
        guidance: claim.denialReason || 'No specific guidance',
      },
    })

    // Insert procedure codes
    if (claim.procedureCodes.length > 0) {
      await db.insert(claimProcedureCodes).values(
        claim.procedureCodes.map(code => ({
          claimId: claim.id,
          code,
        }))
      ).onConflictDoNothing()
    }

    // Insert diagnosis codes
    if (claim.diagnosisCodes.length > 0) {
      await db.insert(claimDiagnosisCodes).values(
        claim.diagnosisCodes.map((code, index) => ({
          claimId: claim.id,
          code,
          sequence: index + 1,
        }))
      ).onConflictDoNothing()
    }
  }

  /**
   * Update an existing claim
   */
  private async updateClaim(existingId: string, claim: InternalClaim): Promise<void> {
    await db.update(claims)
      .set({
        paidAmount: claim.paidAmount,
        status: claim.status,
        denialReason: claim.denialReason,
        processingDate: claim.processingDate,
      })
      .where(eq(claims.id, existingId))
  }

  /**
   * Ensure provider exists in database
   */
  private async ensureProvider(providerId: string, providerName?: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1)

    if (!existing) {
      await db.insert(providers).values({
        id: providerId,
        name: providerName || `Provider ${providerId}`,
        npi: providerId,
        scenarioId: this.config.scenarioId,
      }).onConflictDoNothing()
    }
  }

  /**
   * Process appeal data and update claims
   */
  private async processAppeals(externalAppeals: unknown[]): Promise<void> {
    for (const external of externalAppeals) {
      try {
        const appeal = this.adapter.transformAppeal(external as Record<string, unknown>)
        await this.insertOrUpdateAppeal(appeal)
      } catch {
        // Appeals are optional, skip errors
      }
    }
  }

  /**
   * Insert or update appeal for a claim
   */
  private async insertOrUpdateAppeal(appeal: InternalAppeal): Promise<void> {
    // Find the claim
    const [claim] = await db
      .select()
      .from(claims)
      .where(sql`${claims.id} LIKE ${`%${appeal.claimId}%`}`)
      .limit(1)

    if (!claim) return

    // Check if appeal exists
    const [existingAppeal] = await db
      .select()
      .from(claimAppeals)
      .where(eq(claimAppeals.claimId, claim.id))
      .limit(1)

    if (existingAppeal) {
      await db.update(claimAppeals)
        .set({
          appealOutcome: appeal.appealOutcome,
          outcomeDate: appeal.outcomeDate,
          outcomeNotes: appeal.outcomeNotes,
        })
        .where(eq(claimAppeals.id, existingAppeal.id))
    } else {
      await db.insert(claimAppeals).values({
        claimId: claim.id,
        appealFiled: appeal.appealFiled,
        appealDate: appeal.appealDate,
        appealReason: appeal.appealReason,
        appealOutcome: appeal.appealOutcome,
        outcomeDate: appeal.outcomeDate,
        outcomeNotes: appeal.outcomeNotes,
      })
    }

    // Update claim status
    if (appeal.appealFiled) {
      await db.update(claims)
        .set({
          status: 'appealed',
          appealStatus: appeal.appealOutcome,
          appealDate: appeal.appealDate,
        })
        .where(eq(claims.id, claim.id))
    }
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    phase: IngestionProgress['phase'],
    current: number,
    total: number,
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({ phase, current, total, message })
    }
    console.log(`[Ingestion] ${phase}: ${message}`)
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Run ingestion with a specific adapter
 */
export async function ingestFromAdapter(
  adapter: DataSourceAdapter,
  config?: IngestionConfig,
  onProgress?: ProgressCallback
): Promise<IngestionResult> {
  const pipeline = new IngestionPipeline(adapter, config)
  if (onProgress) {
    pipeline.setProgressCallback(onProgress)
  }
  return pipeline.run()
}

/**
 * Validate claims without inserting
 */
export async function validateClaims(
  adapter: DataSourceAdapter
): Promise<{ valid: number; invalid: number; errors: Array<{ record: number; errors: string[] }> }> {
  const result = await ingestFromAdapter(adapter, { dryRun: true })
  return {
    valid: result.stats.validated,
    invalid: result.stats.validationErrors,
    errors: result.errors,
  }
}
