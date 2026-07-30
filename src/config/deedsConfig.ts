import { field, ModuleConfig } from "./directoryConfig";

export const deedsConfig: ModuleConfig = {
  name: "deeds",
  title: "Deeds",
  itemName: "Deed",
  tabs: [
    { id: "basic", label: "Basic Information" },
    { id: "legal", label: "Legal Description" },
    { id: "recordation", label: "Recordation" },
    { id: "documents", label: "Documents" },
  ],
  listFields: [
    "documentType",
    "grantor",
    "grantee",
    "effectiveDate",
    "interestType",
  ],
  fields: [
    // ========== BASIC TAB — identification ==========
    // documentType + interestType share a row
    field.select(
      "documentType",
      "Type of Deed",
      [
        "Mineral",
        "Royalty",
        "Mineral and Royalty",
        "QuitClaim",
        "Warranty",
        "Surface",
        "General Warranty",
        "Special Warranty",
      ],
      {
        required: true,
        tab: "basic",
        section: "identification",
      },
    ),

    field.select(
      "interestType",
      "Interest Type",
      ["Mineral", "Royalty", "NPRI", "Undivided", "Surface", "Blanchard"],
      {
        required: true,
        tab: "basic",
        section: "identification",
      },
    ),

    // ========== BASIC TAB — parties ==========
    // interests first, then free-form textareas side by side below
    field.text("grantorInterestConveyed", "Grantor Interest Conveyed", {
      required: true,
      tab: "basic",
      section: "parties",
      placeholder: "e.g. 1/2 or 0.5",
    }),

    field.text("granteeInterestReceived", "Grantee Interest Received", {
      required: true,
      tab: "basic",
      section: "parties",
      placeholder: "e.g. 1/2 or 0.5",
    }),

    field.textarea("grantor", "Grantor", {
      required: true,
      tab: "basic",
      section: "parties",
      rows: 2,
      helpText: "Free form — no more than 2 pages",
    }),

    field.textarea("grantee", "Grantee", {
      required: true,
      tab: "basic",
      section: "parties",
      rows: 2,
      helpText: "Free form — no more than 2 pages",
    }),

    // ========== BASIC TAB — dates ==========
    // effectiveDate + executedDate + acres share the section
    {
      id: "effectiveDate",
      label: "Effective Date",
      type: "date",
      required: true,
      tab: "basic",
      section: "dates",
      gridColumn: "span 1",
    },

    {
      id: "executedDate",
      label: "Executed Date",
      type: "date" as const,
      tab: "basic",
      section: "dates",
      gridColumn: "span 1" as const,
    },

    field.number("acres", "Acres", {
      tab: "basic",
      section: "dates",
      placeholder: "0.0000",
    }),

    // ========== BASIC TAB — details ==========
    field.number("consideration", "Consideration ($)", {
      tab: "basic",
      section: "details",
      gridColumn: "span 2",
      placeholder: "0.00",
    }),

    field.textarea("reservations", "Reservations/Burdens", {
      tab: "basic",
      section: "details",
      gridColumn: "span 2",
      rows: 3,
      helpText: "Free form — no more than 4 pages",
    }),

    field.textarea("notes", "Comments", {
      tab: "basic",
      section: "details",
      gridColumn: "span 2",
      rows: 3,
      helpText: "Free form — no more than 3 pages",
    }),

    // ========== LEGAL DESCRIPTION TAB ==========
    {
      id: "tractLinks",
      label: "Tracts",
      type: "custom" as const,
      tab: "legal",
      section: "default",
      gridColumn: "span 2" as const,
    },

    // ========== RECORDATION TAB ==========
    {
      id: "recordation",
      label: "Recordation",
      type: "custom" as const,
      tab: "recordation",
      section: "default",
      gridColumn: "span 2" as const,
    },

    // ========== DOCUMENTS TAB ==========
    {
      id: "attachments",
      label: "Attachments",
      type: "custom" as const,
      tab: "documents",
      section: "default",
      gridColumn: "span 2" as const,
    },
  ],
};

export default deedsConfig;
