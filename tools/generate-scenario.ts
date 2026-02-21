#!/usr/bin/env npx tsx
/**
 * Scenario-Based Mock Data Generator
 *
 * Generates consistent, interconnected mock data for the Provider Portal
 * based on scenario definition files.
 *
 * Usage:
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --validate
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --dry-run
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --verbose
 *   npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts --db my.db
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

import type { ScenarioDefinition } from './scenario-types'
import { validateScenario, runScenarioPipeline } from './scenario-pipeline'

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

interface CLIOptions {
  scenario: string
  validate: boolean
  verbose: boolean
  dryRun: boolean
  dbPath: string
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    scenario: '',
    validate: false,
    verbose: false,
    dryRun: false,
    dbPath: 'provider-portal.db',
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scenario':
      case '-s':
        options.scenario = args[++i] ?? ''
        break
      case '--validate':
      case '-v':
        options.validate = true
        break
      case '--verbose':
        options.verbose = true
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--db':
        options.dbPath = args[++i] ?? 'provider-portal.db'
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
    }
  }

  if (!options.scenario) {
    console.error('Error: --scenario is required')
    printUsage()
    process.exit(1)
  }

  return options
}

function printUsage(): void {
  console.log(`
Scenario-Based Mock Data Generator

Usage:
  npx tsx tools/generate-scenario.ts --scenario <path> [options]

Options:
  --scenario, -s <path>  Path to scenario definition file (required)
  --validate, -v         Validate scenario without generating data
  --verbose              Enable verbose logging
  --dry-run, -d          Validate but don't write to database
  --db <path>            Database path (default: provider-portal.db)
  --help, -h             Show this help message

Examples:
  npx tsx tools/generate-scenario.ts --scenario scenarios/test-minimal.scenario.ts
  npx tsx tools/generate-scenario.ts -s scenarios/ortho-austin-180d.scenario.ts -v
  npx tsx tools/generate-scenario.ts -s scenarios/test.ts --dry-run --verbose
`)
}

// =============================================================================
// SCENARIO LOADING
// =============================================================================

async function loadScenario(path: string): Promise<ScenarioDefinition> {
  const fullPath = join(process.cwd(), path)

  if (!existsSync(fullPath)) {
    throw new Error(`Scenario file not found: ${fullPath}`)
  }

  const module = await import(fullPath)
  const scenario = module.default || module.scenario

  if (!scenario) {
    throw new Error('Scenario file must export a default scenario or named "scenario" export')
  }

  return scenario as ScenarioDefinition
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs()

  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║         Scenario-Based Mock Data Generator                ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  try {
    // Load scenario
    console.log(`Loading scenario: ${options.scenario}`)
    const scenario = await loadScenario(options.scenario)
    console.log(`✓ Loaded scenario: ${scenario.name}`)

    // Validate scenario
    console.log('\nValidating scenario definition...')
    const validation = validateScenario(scenario)

    if (!validation.valid) {
      for (const err of validation.errors) {
        console.error(`✗ ${err}`)
      }
      throw new Error('Scenario validation failed')
    }
    console.log('✓ Scenario validation passed')

    // If validate-only mode, stop here
    if (options.validate) {
      console.log('\n--validate flag set, skipping data generation')
      return
    }

    // If dry-run mode, stop here
    if (options.dryRun) {
      console.log('\n--dry-run flag set, skipping data generation')
      return
    }

    // Open database
    const dbPath = join(process.cwd(), options.dbPath)
    console.log(`\nDatabase: ${dbPath}`)
    const db = new Database(dbPath)
    db.pragma('foreign_keys = ON')

    try {
      // Run pipeline
      console.log('Generating data...')
      const result = runScenarioPipeline(scenario, db, { verbose: options.verbose })

      if (!result.success) {
        console.error(`\n✗ Generation failed: ${result.error}`)
        process.exit(1)
      }

      // Print summary
      console.log('\n═══════════════════════════════════════════════════════════')
      console.log('GENERATION SUMMARY')
      console.log('═══════════════════════════════════════════════════════════')
      console.log(`Scenario:  ${result.scenarioName} (${result.scenarioId})`)
      console.log(`Claims:    ${result.stats.claims.toLocaleString()}`)
      console.log(`  Denied:  ${result.stats.deniedClaims.toLocaleString()}`)
      console.log(`Appeals:   ${result.stats.appeals.toLocaleString()}`)
      console.log(`Snapshots: ${result.stats.snapshots.toLocaleString()}`)
      console.log(`Events:    ${result.stats.learningEvents.toLocaleString()}`)
      console.log(`Duration:  ${(result.stats.durationMs / 1000).toFixed(1)}s`)
      console.log('═══════════════════════════════════════════════════════════\n')

      console.log('✓ Generation complete!')
    } finally {
      db.close()
    }
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

main()
