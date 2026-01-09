-- Additional Indexes for Performance Optimization
-- Run this after initial schema setup to add composite indexes
-- for frequently executed queries

-- Composite indexes for common claim queries
CREATE INDEX IF NOT EXISTS idx_claims_status_date
  ON claims(status, date_of_service);

CREATE INDEX IF NOT EXISTS idx_claims_provider_status
  ON claims(provider_id, status);

CREATE INDEX IF NOT EXISTS idx_claims_date_denial
  ON claims(date_of_service, denial_reason);

CREATE INDEX IF NOT EXISTS idx_claims_submission_date
  ON claims(submission_date);

CREATE INDEX IF NOT EXISTS idx_claims_billed_amount
  ON claims(billed_amount);

-- Index for denial reason lookups
CREATE INDEX IF NOT EXISTS idx_claims_denial_reason
  ON claims(denial_reason)
  WHERE denial_reason IS NOT NULL;

-- Composite index for pattern analysis
CREATE INDEX IF NOT EXISTS idx_pattern_claims_pattern_claim
  ON pattern_claims(pattern_id, claim_id);

-- Index for learning events by context
CREATE INDEX IF NOT EXISTS idx_learning_events_context
  ON learning_events(context);

CREATE INDEX IF NOT EXISTS idx_learning_events_type_timestamp
  ON learning_events(type, timestamp);

-- Index for pattern snapshots analysis
CREATE INDEX IF NOT EXISTS idx_pattern_snapshots_date
  ON pattern_snapshots(snapshot_date);

-- Index for import history lookups
CREATE INDEX IF NOT EXISTS idx_import_history_started_at
  ON import_history(started_at);

-- Index for appeals by date
CREATE INDEX IF NOT EXISTS idx_claim_appeals_appeal_date
  ON claim_appeals(appeal_date);

-- Index for policies by mode
CREATE INDEX IF NOT EXISTS idx_policies_mode
  ON policies(mode);

CREATE INDEX IF NOT EXISTS idx_policies_effective_date
  ON policies(effective_date);

-- Analyze table statistics for query optimizer
ANALYZE;
