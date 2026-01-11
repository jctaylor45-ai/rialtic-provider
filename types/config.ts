/**
 * Adapter configuration types
 * Aligned with console-ui @rialtic/types patterns
 */

export interface FHIRCodeSystemConfig {
  /** Provider taxonomy system URL */
  providerTaxonomy: string
  /** Diagnosis code system URL (ICD-10) */
  diagnosisSystem: string
  /** Procedure code system URL (CPT/HCPCS) */
  procedureSystem: string
  /** Care team role code system URL */
  careTeamRoleSystem: string
  /** Claim type code system URL */
  claimTypeSystem: string
  /** Insurance type code system URL */
  insuranceTypeSystem: string
}

export interface ClaimAdapterConfig {
  /** FHIR code system URLs */
  codeSystems: FHIRCodeSystemConfig
  /** Default connector ID when not specified */
  defaultConnectorId: string
  /** Default currency for Money types */
  defaultCurrency: string
  /** Whether to include empty optional fields */
  includeEmptyFields: boolean
}

export interface PolicyModeMapping {
  /** Local mode name -> PaAPI mode name */
  [localMode: string]: string
}

export interface PolicyAdapterConfig {
  /** Mode mappings from local to PaAPI format */
  modeMappings: PolicyModeMapping
  /** Default connector ID when not specified */
  defaultConnectorId: string
  /** Whether to validate CPT/HCPCS codes */
  validateProcedureCodes: boolean
}
