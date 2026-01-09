# Mock Data Database Summary

**Version**: 1.0.0
**Last Updated**: January 9, 2026
**Status**: Active
**Database File**: `provider-portal.db` (SQLite)

## Overview

A comprehensive SQLite database (`provider-portal.db`) has been created using **Drizzle ORM** to replace the current JSON-based mock data files stored in `public/data/`. This database provides a production-ready schema that mirrors the PaAPI backend structure and enables efficient querying, relational operations, and data integrity through foreign keys.

## Architecture

### Technology Stack
- **Database**: SQLite (provider-portal.db)
- **ORM**: Drizzle ORM with better-sqlite3 driver
- **Configuration**: `drizzle.config.ts`
- **Schema Definition**: `server/database/schema.ts`
- **Initialization**: `server/database/init.ts`
- **Client**: `server/database/index.ts`

### Database Location
- **Path**: Project root → `provider-portal.db`
- **Access**: TypeScript via `server/database/index.ts`
- **Foreign Keys**: Enabled by default (`PRAGMA foreign_keys = ON`)

## Schema Overview

### 1. CLAIMS (Core Data)

**Table**: `claims`

Represents individual healthcare claims submitted by providers.

**Key Fields**:
- `id` (TEXT, PK): Claim identifier (e.g., "CLM-2024-1001")
- `providerId` (TEXT, FK): Links to provider
- `claimType` (TEXT): 'Professional' | 'Institutional' | 'Dental' | 'Pharmacy'
- `patientName` (TEXT): Patient identifier
- `patientDob` (TEXT): Date of birth
- `patientSex` (TEXT): 'male' | 'female' | 'unknown'
- `memberId` (TEXT): Insurance member ID
- `memberGroupId` (TEXT): Group plan ID
- `dateOfService` (TEXT): ISO date of service
- `dateOfServiceEnd` (TEXT): Service end date (for ranges)
- `billedAmount` (REAL): Total billed amount
- `paidAmount` (REAL): Amount approved and paid
- `status` (TEXT): 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'
- `denialReason` (TEXT): Explanation if denied
- `appealStatus` (TEXT): Status of appeal if filed
- `submissionDate` (TEXT): When claim was submitted
- `processingDate` (TEXT): When claim was processed
- `aiInsight` (JSON): AI-generated explanation and guidance

**Related Tables**: line items, diagnosis codes, procedure codes, policies, patterns

**Indexes**:
- `idx_claims_status`: For status filtering
- `idx_claims_date_of_service`: For date range queries
- `idx_claims_provider_id`: For provider lookups

---

### 2. CLAIM LINE ITEMS (Detail Level)

**Table**: `claim_line_items`

Individual line items within a claim (each claim can have multiple services).

**Key Fields**:
- `id` (INTEGER, PK): Auto-increment identifier
- `claimId` (TEXT, FK): Parent claim
- `lineNumber` (INTEGER): Sequence number within claim
- `procedureCode` (TEXT): CPT/HCPCS code
- `ndcCode` (TEXT): National Drug Code (if pharmacy)
- `placeOfService` (TEXT): Where service was provided
- `units` (INTEGER): Quantity of service
- `billedAmount` (REAL): Amount billed for this line
- `paidAmount` (REAL): Amount paid for this line
- `renderingProviderName` (TEXT): Provider who performed service
- `renderingProviderNpi` (TEXT): NPI of rendering provider
- `status` (TEXT): Status of this specific line item
- `parIndicator` (BOOLEAN): Whether PAR agreement applies
- `bypassCode` (TEXT): Any billing bypass codes

**Related Tables**: modifiers, diagnosis codes

**Indexes**:
- `idx_claim_line_unique`: Ensures unique line per claim

---

### 3. CLAIM CODES (Junction Tables)

**Tables**:
- `claim_diagnosis_codes`: Maps diagnosis codes to claims
- `claim_procedure_codes`: Maps procedure codes to claims
- `line_item_modifiers`: Maps modifiers to line items
- `line_item_diagnosis_codes`: Maps diagnosis codes to line items

