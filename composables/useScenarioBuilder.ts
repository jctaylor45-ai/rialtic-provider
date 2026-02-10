/**
 * Scenario Builder Composable
 *
 * Provides state management, reference data, and generation logic
 * for the Scenario Builder UI tool.
 *
 * Now fetches policies dynamically from the database API instead of
 * using hardcoded mappings.
 */

import { ref, computed, reactive, onMounted } from 'vue'
import type {
  ScenarioDefinition,
  PatternDefinition,
  ProviderDefinition,
  PatternCategory,
  PatternTier,
  PatternStatus,
  TrajectoryCurve,
  MonthlySnapshot,
  SpecialtyType,
} from '../tools/scenario-types'
import type { Policy } from '~/types'
import { getAppConfig } from '~/config/appConfig'

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

interface PoliciesListResponse {
  data: Policy[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface ScenarioBuilderInput {
  scenarioName: string
  description: string
  startDate: string
  durationMonths: number
  practiceName: string
  specialties: SpecialtyCount[]
  totalClaims: number
  patterns: PatternInput[]
  engagementLevel: EngagementLevel
}

export interface SpecialtyCount {
  specialty: SpecialtyType
  providerCount: number
}

export interface PatternInput {
  category: PatternCategory
  policyId: string
  tier: PatternTier
  baselineDenialRate: number
  currentDenialRate: number
  claimCount: number
  trajectory: TrajectoryCurve
  appealRate: number
}

export type EngagementLevel = 'low' | 'medium' | 'high'

// =============================================================================
// REFERENCE DATA
// =============================================================================

export interface SpecialtyConfig {
  specialty: SpecialtyType
  taxonomy: string
  commonProcedures: string[]
  commonDiagnoses: string[]
  typicalClaimRange: { min: number; max: number }
  providerNamePrefixes: string[]
}

// Specialty configurations now come from appConfig with additional display data
// These are enriched versions with procedure/diagnosis codes for generation
export const specialtyConfigurations: SpecialtyConfig[] = [
  {
    specialty: 'Orthopedic Surgery',
    taxonomy: '207X00000X',
    commonProcedures: ['27447', '27446', '29881', '29880', '20610', '27130', '23472'],
    commonDiagnoses: ['M17.11', 'M17.12', 'S83.511A', 'M25.561', 'M79.3'],
    typicalClaimRange: { min: 500, max: 15000 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Sports Medicine',
    taxonomy: '207QS0000X',
    commonProcedures: ['20610', '20611', '99213', '99214', '97140', '97110'],
    commonDiagnoses: ['M25.561', 'M25.562', 'S93.401A', 'M76.891', 'M77.10'],
    typicalClaimRange: { min: 150, max: 2500 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Physical Therapy',
    taxonomy: '225100000X',
    commonProcedures: ['97110', '97112', '97116', '97140', '97530', '97535', '97542'],
    commonDiagnoses: ['M54.5', 'M25.561', 'M79.3', 'S83.511A', 'M62.830'],
    typicalClaimRange: { min: 75, max: 500 },
    providerNamePrefixes: [''],
  },
  {
    specialty: 'Pain Management',
    taxonomy: '208VP0014X',
    commonProcedures: ['64483', '64484', '64490', '20610', '62323', '64493'],
    commonDiagnoses: ['M54.5', 'M54.16', 'M54.17', 'G89.29', 'M47.816'],
    typicalClaimRange: { min: 300, max: 5000 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Internal Medicine',
    taxonomy: '207R00000X',
    commonProcedures: ['99213', '99214', '99215', '99203', '99204', '36415', '80053'],
    commonDiagnoses: ['E11.9', 'I10', 'E78.5', 'J06.9', 'Z00.00'],
    typicalClaimRange: { min: 100, max: 1000 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Family Medicine',
    taxonomy: '207Q00000X',
    commonProcedures: ['99213', '99214', '99215', '99203', '99204', '99395', '99396'],
    commonDiagnoses: ['Z00.00', 'J06.9', 'I10', 'E11.9', 'E78.5'],
    typicalClaimRange: { min: 75, max: 750 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Cardiology',
    taxonomy: '207RC0000X',
    commonProcedures: ['93000', '93306', '93350', '93458', '93010', '93303'],
    commonDiagnoses: ['I25.10', 'I48.91', 'I50.9', 'I10', 'R00.0'],
    typicalClaimRange: { min: 200, max: 8000 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'General Practice',
    taxonomy: '208D00000X',
    commonProcedures: ['99213', '99214', '99203', '99204', '99395', '36415'],
    commonDiagnoses: ['Z00.00', 'J06.9', 'I10', 'E11.9', 'R05.9'],
    typicalClaimRange: { min: 75, max: 600 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Neurology',
    taxonomy: '2084N0400X',
    commonProcedures: ['95816', '95819', '95860', '95861', '99213', '99214'],
    commonDiagnoses: ['G43.909', 'G40.909', 'G20', 'R51.9', 'G35'],
    typicalClaimRange: { min: 150, max: 3000 },
    providerNamePrefixes: ['Dr.'],
  },
  {
    specialty: 'Rheumatology',
    taxonomy: '207RR0500X',
    commonProcedures: ['99213', '99214', '99215', '20610', '86038', '86039'],
    commonDiagnoses: ['M05.79', 'M06.9', 'M32.9', 'M35.9', 'M79.3'],
    typicalClaimRange: { min: 150, max: 2000 },
    providerNamePrefixes: ['Dr.'],
  },
]

// =============================================================================
// TOPIC TO CATEGORY MAPPING
// =============================================================================

/**
 * Maps a policy topic name to a PatternCategory
 * This allows dynamic policies to integrate with the existing pattern system
 */
function mapTopicToCategory(topicName: string | undefined): PatternCategory {
  if (!topicName) return 'billing-error'

  const topic = topicName.toLowerCase()

  if (topic.includes('modifier')) return 'modifier-missing'
  if (topic.includes('authorization') || topic.includes('auth')) return 'authorization'
  if (topic.includes('documentation') || topic.includes('doc')) return 'documentation'
  if (topic.includes('bundling') || topic.includes('bundle')) return 'billing-error'
  if (topic.includes('place of service') || topic.includes('pos')) return 'billing-error'
  if (topic.includes('coding') || topic.includes('specificity')) return 'coding-specificity'
  if (topic.includes('mismatch') || topic.includes('dx-proc')) return 'code-mismatch'
  if (topic.includes('frequency') || topic.includes('timing')) return 'timing'
  if (topic.includes('medical necessity') || topic.includes('necessity')) return 'medical-necessity'

  return 'billing-error'
}

/**
 * Get procedure codes from a policy's policy_details
 */
function getPolicyProcedureCodes(policy: Policy): string[] {
  if (!policy.policy_details) return []
  return [
    ...(policy.policy_details.cpt_codes || []),
    ...(policy.policy_details.hcpcs_codes || []),
  ]
}

export const engagementDefaults: Record<EngagementLevel, { views: number; labTests: number; exports: number; actionsPerPattern: number }> = {
  low: { views: 5, labTests: 1, exports: 2, actionsPerPattern: 0 },
  medium: { views: 15, labTests: 5, exports: 8, actionsPerPattern: 1 },
  high: { views: 30, labTests: 12, exports: 20, actionsPerPattern: 3 },
}

// Provider name lists for generation
const firstNames = ['Sarah', 'Michael', 'Jennifer', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Amanda', 'William', 'Jessica', 'Christopher', 'Ashley', 'Matthew', 'Nicole']
const lastNames = ['Johnson', 'Chen', 'Williams', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee']

// Helper to safely extract date string from Date
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

// =============================================================================
// DERIVATION LOGIC
// =============================================================================

function generateScenarioId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)
}

function generatePracticeId(name: string): string {
  return 'practice-' + name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) + '-001'
}

function generateTaxId(): string {
  const part1 = Math.floor(10 + Math.random() * 90)
  const part2 = Math.floor(1000000 + Math.random() * 9000000)
  return `${part1}-${part2}`
}

function generateNpi(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000))
}

function generateProviderName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `Dr. ${firstName} ${lastName}`
}

function generateProviders(specialties: SpecialtyCount[]): ProviderDefinition[] {
  const providers: ProviderDefinition[] = []
  let providerIndex = 1

  for (const { specialty, providerCount } of specialties) {
    const config = specialtyConfigurations.find(c => c.specialty === specialty)
    if (!config) continue

    for (let i = 0; i < providerCount; i++) {
      providers.push({
        id: `prov-${String(providerIndex).padStart(3, '0')}`,
        name: generateProviderName(),
        npi: generateNpi(),
        specialty,
        taxonomy: config.taxonomy,
        claimWeight: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
      })
      providerIndex++
    }
  }

  return providers
}

function generateEndDate(startDate: string, durationMonths: number): string {
  const start = new Date(startDate)
  start.setMonth(start.getMonth() + durationMonths)
  start.setDate(start.getDate() - 1)
  return toDateString(start)
}

function getMonthsBetween(startDate: string, endDate: string): string[] {
  const months: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    months.push(current.toISOString().slice(0, 7))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

function generateMonthlyVariation(startDate: string, endDate: string): Record<string, number> {
  const months = getMonthsBetween(startDate, endDate)
  const variation: Record<string, number> = {}

  months.forEach((month, index) => {
    // Slight variation with trend
    const base = 1.0
    const noise = (Math.random() - 0.5) * 0.3
    const trend = index * 0.02 // Slight upward trend
    variation[month] = Math.round((base + noise + trend) * 100) / 100
  })

  return variation
}

function derivePatternStatus(baselineRate: number, currentRate: number): PatternStatus {
  const improvement = baselineRate - currentRate
  const percentImprovement = improvement / baselineRate

  if (percentImprovement >= 0.8) return 'resolved'
  if (percentImprovement >= 0.2) return 'improving'
  return 'active'
}

function generateSnapshots(
  startDate: string,
  endDate: string,
  baselineRate: number,
  currentRate: number,
  trajectory: TrajectoryCurve,
  avgDollarsPerPercent: number
): MonthlySnapshot[] {
  const months = getMonthsBetween(startDate, endDate)
  const snapshots: MonthlySnapshot[] = []

  months.forEach((month, index) => {
    const progress = index / Math.max(months.length - 1, 1)
    let rate: number

    switch (trajectory) {
      case 'steep_improvement':
        // 80% improvement in first 40% of time
        if (progress <= 0.4) {
          rate = baselineRate - (baselineRate - currentRate) * 0.8 * (progress / 0.4)
        } else {
          rate = baselineRate - (baselineRate - currentRate) * (0.8 + 0.2 * ((progress - 0.4) / 0.6))
        }
        break
      case 'gradual_improvement':
        rate = baselineRate - (baselineRate - currentRate) * progress
        break
      case 'slight_improvement':
        // Slow start, some improvement at end
        rate = baselineRate - (baselineRate - currentRate) * Math.pow(progress, 2)
        break
      case 'stable':
      case 'flat':
        rate = baselineRate
        break
      case 'regression':
        rate = baselineRate + (currentRate - baselineRate) * progress
        break
      default:
        rate = baselineRate - (baselineRate - currentRate) * progress
    }

    // Add slight noise
    const noise = (Math.random() - 0.5) * 2
    rate = Math.max(0, Math.round((rate + noise) * 10) / 10)

    snapshots.push({
      month,
      denialRate: rate,
      dollarsDenied: Math.round(rate * avgDollarsPerPercent),
    })
  })

  return snapshots
}

function generatePatternId(category: PatternCategory, index: number): string {
  const categoryCode = category.toUpperCase().replace(/-/g, '_').substring(0, 8)
  return `${categoryCode}-${String(index).padStart(3, '0')}`
}

function generateRecordedActions(
  engagementLevel: EngagementLevel,
  startDate: string,
  endDate: string,
  trajectory: TrajectoryCurve
): PatternDefinition['engagement']['actionsRecorded'] {
  const config = engagementDefaults[engagementLevel]
  const actions: PatternDefinition['engagement']['actionsRecorded'] = []

  if (config.actionsPerPattern === 0) return actions

  const actionTypes: PatternDefinition['engagement']['actionsRecorded'][0]['type'][] = [
    'staff-training',
    'workflow-update',
    'system-config',
    'resubmission',
    'practice-change',
  ]

  const start = new Date(startDate)
  const end = new Date(endDate)
  const range = end.getTime() - start.getTime()

  for (let i = 0; i < config.actionsPerPattern; i++) {
    // Actions typically happen in first half if improving
    const timeFactor = trajectory.includes('improvement') ? 0.3 + Math.random() * 0.3 : Math.random()
    const actionDate = new Date(start.getTime() + range * timeFactor)
    const actionTypeIndex = Math.floor(Math.random() * actionTypes.length)

    actions.push({
      id: `action-${String(i + 1).padStart(3, '0')}`,
      date: toDateString(actionDate),
      type: actionTypes[actionTypeIndex] ?? 'other',
      notes: 'Action recorded via scenario builder',
    })
  }

  return actions.sort((a, b) => a.date.localeCompare(b.date))
}

function generateRemediationStatic(
  category: PatternCategory,
  deniedCount: number,
  avgClaimValue: number
): PatternDefinition['remediation'] {
  const canResubmit = category === 'modifier-missing' || category === 'billing-error'

  return {
    shortTerm: {
      description: canResubmit
        ? 'Review and resubmit denied claims with corrections applied'
        : 'Submit appeals with supporting documentation',
      canResubmit,
      claimCount: Math.ceil(deniedCount * 0.6),
      amount: Math.round(deniedCount * avgClaimValue * 0.6),
    },
    longTerm: {
      description: 'Implement systematic process improvements',
      steps: [
        'Review current workflow for gaps',
        'Implement pre-submission validation checks',
        'Schedule staff training on policy requirements',
        'Monitor metrics monthly for sustained improvement',
      ],
    },
  }
}

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useScenarioBuilder() {
  const appConfig = getAppConfig()

  // Policy state - fetched from API
  const policies = ref<Policy[]>([])
  const policiesLoading = ref(false)
  const policiesError = ref<string | null>(null)

  // Form state
  const input = reactive<ScenarioBuilderInput>({
    scenarioName: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 7) + '-01', // First of current month
    durationMonths: 6,
    practiceName: '',
    specialties: [],
    totalClaims: 1000,
    patterns: [],
    engagementLevel: 'medium',
  })

  // UI state
  const currentStep = ref(1)
  const isGenerating = ref(false)
  const generatedScenario = ref<ScenarioDefinition | null>(null)
  const validationErrors = ref<string[]>([])

  // Load policies from API
  async function loadPolicies() {
    policiesLoading.value = true
    policiesError.value = null
    try {
      const response = await $fetch<PoliciesListResponse>('/api/v1/policies', {
        params: { limit: 0 },
      })
      policies.value = response.data
    } catch (error) {
      console.error('Failed to load policies:', error)
      policiesError.value = error instanceof Error ? error.message : 'Failed to load policies'
    } finally {
      policiesLoading.value = false
    }
  }

  // Computed
  const endDate = computed(() => {
    if (!input.startDate || !input.durationMonths) return ''
    return generateEndDate(input.startDate, input.durationMonths)
  })

  const totalProviders = computed(() => {
    return input.specialties.reduce((sum, s) => sum + s.providerCount, 0)
  })

  // Available policies from API with derived category info
  const availablePolicies = computed(() => {
    return policies.value.map(p => ({
      id: p.id,
      title: p.name,
      category: mapTopicToCategory(p.topic?.name),
      topic: p.topic?.name || '',
      logicType: p.policy_details?.logic_type_primary || '',
      description: p.description || '',
      denialReason: p.common_mistake || p.description || 'Claim denied per policy requirements',
    }))
  })

  // Unique topics for filtering
  const uniqueTopics = computed(() => {
    const topics = new Set(availablePolicies.value.map(p => p.topic).filter(Boolean))
    return Array.from(topics).sort()
  })

  // Unique logic types for filtering
  const uniqueLogicTypes = computed(() => {
    const types = new Set(availablePolicies.value.map(p => p.logicType).filter(Boolean))
    return Array.from(types).sort()
  })

  // Methods
  function addSpecialty(specialty: SpecialtyType) {
    if (!input.specialties.find(s => s.specialty === specialty)) {
      input.specialties.push({ specialty, providerCount: 1 })
    }
  }

  function removeSpecialty(index: number) {
    input.specialties.splice(index, 1)
  }

  function addPattern() {
    // Use first available policy or defaults if no policies loaded
    const firstPolicy = availablePolicies.value[0]
    const defaultCategory: PatternCategory = firstPolicy?.category || 'modifier-missing'
    const defaultPolicyId = firstPolicy?.id || 'POL-MOD-25'

    input.patterns.push({
      category: defaultCategory,
      policyId: defaultPolicyId,
      tier: 'high',
      baselineDenialRate: 25,
      currentDenialRate: 10,
      claimCount: Math.round(input.totalClaims * 0.1),
      trajectory: 'gradual_improvement',
      appealRate: appConfig.appeal.ratesByCategory[defaultCategory],
    })
  }

  function removePattern(index: number) {
    input.patterns.splice(index, 1)
  }

  function updatePatternFromPolicy(patternIndex: number, policyId: string) {
    const pattern = input.patterns[patternIndex]
    const policy = policies.value.find(p => p.id === policyId)
    if (pattern && policy) {
      const category = mapTopicToCategory(policy.topic?.name)
      pattern.category = category
      // Use policy's appeal rate if available, otherwise fall back to config
      pattern.appealRate = policy.appeal_rate ?? appConfig.appeal.ratesByCategory[category]
    }
  }

  /**
   * Get procedure codes for a pattern from its associated policy
   */
  function getProcedureCodesForPatternFromPolicy(policyId: string, specialties: SpecialtyCount[]): string[] {
    const policy = policies.value.find(p => p.id === policyId)

    // First try to get codes from the policy itself
    if (policy) {
      const policyCodes = getPolicyProcedureCodes(policy)
      if (policyCodes.length > 0) {
        return policyCodes.slice(0, 6)
      }
    }

    // Fallback: get codes from specialties
    const codes: Set<string> = new Set()
    for (const { specialty } of specialties) {
      const config = specialtyConfigurations.find(c => c.specialty === specialty)
      if (config) {
        const numCodes = 2 + Math.floor(Math.random() * 3)
        const shuffled = [...config.commonProcedures].sort(() => Math.random() - 0.5)
        shuffled.slice(0, numCodes).forEach(code => codes.add(code))
      }
    }
    return Array.from(codes).slice(0, 6)
  }

  function validate(): boolean {
    validationErrors.value = []

    if (!input.scenarioName.trim()) {
      validationErrors.value.push('Scenario name is required')
    }
    if (!input.practiceName.trim()) {
      validationErrors.value.push('Practice name is required')
    }
    if (input.specialties.length === 0) {
      validationErrors.value.push('At least one specialty is required')
    }
    if (input.patterns.length === 0) {
      validationErrors.value.push('At least one pattern is required')
    }
    if (input.totalClaims < 100) {
      validationErrors.value.push('Total claims must be at least 100')
    }

    // Check pattern claim counts don't exceed total
    const patternClaims = input.patterns.reduce((sum, p) => sum + p.claimCount, 0)
    if (patternClaims > input.totalClaims * 0.9) {
      validationErrors.value.push('Pattern claim counts exceed 90% of total claims')
    }

    return validationErrors.value.length === 0
  }

  function generateScenario(): ScenarioDefinition {
    const scenarioId = generateScenarioId(input.scenarioName)
    const practiceId = generatePracticeId(input.practiceName)
    const endDateStr = generateEndDate(input.startDate, input.durationMonths)
    const periodDays = Math.round((new Date(endDateStr).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const providers = generateProviders(input.specialties)
    const monthlyVariation = generateMonthlyVariation(input.startDate, endDateStr)
    const months = getMonthsBetween(input.startDate, endDateStr)
    const engagementConfig = engagementDefaults[input.engagementLevel]

    // Calculate derived metrics - use configurable default
    const avgClaimValue = getAppConfig().financial.defaultAvgClaimValue
    let totalDenied = 0
    let totalDollarsDenied = 0
    let totalAppeals = 0
    let appealsOverturned = 0

    // Generate patterns
    const patterns: PatternDefinition[] = input.patterns.map((p, index) => {
      // Get policy info from available policies (fetched from API)
      const policyInfo = availablePolicies.value.find(ap => ap.id === p.policyId)
      const patternId = generatePatternId(p.category, index + 1)

      // Calculate claim distribution
      const deniedBaseline = Math.round(p.claimCount * (p.baselineDenialRate / 100))
      const deniedCurrent = Math.round(p.claimCount * (p.currentDenialRate / 100))
      const totalDeniedForPattern = Math.round((deniedBaseline + deniedCurrent) / 2)
      const appealsFiled = Math.round(totalDeniedForPattern * p.appealRate)
      // Use config for overturn rate
      const overturnRate = appConfig.appeal.overturnRatesByCategory[p.category]
      const appealsOverturnedForPattern = Math.round(appealsFiled * overturnRate)

      totalDenied += totalDeniedForPattern
      totalAppeals += appealsFiled
      appealsOverturned += appealsOverturnedForPattern

      // Calculate period boundaries
      const baselineEnd = new Date(input.startDate)
      baselineEnd.setMonth(baselineEnd.getMonth() + Math.floor(input.durationMonths / 3))
      const currentStart = new Date(endDateStr)
      currentStart.setMonth(currentStart.getMonth() - Math.floor(input.durationMonths / 3))

      const avgDollarsPerPercent = avgClaimValue * p.claimCount / 100
      const snapshots = generateSnapshots(
        input.startDate,
        endDateStr,
        p.baselineDenialRate,
        p.currentDenialRate,
        p.trajectory,
        avgDollarsPerPercent
      )

      // Sum dollars denied from snapshots
      const patternDollarsDenied = snapshots.reduce((sum, s) => sum + s.dollarsDenied, 0)
      totalDollarsDenied += patternDollarsDenied

      // Generate first viewed date (early in timeline)
      const firstViewedOffset = Math.floor(Math.random() * 14) + 7
      const firstViewedDate = new Date(input.startDate)
      firstViewedDate.setDate(firstViewedDate.getDate() + firstViewedOffset)

      return {
        id: patternId,
        title: policyInfo?.title || `Pattern ${index + 1}`,
        description: policyInfo?.description || 'Generated pattern',
        category: p.category,
        status: derivePatternStatus(p.baselineDenialRate, p.currentDenialRate),
        tier: p.tier,
        procedureCodes: getProcedureCodesForPatternFromPolicy(p.policyId, input.specialties),
        policies: [{ id: p.policyId, triggerRate: 0.85 + Math.random() * 0.1 }],
        denialReason: policyInfo?.denialReason || 'Claim denied per policy requirements',
        claimDistribution: {
          total: p.claimCount,
          deniedBaseline,
          deniedCurrent,
          appealsFiled,
          appealsOverturned: appealsOverturnedForPattern,
        },
        trajectory: {
          curve: p.trajectory,
          baseline: {
            periodStart: input.startDate,
            periodEnd: toDateString(baselineEnd),
            claimCount: Math.round(p.claimCount / 3),
            deniedCount: deniedBaseline,
            denialRate: p.baselineDenialRate,
            dollarsDenied: Math.round(deniedBaseline * avgClaimValue),
          },
          current: {
            periodStart: toDateString(currentStart),
            periodEnd: endDateStr,
            claimCount: Math.round(p.claimCount / 3),
            deniedCount: deniedCurrent,
            denialRate: p.currentDenialRate,
            dollarsDenied: Math.round(deniedCurrent * avgClaimValue),
          },
          snapshots,
        },
        engagement: {
          firstViewedDate: toDateString(firstViewedDate),
          totalViews: engagementConfig.views + Math.floor(Math.random() * 10),
          claimLabTests: engagementConfig.labTests + Math.floor(Math.random() * 3),
          claimsExported: engagementConfig.exports + Math.floor(Math.random() * 5),
          actionsRecorded: generateRecordedActions(
            input.engagementLevel,
            input.startDate,
            endDateStr,
            p.trajectory
          ),
        },
        remediation: generateRemediationStatic(p.category, totalDeniedForPattern, avgClaimValue),
      }
    })

    // Build event distribution
    const eventDistribution: Record<string, number> = {
      pattern_viewed: patterns.reduce((sum, p) => sum + p.engagement.totalViews, 0),
      claim_inspected: Math.round(totalDenied * 0.3),
      policy_learned: Math.round(patterns.length * 5),
      claim_lab_test: patterns.reduce((sum, p) => sum + p.engagement.claimLabTests, 0),
      export_claims: patterns.reduce((sum, p) => sum + p.engagement.claimsExported, 0),
    }

    // Build event clustering
    const eventClustering: Record<string, string[]> = {}
    patterns.forEach(p => {
      const clusterDates: string[] = []
      const baseDate = new Date(p.engagement.firstViewedDate)
      clusterDates.push(p.engagement.firstViewedDate)
      baseDate.setDate(baseDate.getDate() + 1)
      clusterDates.push(toDateString(baseDate))
      const firstAction = p.engagement.actionsRecorded[0]
      if (firstAction) {
        clusterDates.push(firstAction.date)
      }
      eventClustering[p.id] = clusterDates
    })

    const scenario: ScenarioDefinition = {
      id: scenarioId,
      name: input.scenarioName,
      description: input.description || `Generated scenario for ${input.practiceName}`,
      timeline: {
        startDate: input.startDate,
        endDate: endDateStr,
        periodDays,
        keyEvents: patterns
          .filter(p => p.engagement.actionsRecorded.length > 0)
          .flatMap(p =>
            p.engagement.actionsRecorded.slice(0, 1).map(a => ({
              date: a.date,
              type: 'training' as const,
              description: a.notes || 'Training event',
              impactedPatterns: [p.id],
            }))
          ),
      },
      practice: {
        id: practiceId,
        name: input.practiceName,
        taxId: generateTaxId(),
        address: {
          street: '123 Medical Center Drive',
          city: 'Healthcare City',
          state: 'TX',
          zip: '75001',
        },
        providers,
      },
      volume: {
        totalClaims: input.totalClaims,
        monthlyVariation,
        claimLinesPerClaim: appConfig.claimGeneration.linesPerClaim,
        claimValueRanges: appConfig.claimGeneration.valueRanges,
      },
      patterns,
      learningEvents: {
        eventDistribution,
        eventClustering,
      },
      targetMetrics: {
        totalClaims: input.totalClaims,
        totalDenied,
        overallDenialRate: Math.round((totalDenied / input.totalClaims) * 100 * 10) / 10,
        totalDollarsDenied,
        totalAppeals,
        appealSuccessRate: totalAppeals > 0 ? Math.round((appealsOverturned / totalAppeals) * 100 * 10) / 10 : 0,
      },
    }

    return scenario
  }

  function generateAndPreview() {
    if (!validate()) return

    isGenerating.value = true
    try {
      generatedScenario.value = generateScenario()
      currentStep.value = 4 // Move to preview step
    } finally {
      isGenerating.value = false
    }
  }

  function exportScenario() {
    if (!generatedScenario.value) return

    const content = generateTypeScriptFile(generatedScenario.value)
    const blob = new Blob([content], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedScenario.value.id}.scenario.ts`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function generateTypeScriptFile(scenario: ScenarioDefinition): string {
    return `/**
 * ${scenario.name}
 *
 * ${scenario.description}
 * Generated by Scenario Builder
 */

import type { ScenarioDefinition } from '../tools/scenario-types'

const scenario: ScenarioDefinition = ${JSON.stringify(scenario, null, 2)}

export default scenario
`
  }

  function reset() {
    input.scenarioName = ''
    input.description = ''
    input.startDate = new Date().toISOString().slice(0, 7) + '-01'
    input.durationMonths = 6
    input.practiceName = ''
    input.specialties = []
    input.totalClaims = 1000
    input.patterns = []
    input.engagementLevel = 'medium'
    currentStep.value = 1
    generatedScenario.value = null
    validationErrors.value = []
  }

  return {
    // State
    input,
    currentStep,
    isGenerating,
    generatedScenario,
    validationErrors,

    // Policy state (from API)
    policies,
    policiesLoading,
    policiesError,

    // Computed
    endDate,
    totalProviders,
    availablePolicies,
    uniqueTopics,
    uniqueLogicTypes,

    // Reference data
    specialtyConfigurations,
    engagementDefaults,
    appConfig,

    // Methods
    loadPolicies,
    addSpecialty,
    removeSpecialty,
    addPattern,
    removePattern,
    updatePatternFromPolicy,
    validate,
    generateAndPreview,
    exportScenario,
    reset,
  }
}
