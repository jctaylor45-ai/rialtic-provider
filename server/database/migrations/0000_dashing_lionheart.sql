CREATE TABLE `claim_appeals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`claim_id` text NOT NULL,
	`line_number` integer,
	`appeal_filed` integer DEFAULT false,
	`appeal_date` text,
	`appeal_reason` text,
	`appeal_outcome` text,
	`outcome_date` text,
	`outcome_notes` text,
	FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_claim_appeals_claim` ON `claim_appeals` (`claim_id`);--> statement-breakpoint
CREATE INDEX `idx_claim_appeals_outcome` ON `claim_appeals` (`appeal_outcome`);--> statement-breakpoint
CREATE TABLE `claim_diagnosis_codes` (
	`claim_id` text NOT NULL,
	`code` text NOT NULL,
	`sequence` integer NOT NULL,
	PRIMARY KEY(`claim_id`, `code`),
	FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `claim_line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`claim_id` text NOT NULL,
	`line_number` integer NOT NULL,
	`date_of_service` text,
	`date_of_service_end` text,
	`procedure_code` text NOT NULL,
	`ndc_code` text,
	`place_of_service` text,
	`units` integer DEFAULT 1,
	`units_type` text DEFAULT 'UN',
	`billed_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0,
	`rendering_provider_name` text,
	`rendering_provider_npi` text,
	`rendering_provider_taxonomy` text,
	`status` text,
	`par_indicator` integer,
	`bypass_code` text,
	FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_claim_line_unique` ON `claim_line_items` (`claim_id`,`line_number`);--> statement-breakpoint
CREATE TABLE `claim_line_policies` (
	`line_item_id` integer NOT NULL,
	`policy_id` text NOT NULL,
	`triggered_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`is_denied` integer DEFAULT false,
	`denial_reason` text,
	`denied_amount` real,
	PRIMARY KEY(`line_item_id`, `policy_id`),
	FOREIGN KEY (`line_item_id`) REFERENCES `claim_line_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_claim_line_policies_policy` ON `claim_line_policies` (`policy_id`);--> statement-breakpoint
CREATE INDEX `idx_claim_line_policies_denied` ON `claim_line_policies` (`is_denied`);--> statement-breakpoint
CREATE TABLE `claim_procedure_codes` (
	`claim_id` text NOT NULL,
	`code` text NOT NULL,
	PRIMARY KEY(`claim_id`, `code`),
	FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`scenario_id` text,
	`claim_type` text,
	`patient_name` text NOT NULL,
	`patient_dob` text,
	`patient_sex` text,
	`member_id` text,
	`member_group_id` text,
	`date_of_service` text NOT NULL,
	`date_of_service_end` text,
	`billed_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0,
	`provider_name` text,
	`billing_provider_tin` text,
	`billing_provider_npi` text,
	`billing_provider_taxonomy` text,
	`prior_auth_number` text,
	`ltss_indicator` integer,
	`par_indicator` integer,
	`status` text NOT NULL,
	`denial_reason` text,
	`appeal_status` text,
	`appeal_date` text,
	`submission_date` text,
	`processing_date` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`ai_insight` text,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_claims_status` ON `claims` (`status`);--> statement-breakpoint
CREATE INDEX `idx_claims_date_of_service` ON `claims` (`date_of_service`);--> statement-breakpoint
CREATE INDEX `idx_claims_provider_id` ON `claims` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_claims_scenario` ON `claims` (`scenario_id`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`source_type` text NOT NULL,
	`status` text DEFAULT 'inactive',
	`config` text,
	`sync_enabled` integer DEFAULT false,
	`sync_schedule` text,
	`last_sync_at` text,
	`last_sync_status` text,
	`last_sync_error` text,
	`total_imported` integer DEFAULT 0,
	`last_import_count` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE INDEX `idx_data_sources_status` ON `data_sources` (`status`);--> statement-breakpoint
CREATE INDEX `idx_data_sources_type` ON `data_sources` (`source_type`);--> statement-breakpoint
CREATE TABLE `import_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data_source_id` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text NOT NULL,
	`records_fetched` integer DEFAULT 0,
	`records_validated` integer DEFAULT 0,
	`records_inserted` integer DEFAULT 0,
	`records_updated` integer DEFAULT 0,
	`records_skipped` integer DEFAULT 0,
	`records_errored` integer DEFAULT 0,
	`duration_ms` integer,
	`error_message` text,
	`error_details` text,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_import_history_source` ON `import_history` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `idx_import_history_status` ON `import_history` (`status`);--> statement-breakpoint
CREATE TABLE `learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`type` text NOT NULL,
	`context` text,
	`user_id` text,
	`session_id` text,
	`device_type` text,
	`scenario_id` text,
	`metadata` text,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_learning_events_timestamp` ON `learning_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_learning_events_type` ON `learning_events` (`type`);--> statement-breakpoint
CREATE INDEX `idx_learning_events_scenario` ON `learning_events` (`scenario_id`);--> statement-breakpoint
CREATE TABLE `line_item_diagnosis_codes` (
	`line_item_id` integer NOT NULL,
	`code` text NOT NULL,
	`sequence` integer NOT NULL,
	PRIMARY KEY(`line_item_id`, `code`),
	FOREIGN KEY (`line_item_id`) REFERENCES `claim_line_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `line_item_modifiers` (
	`line_item_id` integer NOT NULL,
	`modifier` text NOT NULL,
	`sequence` integer NOT NULL,
	PRIMARY KEY(`line_item_id`, `modifier`),
	FOREIGN KEY (`line_item_id`) REFERENCES `claim_line_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`pattern_id` text NOT NULL,
	`action_type` text NOT NULL,
	`notes` text,
	`timestamp` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_claim_lines` (
	`pattern_id` text NOT NULL,
	`line_item_id` integer NOT NULL,
	`denied_amount` real,
	`denial_date` text,
	PRIMARY KEY(`pattern_id`, `line_item_id`),
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_item_id`) REFERENCES `claim_line_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pattern_claim_lines_line` ON `pattern_claim_lines` (`line_item_id`);--> statement-breakpoint
CREATE TABLE `pattern_evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pattern_id` text NOT NULL,
	`claim_id` text NOT NULL,
	`denial_date` text,
	`denial_reason` text,
	`procedure_code` text,
	`modifier` text,
	`billed_amount` real,
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_improvements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pattern_id` text NOT NULL,
	`date` text NOT NULL,
	`metric` text NOT NULL,
	`before_value` real,
	`after_value` real,
	`percent_change` real,
	`trigger` text,
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_policies` (
	`pattern_id` text NOT NULL,
	`policy_id` text NOT NULL,
	PRIMARY KEY(`pattern_id`, `policy_id`),
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_related_codes` (
	`pattern_id` text NOT NULL,
	`code` text NOT NULL,
	PRIMARY KEY(`pattern_id`, `code`),
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pattern_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pattern_id` text NOT NULL,
	`snapshot_date` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`claim_count` integer DEFAULT 0,
	`denied_count` integer DEFAULT 0,
	`denial_rate` real,
	`dollars_denied` real DEFAULT 0,
	`dollars_at_risk` real DEFAULT 0,
	`appeal_count` integer DEFAULT 0,
	`appeal_rate` real,
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pattern_snapshots_pattern_date` ON `pattern_snapshots` (`pattern_id`,`snapshot_date`);--> statement-breakpoint
CREATE TABLE `patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`scenario_id` text,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`tier` text NOT NULL,
	`score_frequency` integer DEFAULT 0,
	`score_impact` real DEFAULT 0,
	`score_trend` text,
	`score_velocity` real DEFAULT 0,
	`score_confidence` real DEFAULT 0,
	`score_recency` integer DEFAULT 0,
	`avg_denial_amount` real DEFAULT 0,
	`total_at_risk` real DEFAULT 0,
	`learning_progress` integer DEFAULT 0,
	`practice_sessions_completed` integer DEFAULT 0,
	`corrections_applied` integer DEFAULT 0,
	`suggested_action` text,
	`baseline_start` text,
	`baseline_end` text,
	`baseline_claim_count` integer,
	`baseline_denied_count` integer,
	`baseline_denial_rate` real,
	`baseline_dollars_denied` real,
	`current_start` text,
	`current_end` text,
	`current_claim_count` integer,
	`current_denied_count` integer,
	`current_denial_rate` real,
	`current_dollars_denied` real,
	`first_detected` text,
	`last_seen` text,
	`last_updated` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_patterns_status` ON `patterns` (`status`);--> statement-breakpoint
CREATE INDEX `idx_patterns_tier` ON `patterns` (`tier`);--> statement-breakpoint
CREATE INDEX `idx_patterns_category` ON `patterns` (`category`);--> statement-breakpoint
CREATE INDEX `idx_patterns_scenario` ON `patterns` (`scenario_id`);--> statement-breakpoint
CREATE TABLE `policies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`effective_date` text NOT NULL,
	`description` text,
	`clinical_rationale` text,
	`topic` text,
	`logic_type` text,
	`source` text,
	`hit_rate` real DEFAULT 0,
	`denial_rate` real DEFAULT 0,
	`appeal_rate` real DEFAULT 0,
	`overturn_rate` real DEFAULT 0,
	`impact` real DEFAULT 0,
	`insight_count` integer DEFAULT 0,
	`providers_impacted` integer DEFAULT 0,
	`trend` text,
	`common_mistake` text,
	`fix_guidance` text,
	`age_restrictions` text,
	`frequency_limits` text,
	`learning_markers_count` integer DEFAULT 0,
	`recent_tests` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `policy_diagnosis_codes` (
	`policy_id` text NOT NULL,
	`code` text NOT NULL,
	PRIMARY KEY(`policy_id`, `code`),
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `policy_modifiers` (
	`policy_id` text NOT NULL,
	`modifier` text NOT NULL,
	PRIMARY KEY(`policy_id`, `modifier`),
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `policy_places_of_service` (
	`policy_id` text NOT NULL,
	`place_of_service` text NOT NULL,
	PRIMARY KEY(`policy_id`, `place_of_service`),
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `policy_procedure_codes` (
	`policy_id` text NOT NULL,
	`code` text NOT NULL,
	PRIMARY KEY(`policy_id`, `code`),
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `policy_reference_docs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source` text,
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `policy_related_policies` (
	`policy_id` text NOT NULL,
	`related_policy_id` text NOT NULL,
	PRIMARY KEY(`policy_id`, `related_policy_id`),
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`specialty` text,
	`npi` text,
	`tin` text,
	`taxonomy` text,
	`scenario_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_providers_scenario` ON `providers` (`scenario_id`);--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT false,
	`timeline_start` text NOT NULL,
	`timeline_end` text NOT NULL,
	`config` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE INDEX `idx_scenarios_active` ON `scenarios` (`is_active`);