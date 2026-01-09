/**
 * ERA 835 Remittance Adapter
 *
 * Handles 835 EOB/ERA (Explanation of Benefits/Electronic Remittance Advice).
 * Used primarily for payment and appeal status updates.
 */

import {
  DataSourceAdapter,
  formatDate,
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
// ERA INTERFACES
// =============================================================================

interface ERARemittance {
  era_id: string
  claim_id: string
  original_claim_id?: string
  provider_id: string
  patient_id: string
  original_amount: number
  paid_amount: number
  adjustment_amount: number
  adjustment_code: string
  reason_code: string
  reason_description?: string
  processing_date: string
  check_number?: string
  line_items?: Array<{
    line_number: number
    service_date: string
    procedure_code: string
    billed_amount: number
    paid_amount: number
    adjustment_code: string
    reason_code: string
  }>
  [key: string]: unknown
}

interface ERAAppeal {
  era_id: string
  claim_id: string
  appeal_reference: string
  decision_date: string
  decision: string
  adjusted_payment?: number
  notes?: string
}

// =============================================================================
// ERA ADAPTER CLASS
// =============================================================================

export class ERAAdapter extends DataSourceAdapter {
  name = 'ERA 835'
  description = '835 Remittance/EOB Format for payment reconciliation'
  sourceType = 'era'

  async connect(config: AdapterConfig): Promise<void> {
    this.config = config
    console.log('ERA Adapter: Connected')
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
    console.log('ERA Adapter: Disconnected')
  }

  async fetchClaims(options?: FetchOptions): Promise<ExternalClaim[]> {
    // ERA primarily handles remittance, not claims
    // Return empty - claims should come from HL7/837
    console.log('ERA Adapter: ERA format handles remittance, not claims')
    return []
  }

  async fetchAppeals(options?: FetchOptions): Promise<ExternalAppeal[]> {
    if (!this.connected) {
      throw new Error('ERA Adapter not connected')
    }

    const { limit = 50 } = options || {}

    // Return demo ERA data
    return this.generateDemoRemittances(limit)
  }

  transformClaim(_external: ExternalClaim): InternalClaim {
    throw new Error('ERA adapter transforms remittances, not claims. Use HL7 adapter for claims.')
  }

  transformAppeal(external: ExternalAppeal): InternalAppeal {
    const era = external as unknown as ERARemittance

    // ERA remittance can indicate appeal outcomes
    const isAppeal = era.adjustment_code === 'CR' || era.reason_code.startsWith('W')
    const isOverturned = era.paid_amount > 0 && era.adjustment_amount > 0

    return {
      claimId: era.claim_id,
      appealFiled: isAppeal,
      appealDate: formatDate(era.processing_date),
      appealReason: this.mapReasonCode(era.reason_code, era.reason_description),
      appealOutcome: isOverturned ? 'overturned' : isAppeal ? 'upheld' : 'pending',
      outcomeDate: formatDate(era.processing_date),
      outcomeNotes: `Adjustment: ${era.adjustment_code}, Check: ${era.check_number || 'N/A'}`,
    }
  }

  validate(claim: ExternalClaim): ValidationResult {
    const errors: string[] = []
    const era = claim as unknown as ERARemittance

    if (!era.era_id) {
      errors.push('Missing ERA ID')
    }

    if (!era.claim_id) {
      errors.push('Missing claim reference')
    }

    if (era.original_amount === undefined) {
      errors.push('Missing original amount')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Process ERA remittance to update existing claims
   */
  async processRemittance(remittance: ERARemittance): Promise<{
    claimId: string
    updated: boolean
    changes: string[]
  }> {
    const changes: string[] = []

    // In production, this would update the claim in database
    if (remittance.paid_amount > 0) {
      changes.push(`Payment: $${remittance.paid_amount}`)
    }

    if (remittance.adjustment_amount > 0) {
      changes.push(`Adjustment: $${remittance.adjustment_amount} (${remittance.adjustment_code})`)
    }

    if (remittance.reason_code) {
      changes.push(`Reason: ${this.mapReasonCode(remittance.reason_code)}`)
    }

    return {
      claimId: remittance.claim_id,
      updated: changes.length > 0,
      changes,
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private mapReasonCode(code: string, description?: string): string {
    if (description) return description

    const reasonCodes: Record<string, string> = {
      '1': 'Deductible amount',
      '2': 'Coinsurance amount',
      '3': 'Co-payment amount',
      '4': 'Procedure code inconsistent with modifier',
      '5': 'Procedure code inconsistent with place of service',
      '16': 'Claim/service lacks information needed for adjudication',
      '18': 'Duplicate claim/service',
      '22': 'Coordination of benefits',
      '23': 'Authorization/pre-certification absent',
      '24': 'Charges covered under capitation agreement',
      '29': 'Time limit for filing has expired',
      '45': 'Charge exceeds fee schedule/maximum allowable',
      '50': 'Non-covered service',
      '96': 'Non-covered charge',
      '97': 'Payment included in allowance for another service',
      'CO': 'Contractual obligations',
      'OA': 'Other adjustments',
      'PI': 'Payer initiated reductions',
      'PR': 'Patient responsibility',
      'W1': 'Workers compensation appeal filed',
      'W2': 'Workers compensation appeal denied',
      'W3': 'Workers compensation appeal approved',
    }

    return reasonCodes[code] || `Reason code: ${code}`
  }

  private generateDemoRemittances(count: number): ERARemittance[] {
    const remittances: ERARemittance[] = []
    const adjustmentCodes = ['CO', 'PR', 'OA', 'PI', 'CR']
    const reasonCodes = ['1', '2', '3', '45', '50', '97']

    for (let i = 0; i < count; i++) {
      const originalAmount = Math.round((200 + Math.random() * 800) * 100) / 100
      const paidRatio = 0.6 + Math.random() * 0.4
      const paidAmount = Math.round(originalAmount * paidRatio * 100) / 100
      const adjustmentAmount = Math.round((originalAmount - paidAmount) * 100) / 100

      remittances.push({
        era_id: `ERA-${Date.now()}-${i}`,
        claim_id: `CLM-${Date.now() - 86400000}-${i}`,
        provider_id: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        patient_id: `PAT-${Math.random().toString(36).substring(2, 10)}`,
        original_amount: originalAmount,
        paid_amount: paidAmount,
        adjustment_amount: adjustmentAmount,
        adjustment_code: adjustmentCodes[Math.floor(Math.random() * adjustmentCodes.length)]!,
        reason_code: reasonCodes[Math.floor(Math.random() * reasonCodes.length)]!,
        processing_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        check_number: `CHK${Math.floor(100000 + Math.random() * 900000)}`,
      })
    }

    return remittances
  }
}
