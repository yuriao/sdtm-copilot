import React, { useEffect } from 'react'
import { profileDataset } from '../utils/profiler'

export default function ProfileView({ parsedData, profile, setProfile, onNext, onBack }) {
  useEffect(() => {
    if (!profile && parsedData) {
      setProfile(profileDataset(parsedData))
    }
  }, [parsedData, profile, setProfile])

  if (!profile) return <div className="card"><p>Profiling…</p></div>

  return (
    <div className="card">
      <h2>Step 3 — Dataset Profile</h2>
      <p style={{ color: '#555', marginBottom: 6, fontSize: '0.93rem' }}>
        <strong>{parsedData.fileName}</strong> — {parsedData.rows.length} rows, {profile.length} columns
      </p>
      <p style={{ color: '#7f8c8d', marginBottom: 20, fontSize: '0.85rem' }}>
        Automatically inferred types, null rates, and candidate keys from your data.
      </p>

      <div className="profile-grid">
        {profile.map((col) => (
          <div className="profile-col" key={col.column}>
            <div className="col-name">{col.column}</div>
            <div className="col-meta">
              <span style={{ 
                background: col.type === 'number' ? '#e8f4fd' : col.type === 'date' ? '#e8f8f5' : col.type === 'boolean' ? '#fef9e7' : '#f8f9fa',
                color: col.type === 'number' ? '#2471a3' : col.type === 'date' ? '#1e8449' : col.type === 'boolean' ? '#b7950b' : '#555',
                padding: '1px 7px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.75rem',
                marginRight: 6,
              }}>
                {col.type}
              </span>
              {col.candidateKey && (
                <span style={{ background: '#1a3a5c', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, marginRight: 6 }}>
                  KEY
                </span>
              )}
            </div>
            <div className="col-meta" style={{ marginTop: 5 }}>
              Null rate: <strong>{col.nullRate}%</strong> · Unique: <strong>{col.uniqueCount}</strong>
            </div>
            {col.sampleValues.length > 0 && (
              <div className="col-meta" style={{ marginTop: 3, fontStyle: 'italic', color: '#95a5a6', wordBreak: 'break-all' }}>
                e.g. {col.sampleValues.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Suggest Mappings →</button>
      </div>
    </div>
  )
}
