import Papa, { type ParseResult } from 'papaparse'

export interface CsvParseOptions {
  header?: boolean
  skipEmptyLines?: boolean
  transformHeader?: (header: string) => string
  complete?: (results: ParseResult<unknown>) => void
  error?: (error: Error) => void
}

export interface CsvExportOptions {
  filename?: string
  header?: boolean
  columns?: string[]
  delimiter?: string
}

/**
 * CSV import/export composable
 * Uses PapaParse for parsing and generating CSV files
 */
export function useCsv() {
  /**
   * Parse CSV string to array of objects
   */
  const parseString = <T = Record<string, unknown>>(
    csvString: string,
    options: CsvParseOptions = {}
  ): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvString, {
        header: options.header ?? true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        transformHeader: options.transformHeader,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parse warnings:', results.errors)
          }
          options.complete?.(results as ParseResult<unknown>)
          resolve(results.data)
        },
        error: (error: Error) => {
          options.error?.(error)
          reject(error)
        },
      })
    })
  }

  /**
   * Parse CSV file to array of objects
   */
  const parseFile = <T = Record<string, unknown>>(
    file: File,
    options: CsvParseOptions = {}
  ): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<T>(file, {
        header: options.header ?? true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        transformHeader: options.transformHeader,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parse warnings:', results.errors)
          }
          options.complete?.(results as ParseResult<unknown>)
          resolve(results.data)
        },
        error: (error: Error) => {
          options.error?.(error)
          reject(error)
        },
      })
    })
  }

  /**
   * Convert array of objects to CSV string
   */
  const toString = <T extends Record<string, unknown>>(
    data: T[],
    options: CsvExportOptions = {}
  ): string => {
    return Papa.unparse(data, {
      header: options.header ?? true,
      columns: options.columns,
      delimiter: options.delimiter ?? ',',
    })
  }

  /**
   * Download data as CSV file
   */
  const download = <T extends Record<string, unknown>>(
    data: T[],
    options: CsvExportOptions = {}
  ): void => {
    const csvString = toString(data, options)
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    const filename = options.filename ?? `export-${new Date().toISOString().split('T')[0]}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Validate CSV structure against expected columns
   */
  const validateStructure = (
    data: Record<string, unknown>[],
    requiredColumns: string[]
  ): { valid: boolean; missingColumns: string[] } => {
    if (data.length === 0) {
      return { valid: false, missingColumns: requiredColumns }
    }

    const firstRow = data[0]
    if (!firstRow) {
      return { valid: false, missingColumns: requiredColumns }
    }
    const actualColumns = Object.keys(firstRow)
    const missingColumns = requiredColumns.filter(
      col => !actualColumns.includes(col)
    )

    return {
      valid: missingColumns.length === 0,
      missingColumns,
    }
  }

  /**
   * Transform CSV data with custom mapping
   */
  const transform = <TInput extends Record<string, unknown>, TOutput>(
    data: TInput[],
    transformer: (row: TInput, index: number) => TOutput
  ): TOutput[] => {
    return data.map((row, index) => transformer(row, index))
  }

  return {
    parseString,
    parseFile,
    toString,
    download,
    validateStructure,
    transform,
  }
}
