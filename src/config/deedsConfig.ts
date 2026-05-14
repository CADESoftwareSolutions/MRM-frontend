import { field, ModuleConfig, STATES } from "./directoryConfig";

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
    "typeOfDeed",
    "grantor",
    "grantee",
    "effectiveDate",
    "state",
    "county",
  ],
  fields: [
    // ========== BASIC TAB — identification ==========
    field.select(
      "typeOfDeed",
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
        gridColumn: "span 2",
      }
    ),

    // ========== BASIC TAB — parties ==========
    field.textarea("grantor", "Grantor", {
      required: true,
      tab: "basic",
      section: "parties",
      gridColumn: "span 2",
      rows: 4,
      helpText: "Free form — no more than 2 pages",
    }),

    field.text("grantorInterestConveyed", "Grantor Interest Conveyed", {
      required: true,
      tab: "basic",
      section: "parties",
      placeholder: "e.g. 1/2 or 0.5",
    }),

    field.textarea("grantee", "Grantee", {
      required: true,
      tab: "basic",
      section: "parties",
      gridColumn: "span 2",
      rows: 4,
      helpText: "Free form — no more than 2 pages",
    }),

    field.text("granteeInterestReceived", "Grantee Interest Received", {
      required: true,
      tab: "basic",
      section: "parties",
      placeholder: "e.g. 1/2 or 0.5",
    }),

    // ========== BASIC TAB — dates ==========
    {
      id: "effectiveDate",
      label: "Effective Date",
      type: "date",
      required: true,
      tab: "basic",
      section: "dates",
      gridColumn: "span 1",
    },

    field.select(
      "interestType",
      "Interest Type",
      ["Mineral", "Royalty", "NPRI", "Undivided", "Surface", "Blanchard"],
      {
        required: true,
        tab: "basic",
        section: "dates",
      }
    ),

    // ========== BASIC TAB — location ==========
    field.select("state", "State", STATES, {
      required: true,
      tab: "basic",
      section: "location",
    }),

    field.text("county", "County", {
      required: true,
      tab: "basic",
      section: "location",
    }),

    // ========== BASIC TAB — details ==========
    field.number("acres", "Acres", {
      tab: "basic",
      section: "details",
      placeholder: "0.0000",
      helpText: "Decimal carried out to 4 places",
    }),

    field.textarea("reservationsBurdens", "Reservations/Burdens", {
      tab: "basic",
      section: "details",
      gridColumn: "span 2",
      rows: 4,
      helpText: "Free form — no more than 4 pages",
    }),

    // ========== BASIC TAB — notes ==========
    field.textarea("comments", "Comments", {
      tab: "basic",
      section: "notes",
      gridColumn: "span 2",
      rows: 4,
      helpText: "Free form — no more than 3 pages",
    }),

    // ========== LEGAL DESCRIPTION TAB ==========
    {
      id: "legalDescriptions",
      label: "Legal Descriptions",
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

export const MOCK_DEEDS: Record<string, any>[] = [
  {
    id: "1",
    deedId: "D-TX-B010-S012",
    typeOfDeed: "Mineral",
    grantor: "Smith Family Trust",
    grantorInterestConveyed: "1/2",
    grantee: "Acme Minerals LLC",
    granteeInterestReceived: "1/2",
    effectiveDate: "2023-03-15",
    interestType: "Mineral",
    state: "TX",
    county: "Reeves",
    acres: 320.0,
    reservationsBurdens: "",
    comments: "Standard mineral deed with no reservations.",
    _legalDescriptions: [
      {
        id: "ld-1",
        type: "Block/Section/Survey",
        block: "10",
        township: "5S",
        section: "12",
        abstract: "A-123",
        survey: "Smith Survey",
        quarterCalls: "NW/4",
        upi: "",
      },
    ],
    _recordation: [
      {
        id: "rec-1",
        county: "Reeves",
        state: "TX",
        volume: "1234",
        page: "567",
        instrumentId: "DOC-2023-0156",
        recordingDate: "2023-03-20",
      },
    ],
    _attachments: [],
  },
  {
    id: "2",
    deedId: "D-OK-2023-002",
    typeOfDeed: "Royalty",
    grantor: "Jane Doe",
    grantorInterestConveyed: "0.25",
    grantee: "Pioneer Royalties Inc",
    granteeInterestReceived: "0.25",
    effectiveDate: "2023-06-01",
    interestType: "Royalty",
    state: "OK",
    county: "Canadian",
    acres: 160.5,
    reservationsBurdens: "Grantor reserves NPRI of 1/128.",
    comments: "",
    _legalDescriptions: [
      {
        id: "ld-2",
        type: "Rectangular (STR)",
        lot: "1",
        block: "8",
        section: "14",
        township: "12N",
        range: "8W",
        quarterCalls: "SE/4",
        upi: "",
      },
    ],
    _recordation: [
      {
        id: "rec-2",
        county: "Canadian",
        state: "OK",
        volume: "2456",
        page: "123",
        instrumentId: "REC-2023-8901",
        recordingDate: "2023-06-10",
      },
    ],
    _attachments: [],
  },
];
