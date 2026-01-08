import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns'

export interface DatePreset {
  label: string
  value: string
  range: [Date, Date]
}

/**
 * Date preset composable for common date ranges
 * Aligned with console-ui datePresets patterns
 */
export function useDatePresets() {
  const today = new Date()

  const presets: DatePreset[] = [
    {
      label: 'Today',
      value: 'today',
      range: [today, today],
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      range: [subDays(today, 1), subDays(today, 1)],
    },
    {
      label: 'Last 7 days',
      value: 'last7days',
      range: [subDays(today, 6), today],
    },
    {
      label: 'Last 14 days',
      value: 'last14days',
      range: [subDays(today, 13), today],
    },
    {
      label: 'Last 30 days',
      value: 'last30days',
      range: [subDays(today, 29), today],
    },
    {
      label: 'Last 90 days',
      value: 'last90days',
      range: [subDays(today, 89), today],
    },
    {
      label: 'This week',
      value: 'thisWeek',
      range: [startOfWeek(today), endOfWeek(today)],
    },
    {
      label: 'Last week',
      value: 'lastWeek',
      range: [startOfWeek(subDays(today, 7)), endOfWeek(subDays(today, 7))],
    },
    {
      label: 'This month',
      value: 'thisMonth',
      range: [startOfMonth(today), endOfMonth(today)],
    },
    {
      label: 'Last month',
      value: 'lastMonth',
      range: [startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1))],
    },
    {
      label: 'This quarter',
      value: 'thisQuarter',
      range: [startOfQuarter(today), endOfQuarter(today)],
    },
    {
      label: 'Last quarter',
      value: 'lastQuarter',
      range: [startOfQuarter(subQuarters(today, 1)), endOfQuarter(subQuarters(today, 1))],
    },
    {
      label: 'This year',
      value: 'thisYear',
      range: [startOfYear(today), endOfYear(today)],
    },
    {
      label: 'Last year',
      value: 'lastYear',
      range: [startOfYear(subYears(today, 1)), endOfYear(subYears(today, 1))],
    },
  ]

  const getPresetByValue = (value: string): DatePreset | undefined => {
    return presets.find(p => p.value === value)
  }

  const getDateRange = (value: string): [Date, Date] | undefined => {
    const preset = getPresetByValue(value)
    return preset?.range
  }

  return {
    presets,
    getPresetByValue,
    getDateRange,
  }
}
