/**
 * Generator Helper Utilities
 *
 * Helper functions for generating consistent, realistic mock data
 * for the Provider Portal scenario-based data generation.
 */

import type {
  TrajectoryCurve,
  MonthRange,
  PatientData,
  VolumeDefinition,
} from './scenario-types'

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Get all months between two dates (inclusive)
 */
export function getMonthsBetween(startDate: string, endDate: string): MonthRange[] {
  const months: MonthRange[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Normalize to first of month
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  while (start <= end) {
    const monthStart = new Date(start)
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0)

    // Don't extend past endDate
    if (monthEnd > end) {
      monthEnd.setTime(end.getTime())
    }

    months.push({
      key: formatMonthKey(start),
      start: monthStart,
      end: monthEnd,
    })

    // Move to next month
    start.setMonth(start.getMonth() + 1)
  }

  return months
}

/**
 * Format a date as YYYY-MM month key
 */
export function formatMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Generate a random date within a month range
 */
export function randomDateInMonth(month: MonthRange): Date {
  const start = month.start.getTime()
  const end = month.end.getTime()
  return new Date(start + Math.random() * (end - start))
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const result = date.toISOString().split('T')[0]
  return result ?? ''
}

/**
 * Parse a month key (YYYY-MM) into start and end dates
 */
export function parseMonthKey(key: string): MonthRange {
  const parts = key.split('-').map(Number)
  const year = parts[0] ?? 2024
  const month = parts[1] ?? 1
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return { key, start, end }
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get a random date between two dates
 */
export function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime()
  const endTime = end.getTime()
  return new Date(startTime + Math.random() * (endTime - startTime))
}

// =============================================================================
// DENIAL CURVE CALCULATIONS
// =============================================================================

/**
 * Calculate denial rate curve based on trajectory type
 *
 * Returns an array of denial rates for each month
 */
export function calculateDenialCurve(
  startRate: number,
  endRate: number,
  months: number,
  curve: TrajectoryCurve
): number[] {
  const rates: number[] = []

  for (let i = 0; i < months; i++) {
    const progress = months > 1 ? i / (months - 1) : 1
    let rate: number

    switch (curve) {
      case 'steep_improvement':
        // 80% of improvement happens in first 40% of time
        // Use exponential decay
        rate = startRate + (endRate - startRate) * (1 - Math.exp(-3 * progress))
        break

      case 'gradual_improvement':
        // Linear improvement
        rate = startRate + (endRate - startRate) * progress
        break

      case 'slight_improvement':
        // Slow improvement - logarithmic curve
        rate = startRate + (endRate - startRate) * Math.log(1 + progress) / Math.log(2)
        break

      case 'stable':
      case 'flat':
        // No change - stay at start rate
        rate = startRate
        break

      case 'regression':
        // Getting worse - linear increase
        rate = startRate + (endRate - startRate) * progress
        break

      default:
        rate = startRate
    }

    // Clamp to valid range (0-100%)
    rates.push(Math.max(0, Math.min(100, rate)))
  }

  return rates
}

/**
 * Add realistic variation to a denial rate curve
 * Adds +/- noise while maintaining the overall trend
 */
export function addCurveVariation(rates: number[], variationPercent: number = 5): number[] {
  return rates.map((rate, i) => {
    // Less variation at the extremes
    const edgeFactor = Math.min(i, rates.length - 1 - i) / (rates.length / 2)
    const variation = (Math.random() - 0.5) * 2 * variationPercent * Math.min(1, edgeFactor + 0.3)
    return Math.max(0, Math.min(100, rate + variation))
  })
}

// =============================================================================
// CLAIM DISTRIBUTION
// =============================================================================

/**
 * Distribute claims across months with variation
 *
 * @param total Total number of claims to distribute
 * @param months Array of month ranges
 * @param variation Monthly variation multipliers (month key -> multiplier)
 * @returns Array of claim counts per month (same order as months)
 */
export function distributeClaimsAcrossMonths(
  total: number,
  months: MonthRange[],
  variation: Record<string, number>
): number[] {
  // Calculate weights for each month
  const weights = months.map(m => variation[m.key] || 1.0)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  // Distribute proportionally
  const distribution: number[] = []
  let remaining = total

  for (let i = 0; i < months.length; i++) {
    if (i === months.length - 1) {
      // Last month gets remaining to ensure total is exact
      distribution.push(remaining)
    } else {
      const weight = weights[i] ?? 1.0
      const count = Math.round((weight / totalWeight) * total)
      distribution.push(count)
      remaining -= count
    }
  }

  // Handle edge case where rounding caused negative remaining
  const lastDistribution = distribution[distribution.length - 1]
  if (lastDistribution !== undefined && lastDistribution < 0) {
    const deficit = -lastDistribution
    distribution[distribution.length - 1] = 0
    // Remove from earlier months
    let remainingDeficit = deficit
    for (let i = distribution.length - 2; i >= 0 && remainingDeficit > 0; i--) {
      const current = distribution[i] ?? 0
      const toRemove = Math.min(current, remainingDeficit)
      distribution[i] = current - toRemove
      remainingDeficit -= toRemove
    }
  }

  return distribution
}

