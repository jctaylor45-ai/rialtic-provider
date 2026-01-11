# 🚀 Claude Code: Phase 3 - Real Data Integration

**Copy everything below** and paste into Claude Code in VS Code.

---

# Phase 3: Real Data Integration

## Context

Phases 0-2 are complete - you have a data generation engine and server-side metric computation. Now build adapters to integrate real claim data from external sources (healthcare clearing houses, EHRs, claim management systems).

**Timeline**: 3 days
**Deliverable**: System can ingest real claims and appeals, generator and real data coexist, metrics computed from both

## Phase 3 Responsibilities

1. Build pluggable data source adapters
2. Create claim ingestion pipeline
3. Map external schemas to internal schema
4. Handle data validation and transformation
5. Create dual-mode operation (generator + real data)
6. Build data source management UI

## Architecture Overview

```
Real Data Sources (Multiple formats)
    ↓
Adapters (normalize to internal format)
    ↓
Ingestion Pipeline (validation, transformation)
    ↓
Database (unified claims table)
    ↓
Metrics (computed from both real + generated)
```

## Day 1: Adapter Framework & Common Adapters

### Create `server/services/adapters/baseAdapter.ts`

```typescript
export interface ExternalClaim {
  [key: string]: any
}

export interface InternalClaim {
  id: string
  providerId: string
  claimType: string
  patientName: string
  patientDob: string
  patientSex: string
  memberId: string
  billedAmount: number
  paidAmount: number
  dateOfService: string
  procedureCodes: string[]
  diagnosisCodes: string[]
  status: string
  denialReason?: string
  submissionDate: string
  processingDate: string
  source: 'generated' | 'real'
  sourceId?: string
}

export abstract class DataSourceAdapter {
  name: string
  description: string

  abstract connect(config: Record<string, any>): Promise<void>
  abstract disconnect(): Promise<void>
  abstract fetchClaims(
    options?: { limit?: number; offset?: number; since?: string }
  ): Promise<ExternalClaim[]>
  abstract fetchAppeals(
    options?: { limit?: number; offset?: number }
  ): Promise<any[]>
  abstract transformClaim(external: ExternalClaim): InternalClaim
  abstract validate(claim: ExternalClaim): boolean
}
```

### Create `server/services/adapters/hl7Adapter.ts`

```typescript
import { DataSourceAdapter, ExternalClaim, InternalClaim } from './baseAdapter'

/**
 * Adapter for HL7 837 claims format (healthcare standard)
 * Handles 837I (institutional) and 837P (professional) claims
 */
export class HL7Adapter extends DataSourceAdapter {
  name = 'HL7 837'
  description = 'HL7 837 EDI Claims Format'
  private client: any = null
  private config: Record<string, any> = {}

  async connect(config: Record<string, any>): Promise<void> {
    // Example: connect to clearinghouse API
    this.config = config
    const { endpoint, apiKey } = config

    // Validate connection
    try {
      // this.client = await clearinghouseAPI.authenticate(endpoint, apiKey)
      console.log(`Connected to HL7 source: ${endpoint}`)
    } catch (error) {
      throw new Error(`Failed to connect to HL7 source: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    this.client = null
  }

  async fetchClaims(options?: any): Promise<ExternalClaim[]> {
    const { limit = 100, offset = 0, since } = options

    // Fetch from clearinghouse API
    // This is a mock implementation
    return [
      {
        hl7_claim_id: 'CLM001',
        claim_submission_date: '2025-01-08',
        patient_name: 'JOHN DOE',
        patient_dob: '19700101',
        patient_sex: 'M',
        member_id: '12345678',
        provider_npi: '1234567890',
        claim_type: 'Professional',
        service_date: '2025-01-07',
        procedure_codes: ['99213'],
        diagnosis_codes: ['I10'],
        billed_amount: 250.00,
        paid_amount: 200.00,
        claim_status: 'PAID',
        denial_reason: null
      }
    ]
  }

  async fetchAppeals(options?: any): Promise<any[]> {
    return []
  }

  transformClaim(external: ExternalClaim): InternalClaim {
    return {
      id: `HL7-${external.hl7_claim_id}`,
      providerId: external.provider_npi,
      claimType: external.claim_type,
      patientName: external.patient_name,
      patientDob: formatDOB(external.patient_dob),
      patientSex: external.patient_sex === 'M' ? 'male' : 'female',
      memberId: external.member_id,
      billedAmount: external.billed_amount,
      paidAmount: external.paid_amount,
      dateOfService: formatDate(external.service_date),
      procedureCodes: Array.isArray(external.procedure_codes)
        ? external.procedure_codes
        : [external.procedure_codes],
      diagnosisCodes: Array.isArray(external.diagnosis_codes)
        ? external.diagnosis_codes
        : [external.diagnosis_codes],
      status: mapStatus(external.claim_status),
      denialReason: external.denial_reason,
      submissionDate: formatDate(external.claim_submission_date),
      processingDate: new Date().toISOString(),
      source: 'real',
      sourceId: external.hl7_claim_id
    }
  }

  validate(claim: ExternalClaim): boolean {
    return !!(
      claim.hl7_claim_id &&
      claim.provider_npi &&
      claim.billed_amount !== undefined
    )
  }
}

