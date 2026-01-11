/**
 * Test Minimal Scenario
 *
 * A minimal scenario for testing the mock data generator.
 * Uses a 6-month timeline with a small number of claims.
 */

import type { ScenarioDefinition } from '../tools/scenario-types'

const scenario: ScenarioDefinition = {
  id: 'test-minimal',
  name: 'Test Minimal Scenario',
  description: 'A minimal test scenario with a single pattern for validating the generator',

  timeline: {
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    periodDays: 184,
    keyEvents: [
      {
        date: '2025-08-15',
        type: 'training',
        description: 'Staff training on modifier 25 requirements',
        impactedPatterns: ['MOD25-MISSING'],
      },
    ],
  },

  practice: {
    id: 'test-practice-001',
    name: 'Test Orthopedic Associates',
    taxId: '12-3456789',
    address: {
      street: '123 Medical Drive',
      city: 'Healthcare City',
      state: 'TX',
      zip: '75001',
    },
    providers: [
      {
        id: 'prov-001',
        name: 'Dr. Sarah Johnson',
        npi: '1234567890',
        specialty: 'Orthopedic Surgery',
        taxonomy: '207X00000X',
        claimWeight: 1.5,
      },
      {
        id: 'prov-002',
        name: 'Dr. Michael Chen',
        npi: '0987654321',
        specialty: 'Sports Medicine',
        taxonomy: '207QS0000X',
        claimWeight: 1.0,
      },
    ],
  },

  volume: {
    totalClaims: 500,
    monthlyVariation: {
      '2025-07': 1.0,
      '2025-08': 1.1,
      '2025-09': 1.0,
      '2025-10': 0.9,
      '2025-11': 0.8,
      '2025-12': 0.7,
    },
    claimLinesPerClaim: {
      min: 1,
      max: 4,
    },
    claimValueRanges: {
      low: { min: 75, max: 250 },
      medium: { min: 250, max: 1500 },
      high: { min: 1500, max: 5000 },
    },
  },

  patterns: [
    {
      id: 'MOD25-MISSING',
      title: 'Missing Modifier 25 on E/M Services',
      description: 'E/M services billed on the same day as procedures without required modifier 25',
      category: 'modifier-missing',
      status: 'improving',
      tier: 'high',
      procedureCodes: ['99213', '99214', '99215'],
      policies: [
        { id: 'POL-MOD-25', triggerRate: 0.9 },
      ],
      denialReason: 'Modifier 25 required for E/M service on same day as procedure',
      claimDistribution: {
        total: 150,
        deniedBaseline: 45,
        deniedCurrent: 15,
        appealsFiled: 20,
        appealsOverturned: 12,
      },
      trajectory: {
        curve: 'steep_improvement',
        baseline: {
          periodStart: '2025-07-01',
          periodEnd: '2025-08-31',
          claimCount: 50,
          deniedCount: 45,
          denialRate: 30,
          dollarsDenied: 13500,
        },
        current: {
          periodStart: '2025-11-01',
          periodEnd: '2025-12-31',
          claimCount: 50,
          deniedCount: 5,
          denialRate: 10,
          dollarsDenied: 1500,
        },
        snapshots: [
          { month: '2025-07', denialRate: 32, dollarsDenied: 4800 },
          { month: '2025-08', denialRate: 28, dollarsDenied: 4200 },
          { month: '2025-09', denialRate: 20, dollarsDenied: 3000 },
          { month: '2025-10', denialRate: 15, dollarsDenied: 2250 },
          { month: '2025-11', denialRate: 12, dollarsDenied: 1800 },
          { month: '2025-12', denialRate: 8, dollarsDenied: 1200 },
        ],
      },
      engagement: {
        firstViewedDate: '2025-07-10',
        totalViews: 25,
        claimLabTests: 8,
        claimsExported: 15,
        actionsRecorded: [
          {
            id: 'action-001',
            date: '2025-08-15',
            type: 'staff-training',
            notes: 'Conducted modifier 25 training session',
          },
          {
            id: 'action-002',
            date: '2025-09-01',
            type: 'workflow-update',
            notes: 'Updated billing workflow to prompt for modifier 25',
          },
        ],
      },
      remediation: {
        shortTerm: {
          description: 'Review and resubmit denied claims with modifier 25 added',
          canResubmit: true,
          claimCount: 30,
          amount: 9000,
        },
        longTerm: {
          description: 'Implement billing workflow changes and ongoing training',
          steps: [
            'Update EHR to auto-prompt for modifier 25 when E/M and procedure on same day',
            'Create billing checklist for same-day services',
            'Schedule quarterly refresher training on modifier requirements',
          ],
        },
      },
    },
    {
      id: 'AUTH-MISSING',
      title: 'Missing Prior Authorization',
      description: 'High-cost procedures performed without required prior authorization',
      category: 'authorization',
      status: 'active',
      tier: 'critical',
      procedureCodes: ['27447', '27446', '70553'],
      policies: [
        { id: 'POL-AUTH-PROC', triggerRate: 0.95 },
        { id: 'POL-AUTH-MRI', triggerRate: 0.8 },
      ],
      denialReason: 'Prior authorization required but not obtained',
      claimDistribution: {
        total: 80,
        deniedBaseline: 24,
        deniedCurrent: 20,
        appealsFiled: 15,
        appealsOverturned: 3,
      },
      trajectory: {
        curve: 'slight_improvement',
        baseline: {
          periodStart: '2025-07-01',
          periodEnd: '2025-08-31',
          claimCount: 25,
          deniedCount: 24,
          denialRate: 30,
          dollarsDenied: 72000,
        },
        current: {
          periodStart: '2025-11-01',
          periodEnd: '2025-12-31',
          claimCount: 25,
          deniedCount: 20,
          denialRate: 25,
          dollarsDenied: 60000,
        },
        snapshots: [
          { month: '2025-07', denialRate: 32, dollarsDenied: 12800 },
          { month: '2025-08', denialRate: 30, dollarsDenied: 12000 },
          { month: '2025-09', denialRate: 28, dollarsDenied: 11200 },
          { month: '2025-10', denialRate: 27, dollarsDenied: 10800 },
          { month: '2025-11', denialRate: 26, dollarsDenied: 10400 },
          { month: '2025-12', denialRate: 24, dollarsDenied: 9600 },
        ],
      },
      engagement: {
        firstViewedDate: '2025-07-15',
        totalViews: 18,
        claimLabTests: 5,
        claimsExported: 10,
        actionsRecorded: [],
      },
      remediation: {
        shortTerm: {
          description: 'Submit retroactive authorization requests for denied claims',
          canResubmit: false,
          claimCount: 20,
          amount: 60000,
        },
        longTerm: {
          description: 'Implement pre-scheduling authorization verification',
          steps: [
            'Add prior auth check to scheduling workflow',
            'Create authorization tracking dashboard',
            'Assign dedicated staff for authorization management',
          ],
        },
      },
    },
  ],

  learningEvents: {
    eventDistribution: {
      'pattern_viewed': 25,
      'claim_inspected': 50,
      'policy_learned': 15,
      'claim_lab_test': 13,
      'export_claims': 10,
    },
    eventClustering: {
      'MOD25-MISSING': ['2025-08-15', '2025-08-16', '2025-09-01'],
      'AUTH-MISSING': ['2025-07-15', '2025-07-20'],
    },
  },

  targetMetrics: {
    totalClaims: 500,
    totalDenied: 75,
    overallDenialRate: 15,
    totalDollarsDenied: 112500,
    totalAppeals: 35,
    appealSuccessRate: 42.8,
  },
}

export default scenario
