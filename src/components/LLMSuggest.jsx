import React, { useState } from 'react'
import { getLLMSuggestions } from '../utils/llmClient'

export default function LLMSuggest({ apiKey, profile, parsedData, llmResult, setLlmResult, setMappings, onNext, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSuggest = async () => {
    if (!apiKey) {
      setError('No API key set. Please go back to Step 1.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await getLLMSuggestions(apiKey, profile, parsedData.fileName)
      setLlmResult(result)

      // Initialize mappings with LLM suggestions, status = 'pending'
      const mappingsInit = (result.mappings || []).map(m => ({
        ...m,
        status: 'pending',
        user_edited: false,
      }))
      setMappings(mappingsInit)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const confidenceColor = {
    high: '#27ae60',
    medium: '#f39c12',
    low: '#e74c3c',
  }

  return (
    <div className="card">
      <h2>Step 4 — LLM Mapping Suggestions</h2>
      <p style={{ color: '#555', marginBottom: 18, fontSize: '0.93rem' }}>
        Kimi will analyze your column schema and suggest SDTM variable mappings for DM, AE, or LB domains.
      </p>

      {/* If we already have a result, show a skip banner */}
      {llmResult && (
        <div style={{
          background: '#eafaf1',
          border: '1px solid #a9dfbf',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <span style={{ fontSize: '0.9rem', color: '#1e8449' }}>
            ✓ AI evaluation already complete — domain <strong>{llmResult.domain}</strong>, {llmResult.mappings?.length} mappings cached.
          </span>
          <button className="btn btn-primary" onClick={onNext}>
            Skip to Review →
          </button>
        </div>
      )}

      {!llmResult && (
        <button className="btn btn-primary" onClick={handleSuggest} disabled={loading}>
          {loading && <span className="loading-spinner" />}
          {loading ? 'Calling Kimi…' : '🤖 Get AI Suggestions'}
        </button>
      )}

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {llmResult && (
        <>
          <div style={{
            background: '#f0f4f8',
            border: '1px solid #c8d6e5',
            borderRadius: 6,
            padding: 16,
            marginTop: 8,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Domain</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3a5c' }}>{llmResult.domain}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Confidence</div>
                <div style={{ fontWeight: 700, color: confidenceColor[llmResult.domain_confidence] || '#555' }}>
                  {llmResult.domain_confidence}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Reasoning</div>
                <div style={{ fontSize: '0.88rem', color: '#444' }}>{llmResult.domain_reasoning}</div>
              </div>
            </div>
            {llmResult.missing_required?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Missing Required</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {llmResult.missing_required.map(v => (
                    <span key={v} style={{ background: '#fce8e6', color: '#922b21', padding: '2px 8px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700 }}>{v}</span>
                  ))}
                </div>
              </div>
            )}
            {llmResult.suggestions && (
              <div style={{ marginTop: 12, fontSize: '0.87rem', color: '#444', borderTop: '1px solid #dce5ee', paddingTop: 10 }}>
                <strong>Suggestions:</strong> {llmResult.suggestions}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 10, color: '#555', fontSize: '0.88rem' }}>
            {llmResult.mappings?.length} column mappings generated. Proceed to review and adjust them.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleSuggest} disabled={loading}>
              {loading && <span className="loading-spinner" />}
              🔄 Re-run
            </button>
            <button className="btn btn-primary" onClick={onNext}>Review Mappings →</button>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}
