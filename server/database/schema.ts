/**
 * Drizzle ORM Schema - PaAPI Compatible
 *
 * This schema mirrors the data structures used by console-ui's PaAPI backend.
 * Designed for minimal rework when connecting to the actual PaAPI database.
 */

import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// =============================================================================
// SCENARIOS
// =============================================================================

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  timelineStart: text('timeline_start').notNull(),
  timelineEnd: text('timeline_end').notNull(),
  config: text('config', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  activeIdx: index('idx_scenarios_active').on(table.isActive),
}))

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  claims: many(claims),
  providers: many(providers),
  patterns: many(patterns),
  learningEvents: many(learningEvents),
}))

// =============================================================================
// CLAIMS
// =============================================================================

export const claims = sqliteTable('claims', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull(),
  scenarioId: text('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }),

  // Claim Type
  claimType: text('claim_type', {
    enum: ['Professional', 'Institutional', 'Dental', 'Pharmacy']
  }),

  // Patient Information
  patientName: text('patient_name').notNull(),
  patientDob: text('patient_dob'),
  patientSex: text('patient_sex', { enum: ['male', 'female', 'unknown'] }),
  memberId: text('member_id'),
  memberGroupId: text('member_group_id'),

  // Service Dates
  dateOfService: text('date_of_service').notNull(),
  dateOfServiceEnd: text('date_of_service_end'),

  // Billing Information
  billedAmount: real('billed_amount').notNull(),
  paidAmount: real('paid_amount').default(0),

  // Provider Details
  providerName: text('provider_name'),
  billingProviderTin: text('billing_provider_tin'),
  billingProviderNpi: text('billing_provider_npi'),
  billingProviderTaxonomy: text('billing_provider_taxonomy'),

  // Authorization
  priorAuthNumber: text('prior_auth_number'),
  ltssIndicator: integer('ltss_indicator', { mode: 'boolean' }),
  parIndicator: integer('par_indicator', { mode: 'boolean' }),

  // Status & Decision
  status: text('status', {
    enum: ['approved', 'denied', 'pending', 'appealed', 'paid']
  }).notNull(),
  denialReason: text('denial_reason'),

  // Appeal
  appealStatus: text('appeal_status'),
  appealDate: text('appeal_date'),

  // Timestamps
  submissionDate: text('submission_date'),
  processingDate: text('processing_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),

  // AI Insight (JSON stored as text)
  aiInsight: text('ai_insight', { mode: 'json' }).$type<{
    explanation: string
    guidance: string
  } | null>(),
}, (table) => ({
  statusIdx: index('idx_claims_status').on(table.status),
  dateOfServiceIdx: index('idx_claims_date_of_service').on(table.dateOfService),
  providerIdIdx: index('idx_claims_provider_id').on(table.providerId),
  scenarioIdx: index('idx_claims_scenario').on(table.scenarioId),
}))

export const claimsRelations = relations(claims, ({ one, many }) => ({
  scenario: one(scenarios, {
    fields: [claims.scenarioId],
    references: [scenarios.id],
  }),
  lineItems: many(claimLineItems),
  diagnosisCodes: many(claimDiagnosisCodes),
  procedureCodes: many(claimProcedureCodes),
  policies: many(claimPolicies),
  patterns: many(patternClaims),
  appeals: many(claimAppeals),
}))

// =============================================================================
// CLAIM LINE ITEMS
// =============================================================================

export const claimLineItems = sqliteTable('claim_line_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),

  // Service Dates (can override claim-level)
  dateOfService: text('date_of_service'),
  dateOfServiceEnd: text('date_of_service_end'),

  // Codes
  procedureCode: text('procedure_code').notNull(),
  ndcCode: text('ndc_code'),
  placeOfService: text('place_of_service'),

  // Amounts
  units: integer('units').default(1),
  unitsType: text('units_type').default('UN'),
  billedAmount: real('billed_amount').notNull(),
  paidAmount: real('paid_amount').default(0),

  // Rendering Provider
  renderingProviderName: text('rendering_provider_name'),
  renderingProviderNpi: text('rendering_provider_npi'),
  renderingProviderTaxonomy: text('rendering_provider_taxonomy'),

  // Status & Indicators
  status: text('status'),
  parIndicator: integer('par_indicator', { mode: 'boolean' }),
  bypassCode: text('bypass_code'),
}, (table) => ({
  claimLineUnique: index('idx_claim_line_unique').on(table.claimId, table.lineNumber),
}))