function formatDOB(hl7Dob: string): string {
  // 19700101 -> 1970-01-01
  if (hl7Dob.length === 8) {
    return `${hl7Dob.substring(0, 4)}-${hl7Dob.substring(4, 6)}-${hl7Dob.substring(6, 8)}`
  }
  return hl7Dob
}

function formatDate(hl7Date: string): string {
  // 2025-01-08 -> 2025-01-08
  return hl7Date
}

function mapStatus(hl7Status: string): string {
  const statusMap: Record<string, string> = {
    'PAID': 'approved',
    'DENIED': 'denied',
    'PENDING': 'pending',
    'PARTIALLY_PAID': 'partial'
  }
  return statusMap[hl7Status] || hl7Status.toLowerCase()
}
```

### Create `server/services/adapters/eraAdapter.ts`

```typescript
import { DataSourceAdapter, ExternalClaim, InternalClaim } from './baseAdapter'

/**
 * Adapter for 835 EOB/ERA (Explanation of Benefits)
 * Handles remittance and appeals data
 */
export class ERAAdapter extends DataSourceAdapter {
  name = 'ERA 835'
  description = '835 Remittance/EOB Format'
  private config: Record<string, any> = {}

  async connect(config: Record<string, any>): Promise<void> {
    this.config = config
    console.log('Connected to ERA source')
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }

  async fetchClaims(options?: any): Promise<ExternalClaim[]> {
    return []
  }

  async fetchAppeals(options?: any): Promise<any[]> {
    // ERA contains remittance data
    // Return structured appeals/outcomes
    return [
      {
        era_id: 'ERA-001',
        claim_id: 'CLM001',
        original_amount: 250.00,
        paid_amount: 200.00,
        adjustment_code: 'PR',
        adjustment_amount: 50.00,
        reason_code: '45', // charge exceeds fee schedule
        processing_date: '2025-01-09'
      }
    ]
  }

  transformClaim(external: ExternalClaim): InternalClaim {
    throw new Error('ERA adapter transforms appeals, not claims')
  }

  validate(claim: ExternalClaim): boolean {
    return !!claim.era_id
  }
}
```

**Day 1 Success**: Adapter framework works, HL7 and ERA adapters built

---

## Day 2: Ingestion Pipeline & Validation

### Create `server/services/ingestionPipeline.ts`

```typescript
import { db } from '~/server/database'
import { claims as claimsTable, claimAppeals } from '~/server/database/schema'
import { DataSourceAdapter, InternalClaim } from './adapters/baseAdapter'

export interface IngestionStats {
  imported: number
  failed: number
  duplicates: number
  errors: Array<{ claim: any; reason: string }>
}

/**
 * Main ingestion pipeline
 * Handles fetching, transforming, validating, and storing claims
 */
export class IngestionPipeline {
  private adapter: DataSourceAdapter
  private stats: IngestionStats = {
    imported: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  }

