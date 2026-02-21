/**
 * Bulk Scenario Import API Endpoint
 *
 * POST /api/admin/scenarios/bulk-import
 *
 * Accepts an array of ScenarioDefinition objects, writes them to a temp file,
 * and spawns the bulk-generate CLI tool as a child process. Returns a job ID
 * for polling progress via the status endpoint.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { spawn } from 'child_process'
import { createInterface } from 'readline'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// =============================================================================
// JOB TYPES
// =============================================================================

interface ScenarioResult {
  scenarioId: string
  scenarioName: string
  status: 'pending' | 'generating' | 'succeeded' | 'failed' | 'skipped'
  error?: string
  stats?: {
    claims: number
    deniedClaims: number
    appeals: number
    snapshots: number
    learningEvents: number
    durationMs: number
  }
}

interface BulkImportJob {
  jobId: string
  status: 'started' | 'validating' | 'generating' | 'completed' | 'failed'
  scenarioCount: number
  progress: {
    current: number
    total: number
    phase: string
  }
  results: ScenarioResult[]
  error?: string
  startedAt: string
  completedAt?: string
}

// Module-level job store shared across requests
const jobs = new Map<string, BulkImportJob>()

/** Exported for the status endpoint */
export function getJob(jobId: string): BulkImportJob | undefined {
  return jobs.get(jobId)
}

// =============================================================================
// STDOUT PARSER
// =============================================================================

function parseStdoutLine(line: string, job: BulkImportJob): void {
  // Validation phase: "  ✓ scenario-id: Scenario Name"
  const validMatch = line.match(/^\s*✓\s+([^:]+):\s+(.+)$/)
  if (validMatch) {
    job.status = 'validating'
    job.progress.phase = `Validating: ${validMatch[2]}`
    const existing = job.results.find(r => r.scenarioId === validMatch[1])
    if (existing) {
      existing.status = 'pending'
    }
    return
  }

  // Validation failure: "  ✗ scenario-id: Invalid — reason"
  const invalidMatch = line.match(/^\s*✗\s+([^:]+):\s+Invalid\s*[—–-]\s*(.+)$/)
  if (invalidMatch) {
    const existing = job.results.find(r => r.scenarioId === invalidMatch[1])
    if (existing) {
      existing.status = 'skipped'
      existing.error = invalidMatch[2]?.trim() || 'Failed validation'
    }
    return
  }
  // Validation failure without reason: "  ✗ scenario-id: Invalid"
  const invalidMatchShort = line.match(/^\s*✗\s+([^:]+):\s+Invalid\s*$/)
  if (invalidMatchShort) {
    const existing = job.results.find(r => r.scenarioId === invalidMatchShort[1])
    if (existing) {
      existing.status = 'skipped'
      existing.error = 'Failed validation'
    }
    return
  }

  // Additional validation error lines: "    - second error message"
  const additionalErrorMatch = line.match(/^\s{4,}-\s+(.+)$/)
  if (additionalErrorMatch) {
    const lastSkipped = [...job.results].reverse().find(r => r.status === 'skipped')
    if (lastSkipped && lastSkipped.error) {
      lastSkipped.error += '; ' + additionalErrorMatch[1]!.trim()
    }
    return
  }

  // Valid scenarios count: "Valid scenarios: 3 of 3"
  const validCountMatch = line.match(/^Valid scenarios:\s*(\d+)\s+of\s+(\d+)/)
  if (validCountMatch) {
    job.progress.total = parseInt(validCountMatch[1]!)
    return
  }

  // Generation progress: "  [1/3] Scenario Name"
  const progressMatch = line.match(/^\s*\[(\d+)\/(\d+)\]\s+(.+)$/)
  if (progressMatch) {
    job.status = 'generating'
    const current = parseInt(progressMatch[1]!)
    const total = parseInt(progressMatch[2]!)
    job.progress.current = current - 1 // 0-based
    job.progress.total = total
    job.progress.phase = `Generating scenario ${current} of ${total}`

    // Mark the current scenario as generating
    // Find by name since that's what the CLI prints
    const scenarioName = progressMatch[3]!.trim()
    const result = job.results.find(r => r.scenarioName === scenarioName)
    if (result) {
      result.status = 'generating'
    }
    return
  }

  // Stats line: "       Claims: 500 | Denied: 2 | Appeals: 0 | Events: 76"
  const statsMatch = line.match(
    /Claims:\s*([\d,]+)\s*\|\s*Denied:\s*([\d,]+)\s*\|\s*Appeals:\s*([\d,]+)\s*\|\s*Events:\s*([\d,]+)/
  )
  if (statsMatch) {
    // Find the currently-generating scenario
    const generating = job.results.find(r => r.status === 'generating')
    if (generating) {
      generating.stats = {
        claims: parseInt(statsMatch[1]!.replace(/,/g, '')),
        deniedClaims: parseInt(statsMatch[2]!.replace(/,/g, '')),
        appeals: parseInt(statsMatch[3]!.replace(/,/g, '')),
        snapshots: 0,
        learningEvents: parseInt(statsMatch[4]!.replace(/,/g, '')),
        durationMs: 0,
      }
    }
    return
  }

  // Duration + success: "       Duration: 0.1s ✓"
  const durationMatch = line.match(/Duration:\s*([\d.]+)s\s*✓/)
  if (durationMatch) {
    const generating = job.results.find(r => r.status === 'generating')
    if (generating) {
      generating.status = 'succeeded'
      if (generating.stats) {
        generating.stats.durationMs = Math.round(parseFloat(durationMatch[1]!) * 1000)
      }
      job.progress.current = job.results.filter(
        r => r.status === 'succeeded' || r.status === 'failed'
      ).length
    }
    return
  }

  // Failure: "       ✗ Failed: error message"
  const failMatch = line.match(/✗\s*Failed:\s*(.+)$/)
  if (failMatch) {
    const generating = job.results.find(r => r.status === 'generating')
    if (generating) {
      generating.status = 'failed'
      generating.error = failMatch[1]!.trim()
      job.progress.current = job.results.filter(
        r => r.status === 'succeeded' || r.status === 'failed'
      ).length
    }
    return
  }
}