export const claimLineItemsRelations = relations(claimLineItems, ({ one, many }) => ({
  claim: one(claims, {
    fields: [claimLineItems.claimId],
    references: [claims.id],
  }),
  modifiers: many(lineItemModifiers),
  diagnosisCodes: many(lineItemDiagnosisCodes),
}))

// =============================================================================
// CLAIM CODES (Junction Tables)
// =============================================================================

export const claimDiagnosisCodes = sqliteTable('claim_diagnosis_codes', {
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  sequence: integer('sequence').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.claimId, table.code] }),
}))

export const claimDiagnosisCodesRelations = relations(claimDiagnosisCodes, ({ one }) => ({
  claim: one(claims, {
    fields: [claimDiagnosisCodes.claimId],
    references: [claims.id],
  }),
}))

export const claimProcedureCodes = sqliteTable('claim_procedure_codes', {
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.claimId, table.code] }),
}))

export const claimProcedureCodesRelations = relations(claimProcedureCodes, ({ one }) => ({
  claim: one(claims, {
    fields: [claimProcedureCodes.claimId],
    references: [claims.id],
  }),
}))

// =============================================================================
// LINE ITEM CODES (Junction Tables)
// =============================================================================

export const lineItemModifiers = sqliteTable('line_item_modifiers', {
  lineItemId: integer('line_item_id').notNull().references(() => claimLineItems.id, { onDelete: 'cascade' }),
  modifier: text('modifier').notNull(),
  sequence: integer('sequence').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.lineItemId, table.modifier] }),
}))

export const lineItemModifiersRelations = relations(lineItemModifiers, ({ one }) => ({
  lineItem: one(claimLineItems, {
    fields: [lineItemModifiers.lineItemId],
    references: [claimLineItems.id],
  }),
}))

export const lineItemDiagnosisCodes = sqliteTable('line_item_diagnosis_codes', {
  lineItemId: integer('line_item_id').notNull().references(() => claimLineItems.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  sequence: integer('sequence').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.lineItemId, table.code] }),
}))

export const lineItemDiagnosisCodesRelations = relations(lineItemDiagnosisCodes, ({ one }) => ({
  lineItem: one(claimLineItems, {
    fields: [lineItemDiagnosisCodes.lineItemId],
    references: [claimLineItems.id],
  }),
}))

// =============================================================================
// POLICIES
// =============================================================================

export const policies = sqliteTable('policies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mode: text('mode', { enum: ['Edit', 'Informational', 'Pay & Advise'] }).notNull(),
  effectiveDate: text('effective_date').notNull(),
  description: text('description'),
  clinicalRationale: text('clinical_rationale'),
  topic: text('topic'),
  logicType: text('logic_type'),
  source: text('source'),

  // Metrics
  hitRate: real('hit_rate').default(0),
  denialRate: real('denial_rate').default(0),
  appealRate: real('appeal_rate').default(0),
  overturnRate: real('overturn_rate').default(0),
  impact: real('impact').default(0),
  insightCount: integer('insight_count').default(0),
  providersImpacted: integer('providers_impacted').default(0),
  trend: text('trend', { enum: ['up', 'down', 'stable'] }),

  // Guidance
  commonMistake: text('common_mistake'),
  fixGuidance: text('fix_guidance'),

  // Applicability Rules (JSON)
  ageRestrictions: text('age_restrictions', { mode: 'json' }).$type<{
    min?: number
    max?: number
  } | null>(),
  frequencyLimits: text('frequency_limits', { mode: 'json' }).$type<{
    count: number
    period: string
  } | null>(),

  // Learning Tracking
  learningMarkersCount: integer('learning_markers_count').default(0),
  recentTests: integer('recent_tests').default(0),

  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const policiesRelations = relations(policies, ({ many }) => ({
  procedureCodes: many(policyProcedureCodes),
  diagnosisCodes: many(policyDiagnosisCodes),
  modifiers: many(policyModifiers),
  placesOfService: many(policyPlacesOfService),
  referenceDocs: many(policyReferenceDocs),
  relatedPolicies: many(policyRelatedPolicies),
  claims: many(claimPolicies),
  patterns: many(patternPolicies),
}))

// =============================================================================
// POLICY CODES (Junction Tables)
// =============================================================================

export const policyProcedureCodes = sqliteTable('policy_procedure_codes', {
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.policyId, table.code] }),
}))

