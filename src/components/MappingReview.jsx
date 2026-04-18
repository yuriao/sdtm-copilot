import React, { useState } from 'react'

const CONFIDENCE_COLORS = {
  high: { bg: '#d5f5e3', color: '#1e8449' },
  medium: { bg: '#fef9e7', color: '#b7950b' },
  low: { bg: '#fce8e6', color: '#c0392b' },
}

const COMMON_SDTM_VARS = [
  '', 'STUDYID', 'DOMAIN', 'USUBJID', 'SUBJID', 'RFSTDTC', 'SEX', 'RACE', 'COUNTRY',
  'AGE', 'AGEU', 'ETHNIC', 'ARM', 'ARMCD', 'ACTARM', 'DTHDTC', 'DTHFL',
  'AESEQ', 'AETERM', 'AESTDTC', 'AESER', 'AESEV', 'AEREL', 'AEOUT', 'AEDTC', 'AETOXGR',
  'LBSEQ', 'LBTESTCD', 'LBTEST', 'LBORRES', 'LBDTC', 'LBORRESU', 'LBSTRESC', 'LBSTRESN', 'LBSTRESU', 'LBNRIND',
  'VISIT', 'VISITNUM', 'EPOCH', 'DTC',
]

export default function MappingReview({ mappings, setMappings, llmResult, onNext, onBack }) {
  const [editingIdx, setEditingIdx] = useState(null)
  const [editValue, setEditValue] = useState('')

  const accept = (i) => {
    setMappings(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'accepted' } : m))
  }

  const reject = (i) => {
    setMappings(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'rejected' } : m))
  }

  const startEdit = (i) => {
    setEditingIdx(i)
    setEditValue(mappings[i].sdtm_variable || '')
  }

  const saveEdit = (i) => {
    setMappings(prev => prev.map((m, idx) =>
      idx === i ? { ...m, sdtm_variable: editValue.toUpperCase().trim(), status: 'accepted', user_edited: true } : m
    ))
    setEditingIdx(null)
    setEditValue('')
  }

  const acceptAll = () => {
    setMappings(prev => prev.map(m => ({ ...m, status: m.sdtm_variable ? 'accepted' : 'rejected' })))
  }

  const resetAll = () => {
    setMappings(prev => prev.map(m => ({ ...m, status: 'pending' })))
  }

  const accepted = mappings.filter(m => m.status === 'accepted').length
  const rejected = mappings.filter(m => m.status === 'rejected').length
  const pending = mappings.filter(m => m.status === 'pending').length

  const domain = llmResult?.domain || ''

  return (
    <div className="card">
      <h2>Step 5 — Review Mappings</h2>

      {/* LLM Summary Banner */}
      {llmResult && (
        <div className="summary-banner">
          <div className="domain-block">
            <div className="domain-label">Domain</div>
            <div className="domain-value">{domain}</div>
          </div>
          <div className="divider" />
          <div className="domain-block">
            <div className="domain-label">Confidence</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: llmResult.domain_confidence === 'high' ? '#a9dfbf' : llmResult.domain_confidence === 'medium' ? '#f9e79f' : '#f1948a' }}>
              {llmResult.domain_confidence}
            </div>
          </div>
          <div className="divider" />
          {llmResult.missing_required?.length > 0 && (
            <div className="info-block">
              <div className="info-label">Missing Required</div>
              <div className="missing-vars">
                {llmResult.missing_required.map(v => <span key={v} className="missing-var-tag">{v}</span>)}
              </div>
            </div>
          )}
          {llmResult.suggestions && (
            <div className="info-block" style={{ flex: 2 }}>
              <div className="info-label">Suggestions</div>
              <div className="info-text">{llmResult.suggestions}</div>
            </div>
          )}
        </div>
      )}

      {/* Stats + bulk actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.88rem', color: '#555' }}>
          <strong style={{ color: '#27ae60' }}>{accepted}</strong> accepted ·{' '}
          <strong style={{ color: '#e74c3c' }}>{rejected}</strong> rejected ·{' '}
          <strong style={{ color: '#b7950b' }}>{pending}</strong> pending
        </span>
        <button className="btn btn-secondary btn-sm" onClick={acceptAll}>✓ Accept All</button>
        <button className="btn btn-secondary btn-sm" onClick={resetAll}>↺ Reset All</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Source Column</th>
              <th>Type</th>
              <th>SDTM Variable</th>
              <th>Confidence</th>
              <th>Explanation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => {
              const rowClass = m.status === 'accepted' ? 'row-accepted' : m.status === 'rejected' ? 'row-rejected' : ''
              const conf = CONFIDENCE_COLORS[m.confidence] || CONFIDENCE_COLORS.low
              return (
                <tr key={i} className={rowClass}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.source_column}</td>
                  <td style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                    {/* Type shown from profile if available */}
                    —
                  </td>
                  <td>
                    {editingIdx === i ? (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <input
                          className="sdtm-input"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          list={`sdtm-vars-${i}`}
                          placeholder="e.g. USUBJID"
                          style={{ minWidth: 110 }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') setEditingIdx(null) }}
                          autoFocus
                        />
                        <datalist id={`sdtm-vars-${i}`}>
                          {COMMON_SDTM_VARS.filter(v => v).map(v => <option key={v} value={v} />)}
                        </datalist>
                        <button className="btn btn-success btn-sm" onClick={() => saveEdit(i)}>✓</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingIdx(null)}>✕</button>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: m.sdtm_variable ? '#1a3a5c' : '#95a5a6' }}>
                        {m.sdtm_variable || '—'}
                        {m.user_edited && <span title="User edited" style={{ marginLeft: 4, fontSize: '0.7rem', color: '#3498db' }}>✎</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: conf.bg, color: conf.color }}>
                      {m.confidence}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: '#555', maxWidth: 280 }}>
                    {m.explanation || '—'}
                    {m.ambiguity_note && (
                      <div style={{ color: '#e67e22', fontSize: '0.78rem', marginTop: 2 }}>⚠ {m.ambiguity_note}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {m.status !== 'accepted' && (
                        <button className="btn btn-success btn-sm" onClick={() => accept(i)}>✓</button>
                      )}
                      {m.status !== 'rejected' && (
                        <button className="btn btn-danger btn-sm" onClick={() => reject(i)}>✕</button>
                      )}
                      {m.status !== 'pending' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setMappings(prev => prev.map((mm, idx) => idx === i ? { ...mm, status: 'pending' } : mm))}>↺</button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(i)}>✎</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Validate →</button>
      </div>
    </div>
  )
}
