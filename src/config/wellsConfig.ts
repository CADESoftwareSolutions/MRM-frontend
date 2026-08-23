import { field, ModuleConfig, locationFields } from "./directoryConfig";

export const wellsConfig: ModuleConfig = {
  name: "wells",
  title: "Wells",
  itemName: "Well",
  tabs: [
    { id: "details", label: "Well Details" },
    { id: "legal", label: "Legal Description" },
    { id: "crossReferences", label: "Cross-References" },
  ],
  listFields: ["name", "operatorName", "stateCode", "countyName", "apiNumber"],
  fields: [
    // ========== IDENTIFICATION ==========
    field.text("name", "Well Name", {
      required: true,
      tab: "details",
      section: "identification",
    }),

    field.text("wellNumber", "Well Number", {
      tab: "details",
      section: "identification",
    }),

    field.text("apiNumber", "API Number", {
      tab: "details",
      section: "identification",
    }),

    field.text("leaseName", "Lease Name", {
      tab: "details",
      section: "identification",
    }),

    // ========== LOCATION ==========
    ...locationFields("location", { tab: "details" }),

    // ========== DETAILS ==========
    field.text("operatorName", "Operator", {
      tab: "details",
      section: "details",
    }),

    field.text("fieldName", "Field Name", {
      tab: "details",
      section: "details",
    }),

    field.text("rrcDistrict", "RRC District", {
      tab: "details",
      section: "details",
    }),

    field.textarea("notes", "Notes", {
      tab: "details",
      section: "details",
      gridColumn: "span 2",
      rows: 3,
    }),

    // ========== LEGAL DESCRIPTION TAB ==========
    // Same pattern as Deeds/Leases: rendered by LegalDescriptionListField, which reuses
    // tractsConfig.ts's "legal" tab fields (tractType + IF block) directly. Each entry is plain
    // data owned by the well, not a Tract row — a Tract only enters the picture if this well's
    // legal description happens to match one, referenced from the Cross-References tab below
    // (manually, or via the suggested-matches modal), same as Deeds/Leases.
    {
      id: "legalDescriptions",
      label: "Legal Descriptions",
      type: "custom" as const,
      tab: "legal",
      section: "default",
      gridColumn: "span 2" as const,
    },

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

export default wellsConfig;
