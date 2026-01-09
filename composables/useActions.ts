/**
 * Composable for recording and tracking pattern actions
 */

import { formatRelative } from 'date-fns'
import type { ActionType, Pattern } from '~/types/enhancements'

export const useActions = () => {
  const patternsStore = usePatternsStore()
  const { track } = useTracking()

  /**
   * Record an action taken on a pattern
   */
  const recordAction = async (
    patternId: string,
    actionType: ActionType,
    notes?: string
  ) => {
    // Get pattern for metadata
    const pattern = patternsStore.getPatternById(patternId)

    // Record in patterns store
    patternsStore.recordAction(patternId, actionType, notes)

    // Track event with pattern metadata
    track('action-recorded', {
      patternId,
      actionType,
      actionNotes: notes,
      actionCategory: pattern?.actionCategory,
      patternCategory: pattern?.category,
    })
  }

  /**
   * Get action type label for display
   */
  const getActionTypeLabel = (actionType: ActionType): string => {
    const labels: Record<ActionType, string> = {
      'resubmission': 'Updated claims for resubmission',
      'workflow-update': 'Created/updated SOP or workflow',
      'staff-training': 'Conducted staff training',
      'system-config': 'Updated system configuration',
      'practice-change': 'Changed clinical/billing practice',
      'other': 'Other action',
    }
    return labels[actionType] || actionType
  }

  /**
   * Get action type icon
   */
  const getActionTypeIcon = (actionType: ActionType): string => {
    const icons: Record<ActionType, string> = {
      'resubmission': 'heroicons:document-duplicate',
      'workflow-update': 'heroicons:document-text',
      'staff-training': 'heroicons:academic-cap',
      'system-config': 'heroicons:cog',
      'practice-change': 'heroicons:light-bulb',
      'other': 'heroicons:ellipsis-horizontal-circle',
    }
    return icons[actionType] || 'heroicons:check-circle'
  }

  /**
   * Format action for display
   */
  const formatAction = (action: import('~/types/enhancements').PatternAction) => {
    return {
      ...action,
      typeLabel: getActionTypeLabel(action.actionType),
      icon: getActionTypeIcon(action.actionType),
      formattedDate: new Date(action.timestamp).toLocaleDateString(),
      relativeTime: formatRelative(new Date(action.timestamp), new Date()),
    }
  }

  return {
    recordAction,
    getActionTypeLabel,
    getActionTypeIcon,
    formatAction,
  }
}
