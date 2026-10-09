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
  listFields: ["label", "tractTypeLabel", "stateCode", "countyName", "grossAcres"],
  fields: [
    // ========== LEGAL DESCRIPTION TAB ==========
    // State/County moved here from Tract Details — a legal description reads as incomplete
    // without them, and they're now the row directly under the type selector. sectionColumns: 6
    // opts this whole section into a 6-column grid (Form.tsx) so rows of 1, 2, or 3 fields can
    // coexist: gridColumn "span 6" = full row, "span 3" = a pair, "span 2" = a trio.
    field.select("tractType", "Legal Description Type", TRACT_TYPE_OPTIONS, {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 6",
    }),

    field.select("stateCode", "State", STATES, {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
    }),

    {
      id: "countyName",
      label: "County",
      type: "county-combobox" as const,
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3" as const,
      countyStateField: "stateCode",
      placeholder: "Select county",
    },

    // Shown per tract type — nothing here is required (a legal description can be saved
    // however complete it is so far). Block/Section/Survey and Metes and Bounds/Freeform
    // share one row layout; Rectangular (STR) uses a different one —
    // since e.g. Section pairs with Block in one layout but with Township+Range in the other, no
    // single field order can produce both, so each row below is its own dependsOnValue-gated
    // entry keyed to the type(s) that use that pairing. The tract types are mutually exclusive,
    // so only one entry per duplicated field id is ever visible/registered at a time — the
    // repeated ids (blockNo, section, survey, abstract, tractLabel, lotNo, township, range,
    // quarterCalls each appear more than once below) never collide in the rendered form.

    // ── Row: Block + Section (Block/Section/Survey, Metes and Bounds, Freeform) ──
    field.text("blockNo", "Block", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    field.text("section", "Section", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    // ── Row: Survey + Abstract (Block/Section/Survey, Metes and Bounds, Freeform) ──
    field.text("survey", "Survey", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    field.text("abstract", "Abstract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    // ── Row: Tract + Lot + Township (Block/Section/Survey only) ──
    field.text("tractLabel", "Tract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("lotNo", "Lot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("township", "Township", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    // ── Row: Section + Township + Range (Rectangular STR only) ──
    field.text("section", "Section", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("township", "Township", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 2",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("range", "Range", {
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

    // ── Quarter Calls, alone on its own row (Block/Section/Survey, Rectangular STR) — Metes
    // and Bounds/Freeform instead pair it with Tract below, so it's a separate entry there. ──
    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 6",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "rectangular_str"],
    }),

    // ── Row: Tract + Quarter Calls (Metes and Bounds, Freeform only) ──
    field.text("tractLabel", "Tract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 6,
      gridColumn: "span 3",
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    field.textarea("legalDescription", "Legal Description", {
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
