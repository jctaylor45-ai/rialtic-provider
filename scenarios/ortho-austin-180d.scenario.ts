/**
 * Scenario: Austin Regional Orthopedics & Sports Medicine
 * 
 * Full 180-day demo scenario showing ROI building as patterns get addressed.
 * 
 * Timeline: July 15, 2024 → January 9, 2025
 * 
 * Pattern Portfolio:
 *   1. Missing Bilateral Modifier (50)     - RESOLVED (success story)
 *   2. PT Therapy Cap Documentation        - IMPROVING (in progress)
 *   3. E/M with Same-Day Procedure         - ACTIVE/CRITICAL (biggest opportunity)
 *   4. Prior Auth Missing for MRI          - ACTIVE/HIGH (process fix needed)
 *   5. Injection Bundling Errors           - ACTIVE/MEDIUM (coding knowledge)
 *   6. Telehealth Place of Service         - ACTIVE/LOW (unfixed - rational ignore)
 */

import type { ScenarioDefinition } from '../tools/scenario-types'

const scenario: ScenarioDefinition = {
  id: 'ortho-austin-180d',
  name: 'Austin Regional Orthopedics & Sports Medicine',
  description: 'Multi-specialty orthopedic practice demonstrating pattern-based learning ROI over 180 days',
  
  timeline: {
    startDate: '2024-07-15',
    endDate: '2025-01-09',
    periodDays: 178,
    keyEvents: [
      {
        date: '2024-09-01',
        type: 'training',
        description: 'Bilateral modifier training session conducted',
        impactedPatterns: ['PTN-001'],
      },
      {
        date: '2024-09-05',
        type: 'system_update',
        description: 'Bilateral procedure checklist added to charge capture',
        impactedPatterns: ['PTN-001'],
      },
      {
        date: '2024-10-15',
        type: 'system_update',
        description: 'EMR therapy cap tracking implemented',
        impactedPatterns: ['PTN-002'],
      },
    ],
  },
  
  practice: {
    id: 'PRV-AUSTIN-ORTHO',
    name: 'Austin Regional Orthopedics & Sports Medicine',
    taxId: '74-1234567',
    address: {
      street: '4500 Medical Parkway, Suite 200',
      city: 'Austin',
      state: 'TX',
      zip: '78756',
    },
    providers: [
      // Orthopedic Surgeons (4) - highest claim weight
      { 
        id: 'DOC-001', 
        name: 'Dr. Sarah Chen', 
        npi: '1111111111', 
        specialty: 'Orthopedic Surgery', 
        taxonomy: '207X00000X',
        claimWeight: 1.8,
      },
      { 
        id: 'DOC-002', 
        name: 'Dr. Michael Rodriguez', 
        npi: '1111111112', 
        specialty: 'Orthopedic Surgery', 
        taxonomy: '207X00000X',
        claimWeight: 1.6,
      },
      { 
        id: 'DOC-003', 
        name: 'Dr. James Wilson', 
        npi: '1111111113', 
        specialty: 'Orthopedic Surgery', 
        taxonomy: '207X00000X',
        claimWeight: 1.5,
      },
      { 
        id: 'DOC-004', 
        name: 'Dr. Emily Foster', 
        npi: '1111111114', 
        specialty: 'Orthopedic Surgery', 
        taxonomy: '207X00000X',
        claimWeight: 1.4,
      },
      
      // Sports Medicine (3)
      { 
        id: 'DOC-005', 
        name: 'Dr. David Park', 
        npi: '1111111115', 
        specialty: 'Sports Medicine', 
        taxonomy: '207QS0010X',
        claimWeight: 1.2,
      },
      { 
        id: 'DOC-006', 
        name: 'Dr. Amanda Torres', 
        npi: '1111111116', 
        specialty: 'Sports Medicine', 
        taxonomy: '207QS0010X',
        claimWeight: 1.1,
      },
      { 
        id: 'DOC-007', 
        name: "Dr. Kevin O'Brien", 
        npi: '1111111117', 
        specialty: 'Sports Medicine', 
        taxonomy: '207QS0010X',
        claimWeight: 1.0,
      },
      
      // Physical Therapists (3) - high volume, lower value
      { 
        id: 'DOC-008', 
        name: 'Lisa Martinez, PT, DPT', 
        npi: '1111111118', 
        specialty: 'Physical Therapy', 
        taxonomy: '225100000X',
        claimWeight: 2.0,
      },
      { 
        id: 'DOC-009', 
        name: 'Robert Kim, PT, DPT', 
        npi: '1111111119', 
        specialty: 'Physical Therapy', 
        taxonomy: '225100000X',
        claimWeight: 1.8,
      },
      { 
        id: 'DOC-010', 
        name: 'Jennifer Adams, PT, DPT', 
        npi: '1111111120', 
        specialty: 'Physical Therapy', 
        taxonomy: '225100000X',
        claimWeight: 1.5,
      },
      
      // Pain Management (2)
      { 
        id: 'DOC-011', 
        name: 'Dr. Richard Lee', 
        npi: '1111111121', 
        specialty: 'Pain Management', 
        taxonomy: '208VP0014X',
        claimWeight: 1.3,
      },
      { 
        id: 'DOC-012', 
        name: 'Dr. Susan Wright', 
        npi: '1111111122', 
        specialty: 'Pain Management', 
        taxonomy: '208VP0014X',
        claimWeight: 1.2,
      },
    ],
  },
  
  volume: {
    totalClaims: 2400,
    monthlyVariation: {
      '2024-07': 0.95,   // Summer - slightly lower (partial month)
      '2024-08': 1.00,   // Normal
      '2024-09': 1.05,   // Back to school sports injuries
      '2024-10': 1.00,   // Normal
      '2024-11': 0.92,   // Thanksgiving week slowdown
      '2024-12': 0.88,   // Holidays - lower volume
      '2025-01': 1.10,   // New year, deferred procedures (partial month)
    },
    claimLinesPerClaim: {
      min: 1,
      max: 4,
    },
    claimValueRanges: {
      low: { min: 75, max: 350 },      // PT, simple E/M
      medium: { min: 350, max: 2500 }, // Injections, complex E/M, imaging
      high: { min: 2500, max: 15000 }, // Surgical procedures
    },
  },
  
  patterns: [
    
    // ========================================================================
    // PATTERN 1: Missing Bilateral Modifier (RESOLVED - Success Story)
    // ========================================================================
    {
      id: 'PTN-001',
      title: 'Missing Bilateral Modifier (50)',
      description: 'Claims for bilateral orthopedic procedures submitted without modifier 50, LT, or RT when bilateral indicator allows it. Staff training resolved this issue.',
      category: 'modifier-missing',
      status: 'resolved',
      tier: 'medium',
      procedureCodes: ['27447', '27446', '29881', '29880', '27486'],
      policies: [
        { id: 'POL-MOD-50', triggerRate: 0.95 },
      ],
      denialReason: 'Bilateral procedure modifier 50 required. Claims for bilateral procedures must include modifier 50 or be submitted as two lines with RT/LT modifiers.',
      claimDistribution: {
        total: 420,
        deniedBaseline: 60,
        deniedCurrent: 11,
        appealsFiled: 8,
        appealsOverturned: 7,
      },
      trajectory: {
        curve: 'steep_improvement',
        baseline: {
          periodStart: '2024-07-15',
          periodEnd: '2024-08-31',
          claimCount: 70,
          deniedCount: 60,
          denialRate: 14,
          dollarsDenied: 52000,
        },
        current: {
          periodStart: '2024-12-01',
          periodEnd: '2025-01-09',
          claimCount: 70,
          deniedCount: 11,
          denialRate: 2.6,
          dollarsDenied: 8500,
        },
        snapshots: [
          { month: '2024-07', denialRate: 14, dollarsDenied: 8700, claimCount: 62, deniedCount: 9 },
          { month: '2024-08', denialRate: 14, dollarsDenied: 9100, claimCount: 65, deniedCount: 9 },
          { month: '2024-09', denialRate: 8, dollarsDenied: 5500, claimCount: 69, deniedCount: 6 },
          { month: '2024-10', denialRate: 4, dollarsDenied: 2900, claimCount: 72, deniedCount: 3 },
          { month: '2024-11', denialRate: 3, dollarsDenied: 2100, claimCount: 70, deniedCount: 2 },
          { month: '2024-12', denialRate: 2.6, dollarsDenied: 1800, claimCount: 68, deniedCount: 2 },
        ],
      },
      engagement: {
        firstViewedDate: '2024-08-10',
        totalViews: 18,
        claimLabTests: 12,
        claimsExported: 45,
        actionsRecorded: [
          { 
            id: 'action-001',
            type: 'staff-training', 
            date: '2024-09-01', 
            notes: 'Conducted billing team training on bilateral modifier requirements. Covered modifier 50 vs LT/RT usage.',
          },
          { 
            id: 'action-002',
            type: 'workflow-update', 
            date: '2024-09-05', 
            notes: 'Added bilateral procedure checklist to charge capture workflow.',
          },
        ],
      },
      remediation: {
        shortTerm: {
          description: 'Add modifier 50 to affected claims and resubmit for payment',
          canResubmit: true,
          claimCount: 60,
          amount: 52000,
        },
        longTerm: {
          description: 'Implement billing workflow changes to prevent missing bilateral modifiers',
          steps: [
            'Train billing staff on bilateral modifier requirements (50 vs LT/RT)',
            'Add bilateral procedure checklist to charge capture workflow',
            'Configure EHR to auto-prompt for bilateral modifier on applicable codes',
            'Monitor denial rate monthly to ensure sustained improvement',
          ],
        },
      },
    },
    
    // ========================================================================
    // PATTERN 2: PT Therapy Cap Documentation (IMPROVING)
    // ========================================================================
    {
      id: 'PTN-002',
      title: 'Physical Therapy Frequency Limits',
      description: 'Physical therapy claims exceeding units/frequency limitations without supporting documentation for medical necessity exception.',
      category: 'documentation',
      status: 'improving',
      tier: 'high',
      procedureCodes: ['97110', '97140', '97530', '97112', '97116'],
      policies: [
        { id: 'POL-DOC-PT-CAP', triggerRate: 0.85 },
      ],
      denialReason: 'Physical therapy services exceed frequency limits. Medical necessity documentation required when exceeding therapy cap threshold.',
      claimDistribution: {
        total: 890,
        deniedBaseline: 107,
        deniedCurrent: 62,
        appealsFiled: 15,
        appealsOverturned: 9,
      },
      trajectory: {
        curve: 'gradual_improvement',
        baseline: {
          periodStart: '2024-07-15',
          periodEnd: '2024-08-31',
          claimCount: 150,
          deniedCount: 107,
          denialRate: 12,
          dollarsDenied: 38000,
        },
        current: {
          periodStart: '2024-12-01',
          periodEnd: '2025-01-09',
          claimCount: 140,
          deniedCount: 62,
          denialRate: 7,
          dollarsDenied: 18500,
        },
        snapshots: [
          { month: '2024-07', denialRate: 12, dollarsDenied: 5700, claimCount: 135, deniedCount: 16 },
          { month: '2024-08', denialRate: 12, dollarsDenied: 6300, claimCount: 150, deniedCount: 18 },
          { month: '2024-09', denialRate: 11, dollarsDenied: 5800, claimCount: 155, deniedCount: 17 },
          { month: '2024-10', denialRate: 9, dollarsDenied: 4600, claimCount: 148, deniedCount: 13 },
          { month: '2024-11', denialRate: 8, dollarsDenied: 3800, claimCount: 135, deniedCount: 11 },
          { month: '2024-12', denialRate: 7, dollarsDenied: 3100, claimCount: 125, deniedCount: 9 },
        ],
      },
      engagement: {
        firstViewedDate: '2024-08-20',
        totalViews: 14,
        claimLabTests: 8,
        claimsExported: 32,
        actionsRecorded: [
          { 
            id: 'action-003',
            type: 'workflow-update', 
            date: '2024-10-15', 
            notes: 'Implemented therapy cap tracking in EMR. Auto-alerts when approaching limits.',
          },
        ],
      },
      remediation: {
        shortTerm: {
          description: 'Appeal with supporting medical necessity documentation for therapy cap exception',
          canResubmit: false,
          claimCount: 62,
          amount: 18500,
        },
        longTerm: {
          description: 'Implement proactive therapy cap monitoring and documentation workflow',
          steps: [
            'Configure EMR to track therapy units against cap threshold',
            'Add KX modifier workflow for medical necessity exception claims',
            'Create documentation templates for therapy cap exception justification',
            'Train therapists on cap thresholds and documentation requirements',
          ],
        },
      },
    },
    
    // ========================================================================
    // PATTERN 3: E/M with Same-Day Procedure (ACTIVE - CRITICAL)
    // ========================================================================
    {
      id: 'PTN-003',
      title: 'E/M Service Missing Modifier 25',
      description: 'Evaluation and management services billed on same day as procedures without modifier 25, triggering global surgery edit.',
      category: 'modifier-missing',
      status: 'active',
      tier: 'critical',
      procedureCodes: ['99213', '99214', '99215', '99203', '99204', '99205'],
      policies: [
        { id: 'POL-MOD-25', triggerRate: 0.90 },
      ],
      denialReason: 'Modifier 25 required for E/M service on same day as procedure. The E/M service must be significant and separately identifiable.',
      claimDistribution: {
        total: 680,
        deniedBaseline: 122,
        deniedCurrent: 109,
        appealsFiled: 18,
        appealsOverturned: 14,
      },
      trajectory: {
        curve: 'slight_improvement',
        baseline: {
          periodStart: '2024-07-15',
          periodEnd: '2024-09-15',
          claimCount: 230,
          deniedCount: 122,
          denialRate: 18,
          dollarsDenied: 67000,
        },
        current: {
          periodStart: '2024-11-01',
          periodEnd: '2025-01-09',
          claimCount: 220,
          deniedCount: 109,
          denialRate: 16,
          dollarsDenied: 58000,
        },
        snapshots: [
          { month: '2024-09', denialRate: 18, dollarsDenied: 11200, claimCount: 115, deniedCount: 21 },
          { month: '2024-10', denialRate: 17, dollarsDenied: 10800, claimCount: 112, deniedCount: 19 },
          { month: '2024-11', denialRate: 17, dollarsDenied: 9600, claimCount: 103, deniedCount: 18 },
          { month: '2024-12', denialRate: 16, dollarsDenied: 8900, claimCount: 98, deniedCount: 16 },
        ],
      },
      engagement: {
        firstViewedDate: '2024-10-01',
        totalViews: 6,
        claimLabTests: 2,
        claimsExported: 12,
        actionsRecorded: [],  // No actions taken yet - opportunity!
      },
      remediation: {
        shortTerm: {
          description: 'Add modifier 25 to E/M codes on affected claims and resubmit',
          canResubmit: true,
          claimCount: 109,
          amount: 58000,
        },
        longTerm: {
          description: 'Implement billing workflow to auto-prompt for modifier 25 on same-day E/M + procedure',
          steps: [
            'Review billing system edit configuration for E/M + procedure combinations',
            'Add pre-submission prompt or auto-flag for modifier 25 review',
            'Brief coding staff on modifier 25 requirements for separately identifiable services',
            'Monitor denial rate for this pattern over next 30 days',
          ],
        },
      },
    },
    
    // ========================================================================
    // PATTERN 4: Prior Auth Missing for MRI (ACTIVE - HIGH)
    // ========================================================================
    {
      id: 'PTN-004',
      title: 'Advanced Imaging Without Prior Authorization',
      description: 'MRI and CT imaging claims denied for missing prior authorization that is required by payer.',
      category: 'authorization',
      status: 'active',
      tier: 'high',
      procedureCodes: ['73721', '73723', '72148', '72141', '73221', '73223'],
      policies: [
        { id: 'POL-AUTH-MRI', triggerRate: 0.95 },
      ],
      denialReason: 'Prior authorization required for advanced imaging. MRI procedures require payer authorization before service is rendered.',
      claimDistribution: {
        total: 285,
        deniedBaseline: 63,
        deniedCurrent: 57,
        appealsFiled: 22,
        appealsOverturned: 11,
      },
      trajectory: {
        curve: 'stable',
        baseline: {
          periodStart: '2024-07-15',
          periodEnd: '2024-09-15',
          claimCount: 95,
          deniedCount: 63,
          denialRate: 22,
          dollarsDenied: 44000,
        },
        current: {
          periodStart: '2024-11-01',
          periodEnd: '2025-01-09',
          claimCount: 95,
          deniedCount: 57,
          denialRate: 20,
          dollarsDenied: 39000,
        },
        snapshots: [
          { month: '2024-10', denialRate: 22, dollarsDenied: 7300, claimCount: 48, deniedCount: 11 },
          { month: '2024-11', denialRate: 21, dollarsDenied: 6800, claimCount: 44, deniedCount: 9 },
          { month: '2024-12', denialRate: 20, dollarsDenied: 6200, claimCount: 42, deniedCount: 8 },
        ],
      },
      engagement: {
        firstViewedDate: '2024-10-20',
        totalViews: 4,
        claimLabTests: 0,
        claimsExported: 8,
        actionsRecorded: [],  // No actions taken
      },
      remediation: {
        shortTerm: {
          description: 'Submit retroactive authorization requests for denied claims where possible',
          canResubmit: false,
          claimCount: 57,
          amount: 22000,  // Some can get retro-auth
        },
        longTerm: {
          description: 'Implement pre-scheduling authorization verification for advanced imaging',
          steps: [
            'Add prior auth check to MRI scheduling workflow',
            'Create authorization tracking dashboard for pending requests',
            'Assign dedicated staff for authorization management',
            'Configure EHR alerts for procedures requiring prior auth',
          ],
        },
      },
    },
    
    // ========================================================================
    // PATTERN 5: Injection Bundling Errors (ACTIVE - MEDIUM)
    // ========================================================================
    {
      id: 'PTN-005',
      title: 'Injection Administration Bundling',
      description: 'Drug injection claims denied for bundling errors - administration codes billed separately when included in injection code.',
      category: 'billing-error',
      status: 'active',
      tier: 'medium',
      procedureCodes: ['J3301', 'J0585', '20610', '20611', '96372'],
      policies: [
        { id: 'POL-BUNDLE-INJECT', triggerRate: 0.85 },
      ],
      denialReason: 'Injection administration bundled with drug code. Administration code 96372 is included when billing joint injection codes.',
      claimDistribution: {
        total: 265,
        deniedBaseline: 34,
        deniedCurrent: 32,
        appealsFiled: 5,
        appealsOverturned: 4,
      },
      trajectory: {
        curve: 'stable',
        baseline: {
          periodStart: '2024-09-01',
          periodEnd: '2024-10-31',
          claimCount: 90,
          deniedCount: 34,
          denialRate: 13,
          dollarsDenied: 28000,
        },
        current: {
          periodStart: '2024-11-01',
          periodEnd: '2025-01-09',
          claimCount: 88,
          deniedCount: 32,
          denialRate: 12,
          dollarsDenied: 24000,
        },
        snapshots: [
          { month: '2024-11', denialRate: 13, dollarsDenied: 4200, claimCount: 45, deniedCount: 6 },
          { month: '2024-12', denialRate: 12, dollarsDenied: 3800, claimCount: 42, deniedCount: 5 },
        ],
      },
      engagement: {
        firstViewedDate: '2024-11-25',
        totalViews: 3,
        claimLabTests: 1,
        claimsExported: 5,
        actionsRecorded: [],  // Recently detected, no actions yet
      },
      remediation: {
        shortTerm: {
          description: 'Review NCCI bundling edits and appeal with modifier 59 documentation where services were distinct',
          canResubmit: true,
          claimCount: 32,
          amount: 24000,
        },
        longTerm: {
          description: 'Update billing workflows to prevent injection bundling errors',
          steps: [
            'Review NCCI edits for injection/administration code pairs',
            'Configure charge capture to prevent duplicate administration billing',
            'Train coders on proper injection bundling rules',
            'Use modifier 59/X modifiers only when services are truly distinct',
          ],
        },
      },
    },
    
    // ========================================================================
    // PATTERN 6: Telehealth Place of Service (ACTIVE - LOW / UNFIXED)
    // ========================================================================
    {
      id: 'PTN-006',
      title: 'Telehealth Place of Service Mismatch',
      description: 'Telehealth claims with modifier 95 denied for incorrect place of service code. Requires POS 02 or 10. Provider has chosen not to address due to low dollar value.',
      category: 'billing-error',
      status: 'active',
      tier: 'low',
      procedureCodes: ['99213', '99214', '98960', '98961'],
      policies: [
        { id: 'POL-POS-TELEHEALTH', triggerRate: 0.90 },
      ],
      denialReason: 'Telehealth place of service invalid. Claims with modifier 95 must use POS 02 (telehealth) or POS 10 (telehealth in patient home).',
      claimDistribution: {
        total: 87,
        deniedBaseline: 16,
        deniedCurrent: 15,
        appealsFiled: 1,   // Very low - they know it won't overturn
        appealsOverturned: 0,  // Coverage limitation, not error
      },
      trajectory: {
        curve: 'flat',
        baseline: {
          periodStart: '2024-10-01',
          periodEnd: '2024-11-30',
          claimCount: 45,
          deniedCount: 16,
          denialRate: 18,
          dollarsDenied: 8200,
        },
        current: {
          periodStart: '2024-12-01',
          periodEnd: '2025-01-09',
          claimCount: 42,
          deniedCount: 15,
          denialRate: 17,
          dollarsDenied: 7500,
        },
        snapshots: [
          { month: '2024-12', denialRate: 17, dollarsDenied: 2500, claimCount: 28, deniedCount: 5 },
        ],
      },
      // LOW ENGAGEMENT - This is the "unfixed" pattern
      // The data tells the story: minimal views, no tests, no actions, low appeals
      engagement: {
        firstViewedDate: '2024-12-10',
        totalViews: 2,               // Barely looked at it
        claimLabTests: 0,            // Never tested a fix
        claimsExported: 0,           // Didn't even export claims
        actionsRecorded: [],         // No actions taken
      },
      remediation: {
        shortTerm: {
          description: 'These claims are not recoverable - place of service was incorrect at time of service',
          canResubmit: false,
          claimCount: 15,
          amount: 0,  // Not recoverable
        },
        longTerm: {
          description: 'Update telehealth scheduling workflow to ensure correct place of service',
          steps: [
            'Configure scheduling system to auto-assign POS 02 for telehealth appointments',
            'Train front desk staff on telehealth POS requirements',
            'Add telehealth POS validation to pre-billing edit checks',
          ],
        },
      },
    },
  ],
  
  learningEvents: {
    eventDistribution: {
      'pattern_viewed': 47,
      'claim_inspected': 65,
      'policy_learned': 29,
      'claim_lab_test': 23,
      'export_claims': 6,
      'dashboard_viewed': 45,
      'pattern_expanded': 32,
      'action_recorded': 3,
    },
    eventClustering: {
      'PTN-001': ['2024-08-10', '2024-08-15', '2024-09-01', '2024-09-05'],
      'PTN-002': ['2024-08-20', '2024-10-15'],
      'PTN-003': ['2024-10-01', '2024-10-15'],
      'PTN-004': ['2024-10-20'],
      'PTN-005': ['2024-11-25'],
      'PTN-006': ['2024-12-10'],
    },
  },
  
  targetMetrics: {
    totalClaims: 2400,
    totalDenied: 286,
    overallDenialRate: 11.9,
    totalDollarsDenied: 195000,
    totalAppeals: 71,
    appealSuccessRate: 63.4,
  },
}

export default scenario
