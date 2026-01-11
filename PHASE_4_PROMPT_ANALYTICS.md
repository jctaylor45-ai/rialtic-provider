# 🚀 Claude Code: Phase 4 - Analytics & Reporting

**Copy everything below** and paste into Claude Code in VS Code.

---

# Phase 4: Advanced Analytics & Reporting Layer

## Context

Phases 0-3 complete - you have live data flowing in and metrics computing. Now build comprehensive analytics, dashboards, and reports that show business impact and trends.

**Timeline**: 4 days
**Deliverable**: Executive dashboard, trend analytics, comparative reports, export capabilities

## Phase 4 Responsibilities

1. Build analytics aggregation layer
2. Create executive dashboard with KPIs
3. Build comparative analytics (period-over-period)
4. Create downloadable reports
5. Add data visualization components
6. Build custom report builder

## Architecture Overview

```
Raw Data (Claims, Appeals, Events)
    ↓
Aggregations (time-series, cohort analysis)
    ↓
Derived Metrics (KPIs, ROI, trends)
    ↓
Dashboards (visualization & exploration)
    ↓
Reports (exportable summaries)
```

## Day 1: Analytics Aggregation Layer

### Create `server/services/analyticsEngine.ts`

```typescript
import { db } from '~/server/database'
import { claims, patterns, learningEvents } from '~/server/database/schema'
import { sql, count, sum, eq, and, gte, lte } from 'drizzle-orm'

interface TimeSeriesPoint {
  date: string
  value: number
}

interface Cohort {
  name: string
  value: number
  percentage: number
}

/**
 * Analytics engine for aggregating metrics
 */
export class AnalyticsEngine {
  /**
   * Get denial rate over time
   */
  async getDenialRateTrend(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesPoint[]> {
    const results = await db
      .select({
        date: sql<string>`strftime('%Y-%m-${groupBy === 'day' ? '%d' : groupBy === 'week' ? '%W' : '%m'}', dateOfService)`,
        total: count(),
        denied: sql<number>`SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)`
      })
      .from(claims)
      .where(and(gte(claims.dateOfService, startDate), lte(claims.dateOfService, endDate)))
      .groupBy(sql`strftime('%Y-%m-${groupBy === 'day' ? '%d' : groupBy === 'week' ? '%W' : '%m'}', dateOfService)`)

    return results.map(r => ({
      date: r.date,
      value: r.total > 0 ? (r.denied / r.total) * 100 : 0
    }))
  }

  /**
   * Get revenue impact over time
   */
  async getRevenueImpactTrend(
    startDate: string,
    endDate: string
  ): Promise<TimeSeriesPoint[]> {
    const results = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', dateOfService)`,
        deniedAmount: sql<number>`SUM(CASE WHEN status = 'denied' THEN billedAmount ELSE 0 END)`,
        recoveredAmount: sql<number>`SUM(CASE WHEN status = 'approved' THEN paidAmount ELSE 0 END)`
      })
      .from(claims)
      .where(and(gte(claims.dateOfService, startDate), lte(claims.dateOfService, endDate)))
      .groupBy(sql`strftime('%Y-%m-%d', dateOfService)`)

    return results.map(r => ({
      date: r.date,
      value: (r.recoveredAmount || 0) - (r.deniedAmount || 0)
    }))
  }

  /**
   * Get denial reasons breakdown
   */
  async getDenialReasonBreakdown(startDate: string, endDate: string): Promise<Cohort[]> {
    const results = await db
      .select({
        reason: claims.denialReason,
        count: count()
      })
      .from(claims)
      .where(
        and(
          eq(claims.status, 'denied'),
          gte(claims.dateOfService, startDate),
          lte(claims.dateOfService, endDate)
        )
      )
      .groupBy(claims.denialReason)

    const total = results.reduce((sum, r) => sum + r.count, 0)

    return results
      .map(r => ({
        name: r.reason || 'Other',
        value: r.count,
        percentage: (r.count / total) * 100
      }))
      .sort((a, b) => b.value - a.value)
  }

  /**
   * Get provider performance metrics
   */
  async getProviderPerformance(startDate: string, endDate: string) {
    const results = await db
      .select({
        providerId: claims.providerId,
        total: count(),
        denied: sql<number>`SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)`,
        deniedAmount: sql<number>`SUM(CASE WHEN status = 'denied' THEN billedAmount ELSE 0 END)`,
        billedAmount: sql<number>`SUM(billedAmount)`
      })
      .from(claims)
      .where(and(gte(claims.dateOfService, startDate), lte(claims.dateOfService, endDate)))
      .groupBy(claims.providerId)

    return results
      .map(r => ({
        providerId: r.providerId,
        totalClaims: r.total,
        deniedClaims: r.denied,
        denialRate: r.total > 0 ? ((r.denied / r.total) * 100).toFixed(1) : '0',
        billedAmount: r.billedAmount,
        deniedAmount: r.deniedAmount,
        recoveryOpportunity: r.deniedAmount || 0
      }))
      .sort((a, b) => parseFloat(b.denialRate) - parseFloat(a.denialRate))
  }

  /**
   * Get pattern impact (how much each pattern cost)
   */
  async getPatternImpact(startDate: string, endDate: string) {
    const patternData = await db.select().from(patterns)

    const impacts = await Promise.all(
      patternData.map(async pattern => {
        // Find denied claims matching this pattern
        const matchingDenials = await db
          .select({
            count: count(),
            amount: sql<number>`SUM(billedAmount)`
          })
          .from(claims)
          .where(
            and(
              eq(claims.status, 'denied'),
              sql`denialReason LIKE '%${pattern.name}%'`,
              gte(claims.dateOfService, startDate),
              lte(claims.dateOfService, endDate)
            )
          )

        return {
          patternId: pattern.id,
          patternName: pattern.name,
          denialCount: matchingDenials[0]?.count || 0,
          totalImpact: matchingDenials[0]?.amount || 0,
          avgPerDenial: matchingDenials[0]?.count > 0
            ? Math.round((matchingDenials[0]?.amount || 0) / matchingDenials[0].count)
            : 0
        }
      })
    )

    return impacts.filter(i => i.denialCount > 0).sort((a, b) => b.totalImpact - a.totalImpact)
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(period1: { start: string; end: string }, period2: { start: string; end: string }) {
    const p1 = await this.getPeriodMetrics(period1.start, period1.end)
    const p2 = await this.getPeriodMetrics(period2.start, period2.end)

    return {
      period1: p1,
      period2: p2,
      changes: {
        denialRateChange: parseFloat(p2.denialRate) - parseFloat(p1.denialRate),
        totalDeniedChange: p2.totalDenied - p1.totalDenied,
        denialCountChange: p2.deniedCount - p1.deniedCount
      }
    }
  }

  private async getPeriodMetrics(startDate: string, endDate: string) {
    const results = await db
      .select({
        total: count(),
        denied: sql<number>`SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)`,
        deniedAmount: sql<number>`SUM(CASE WHEN status = 'denied' THEN billedAmount ELSE 0 END)`,
        billedAmount: sql<number>`SUM(billedAmount)`
      })
      .from(claims)
      .where(and(gte(claims.dateOfService, startDate), lte(claims.dateOfService, endDate)))

    const r = results[0]
    const total = r.total || 1

    return {
      totalClaims: total,
      deniedCount: r.denied,
      totalDenied: r.deniedAmount || 0,
      denialRate: ((r.denied / total) * 100).toFixed(2),
      billedAmount: r.billedAmount || 0
    }
  }
}
```

**Day 1 Success**: Analytics engine computes trends, comparisons, patterns

---

## Day 2: Dashboard & KPI API Endpoints

### Create `server/api/v1/analytics/dashboard.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { AnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    const engine = new AnalyticsEngine()

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Fetch all dashboard metrics in parallel
    const [
      denialRateTrend,
      revenueImpactTrend,
      denialReasons,
      providerPerformance,
      patternImpact
    ] = await Promise.all([
      engine.getDenialRateTrend(startDate, endDate, 'day'),
      engine.getRevenueImpactTrend(startDate, endDate),
      engine.getDenialReasonBreakdown(startDate, endDate),
      engine.getProviderPerformance(startDate, endDate),
      engine.getPatternImpact(startDate, endDate)
    ])

    return {
      period: { days, startDate, endDate },
      kpis: {
        denialRateTrend,
        revenueImpactTrend,
        denialReasons,
        topProviderIssues: providerPerformance.slice(0, 5),
        topPatternImpacts: patternImpact.slice(0, 5)
      },
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return { error: 'Failed to generate dashboard' }
  }
})
```

### Create `server/api/v1/analytics/trends.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { AnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const days = parseInt(query.days as string) || 90
    const groupBy = (query.groupBy as 'day' | 'week' | 'month') || 'day'

    const engine = new AnalyticsEngine()

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const denialRateTrend = await engine.getDenialRateTrend(startDate, endDate, groupBy)

    return {
      metric: 'denialRate',
      period: { days, startDate, endDate, groupBy },
      data: denialRateTrend
    }
  } catch (error) {
    console.error('Trends error:', error)
    return { error: 'Failed to calculate trends' }
  }
})
```

### Create `server/api/v1/analytics/comparison.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import { AnalyticsEngine } from '~/server/services/analyticsEngine'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    // Default: last 30 days vs previous 30 days
    const current = new Date()
    const period2End = current.toISOString().split('T')[0]
    const period2Start = new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const period1End = period2Start
    const period1Start = new Date(
      new Date(period2Start).getTime() - 30 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0]

    const engine = new AnalyticsEngine()
    const comparison = await engine.comparePeriods(
      { start: period1Start, end: period1End },
      { start: period2Start, end: period2End }
    )

    return {
      comparison,
      periods: {
        period1: { start: period1Start, end: period1End },
        period2: { start: period2Start, end: period2End }
      }
    }
  } catch (error) {
    console.error('Comparison error:', error)
    return { error: 'Failed to compare periods' }
  }
})
```

**Day 2 Success**: Dashboard API endpoints working, all KPIs calculated

---

## Day 3: Export & Reporting

### Create `server/services/reportGenerator.ts`

```typescript
import { AnalyticsEngine } from './analyticsEngine'

