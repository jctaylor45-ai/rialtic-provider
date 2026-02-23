/**
 * Unit tests for formatting utilities
 * Aligned with console-ui testing patterns
 */
import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, formatPercentage } from './formatting'

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBe('Jan 15, 2024')
  })

  it('returns empty string for null input', () => {
    const result = formatDate(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', () => {
    const result = formatDate(undefined)
    expect(result).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats positive number with default precision', () => {
    const result = formatCurrency(1234.56)
    expect(result).toBe('$1,234.56')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toBe('$0.00')
  })

  it('returns placeholder for null input', () => {
    const result = formatCurrency(null as unknown as number)
    expect(result).toBe('$0.00')
  })
})

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    const result = formatPercentage(0.25)
    expect(result).toBe('0.0%')
  })

  it('formats whole number percentage', () => {
    const result = formatPercentage(25)
    expect(result).toBe('25.0%')
  })

  it('formats percentage with decimals', () => {
    const result = formatPercentage(7.37)
    expect(result).toBe('7.4%')
  })

  it('handles zero', () => {
    const result = formatPercentage(0)
    expect(result).toBe('0.0%')
  })
})