  constructor(adapter: DataSourceAdapter) {
    this.adapter = adapter
  }

  async ingest(options?: { limit?: number }): Promise<IngestionStats> {
    try {
      // Reset stats
      this.stats = { imported: 0, failed: 0, duplicates: 0, errors: [] }

      // Fetch from source
      const externalClaims = await this.adapter.fetchClaims({
        limit: options?.limit || 100
      })

      // Transform and validate
      for (const external of externalClaims) {
        if (!this.adapter.validate(external)) {
          this.stats.failed++
          this.stats.errors.push({
            claim: external,
            reason: 'Validation failed'
          })
          continue
        }

        try {
          const internal = this.adapter.transformClaim(external)

          // Check for duplicates
          const existing = await db
            .select()
            .from(claimsTable)
            .where(eq(claimsTable.sourceId, internal.sourceId || ''))

          if (existing.length > 0) {
            this.stats.duplicates++
            continue
          }

          // Insert claim
          await db.insert(claimsTable).values({
            id: internal.id,
            providerId: internal.providerId,
            claimType: internal.claimType,
            patientName: internal.patientName,
            patientDob: internal.patientDob,
            patientSex: internal.patientSex,
            memberId: internal.memberId,
            billedAmount: internal.billedAmount,
            paidAmount: internal.paidAmount,
            dateOfService: internal.dateOfService,
            status: internal.status,
            denialReason: internal.denialReason,
            submissionDate: internal.submissionDate,
            processingDate: internal.processingDate,
            source: 'real',
            sourceId: internal.sourceId,
            createdAt: new Date().toISOString()
          }).onConflictDoNothing()

          this.stats.imported++
        } catch (error) {
          this.stats.failed++
          this.stats.errors.push({
            claim: external,
            reason: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return this.stats
    } catch (error) {
      console.error('Ingestion pipeline error:', error)
      throw error
    }
  }

  async ingestAppeals(options?: any): Promise<any> {
    const externalAppeals = await this.adapter.fetchAppeals(options)

    let imported = 0
    for (const appeal of externalAppeals) {
      try {
        // Transform appeal to internal format
        const internalAppeal = {
          id: appeal.id || `APP-${Date.now()}`,
          claimId: appeal.claim_id,
          appealDate: appeal.processing_date,
          appealReason: appeal.reason_text,
          appealStatus: mapAppealStatus(appeal.status),
          createdAt: new Date().toISOString()
        }

        await db
          .insert(claimAppeals)
          .values(internalAppeal)
          .onConflictDoNothing()

        imported++
      } catch (error) {
        console.error('Appeal import error:', error)
      }
    }

    return { imported, total: externalAppeals.length }
  }

  getStats(): IngestionStats {
    return this.stats
  }
}

function mapAppealStatus(status: string): string {
  const mapping: Record<string, string> = {
    'ACCEPTED': 'pending',
    'OVERTURNED': 'overturned',
    'UPHELD': 'upheld'
  }
  return mapping[status] || status
}
```

### Create `server/api/admin/import/start.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { HL7Adapter } from '~/server/services/adapters/hl7Adapter'
import { ERAAdapter } from '~/server/services/adapters/eraAdapter'
import { IngestionPipeline } from '~/server/services/ingestionPipeline'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { sourceType, config, limit } = body

    // Select adapter
    let adapter
    if (sourceType === 'hl7') {
      adapter = new HL7Adapter()
    } else if (sourceType === 'era') {
      adapter = new ERAAdapter()
    } else {
      throw new Error(`Unknown source type: ${sourceType}`)
    }

    // Connect adapter
    await adapter.connect(config)

    // Run pipeline
    const pipeline = new IngestionPipeline(adapter)
    const stats = await pipeline.ingest({ limit })

    await adapter.disconnect()

    return {
      success: true,
      stats,
      sourceType
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
```

**Day 2 Success**: Ingestion pipeline works, real claims can be imported

---

## Day 3: Data Source Management & Dual-Mode Operation

### Create `server/api/admin/sources/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const sources = await db.select().from(dataSources)
    return { data: sources }
  } catch (error) {
    console.error('Sources fetch error:', error)
    return { error: 'Failed to fetch data sources' }
  }
})
```

### Create `server/api/admin/sources/index.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, type, config, enabled } = body

