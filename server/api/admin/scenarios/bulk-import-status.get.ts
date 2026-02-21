/**
 * Bulk Import Status API Endpoint
 *
 * GET /api/admin/scenarios/bulk-import-status?jobId=xxx
 *
 * Returns the current status of a bulk import job, including per-scenario
 * progress and stats. Jobs are stored in-memory and auto-expire after 1 hour.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { getJob } from './bulk-import.post'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const jobId = query.jobId as string | undefined

  if (!jobId) {
    throw createError({
      statusCode: 400,
      message: 'Query parameter "jobId" is required',
    })
  }

  const job = getJob(jobId)

  if (!job) {
    throw createError({
      statusCode: 404,
      message: 'Job not found',
    })
  }

  return job
})
