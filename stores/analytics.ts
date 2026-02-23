import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePatternsStore } from './patterns'
import { useEventsStore } from './events'
import type { PracticeROI, ProcedureCodeIntelligence } from '~/types/enhancements'
import { calculatePracticeROI } from '~/utils/analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const codeIntelligence = ref(new Map<string, ProcedureCodeIntelligence>())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const practiceROI = computed((): PracticeROI => {
    const patternsStore = usePatternsStore()
    const eventsStore = useEventsStore()

    return calculatePracticeROI(patternsStore.patterns, eventsStore.events)
  })

  const totalSavings = computed(() => practiceROI.value.estimatedSavings)
  const totalPracticeSessions = computed(() => practiceROI.value.totalPracticeSessions)
  const totalTimeInvested = computed(() => practiceROI.value.totalTimeInvested)

  const savingsPerHour = computed(() => {
    const hours = totalTimeInvested.value / 60
    return hours > 0 ? Math.round(totalSavings.value / hours) : 0
  })

  const availableCodes = computed(() => Array.from(codeIntelligence.value.keys()))

  // Actions
  function getCodeIntelligence(code: string): ProcedureCodeIntelligence | undefined {
    return codeIntelligence.value.get(code)
  }

  async function loadCodeIntelligence() {
    isLoading.value = true
    error.value = null
    try {
      const data = await $fetch<{ codeIntelligence: ProcedureCodeIntelligence[] }>('/data/codeIntelligence.json')

      codeIntelligence.value.clear()
      data.codeIntelligence.forEach(intel => {
        codeIntelligence.value.set(intel.code, intel)
      })
    } catch (err) {
      console.error('Failed to load code intelligence:', err)
      error.value = 'Failed to load code intelligence data'
    } finally {
      isLoading.value = false
    }
  }

  async function initialize() {
    await loadCodeIntelligence()
  }

  function calculatePatternROI(patternId: string) {
    const patternsStore = usePatternsStore()
    const pattern = patternsStore.getPatternById(patternId)

    if (!pattern) return 0

    const resolutionRate = pattern.learningProgress / 100
    const potentialSavings = pattern.score.frequency * pattern.avgDenialAmount
    return Math.round(potentialSavings * resolutionRate)
  }

  function getPatternImprovement(patternId: string): number {
    const patternsStore = usePatternsStore()
    const pattern = patternsStore.getPatternById(patternId)

    if (!pattern || pattern.improvements.length === 0) return 0

    const latestImprovement = pattern.improvements[pattern.improvements.length - 1]
    return latestImprovement ? Math.abs(latestImprovement.percentChange) : 0
  }

  return {
    // State
    codeIntelligence,
    isLoading,
    error,
    // Getters
    practiceROI,
    totalSavings,
    totalPracticeSessions,
    totalTimeInvested,
    savingsPerHour,
    availableCodes,
    // Actions
    getCodeIntelligence,
    loadCodeIntelligence,
    initialize,
    calculatePatternROI,
    getPatternImprovement,
  }
})