// =============================================================================
// ENDPOINT
// =============================================================================

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate request body
    if (!body || !body.scenarios) {
      throw createError({
        statusCode: 400,
        message: 'Request body must contain a "scenarios" array',
      })
    }

    const scenarios = Array.isArray(body.scenarios) ? body.scenarios : [body.scenarios]

    if (scenarios.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Scenarios array must not be empty',
      })
    }

    // Light validation — CLI does full validation
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i]
      if (!s || typeof s !== 'object') {
        throw createError({
          statusCode: 400,
          message: `Scenario at index ${i} is not an object`,
        })
      }
      if (!s.id || typeof s.id !== 'string') {
        throw createError({
          statusCode: 400,
          message: `Scenario at index ${i} is missing a valid "id"`,
        })
      }
      if (!s.name || typeof s.name !== 'string') {
        throw createError({
          statusCode: 400,
          message: `Scenario at index ${i} (${s.id}) is missing a valid "name"`,
        })
      }
    }

    // Generate job ID
    const rand = Math.random().toString(36).slice(2, 6)
    const jobId = `bulk-${Date.now()}-${rand}`

    // Write payload to temp file
    const tempFile = join(tmpdir(), `bulk-import-${jobId}.json`)
    writeFileSync(tempFile, JSON.stringify({ scenarios }), 'utf-8')

    // Initialize job with scenario results
    const job: BulkImportJob = {
      jobId,
      status: 'started',
      scenarioCount: scenarios.length,
      progress: {
        current: 0,
        total: scenarios.length,
        phase: 'Starting',
      },
      results: scenarios.map((s: { id: string; name: string }) => ({
        scenarioId: s.id,
        scenarioName: s.name,
        status: 'pending' as const,
      })),
      startedAt: new Date().toISOString(),
    }

    jobs.set(jobId, job)

    // Auto-cleanup after 1 hour
    const cleanupTimer = setTimeout(() => {
      jobs.delete(jobId)
    }, 60 * 60 * 1000)
    cleanupTimer.unref()

    // Spawn CLI
    const toolPath = join(process.cwd(), 'tools/bulk-generate.ts')
    const child = spawn('npx', ['tsx', toolPath, '--file', tempFile, '--continue-on-error'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Parse stdout line-by-line
    const rl = createInterface({ input: child.stdout })
    rl.on('line', (line) => {
      parseStdoutLine(line, job)
    })

    // Capture stderr for error reporting
    let stderrBuffer = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBuffer += chunk.toString()
    })

    // Handle process exit
    child.on('close', (code) => {
      // Clean up temp file
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore if already deleted
      }

      job.completedAt = new Date().toISOString()

      if (code === 0) {
        job.status = 'completed'
        job.progress.phase = 'Complete'
        job.progress.current = job.progress.total
      } else {
        // Check if any scenarios succeeded
        const anySucceeded = job.results.some(r => r.status === 'succeeded')
        job.status = anySucceeded ? 'completed' : 'failed'
        job.progress.phase = anySucceeded ? 'Complete (with errors)' : 'Failed'
        if (!anySucceeded && stderrBuffer) {
          job.error = stderrBuffer.trim().slice(0, 500)
        }
      }
    })

    // Handle spawn errors
    child.on('error', (err) => {
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore
      }

      job.status = 'failed'
      job.error = err.message
      job.completedAt = new Date().toISOString()
      job.progress.phase = 'Failed to start'
    })

    // Return immediately
    return {
      jobId,
      scenarioCount: scenarios.length,
      status: 'started' as const,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('[Bulk Import] Unhandled error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to start bulk import',
    })
  }
})