export interface ReportConfig {
  title: string
  startDate: string
  endDate: string
  sections: string[] // 'summary', 'trends', 'providers', 'patterns'
  format: 'json' | 'csv' | 'pdf'
}

export class ReportGenerator {
  async generate(config: ReportConfig) {
    const engine = new AnalyticsEngine()

    const report: any = {
      title: config.title,
      generatedAt: new Date().toISOString(),
      period: { startDate: config.startDate, endDate: config.endDate },
      sections: {}
    }

    if (config.sections.includes('summary')) {
      const comparison = await engine.comparePeriods(
        { start: config.startDate, end: config.endDate },
        { start: config.startDate, end: config.endDate }
      )
      report.sections.summary = comparison.period2
    }

    if (config.sections.includes('trends')) {
      const denialRateTrend = await engine.getDenialRateTrend(
        config.startDate,
        config.endDate,
        'day'
      )
      report.sections.trends = { denialRate: denialRateTrend }
    }

    if (config.sections.includes('providers')) {
      const providers = await engine.getProviderPerformance(
        config.startDate,
        config.endDate
      )
      report.sections.providers = providers
    }

    if (config.sections.includes('patterns')) {
      const patterns = await engine.getPatternImpact(config.startDate, config.endDate)
      report.sections.patterns = patterns
    }

    if (config.format === 'csv') {
      return this.toCSV(report)
    } else if (config.format === 'pdf') {
      return this.toPDF(report)
    }

    return report
  }

