import React, { useEffect } from 'react'
import { validateMappings } from '../utils/validator'

export default function Validator({ mappings, llmResult, validationResults, setValidationResults, onNext, onBack }) {
  const domain = llmResult?.domain

  useEffect(() => {
    if (!validationResults) {
      const results = validateMappings(mappings, domain)
      setValidationResults(results)
    }
  }, [])

  const revalidate = () => {
    const results = validateMappings(mappings, domain)
    setValidationResults(results)
  }

  const errors = validationResults?.filter(r => r.severity === 'ERROR') || []
  const warnings = validationResults?.filter(r => r.severity === 'WARNING') || []

  return (
    <div className="card">
      <h2>Step 6 — Validation</h2>
      <p style={{ color: '#555', marginBottom: 16, fontSize: '0.93rem' }}>
        Rule-based checks against CDISC SDTM {domain} domain requirements.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 20px', borderRadius: 6, background: errors.length === 0 ? '#d5f5e3' : '#fce8e6', border: `1px solid ${errors.length === 0 ? '#a9dfbf' : '#f1948a'}` }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: errors.length === 0 ? '#1e8449' : '#e74c3c' }}>{errors.length}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: errors.length === 0 ? '#1e8449' : '#e74c3c', textTransform: 'uppercase' }}>Errors</div>
        </div>
        <div style={{ padding: '12px 20px', borderRadius: 6, background: warnings.length === 0 ? '#d5f5e3' : '#fef9e7', border: `1px solid ${warnings.length === 0 ? '#a9dfbf' : '#f9e79f'}` }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: warnings.length === 0 ? '#1e8449' : '#f39c12' }}>{warnings.length}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: warnings.length === 0 ? '#1e8449' : '#f39c12', textTransform: 'uppercase' }}>Warnings</div>
        </div>
        {errors.length === 0 && warnings.length === 0 && (
          <div style={{ padding: '12px 20px', borderRadius: 6, background: '#d5f5e3', border: '1px solid #a9dfbf', color: '#1e8449', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
            ✅ All checks passed!
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#e74c3c', fontSize: '0.95rem', marginBottom: 8 }}>Errors</h3>
          {errors.map((e, i) => (
            <div key={i} className="validation-item validation-error">
              <strong>ERROR:</strong> {e.message}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#e67e22', fontSize: '0.95rem', marginBottom: 8 }}>Warnings</h3>
          {warnings.map((w, i) => (
            <div key={i} className="validation-item validation-warning">
              <strong>WARNING:</strong> {w.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: 18 }}>
        Based on {mappings.filter(m => m.status === 'accepted').length} accepted mappings for {domain} domain.
        {' '}<button onClick={revalidate} style={{ color: '#1a3a5c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>Re-run checks</button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Export →</button>
      </div>
    </div>
  )
}
