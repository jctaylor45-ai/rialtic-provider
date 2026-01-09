/**
 * Base Data Source Adapter
 *
 * Abstract class for integrating external claim data sources.
 * Provides common interface for HL7, ERA, CSV, and other formats.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ExternalClaim {
  [key: string]: unknown
}

export interface ExternalAppeal {
  [key: string]: unknown
}

export interface InternalClaim {
  id: string
  providerId: string
  providerName?: string
  claimType: string
  patientName: string
  patientDob: string
  patientSex: string
  memberId: string
  billedAmount: number
  paidAmount: number
  dateOfService: string
  procedureCodes: string[]
  diagnosisCodes: string[]
  status: 'approved' | 'denied' | 'pending' | 'appealed' | 'paid'
  denialReason?: string
  submissionDate: string
  processingDate?: string
  source: 'generated' | 'real'
  sourceSystem?: string
  sourceId?: string
}

export interface InternalAppeal {
  claimId: string
  appealFiled: boolean
  appealDate?: string
  appealReason?: string
  appealOutcome?: 'pending' | 'upheld' | 'overturned'
  outcomeDate?: string
  outcomeNotes?: string
}

export interface AdapterConfig {
  endpoint?: string
  apiKey?: string
  username?: string
  password?: string
  filePath?: string
  [key: string]: unknown
}

export interface FetchOptions {
  limit?: number
  offset?: number
  since?: string
  until?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// =============================================================================
// BASE ADAPTER CLASS
// =============================================================================

export abstract class DataSourceAdapter {
  abstract name: string
  abstract description: string
  abstract sourceType: string

  protected config: AdapterConfig = {}
  protected connected: boolean = false

  /**
   * Connect to the data source
   */
  abstract connect(config: AdapterConfig): Promise<void>

  /**
   * Disconnect from the data source
   */
  abstract disconnect(): Promise<void>

  /**
   * Fetch claims from the external source
   */
  abstract fetchClaims(options?: FetchOptions): Promise<ExternalClaim[]>

  /**
   * Fetch appeals from the external source
   */
  abstract fetchAppeals(options?: FetchOptions): Promise<ExternalAppeal[]>

  /**
   * Transform an external claim to internal format
   */
  abstract transformClaim(external: ExternalClaim): InternalClaim

  /**
   * Transform an external appeal to internal format
   */
  abstract transformAppeal(external: ExternalAppeal): InternalAppeal

  /**
   * Validate an external claim before transformation
   */
  abstract validate(claim: ExternalClaim): ValidationResult

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get adapter metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      sourceType: this.sourceType,
      connected: this.connected,
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format date from various formats to ISO date string
 */
export function formatDate(input: string | Date | undefined): string {
  if (!input) return new Date().toISOString().split('T')[0] as string

  if (input instanceof Date) {
    return input.toISOString().split('T')[0] as string
  }

  // Handle YYYYMMDD format (HL7)
  if (/^\d{8}$/.test(input)) {
    return `${input.substring(0, 4)}-${input.substring(4, 6)}-${input.substring(6, 8)}`
  }

  // Handle MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [month, day, year] = input.split('/')
    return `${year}-${month}-${day}`
  }

  // Assume already in ISO format
  return input.split('T')[0] || input
}

/**
 * Map external status to internal status
 */
export function mapStatus(externalStatus: string): InternalClaim['status'] {
  const statusMap: Record<string, InternalClaim['status']> = {
    // HL7/EDI statuses
    'PAID': 'paid',
    'APPROVED': 'approved',
    'DENIED': 'denied',
    'REJECTED': 'denied',
    'PENDING': 'pending',
    'APPEALED': 'appealed',
    'PARTIALLY_PAID': 'approved',
    // Common variations
    'A': 'approved',
    'D': 'denied',
    'P': 'pending',
    '1': 'pending',
    '2': 'approved',
    '3': 'denied',
    '4': 'paid',
  }

  const normalized = externalStatus.toUpperCase().trim()
  return statusMap[normalized] || 'pending'
}

/**
 * Generate a unique ID for imported claims
 */
export function generateClaimId(sourceType: string, externalId: string): string {
  return `${sourceType.toUpperCase()}-${externalId}-${Date.now().toString(36)}`
}

/**
 * Parse comma-separated codes into array
 */
export function parseCodes(input: string | string[] | undefined): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter(Boolean)
  return input.split(/[,;|]/).map(c => c.trim()).filter(Boolean)
}