export const policyProcedureCodesRelations = relations(policyProcedureCodes, ({ one }) => ({
  policy: one(policies, {
    fields: [policyProcedureCodes.policyId],
    references: [policies.id],
  }),
}))

export const policyDiagnosisCodes = sqliteTable('policy_diagnosis_codes', {
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.policyId, table.code] }),
}))

export const policyDiagnosisCodesRelations = relations(policyDiagnosisCodes, ({ one }) => ({
  policy: one(policies, {
    fields: [policyDiagnosisCodes.policyId],
    references: [policies.id],
  }),
}))

export const policyModifiers = sqliteTable('policy_modifiers', {
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  modifier: text('modifier').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.policyId, table.modifier] }),
}))

export const policyModifiersRelations = relations(policyModifiers, ({ one }) => ({
  policy: one(policies, {
    fields: [policyModifiers.policyId],
    references: [policies.id],
  }),
}))

export const policyPlacesOfService = sqliteTable('policy_places_of_service', {
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  placeOfService: text('place_of_service').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.policyId, table.placeOfService] }),
}))

export const policyPlacesOfServiceRelations = relations(policyPlacesOfService, ({ one }) => ({
  policy: one(policies, {
    fields: [policyPlacesOfService.policyId],
    references: [policies.id],
  }),
}))

export const policyReferenceDocs = sqliteTable('policy_reference_docs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  source: text('source'),
})

export const policyReferenceDocsRelations = relations(policyReferenceDocs, ({ one }) => ({
  policy: one(policies, {
    fields: [policyReferenceDocs.policyId],
    references: [policies.id],
  }),
}))

export const policyRelatedPolicies = sqliteTable('policy_related_policies', {
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  relatedPolicyId: text('related_policy_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.policyId, table.relatedPolicyId] }),
}))

export const policyRelatedPoliciesRelations = relations(policyRelatedPolicies, ({ one }) => ({
  policy: one(policies, {
    fields: [policyRelatedPolicies.policyId],
    references: [policies.id],
  }),
}))

// =============================================================================
// CLAIM-POLICY RELATIONSHIPS
// =============================================================================

export const claimPolicies = sqliteTable('claim_policies', {
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  triggeredAt: text('triggered_at').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  pk: primaryKey({ columns: [table.claimId, table.policyId] }),
  policyIdx: index('idx_claim_policies_policy').on(table.policyId),
}))

export const claimPoliciesRelations = relations(claimPolicies, ({ one }) => ({
  claim: one(claims, {
    fields: [claimPolicies.claimId],
    references: [claims.id],
  }),
  policy: one(policies, {
    fields: [claimPolicies.policyId],
    references: [policies.id],
  }),
}))

// =============================================================================
// PATTERNS (Insights)
// =============================================================================

