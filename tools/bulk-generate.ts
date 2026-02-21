#!/usr/bin/env npx tsx
/**
 * Bulk Scenario Import Tool
 *
 * Reads a JSON file containing multiple ScenarioDefinition objects
 * and processes them sequentially through the shared generation pipeline.
 *
 * Usage:
 *   npx tsx tools/bulk-generate.ts --file scenarios/sample-bulk-import.scenarios.json
 *   npx tsx tools/bulk-generate.ts --file data.json --dry-run
 *   npx tsx tools/bulk-generate.ts --file data.json --continue-on-error
 *   npx tsx tools/bulk-generate.ts --file data.json --db custom.db
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

import type { ScenarioDefinition } from './scenario-types'
import {
  validateScenario,
  runScenarioPipeline,
  type PipelineResult,
  type ValidationResult,
} from './scenario-pipeline'

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

interface CLIOptions {
  file: string
  dryRun: boolean
  continueOnError: boolean
  dbPath: string
  verbose: boolean
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    file: '',
    dryRun: false,
    continueOnError: false,
    dbPath: 'provider-portal.db',
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
      case '-f':
        options.file = args[++i] ?? ''
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--continue-on-error':
      case '-c':
        options.continueOnError = true
        break
      case '--db':
        options.dbPath = args[++i] ?? 'provider-portal.db'
        break
      case '--verbose':
        options.verbose = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
    }
  }

  if (!options.file) {
    console.error('Error: --file is required')
    printUsage()
    process.exit(1)
  }

  return options
}

function printUsage(): void {
  console.log(`
Bulk Scenario Import Tool

Usage:
  npx tsx tools/bulk-generate.ts --file <path-to-scenarios.json> [options]

Options:
  --file, -f <path>      Path to JSON file with scenarios array (required)
  --dry-run, -d          Validate all scenarios without generating data
  --continue-on-error, -c  Skip failed scenarios instead of stopping
  --db <path>            Database path (default: provider-portal.db)
  --verbose              Enable verbose logging
  --help, -h             Show this help message

Input JSON format:
  {
    "scenarios": [
      { "id": "...", "name": "...", "timeline": {}, "practice": {}, ... },
      { "id": "...", "name": "...", "timeline": {}, "practice": {}, ... }
    ]
  }

Examples:
  npx tsx tools/bulk-generate.ts --file scenarios/sample-bulk-import.scenarios.json
  npx tsx tools/bulk-generate.ts -f data.json --dry-run
  npx tsx tools/bulk-generate.ts -f data.json --continue-on-error --verbose
`)
}

// =============================================================================
// INPUT PARSING
// =============================================================================

interface BulkInput {
  scenarios: ScenarioDefinition[]
}

function loadInputFile(filePath: string): BulkInput {
  const fullPath = join(process.cwd(), filePath)

  if (!existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`)
  }

  const raw = readFileSync(fullPath, 'utf-8')
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid JSON in input file: ${fullPath}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Input file must contain a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  if (!Array.isArray(obj.scenarios)) {
    throw new Error('Input file must have a "scenarios" array')
  }

  if (obj.scenarios.length === 0) {
    throw new Error('Scenarios array is empty')
  }

  return { scenarios: obj.scenarios as ScenarioDefinition[] }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main(): void {
  const options = parseArgs()

  console.log('')
  console.log('Bulk Scenario Import')
  console.log('═══════════════════════════════════════════════════')
  console.log(`File:     ${options.file}`)

  // Load input file
  let input: BulkInput
  try {
    input = loadInputFile(options.file)
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const dbPath = join(process.cwd(), options.dbPath)
  console.log(`Scenarios: ${input.scenarios.length} found`)
  console.log(`Database: ${options.dbPath}`)
  console.log('')

  // Phase 1: Validate all scenarios
  console.log('Validating scenarios...')
  const validationResults: { scenario: ScenarioDefinition; validation: ValidationResult }[] = []
  let validCount = 0
  let invalidCount = 0

  for (const scenario of input.scenarios) {
    const validation = validateScenario(scenario)
    validationResults.push({ scenario, validation })

    if (validation.valid) {
      console.log(`  ✓ ${scenario.id}: ${scenario.name}`)
      validCount++
    } else {
      console.log(`  ✗ ${scenario.id || '(no id)'}: Invalid — ${validation.errors[0]}`)
      if (validation.errors.length > 1) {
        for (let i = 1; i < validation.errors.length; i++) {
          console.log(`    - ${validation.errors[i]}`)
        }
      }
      invalidCount++
    }
  }

  console.log('')
  console.log(`Valid scenarios: ${validCount} of ${input.scenarios.length}`)

  if (validCount === 0) {
    console.error('✗ No valid scenarios to process')
    process.exit(1)
  }

  // Phase 2: Stop if dry-run
  if (options.dryRun) {
    console.log('')
    console.log('--dry-run flag set, skipping data generation')
    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('Dry Run Summary')
    console.log(`  Valid:   ${validCount}`)
    console.log(`  Invalid: ${invalidCount}`)
    console.log('═══════════════════════════════════════════════════')
    process.exit(invalidCount > 0 ? 1 : 0)
  }

  // Phase 3: Open database and process scenarios
  console.log('')
  console.log('Generating...')

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  const results: PipelineResult[] = []
  let succeeded = 0
  let failed = 0
  let scenarioIndex = 0

  try {
    const validScenarios = validationResults
      .filter(vr => vr.validation.valid)
      .map(vr => vr.scenario)

    for (const scenario of validScenarios) {
      scenarioIndex++
      console.log('')
      console.log(`  [${scenarioIndex}/${validScenarios.length}] ${scenario.name}`)

      const result = runScenarioPipeline(scenario, db, { verbose: options.verbose })
      results.push(result)

      if (result.success) {
        console.log(
          `       Claims: ${result.stats.claims.toLocaleString()} | ` +
            `Denied: ${result.stats.deniedClaims.toLocaleString()} | ` +
            `Appeals: ${result.stats.appeals.toLocaleString()} | ` +
            `Events: ${result.stats.learningEvents.toLocaleString()}`
        )
        console.log(
          `       Duration: ${(result.stats.durationMs / 1000).toFixed(1)}s ✓`
        )
        succeeded++
      } else {
        console.error(`       ✗ Failed: ${result.error}`)
        failed++

        if (!options.continueOnError) {
          console.error('')
          console.error('Stopping on first error. Use --continue-on-error to skip failures.')
          break
        }
      }
    }
  } finally {
    db.close()
  }

  // Phase 4: Print summary
  const totalClaims = results.reduce((sum, r) => sum + (r.success ? r.stats.claims : 0), 0)
  const totalAppeals = results.reduce((sum, r) => sum + (r.success ? r.stats.appeals : 0), 0)
  const totalEvents = results.reduce(
    (sum, r) => sum + (r.success ? r.stats.learningEvents : 0),
    0
  )
  const totalDuration = results.reduce((sum, r) => sum + r.stats.durationMs, 0)

  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('Summary')
  console.log(
    `  Total scenarios:  ${succeeded} succeeded, ${failed} failed, ${invalidCount} skipped (invalid)`
  )
  console.log(`  Total claims:     ${totalClaims.toLocaleString()}`)
  console.log(`  Total appeals:    ${totalAppeals.toLocaleString()}`)
  console.log(`  Total events:     ${totalEvents.toLocaleString()}`)
  console.log(`  Total time:       ${(totalDuration / 1000).toFixed(1)}s`)
  console.log('═══════════════════════════════════════════════════')
  console.log('')

  if (failed > 0) {
    process.exit(1)
  }
}

main()
