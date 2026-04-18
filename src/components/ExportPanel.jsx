import React from 'react'
import { exportMappingCSV, exportMappingJSON, exportAuditLog } from '../utils/exporter'

export default function ExportPanel({ mappings, llmResult, profile, parsedData, validationResults, onBack }) {
  const domain = llmResult?.domain || 'unknown'
  const accepted = mappings.filter(m => m.status === 'accepted').length
  const rejected = mappings.filter(m => m.status === 'rejected').length
  const errors = validationResults?.filter(r => r.severity === 'ERROR').length || 0
  const warnings = validationResults?.filter(r => r.severity === 'WARNING').length || 0

  return (
    <div className="card">
      <h2>Step 7 — Export</h2>
      <p style={{ color: '#555', marginBottom: 20, fontSize: '0.93rem' }}>
        Download your mapping artifacts for use in ETL pipelines, documentation, or audit trails.
      </p>

      {/* Summary */}
      <div style={{ background: '#f0f4f8', borderRadius: 7, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.9rem' }}>
          <div><strong>File:</strong> {parsedData?.fileName || '—'}</div>
          <div><strong>Domain:</strong> {domain}</div>
          <div><strong>Accepted Mappings:</strong> <span style={{ color: '#27ae60', fontWeight: 700 }}>{accepted}</span></div>
          <div><strong>Rejected:</strong> <span style={{ color: '#e74c3c', fontWeight: 700 }}>{rejected}</span></div>
          <div><strong>Errors:</strong> <span style={{ color: errors > 0 ? '#e74c3c' : '#27ae60', fontWeight: 700 }}>{errors}</span></div>
          <div><strong>Warnings:</strong> <span style={{ color: warnings > 0 ? '#f39c12' : '#27ae60', fontWeight: 700 }}>{warnings}</span></div>
        </div>
      </div>

      <div className="export-btns">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <button
            className="btn btn-primary"
            onClick={() => exportMappingCSV(mappings, domain)}
          >
            📥 Download Mapping CSV
          </button>
          <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>
            Accepted mappings: source → SDTM variable with confidence scores
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportMappingJSON(mappings, domain, llmResult)}
          >
            📋 Download JSON Config
          </button>
          <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>
            Machine-readable mapping config for ETL and validation scripts
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportAuditLog(mappings, profile, validationResults, llmResult)}
          >
            📝 Download Audit Log
          </button>
          <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>
            Full audit trail: profiling, LLM reasoning, user decisions, validation
          </div>
        </div>
      </div>

      {accepted === 0 && (
        <div className="warning-msg" style={{ marginTop: 16 }}>
          No accepted mappings to export. Go back to Review step to accept some mappings.
        </div>
      )}

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #eef1f5' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <span style={{ marginLeft: 16, fontSize: '0.85rem', color: '#95a5a6' }}>
          Restart: refresh the page to begin a new mapping session.
        </span>
      </div>

      <div style={{ marginTop: 20, padding: 14, background: '#f0f4f8', borderRadius: 6, fontSize: '0.82rem', color: '#555' }}>
        <strong>Next steps:</strong> Use the JSON config with CDISC tools like{' '}
        <a href="https://www.cdisc.org/tools" target="_blank" rel="noreferrer" style={{ color: '#1a3a5c' }}>CDISC conformance checkers</a>{' '}
        or import into your SAS/Python ETL pipeline. The audit log supports regulatory compliance documentation.
      </div>
    </div>
  )
}
