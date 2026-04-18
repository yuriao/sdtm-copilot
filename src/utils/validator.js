const DOMAIN_RULES = {
  DM: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'SUBJID', 'RFSTDTC', 'SEX', 'RACE', 'COUNTRY'],
    recommended: ['AGE', 'AGEU', 'ETHNIC', 'ARM', 'ARMCD', 'ACTARM', 'DTHDTC', 'DTHFL'],
  },
  AE: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'AESEQ', 'AETERM', 'AESTDTC'],
    recommended: ['AESER', 'AESEV', 'AEREL', 'AEOUT', 'AEDTC', 'AETOXGR'],
  },
  LB: {
    required: ['STUDYID', 'DOMAIN', 'USUBJID', 'LBSEQ', 'LBTESTCD', 'LBTEST', 'LBORRES', 'LBDTC'],
    recommended: ['LBORRESU', 'LBSTRESC', 'LBSTRESN', 'LBSTRESU', 'LBNRIND', 'VISIT'],
  },
}

/**
 * Run rule-based validation on accepted mappings
 * @param {Array} mappings - array of mapping objects with status and sdtm_variable
 * @param {string} domain - 'DM' | 'AE' | 'LB'
 * @returns {Array} array of { severity: 'ERROR'|'WARNING', message: string }
 */
export function validateMappings(mappings, domain) {
  const results = []

  if (!domain || !DOMAIN_RULES[domain]) {
    results.push({ severity: 'WARNING', message: `Unknown or unsupported domain: "${domain}". Validation skipped.` })
    return results
  }

  const rules = DOMAIN_RULES[domain]

  // Get accepted mappings
  const accepted = mappings.filter(m => m.status === 'accepted' && m.sdtm_variable)
  const assignedVars = accepted.map(m => m.sdtm_variable.toUpperCase().trim())

  // Check required fields
  for (const req of rules.required) {
    if (!assignedVars.includes(req)) {
      results.push({ severity: 'ERROR', message: `Missing required ${domain} variable: ${req}` })
    }
  }

  // Check recommended fields
  for (const rec of rules.recommended) {
    if (!assignedVars.includes(rec)) {
      results.push({ severity: 'WARNING', message: `Missing recommended ${domain} variable: ${rec}` })
    }
  }

  // Check duplicate assignments
  const seen = {}
  for (const v of assignedVars) {
    if (!v) continue
    if (seen[v]) {
      results.push({ severity: 'ERROR', message: `Duplicate SDTM variable assignment: ${v}` })
    }
    seen[v] = true
  }

  // Domain-specific: LBTESTCD > 8 chars
  if (domain === 'LB') {
    const lbtestcdMapping = accepted.find(m => m.sdtm_variable?.toUpperCase() === 'LBTESTCD')
    if (lbtestcdMapping && lbtestcdMapping.source_column) {
      // Warn about potential length issue
      results.push({ severity: 'WARNING', message: `LBTESTCD values must be ≤ 8 characters. Verify source column "${lbtestcdMapping.source_column}" values comply.` })
    }
  }

  return results
}
