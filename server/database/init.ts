/**
 * Database Initialization Script
 *
 * Creates the SQLite database and all tables.
 * Run with: npx tsx server/database/init.ts
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { sql } from 'drizzle-orm'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'provider-portal.db')

console.log('Initializing database at:', DB_PATH)

// Create SQLite connection
const sqlite = new Database(DB_PATH)
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite)

// Create all tables
const statements = `
-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY NOT NULL,
  provider_id TEXT NOT NULL,
  claim_type TEXT,
  patient_name TEXT NOT NULL,
  patient_dob TEXT,
  patient_sex TEXT,
  member_id TEXT,
  member_group_id TEXT,
  date_of_service TEXT NOT NULL,
  date_of_service_end TEXT,
  billed_amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  provider_name TEXT,
  billing_provider_tin TEXT,
  billing_provider_npi TEXT,
  billing_provider_taxonomy TEXT,
  prior_auth_number TEXT,
  ltss_indicator INTEGER,
  par_indicator INTEGER,
  status TEXT NOT NULL,
  denial_reason TEXT,
  appeal_status TEXT,
  appeal_date TEXT,
  submission_date TEXT,
  processing_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ai_insight TEXT
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status);
CREATE INDEX IF NOT EXISTS idx_claims_date_of_service ON claims (date_of_service);
CREATE INDEX IF NOT EXISTS idx_claims_provider_id ON claims (provider_id);

-- Claim line items
CREATE TABLE IF NOT EXISTS claim_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  date_of_service TEXT,
  date_of_service_end TEXT,
  procedure_code TEXT NOT NULL,
  ndc_code TEXT,
  place_of_service TEXT,
  units INTEGER DEFAULT 1,
  units_type TEXT DEFAULT 'UN',
  billed_amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  rendering_provider_name TEXT,
  rendering_provider_npi TEXT,
  rendering_provider_taxonomy TEXT,
  status TEXT,
  par_indicator INTEGER,
  bypass_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_claim_line_unique ON claim_line_items (claim_id, line_number);

-- Claim diagnosis codes
CREATE TABLE IF NOT EXISTS claim_diagnosis_codes (
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (claim_id, code)
);

-- Claim procedure codes
CREATE TABLE IF NOT EXISTS claim_procedure_codes (
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  PRIMARY KEY (claim_id, code)
);

-- Line item modifiers
CREATE TABLE IF NOT EXISTS line_item_modifiers (
  line_item_id INTEGER NOT NULL REFERENCES claim_line_items(id) ON DELETE CASCADE,
  modifier TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (line_item_id, modifier)
);

-- Line item diagnosis codes
CREATE TABLE IF NOT EXISTS line_item_diagnosis_codes (
  line_item_id INTEGER NOT NULL REFERENCES claim_line_items(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (line_item_id, code)
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  description TEXT,
  clinical_rationale TEXT,
  topic TEXT,
  logic_type TEXT,
  source TEXT,
  hit_rate REAL DEFAULT 0,
  denial_rate REAL DEFAULT 0,
  appeal_rate REAL DEFAULT 0,
  overturn_rate REAL DEFAULT 0,
  impact REAL DEFAULT 0,
  insight_count INTEGER DEFAULT 0,
  providers_impacted INTEGER DEFAULT 0,
  trend TEXT,
  common_mistake TEXT,
  fix_guidance TEXT,
  age_restrictions TEXT,
  frequency_limits TEXT,
  learning_markers_count INTEGER DEFAULT 0,
  recent_tests INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Policy procedure codes
CREATE TABLE IF NOT EXISTS policy_procedure_codes (
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  PRIMARY KEY (policy_id, code)
);

-- Policy diagnosis codes
CREATE TABLE IF NOT EXISTS policy_diagnosis_codes (
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  PRIMARY KEY (policy_id, code)
);

-- Policy modifiers
CREATE TABLE IF NOT EXISTS policy_modifiers (
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  modifier TEXT NOT NULL,
  PRIMARY KEY (policy_id, modifier)
);

-- Policy places of service
CREATE TABLE IF NOT EXISTS policy_places_of_service (
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  place_of_service TEXT NOT NULL,
  PRIMARY KEY (policy_id, place_of_service)
);

-- Policy reference docs
CREATE TABLE IF NOT EXISTS policy_reference_docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT
);

-- Policy related policies
CREATE TABLE IF NOT EXISTS policy_related_policies (
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  related_policy_id TEXT NOT NULL,
  PRIMARY KEY (policy_id, related_policy_id)
);

-- Claim-Policy relationships
CREATE TABLE IF NOT EXISTS claim_policies (
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (claim_id, policy_id)
);

CREATE INDEX IF NOT EXISTS idx_claim_policies_policy ON claim_policies (policy_id);

-- Patterns table
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  tier TEXT NOT NULL,
  score_frequency INTEGER DEFAULT 0,
  score_impact REAL DEFAULT 0,
  score_trend TEXT,
  score_velocity REAL DEFAULT 0,
  score_confidence REAL DEFAULT 0,
  score_recency INTEGER DEFAULT 0,
  avg_denial_amount REAL DEFAULT 0,
  total_at_risk REAL DEFAULT 0,
  learning_progress INTEGER DEFAULT 0,
  practice_sessions_completed INTEGER DEFAULT 0,
  corrections_applied INTEGER DEFAULT 0,
  suggested_action TEXT,
  first_detected TEXT,
  last_seen TEXT,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns (status);
CREATE INDEX IF NOT EXISTS idx_patterns_tier ON patterns (tier);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns (category);

-- Pattern-Claim relationships
CREATE TABLE IF NOT EXISTS pattern_claims (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, claim_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_claims_claim ON pattern_claims (claim_id);

-- Pattern-Policy relationships
CREATE TABLE IF NOT EXISTS pattern_policies (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, policy_id)
);

-- Pattern related codes
CREATE TABLE IF NOT EXISTS pattern_related_codes (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  PRIMARY KEY (pattern_id, code)
);

-- Pattern evidence
CREATE TABLE IF NOT EXISTS pattern_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL,
  denial_date TEXT,
  denial_reason TEXT,
  procedure_code TEXT,
  modifier TEXT,
  billed_amount REAL
);

-- Pattern improvements
CREATE TABLE IF NOT EXISTS pattern_improvements (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  metric TEXT NOT NULL,
  before_value REAL,
  after_value REAL,
  percent_change REAL,
  trigger TEXT
);

-- Pattern actions
CREATE TABLE IF NOT EXISTS pattern_actions (
  id TEXT PRIMARY KEY NOT NULL,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  notes TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  npi TEXT,
  tin TEXT,
  taxonomy TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Learning events
CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  context TEXT,
  user_id TEXT,
  session_id TEXT,
  device_type TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_learning_events_timestamp ON learning_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events (type);
`

// Execute each statement
const stmts = statements.split(';').filter(s => s.trim().length > 0)
for (const stmt of stmts) {
  try {
    sqlite.exec(stmt)
  } catch (err) {
    // Ignore "table already exists" errors
    if (!(err instanceof Error && err.message.includes('already exists'))) {
      console.error('Error executing:', stmt.substring(0, 50) + '...')
      console.error(err)
    }
  }
}

// Verify tables were created
const tables = sqlite.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table'
  ORDER BY name
`).all() as { name: string }[]

console.log('\nCreated tables:')
tables.forEach(t => console.log('  -', t.name))

console.log('\nDatabase initialized successfully!')

sqlite.close()
