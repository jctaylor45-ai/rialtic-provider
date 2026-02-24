/**
 * Denial Intelligence types
 * Discriminated union for merged active patterns + inactive policies
 */

import type { Pattern } from '~/types/enhancements'
import type { Policy } from '~/types/policy'

export interface ActiveDenialItem {
  type: 'active'
  id: string
  pattern: Pattern
  policies: Policy[]
  title: string
  topic: string
  source: string
  tier: string
}

export interface InactiveDenialItem {
  type: 'inactive'
  id: string
  policy: Policy
  title: string
  topic: string
  source: string
  tier: undefined
}

export type DenialIntelligenceItem = ActiveDenialItem | InactiveDenialItem

export interface DenialIntelligenceFilters {
  search: string
  topic: string
  source: string
  tier: string
  status: string
  recoveryStatus: string
  showInactive: boolean
  sort: 'impact' | 'denialRate' | 'frequency' | 'recent'
  sortDir: 'asc' | 'desc'
}
