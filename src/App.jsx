import React, { useState } from 'react'
import StepIndicator from './components/StepIndicator'
import ApiKeySetup from './components/ApiKeySetup'
import FileUpload from './components/FileUpload'
import ProfileView from './components/ProfileView'
import LLMSuggest from './components/LLMSuggest'
import MappingReview from './components/MappingReview'
import Validator from './components/Validator'
import ExportPanel from './components/ExportPanel'

const STEPS = [
  'API Key',
  'Upload',
  'Profile',
  'LLM Suggest',
  'Review',
  'Validate',
  'Export',
]

export default function App() {
  const [step, setStep] = useState(0)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sdtm_kimi_key') || '')
  const [parsedData, setParsedData] = useState(null)   // { fileName, columns, rows }
  const [profile, setProfile] = useState(null)          // array of col profiles
  const [llmResult, setLlmResult] = useState(null)      // raw LLM JSON
  const [mappings, setMappings] = useState([])           // [{source_column, sdtm_variable, confidence, explanation, status}]
  const [validationResults, setValidationResults] = useState(null)

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const goBack = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div>
      <header className="app-header">
        <span style={{ fontSize: '1.6rem' }}>🧬</span>
        <h1>SDTM Copilot</h1>
        <span className="subtitle">Clinical Data Mapping Assistant</span>
      </header>

      <div className="app-wrapper">
        <StepIndicator steps={STEPS} current={step} />

        {step === 0 && (
          <ApiKeySetup apiKey={apiKey} setApiKey={setApiKey} onNext={goNext} />
        )}
        {step === 1 && (
          <FileUpload onParsed={(data) => { setParsedData(data); goNext() }} onBack={goBack} />
        )}
        {step === 2 && parsedData && (
          <ProfileView
            parsedData={parsedData}
            profile={profile}
            setProfile={setProfile}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <LLMSuggest
            apiKey={apiKey}
            profile={profile}
            parsedData={parsedData}
            llmResult={llmResult}
            setLlmResult={setLlmResult}
            setMappings={setMappings}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 4 && (
          <MappingReview
            mappings={mappings}
            setMappings={setMappings}
            llmResult={llmResult}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 5 && (
          <Validator
            mappings={mappings}
            llmResult={llmResult}
            validationResults={validationResults}
            setValidationResults={setValidationResults}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 6 && (
          <ExportPanel
            mappings={mappings}
            llmResult={llmResult}
            profile={profile}
            parsedData={parsedData}
            validationResults={validationResults}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  )
}
