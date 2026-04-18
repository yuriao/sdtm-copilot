import React, { useState } from 'react'

export default function ApiKeySetup({ apiKey, setApiKey, onNext }) {
  const [input, setInput] = useState(apiKey)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const handleSave = () => {
    const trimmed = input.trim()
    if (!trimmed.startsWith('sk-')) {
      setError('API key must start with "sk-"')
      return
    }
    localStorage.setItem('sdtm_kimi_key', trimmed)
    setApiKey(trimmed)
    setError('')
    onNext()
  }

  const handleClear = () => {
    localStorage.removeItem('sdtm_kimi_key')
    setApiKey('')
    setInput('')
  }

  return (
    <div className="card">
      <h2>Step 1 — Kimi API Key</h2>
      <p style={{ color: '#555', marginBottom: 18, fontSize: '0.93rem' }}>
        Your API key is stored only in your browser's localStorage and sent directly to Kimi (Moonshot AI). It never touches any other server.
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#1a3a5c' }}>
          Kimi (Moonshot AI) API Key
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type={show ? 'text' : 'password'}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="sk-..."
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button className="btn btn-secondary" onClick={() => setShow(s => !s)}>
            {show ? '🙈 Hide' : '👁 Show'}
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {apiKey && <div className="success-msg">✓ API key saved (ends in …{apiKey.slice(-4)})</div>}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Save & Continue →
        </button>
        {apiKey && (
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear Key
          </button>
        )}
      </div>

      <div style={{ marginTop: 20, padding: 14, background: '#f0f4f8', borderRadius: 6, fontSize: '0.85rem', color: '#555' }}>
        <strong>How to get a Kimi API key:</strong> Visit{' '}
        <a href="https://platform.moonshot.cn/console/api-keys" target="_blank" rel="noreferrer" style={{ color: '#1a3a5c' }}>
          platform.moonshot.cn/console/api-keys
        </a>{' '}
        → Create new API key. The app uses <strong>moonshot-v1-8k</strong> (Kimi's fast inference model).
      </div>
    </div>
  )
}
