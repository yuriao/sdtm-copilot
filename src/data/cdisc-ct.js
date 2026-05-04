// CDISC Controlled Terminology — SDTM CT 2024-03-29
// Source: NCI Thesaurus (https://ncithesaurus.nci.nih.gov)
// Used as the single source of truth for both Define-XML codelist generation
// and data validation. Update this file when CDISC releases new CT versions.
export const CDISC_CT = {
  SEX: [
    { coded: 'M',                decode: 'Male' },
    { coded: 'F',                decode: 'Female' },
    { coded: 'U',                decode: 'Unknown' },
    { coded: 'UNDIFFERENTIATED', decode: 'Undifferentiated' },
  ],
  RACE: [
    { coded: 'AMERICAN INDIAN OR ALASKA NATIVE',          decode: 'American Indian or Alaska Native' },
    { coded: 'ASIAN',                                     decode: 'Asian' },
    { coded: 'BLACK OR AFRICAN AMERICAN',                 decode: 'Black or African American' },
    { coded: 'NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER', decode: 'Native Hawaiian or Other Pacific Islander' },
    { coded: 'WHITE',                                     decode: 'White' },
    { coded: 'MULTIPLE',                                  decode: 'Multiple' },
    { coded: 'UNKNOWN',                                   decode: 'Unknown' },
    { coded: 'NOT REPORTED',                              decode: 'Not Reported' },
  ],
  ETHNIC: [
    { coded: 'HISPANIC OR LATINO',     decode: 'Hispanic or Latino' },
    { coded: 'NOT HISPANIC OR LATINO', decode: 'Not Hispanic or Latino' },
    { coded: 'NOT REPORTED',           decode: 'Not Reported' },
    { coded: 'UNKNOWN',                decode: 'Unknown' },
  ],
  // ISO 3166-1 alpha-3 — too many values to enumerate; validated by pattern only
  COUNTRY: null,
  NY: [
    { coded: 'Y', decode: 'Yes' },
    { coded: 'N', decode: 'No' },
  ],
  AESEV: [
    { coded: 'MILD',     decode: 'Mild' },
    { coded: 'MODERATE', decode: 'Moderate' },
    { coded: 'SEVERE',   decode: 'Severe' },
  ],
  OUT: [
    { coded: 'RECOVERED/RESOLVED',               decode: 'Recovered/Resolved' },
    { coded: 'RECOVERING/RESOLVING',             decode: 'Recovering/Resolving' },
    { coded: 'NOT RECOVERED/NOT RESOLVED',       decode: 'Not Recovered/Not Resolved' },
    { coded: 'RECOVERED/RESOLVED WITH SEQUELAE', decode: 'Recovered/Resolved with Sequelae' },
    { coded: 'FATAL',                            decode: 'Fatal' },
    { coded: 'UNKNOWN',                          decode: 'Unknown' },
  ],
  AGEU: [
    { coded: 'YEARS',  decode: 'Years' },
    { coded: 'MONTHS', decode: 'Months' },
    { coded: 'WEEKS',  decode: 'Weeks' },
    { coded: 'DAYS',   decode: 'Days' },
    { coded: 'HOURS',  decode: 'Hours' },
  ],
  ND: [
    { coded: 'NOT DONE', decode: 'Not Done' },
  ],
  // Common lab units from CDISC LBORRESU codelist (shared by LBSTRESU)
  LBORRESU: [
    { coded: '%',        decode: 'Percent' },
    { coded: 'cells/uL', decode: 'Cells per Microliter' },
    { coded: 'fL',       decode: 'Femtoliter' },
    { coded: 'g/dL',     decode: 'Grams per Deciliter' },
    { coded: 'g/L',      decode: 'Grams per Liter' },
    { coded: 'IU/L',     decode: 'International Units per Liter' },
    { coded: 'mg/dL',    decode: 'Milligrams per Deciliter' },
    { coded: 'mg/L',     decode: 'Milligrams per Liter' },
    { coded: 'mIU/mL',   decode: 'Milli-International Units per Milliliter' },
    { coded: 'mmol/L',   decode: 'Millimoles per Liter' },
    { coded: 'ng/mL',    decode: 'Nanograms per Milliliter' },
    { coded: 'nmol/L',   decode: 'Nanomoles per Liter' },
    { coded: 'pg',       decode: 'Picogram' },
    { coded: 'pmol/L',   decode: 'Picomoles per Liter' },
    { coded: 'U/L',      decode: 'Units per Liter' },
    { coded: 'uIU/mL',   decode: 'Micro-International Units per Milliliter' },
    { coded: 'umol/L',   decode: 'Micromoles per Liter' },
    { coded: 'x10^3/uL', decode: 'Thousands per Microliter' },
    { coded: 'x10^6/uL', decode: 'Millions per Microliter' },
    { coded: 'x10^9/L',  decode: 'Billions per Liter' },
  ],
}
