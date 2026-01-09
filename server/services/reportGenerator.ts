/**
 * Report Generator Service
 *
 * Generates exportable reports in various formats (JSON, CSV).
 * Supports customizable report sections and date ranges.
 */

import { getAnalyticsEngine } from './analyticsEngine'
import type {
  PeriodMetrics,
  TimeSeriesPoint,
  Cohort,
  ProviderPerformance,
  PatternImpact,
} from './analyticsEngine'

// =============================================================================
// TYPES
// =============================================================================

export interface ReportConfig {
  title: string
  startDate: string
  endDate: string
  sections: ReportSection[]
  format: 'json' | 'csv'
  includeChartData?: boolean
}

export type ReportSection =
  | 'summary'
  | 'trends'
  | 'providers'
  | 'patterns'
  | 'denialReasons'
  | 'appeals'
  | 'comparison'

export interface GeneratedReport {
  title: string
  generatedAt: string
  period: {
    startDate: string
    endDate: string
    days: number
  }
  sections: {
    summary?: PeriodMetrics
    trends?: {
      denialRate: TimeSeriesPoint[]
      revenueImpact: TimeSeriesPoint[]
    }
    providers?: ProviderPerformance[]
    patterns?: PatternImpact[]
    denialReasons?: Cohort[]
    appeals?: {
      totalAppeals: number
      pendingAppeals: number
      overturnedAppeals: number
      upheldAppeals: number
      overturnRate: string
    }
    comparison?: {
      currentPeriod: PeriodMetrics
      previousPeriod: PeriodMetrics
      changes: {
        denialRateChange: number
        deniedAmountChange: number
      }
    }
  }
}

// =============================================================================
// REPORT GENERATOR CLASS
// =============================================================================

export class ReportGenerator {
  private engine = getAnalyticsEngine()

  /**
   * Generate a report based on configuration
   */
  async generate(config: ReportConfig): Promise<GeneratedReport | string> {
    const startTime = Date.now()
    const days = Math.ceil(
      (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) /
        (24 * 60 * 60 * 1000)
    )

    const report: GeneratedReport = {
      title: config.title,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: config.startDate,
        endDate: config.endDate,
        days,
      },
      sections: {},
    }

    // Generate requested sections
    const sectionPromises: Promise<void>[] = []

    if (config.sections.includes('summary')) {
      sectionPromises.push(
        this.engine.getPeriodMetrics(config.startDate, config.endDate).then(data => {
          report.sections.summary = data
        })
      )
    }

    if (config.sections.includes('trends')) {
      sectionPromises.push(
        Promise.all([
          this.engine.getDenialRateTrend(config.startDate, config.endDate, 'day'),
          this.engine.getRevenueImpactTrend(config.startDate, config.endDate),
        ]).then(([denialRate, revenueImpact]) => {
          report.sections.trends = { denialRate, revenueImpact }
        })
      )
    }

    if (config.sections.includes('providers')) {
      sectionPromises.push(
        this.engine.getProviderPerformance(config.startDate, config.endDate).then(data => {
          report.sections.providers = data
        })
      )
    }

    if (config.sections.includes('patterns')) {
      sectionPromises.push(
        this.engine.getPatternImpact(config.startDate, config.endDate).then(data => {
          report.sections.patterns = data
        })
      )
    }

    if (config.sections.includes('denialReasons')) {
      sectionPromises.push(
        this.engine.getDenialReasonBreakdown(config.startDate, config.endDate).then(data => {
          report.sections.denialReasons = data
        })
      )
    }

    if (config.sections.includes('appeals')) {
      sectionPromises.push(
        this.engine.getAppealMetrics(config.startDate, config.endDate).then(data => {
          report.sections.appeals = data
        })
      )
    }

    if (config.sections.includes('comparison')) {
      const periodDays = days
      const previousStart = new Date(
        new Date(config.startDate).getTime() - periodDays * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0]!
      const previousEnd = config.startDate

      sectionPromises.push(
        Promise.all([
          this.engine.getPeriodMetrics(config.startDate, config.endDate),
          this.engine.getPeriodMetrics(previousStart, previousEnd),
        ]).then(([current, previous]) => {
          report.sections.comparison = {
            currentPeriod: current,
            previousPeriod: previous,
            changes: {
              denialRateChange: parseFloat(current.denialRate) - parseFloat(previous.denialRate),
              deniedAmountChange: current.totalDenied - previous.totalDenied,
            },
          }
        })
      )
    }

    await Promise.all(sectionPromises)

    // Convert to requested format
    if (config.format === 'csv') {
      return this.toCSV(report)
    }

