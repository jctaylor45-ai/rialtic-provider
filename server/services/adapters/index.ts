/**
 * Data Source Adapters Index
 *
 * Exports all available adapters for external data integration.
 */

export { DataSourceAdapter } from './baseAdapter'
export type {
  ExternalClaim,
  ExternalAppeal,
  InternalClaim,
  InternalAppeal,
  AdapterConfig,
  FetchOptions,
  ValidationResult,
} from './baseAdapter'
export { formatDate, mapStatus, generateClaimId, parseCodes } from './baseAdapter'

export { HL7Adapter } from './hl7Adapter'
export { ERAAdapter } from './eraAdapter'
export { CSVAdapter } from './csvAdapter'
export type { CSVColumnMapping } from './csvAdapter'

import { HL7Adapter } from './hl7Adapter'
import { ERAAdapter } from './eraAdapter'
import { CSVAdapter } from './csvAdapter'
import { DataSourceAdapter } from './baseAdapter'

/**
 * Create adapter instance by type
 */
export function createAdapter(sourceType: string): DataSourceAdapter {
  switch (sourceType) {
    case 'hl7':
      return new HL7Adapter()
    case 'era':
      return new ERAAdapter()
    case 'csv':
      return new CSVAdapter()
    default:
      throw new Error(`Unknown adapter type: ${sourceType}`)
  }
}

/**
 * Get list of available adapter types
 */
export function getAvailableAdapters() {
  return [
    {
      type: 'hl7',
      name: 'HL7 837',
      description: 'HL7 837 EDI Claims Format (Professional & Institutional)',
      supportsAppeals: true,
    },
    {
      type: 'era',
      name: 'ERA 835',
      description: '835 Remittance/EOB Format for payment reconciliation',
      supportsAppeals: true,
    },
    {
      type: 'csv',
      name: 'CSV Import',
      description: 'Import claims from CSV files with custom column mapping',
      supportsAppeals: false,
    },
  ]
}
