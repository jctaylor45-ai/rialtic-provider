import { createColumnHelper, type ColumnDef } from '@tanstack/vue-table'
import type { Claim, Policy } from '~/types'

/**
 * Table column helpers for consistent column definitions
 */

// Create column helpers for each data type
export const claimColumnHelper = createColumnHelper<Claim>()
export const policyColumnHelper = createColumnHelper<Policy>()

/**
 * Default column sizes
 */
export const columnSizes = {
  id: 140,
  name: 200,
  date: 120,
  status: 100,
  amount: 120,
  percentage: 100,
  actions: 80,
} as const

/**
 * Format helpers for cell rendering
 */
export const formatters = {
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  },

  percentage: (value: number): string => {
    return `${value.toFixed(1)}%`
  },

  date: (value: string): string => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  capitalize: (value: string): string => {
    if (!value) return ''
    return value.charAt(0).toUpperCase() + value.slice(1)
  },
}

/**
 * Create a text column with common settings
 */
export function createTextColumn<T>(
  id: keyof T & string,
  header: string,
  options?: {
    size?: number
    enableSorting?: boolean
    cell?: (value: T[keyof T]) => string
  }
): ColumnDef<T, any> {
  return {
    id,
    accessorKey: id,
    header,
    size: options?.size,
    enableSorting: options?.enableSorting ?? true,
    cell: options?.cell
      ? (info) => options.cell!(info.getValue())
      : (info) => info.getValue(),
  }
}

/**
 * Create a currency column
 */
export function createCurrencyColumn<T>(
  id: keyof T & string,
  header: string,
  options?: {
    size?: number
    enableSorting?: boolean
  }
): ColumnDef<T, any> {
  return {
    id,
    accessorKey: id,
    header,
    size: options?.size ?? columnSizes.amount,
    enableSorting: options?.enableSorting ?? true,
    cell: (info) => formatters.currency(info.getValue() as number),
  }
}

/**
 * Create a date column
 */
export function createDateColumn<T>(
  id: keyof T & string,
  header: string,
  options?: {
    size?: number
    enableSorting?: boolean
  }
): ColumnDef<T, any> {
  return {
    id,
    accessorKey: id,
    header,
    size: options?.size ?? columnSizes.date,
    enableSorting: options?.enableSorting ?? true,
    cell: (info) => formatters.date(info.getValue() as string),
  }
}

/**
 * Create a percentage column
 */
export function createPercentageColumn<T>(
  id: keyof T & string,
  header: string,
  options?: {
    size?: number
    enableSorting?: boolean
  }
): ColumnDef<T, any> {
  return {
    id,
    accessorKey: id,
    header,
    size: options?.size ?? columnSizes.percentage,
    enableSorting: options?.enableSorting ?? true,
    cell: (info) => formatters.percentage(info.getValue() as number),
  }
}
