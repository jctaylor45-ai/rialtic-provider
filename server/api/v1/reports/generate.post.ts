/**
 * POST /api/v1/reports/generate
 *
 * Generate a custom report with specified sections and date range
 */

import { getReportGenerator } from '~/server/services/reportGenerator'
import type { ReportSection } from '~/server/services/reportGenerator'

interface GenerateReportBody {
  title?: string
  startDate: string
  endDate: string
  sections?: ReportSection[]
  format?: 'json' | 'csv'
  templateId?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<GenerateReportBody>(event)

  // Validate required fields
  if (!body.startDate || !body.endDate) {
    throw createError({
      statusCode: 400,
      message: 'startDate and endDate are required',
    })
  }

  // Validate date format
  const startDate = new Date(body.startDate)
  const endDate = new Date(body.endDate)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
  }

  if (startDate > endDate) {
    throw createError({
      statusCode: 400,
      message: 'startDate must be before endDate',
    })
  }

  const generator = getReportGenerator()

  // Get sections from template or request
  let sections: ReportSection[] = body.sections || ['summary', 'trends']

  if (body.templateId) {
    const templates = generator.getTemplates()
    const template = templates.find(t => t.id === body.templateId)
    if (template) {
      sections = template.sections
    }
  }

  const format = body.format || 'json'

  const report = await generator.generate({
    title: body.title || 'Claims Analytics Report',
    startDate: body.startDate,
    endDate: body.endDate,
    sections,
    format,
  })

  // Set response headers for CSV download
  if (format === 'csv') {
    setHeader(event, 'Content-Type', 'text/csv')
    setHeader(event, 'Content-Disposition', `attachment; filename="report-${Date.now()}.csv"`)
    return report
  }

  return {
    success: true,
    report,
    format,
  }
})
