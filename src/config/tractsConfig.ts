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
      tab: "details",
      section: "location",
      gridColumn: "span 1" as const,
      countyStateField: "stateCode",
      placeholder: "Select county",
    },

    // ========== LEGAL DESCRIPTION (shown per tract type) ==========
    field.text("blockNo", "Block", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey"],
    }),

    field.text("section", "Section", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "rectangular_str"],
    }),

    field.text("survey", "Survey", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["block_section_survey", "survey_name"],
    }),

    field.text("abstract", "Abstract", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["abstract"],
    }),

    field.text("township", "Township", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.text("range", "Range", {
      tab: "details",
      section: "legal-description",
      dependsOn: "tractType",
      dependsOnValue: ["rectangular_str"],
    }),

    field.textarea("legalDescription", "Legal Description", {
      tab: "details",
      section: "legal-description",
      gridColumn: "span 2",
      rows: 4,
      dependsOn: "tractType",
      dependsOnValue: ["metes_and_bounds", "freeform"],
    }),

    // ========== ADDITIONAL DETAILS ==========
    field.text("tractLabel", "Tract Label", {
      tab: "details",
      section: "additional-details",
    }),

    field.text("lotNo", "Lot", {
      tab: "details",
      section: "additional-details",
    }),

    field.text("subSurvey", "Sub-Survey", {
      tab: "details",
      section: "additional-details",
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

    field.text("quarterCalls", "Quarter Calls/Aliquot", {
      tab: "details",
      section: "additional-details",
    }),

    field.number("grossAcres", "Gross Acres", {
      tab: "details",
      section: "additional-details",
      placeholder: "0.0000",
    }),

    field.number("netAcres", "Net Acres", {
      tab: "details",
      section: "additional-details",
      placeholder: "0.0000",
    }),
  ],
};

export default tractsConfig;
