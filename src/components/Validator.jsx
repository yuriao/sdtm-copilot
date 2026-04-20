import React, { useEffect, useState } from 'react'
import { validateMappings } from '../utils/validator'

const CATEGORY_ORDER = [
  'Required Variables',
  'Duplicate Mapping',
  'Domain Value',
  'Identifier Integrity',
  'Sequence Uniqueness',
  'Missing Values',
  'Date Format',
  'Date Consistency',
  'Data Type',
  'Variable Length',
  'Controlled Terminology',
  'Cross-Field Consistency',
  'Plausibility',
  'Recommended Variables',
]

const SEV_COLOR = {
  ERROR:   { bg: '#fce8e6', border: '#f1948a', text: '#922b21', badge: '#e74c3c' },
  WARNING: { bg: '#fef9e7', border: '#f9e79f', text: '#7d6608', badge: '#f39c12' },
  INFO:    { bg: '#eaf4fb', border: '#aed6f1', text: '#1a5276', badge: '#2980b9' },
}

export default function Validator({ mappings, llmResult, validationResults, setValidationResults, parsedData, onNext, onBack }) {
  const domain = llmResult?.domain
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!validationResults) {
      const results = validateMappings(mappings, domain, parsedData)
      setValidationResults(results)
    }
  }, [])

  const revalidate = () => {
    const results = validateMappings(mappings, domain, parsedData)
    setValidationResults(results)
    setExpanded({})
  }

  const results = validationResults || []
  const errors   = results.filter(r => r.severity === 'ERROR')
  const warnings = results.filter(r => r.severity === 'WARNING')

  // Group by category
  const byCategory = {}
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  })

  const orderedCategories = [
    ...CATEGORY_ORDER.filter(c => byCategory[c]),
    ...Object.keys(byCategory).filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  const toggleCategory = (cat) =>
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))

  const rowCount = parsedData?.rows?.length || 0
  const acceptedCount = mappings.filter(m => m.status === 'accepted').length

  return (
    <div className="card">
      <h2>Step 6 — Validation</h2>
      <p style={{ color: '#555', marginBottom: 16, fontSize: '0.93rem' }}>
        Full SDTM rule-based validation across {acceptedCount} accepted mappings
        {rowCount > 0 ? ` and ${rowCount} data rows` : ''} for the <strong>{domain}</strong> domain.
      </p>

      {/* Score bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: errors.length === 0 ? '#d5f5e3' : '#fce8e6',
          border: `1.5px solid ${errors.length === 0 ? '#a9dfbf' : '#f1948a'}`,
          minWidth: 90, textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: errors.length === 0 ? '#1e8449' : '#e74c3c', lineHeight: 1 }}>{errors.length}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: errors.length === 0 ? '#1e8449' : '#e74c3c', textTransform: 'uppercase', marginTop: 4 }}>Errors</div>
        </div>
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: warnings.length === 0 ? '#d5f5e3' : '#fef9e7',
          border: `1.5px solid ${warnings.length === 0 ? '#a9dfbf' : '#f9e79f'}`,
          minWidth: 90, textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: warnings.length === 0 ? '#1e8449' : '#f39c12', lineHeight: 1 }}>{warnings.length}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: warnings.length === 0 ? '#1e8449' : '#e67e22', textTransform: 'uppercase', marginTop: 4 }}>Warnings</div>
        </div>
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: '#f0f4f8', border: '1.5px solid #c8d6e5',
          minWidth: 90, textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1a3a5c', lineHeight: 1 }}>{orderedCategories.length}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7f8c8d', textTransform: 'uppercase', marginTop: 4 }}>Categories</div>
        </div>
        {errors.length === 0 && (
          <div style={{
            padding: '12px 20px', borderRadius: 8, background: '#d5f5e3',
            border: '1.5px solid #a9dfbf', color: '#1e8449',
            fontWeight: 700, fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ✅ {warnings.length === 0 ? 'All checks passed!' : 'No errors — review-ready'}
          </div>
        )}
      </div>

      {/* Validation checks legend */}
      <div style={{ marginBottom: 16, fontSize: '0.8rem', color: '#7f8c8d', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Checks performed:</span>
        {rowCount > 0 ? (
          <>
            <span>✓ Required/recommended variables</span>
            <span>✓ ISO 8601 dates</span>
            <span>✓ Controlled terminology (CT)</span>
            <span>✓ Sequence uniqueness</span>
            <span>✓ Cross-field consistency</span>
            <span>✓ Missing values in required fields</span>
            <span>✓ Data types</span>
            <span>✓ Plausibility</span>
          </>
        ) : (
          <span>✓ Mapping-level checks (upload data for full row-level validation)</span>
        )}
      </div>

      {/* Grouped results */}
      {orderedCategories.length === 0 ? (
        <div style={{ padding: 20, background: '#d5f5e3', borderRadius: 8, color: '#1e8449', fontWeight: 600, marginBottom: 16 }}>
          ✅ No issues found. All validation checks passed.
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {orderedCategories.map(cat => {
            const catItems = byCategory[cat]
            const hasError = catItems.some(r => r.severity === 'ERROR')
            const sev = hasError ? 'ERROR' : 'WARNING'
            const colors = SEV_COLOR[sev]
            const isOpen = expanded[cat] !== false // default open

            return (
              <div key={cat} style={{
                marginBottom: 8,
                border: `1.5px solid ${colors.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {/* Category header */}
                <div
                  onClick={() => toggleCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: colors.bg,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: colors.badge, color: '#fff',
                      borderRadius: 10, padding: '1px 8px',
                      fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                    }}>{sev}</span>
                    <span style={{ fontWeight: 700, color: colors.text, fontSize: '0.92rem' }}>{cat}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: colors.text, fontWeight: 600 }}>
                      {catItems.length} issue{catItems.length > 1 ? 's' : ''}
                    </span>
                    <span style={{ color: colors.text, fontSize: '0.85rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Category items */}
                {isOpen && (
                  <div style={{ padding: '8px 14px 12px', background: '#fff' }}>
                    {catItems.map((item, idx) => (
                      <div key={idx} style={{
                        marginTop: 8,
                        paddingLeft: 10,
                        borderLeft: `3px solid ${SEV_COLOR[item.severity].badge}`,
                      }}>
                        <div style={{ fontSize: '0.88rem', color: '#2c3e50', fontWeight: 500 }}>
                          {item.message}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: '0.78rem', color: '#7f8c8d', marginTop: 3 }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Guidance */}
      {errors.length > 0 && (
        <div style={{
          padding: 14, marginBottom: 16,
          background: '#fef5e7', border: '1px solid #f9e79f',
          borderRadius: 6, fontSize: '0.85rem', color: '#7d6608',
        }}>
          <strong>⚠️ Review-ready requires 0 errors.</strong> Go back to the Review step to fix mappings,
          or accept that this is a partial/draft mapping for documentation only.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Export →</button>
        <button
          onClick={revalidate}
          style={{ color: '#1a3a5c', background: 'none', border: '1px solid #1a3a5c', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          🔄 Re-run Validation
        </button>
        <span style={{ fontSize: '0.82rem', color: '#95a5a6' }}>
          {acceptedCount} accepted mappings · {rowCount} data rows
        </span>
      </div>
    </div>
  )
}