    const source = {
      id: `DS-${Date.now()}`,
      name,
      type,
      config: JSON.stringify(config),
      enabled: enabled !== false,
      createdAt: new Date().toISOString()
    }

    await db.insert(dataSources).values(source)

    return {
      success: true,
      source
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
```

### Create `server/api/admin/sources/[id]/sync.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { db } from '~/server/database'
import { dataSources } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { HL7Adapter } from '~/server/services/adapters/hl7Adapter'
import { IngestionPipeline } from '~/server/services/ingestionPipeline'

export default defineEventHandler(async (event) => {
  try {
    const sourceId = getRouterParam(event, 'id')

    // Get data source config
    const [source] = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, sourceId!))

    if (!source) {
      throw new Error('Data source not found')
    }

    if (!source.enabled) {
      throw new Error('Data source is disabled')
    }

    // Create adapter
    const adapter = new HL7Adapter()
    const config = JSON.parse(source.config)

    // Connect and sync
    await adapter.connect(config)
    const pipeline = new IngestionPipeline(adapter)
    const stats = await pipeline.ingest({ limit: 500 })
    await adapter.disconnect()

    // Update last synced
    await db
      .update(dataSources)
      .set({ lastSynced: new Date().toISOString() })
      .where(eq(dataSources.id, sourceId!))

    return {
      success: true,
      stats,
      sourceId
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
```

### Update database schema to include dataSources table

Add to `server/database/schema.ts`:

```typescript
import { text, integer, boolean } from 'drizzle-orm/sqlite-core'

export const dataSources = sqliteTable('dataSources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'hl7', 'era', 'csv', etc
  config: text('config').notNull(), // JSON stringified config
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  lastSynced: text('lastSynced'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt')
})
```

### Update claims table to track source

Already included in Phase 0, but ensure:

```typescript
export const claims = sqliteTable('claims', {
  // ... existing columns ...
  source: text('source').notNull().default('generated'), // 'generated' or 'real'
  sourceId: text('sourceId'), // external source ID for deduplication
  // ... rest of columns ...
})
```

**Day 3 Success**: Real data sources configurable, sync endpoints working, dual-mode operation enabled

---

## Implementation Checklist

- [ ] Day 1: Adapter framework implemented
- [ ] Day 1: HL7 and ERA adapters working
- [ ] Day 2: Ingestion pipeline transforms and validates
- [ ] Day 2: Duplicate detection working
- [ ] Day 3: Data source management API complete
- [ ] Day 3: Real data imports without breaking generator
- [ ] Day 3: Metrics computed from both sources

## Testing

```bash
# Test adding data source
curl -X POST http://localhost:3000/api/admin/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Clearinghouse",
    "type": "hl7",
    "config": {
      "endpoint": "https://clearinghouse.example.com",
      "apiKey": "secret-key"
    },
    "enabled": true
  }'

# Test syncing
curl -X POST http://localhost:3000/api/admin/sources/{sourceId}/sync

# Verify claims have both sources
sqlite3 provider-portal.db "SELECT source, COUNT(*) FROM claims GROUP BY source;"
```

## Success Criteria

- ✅ Multiple data sources configurable
- ✅ Real claims imported without duplicates
- ✅ Generator and real data coexist
- ✅ Metrics computed from both sources
- ✅ Data source management UI ready
- ✅ No loss of generated data functionality

## Commits

```
git commit -m "Phase 3 Day 1: Data source adapter framework"
git commit -m "Phase 3 Day 2: Ingestion pipeline with validation"
git commit -m "Phase 3 Day 3: Data source management and dual-mode operation"
```

---

**Next Phase**: Phase 4 (Analytics & Reporting) builds comprehensive dashboards and reporting

Good luck! This phase enables real enterprise integration.
