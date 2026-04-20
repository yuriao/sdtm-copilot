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

/**
 * Export the original dataset with accepted columns renamed to their SDTM variable names.
 */
export function exportMappedData(parsedData, mappings, domain) {
  if (!parsedData?.rows?.length) return

  const acceptedMap = {}
  mappings.forEach(m => {
    if (m.status === 'accepted' && m.sdtm_variable) {
      acceptedMap[m.source_column] = m.sdtm_variable
    }
  })

  const originalCols = parsedData.columns || Object.keys(parsedData.rows[0] || {})
  const sdtmCols = []
  const unmappedCols = []

  originalCols.forEach(col => {
    if (acceptedMap[col]) sdtmCols.push(col)
    else unmappedCols.push(col)
  })

  const orderedCols = [...sdtmCols, ...unmappedCols]
  const headerRow = orderedCols.map(col => acceptedMap[col] || `UNMAPPED_${col}`)

  const csvLines = [headerRow.join(',')]
  parsedData.rows.forEach(row => {
    const line = orderedCols.map(col => {
      const val = row[col] ?? ''
      const s = String(val).replace(/"/g, '""')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }).join(',')
    csvLines.push(line)
  })

  const baseName = (parsedData.fileName || 'dataset').replace(/\.[^.]+$/, '')
  downloadFile(csvLines.join('\n'), `${baseName}_sdtm_${domain || 'mapped'}.csv`, 'text/csv')
}

// ─── Define-XML 2.0 ──────────────────────────────────────────────────────────

/**
 * CDISC SDTM variable metadata catalogue for DM, AE, LB domains.
 * Covers required + common recommended variables.
 * dataType: text | integer | float | date | datetime | time
 */
const SDTM_VAR_META = {
  // ── DM ────────────────────────────────────────────────────────────────────
  STUDYID:  { domain: 'DM', label: 'Study Identifier',            dataType: 'text',    length: 20,  role: 'Identifier',  required: true,  origin: 'Assigned' },
  DOMAIN:   { domain: 'DM', label: 'Domain Abbreviation',         dataType: 'text',    length: 2,   role: 'Identifier',  required: true,  origin: 'Assigned' },
  USUBJID:  { domain: 'DM', label: 'Unique Subject Identifier',   dataType: 'text',    length: 50,  role: 'Identifier',  required: true,  origin: 'Assigned' },
  SUBJID:   { domain: 'DM', label: 'Subject Identifier for Study',dataType: 'text',    length: 20,  role: 'Identifier',  required: true,  origin: 'Assigned' },
  RFSTDTC:  { domain: 'DM', label: 'Subject Reference Start Date/Time', dataType: 'datetime', length: 19, role: 'Timing', required: true, origin: 'Collected' },
  RFENDTC:  { domain: 'DM', label: 'Subject Reference End Date/Time',   dataType: 'datetime', length: 19, role: 'Timing', required: false, origin: 'Collected' },
  SEX:      { domain: 'DM', label: 'Sex',                         dataType: 'text',    length: 1,   role: 'Record Qualifier', required: true,  origin: 'Collected', codelist: 'SEX' },
  RACE:     { domain: 'DM', label: 'Race',                        dataType: 'text',    length: 200, role: 'Record Qualifier', required: true,  origin: 'Collected', codelist: 'RACE' },
  COUNTRY:  { domain: 'DM', label: 'Country',                     dataType: 'text',    length: 3,   role: 'Record Qualifier', required: true,  origin: 'Collected', codelist: 'COUNTRY' },
  AGE:      { domain: 'DM', label: 'Age',                         dataType: 'float',   length: 8,   role: 'Record Qualifier', required: false, origin: 'Derived' },
  AGEU:     { domain: 'DM', label: 'Age Units',                   dataType: 'text',    length: 20,  role: 'Record Qualifier', required: false, origin: 'Derived', codelist: 'AGEU' },
  ETHNIC:   { domain: 'DM', label: 'Ethnicity',                   dataType: 'text',    length: 200, role: 'Record Qualifier', required: false, origin: 'Collected', codelist: 'ETHNIC' },
  SITEID:   { domain: 'DM', label: 'Study Site Identifier',       dataType: 'text',    length: 20,  role: 'Identifier',  required: false, origin: 'Assigned' },
  // ── AE ────────────────────────────────────────────────────────────────────
  AESEQ:    { domain: 'AE', label: 'Sequence Number',             dataType: 'integer', length: 8,   role: 'Identifier',  required: true,  origin: 'Assigned' },
  AETERM:   { domain: 'AE', label: 'Reported Term for the Adverse Event', dataType: 'text', length: 200, role: 'Topic', required: true, origin: 'Collected' },
  AESTDTC:  { domain: 'AE', label: 'Start Date/Time of Adverse Event',    dataType: 'datetime', length: 19, role: 'Timing', required: true, origin: 'Collected' },
  AEENDTC:  { domain: 'AE', label: 'End Date/Time of Adverse Event',      dataType: 'datetime', length: 19, role: 'Timing', required: false, origin: 'Collected' },
  AESER:    { domain: 'AE', label: 'Serious Event',               dataType: 'text',    length: 1,   role: 'Record Qualifier', required: false, origin: 'Collected', codelist: 'NY' },
  AESEV:    { domain: 'AE', label: 'Severity/Intensity',          dataType: 'text',    length: 20,  role: 'Record Qualifier', required: false, origin: 'Collected', codelist: 'AESEV' },
  AEREL:    { domain: 'AE', label: 'Causality',                   dataType: 'text',    length: 20,  role: 'Record Qualifier', required: false, origin: 'Collected' },
  AEOUT:    { domain: 'AE', label: 'Outcome of Adverse Event',    dataType: 'text',    length: 20,  role: 'Record Qualifier', required: false, origin: 'Collected', codelist: 'OUT' },
  AEDECOD:  { domain: 'AE', label: 'Dictionary-Derived Term',     dataType: 'text',    length: 200, role: 'Synonym Qualifier', required: false, origin: 'Assigned' },
  AEBODSYS: { domain: 'AE', label: 'Body System or Organ Class',  dataType: 'text',    length: 200, role: 'Record Qualifier', required: false, origin: 'Assigned' },
  // ── LB ────────────────────────────────────────────────────────────────────
  LBSEQ:    { domain: 'LB', label: 'Sequence Number',             dataType: 'integer', length: 8,   role: 'Identifier',  required: true,  origin: 'Assigned' },
  LBTESTCD: { domain: 'LB', label: 'Lab Test or Examination Short Name', dataType: 'text', length: 8,  role: 'Topic',    required: true,  origin: 'Assigned' },
  LBTEST:   { domain: 'LB', label: 'Lab Test or Examination Name',       dataType: 'text', length: 40, role: 'Synonym Qualifier', required: true, origin: 'Assigned' },
  LBORRES:  { domain: 'LB', label: 'Result or Finding in Original Units', dataType: 'text', length: 200, role: 'Result Qualifier', required: true, origin: 'Collected' },
  LBORRESU: { domain: 'LB', label: 'Original Units',              dataType: 'text',    length: 20,  role: 'Variable Qualifier', required: false, origin: 'Collected', codelist: 'LBORRESU' },
  LBDTC:    { domain: 'LB', label: 'Date/Time of Specimen Collection',   dataType: 'datetime', length: 19, role: 'Timing', required: true, origin: 'Collected' },
  LBSTRESC: { domain: 'LB', label: 'Character Result/Finding in Std Format', dataType: 'text', length: 200, role: 'Result Qualifier', required: false, origin: 'Derived' },
  LBSTRESN: { domain: 'LB', label: 'Numeric Result/Finding in Standard Units', dataType: 'float', length: 8, role: 'Result Qualifier', required: false, origin: 'Derived' },
  LBSTRESU: { domain: 'LB', label: 'Standard Units',              dataType: 'text',    length: 20,  role: 'Variable Qualifier', required: false, origin: 'Assigned', codelist: 'LBSTRESU' },
  LBSTAT:   { domain: 'LB', label: 'Completion Status',           dataType: 'text',    length: 8,   role: 'Record Qualifier', required: false, origin: 'Collected', codelist: 'ND' },
}

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate a CDISC Define-XML 2.0 document for the accepted mappings.
 *
 * Spec: CDISC Define-XML 2.0.0 (ODM 1.3.2 extension)
 * The output is a well-formed XML that can be opened in Pinnacle 21 or
 * CDISC conformance checkers. It is a review-ready scaffold — study-specific
 * values (StudyName, StudyDescription, ProtocolName) should be filled in.
 */
export function exportDefineXML(mappings, llmResult, parsedData, profile) {
  const domain = llmResult?.domain || 'UNKNOWN'
  const generatedAt = new Date().toISOString()
  const studyOID = `STUDY.${domain}`
  const metaDataVersionOID = `MDV.${domain}.1`
  const datasetName = (parsedData?.fileName || domain).replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9_]/g, '_')

  // Build accepted variable list with metadata
  const acceptedMappings = mappings.filter(m => m.status === 'accepted' && m.sdtm_variable)
  const varList = acceptedMappings.map((m, idx) => {
    const sdtmName = m.sdtm_variable
    const meta = SDTM_VAR_META[sdtmName] || {
      label: sdtmName,
      dataType: 'text',
      length: 200,
      role: 'Record Qualifier',
      required: false,
      origin: 'Collected',
    }
    // Use profiler info to refine length if available
    const colProfile = profile?.find(p => p.column === m.source_column)
    const length = meta.length

    return { sdtmName, meta, colProfile, idx: idx + 1 }
  })

  // Collect unique codelists referenced
  const codelists = new Set()
  varList.forEach(v => { if (v.meta.codelist) codelists.add(v.meta.codelist) })

  // ── ItemDefs ─────────────────────────────────────────────────────────────
  const itemDefs = varList.map(v => {
    const { sdtmName, meta } = v
    const clRef = meta.codelist
      ? `\n        <def:CodeListRef CodeListOID="CL.${meta.codelist}" />`
      : ''
    return `
    <ItemDef OID="IT.${domain}.${sdtmName}"
             Name="${xmlEscape(sdtmName)}"
             DataType="${xmlEscape(meta.dataType)}"
             Length="${meta.length}"
             Comment="${xmlEscape(meta.label)}">
      <Description>
        <TranslatedText xml:lang="en">${xmlEscape(meta.label)}</TranslatedText>
      </Description>${clRef}
      <def:Origin Type="${xmlEscape(meta.origin)}" />
    </ItemDef>`
  }).join('\n')

  // ── ItemGroupDef (one per domain) ────────────────────────────────────────
  const itemRefs = varList.map(v =>
    `      <ItemRef ItemOID="IT.${domain}.${v.sdtmName}" OrderNumber="${v.idx}" Mandatory="${v.meta.required ? 'Yes' : 'No'}" Role="${xmlEscape(v.meta.role)}" />`
  ).join('\n')

  const itemGroupDef = `
    <ItemGroupDef OID="IG.${domain}"
                  Name="${domain}"
                  Repeating="${domain === 'DM' ? 'No' : 'Yes'}"
                  IsReferenceData="No"
                  SASDatasetName="${datasetName}"
                  Domain="${domain}"
                  Purpose="Tabulation"
                  def:Structure="${domain === 'DM' ? 'One record per subject' : domain === 'AE' ? 'One record per adverse event per subject' : 'One record per lab test per visit per subject'}"
                  def:Class="${domain === 'LB' ? 'FINDINGS' : 'EVENTS'}"
                  def:ArchiveLocationID="LF.${domain}">
      <Description>
        <TranslatedText xml:lang="en">${domain === 'DM' ? 'Demographics' : domain === 'AE' ? 'Adverse Events' : 'Laboratory Test Results'}</TranslatedText>
      </Description>
${itemRefs}
      <def:leaf ID="LF.${domain}" xlink:href="${domain.toLowerCase()}.xpt">
        <def:title>${domain.toLowerCase()}.xpt</def:title>
      </def:leaf>
    </ItemGroupDef>`

  // ── Codelists (stubs — real codes should come from CDISC NCI) ────────────
  const codelistDefs = Array.from(codelists).map(cl => `
    <CodeList OID="CL.${cl}" Name="${cl}" DataType="text" def:StandardOID="STD.1">
      <Description>
        <TranslatedText xml:lang="en">${cl} — CDISC Controlled Terminology (stub; populate from NCI EVS)</TranslatedText>
      </Description>
    </CodeList>`).join('\n')

  // ── Full Define-XML document ──────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Define-XML 2.0.0 — Generated by SDTM Copilot on ${generatedAt} -->
<!-- Domain: ${domain} | Source file: ${xmlEscape(parsedData?.fileName || 'unknown')} -->
<!-- NOTE: This is a review-ready scaffold. Fill in study-specific values before submission. -->
<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3"
     xmlns:def="http://www.cdisc.org/ns/def/v2.0"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:xs="http://www.w3.org/2001/XMLSchema-instance"
     xs:schemaLocation="http://www.cdisc.org/ns/odm/v1.3 ODM1-3-2.xsd"
     ODMVersion="1.3.2"
     FileType="Snapshot"
     FileOID="${xmlEscape(studyOID)}.define"
     CreationDateTime="${generatedAt}"
     Originator="SDTM Copilot"
     SourceSystem="SDTM Copilot"
     SourceSystemVersion="1.0.0"
     def:Context="Other">

  <Study OID="${xmlEscape(studyOID)}">
    <GlobalVariables>
      <StudyName>STUDY-XXXX</StudyName>
      <StudyDescription><!-- Fill in study description --></StudyDescription>
      <ProtocolName><!-- Fill in protocol name --></ProtocolName>
    </GlobalVariables>

    <MetaDataVersion OID="${xmlEscape(metaDataVersionOID)}"
                     Name="SDTM Metadata v1"
                     def:DefineVersion="2.0.0"
                     def:StandardName="CDISC SDTM"
                     def:StandardVersion="1.7">
${itemGroupDef}
${itemDefs}
${codelistDefs}
    </MetaDataVersion>
  </Study>
</ODM>`

  downloadFile(xml, `define_${domain.toLowerCase()}.xml`, 'application/xml')
}
