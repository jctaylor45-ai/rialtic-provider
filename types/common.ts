/**
 * Common FHIR-like types
 * Aligned with console-ui @rialtic/types patterns
 */

export interface Money {
  value: number
  currency: string
}

export interface Period {
  start?: string
  end?: string
}

export interface Coding {
  code: string
  system?: string
  display?: string
}

export interface CodeableConcept {
  coding: Coding[]
  text?: string
}

export interface Quantity {
  value: number
  unit?: string
}

export interface PractitionerIdentifiers {
  npi?: string | null
  ein?: string | null
}

export interface Practitioner {
  id?: string
  resourceType?: string
  name?: {
    family?: string
    given?: string[]
  }
  identifiers?: PractitionerIdentifiers
  renderingProviderId?: string | null
}

export interface PractitionerRole {
  id?: string
  resourceType?: string
  practitioner?: Practitioner
  specialty?: CodeableConcept[]
}

export interface CareTeamMember {
  sequence: number
  role: CodeableConcept
  provider?: PractitionerRole
}

export interface RenderingProvider extends CareTeamMember {
  identifiers?: PractitionerIdentifiers
}

export interface DiagnosisCode {
  codeableConcept: string
  sequence: number
  type: string
  error?: string
}

export interface Diagnosis {
  sequence: number
  diagnosisCodeableConcept: CodeableConcept
  type?: CodeableConcept[]
}

export interface Patient {
  id?: string
  resourceType?: string
  name?: Array<{
    family?: string
    given?: string[]
  }>
  birthDate?: string
  gender?: string
}

export interface Insurance {
  sequence: number
  focal: boolean
  coverage: {
    id?: string
    subscriberId?: string
    class?: Array<{
      type: { text: string }
      value: string
    }>
  }
  claimResponse?: {
    id?: string
    addItem?: Array<{
      itemSequence: number[]
      extension?: unknown[]
    }>
    extension?: unknown[]
  } | null
  preAuthRef?: string[]
}
