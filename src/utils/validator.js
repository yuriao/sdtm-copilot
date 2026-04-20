// ─── Controlled Terminology ───────────────────────────────────────────────────
const CT = {
  SEX: ['M', 'F', 'U', 'UNDIFFERENTIATED'],
  RACE: [
    'AMERICAN INDIAN OR ALASKA NATIVE',
    'ASIAN',
    'BLACK OR AFRICAN AMERICAN',
    'NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER',
    'WHITE',
    'MULTIPLE',
    'UNKNOWN',
    'NOT REPORTED',
  ],
  ETHNIC: ['HISPANIC OR LATINO', 'NOT HISPANIC OR LATINO', 'NOT REPORTED', 'UNKNOWN'],
  COUNTRY: null, // ISO 3166-1 alpha-3 — validated by length/pattern only
  NY: ['Y', 'N'],
  AESEV: ['MILD', 'MODERATE', 'SEVERE'],
  OUT: [
    'RECOVERED/RESOLVED',
    'RECOVERING/RESOLVING',
    'NOT RECOVERED/NOT RESOLVED',
    'RECOVERED/RESOLVED WITH SEQUELAE',
    'FATAL',
    'UNKNOWN',
  ],
  AGEU: ['YEARS', 'MONTHS', 'WEEKS', 'DAYS', 'HOURS'],
  ND: ['NOT DONE'],
}

// SDTM variable → codelist name
const VAR_CODELIST = {
  SEX: 'SEX',
  RACE: 'RACE',
  ETHNIC: 'ETHNIC',
  COUNTRY: 'COUNTRY',
  AESER: 'NY',
  AESEV: 'AESEV',
  AEOUT: 'OUT',
  AEREL: null,     // sponsor-defined
  AGEU: 'AGEU',
  LBSTAT: 'ND',
}

// SDTM date/datetime/time variables
const DATE_VARS = new Set([
  'RFSTDTC', 'RFENDTC', 'DTHDTC',
  'AESTDTC', 'AEENDTC',
  'LBDTC',
])

// SDTM numeric variables
const NUMERIC_VARS = new Set([
  'AGE', 'AESEQ', 'LBSEQ', 'LBSTRESN',
])

// SDTM required variables per domain
const DOMAIN_RULES = {
  DM: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'SUBJID', 'RFSTDTC', 'SEX', 'RACE', 'COUNTRY'],
    recommended: ['AGE', 'AGEU', 'ETHNIC', 'ARM', 'ARMCD', 'ACTARM', 'SITEID', 'DTHDTC', 'DTHFL'],
  },
  AE: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'AESEQ', 'AETERM', 'AESTDTC'],
    recommended: ['AESER', 'AESEV', 'AEREL', 'AEOUT', 'AEENDTC', 'AETOXGR', 'AEDECOD', 'AEBODSYS'],
  },
  LB: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'LBSEQ', 'LBTESTCD', 'LBTEST', 'LBORRES', 'LBDTC'],
    recommended: ['LBORRESU', 'LBSTRESC', 'LBSTRESN', 'LBSTRESU', 'LBNRIND', 'VISIT', 'LBSTAT'],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ISO 8601 partial date/datetime: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH:MM:SS
const ISO8601_RE = /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2}))?)?)?)?$/

function isISO8601(val) {
  if (!val || val.toString().trim() === '') return null // missing — separate check
  return ISO8601_RE.test(val.toString().trim())
}

function isNumeric(val) {
  if (val === null || val === undefined || val.toString().trim() === '') return null
  return !isNaN(Number(val.toString().trim()))
}

// Compare two ISO 8601 partials lexicographically (works for YYYY-MM-DD prefix)
function isoLe(a, b) {
  if (!a || !b) return true // can't compare — skip
  return a.toString().trim() <= b.toString().trim()
}