/**
 * Distribute denied claims based on denial curve
 *
 * @param claimCounts Claims per month
 * @param denialRates Denial rate per month (0-100)
 * @returns Denied claim counts per month
 */
export function distributeDeniedClaims(
  claimCounts: number[],
  denialRates: number[]
): number[] {
  return claimCounts.map((count, i) => {
    const rate = denialRates[i] || 0
    // Use binomial-like distribution (round with randomized tie-breaking)
    const expected = count * (rate / 100)
    const floor = Math.floor(expected)
    const remainder = expected - floor
    return floor + (Math.random() < remainder ? 1 : 0)
  })
}

// =============================================================================
// PATIENT DATA GENERATION
// =============================================================================

// Sample data for patient generation
const FIRST_NAMES_MALE = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
]

const FIRST_NAMES_FEMALE = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra',
  'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol',
  'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura',
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
]

/**
 * Generate a realistic patient
 */
export function generatePatient(): PatientData {
  const sex = Math.random() < 0.52 ? 'female' : 'male'
  const firstName = randomChoice(sex === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE)
  const lastName = randomChoice(LAST_NAMES)

  // Generate DOB - ages 18-85, weighted toward older patients for medical claims
  const age = weightedAge()
  const birthYear = new Date().getFullYear() - age
  const birthMonth = Math.floor(Math.random() * 12)
  const birthDay = Math.floor(Math.random() * 28) + 1
  const dob = new Date(birthYear, birthMonth, birthDay)

  return {
    name: `${firstName} ${lastName}`,
    dob: formatDateISO(dob),
    sex,
    memberId: generateMemberId(),
  }
}

/**
 * Generate weighted age (more older patients for medical claims)
 */
function weightedAge(): number {
  const rand = Math.random()
  if (rand < 0.1) return randomInt(18, 30)      // 10% young adults
  if (rand < 0.25) return randomInt(30, 45)     // 15% middle-age
  if (rand < 0.45) return randomInt(45, 55)     // 20% older middle-age
  if (rand < 0.70) return randomInt(55, 65)     // 25% pre-Medicare
  return randomInt(65, 85)                       // 30% Medicare-age
}

/**
 * Generate a member ID
 */
export function generateMemberId(): string {
  const prefix = randomChoice(['MBR', 'HMO', 'PPO', 'MCD'])
  const number = String(Math.floor(Math.random() * 900000000) + 100000000)
  return `${prefix}${number}`
}

// =============================================================================
// CLAIM ID GENERATION
// =============================================================================

let claimSequence = 0
let claimScenarioTag = ''

/**
 * Generate claim ID with month prefix and scenario tag.
 * Format: CLM-{tag}-{YYYYMM}-{sequence}
 */
export function generateClaimId(month: MonthRange): string {
  claimSequence++
  const monthPrefix = month.key.replace('-', '')
  const sequence = String(claimSequence).padStart(6, '0')
  return `CLM-${claimScenarioTag}-${monthPrefix}-${sequence}`
}

/**
 * Reset claim sequence for a new scenario generation run.
 * The scenarioId is used to create a short tag that ensures
 * claim IDs are unique across scenarios with overlapping timelines.
 */
export function resetClaimSequence(scenarioId?: string): void {
  claimSequence = 0
  claimScenarioTag = scenarioId
    ? scenarioId.replace(/^scenario-/, '').slice(0, 8).toUpperCase()
    : 'DEFAULT'
}

// =============================================================================
// RANDOM UTILITIES
// =============================================================================

/**
 * Pick a random element from an array
 */
export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot pick from empty array')
  }
  const result = array[Math.floor(Math.random() * array.length)]
  return result as T
}

/**
 * Pick multiple random elements from an array (without replacement)
 */
export function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, array.length))
}

/**
 * Pick a random element with weighted probabilities
 *
 * @param items Array of [item, weight] tuples
 */
