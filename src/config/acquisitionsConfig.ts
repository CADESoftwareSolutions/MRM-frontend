import { field, ModuleConfig } from "./directoryConfig";

export const acquisitionsConfig: ModuleConfig = {
  name: "acquisitions",
  title: "Acquisitions",
  itemName: "Acquisition",
  tabs: [{ id: "details", label: "Acquisition Details" }],
  listFields: ["name", "acquisitionDate", "acquisitionAmount"],
  fields: [
    field.text("name", "Acquisition Name", {
      required: true,
      tab: "details",
      section: "identification",
    }),

    {
      id: "acquisitionDate",
      label: "Acquisition Date",
      type: "date",
      required: true,
      tab: "details",
      section: "identification",
      gridColumn: "span 1",
    },

    field.number("acquisitionAmount", "Acquisition Amount ($)", {
      tab: "details",
      section: "identification",
      placeholder: "0.00",
    }),

    field.textarea("notes", "Notes", {
      tab: "details",
      section: "details",
      gridColumn: "span 2",
      rows: 3,
    }),
  ],
};

export default acquisitionsConfig;
