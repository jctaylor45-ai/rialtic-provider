/**
 * Claim Generator Service
 *
 * Generates realistic healthcare claims with configurable denial patterns.
 * Uses medically-accurate procedure codes, diagnosis codes, and realistic amounts.
 */

import type { InferInsertModel } from 'drizzle-orm'
import type { claims, claimLineItems, claimDiagnosisCodes, claimProcedureCodes } from '../database/schema'

// =============================================================================
// TYPES
// =============================================================================

export interface GeneratorConfig {
  /** Base denial rate (0-1), default 0.25 */
  denialRate?: number
  /** Scenario ID to associate claims with */
  scenarioId?: string
  /** Provider pool to draw from */
  providers?: ProviderInfo[]
  /** Date range for claims */
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ProviderInfo {
  id: string
  name: string
  npi: string
  tin?: string
  taxonomy?: string
  specialty?: string
}

export interface GeneratedClaim {
  claim: InferInsertModel<typeof claims>
  lineItems: InferInsertModel<typeof claimLineItems>[]
  diagnosisCodes: Array<{ claimId: string; code: string; sequence: number }>
  procedureCodes: Array<{ claimId: string; code: string }>
}

export interface DenialPattern {
  id: string
  category: string
  denialReason: string
  /** Procedure codes that trigger this pattern */
  procedureCodes?: string[]
}

// =============================================================================
// REFERENCE DATA - Realistic Healthcare Data
// =============================================================================

export const DEFAULT_PROVIDERS: ProviderInfo[] = [
  { id: 'PRV-001', name: 'Valley Medical Associates', npi: '1234567890', tin: '12-3456789', specialty: 'Internal Medicine', taxonomy: '207R00000X' },
  { id: 'PRV-002', name: 'Cardiology Partners LLC', npi: '2345678901', tin: '23-4567890', specialty: 'Cardiology', taxonomy: '207RC0000X' },
  { id: 'PRV-003', name: 'Orthopedic Specialists', npi: '3456789012', tin: '34-5678901', specialty: 'Orthopedic Surgery', taxonomy: '207X00000X' },
  { id: 'PRV-004', name: 'Family Care Clinic', npi: '4567890123', tin: '45-6789012', specialty: 'Family Medicine', taxonomy: '207Q00000X' },
  { id: 'PRV-005', name: 'Pain Management Center', npi: '5678901234', tin: '56-7890123', specialty: 'Pain Management', taxonomy: '208VP0014X' },
  { id: 'PRV-006', name: 'Physical Therapy Plus', npi: '6789012345', tin: '67-8901234', specialty: 'Physical Therapy', taxonomy: '225100000X' },
]

// Procedure codes with realistic pricing ranges
export const PROCEDURE_CODES: Record<string, { description: string; minAmount: number; maxAmount: number; specialty?: string }> = {
  // E/M Codes (Office Visits)
  '99213': { description: 'Office visit, established patient, low complexity', minAmount: 100, maxAmount: 180 },
  '99214': { description: 'Office visit, established patient, moderate complexity', minAmount: 150, maxAmount: 250 },
  '99215': { description: 'Office visit, established patient, high complexity', minAmount: 200, maxAmount: 350 },
  '99203': { description: 'Office visit, new patient, low complexity', minAmount: 120, maxAmount: 200 },
  '99204': { description: 'Office visit, new patient, moderate complexity', minAmount: 180, maxAmount: 300 },
  '99205': { description: 'Office visit, new patient, high complexity', minAmount: 250, maxAmount: 400 },

  // Lab & Diagnostic
  '36415': { description: 'Collection of venous blood by venipuncture', minAmount: 15, maxAmount: 35 },
  '80053': { description: 'Comprehensive metabolic panel', minAmount: 25, maxAmount: 60 },
  '85025': { description: 'Complete blood count with differential', minAmount: 20, maxAmount: 45 },
  '81001': { description: 'Urinalysis, automated with microscopy', minAmount: 10, maxAmount: 25 },

  // Cardiology
  '93000': { description: 'Electrocardiogram, complete', minAmount: 50, maxAmount: 120 },
  '93306': { description: 'Echocardiography, complete', minAmount: 300, maxAmount: 600 },
  '93350': { description: 'Echocardiography, stress', minAmount: 400, maxAmount: 800 },

  // Orthopedic
  '27447': { description: 'Total knee arthroplasty', minAmount: 8000, maxAmount: 15000, specialty: 'Orthopedic Surgery' },
  '27446': { description: 'Knee arthroplasty, medial compartment', minAmount: 6000, maxAmount: 12000, specialty: 'Orthopedic Surgery' },
  '29881': { description: 'Knee arthroscopy with meniscectomy', minAmount: 3000, maxAmount: 6000, specialty: 'Orthopedic Surgery' },
  '20610': { description: 'Joint injection, major joint', minAmount: 150, maxAmount: 350 },
  '20611': { description: 'Joint injection, major joint with ultrasound', minAmount: 200, maxAmount: 450 },

  // Physical Therapy
  '97110': { description: 'Therapeutic exercises', minAmount: 40, maxAmount: 80, specialty: 'Physical Therapy' },
  '97112': { description: 'Neuromuscular reeducation', minAmount: 45, maxAmount: 85, specialty: 'Physical Therapy' },
  '97140': { description: 'Manual therapy techniques', minAmount: 50, maxAmount: 90, specialty: 'Physical Therapy' },
  '97530': { description: 'Therapeutic activities', minAmount: 45, maxAmount: 85, specialty: 'Physical Therapy' },

  // Pain Management
  '64483': { description: 'Transforaminal epidural injection, lumbar', minAmount: 800, maxAmount: 1500, specialty: 'Pain Management' },
  '64484': { description: 'Transforaminal epidural injection, additional level', minAmount: 400, maxAmount: 800, specialty: 'Pain Management' },
  '64493': { description: 'Facet joint injection, lumbar', minAmount: 600, maxAmount: 1200, specialty: 'Pain Management' },

  // Imaging
  '70553': { description: 'MRI brain with and without contrast', minAmount: 800, maxAmount: 1500 },
  '72148': { description: 'MRI lumbar spine without contrast', minAmount: 600, maxAmount: 1200 },
  '73221': { description: 'MRI shoulder without contrast', minAmount: 500, maxAmount: 1000 },
}

// Common diagnosis codes by category
export const DIAGNOSIS_CODES: Record<string, { description: string; category: string }> = {
  // Hypertension & Cardiovascular
  'I10': { description: 'Essential hypertension', category: 'cardiovascular' },
  'I25.10': { description: 'Atherosclerotic heart disease', category: 'cardiovascular' },
  'I48.91': { description: 'Atrial fibrillation', category: 'cardiovascular' },
  'I50.9': { description: 'Heart failure, unspecified', category: 'cardiovascular' },
  'R00.0': { description: 'Tachycardia', category: 'cardiovascular' },

  // Diabetes & Metabolic
  'E11.9': { description: 'Type 2 diabetes mellitus', category: 'metabolic' },
  'E78.5': { description: 'Hyperlipidemia', category: 'metabolic' },
  'E66.9': { description: 'Obesity', category: 'metabolic' },

  // Musculoskeletal
  'M17.11': { description: 'Primary osteoarthritis, right knee', category: 'musculoskeletal' },
  'M17.12': { description: 'Primary osteoarthritis, left knee', category: 'musculoskeletal' },
  'M54.5': { description: 'Low back pain', category: 'musculoskeletal' },
  'M54.16': { description: 'Radiculopathy, lumbar region', category: 'musculoskeletal' },
  'M25.561': { description: 'Pain in right knee', category: 'musculoskeletal' },
  'M25.562': { description: 'Pain in left knee', category: 'musculoskeletal' },
  'M79.3': { description: 'Panniculitis', category: 'musculoskeletal' },
  'S83.511A': { description: 'Sprain of anterior cruciate ligament', category: 'musculoskeletal' },

  // Pain
  'G89.29': { description: 'Other chronic pain', category: 'pain' },
  'M47.816': { description: 'Spondylosis without myelopathy, lumbar region', category: 'pain' },

  // General
  'Z00.00': { description: 'Encounter for general adult medical examination', category: 'general' },
  'J06.9': { description: 'Acute upper respiratory infection', category: 'general' },
  'R05.9': { description: 'Cough, unspecified', category: 'general' },
}

// Denial reasons by category
export const DENIAL_REASONS: Record<string, { reason: string; category: string; appealSuccessRate: number }> = {
  'MOD25_MISSING': { reason: 'Modifier 25 required for E/M service on same day as procedure', category: 'modifier-missing', appealSuccessRate: 0.65 },
  'MOD59_MISSING': { reason: 'Modifier 59 required to indicate distinct procedural service', category: 'modifier-missing', appealSuccessRate: 0.60 },
  'AUTH_REQUIRED': { reason: 'Prior authorization required but not obtained', category: 'authorization', appealSuccessRate: 0.20 },
  'AUTH_EXPIRED': { reason: 'Prior authorization expired at time of service', category: 'authorization', appealSuccessRate: 0.30 },
  'DOC_INCOMPLETE': { reason: 'Medical necessity not established in documentation', category: 'documentation', appealSuccessRate: 0.45 },
  'BUNDLED': { reason: 'Service is bundled with primary procedure', category: 'billing-error', appealSuccessRate: 0.55 },
  'GLOBAL_PERIOD': { reason: 'Service included in surgical global period', category: 'billing-error', appealSuccessRate: 0.50 },
  'FREQ_EXCEEDED': { reason: 'Service frequency exceeds benefit limits', category: 'timing', appealSuccessRate: 0.25 },
  'DX_MISMATCH': { reason: 'Diagnosis does not support medical necessity of procedure', category: 'code-mismatch', appealSuccessRate: 0.40 },
}

// First and last names for realistic patient generation
const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomId(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase()
}

function generateRealisticAmount(procedureCode: string): number {
  const info = PROCEDURE_CODES[procedureCode]
  if (!info) {
    return randomInt(100, 500)
  }
  return randomInt(info.minAmount, info.maxAmount)
}

function generatePatientName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`
}

function generatePatientDOB(): string {
  const today = new Date()
  const age = randomInt(18, 85)
  const dob = new Date(today.getFullYear() - age, randomInt(0, 11), randomInt(1, 28))
  return dob.toISOString().split('T')[0] as string
}

function generateMemberId(): string {
  const prefix = randomChoice(['DG', 'KL', 'MP', 'BC', 'UN', 'AE'])
  return `${randomInt(100, 999)}-${prefix}-${randomInt(1000000, 9999999)}-${randomInt(0, 9)}`
}

function generateClaimId(): string {
  return `CLM-${Date.now()}-${randomId(4)}`
}

function generateDateInRange(start: Date, end: Date): string {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime).toISOString().split('T')[0] as string
}

function generateRecentDate(daysBack: number = 90): string {
  const now = new Date()
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  return generateDateInRange(past, now)
}

function selectDiagnosisCodes(count: number = 3): string[] {
  const codes = Object.keys(DIAGNOSIS_CODES)
  const selected: string[] = []
  const shuffled = [...codes].sort(() => Math.random() - 0.5)

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    selected.push(shuffled[i]!)
  }

  return selected
}

function selectProcedureCodes(provider?: ProviderInfo, count: number = 1): string[] {
  const codes = Object.entries(PROCEDURE_CODES)
    .filter(([_, info]) => !info.specialty || info.specialty === provider?.specialty)
    .map(([code]) => code)

  const selected: string[] = []
  const shuffled = [...codes].sort(() => Math.random() - 0.5)

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    selected.push(shuffled[i]!)
  }

  return selected
}

// =============================================================================
// MAIN GENERATOR FUNCTIONS
// =============================================================================

/**
 * Generate a single realistic claim
 */
export function generateClaim(config: GeneratorConfig = {}): GeneratedClaim {
  const {
    denialRate = 0.25,
    scenarioId,
    providers = DEFAULT_PROVIDERS,
    dateRange,
  } = config

  // Select provider
  const provider = randomChoice(providers)

  // Generate patient info
  const patientName = generatePatientName()
  const patientDob = generatePatientDOB()
  const patientSex = randomChoice(['male', 'female'] as const)
  const memberId = generateMemberId()

  // Generate dates
  const dateOfService = dateRange
    ? generateDateInRange(dateRange.start, dateRange.end)
    : generateRecentDate()

  const submissionDate = new Date(dateOfService)
  submissionDate.setDate(submissionDate.getDate() + randomInt(1, 7))

  const processingDate = new Date(submissionDate)
  processingDate.setDate(processingDate.getDate() + randomInt(3, 21))

  // Select codes
  const procedureCodes = selectProcedureCodes(provider, randomInt(1, 3))
  const diagnosisCodes = selectDiagnosisCodes(randomInt(2, 5))

  // Calculate amounts
  let totalBilled = 0
  const lineItems: InferInsertModel<typeof claimLineItems>[] = []
  const claimId = generateClaimId()

  procedureCodes.forEach((code, index) => {
    const billedAmount = generateRealisticAmount(code)
    totalBilled += billedAmount

    lineItems.push({
      claimId,
      lineNumber: index + 1,
      procedureCode: code,
      billedAmount,
      paidAmount: 0, // Will be set based on claim status
      units: 1,
      unitsType: 'UN',
      dateOfService,
      placeOfService: '11', // Office
      status: 'pending',
    })
  })

  // Determine if denied
  const isDenied = Math.random() < denialRate
  const denialInfo = isDenied ? randomChoice(Object.values(DENIAL_REASONS)) : null

  // Calculate paid amounts
  const status = isDenied ? 'denied' : 'approved'
  const paidAmount = isDenied ? 0 : totalBilled * randomInt(70, 95) / 100

  // Update line items with status
  lineItems.forEach(item => {
    item.status = status
    item.paidAmount = isDenied ? 0 : (item.billedAmount ?? 0) * randomInt(70, 95) / 100
  })

  // Build claim record
  const claim: InferInsertModel<typeof claims> = {
    id: claimId,
    providerId: provider.id,
    scenarioId: scenarioId || null,
    claimType: 'Professional',
    patientName,
    patientDob,
    patientSex,
    memberId,
    memberGroupId: `GRP-${randomInt(1000, 9999)}`,
    dateOfService,
    billedAmount: totalBilled,
    paidAmount,
    providerName: provider.name,
    billingProviderTin: provider.tin || null,
    billingProviderNpi: provider.npi,
    billingProviderTaxonomy: provider.taxonomy || null,
    status,
    denialReason: denialInfo?.reason || null,
    submissionDate: submissionDate.toISOString().split('T')[0],
    processingDate: processingDate.toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }

  // Build diagnosis codes array
  const diagnosisCodesArray = diagnosisCodes.map((code, index) => ({
    claimId,
    code,
    sequence: index + 1,
  }))

  // Build procedure codes array
  const procedureCodesArray = procedureCodes.map(code => ({
    claimId,
    code,
  }))

  return {
    claim,
    lineItems,
    diagnosisCodes: diagnosisCodesArray,
    procedureCodes: procedureCodesArray,
  }
}

/**
 * Generate a batch of claims
 */
export function generateClaimBatch(count: number, config: GeneratorConfig = {}): GeneratedClaim[] {
  const claims: GeneratedClaim[] = []

  for (let i = 0; i < count; i++) {
    claims.push(generateClaim(config))
  }

  return claims
}

/**
 * Apply a specific denial pattern to a claim
 */
export function applyDenialPattern(generatedClaim: GeneratedClaim, pattern: DenialPattern): GeneratedClaim {
  const denialInfo = Object.values(DENIAL_REASONS).find(d => d.category === pattern.category)

  generatedClaim.claim.status = 'denied'
  generatedClaim.claim.paidAmount = 0
  generatedClaim.claim.denialReason = pattern.denialReason || denialInfo?.reason || 'Claim denied per policy'

  // Update line items
  generatedClaim.lineItems.forEach(item => {
    item.status = 'denied'
    item.paidAmount = 0
  })

  return generatedClaim
}

/**
 * Generate claims with a specific pattern injected at a given rate
 */
export function generateClaimsWithPattern(
  count: number,
  pattern: DenialPattern,
  patternRate: number,
  config: GeneratorConfig = {}
): GeneratedClaim[] {
  const claims = generateClaimBatch(count, { ...config, denialRate: 0 })

  // Determine how many claims should have the pattern
  const patternCount = Math.floor(count * patternRate)

  // Shuffle and select claims for pattern injection
  const shuffled = [...claims].sort(() => Math.random() - 0.5)
  const toInject = shuffled.slice(0, patternCount)
  const toInjectSet = new Set(toInject)

  // Apply pattern to selected claims
  return claims.map(claim => {
    if (toInjectSet.has(claim)) {
      return applyDenialPattern(claim, pattern)
    }
    return claim
  })
}

/**
 * Get procedure code info
 */
export function getProcedureCodeInfo(code: string) {
  return PROCEDURE_CODES[code]
}

/**
 * Get diagnosis code info
 */
export function getDiagnosisCodeInfo(code: string) {
  return DIAGNOSIS_CODES[code]
}

/**
 * Get denial reason info
 */
export function getDenialReasonInfo(category: string) {
  return Object.values(DENIAL_REASONS).find(d => d.category === category)
}
