/**
 * HL7 837 Claims Adapter
 *
 * Handles 837I (institutional) and 837P (professional) claims.
 * Connects to healthcare clearinghouses and payer systems.
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
// HL7 CLAIM INTERFACE
// =============================================================================

interface HL7Claim {
  hl7_claim_id: string
  claim_submission_date: string
  patient_name: string
  patient_dob: string
  patient_sex: string
  member_id: string
  provider_npi: string
  provider_name?: string
  claim_type: string
  service_date: string
  procedure_codes: string | string[]
  diagnosis_codes: string | string[]
  billed_amount: number
  paid_amount: number
  claim_status: string
  denial_reason?: string | null
  denial_code?: string
  line_items?: Array<{
    line_number: number
    procedure_code: string
    modifier?: string
    quantity: number
    billed_amount: number
    paid_amount: number
    status: string
    denial_reason?: string
  }>
  [key: string]: unknown
}

interface HL7Appeal {
  appeal_id: string
  claim_id: string
  appeal_date: string
  appeal_reason: string
  appeal_status: string
  outcome_date?: string
  outcome_notes?: string
  [key: string]: unknown
}

// =============================================================================
// HL7 ADAPTER CLASS
// =============================================================================

export class HL7Adapter extends DataSourceAdapter {
  name = 'HL7 837'
  description = 'HL7 837 EDI Claims Format (Professional & Institutional)'
  sourceType = 'hl7'

  private apiClient: unknown = null

  async connect(config: AdapterConfig): Promise<void> {
    this.config = config

    // In production, this would authenticate with a clearinghouse API
    // For demo, we simulate a successful connection
    if (config.endpoint) {
      console.log(`HL7 Adapter: Connecting to ${config.endpoint}`)
      // Simulate API authentication
      // this.apiClient = await clearinghouseAPI.connect(config)
    }

    this.connected = true
    console.log('HL7 Adapter: Connected successfully')
  }

  async disconnect(): Promise<void> {
    this.apiClient = null
    this.connected = false
    console.log('HL7 Adapter: Disconnected')
  }

  async fetchClaims(options?: FetchOptions): Promise<ExternalClaim[]> {
    if (!this.connected) {
      throw new Error('HL7 Adapter not connected')
    }

    const { limit = 100, offset = 0, since } = options || {}

    // In production, this would fetch from clearinghouse API
    // For demo, return mock data that simulates real HL7 claims
    console.log(`HL7 Adapter: Fetching claims (limit=${limit}, offset=${offset})`)

    // Return demo claims that match HL7 format
    return this.generateDemoClaims(limit, since)
  }

  async fetchAppeals(options?: FetchOptions): Promise<ExternalAppeal[]> {
    if (!this.connected) {
      throw new Error('HL7 Adapter not connected')
    }

    // Return demo appeals
    return this.generateDemoAppeals(options?.limit || 10)
  }

  transformClaim(external: ExternalClaim): InternalClaim {
    const hl7 = external as unknown as HL7Claim

    return {
      id: generateClaimId('HL7', hl7.hl7_claim_id),
      providerId: hl7.provider_npi,
      providerName: hl7.provider_name,
      claimType: this.mapClaimType(hl7.claim_type),
      patientName: this.formatPatientName(hl7.patient_name),
      patientDob: formatDate(hl7.patient_dob),
      patientSex: this.mapSex(hl7.patient_sex),
      memberId: hl7.member_id,
      billedAmount: hl7.billed_amount,
      paidAmount: hl7.paid_amount || 0,
      dateOfService: formatDate(hl7.service_date),
      procedureCodes: parseCodes(hl7.procedure_codes),
      diagnosisCodes: parseCodes(hl7.diagnosis_codes),
      status: mapStatus(hl7.claim_status),
      denialReason: hl7.denial_reason || this.mapDenialCode(hl7.denial_code),
      submissionDate: formatDate(hl7.claim_submission_date),
      processingDate: new Date().toISOString().split('T')[0],
      source: 'real',
      sourceSystem: 'HL7-837',
      sourceId: hl7.hl7_claim_id,
    }
  }

  transformAppeal(external: ExternalAppeal): InternalAppeal {
    const hl7 = external as unknown as HL7Appeal

    return {
      claimId: hl7.claim_id,
      appealFiled: true,
      appealDate: formatDate(hl7.appeal_date),
      appealReason: hl7.appeal_reason,
      appealOutcome: this.mapAppealOutcome(hl7.appeal_status),
      outcomeDate: hl7.outcome_date ? formatDate(hl7.outcome_date) : undefined,
      outcomeNotes: hl7.outcome_notes,
    }
  }

  validate(claim: ExternalClaim): ValidationResult {
    const errors: string[] = []
    const hl7 = claim as unknown as HL7Claim

    if (!hl7.hl7_claim_id) {
      errors.push('Missing claim ID')
    }

    if (!hl7.provider_npi) {
      errors.push('Missing provider NPI')
    }

    if (hl7.billed_amount === undefined || hl7.billed_amount === null) {
      errors.push('Missing billed amount')
    }

    if (!hl7.service_date) {
      errors.push('Missing service date')
    }

    if (!hl7.patient_name) {
      errors.push('Missing patient name')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private mapClaimType(type: string): string {
    const mapping: Record<string, string> = {
      'P': 'Professional',
      'I': 'Institutional',
      'D': 'Dental',
      'PROFESSIONAL': 'Professional',
      'INSTITUTIONAL': 'Institutional',
    }
    return mapping[type.toUpperCase()] || type
  }

  private mapSex(sex: string): string {
    const mapping: Record<string, string> = {
      'M': 'male',
      'F': 'female',
      'U': 'unknown',
      'MALE': 'male',
      'FEMALE': 'female',
    }
    return mapping[sex.toUpperCase()] || 'unknown'
  }

  private formatPatientName(name: string): string {
    // Convert "DOE^JOHN" or "DOE, JOHN" to "John Doe"
    const parts = name.split(/[\^,]/).map(p => p.trim())
    if (parts.length >= 2) {
      const lastName = parts[0] || ''
      const firstName = parts[1] || ''
      return `${this.titleCase(firstName)} ${this.titleCase(lastName)}`
    }
    return this.titleCase(name)
  }

  private titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  private mapDenialCode(code?: string): string | undefined {
    if (!code) return undefined

    const denialCodes: Record<string, string> = {
      '1': 'Deductible not met',
      '2': 'Coinsurance amount',
      '3': 'Co-payment amount',
      '4': 'Services not covered',
      '16': 'Claim submitted without required information',
      '18': 'Duplicate claim/service',
      '19': 'Maximum benefit exceeded',
      '22': 'Out of network provider',
      '23': 'Prior authorization required',
      '29': 'Time limit expired for filing',
      '45': 'Charge exceeds fee schedule',
      '50': 'Non-covered service',
      '96': 'Non-covered charge',
      '97': 'Payment included in primary payer amount',
      'A1': 'Missing modifier',
      'A6': 'Prior authorization required',
      'B7': 'Provider not eligible',
      'CO': 'Contractual obligation',
      'OA': 'Other adjustment',
      'PI': 'Payer initiated reduction',
      'PR': 'Patient responsibility',
    }

    return denialCodes[code] || `Denial code: ${code}`
  }

  private mapAppealOutcome(status: string): 'pending' | 'upheld' | 'overturned' {
    const mapping: Record<string, 'pending' | 'upheld' | 'overturned'> = {
      'PENDING': 'pending',
      'ACCEPTED': 'pending',
      'OVERTURNED': 'overturned',
      'APPROVED': 'overturned',
      'UPHELD': 'upheld',
      'DENIED': 'upheld',
    }
    return mapping[status.toUpperCase()] || 'pending'
  }

  // =============================================================================
  // DEMO DATA GENERATION
  // =============================================================================

  private generateDemoClaims(count: number, since?: string): HL7Claim[] {
    const claims: HL7Claim[] = []
    const statuses = ['PAID', 'DENIED', 'PENDING', 'PARTIALLY_PAID']
    const denialReasons = [
      'Missing modifier 25 for E&M service with procedure',
      'Prior authorization not obtained',
      'Documentation does not support medical necessity',
      'Service bundled with primary procedure',
      'Frequency limit exceeded for this service',
      null,
    ]

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)]!
      const billedAmount = Math.round((100 + Math.random() * 900) * 100) / 100
      const isDenied = status === 'DENIED'

      claims.push({
        hl7_claim_id: `CLM-${Date.now()}-${i}`,
        claim_submission_date: this.randomDate(30),
        patient_name: this.randomPatientName(),
        patient_dob: this.randomDOB(),
        patient_sex: Math.random() > 0.5 ? 'M' : 'F',
        member_id: `MEM${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        provider_npi: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        provider_name: this.randomProviderName(),
        claim_type: Math.random() > 0.3 ? 'P' : 'I',
        service_date: this.randomDate(45),
        procedure_codes: this.randomProcedureCodes(),
        diagnosis_codes: this.randomDiagnosisCodes(),
        billed_amount: billedAmount,
        paid_amount: isDenied ? 0 : billedAmount * (0.7 + Math.random() * 0.3),
        claim_status: status,
        denial_reason: isDenied ? denialReasons[Math.floor(Math.random() * (denialReasons.length - 1))] || undefined : undefined,
      })
    }

    return claims
  }

  private generateDemoAppeals(count: number): HL7Appeal[] {
    const appeals: HL7Appeal[] = []
    const statuses = ['PENDING', 'OVERTURNED', 'UPHELD']

    for (let i = 0; i < count; i++) {
      appeals.push({
        appeal_id: `APP-${Date.now()}-${i}`,
        claim_id: `CLM-${Date.now() - 10000}-${i}`,
        appeal_date: this.randomDate(20),
        appeal_reason: 'Additional documentation provided to support medical necessity',
        appeal_status: statuses[Math.floor(Math.random() * statuses.length)]!,
        outcome_date: Math.random() > 0.3 ? this.randomDate(10) : undefined,
        outcome_notes: Math.random() > 0.5 ? 'Appeal reviewed and decision made' : undefined,
      })
    }

    return appeals
  }

  private randomDate(daysBack: number): string {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
    return date.toISOString().split('T')[0]!
  }

  private randomDOB(): string {
    const year = 1950 + Math.floor(Math.random() * 50)
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')
    return `${year}${month}${day}`
  }

  private randomPatientName(): string {
    const firstNames = ['JOHN', 'MARY', 'JAMES', 'PATRICIA', 'ROBERT', 'JENNIFER', 'MICHAEL', 'LINDA', 'WILLIAM', 'ELIZABETH']
    const lastNames = ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS', 'RODRIGUEZ', 'MARTINEZ']
    const first = firstNames[Math.floor(Math.random() * firstNames.length)]
    const last = lastNames[Math.floor(Math.random() * lastNames.length)]
    return `${last}^${first}`
  }

  private randomProviderName(): string {
    const names = [
      'Regional Medical Center',
      'Community Health Clinic',
      'Primary Care Associates',
      'Specialty Healthcare Group',
      'Family Medicine Practice',
    ]
    return names[Math.floor(Math.random() * names.length)]!
  }

  private randomProcedureCodes(): string[] {
    const codes = ['99213', '99214', '99215', '99203', '99204', '99232', '99283', '99284', '99285', '36415', '80053', '85025']
    const count = 1 + Math.floor(Math.random() * 3)
    const selected: string[] = []
    for (let i = 0; i < count; i++) {
      const code = codes[Math.floor(Math.random() * codes.length)]!
      if (!selected.includes(code)) selected.push(code)
    }
    return selected
  }

  private randomDiagnosisCodes(): string[] {
    const codes = ['I10', 'E11.9', 'J06.9', 'M54.5', 'Z23', 'R05', 'J20.9', 'K21.0', 'N39.0', 'F32.9']
    const count = 1 + Math.floor(Math.random() * 3)
    const selected: string[] = []
    for (let i = 0; i < count; i++) {
      const code = codes[Math.floor(Math.random() * codes.length)]!
      if (!selected.includes(code)) selected.push(code)
    }
    return selected
  }
}
