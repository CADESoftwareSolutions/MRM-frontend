import { field, ModuleConfig, locationFields } from "./directoryConfig";

export const wellsConfig: ModuleConfig = {
  name: "wells",
  title: "Wells",
  itemName: "Well",
  tabs: [{ id: "details", label: "Well Details" }],
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
  ],
};

export default wellsConfig;