function summarise(badRows, total, fieldName) {
  if (badRows.length === 0) return null
  const pct = ((badRows.length / total) * 100).toFixed(1)
  const sample = badRows.slice(0, 3).join(', ')
  return `${badRows.length}/${total} rows (${pct}%) in "${fieldName}" — e.g. row(s): ${sample}`
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Full SDTM validation.
 * @param {Array}  mappings    - accepted/rejected mapping objects
 * @param {string} domain      - 'DM' | 'AE' | 'LB'
 * @param {Object} parsedData  - { rows: [{col: val, ...}], columns: [...] }
 * @returns {Array} [{severity, category, message, detail?}]
 */
export function validateMappings(mappings, domain, parsedData) {
  const results = []

  const push = (severity, category, message, detail) =>
    results.push({ severity, category, message, ...(detail ? { detail } : {}) })

  // ── 1. Domain check ────────────────────────────────────────────────────────
  if (!domain || !DOMAIN_RULES[domain]) {
    push('WARNING', 'Domain', `Unknown or unsupported domain: "${domain}". Validation skipped.`)
    return results
  }

  const rules = DOMAIN_RULES[domain]
  const accepted = mappings.filter(m => m.status === 'accepted' && m.sdtm_variable)

  // Build: sdtm_variable (upper) → source_column
  const sdtmToSource = {}
  accepted.forEach(m => {
    sdtmToSource[m.sdtm_variable.toUpperCase().trim()] = m.source_column
  })
  const assignedVars = Object.keys(sdtmToSource)

  // ── 2. Required variables ──────────────────────────────────────────────────
  for (const req of rules.required) {
    if (!assignedVars.includes(req)) {
      push('ERROR', 'Required Variables', `Missing required ${domain} variable: ${req}`)
    }
  }

  // ── 3. Recommended variables ───────────────────────────────────────────────
  for (const rec of rules.recommended) {
    if (!assignedVars.includes(rec)) {
      push('WARNING', 'Recommended Variables', `Missing recommended ${domain} variable: ${rec}`)
    }
  }

  // ── 4. Duplicate assignments ───────────────────────────────────────────────
  const seen = {}
  for (const v of assignedVars) {
    if (seen[v]) push('ERROR', 'Duplicate Mapping', `Duplicate SDTM variable assignment: ${v}`)
    seen[v] = true
  }

  // ── 5. DOMAIN value check (if DOMAIN column mapped) ───────────────────────
  if (assignedVars.includes('DOMAIN') && parsedData?.rows?.length) {
    const domainCol = sdtmToSource['DOMAIN']
    const badRows = []
    parsedData.rows.forEach((row, i) => {
      const val = (row[domainCol] || '').toString().trim().toUpperCase()
      if (val && val !== domain) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Domain Value',
        `DOMAIN column contains values other than "${domain}"`,
        summarise(badRows, parsedData.rows.length, domainCol))
    }
  }

  // If no row data, skip data-level checks
  if (!parsedData?.rows?.length) return results
  const rows = parsedData.rows
  const n = rows.length

  // ── 6. ISO 8601 date/datetime format ──────────────────────────────────────
  for (const sdtmVar of assignedVars) {
    if (!DATE_VARS.has(sdtmVar)) continue
    const srcCol = sdtmToSource[sdtmVar]
    const badRows = []
    rows.forEach((row, i) => {
      const val = row[srcCol]
      if (val === null || val === undefined || val.toString().trim() === '') return // missing handled separately
      if (!isISO8601(val)) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Date Format',
        `"${sdtmVar}" (source: "${srcCol}") contains non-ISO 8601 values`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 7. Numeric variables ───────────────────────────────────────────────────
  for (const sdtmVar of assignedVars) {
    if (!NUMERIC_VARS.has(sdtmVar)) continue
    const srcCol = sdtmToSource[sdtmVar]
    const badRows = []
    rows.forEach((row, i) => {
      const val = row[srcCol]
      if (val === null || val === undefined || val.toString().trim() === '') return
      if (!isNumeric(val)) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Data Type',
        `"${sdtmVar}" (source: "${srcCol}") contains non-numeric values`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 8. USUBJID missing / blank ────────────────────────────────────────────
  if (assignedVars.includes('USUBJID')) {
    const srcCol = sdtmToSource['USUBJID']
    const badRows = []
    rows.forEach((row, i) => {
      const val = row[srcCol]
      if (!val || val.toString().trim() === '') badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Identifier Integrity',
        `USUBJID is blank or missing in ${badRows.length} row(s)`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 9. STUDYID consistency (all rows same value) ──────────────────────────
  if (assignedVars.includes('STUDYID')) {
    const srcCol = sdtmToSource['STUDYID']
    const vals = new Set(rows.map(r => (r[srcCol] || '').toString().trim()).filter(Boolean))
    if (vals.size > 1) {
      push('ERROR', 'Identifier Integrity',
        `STUDYID has ${vals.size} distinct values — should be a single study: ${Array.from(vals).slice(0, 4).join(', ')}`)
    }
    if (vals.has('')) {
      push('ERROR', 'Identifier Integrity', `STUDYID is blank or missing in one or more rows`)
    }
  }

  // ── 10. Sequence number uniqueness (AESEQ / LBSEQ within USUBJID) ─────────
  for (const seqVar of ['AESEQ', 'LBSEQ']) {
    if (!assignedVars.includes(seqVar)) continue
    const seqCol = sdtmToSource[seqVar]
    const subjCol = sdtmToSource['USUBJID']
    const seenSeq = {}
    const dupRows = []
    rows.forEach((row, i) => {
      const subj = subjCol ? (row[subjCol] || '').toString().trim() : '__ALL__'
      const seq = (row[seqCol] || '').toString().trim()
      if (!seq) return
      const key = `${subj}::${seq}`
      if (seenSeq[key]) dupRows.push(i + 1)
      seenSeq[key] = true
    })
    if (dupRows.length > 0) {
      push('ERROR', 'Sequence Uniqueness',
        `${seqVar} is not unique within USUBJID — ${dupRows.length} duplicate(s)`,
        summarise(dupRows, n, seqCol))
    }
  }

  // ── 11. Controlled terminology checks ─────────────────────────────────────
  for (const [sdtmVar, clName] of Object.entries(VAR_CODELIST)) {
    if (!assignedVars.includes(sdtmVar)) continue
    if (!clName || !CT[clName]) continue
    const srcCol = sdtmToSource[sdtmVar]
    const allowed = CT[clName]
    const badRows = []
    rows.forEach((row, i) => {
      const val = (row[srcCol] || '').toString().trim().toUpperCase()
      if (!val) return // missing — separate check
      if (!allowed.includes(val)) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('WARNING', 'Controlled Terminology',
        `"${sdtmVar}" (source: "${srcCol}") contains values not in CDISC CT [${clName}]. Allowed: ${allowed.join(', ')}`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 12. COUNTRY: ISO 3166-1 alpha-3 (3 uppercase letters) ─────────────────
  if (assignedVars.includes('COUNTRY')) {
    const srcCol = sdtmToSource['COUNTRY']
    const badRows = []
    rows.forEach((row, i) => {
      const val = (row[srcCol] || '').toString().trim()
      if (!val) return
      if (!/^[A-Za-z]{3}$/.test(val)) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('WARNING', 'Controlled Terminology',
        `COUNTRY values should be ISO 3166-1 alpha-3 (3 letters, e.g. USA, GBR, CHN)`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 13. LBTESTCD length ≤ 8 ───────────────────────────────────────────────
  if (assignedVars.includes('LBTESTCD')) {
    const srcCol = sdtmToSource['LBTESTCD']
    const badRows = []
    rows.forEach((row, i) => {
      const val = (row[srcCol] || '').toString().trim()
      if (val.length > 8) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Variable Length',
        `LBTESTCD values must be ≤ 8 characters`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 14. Cross-field date consistency ──────────────────────────────────────
  const datePairs = [
    ['RFSTDTC', 'RFENDTC', 'Reference start must be ≤ reference end'],
    ['AESTDTC', 'AEENDTC', 'AE start date must be ≤ AE end date'],
  ]
  for (const [startVar, endVar, msg] of datePairs) {
    if (!assignedVars.includes(startVar) || !assignedVars.includes(endVar)) continue
    const startCol = sdtmToSource[startVar]
    const endCol = sdtmToSource[endVar]
    const badRows = []
    rows.forEach((row, i) => {
      const s = (row[startCol] || '').toString().trim()
      const e = (row[endCol] || '').toString().trim()
      if (!s || !e) return
      if (!isoLe(s, e)) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Date Consistency', msg,
        summarise(badRows, n, `${startCol} vs ${endCol}`))
    }
  }

  // ── 15. AGE range plausibility ────────────────────────────────────────────
  if (assignedVars.includes('AGE')) {
    const srcCol = sdtmToSource['AGE']
    const badRows = []
    rows.forEach((row, i) => {
      const val = parseFloat(row[srcCol])
      if (isNaN(val)) return
      if (val < 0 || val > 150) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('WARNING', 'Plausibility',
        `AGE values outside plausible range (0–150)`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 16. AESER must have AETERM ────────────────────────────────────────────
  if (assignedVars.includes('AESER') && assignedVars.includes('AETERM')) {
    const aerCol = sdtmToSource['AESER']
    const aetCol = sdtmToSource['AETERM']
    const badRows = []
    rows.forEach((row, i) => {
      const aeser = (row[aerCol] || '').toString().trim().toUpperCase()
      const aeterm = (row[aetCol] || '').toString().trim()
      if (aeser === 'Y' && !aeterm) badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Cross-Field Consistency',
        `AESER=Y but AETERM is blank in ${badRows.length} row(s)`,
        summarise(badRows, n, aetCol))
    }
  }

  // ── 17. Missing values in required variables ───────────────────────────────
  for (const reqVar of rules.required) {
    if (!assignedVars.includes(reqVar)) continue // already flagged as missing mapping
    const srcCol = sdtmToSource[reqVar]
    const badRows = []
    rows.forEach((row, i) => {
      const val = row[srcCol]
      if (val === null || val === undefined || val.toString().trim() === '') badRows.push(i + 1)
    })
    if (badRows.length > 0) {
      push('ERROR', 'Missing Values',
        `Required variable "${reqVar}" (source: "${srcCol}") has blank/null values`,
        summarise(badRows, n, srcCol))
    }
  }

  // ── 18. LBSTRESN / LBORRES numeric consistency ────────────────────────────
  if (assignedVars.includes('LBSTRESN') && assignedVars.includes('LBORRES')) {
    const stresn = sdtmToSource['LBSTRESN']
    const orres = sdtmToSource['LBORRES']
    const badRows = []
    rows.forEach((row, i) => {
      const sn = row[stresn]
      const or = (row[orres] || '').toString().trim()
      if (sn !== null && sn !== undefined && sn.toString().trim() !== '') {
        if (!isNumeric(sn)) badRows.push(i + 1)
      }
    })
    if (badRows.length > 0) {
      push('WARNING', 'Data Type',
        `LBSTRESN contains non-numeric values — should be standardized numeric result`,
        summarise(badRows, n, stresn))
    }
  }

  return results
}