**Purpose**: Normalize many-to-many relationships between claims/line items and their associated medical codes.

---

### 4. POLICIES (Coverage Rules)

**Table**: `policies`

Healthcare coverage policies and decision rules from payers.

**Key Fields**:
- `id` (TEXT, PK): Policy identifier
- `name` (TEXT): Policy title (e.g., "DME Prior Authorization Required")
- `mode` (TEXT): 'Edit' | 'Informational' | 'Pay & Advise'
- `effectiveDate` (TEXT): When policy starts
- `description` (TEXT): What the policy covers
- `clinicalRationale` (TEXT): Clinical justification
- `topic` (TEXT): Category/topic area
- `logicType` (TEXT): Type of rule (age, frequency, coverage, etc.)
- `source` (TEXT): Origin of policy (CMS, Payer, State, AMA, etc.)
- `hitRate` (REAL): % of claims affected
- `denialRate` (REAL): % denied due to this policy
- `appealRate` (REAL): % of denials appealed
- `overturnRate` (REAL): % of appeals overturned
- `impact` (REAL): Financial impact of this policy
- `commonMistake` (TEXT): How providers typically violate this
- `fixGuidance` (TEXT): How to comply
- `ageRestrictions` (JSON): {min, max} age ranges if applicable
- `frequencyLimits` (JSON): {count, period} if frequency-based

**Related Tables**: procedure codes, diagnosis codes, modifiers, places of service, reference docs, related policies, claims, patterns

---

### 5. POLICY CODES (Junction Tables)

**Tables**:
- `policy_procedure_codes`: Procedures governed by policy
- `policy_diagnosis_codes`: Diagnosis codes affected
- `policy_modifiers`: Modifiers required/prohibited
- `policy_places_of_service`: Service locations affected

**Purpose**: Define which codes/modifiers/locations are affected by each policy.

---

### 6. REFERENCE DOCUMENTATION

**Table**: `policy_reference_docs`

Supporting documentation and sources for policies.

**Fields**:
- `id` (INTEGER, PK): Auto-increment
- `policyId` (TEXT, FK): Parent policy
- `title` (TEXT): Document title
- `url` (TEXT): Link to documentation
- `source` (TEXT): Source organization

---

### 7. PATTERNS (Denial Patterns / Insights)

**Table**: `patterns`

Detected recurring denial patterns that represent learning opportunities.

**Key Fields**:
- `id` (TEXT, PK): Pattern identifier
- `title` (TEXT): Pattern title (e.g., "Missing Modifier 25 on E&M")
- `description` (TEXT): Detailed explanation
- `category` (TEXT): 'modifier-missing' | 'code-mismatch' | 'documentation' | 'authorization' | 'billing-error' | 'timing' | 'coding-specificity' | 'medical-necessity'
- `status` (TEXT): 'active' | 'improving' | 'resolved' | 'archived'
- `tier` (TEXT): 'critical' | 'high' | 'medium' | 'low' (priority level)
- **Score Metrics**:
  - `scoreFrequency` (INTEGER): How often pattern occurs
  - `scoreImpact` (REAL): Financial impact
  - `scoreTrend` (TEXT): 'up' | 'down' | 'stable'
  - `scoreVelocity` (REAL): Rate of change
  - `scoreConfidence` (REAL): Confidence in pattern detection
  - `scoreRecency` (INTEGER): How recent pattern is
- **Financial Metrics**:
  - `avgDenialAmount` (REAL): Average denial per occurrence
  - `totalAtRisk` (REAL): Total potential revenue recovery
- **Learning Metrics**:
  - `learningProgress` (INTEGER): 0-100% learning progress
  - `practiceSessionsCompleted` (INTEGER): # of practice sessions
  - `correctionsApplied` (INTEGER): # of corrections made
- `suggestedAction` (TEXT): Recommended fix
- `firstDetected` (TEXT): When pattern first appeared
- `lastSeen` (TEXT): Most recent occurrence
- `lastUpdated` (TEXT): Last metadata update

