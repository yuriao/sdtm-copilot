/**
 * Convert array of objects to CSV string
 */
function toCSV(rows, columns) {
  const header = columns.join(',')
  const lines = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? ''
      const s = String(val).replace(/"/g, '""')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }).join(',')
  )
  return [header, ...lines].join('\n')
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export mapping as CSV
 */
export function exportMappingCSV(mappings, domain) {
  const accepted = mappings.filter(m => m.status === 'accepted')
  const rows = accepted.map(m => ({
    source_column: m.source_column,
    sdtm_variable: m.sdtm_variable || '',
    domain: domain || '',
    confidence: m.confidence,
    explanation: m.explanation || '',
    status: m.status,
  }))
  const csv = toCSV(rows, ['source_column', 'sdtm_variable', 'domain', 'confidence', 'explanation', 'status'])
  downloadFile(csv, `sdtm_mapping_${domain || 'unknown'}.csv`, 'text/csv')
}

/**
 * Export mapping as JSON config
 */
export function exportMappingJSON(mappings, domain, llmResult) {
  const config = {
    generated_at: new Date().toISOString(),
    domain: domain,
    domain_confidence: llmResult?.domain_confidence,
    mappings: mappings.map(m => ({
      source_column: m.source_column,
      sdtm_variable: m.sdtm_variable || null,
      confidence: m.confidence,
      status: m.status,
      explanation: m.explanation || '',
    })),
    suggestions: llmResult?.suggestions || '',
  }
  downloadFile(JSON.stringify(config, null, 2), `sdtm_config_${domain || 'unknown'}.json`, 'application/json')
}

/**
 * Export audit log as JSON
 */
export function exportAuditLog(mappings, profile, validationResults, llmResult) {
  const log = {
    generated_at: new Date().toISOString(),
    sdtm_copilot_version: '1.0.0',
    domain: llmResult?.domain,
    domain_reasoning: llmResult?.domain_reasoning,
    column_profile: profile?.map(p => ({
      column: p.column,
      type: p.type,
      null_rate_pct: p.nullRate,
      unique_count: p.uniqueCount,
      candidate_key: p.candidateKey,
    })),
    mapping_decisions: mappings.map(m => ({
      source_column: m.source_column,
      sdtm_variable: m.sdtm_variable || null,
      llm_confidence: m.confidence,
      llm_explanation: m.explanation || '',
      ambiguity_note: m.ambiguity_note || '',
      final_status: m.status,
      user_edited: m.user_edited || false,
    })),
    validation_results: validationResults || [],
  }
  downloadFile(JSON.stringify(log, null, 2), 'sdtm_audit_log.json', 'application/json')
}
