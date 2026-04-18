import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function FileUpload({ onParsed, onBack }) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  const processFile = (file) => {
    setError('')
    setLoading(true)
    const name = file.name.toLowerCase()

    if (name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0 && result.data.length === 0) {
            setError('CSV parse error: ' + result.errors[0].message)
            setLoading(false)
            return
          }
          const columns = result.meta.fields || []
          onParsed({ fileName: file.name, columns, rows: result.data })
          setLoading(false)
        },
        error: (err) => {
          setError('CSV parse error: ' + err.message)
          setLoading(false)
        },
      })
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          const columns = rows.length > 0 ? Object.keys(rows[0]) : []
          onParsed({ fileName: file.name, columns, rows })
        } catch (err) {
          setError('Excel parse error: ' + err.message)
        }
        setLoading(false)
      }
      reader.onerror = () => { setError('Failed to read file'); setLoading(false) }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Unsupported file type. Please upload .csv, .xlsx, or .xls')
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  return (
    <div className="card">
      <h2>Step 2 — Upload Dataset</h2>
      <p style={{ color: '#555', marginBottom: 18, fontSize: '0.93rem' }}>
        Upload a CSV or Excel file containing your clinical dataset. The first row should contain column headers.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? '#1a3a5c' : '#c0ccda'}`,
          borderRadius: 8,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#f0f4f8' : '#fafbfc',
          transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📂</div>
        <div style={{ fontWeight: 600, color: '#1a3a5c', marginBottom: 4 }}>
          {loading ? 'Parsing…' : 'Drop your file here or click to browse'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#95a5a6' }}>
          Supported formats: CSV, XLSX, XLS
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      <button className="btn btn-secondary" onClick={onBack}>← Back</button>
    </div>
  )
}
