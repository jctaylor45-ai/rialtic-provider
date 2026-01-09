/**
 * Policy Library
 *
 * A collection of common healthcare claim edit policies that can be
 * referenced by scenario definitions. These match real-world payer policies.
 */

import type { PolicyDefinition } from './scenario-types'

export const policyLibrary: PolicyDefinition[] = [
  // ==========================================================================
  // MODIFIER POLICIES
  // ==========================================================================
  {
    id: 'POL-MOD-25',
    name: 'E/M Modifier 25 Required',
    mode: 'Edit',
    description: 'Evaluation and Management (E/M) services performed on the same day as a procedure require modifier 25 to indicate a significant, separately identifiable service.',
    clinicalRationale: 'When an E/M service is provided on the same day as a procedure, the E/M must be significant and separately identifiable to warrant separate payment. Modifier 25 indicates this service goes beyond the normal pre- and post-operative care included in the procedure.',
    topic: 'Modifiers',
    primaryLogicType: 'Same-Day Service',
    source: 'CMS/AMA CPT Guidelines',
    procedureCodes: ['99213', '99214', '99215', '99203', '99204', '99205'],
    modifiers: ['25'],
    commonMistake: 'Billing E/M service on the same day as a procedure without adding modifier 25.',
    fixGuidance: 'Add modifier 25 to the E/M code when the service is significant and separately identifiable from the procedure performed the same day.',
    referenceDocs: [
      { title: 'CPT Modifier 25 Guidelines', url: 'https://www.ama-assn.org/practice-management/cpt/modifier-25', source: 'AMA' },
    ],
  },
  {
    id: 'POL-MOD-59',
    name: 'Modifier 59 Distinct Procedural Service',
    mode: 'Edit',
    description: 'Modifier 59 indicates that a procedure or service was distinct or independent from other services performed on the same day.',
    clinicalRationale: 'Used to indicate that a procedure is separate from another procedure that would normally be bundled. Should only be used when no other modifier is appropriate.',
    topic: 'Modifiers',
    primaryLogicType: 'Bundling Override',
    source: 'CMS/AMA CPT Guidelines',
    modifiers: ['59', 'XE', 'XP', 'XS', 'XU'],
    commonMistake: 'Using modifier 59 when services are not truly distinct or when a more specific X-modifier should be used.',
    fixGuidance: 'Use modifier 59 only when services are truly distinct. Consider XE (separate encounter), XS (separate structure), XP (separate practitioner), or XU (unusual non-overlapping service) as more specific alternatives.',
  },
  {
    id: 'POL-MOD-50',
    name: 'Bilateral Procedure Modifier',
    mode: 'Edit',
    description: 'Modifier 50 indicates a procedure was performed bilaterally (on both sides of the body) during the same operative session.',
    clinicalRationale: 'When procedures are performed on both sides of the body, proper modifier use ensures correct reimbursement. Some payers require modifier 50, others require bilateral claims to be submitted as two line items with RT/LT modifiers.',
    topic: 'Modifiers',
    primaryLogicType: 'Bilateral Service',
    source: 'CMS/AMA CPT Guidelines',
    modifiers: ['50', 'RT', 'LT'],
    commonMistake: 'Billing bilateral procedures without modifier 50 or without proper RT/LT designation.',
    fixGuidance: 'Add modifier 50 for bilateral procedures or use RT (right side) and LT (left side) modifiers on separate lines depending on payer requirements.',
  },
  {
    id: 'POL-MOD-76',
    name: 'Repeat Procedure Modifier',
    mode: 'Edit',
    description: 'Modifier 76 indicates a procedure was repeated by the same physician on the same day.',
    clinicalRationale: 'When a procedure must be repeated, modifier 76 indicates the service is medically necessary and not a duplicate billing error.',
    topic: 'Modifiers',
    primaryLogicType: 'Repeat Service',
    source: 'CMS/AMA CPT Guidelines',
    modifiers: ['76', '77'],
    commonMistake: 'Billing the same procedure multiple times without modifier 76 or 77.',
    fixGuidance: 'Add modifier 76 when the same procedure is repeated by the same physician, or modifier 77 when repeated by a different physician.',
  },

  // ==========================================================================
  // AUTHORIZATION POLICIES
  // ==========================================================================
  {
    id: 'POL-AUTH-PROC',
    name: 'Prior Authorization Required',
    mode: 'Edit',
    description: 'Certain high-cost procedures require prior authorization before the service is rendered.',
    clinicalRationale: 'Prior authorization ensures medical necessity and appropriate utilization of high-cost services.',
    topic: 'Authorization',
    primaryLogicType: 'Prior Authorization',
    source: 'Payer Policy',
    procedureCodes: ['27447', '27446', '70553', '72148', '20610', '64483'],
    commonMistake: 'Performing services requiring prior authorization without obtaining approval first.',
    fixGuidance: 'Verify prior authorization requirements before scheduling services. If authorization was obtained, ensure the authorization number is included on the claim.',
  },
  {
    id: 'POL-AUTH-MRI',
    name: 'MRI Prior Authorization',
    mode: 'Edit',
    description: 'MRI procedures require prior authorization to ensure medical necessity.',
    clinicalRationale: 'MRI is a high-cost imaging service. Prior authorization ensures clinical appropriateness and may identify less costly alternatives.',
    topic: 'Authorization',
    primaryLogicType: 'Prior Authorization',
    source: 'Payer Policy',
    procedureCodes: ['70551', '70552', '70553', '72141', '72146', '72148', '72156', '72157', '73221', '73721'],
    commonMistake: 'Performing MRI without prior authorization or using incorrect authorization number.',
    fixGuidance: 'Obtain prior authorization before scheduling MRI. Include authorization number on claim submission.',
  },

  // ==========================================================================
  // DOCUMENTATION POLICIES
  // ==========================================================================
  {
    id: 'POL-DOC-PT-CAP',
    name: 'Physical Therapy Documentation Requirements',
    mode: 'Edit',
    description: 'Physical therapy services exceeding therapy caps require KX modifier and supporting documentation.',
    clinicalRationale: 'Medicare therapy caps require additional documentation to demonstrate medical necessity for services exceeding the threshold.',
    topic: 'Documentation',
    primaryLogicType: 'Therapy Cap',
    source: 'CMS Medicare',
    procedureCodes: ['97110', '97112', '97116', '97140', '97530', '97535', '97542'],
    modifiers: ['KX', 'GO', 'GP'],
    commonMistake: 'Exceeding therapy cap without KX modifier or without documented medical necessity.',
    fixGuidance: 'When approaching or exceeding therapy cap, ensure documentation supports medical necessity and add KX modifier to indicate threshold exception applies.',
  },
  {
    id: 'POL-DOC-MEDICAL-NECESSITY',
    name: 'Medical Necessity Documentation',
    mode: 'Edit',
    description: 'Services must have documented medical necessity to support the diagnosis codes billed.',
    clinicalRationale: 'Medical necessity is the foundation of coverage. Documentation must support why the service was needed for the patient\'s condition.',
    topic: 'Documentation',
    primaryLogicType: 'Medical Necessity',
    source: 'CMS/Payer Policy',
    commonMistake: 'Insufficient documentation to support medical necessity of services rendered.',
    fixGuidance: 'Ensure documentation clearly articulates the medical reason for services and links to appropriate diagnosis codes.',
  },

  // ==========================================================================
  // BUNDLING POLICIES
  // ==========================================================================
  {
    id: 'POL-BUNDLE-INJECT',
    name: 'Injection Bundling Edits',
    mode: 'Edit',
    description: 'Certain injection services are bundled and should not be billed separately.',
    clinicalRationale: 'Injection administration codes are often included in the primary procedure and billing separately would result in duplicate payment.',
    topic: 'Bundling',
    primaryLogicType: 'CCI Bundling',
    source: 'CMS NCCI Edits',
    procedureCodes: ['20610', '20611', '96372', '96374', '96375'],
    commonMistake: 'Billing injection administration codes separately when included in primary procedure.',
    fixGuidance: 'Review NCCI edits for bundling relationships. Use modifier 59 or X-modifiers only when services are truly distinct.',
  },
  {
    id: 'POL-BUNDLE-SURGERY',
    name: 'Surgical Global Period Bundling',
    mode: 'Edit',
    description: 'Services within the surgical global period are included in the surgical fee and should not be billed separately.',
    clinicalRationale: 'The global surgical package includes pre-operative, intra-operative, and post-operative care for a defined period.',
    topic: 'Bundling',
    primaryLogicType: 'Global Period',
    source: 'CMS Medicare',
    commonMistake: 'Billing E/M or other services during the global period without appropriate modifier.',
    fixGuidance: 'Use modifier 24 (unrelated E/M during global period) or modifier 79 (unrelated procedure) when services are not part of the surgical follow-up.',
  },

  // ==========================================================================
  // PLACE OF SERVICE POLICIES
  // ==========================================================================
  {
    id: 'POL-POS-TELEHEALTH',
    name: 'Telehealth Place of Service',
    mode: 'Edit',
    description: 'Telehealth services must use appropriate place of service codes (02 for telehealth, 10 for telehealth in patient home).',
    clinicalRationale: 'Correct place of service ensures appropriate reimbursement rate and compliance with telehealth coverage policies.',
    topic: 'Place of Service',
    primaryLogicType: 'Telehealth',
    source: 'CMS Telehealth Policy',
    modifiers: ['95', 'GT'],
    commonMistake: 'Using office place of service (11) for telehealth visits or omitting telehealth modifier.',
    fixGuidance: 'Use POS 02 (telehealth) or POS 10 (telehealth in patient home) with appropriate modifier 95 or GT.',
  },
  {
    id: 'POL-POS-FACILITY',
    name: 'Facility vs Non-Facility Place of Service',
    mode: 'Edit',
    description: 'Place of service must accurately reflect where services were rendered to ensure correct payment rate.',
    clinicalRationale: 'Facility and non-facility rates differ significantly. Incorrect POS may result in overpayment or underpayment.',
    topic: 'Place of Service',
    primaryLogicType: 'POS Validation',
    source: 'CMS/Payer Policy',
    commonMistake: 'Using incorrect place of service code that does not match where service was rendered.',
    fixGuidance: 'Verify place of service matches the actual location: 11 (office), 21 (inpatient hospital), 22 (outpatient hospital), etc.',
  },

  // ==========================================================================
  // CODING SPECIFICITY POLICIES
  // ==========================================================================
  {
    id: 'POL-CODE-SPECIFICITY',
    name: 'Diagnosis Code Specificity',
    mode: 'Informational',
    description: 'ICD-10 diagnosis codes must be coded to the highest level of specificity supported by documentation.',
    clinicalRationale: 'Specific diagnosis codes improve data quality and may be required for medical necessity determination.',
    topic: 'Coding',
    primaryLogicType: 'Code Specificity',
    source: 'ICD-10-CM Guidelines',
    commonMistake: 'Using unspecified diagnosis codes when documentation supports more specific codes.',
    fixGuidance: 'Review documentation and select the most specific ICD-10 code supported. Avoid unspecified codes when specificity is documented.',
  },
  {
    id: 'POL-CODE-DX-PROC',
    name: 'Diagnosis-Procedure Mismatch',
    mode: 'Edit',
    description: 'Procedure codes must be supported by appropriate diagnosis codes that establish medical necessity.',
    clinicalRationale: 'The diagnosis must support why the procedure was medically necessary.',
    topic: 'Coding',
    primaryLogicType: 'DX-Procedure Match',
    source: 'LCD/NCD Policies',
    commonMistake: 'Billing procedures with diagnosis codes that do not support medical necessity.',
    fixGuidance: 'Ensure primary diagnosis code directly relates to and supports the procedure performed.',
  },

  // ==========================================================================
  // FREQUENCY/TIMING POLICIES
  // ==========================================================================
  {
    id: 'POL-FREQ-E&M',
    name: 'E/M Visit Frequency Limit',
    mode: 'Informational',
    description: 'Multiple E/M visits on the same day by the same provider typically require medical necessity justification.',
    clinicalRationale: 'While not prohibited, multiple same-day E/M services may trigger review to ensure medical necessity.',
    topic: 'Frequency',
    primaryLogicType: 'Same-Day Duplicate',
    source: 'Payer Policy',
    procedureCodes: ['99211', '99212', '99213', '99214', '99215'],
    commonMistake: 'Billing multiple E/M services same day without documentation supporting medical necessity.',
    fixGuidance: 'Document why separate E/M services were medically necessary if multiple visits occur same day.',
  },
  {
    id: 'POL-FREQ-INJECT',
    name: 'Injection Frequency Limits',
    mode: 'Edit',
    description: 'Joint injections and nerve blocks have frequency limitations based on medical guidelines.',
    clinicalRationale: 'Excessive injection frequency may not be medically appropriate and can indicate potential overutilization.',
    topic: 'Frequency',
    primaryLogicType: 'Frequency Limit',
    source: 'Medical Guidelines/LCD',
    procedureCodes: ['20610', '20611', '64483', '64484'],
    commonMistake: 'Performing injections more frequently than medically indicated or payer-allowed.',
    fixGuidance: 'Follow frequency guidelines (typically 3-4 injections per joint per year). Document medical necessity for any exceptions.',
  },
]

/**
 * Get a policy by ID
 */
export function getPolicyById(id: string): PolicyDefinition | undefined {
  return policyLibrary.find(p => p.id === id)
}

/**
 * Get policies by topic
 */
export function getPoliciesByTopic(topic: string): PolicyDefinition[] {
  return policyLibrary.filter(p => p.topic === topic)
}

/**
 * Get all policy IDs
 */
export function getAllPolicyIds(): string[] {
  return policyLibrary.map(p => p.id)
}

/**
 * Validate that all referenced policies exist
 */
export function validatePolicyReferences(policyIds: string[]): string[] {
  const missing: string[] = []
  for (const id of policyIds) {
    if (!getPolicyById(id)) {
      missing.push(id)
    }
  }
  return missing
}
