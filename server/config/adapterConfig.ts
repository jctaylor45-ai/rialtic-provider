/**
 * Adapter Configuration
 *
 * Centralized configuration for claim and policy adapters.
 * These values can be overridden via environment variables or PaAPI settings.
 */

import type { ClaimAdapterConfig, PolicyAdapterConfig } from '~/types'

// =============================================================================
// DEFAULT FHIR CODE SYSTEMS
// =============================================================================

export const DEFAULT_CODE_SYSTEMS = {
  providerTaxonomy: 'http://nucc.org/provider-taxonomy',
  diagnosisSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
  procedureSystem: 'http://www.ama-assn.org/go/cpt',
  careTeamRoleSystem: 'http://terminology.hl7.org/CodeSystem/claimcareteamrole',
  claimTypeSystem: 'http://terminology.hl7.org/CodeSystem/claim-type',
  insuranceTypeSystem: 'http://terminology.hl7.org/CodeSystem/coverage-class',
} as const

// =============================================================================
// DEFAULT ADAPTER CONFIGURATIONS
// =============================================================================

export const DEFAULT_CLAIM_ADAPTER_CONFIG: ClaimAdapterConfig = {
  codeSystems: { ...DEFAULT_CODE_SYSTEMS },
  defaultConnectorId: process.env.PAAPI_CONNECTOR_ID || 'default',
  defaultCurrency: 'USD',
  includeEmptyFields: false,
}

export const DEFAULT_POLICY_MODE_MAPPINGS = {
  Edit: 'Active',
  Informational: 'Observation',
  'Pay & Advise': 'Inspection',
  Active: 'Active',
  Observation: 'Observation',
  Inspection: 'Inspection',
} as const

export const DEFAULT_POLICY_ADAPTER_CONFIG: PolicyAdapterConfig = {
  modeMappings: { ...DEFAULT_POLICY_MODE_MAPPINGS },
  defaultConnectorId: process.env.PAAPI_CONNECTOR_ID || 'default',
  validateProcedureCodes: false,
}

// =============================================================================
// CONFIGURATION GETTERS (with runtime overrides)
// =============================================================================

let claimAdapterConfig: ClaimAdapterConfig = { ...DEFAULT_CLAIM_ADAPTER_CONFIG }
let policyAdapterConfig: PolicyAdapterConfig = { ...DEFAULT_POLICY_ADAPTER_CONFIG }

/**
 * Get the current claim adapter configuration
 */
export function getClaimAdapterConfig(): ClaimAdapterConfig {
  return claimAdapterConfig
}

/**
 * Get the current policy adapter configuration
 */
export function getPolicyAdapterConfig(): PolicyAdapterConfig {
  return policyAdapterConfig
}

/**
 * Update claim adapter configuration at runtime
 */
export function setClaimAdapterConfig(config: Partial<ClaimAdapterConfig>): void {
  claimAdapterConfig = {
    ...claimAdapterConfig,
    ...config,
    codeSystems: {
      ...claimAdapterConfig.codeSystems,
      ...config.codeSystems,
    },
  }
}

/**
 * Update policy adapter configuration at runtime
 */
export function setPolicyAdapterConfig(config: Partial<PolicyAdapterConfig>): void {
  policyAdapterConfig = {
    ...policyAdapterConfig,
    ...config,
    modeMappings: {
      ...policyAdapterConfig.modeMappings,
      ...config.modeMappings,
    },
  }
}

/**
 * Reset configurations to defaults
 */
export function resetAdapterConfigs(): void {
  claimAdapterConfig = { ...DEFAULT_CLAIM_ADAPTER_CONFIG }
  policyAdapterConfig = { ...DEFAULT_POLICY_ADAPTER_CONFIG }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map a local policy mode to PaAPI mode using current configuration
 */
export function mapPolicyMode(localMode: string): string {
  return policyAdapterConfig.modeMappings[localMode] || localMode
}

/**
 * Get the connector ID to use for adapters
 */
export function getConnectorId(): string {
  return claimAdapterConfig.defaultConnectorId
}
