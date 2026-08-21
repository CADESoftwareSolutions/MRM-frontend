import { field, ModuleConfig, STATES } from "./directoryConfig";

export const TRACT_TYPE_OPTIONS = [
  { value: "block_section_survey", label: "Block/Section/Survey" },
  { value: "abstract", label: "Abstract" },
  { value: "survey_name", label: "Survey Name" },
  { value: "rectangular_str", label: "Rectangular (STR)" },
  { value: "metes_and_bounds", label: "Metes and Bounds" },
  { value: "freeform", label: "Freeform" },
];

export const tractsConfig: ModuleConfig = {
  name: "tracts",
  title: "Tracts",
  itemName: "Tract",
  tabs: [
    { id: "details", label: "Tract Details" },
    { id: "legal", label: "Legal Description" },
    { id: "crossReferences", label: "Cross-References" },
  ],
  listFields: ["label", "tractTypeLabel", "stateCode", "countyName", "grossAcres"],
  fields: [
    // ========== TRACT DETAILS TAB — identification ==========
    field.text("tractNo", "Tract Number", {
      tab: "details",
      section: "identification",
    }),

    // ========== TRACT DETAILS TAB — location ==========
    field.select("stateCode", "State", STATES, {
      required: true,
      tab: "details",
      section: "location",
    }),

    {
      id: "countyName",
      label: "County",
      type: "county-combobox" as const,
      required: true,
      tab: "details",
      section: "location",
      gridColumn: "span 1" as const,
      countyStateField: "stateCode",
      placeholder: "Select county",
    },

    // ========== TRACT DETAILS TAB — additional details ==========
    // Fields with helpText (surveyTownship, upi) are grouped together — mixing a helpText
    // field into a row with a helpText-less one misaligns the inputs, since the extra
    // helpText line pushes that field's input down relative to its row siblings.
    field.text("subSurvey", "Sub-Survey", {
      tab: "details",
      section: "additional-details",
    }),

    field.number("grossAcres", "Gross Acres", {
      tab: "details",
      section: "additional-details",
      placeholder: "0.0000",
    }),

    field.text("surveyTownship", "Survey Township (TX)", {
      tab: "details",
      section: "additional-details",
      helpText: "Texas railroad survey notation, e.g. T8S",
    }),

    field.text("upi", "UPI", {
      tab: "details",
      section: "additional-details",
      helpText: "Pennsylvania Uniform Parcel Identifier",
    }),

    field.number("netAcres", "Net Acres", {
      tab: "details",
      section: "additional-details",
      placeholder: "0.0000",
    }),

    // ========== LEGAL DESCRIPTION TAB ==========
    // The type selector that drives which fields below apply — kept out of the bordered
    // "legal-description" section so it reads as the tab's own header control, not one more
    // field inside the block it's selecting between.
    field.select("tractType", "Tract Type", TRACT_TYPE_OPTIONS, {
      required: true,
      tab: "legal",
      section: "default",
    }),

    // Shown + required per tract type (see TRACT_TYPE_REQUIRED_FIELDS in the backend's
    // mrm_geo.constants for the minimum the BE itself enforces — this list is deliberately a
    // superset for the four main types, matching how legal descriptions are actually filled
    // out on this team). Field order is deliberate: within each tract type's filtered set,
    // fields render two per row in array order, and Lot/Block and Block/Township are meant to
    // sit side by side — this order pairs them correctly for every tract type without
    // per-type duplication.
    field.text("lotNo", "Lot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("blockNo", "Block", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: [
        "block_section_survey",
        "rectangular_str",
        "metes_and_bounds",
        "freeform",
      ],
    }),

    field.text("township", "Township", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "rectangular_str"],
    }),

    field.text("section", "Section", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: [
        "block_section_survey",
        "rectangular_str",
        "metes_and_bounds",
        "freeform",
      ],
    }),

    field.text("survey", "Survey", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: [
        "block_section_survey",
        "survey_name",
        "metes_and_bounds",
        "freeform",
      ],
    }),

    field.text("abstract", "Abstract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: [
        "abstract",
        "block_section_survey",
        "metes_and_bounds",
        "freeform",
      ],
    }),

    field.text("range", "Range", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("tractLabel", "Tract", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: [
        "block_section_survey",
        "rectangular_str",
        "metes_and_bounds",
        "freeform",
      ],
    }),

    field.textarea("legalDescription", "Legal Description", {
      tab: "legal",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      gridColumn: "span 3",
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