export function weightedChoice<T>(items: [T, number][]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array')
  }
  const totalWeight = items.reduce((sum, [, weight]) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (const [item, weight] of items) {
    random -= weight
    if (random <= 0) return item
  }

  const lastItem = items[items.length - 1]
  if (!lastItem) {
    throw new Error('Unexpected empty items array')
  }
  return lastItem[0]
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Generate a random amount based on claim value ranges
 */
export function randomClaimAmount(ranges: VolumeDefinition['claimValueRanges']): number {
  // 20% low, 60% medium, 20% high
  const rand = Math.random()
  let range: { min: number; max: number }

  if (rand < 0.2) {
    range = ranges.low
  } else if (rand < 0.8) {
    range = ranges.medium
  } else {
    range = ranges.high
  }

  return roundToDecimal(randomFloat(range.min, range.max), 2)
}

/**
 * Round a number to specified decimal places
 */
export function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// =============================================================================
// PROCEDURE CODE UTILITIES
// =============================================================================

// Common procedure codes by specialty
export const PROCEDURE_CODES_BY_SPECIALTY: Record<string, string[]> = {
  'Orthopedic Surgery': [
    '27447', '27446', '27445', '29881', '29880', '27130', '27132', '23472',
    '20610', '20611', '64483', '29879', '29876', '29877',
  ],
  'Sports Medicine': [
    '29881', '29880', '29879', '29876', '29877', '20610', '20611', '29871',
    '29826', '29827', '29828',
  ],
  'Physical Therapy': [
    '97110', '97112', '97116', '97140', '97530', '97535', '97542', '97161',
    '97162', '97163', '97164', '97010', '97012', '97014',
  ],
  'Pain Management': [
    '64483', '64484', '64490', '64493', '20610', '20611', '64625', '64624',
    '27096', '77003',
  ],
  'Internal Medicine': [
    '99213', '99214', '99215', '99203', '99204', '99205', '93000', '93010',
    '80053', '80061',
  ],
  'Family Medicine': [
    '99213', '99214', '99215', '99203', '99204', '99205', '99395', '99396',
    '99397', '90471', '90472',
  ],
  'Cardiology': [
    '93000', '93010', '93306', '93307', '93308', '93312', '93351', '93350',
    '93458', '93459',
  ],
  'General Practice': [
    '99213', '99214', '99215', '99203', '99204', '99205', '99385', '99386',
  ],
  'Neurology': [
    '95810', '95811', '95816', '95819', '95957', '95999', '64615',
  ],
  'Rheumatology': [
    '20610', '20611', '99213', '99214', '99215', '80053', '86038', '86039',
  ],
}

// Common diagnosis codes by procedure type
export const DIAGNOSIS_CODES = {
  orthopedic: [
    'M17.11', 'M17.12', 'M25.561', 'M25.562', 'M54.5', 'M54.41', 'M54.42',
    'M79.3', 'M75.100', 'M75.101', 'M75.102',
  ],
  pain: [
    'M54.5', 'M54.41', 'M54.42', 'G89.29', 'M47.816', 'M47.817', 'M54.16',
    'M54.17', 'G89.4',
  ],
  eval: [
    'Z00.00', 'Z00.01', 'Z23', 'R10.9', 'R05', 'J06.9', 'R50.9',
  ],
  therapy: [
    'M54.5', 'S83.511A', 'S83.512A', 'M62.81', 'M62.830', 'M79.3',
  ],
}

/**
 * Get procedure codes for a specialty
 */
export function getProcedureCodesForSpecialty(specialty: string): string[] {
  const codes = PROCEDURE_CODES_BY_SPECIALTY[specialty]
  if (codes) return codes
  const defaultCodes = PROCEDURE_CODES_BY_SPECIALTY['General Practice']
  return defaultCodes ?? ['99213', '99214', '99215']
}

/**
 * Get appropriate diagnosis codes for a procedure
 */
export function getDiagnosisCodesForProcedure(procedureCode: string): string[] {
  // E/M codes
  if (procedureCode.startsWith('99')) {
    return DIAGNOSIS_CODES.eval
  }
  // Physical therapy codes
  if (procedureCode.startsWith('97')) {
    return DIAGNOSIS_CODES.therapy
  }
  // Pain management / injection codes
  if (procedureCode.startsWith('64') || procedureCode.startsWith('206')) {
    return DIAGNOSIS_CODES.pain
  }
  // Default to orthopedic
  return DIAGNOSIS_CODES.orthopedic
}

// =============================================================================
// MODIFIER UTILITIES
// =============================================================================

export const COMMON_MODIFIERS = ['25', '59', '50', 'LT', 'RT', '76', '77', 'XE', 'XS', 'XP', 'XU']

/**
 * Determine if a procedure typically needs modifier 25
 */
export function needsModifier25(procedureCode: string, otherCodes: string[]): boolean {
  // E/M codes with same-day procedures
  const isEM = procedureCode.startsWith('99')
  const hasProcedure = otherCodes.some(code =>
    !code.startsWith('99') && !code.startsWith('97')
  )
  return isEM && hasProcedure
}

// =============================================================================
// UUID GENERATION
// =============================================================================

/**
 * Generate a simple UUID-like ID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
