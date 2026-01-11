/**
 * Types barrel file
 * Re-exports all domain-specific types
 * Aligned with console-ui @rialtic/types patterns
 */

// Common FHIR-like types
export type {
  Money,
  Period,
  Coding,
  CodeableConcept,
  Quantity,
  PractitionerIdentifiers,
  Practitioner,
  PractitionerRole,
  CareTeamMember,
  RenderingProvider,
  DiagnosisCode,
  Diagnosis,
  Patient,
  Insurance,
} from './common'

// Policy types
export type {
  PolicyTopic,
  PolicyEditType,
  PolicyReferenceDocument,
  PolicyDetails,
  InsightMode,
  ConnectorInsightMode,
  Policy,
} from './policy'

// Claim types
export type {
  HistoryInfo,
  EditType,
  ClaimLineInsight,
  ProcessedInsight,
  ClaimLineAdditionalDetails,
  ClaimLine,
  ClaimLineWithInsights,
  ClaimWarning,
  ClaimAdditionalDetails,
  ClaimChain,
  ProcessedClaim,
  ProcessedClaimWithInsights,
  Claim,
  LineItem,
} from './claim'

// Pattern/Insight types
export type {
  PatternCategory,
  PatternStatus,
  PatternTier,
  Pattern,
  LearningMarker,
  Insight,
} from './pattern'

// Provider types
export type { Provider, ProviderWithStats } from './provider'

// API response types
export type {
  Pagination,
  ClaimsListResponse,
  ClaimDetailResponse,
  PoliciesListResponse,
  PatternsListResponse,
  ProvidersListResponse,
  PaapiErrorResponse,
  PaapiValidationError,
  PaapiResponse,
  ClaimsSummaryResponse,
  InsightsResponse,
  DashboardKPIs,
  AnalyticsDashboardResponse,
} from './api'

// Configuration types
export type {
  FHIRCodeSystemConfig,
  ClaimAdapterConfig,
  PolicyModeMapping,
  PolicyAdapterConfig,
} from './config'