    return report
  }

  /**
   * Convert report to CSV format
   */
  private toCSV(report: GeneratedReport): string {
    const lines: string[] = []

    // Header
    lines.push(`"${report.title}"`)
    lines.push(`"Generated: ${report.generatedAt}"`)
    lines.push(`"Period: ${report.period.startDate} to ${report.period.endDate} (${report.period.days} days)"`)
    lines.push('')

    // Summary section
    if (report.sections.summary) {
      lines.push('"SUMMARY"')
      lines.push('"Metric","Value"')
      const summary = report.sections.summary
      lines.push(`"Total Claims","${summary.totalClaims}"`)
      lines.push(`"Denied Claims","${summary.deniedCount}"`)
      lines.push(`"Denial Rate","${summary.denialRate}%"`)
      lines.push(`"Total Billed","$${summary.totalBilled.toLocaleString()}"`)
      lines.push(`"Total Denied","$${summary.totalDenied.toLocaleString()}"`)
      lines.push(`"Total Paid","$${summary.totalPaid.toLocaleString()}"`)
      lines.push(`"Recovery Rate","${summary.recoveryRate}%"`)
      lines.push('')
    }

    // Trends section
    if (report.sections.trends) {
      lines.push('"DENIAL RATE TREND"')
      lines.push('"Date","Denial Rate (%)"')
      for (const point of report.sections.trends.denialRate) {
        lines.push(`"${point.date}","${point.value}"`)
      }
      lines.push('')

      lines.push('"REVENUE IMPACT TREND"')
      lines.push('"Date","Denied Amount ($)"')
      for (const point of report.sections.trends.revenueImpact) {
        lines.push(`"${point.date}","${point.value}"`)
      }
      lines.push('')
    }

    // Providers section
    if (report.sections.providers && report.sections.providers.length > 0) {
      lines.push('"PROVIDER PERFORMANCE"')
      lines.push('"Provider ID","Provider Name","Total Claims","Denied Claims","Denial Rate (%)","Billed Amount ($)","Denied Amount ($)"')
      for (const provider of report.sections.providers) {
        lines.push(
          `"${provider.providerId}","${provider.providerName || ''}","${provider.totalClaims}","${provider.deniedClaims}","${provider.denialRate}","${provider.billedAmount}","${provider.deniedAmount}"`
        )
      }
      lines.push('')
    }

    // Patterns section
    if (report.sections.patterns && report.sections.patterns.length > 0) {
      lines.push('"PATTERN IMPACT"')
      lines.push('"Pattern","Category","Denial Count","Total Impact ($)","Avg Per Denial ($)"')
      for (const pattern of report.sections.patterns) {
        lines.push(
          `"${pattern.patternTitle || pattern.patternId}","${pattern.category || ''}","${pattern.denialCount}","${pattern.totalImpact}","${pattern.avgPerDenial}"`
        )
      }
      lines.push('')
    }

    // Denial Reasons section
    if (report.sections.denialReasons && report.sections.denialReasons.length > 0) {
      lines.push('"DENIAL REASONS"')
      lines.push('"Reason","Count","Percentage (%)"')
      for (const reason of report.sections.denialReasons) {
        lines.push(`"${reason.name}","${reason.value}","${reason.percentage}"`)
      }
      lines.push('')
    }

    // Appeals section
    if (report.sections.appeals) {
      lines.push('"APPEALS"')
      lines.push('"Metric","Value"')
      const appeals = report.sections.appeals
      lines.push(`"Total Appeals","${appeals.totalAppeals}"`)
      lines.push(`"Pending","${appeals.pendingAppeals}"`)
      lines.push(`"Overturned","${appeals.overturnedAppeals}"`)
      lines.push(`"Upheld","${appeals.upheldAppeals}"`)
      lines.push(`"Overturn Rate","${appeals.overturnRate}%"`)
      lines.push('')
    }

    // Comparison section
    if (report.sections.comparison) {
      lines.push('"PERIOD COMPARISON"')
      lines.push('"Metric","Current Period","Previous Period","Change"')
      const comp = report.sections.comparison
      lines.push(
        `"Denial Rate","${comp.currentPeriod.denialRate}%","${comp.previousPeriod.denialRate}%","${comp.changes.denialRateChange > 0 ? '+' : ''}${comp.changes.denialRateChange.toFixed(2)}%"`
      )
      lines.push(
        `"Denied Amount","$${comp.currentPeriod.totalDenied.toLocaleString()}","$${comp.previousPeriod.totalDenied.toLocaleString()}","${comp.changes.deniedAmountChange > 0 ? '+' : ''}$${comp.changes.deniedAmountChange.toLocaleString()}"`
      )
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Get available report templates
   */
  getTemplates() {
    return [
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level overview with key metrics and trends',
        sections: ['summary', 'comparison', 'trends'] as ReportSection[],
      },
      {
        id: 'provider-performance',
        name: 'Provider Performance Report',
        description: 'Detailed breakdown by provider with denial rates',
        sections: ['summary', 'providers', 'patterns'] as ReportSection[],
      },
      {
        id: 'denial-analysis',
        name: 'Denial Analysis Report',
        description: 'In-depth analysis of denial reasons and patterns',
        sections: ['summary', 'denialReasons', 'patterns', 'trends'] as ReportSection[],
      },
      {
        id: 'appeal-outcomes',
        name: 'Appeal Outcomes Report',
        description: 'Appeal statistics and success rates',
        sections: ['summary', 'appeals', 'comparison'] as ReportSection[],
      },
      {
        id: 'full-report',
        name: 'Comprehensive Report',
        description: 'Complete analytics report with all sections',
        sections: ['summary', 'trends', 'providers', 'patterns', 'denialReasons', 'appeals', 'comparison'] as ReportSection[],
      },
    ]
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let reportGeneratorInstance: ReportGenerator | null = null

export function getReportGenerator(): ReportGenerator {
  if (!reportGeneratorInstance) {
    reportGeneratorInstance = new ReportGenerator()
  }
  return reportGeneratorInstance
}