export const patterns = sqliteTable('patterns', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  scenarioId: text('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }),
  category: text('category', {
    enum: [
      'modifier-missing',
      'code-mismatch',
      'documentation',
      'authorization',
      'billing-error',
      'timing',
      'coding-specificity',
      'medical-necessity'
    ]
  }).notNull(),
  status: text('status', {
    enum: ['active', 'improving', 'resolved', 'archived']
  }).notNull(),
  tier: text('tier', {
    enum: ['critical', 'high', 'medium', 'low']
  }).notNull(),

  // Score Metrics
  scoreFrequency: integer('score_frequency').default(0),
  scoreImpact: real('score_impact').default(0),
  scoreTrend: text('score_trend', { enum: ['up', 'down', 'stable'] }),
  scoreVelocity: real('score_velocity').default(0),
  scoreConfidence: real('score_confidence').default(0),
  scoreRecency: integer('score_recency').default(0),

  // Financial Metrics
  avgDenialAmount: real('avg_denial_amount').default(0),
  totalAtRisk: real('total_at_risk').default(0),

  // Learning Metrics
  learningProgress: integer('learning_progress').default(0),
  practiceSessionsCompleted: integer('practice_sessions_completed').default(0),
  correctionsApplied: integer('corrections_applied').default(0),

  // Guidance
  suggestedAction: text('suggested_action'),

  // Baseline period metrics (captured when pattern first detected)
  baselineStart: text('baseline_start'),
  baselineEnd: text('baseline_end'),
  baselineClaimCount: integer('baseline_claim_count'),
  baselineDeniedCount: integer('baseline_denied_count'),
  baselineDenialRate: real('baseline_denial_rate'),
  baselineDollarsDenied: real('baseline_dollars_denied'),

  // Current period metrics (most recent measurement)
  currentStart: text('current_start'),
  currentEnd: text('current_end'),
  currentClaimCount: integer('current_claim_count'),
  currentDeniedCount: integer('current_denied_count'),
  currentDenialRate: real('current_denial_rate'),
  currentDollarsDenied: real('current_dollars_denied'),

  // Timestamps
  firstDetected: text('first_detected'),
  lastSeen: text('last_seen'),
  lastUpdated: text('last_updated').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  statusIdx: index('idx_patterns_status').on(table.status),
  tierIdx: index('idx_patterns_tier').on(table.tier),
  categoryIdx: index('idx_patterns_category').on(table.category),
  scenarioIdx: index('idx_patterns_scenario').on(table.scenarioId),
}))

export const patternsRelations = relations(patterns, ({ one, many }) => ({
  scenario: one(scenarios, {
    fields: [patterns.scenarioId],
    references: [scenarios.id],
  }),
  claims: many(patternClaims),
  policies: many(patternPolicies),
  relatedCodes: many(patternRelatedCodes),
  evidence: many(patternEvidence),
  improvements: many(patternImprovements),
  actions: many(patternActions),
  snapshots: many(patternSnapshots),
}))

// =============================================================================
// PATTERN RELATIONSHIPS
// =============================================================================

export const patternClaims = sqliteTable('pattern_claims', {
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.patternId, table.claimId] }),
  claimIdx: index('idx_pattern_claims_claim').on(table.claimId),
}))

export const patternClaimsRelations = relations(patternClaims, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternClaims.patternId],
    references: [patterns.id],
  }),
  claim: one(claims, {
    fields: [patternClaims.claimId],
    references: [claims.id],
  }),
}))

export const patternPolicies = sqliteTable('pattern_policies', {
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  policyId: text('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.patternId, table.policyId] }),
}))

export const patternPoliciesRelations = relations(patternPolicies, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternPolicies.patternId],
    references: [patterns.id],
  }),
  policy: one(policies, {
    fields: [patternPolicies.policyId],
    references: [policies.id],
  }),
}))

export const patternRelatedCodes = sqliteTable('pattern_related_codes', {
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.patternId, table.code] }),
}))

export const patternRelatedCodesRelations = relations(patternRelatedCodes, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternRelatedCodes.patternId],
    references: [patterns.id],
  }),
}))

// =============================================================================
// PATTERN EVIDENCE
// =============================================================================

export const patternEvidence = sqliteTable('pattern_evidence', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  claimId: text('claim_id').notNull(),
  denialDate: text('denial_date'),
  denialReason: text('denial_reason'),
  procedureCode: text('procedure_code'),
  modifier: text('modifier'),
  billedAmount: real('billed_amount'),
})

export const patternEvidenceRelations = relations(patternEvidence, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternEvidence.patternId],
    references: [patterns.id],
  }),
}))

