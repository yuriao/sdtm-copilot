/**
 * Infer column type from sampled values
 */
function inferType(values) {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return 'string'

  const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/
  const numPattern = /^-?\d+(\.\d+)?$/

  let numCount = 0, dateCount = 0, boolCount = 0
  for (const v of nonNull) {
    const s = String(v).trim()
    if (numPattern.test(s)) numCount++
    else if (datePattern.test(s)) dateCount++
    else if (['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'].includes(s.toLowerCase())) boolCount++
  }

  const n = nonNull.length
  if (dateCount / n > 0.6) return 'date'
  if (numCount / n > 0.8) return 'number'
  if (boolCount / n > 0.8) return 'boolean'
  return 'string'
}

/**
 * Check if a column could be a candidate key (all values unique and non-null)
 */
function isCandidateKey(values) {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return false
  const unique = new Set(nonNull.map(v => String(v)))
  return unique.size === nonNull.length && nonNull.length === values.length
}

/**
 * Profile all columns in a parsed dataset
 * Returns array of { column, type, nullRate, uniqueCount, sampleValues, candidateKey }
 */
export function profileDataset(parsedData) {
  const { columns, rows } = parsedData
  return columns.map(col => {
    const values = rows.map(r => r[col])
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '')
    const nullRate = values.length > 0 ? ((values.length - nonNull.length) / values.length) : 0
    const unique = new Set(values.map(v => String(v)))
    const sample = nonNull.slice(0, 5).map(v => String(v))
    return {
      column: col,
      type: inferType(values),
      nullRate: Math.round(nullRate * 100),
      uniqueCount: unique.size,
      totalCount: values.length,
      sampleValues: sample,
      candidateKey: isCandidateKey(values),
    }
  })
}
