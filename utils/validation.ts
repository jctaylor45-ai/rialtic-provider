import * as v from 'valibot'

/**
 * Common validation schemas using Valibot
 * Aligned with console-ui validation patterns
 */

// String validators
export const requiredString = v.pipe(
  v.string(),
  v.nonEmpty('This field is required')
)

export const email = v.pipe(
  v.string(),
  v.nonEmpty('Email is required'),
  v.email('Please enter a valid email address')
)

export const phone = v.pipe(
  v.string(),
  v.regex(/^\+?[\d\s\-().]+$/, 'Please enter a valid phone number')
)

export const url = v.pipe(
  v.string(),
  v.url('Please enter a valid URL')
)

// Number validators
export const positiveNumber = v.pipe(
  v.number(),
  v.minValue(0, 'Value must be positive')
)

export const percentage = v.pipe(
  v.number(),
  v.minValue(0, 'Percentage must be at least 0'),
  v.maxValue(100, 'Percentage cannot exceed 100')
)

export const currency = v.pipe(
  v.number(),
  v.minValue(0, 'Amount must be positive')
)

// Date validators
export const pastDate = v.pipe(
  v.string(),
  v.custom((value) => {
    const date = new Date(value as string)
    return date <= new Date()
  }, 'Date must be in the past')
)

export const futureDate = v.pipe(
  v.string(),
  v.custom((value) => {
    const date = new Date(value as string)
    return date >= new Date()
  }, 'Date must be in the future')
)

// Healthcare-specific validators
export const npi = v.pipe(
  v.string(),
  v.length(10, 'NPI must be exactly 10 digits'),
  v.regex(/^\d{10}$/, 'NPI must contain only digits')
)

export const claimId = v.pipe(
  v.string(),
  v.regex(/^CLM-\d{4}-\d+$/, 'Invalid claim ID format')
)

export const procedureCode = v.pipe(
  v.string(),
  v.regex(/^[A-Z0-9]{5}$/, 'Invalid procedure code format')
)

export const diagnosisCode = v.pipe(
  v.string(),
  v.regex(/^[A-Z]\d{2}(\.\d{1,4})?$/, 'Invalid ICD-10 code format')
)

/**
 * Create a validation schema for forms
 */
export function createFormSchema<T extends v.ObjectEntries>(entries: T) {
  return v.object(entries)
}

/**
 * Validate a value against a schema
 */
export function validate<T>(schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>, value: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = v.safeParse(schema, value)
  if (result.success) {
    return { success: true, data: result.output }
  }
  return {
    success: false,
    errors: result.issues.map(issue => issue.message),
  }
}

/**
 * Get first error message from validation result
 */
export function getFirstError(issues: v.BaseIssue<unknown>[]): string {
  return issues[0]?.message ?? 'Validation failed'
}

/**
 * Convert Valibot schema to VeeValidate compatible validator
 */
export function toFieldValidator<T>(schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>) {
  return (value: unknown) => {
    const result = v.safeParse(schema, value)
    if (result.success) {
      return true
    }
    return result.issues[0]?.message ?? 'Invalid value'
  }
}
