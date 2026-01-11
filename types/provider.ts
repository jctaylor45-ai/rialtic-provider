/**
 * Provider types
 * Aligned with console-ui @rialtic/types patterns
 */

export interface Provider {
  id: string
  name: string
  specialty?: string
  npi?: string
  tin?: string
  taxonomy?: string
}

export interface ProviderWithStats {
  id: string
  name: string
  specialty: string | null
  npi: string | null
  tin: string | null
  taxonomy: string | null
  createdAt: string | null
  statistics: {
    totalClaims: number
    totalBilled: number
    totalPaid: number
    deniedClaims: number
    denialRate: number
  }
}
