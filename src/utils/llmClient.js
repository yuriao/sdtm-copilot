const SYSTEM_PROMPT = `You are an expert clinical data manager specializing in CDISC SDTM mapping. Given a dataset schema, suggest SDTM mappings for one of these domains: DM, AE, or LB. Return ONLY valid JSON:
{"domain":"DM|AE|LB","domain_confidence":"high|medium|low","domain_reasoning":"...","mappings":[{"source_column":"...","sdtm_variable":"...or null","confidence":"high|medium|low","explanation":"...","ambiguity_note":"..."}],"missing_required":["..."],"suggestions":"..."}`

/**
 * Call Kimi (Moonshot AI) with the column profile and get SDTM mapping suggestions.
 * Kimi uses an OpenAI-compatible API at https://api.moonshot.cn/v1
 * @param {string} apiKey - Moonshot API key (starts with sk-)
 * @param {Array} profile - column profiles from profiler.js
 * @param {string} fileName - original file name for context
 * @returns {Object} parsed JSON response from LLM
 */
export async function getLLMSuggestions(apiKey, profile, fileName) {
  const schemaDescription = profile.map(col => {
    return `- ${col.column} (type: ${col.type}, null_rate: ${col.nullRate}%, unique_values: ${col.uniqueCount}, sample: [${col.sampleValues.slice(0,3).join(', ')}])${col.candidateKey ? ' [CANDIDATE KEY]' : ''}`
  }).join('\n')

  const userMessage = `Dataset: "${fileName}"

Column Schema:
${schemaDescription}

Please suggest SDTM mappings for this dataset. Identify the most likely domain (DM, AE, or LB) and map each source column to its corresponding SDTM variable (or null if no mapping). Return ONLY valid JSON.`

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    const msg = errData?.error?.message || `HTTP ${response.status}`
    throw new Error(`Kimi API error: ${msg}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) 
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()

  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`Failed to parse LLM response as JSON. Raw response: ${content.slice(0, 300)}`)
  }
}
