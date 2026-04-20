# 🧬 SDTM Copilot

**An LLM-powered clinical data mapping assistant for converting raw datasets into CDISC SDTM-compliant formats.**

🌐 **Live App:** [yuriao.github.io/sdtm-copilot](https://yuriao.github.io/sdtm-copilot/)

---

## What It Does

SDTM Copilot is a browser-based tool that helps clinical data managers, biostatisticians, and CRO teams map raw study datasets to [CDISC SDTM](https://www.cdisc.org/standards/foundational/sdtm) variable names — a mandatory step before regulatory submission.

The core principle: **AI suggests, rules validate, humans approve.**

The tool does _not_ claim to produce a fully submission-ready dataset — it produces a **review-ready mapping scaffold** with full auditability. All final decisions remain with the user.

---

## Supported Domains (MVP)

| Domain | Full Name | Key Variables |
|--------|-----------|---------------|
| **DM** | Demographics | USUBJID, SEX, RACE, COUNTRY, RFSTDTC, AGE |
| **AE** | Adverse Events | AETERM, AESEQ, AESTDTC, AESER, AESEV, AEREL |
| **LB** | Laboratory Test Results | LBTESTCD, LBTEST, LBORRES, LBDTC, LBSTRESN |

---

## 7-Step Workflow

```
API Key → Upload → Profile → AI Suggest → Review → Validate → Export
```

### Step 1 — API Key Setup
Enter your [Kimi (Moonshot AI)](https://platform.moonshot.cn/console/api-keys) API key. It is stored only in your browser's `localStorage` and sent directly to Kimi — never to any other server.

### Step 2 — File Upload
Upload a CSV or Excel (`.xlsx` / `.xls`) file containing your raw clinical dataset.

### Step 3 — Schema Profiling
The app automatically profiles every column:
- Inferred data type (`text`, `number`, `date`, `boolean`)
- Null rate (%)
- Unique value count
- Sample values
- Candidate key detection (USUBJID, date columns)

### Step 4 — AI Mapping Suggestions
The schema is sent to **Kimi (`moonshot-v1-8k`)** with a structured SDTM expert prompt. The model returns:
- Predicted SDTM domain (DM / AE / LB) with confidence and reasoning
- Column → SDTM variable mapping for each source column
- Confidence score per mapping (`high` / `medium` / `low`) with explanation
- List of required variables not yet covered
- Overall guidance and ambiguity notes

If you've already run the AI step, you can jump directly to Review — the result is cached in memory for the session.

### Step 5 — Human Review
An interactive mapping table displays each source column alongside the AI suggestion. You must explicitly **Accept ✓**, **Edit ✏️** (type a different SDTM variable), or **Reject ✗** every mapping. Nothing is applied silently.

- Accepted rows: green highlight
- Rejected rows: gray strikethrough
- Pending rows: yellow background

### Step 6 — Validation
Full rule-based SDTM validation runs across all accepted mappings and every data row. Results are grouped into expandable categories with row-level detail (e.g. *"47/200 rows affected — e.g. rows 3, 7, 12"*).

**18 validation rules across 13 categories:**

| Category | Example Checks |
|----------|---------------|
| Required Variables | All domain-required SDTM vars are mapped |
| Recommended Variables | Domain-recommended vars flagged as warnings |
| Identifier Integrity | USUBJID never blank · STUDYID consistent across rows |
| Sequence Uniqueness | AESEQ / LBSEQ unique per subject |
| Missing Values | Required vars have no blank/null cells in data |
| Date Format | All date vars are valid ISO 8601 (partial dates allowed) |
| Date Consistency | AESTDTC ≤ AEENDTC · RFSTDTC ≤ RFENDTC |
| Data Type | Numeric vars (AGE, AESEQ, LBSTRESN…) contain only numbers |
| Variable Length | LBTESTCD ≤ 8 characters |
| Controlled Terminology | SEX, RACE, AESER, AESEV, AEOUT, COUNTRY checked against CDISC CT |
| Cross-Field Consistency | AESER=Y requires non-blank AETERM |
| Domain Value | DOMAIN column values match predicted domain |
| Plausibility | AGE within 0–150 range |

### Step 7 — Export
Five download options:

| File | Contents |
|------|----------|
| **🗂 Mapped Data CSV** | Original dataset with accepted columns renamed to SDTM variable names; unmapped columns preserved with `UNMAPPED_` prefix |
| **🏥 Define-XML 2.0** | CDISC Define-XML 2.0.0 scaffold with `ItemGroupDef`, `ItemDef` (data type, length, origin, label), and codelist stubs — openable in Pinnacle 21 |
| **📥 Mapping Spec CSV** | Source → SDTM variable table with confidence scores |
| **📋 JSON Config** | Machine-readable mapping for ETL pipelines / validation scripts |
| **📝 Audit Log** | Full session trail: profiling results, LLM reasoning, user decisions, validation output |

---

## Navigation

Completed steps are **clickable** in the progress bar — you can jump back to any prior step at any time. If AI suggestions are already cached, clicking the "LLM Suggest" step skips directly to Review.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| CSV parsing | PapaParse |
| Excel parsing | SheetJS (xlsx) |
| LLM | Kimi `moonshot-v1-8k` via `api.moonshot.ai` (OpenAI-compatible API) |
| Hosting | GitHub Pages (via GitHub Actions) |
| State | In-memory React state (no backend, no database) |

---

## Running Locally

```bash
git clone https://github.com/yuriao/sdtm-copilot.git
cd sdtm-copilot
npm install
npm run dev
```

Open [http://localhost:5173/sdtm-copilot/](http://localhost:5173/sdtm-copilot/)

---

## Scope & Limitations

This is an **MVP scaffold**, not a certified compliance tool.

- ✅ Domains: DM, AE, LB only (ADaM, VS, CM, etc. not included)
- ✅ Controlled terminology: core CDISC CT for key variables
- ❌ No Define-XML full submission package (no ARM, SUPPQUAL, RELREC)
- ❌ No ADaM derivations
- ❌ No NCI EVS codelist population (Define-XML codelists are stubs)
- ❌ No persistence — session data is lost on page refresh

---

## License

MIT
