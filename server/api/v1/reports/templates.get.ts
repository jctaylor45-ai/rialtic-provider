/**
 * GET /api/v1/reports/templates
 *
 * Get available report templates
 */

import { getReportGenerator } from '~/server/services/reportGenerator'

export default defineEventHandler(async () => {
  const generator = getReportGenerator()
  const templates = generator.getTemplates()

  return {
    templates,
    sections: [
      { id: 'summary', name: 'Summary', description: 'Key metrics overview' },
      { id: 'trends', name: 'Trends', description: 'Time-series trend data' },
      { id: 'providers', name: 'Providers', description: 'Provider performance breakdown' },
      { id: 'patterns', name: 'Patterns', description: 'Denial pattern impact analysis' },
      { id: 'denialReasons', name: 'Denial Reasons', description: 'Denial reason distribution' },
      { id: 'appeals', name: 'Appeals', description: 'Appeal metrics and outcomes' },
      { id: 'comparison', name: 'Comparison', description: 'Period-over-period comparison' },
    ],
    formats: [
      { id: 'json', name: 'JSON', description: 'Structured data format' },
      { id: 'csv', name: 'CSV', description: 'Spreadsheet-compatible format' },
    ],
  }
})
