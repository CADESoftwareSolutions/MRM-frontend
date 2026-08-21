import { field, ModuleConfig, locationFields } from "./directoryConfig";

export const wellsConfig: ModuleConfig = {
  name: "wells",
  title: "Wells",
  itemName: "Well",
  tabs: [
    { id: "details", label: "Well Details" },
    { id: "legal", label: "Legal Description" },
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
    // tractsConfig.ts's "legal" tab fields (tractType + IF block) directly — each entry
    // authors its own Tract row inline rather than picking from an existing list.
    {
      id: "legalDescriptions",
      label: "Legal Descriptions",
      type: "custom" as const,
      tab: "legal",
      section: "default",
      gridColumn: "span 2" as const,
    },
  ],
};

export default wellsConfig;
