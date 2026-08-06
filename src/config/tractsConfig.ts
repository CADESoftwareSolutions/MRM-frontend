import { field, ModuleConfig, STATES } from "./directoryConfig";

export const TRACT_TYPE_OPTIONS = [
  { value: "block_section_survey", label: "Block/Section/Survey" },
  { value: "abstract", label: "Abstract" },
  { value: "survey_name", label: "Survey Name" },
  { value: "rectangular_str", label: "Rectangular (PLSS)" },
  { value: "metes_and_bounds", label: "Metes and Bounds" },
  { value: "freeform", label: "Freeform" },
];

export const tractsConfig: ModuleConfig = {
  name: "tracts",
  title: "Tracts",
  itemName: "Tract",
  tabs: [{ id: "details", label: "Tract Details" }],
  listFields: ["label", "tractTypeLabel", "stateCode", "countyName", "grossAcres"],
  fields: [
    // ========== IDENTIFICATION ==========
    field.select("tractType", "Tract Type", TRACT_TYPE_OPTIONS, {
      required: true,
      tab: "details",
      section: "identification",
    }),

    field.text("tractNo", "Tract Number", {
      tab: "details",
      section: "identification",
    }),

    // ========== LOCATION ==========
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

    // ========== LEGAL DESCRIPTION (shown + required per tract type) ==========
    // Field order is deliberate: within each tract type's filtered set, fields render two per
    // row in array order, and Lot/Block and Block/Township are meant to sit side by side —
    // this order pairs them correctly for every tract type without per-type duplication.
    field.text("lotNo", "Lot", {
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("blockNo", "Block", {
      tab: "details",
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
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "rectangular_str"],
    }),

    field.text("section", "Section", {
      tab: "details",
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
      tab: "details",
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
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["abstract", "block_section_survey"],
    }),

    field.text("range", "Range", {
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("tractLabel", "Tract Label", {
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "metes_and_bounds", "freeform"],
    }),

    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "details",
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
      tab: "details",
      section: "legal-description",
      sectionColumns: 3,
      required: true,
      gridColumn: "span 3",
      rows: 4,
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    // ========== ADDITIONAL DETAILS ==========
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
  ],
};

export default tractsConfig;