**Related Tables**: claims, policies, related codes, evidence, improvements, actions

**Indexes**:
- `idx_patterns_status`: Filter by status
- `idx_patterns_tier`: Filter by priority
- `idx_patterns_category`: Filter by type

---

### 8. PATTERN RELATIONSHIPS

**Tables**:
- `pattern_claims`: Links patterns to specific denied claims
- `pattern_policies`: Links patterns to relevant policies
- `pattern_related_codes`: Lists procedure/diagnosis codes involved

**Purpose**: Establish relationships between patterns, claims, and policies for evidence and context.

---

### 9. PATTERN EVIDENCE

**Table**: `pattern_evidence`

Individual claim instances that demonstrate a pattern.

**Fields**:
- `id` (INTEGER, PK): Auto-increment
- `patternId` (TEXT, FK): Parent pattern
- `claimId` (TEXT): Claim that exemplifies pattern
- `denialDate` (TEXT): When denial occurred
- `denialReason` (TEXT): Specific denial reason
- `procedureCode` (TEXT): Code involved
- `modifier` (TEXT): Missing/incorrect modifier
- `billedAmount` (REAL): Amount involved

**Purpose**: Audit trail showing which claims support each pattern.

---

### 10. PATTERN IMPROVEMENTS

**Table**: `pattern_improvements`

Tracks improvement metrics over time as providers learn and correct behaviors.

**Fields**:
- `id` (INTEGER, PK): Auto-increment
- `patternId` (TEXT, FK): Pattern being improved
- `date` (TEXT): Date of measurement
- `metric` (TEXT): Which metric changed (denialRate, frequency, etc.)
- `beforeValue` (REAL): Value before improvement
- `afterValue` (REAL): Value after improvement
- `percentChange` (REAL): % improvement
- `trigger` (TEXT): What triggered the improvement (learning event, SOP change, etc.)

**Purpose**: Time-series data showing progress on pattern resolution.

---

### 11. PATTERN ACTIONS

**Table**: `pattern_actions`

User actions taken in response to patterns.

**Fields**:
- `id` (TEXT, PK): Action identifier
- `patternId` (TEXT, FK): Pattern addressed
- `actionType` (TEXT): 'resubmission' | 'future_practice' | 'workflow_update' | 'staff_training' | 'system_config'
- `notes` (TEXT): Action details
- `timestamp` (TEXT): When action was taken

**Purpose**: Track provider interventions and learning activities.

---

### 12. PROVIDERS

**Table**: `providers`

Healthcare provider organizations and individuals.

**Fields**:
- `id` (TEXT, PK): Provider identifier
- `name` (TEXT): Provider name
- `specialty` (TEXT): Medical specialty
- `npi` (TEXT): National Provider Identifier
- `tin` (TEXT): Tax ID number
- `taxonomy` (TEXT): Medical taxonomy code
- `createdAt` (TEXT): Record creation timestamp

**Purpose**: Provider profile and identification.

---

### 13. LEARNING EVENTS (Analytics)

**Table**: `learning_events`

User interaction events for engagement tracking and analytics.

**Fields**:
- `id` (TEXT, PK): Event identifier
- `timestamp` (TEXT): When event occurred
- `type` (TEXT): Type of event (session_started, dashboard_viewed, pattern_viewed, claim_edited, etc.)
- `context` (TEXT): Where event occurred ('dashboard' | 'claims' | 'insights' | 'claim-lab' | 'impact' | 'policies')
- `userId` (TEXT): User who triggered event
- `sessionId` (TEXT): User session identifier
- `deviceType` (TEXT): 'desktop' | 'mobile' | 'tablet'
- `metadata` (JSON): Additional event details

**Indexes**:
- `idx_learning_events_timestamp`: Time-series queries
- `idx_learning_events_type`: Event type filtering

**Purpose**: User engagement tracking for learning analytics and behavior correlation.

---

## Relationships & Foreign Keys

