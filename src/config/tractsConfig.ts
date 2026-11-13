import { field, ModuleConfig, STATES } from "./contactsConfig";

export const TRACT_TYPE_OPTIONS = [
  { value: "block_section_survey", label: "Block/Section/Survey" },
  { value: "rectangular_str", label: "Rectangular (STR)" },
  { value: "metes_and_bounds", label: "Metes and Bounds" },
  { value: "freeform", label: "Freeform" },
];

export const tractsConfig: ModuleConfig = {
  name: "tracts",
  title: "Tracts",
  itemName: "Tract",
  tabs: [
    { id: "legal", label: "Legal Description" },
    { id: "crossReferences", label: "Cross-References" },
  ],
  listFields: ["id", "tractLabel", "tractTypeLabel", "stateCode", "countyName", "grossAcres"],
  listLabels: { id: "Tract #", tractLabel: "Name" },
  listColumnsVersion: 2,
  fields: [
    // ========== LEGAL DESCRIPTION TAB ==========
    // Tract # + optional name sit above the legal description, in Form's header-less "default"
    // section, rather than inside it: Tract # is the BE-assigned id (read-only, like Deed #) and is
    // what ties a Deed/Lease/Well's legal description back to this record on the Tracts screen.
    {
      id: "id",
      label: "Tract #",
      type: "readonly" as const,
      tab: "legal",
      section: "default",
    },

    field.text("tractLabel", "Tract Name", {
      placeholder: "Optional, e.g. North 40",
      tab: "legal",
      section: "default",
    }),

    // State/County moved here from Tract Details — a legal description reads as incomplete
    // without them, and they're now the row directly under the type selector. sectionColumns: 6
    // opts this whole section into a 6-column grid (Form.tsx) so rows of 1, 2, or 3 fields can
    // coexist: gridColumn "span 6" = full row, "span 3" = a pair, "span 2" = a trio.
    // required: every other required field in this section only renders once a tractType is
    // picked (dependsOn below) — leaving this blank would otherwise skip all of them entirely
    // instead of actually saving a type-less, field-less Tract.
    field.select("tractType", "Legal Description Type", TRACT_TYPE_OPTIONS, {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 6",
    }),

    // Unconditionally required regardless of tractType — a deliberate frontend-only override of
    // the backend's own rule (mrm_geo.constants' TRACT_TYPE_REQUIRED_FIELDS only requires
    // county_name for block_section_survey, not rectangular_str/metes_and_bounds/freeform): a
    // legal description without a State/County was judged incomplete either way, so the fields
    // below are the only ones that actually mirror the backend's per-type rule exactly.
    field.select("stateCode", "State", STATES, {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
    }),

    {
      id: "countyName",
      label: "County",
      type: "county-combobox" as const,
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3" as const,
      countyStateField: "stateCode",
      placeholder: "Select county",
      showCountyCode: true,
    },

    // Required status below mirrors the backend's own per-type rule exactly (mrm_geo.constants'
    // TRACT_TYPE_REQUIRED_FIELDS, enforced in createTract/updateTract) — everything else stays
    // optional (a legal description can otherwise be saved however complete it is so far).
    // Block/Section/Survey and Metes and Bounds/Freeform share one row layout; Rectangular
    // (STR) uses a different one — since e.g. Section pairs with Block in one layout but with
    // Township+Range in the other, no single field order can produce both, so each row below is
    // its own dependsOnValue-gated entry keyed to the type(s) that use that pairing. Where the
    // required-ness of a field also differs by type (e.g. Block is required for Block/Section/
    // Survey but not for Metes and Bounds/Freeform), that forces a further split per type even
    // though the row position is the same — a single required: true/false can't vary by type on
    // one entry. The tract types are mutually exclusive, so only one entry per duplicated field
    // id is ever visible/registered at a time — the repeated ids never collide in the rendered
    // form, and splitting one more instance here doesn't change that.

    // ── Row: Block + Section (Block/Section/Survey — required; Metes and Bounds/Freeform —
    //     not) — two instances each, same row position, since required differs by type. ──
    field.text("blockNo", "Block", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("blockNo", "Block", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    field.text("section", "Section", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("section", "Section", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    // ── Row: Survey + Abstract (Survey required for Block/Section/Survey only; Abstract never
    //     backend-required for either) ──
    field.text("survey", "Survey", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("survey", "Survey", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    field.text("abstract", "Abstract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    // ── Row: Lot + Township (Block/Section/Survey only) ──
    field.text("lotNo", "Lot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("township", "Township", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    // ── Row: Section + Township + Range (Rectangular STR only — all three backend-required) ──
    field.text("section", "Section", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("township", "Township", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("range", "Range", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    // ── Row: Lot + Block (Rectangular STR only) ──
    field.text("lotNo", "Lot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("blockNo", "Block", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    // ── Quarter Calls, alone on its own row (every type) — placed after every type's own rows
    //     above, so it lands last before the Legal Description text for each of them. ──
    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 6",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "rectangular_str", "metes_and_bounds", "freeform"],
    }),

    field.textarea("legalDescription", "Legal Description", {
      required: true,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 6",
      rows: 4,
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    // ========== CROSS-REFERENCES TAB ==========
    {
      id: "crossReferences",
      label: "Cross-References",
      type: "custom" as const,
      tab: "crossReferences",
      section: "default",
      gridColumn: "span 2" as const,
    },
  ],
};

export default tractsConfig;
