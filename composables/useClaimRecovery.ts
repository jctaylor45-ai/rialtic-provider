/**
 * Composable for computing claim recovery status based on logic types and policy data
 */

export type RecoveryStatus = 'recoverable' | 'partial' | 'not_recoverable'

export interface RecoveryComputation {
  status: RecoveryStatus
  guidance: string
  canResubmit: boolean
}

export interface PolicyFailureDetail {
  policyId: string
  policyName: string
  logicType: string
  description: string
  fixGuidance: string
}

export function useClaimRecovery() {
  const appStore = useAppStore()

  // Logic type → Recovery status mapping
  const logicTypeRecoveryMap: Record<string, RecoveryStatus> = {
    'Modifier': 'recoverable',
    'Bundling': 'recoverable',
    'Place of Service': 'recoverable',
    'Diagnosis': 'recoverable',
    'Medical Necessity': 'partial',
    'Non-Covered Service': 'not_recoverable',
    'Timely Filing': 'not_recoverable',
    'Units/Frequency': 'partial',
    'Authorization': 'partial',
    'Age': 'not_recoverable',
    'Gender': 'not_recoverable',
  }

  // Get recovery status for a logic type
  function getRecoveryForLogicType(logicType: string): RecoveryStatus {
    return logicTypeRecoveryMap[logicType] || 'partial'
  }

  // Generate default guidance based on logic type
  function generateDefaultGuidance(logicType: string): string {
    const guidanceMap: Record<string, string> = {
      'Modifier': 'Add the required modifier and resubmit',
      'Bundling': 'Review bundling rules; consider modifier 59 or XE/XP/XS/XU if appropriate',
      'Place of Service': 'Verify and correct place of service code',
      'Diagnosis': 'Review diagnosis code requirements for this procedure',
      'Medical Necessity': 'Ensure documentation supports medical necessity; may require appeal',
      'Non-Covered Service': 'Service not covered under plan; patient responsibility or appeal with documentation',
      'Timely Filing': 'Filing deadline has passed; limited recovery options',
      'Units/Frequency': 'Review allowed units/frequency; reduce if over limit',
      'Authorization': 'Obtain retroactive authorization if possible',
      'Age': 'Service not covered for patient age; review medical policy',
      'Gender': 'Service not covered for patient gender; verify coding',
    }
    return guidanceMap[logicType] || 'Review denial reason and correct as needed'
  }

  // Get policy details for a list of policy IDs
  function getPolicyDetails(policyIds: string[]): PolicyFailureDetail[] {
    return policyIds
      .map(id => {
        const policy = appStore.policies.find(p => p.id === id)
        if (!policy) return null
        return {
          policyId: policy.id,
          policyName: policy.name,
          logicType: policy.logicType,
          description: policy.description || policy.clinicalRationale || '',
          fixGuidance: policy.fixGuidance || generateDefaultGuidance(policy.logicType),
        }
      })
      .filter((p): p is PolicyFailureDetail => p !== null)
  }

  // Compute recovery status for a line item
  function computeLineRecovery(
    policiesTriggered: string[],
    editsFired: string[]
  ): RecoveryComputation {
    const policyDetails = getPolicyDetails(policiesTriggered)

    if (policyDetails.length === 0 && editsFired.length === 0) {
      return {
        status: 'recoverable',
        guidance: 'No specific issues identified',
        canResubmit: true,
      }
    }

    // Find worst-case recovery status
    let worstStatus: RecoveryStatus = 'recoverable'
    const guidanceParts: string[] = []

    for (const policy of policyDetails) {
      const status = getRecoveryForLogicType(policy.logicType)

      if (status === 'not_recoverable') {
        worstStatus = 'not_recoverable'
      } else if (status === 'partial' && worstStatus === 'recoverable') {
        worstStatus = 'partial'
      }

      guidanceParts.push(policy.fixGuidance)
    }

    // If no policy details but editsFired exists, provide generic guidance
    if (policyDetails.length === 0 && editsFired.length > 0) {
      return {
        status: 'partial',
        guidance: editsFired.join('. '),
        canResubmit: true,
      }
    }

    return {
      status: worstStatus,
      guidance: guidanceParts.join('. ') || 'Review and correct issues before resubmission',
      canResubmit: worstStatus !== 'not_recoverable',
    }
  }

  // Get status color class
  function getRecoveryStatusColor(status: RecoveryStatus): string {
    const colors: Record<RecoveryStatus, string> = {
      'recoverable': 'text-success-600',
      'partial': 'text-warning-600',
      'not_recoverable': 'text-error-600',
    }
    return colors[status]
  }

  // Get status background class
  function getRecoveryStatusBgColor(status: RecoveryStatus): string {
    const colors: Record<RecoveryStatus, string> = {
      'recoverable': 'bg-success-50 border-success-200',
      'partial': 'bg-warning-50 border-warning-200',
      'not_recoverable': 'bg-error-50 border-error-200',
    }
    return colors[status]
  }

  // Get status label
  function getRecoveryStatusLabel(status: RecoveryStatus): string {
    const labels: Record<RecoveryStatus, string> = {
      'recoverable': 'Recoverable',
      'partial': 'Partially Recoverable',
      'not_recoverable': 'Not Recoverable',
    }
    return labels[status]
  }

  // Get status icon
  function getRecoveryStatusIcon(status: RecoveryStatus): string {
    const icons: Record<RecoveryStatus, string> = {
      'recoverable': 'heroicons:check-circle',
      'partial': 'heroicons:exclamation-circle',
      'not_recoverable': 'heroicons:x-circle',
    }
    return icons[status]
  }

  return {
    computeLineRecovery,
    getPolicyDetails,
    getRecoveryForLogicType,
    getRecoveryStatusColor,
    getRecoveryStatusBgColor,
    getRecoveryStatusLabel,
    getRecoveryStatusIcon,
  }
}