  private toCSV(report: any): string {
    let csv = `"${report.title}"\n`
    csv += `"Generated: ${report.generatedAt}"\n`
    csv += `"Period: ${report.period.startDate} to ${report.period.endDate}"\n\n`

    // Add sections as CSV tables
    for (const [sectionName, sectionData] of Object.entries(report.sections)) {
      csv += `\n"${sectionName}"\n`

      if (Array.isArray(sectionData)) {
        if (sectionData.length > 0) {
          const headers = Object.keys(sectionData[0])
          csv += headers.map(h => `"${h}"`).join(',') + '\n'

          for (const row of sectionData) {
            csv += Object.values(row)
              .map(v => `"${v}"`)
              .join(',') + '\n'
          }
        }
      }
    }

    return csv
  }

  private toPDF(report: any): string {
    // For production: use library like pdfkit or puppeteer
    // For now: return placeholder
    return JSON.stringify(report)
  }
}
```

### Create `server/api/v1/reports/generate.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { ReportGenerator } from '~/server/services/reportGenerator'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, startDate, endDate, sections, format } = body

    const generator = new ReportGenerator()
    const report = await generator.generate({
      title: title || 'Analytics Report',
      startDate,
      endDate,
      sections: sections || ['summary', 'trends'],
      format: format || 'json'
    })

    // Set response headers for download
    if (format === 'csv') {
      setHeader(event, 'Content-Type', 'text/csv')
      setHeader(event, 'Content-Disposition', `attachment; filename="report-${Date.now()}.csv"`)
      return report
    }

    return { report, format }
  } catch (error) {
    console.error('Report generation error:', error)
    return { error: 'Failed to generate report' }
  }
})
```

**Day 3 Success**: Reports can be exported in JSON/CSV/PDF

---

## Day 4: Dashboard Components & Custom Analytics

### Create `components/insights/DashboardMetrics.vue`

```vue
<template>
  <div class="dashboard-container">
    <div class="kpi-grid">
      <KPICard 
        title="Denial Rate Trend"
        :data="denialRateTrend"
        unit="%"
        sparkline
      />
      <KPICard 
        title="Revenue Impact"
        :data="revenueImpactTrend"
        unit="$"
        sparkline
      />
      <KPICard 
        title="Top Denial Reason"
        :data="topDenialReason"
        unit="claims"
      />
    </div>

    <div class="charts-grid">
      <Chart
        type="line"
        title="30-Day Denial Rate Trend"
        :data="denialRateTrend"
      />
      <Chart
        type="bar"
        title="Denial Reasons"
        :data="denialReasons"
      />
      <Chart
        type="bar"
        title="Top Provider Issues"
        :data="providerPerformance"
      />
      <Chart
        type="bar"
        title="Pattern Impact"
        :data="patternImpact"
      />
    </div>

    <div class="export-controls">
      <button @click="exportReport('json')" class="btn btn-primary">
        Export JSON
      </button>
      <button @click="exportReport('csv')" class="btn btn-secondary">
        Export CSV
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const dashboardData = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    dashboardData.value = await $fetch('/api/v1/analytics/dashboard?days=30')
    loading.value = false
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
})