// =============================================================================
// PATTERN IMPROVEMENTS
// =============================================================================

export const patternImprovements = sqliteTable('pattern_improvements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  metric: text('metric').notNull(),
  beforeValue: real('before_value'),
  afterValue: real('after_value'),
  percentChange: real('percent_change'),
  trigger: text('trigger'),
})

export const patternImprovementsRelations = relations(patternImprovements, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternImprovements.patternId],
    references: [patterns.id],
  }),
}))

// =============================================================================
// PATTERN ACTIONS
// =============================================================================

export const patternActions = sqliteTable('pattern_actions', {
  id: text('id').primaryKey(),
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  actionType: text('action_type').notNull(),
  notes: text('notes'),
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP'),
})

export const patternActionsRelations = relations(patternActions, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternActions.patternId],
    references: [patterns.id],
  }),
}))

// =============================================================================
// PROVIDERS
// =============================================================================

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  specialty: text('specialty'),
  npi: text('npi'),
  tin: text('tin'),
  taxonomy: text('taxonomy'),
  scenarioId: text('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  scenarioIdx: index('idx_providers_scenario').on(table.scenarioId),
}))

export const providersRelations = relations(providers, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [providers.scenarioId],
    references: [scenarios.id],
  }),
}))

// =============================================================================
// LEARNING EVENTS (Analytics)
// =============================================================================

export const learningEvents = sqliteTable('learning_events', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  type: text('type').notNull(),
  context: text('context', {
    enum: ['dashboard', 'claims', 'insights', 'claim-lab', 'impact', 'policies']
  }),
  userId: text('user_id'),
  sessionId: text('session_id'),
  deviceType: text('device_type', { enum: ['desktop', 'mobile', 'tablet'] }),
  scenarioId: text('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
}, (table) => ({
  timestampIdx: index('idx_learning_events_timestamp').on(table.timestamp),
  typeIdx: index('idx_learning_events_type').on(table.type),
  scenarioIdx: index('idx_learning_events_scenario').on(table.scenarioId),
}))

export const learningEventsRelations = relations(learningEvents, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [learningEvents.scenarioId],
    references: [scenarios.id],
  }),
}))

// =============================================================================
// PATTERN SNAPSHOTS (Time-Series Data)
// =============================================================================

export const patternSnapshots = sqliteTable('pattern_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patternId: text('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  snapshotDate: text('snapshot_date').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  claimCount: integer('claim_count').default(0),
  deniedCount: integer('denied_count').default(0),
  denialRate: real('denial_rate'),
  dollarsDenied: real('dollars_denied').default(0),
  dollarsAtRisk: real('dollars_at_risk').default(0),
  appealCount: integer('appeal_count').default(0),
  appealRate: real('appeal_rate'),
}, (table) => ({
  patternDateIdx: index('idx_pattern_snapshots_pattern_date').on(table.patternId, table.snapshotDate),
}))

export const patternSnapshotsRelations = relations(patternSnapshots, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternSnapshots.patternId],
    references: [patterns.id],
  }),
}))

// =============================================================================
// CLAIM APPEALS
// =============================================================================

export const claimAppeals = sqliteTable('claim_appeals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  claimId: text('claim_id').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number'),
  appealFiled: integer('appeal_filed', { mode: 'boolean' }).default(false),
  appealDate: text('appeal_date'),
  appealReason: text('appeal_reason'),
  appealOutcome: text('appeal_outcome', {
    enum: ['pending', 'upheld', 'overturned']
  }),
  outcomeDate: text('outcome_date'),
  outcomeNotes: text('outcome_notes'),
}, (table) => ({
  claimIdx: index('idx_claim_appeals_claim').on(table.claimId),
  outcomeIdx: index('idx_claim_appeals_outcome').on(table.appealOutcome),
}))

export const claimAppealsRelations = relations(claimAppeals, ({ one }) => ({
  claim: one(claims, {
    fields: [claimAppeals.claimId],
    references: [claims.id],
  }),
}))