```
providers (1) ──→ (Many) claims
         ↓
      claims (1) ──→ (Many) claim_line_items
                        ↓
                  line_item_modifiers
                  line_item_diagnosis_codes
    
    claims (Many) ←──→ (Many) policies
            ↓ (via pattern_claims)
       patterns (1) ──→ (Many) pattern_evidence
                              pattern_improvements
                              pattern_actions
    
    patterns (Many) ←──→ (Many) policies
            (via pattern_policies)
    
    policies (1) ──→ (Many) policy_procedure_codes
                           policy_diagnosis_codes
                           policy_modifiers
                           policy_places_of_service
                           policy_reference_docs
```

## Data Integrity Features

1. **Foreign Keys**: All relationships enforced at database level
2. **Cascading Deletes**: Deleting a pattern cascades to evidence, improvements, actions
3. **Primary Keys**: All tables have primary keys (auto-increment or text)
4. **Unique Constraints**: Prevent duplicate entries in junction tables
5. **Indexes**: Performance optimization on frequently queried fields

## Current Mock Data Status

The database has been **initialized** with an empty schema ready to receive data. The current application still uses JSON files in `public/data/`:

- `claims.json`: 100+ claims
- `patterns.json`: 7 patterns with evidence
- `policies.json`: 20 policies
- `insights.json`: Insight correlations
- `learningEvents.json`: 100+ events
- `codeIntelligence.json`: 7 codes with requirements
- `providers.json`: 3-5 providers
- `learningMarkers.json`: Learning activity tracking

## Migration Path

To transition from JSON to database:

1. **Data Import**: Load JSON files into corresponding database tables
2. **Relationship Mapping**: Create junction table entries for many-to-many relationships
3. **Application Updates**: Replace JSON imports with database queries
4. **Performance Testing**: Validate query performance and optimize indexes
5. **Transition**: Switch application to read from database instead of JSON

## Access Pattern

### Current (JSON)
```typescript
import patternsData from '@/public/data/patterns.json'
import claimsData from '@/public/data/claims.json'
```

### Future (Database)
```typescript
import { db, patterns, claims } from '@/server/database'

const allPatterns = await db.select().from(patterns)
const claimsByStatus = await db.select()
  .from(claims)
  .where(eq(claims.status, 'denied'))
```

## Files

### Schema & Configuration
- [drizzle.config.ts](drizzle.config.ts) - Drizzle ORM configuration
- [server/database/schema.ts](server/database/schema.ts) - Drizzle schema definition (Typescript)
- [server/database/init.ts](server/database/init.ts) - Database initialization script
- [server/database/index.ts](server/database/index.ts) - Database client and exports

### Running

Initialize the database:
```bash
npx tsx server/database/init.ts
```

This creates `provider-portal.db` with all tables and indexes.

## Next Steps

1. **Seed Data**: Populate tables with mock data from JSON files
2. **Query API**: Create server endpoints that query the database
3. **Application Integration**: Update components to use database instead of JSON
4. **Performance Optimization**: Add indexes and optimize queries as needed
5. **Real Data Integration**: Replace mock data with actual PaAPI data feed

## Key Advantages Over JSON Files

✅ **Relational Integrity**: Foreign keys prevent orphaned data
✅ **Query Performance**: Indexes enable fast filtering and sorting
✅ **Scalability**: SQLite handles large datasets efficiently
✅ **Data Consistency**: No duplicate data across multiple JSON files
✅ **Production Ready**: Mirrors PaAPI backend schema
✅ **Transactional Safety**: Database transactions prevent partial updates
✅ **Audit Trail**: Learning events and pattern evidence create complete audit
✅ **Extensibility**: Easy to add new tables/relationships without refactoring

## Design Principles

1. **PaAPI Alignment**: Schema mirrors production backend for minimal future rework
2. **Relational Normalization**: No redundant data; all relationships explicit
3. **Audit Trail**: Every action (pattern improvement, learning event, action taken) is recorded
4. **Temporal Tracking**: All key entities have timestamps for time-series analysis
5. **Hierarchical Scoring**: Pattern severity determined by frequency + impact + recency
6. **Evidence-Based**: Patterns linked to specific claims that support them