const denialRateTrend = computed(() => dashboardData.value?.kpis?.denialRateTrend || [])
const revenueImpactTrend = computed(() => dashboardData.value?.kpis?.revenueImpactTrend || [])
const denialReasons = computed(() => dashboardData.value?.kpis?.denialReasons || [])
const providerPerformance = computed(() => dashboardData.value?.kpis?.topProviderIssues || [])
const patternImpact = computed(() => dashboardData.value?.kpis?.topPatternImpacts || [])

const topDenialReason = computed(() => {
  if (denialReasons.value.length === 0) return null
  return denialReasons.value[0]
})

async function exportReport(format: 'json' | 'csv') {
  try {
    const response = await $fetch('/api/v1/reports/generate', {
      method: 'POST',
      body: {
        title: 'Claims Analytics Report',
        startDate: dashboardData.value.period.startDate,
        endDate: dashboardData.value.period.endDate,
        sections: ['summary', 'trends', 'providers', 'patterns'],
        format
      }
    })

    // Trigger download
    if (format === 'csv') {
      downloadFile(response, `report-${Date.now()}.csv`, 'text/csv')
    } else {
      downloadFile(JSON.stringify(response, null, 2), `report-${Date.now()}.json`, 'application/json')
    }
  } catch (error) {
    console.error('Export failed:', error)
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
  background: white;
  border-radius: 0.5rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.export-controls {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
```

**Day 4 Success**: Dashboard components render analytics, exports working

---

## Implementation Checklist

- [ ] Day 1: Analytics engine computes all metrics
- [ ] Day 1: Trend calculations working
- [ ] Day 2: Dashboard API endpoints complete
- [ ] Day 2: All KPIs calculated and accessible
- [ ] Day 3: Report generation working
- [ ] Day 3: CSV/JSON export functioning
- [ ] Day 4: Dashboard components rendering
- [ ] Day 4: Export buttons functional

## Testing

```bash
# Test dashboard API
curl http://localhost:3000/api/v1/analytics/dashboard?days=30

# Test trends API
curl http://localhost:3000/api/v1/analytics/trends?days=90&groupBy=day

# Test comparison
curl http://localhost:3000/api/v1/analytics/comparison

# Test report generation
curl -X POST http://localhost:3000/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monthly Report",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "sections": ["summary", "trends", "providers"],
    "format": "csv"
  }'
```

## Success Criteria

- ✅ Dashboard shows KPIs and trends
- ✅ Period-over-period comparison working
- ✅ Provider performance rankings accurate
- ✅ Pattern impact analysis complete
- ✅ Reports exportable in multiple formats
- ✅ All visualizations rendering correctly

## Commits

```
git commit -m "Phase 4 Day 1: Analytics aggregation engine"
git commit -m "Phase 4 Day 2: Dashboard API endpoints"
git commit -m "Phase 4 Day 3: Report generation and export"
git commit -m "Phase 4 Day 4: Dashboard UI components"
```

---

**Next Phase**: Phase 5 (Optimization) optimizes queries, adds caching, scales to production

Good luck! This phase brings business intelligence to life.
