import { LegalDescriptionEntry } from "../../components/FormComponents/LegalDescriptionListField";

// Legal description entries are plain data owned by the Lease/Deed/Well — not a Tract (that's a
// separate, reusable, cross-referenceable entity managed on its own Tracts screen). Reads a
// raw `legalDescriptions` row list straight off FETCH_LEASES/FETCH_DEEDS/FETCH_WELLS into the
// entry shape LegalDescriptionListField renders.
export const transformLegalDescriptions = (rows: any[]): LegalDescriptionEntry[] =>
  (rows || []).map((row) => ({
    id: String(row.id),
    sortOrder: row.sortOrder ?? null,
    grossAcres: row.grossAcres ?? null,
    netAcres: row.netAcres ?? null,
    fields: {
      tractType: row.tractType || "",
      stateCode: row.stateCode || "",
      countyName: row.countyName || "",
      tractLabel: row.tractLabel || "",
      legalDescription: row.legalDescription || "",
      lotNo: row.lotNo || "",
      blockNo: row.blockNo || "",
      township: row.township || "",
      section: row.section || "",
      range: row.range || "",
      abstract: row.abstract || "",
      survey: row.survey || "",
      quarterCalls: row.quarterCalls || "",
    },
  }));

// Synchronous — unlike the old Tract-linking flow, no network round trip is needed here: each
// entry is replaced wholesale on the parent record's own save (same pattern as Recordation),
// so this is just a shape conversion to the mutation's LegalDescriptionInput.
export const buildLegalDescriptionInputs = (entries: LegalDescriptionEntry[]) =>
  entries.map((entry, index) => ({
    stateCode: entry.fields.stateCode || null,
    countyName: entry.fields.countyName || null,
    tractType: entry.fields.tractType || null,
    tractLabel: entry.fields.tractLabel || null,
    legalDescription: entry.fields.legalDescription || null,
    lotNo: entry.fields.lotNo || null,
    blockNo: entry.fields.blockNo || null,
    township: entry.fields.township || null,
    section: entry.fields.section || null,
    range: entry.fields.range || null,
    abstract: entry.fields.abstract || null,
    survey: entry.fields.survey || null,
    quarterCalls: entry.fields.quarterCalls || null,
    grossAcres: entry.grossAcres,
    netAcres: entry.netAcres,
    sortOrder: index,
  }));
