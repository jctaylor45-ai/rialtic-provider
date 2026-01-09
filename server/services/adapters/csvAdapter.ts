/**
 * CSV Claims Adapter
 *
 * Handles CSV file imports for bulk claim uploads.
 * Supports flexible column mapping.
 */

import {
  DataSourceAdapter,
  formatDate,
  mapStatus,
  generateClaimId,
  parseCodes,
} from './baseAdapter'
import type {
  ExternalClaim,
  ExternalAppeal,
  InternalClaim,
  InternalAppeal,
  AdapterConfig,
  FetchOptions,
  ValidationResult,
} from './baseAdapter'

// =============================================================================
// CSV CONFIGURATION
// =============================================================================

export interface CSVColumnMapping {
  claimId: string
  patientName: string
  patientDob: string
  patientSex: string
  memberId: string
  providerId: string
  providerName?: string
  dateOfService: string
  billedAmount: string
  paidAmount?: string
  status: string
  denialReason?: string
  procedureCodes?: string
  diagnosisCodes?: string
  submissionDate?: string
}

const DEFAULT_COLUMN_MAPPING: CSVColumnMapping = {
  claimId: 'claim_id',
  patientName: 'patient_name',
  patientDob: 'patient_dob',
  patientSex: 'patient_sex',
  memberId: 'member_id',
  providerId: 'provider_id',
  providerName: 'provider_name',
  dateOfService: 'date_of_service',
  billedAmount: 'billed_amount',
  paidAmount: 'paid_amount',
  status: 'status',
  denialReason: 'denial_reason',
  procedureCodes: 'procedure_codes',
  diagnosisCodes: 'diagnosis_codes',
  submissionDate: 'submission_date',
}

// =============================================================================
// CSV ADAPTER CLASS
// =============================================================================

export class CSVAdapter extends DataSourceAdapter {
  name = 'CSV Import'
  description = 'Import claims from CSV files'
  sourceType = 'csv'

  private data: ExternalClaim[] = []
  private columnMapping: CSVColumnMapping = DEFAULT_COLUMN_MAPPING

  async connect(config: AdapterConfig): Promise<void> {
    this.config = config

    // Set custom column mapping if provided
    if (config.columnMapping) {
      this.columnMapping = {
        ...DEFAULT_COLUMN_MAPPING,
        ...(config.columnMapping as Partial<CSVColumnMapping>),
      }
    }

    // If CSV content is provided directly
    if (config.csvContent) {
      this.data = this.parseCSV(config.csvContent as string)
    }

    this.connected = true
    console.log(`CSV Adapter: Connected with ${this.data.length} records`)
  }

  async disconnect(): Promise<void> {
    this.data = []
    this.connected = false
    console.log('CSV Adapter: Disconnected')
  }

  async fetchClaims(options?: FetchOptions): Promise<ExternalClaim[]> {
    if (!this.connected) {
      throw new Error('CSV Adapter not connected')
    }

    const { limit = 100, offset = 0 } = options || {}
    return this.data.slice(offset, offset + limit)
  }

  async fetchAppeals(_options?: FetchOptions): Promise<ExternalAppeal[]> {
    // CSV import doesn't typically include appeals
    return []
  }

  transformClaim(external: ExternalClaim): InternalClaim {
    const m = this.columnMapping

    return {
      id: generateClaimId('CSV', String(external[m.claimId] || Date.now())),
      providerId: String(external[m.providerId] || ''),
      providerName: m.providerName ? String(external[m.providerName] || '') : undefined,
      claimType: 'Professional',
      patientName: String(external[m.patientName] || ''),
      patientDob: formatDate(String(external[m.patientDob] || '')),
      patientSex: this.normalizeSex(String(external[m.patientSex] || '')),
      memberId: String(external[m.memberId] || ''),
      billedAmount: this.parseAmount(external[m.billedAmount]),
      paidAmount: m.paidAmount ? this.parseAmount(external[m.paidAmount]) : 0,
      dateOfService: formatDate(String(external[m.dateOfService] || '')),
      procedureCodes: m.procedureCodes ? parseCodes(String(external[m.procedureCodes] || '')) : [],
      diagnosisCodes: m.diagnosisCodes ? parseCodes(String(external[m.diagnosisCodes] || '')) : [],
      status: mapStatus(String(external[m.status] || 'pending')),
      denialReason: m.denialReason ? String(external[m.denialReason] || '') || undefined : undefined,
      submissionDate: m.submissionDate ? formatDate(String(external[m.submissionDate] || '')) : formatDate(undefined),
      source: 'real',
      sourceSystem: 'CSV',
      sourceId: String(external[m.claimId] || ''),
    }
  }

  transformAppeal(_external: ExternalAppeal): InternalAppeal {
    throw new Error('CSV adapter does not support appeals')
  }

  validate(claim: ExternalClaim): ValidationResult {
    const errors: string[] = []
    const m = this.columnMapping

    if (!claim[m.claimId]) {
      errors.push(`Missing claim ID (column: ${m.claimId})`)
    }

    if (!claim[m.patientName]) {
      errors.push(`Missing patient name (column: ${m.patientName})`)
    }

    if (!claim[m.providerId]) {
      errors.push(`Missing provider ID (column: ${m.providerId})`)
    }

    if (!claim[m.billedAmount]) {
      errors.push(`Missing billed amount (column: ${m.billedAmount})`)
    }

    if (!claim[m.dateOfService]) {
      errors.push(`Missing date of service (column: ${m.dateOfService})`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Load CSV content directly
   */
  loadCSV(content: string): number {
    this.data = this.parseCSV(content)
    return this.data.length
  }

  /**
   * Get column headers from loaded data
   */
  getHeaders(): string[] {
    if (this.data.length === 0) return []
    return Object.keys(this.data[0] || {})
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private parseCSV(content: string): ExternalClaim[] {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []

    const headers = this.parseCSVLine(lines[0]!)
    const records: ExternalClaim[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]!)
      if (values.length !== headers.length) continue

      const record: ExternalClaim = {}
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || ''
      })
      records.push(record)
    }

    return records
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  private parseAmount(value: unknown): number {
    if (typeof value === 'number') return value
    if (!value) return 0

    const str = String(value).replace(/[$,]/g, '')
    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  private normalizeSex(value: string): string {
    const lower = value.toLowerCase().trim()
    if (lower === 'm' || lower === 'male') return 'male'
    if (lower === 'f' || lower === 'female') return 'female'
    return 'unknown'
  }
}
