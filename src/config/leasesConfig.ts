import { field, ModuleConfig, STATES } from "./directoryConfig";

export const leasesConfig: ModuleConfig = {
  name: "leases",
  title: "Leases",
  itemName: "Lease",
  tabs: [
    { id: "basic", label: "Basic Information" },
    { id: "legal", label: "Legal Description" },
    { id: "terms", label: "Terms & Payments" },
    { id: "provisions", label: "Provisions" },
    { id: "recordation", label: "Recordation & References" },
    { id: "documents", label: "Documents" },
  ],
  listFields: [
    "lessor",
    "lessee",
    "effectiveDate",
    "primaryTermEndDate",
    "status",
    "stateCode",
    "countyName",
  ],
  fields: [
    // ========== BASIC TAB ==========
    field.select(
      "leaseType",
      "Type of Lease",
      ["Original", "Amended", "Ratification", "Top"],
      {
        required: true,
        tab: "basic",
        section: "identification",
      },
    ),

    field.text("document", "Document", {
      tab: "basic",
      section: "identification",
      gridColumn: "span 1",
    }),

    field.text("lessor", "Lessor", {
      required: true,
      tab: "basic",
      section: "parties",
    }),

    field.text("lessee", "Lessee", {
      required: true,
      tab: "basic",
      section: "parties",
    }),

    {
      id: "effectiveDate",
      label: "Effective Date",
      type: "date",
      required: true,
      tab: "basic",
      section: "dates",
      gridColumn: "span 1",
    },

    field.number("primaryTermValue", "Primary Term", {
      tab: "basic",
      section: "dates",
    }),

    field.select("primaryTermUnit", "Primary Term Unit", ["Years", "Months"], {
      tab: "basic",
      section: "dates",
    }),

    {
      id: "primaryTermEndDate",
      label: "Expiration Date",
      type: "date",
      tab: "basic",
      section: "dates",
      gridColumn: "span 1",
    },

    field.number("royaltyFractionNumerator", "Royalty Numerator", {
      tab: "basic",
      section: "basic-details",
      placeholder: "3",
    }),

    field.number("royaltyFractionDenominator", "Royalty Denominator", {
      tab: "basic",
      section: "basic-details",
      placeholder: "16",
    }),

    field.select(
      "status",
      "Lease Status",
      ["Active", "HBP", "Expired", "Released", "Terminated"],
      {
        required: true,
        tab: "basic",
        section: "basic-details",
        defaultValue: "Active",
      },
    ),

    field.select("stateCode", "State", STATES, {
      required: true,
      tab: "basic",
      section: "location",
    }),

    {
      id: "countyName",
      label: "County",
      type: "county-combobox" as const,
      required: true,
      tab: "basic",
      section: "location",
      gridColumn: "span 1" as const,
      countyStateField: "stateCode",
      placeholder: "Select county",
    },

    field.boolean("costFree", "Cost Free", {
      tab: "basic",
      section: "basic-details",
    }),

    field.number("acres", "Acres", {
      tab: "basic",
      section: "basic-details",
      placeholder: "0.0000",
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

    // ========== TERMS & PAYMENTS TAB ==========
    field.select("paymentType", "Lease Payment Type", ["Paid Up", "Delay Rental"], {
      required: true,
      tab: "terms",
      section: "lease-type",
    }),

    // Paid Up Lease fields
    field.number("paidUpBonus", "Paid Up Lease Bonus", {
      tab: "terms",
      section: "paid-up",
      dependsOn: "paymentType",
      dependsOnValue: "Paid Up",
      placeholder: "$0.00",
    }),

    field.boolean("paidUpBonusReceived", "Paid Up Bonus Received", {
      tab: "terms",
      section: "paid-up",
      dependsOn: "paymentType",
      dependsOnValue: "Paid Up",
    }),

    field.number("bonusPerAcre", "Price/Acre", {
      tab: "terms",
      section: "paid-up",
      dependsOn: "paymentType",
      dependsOnValue: "Paid Up",
      placeholder: "$0.00",
    }),

    // Delay Rental fields
    field.number("delayRentalAmount", "Delay Rental Payment Amount", {
      tab: "terms",
      section: "delay-rental",
      dependsOn: "paymentType",
      dependsOnValue: "Delay Rental",
      placeholder: "$0.00",
    }),

    field.select(
      "delayRentalFrequency",
      "Delay Rental Payment Frequency",
      ["Monthly", "Annually"],
      {
        tab: "terms",
        section: "delay-rental",
        dependsOn: "paymentType",
        dependsOnValue: "Delay Rental",
      },
    ),

    // Stays a manually-configured select rather than field.boolean(): it's the only field in
    // "rights", and Form.tsx auto-switches a section to grid-cols-3 once every field in it is
    // type "boolean" — that would shrink this span-2 field to 2/3 width.
    field.select("surfaceRights", "Surface Rights", ["Yes", "No"], {
      tab: "terms",
      section: "rights",
      gridColumn: "span 2",
      toGraphQL: (v: string) => v === "Yes",
      fromGraphQL: (v: boolean | null | undefined) => (v ? "Yes" : "No"),
    }),

    // ========== PROVISIONS TAB ==========
    field.multiBadge(
      "provisions",
      "Provisions",
      [
        "Shut-In",
        "Option to Extend",
        "Continuous Development",
        "Horizontal Pugh",
        "Vertical Pugh",
        "Mother Hubbard",
        "Pooling",
        "Offset",
        "Title Records",
        "Consent to Assign",
      ],
      {
        tab: "provisions",
        section: "provisions-list",
        gridColumn: "span 2",
      },
    ),

    // Pooling and Title Records have no detail fields at all: the BE records them as an
    // enabled provision row with no extra data, so the badge selection alone is the complete
    // signal for those two. Horizontal/Vertical Pugh and Mother Hubbard each get a free-form
    // notes field below — badge selected is treated as "yes", so there's no separate toggle.
    field.number("periodValue", "Shut-In Period", {
      tab: "provisions",
      section: "shut-in",
      dependsOn: "provisions",
      dependsOnValue: "Shut-In",
    }),

    field.combobox(
      "periodUnit",
      "Shut-In Period Unit",
      ["Days", "Months", "Years"],
      {
        tab: "provisions",
        section: "shut-in",
        dependsOn: "provisions",
        dependsOnValue: "Shut-In",
      },
    ),

    field.number("paymentPerAcre", "Shut-In Payment Amount/Acre", {
      tab: "provisions",
      section: "shut-in",
      dependsOn: "provisions",
      dependsOnValue: "Shut-In",
      placeholder: "$0.00",
    }),

    field.combobox(
      "paymentFrequency",
      "Shut-In Frequency of Payment",
      ["Paid Annually", "Paid Monthly", "One-Time Payment"],
      {
        tab: "provisions",
        section: "shut-in",
        dependsOn: "provisions",
        dependsOnValue: "Shut-In",
      },
    ),

    // Option to Extend
    field.number("extendDurationValue", "Extension Duration", {
      tab: "provisions",
      section: "extend-option",
      dependsOn: "provisions",
      dependsOnValue: "Option to Extend",
    }),

    field.select(
      "extendDurationUnit",
      "Extension Duration Unit",
      ["Months", "Years"],
      {
        tab: "provisions",
        section: "extend-option",
        dependsOn: "provisions",
        dependsOnValue: "Option to Extend",
      },
    ),

    // Horizontal Pugh / Vertical Pugh / Mother Hubbard — each is its own badge; selecting it
    // is the "yes", and the note below is the only extra detail captured for it.
    field.textarea("horizontalPughNotes", "Horizontal Pugh Notes", {
      tab: "provisions",
      section: "horizontal-pugh",
      dependsOn: "provisions",
      dependsOnValue: "Horizontal Pugh",
      rows: 2,
    }),

    field.textarea("verticalPughNotes", "Vertical Pugh Notes", {
      tab: "provisions",
      section: "vertical-pugh",
      dependsOn: "provisions",
      dependsOnValue: "Vertical Pugh",
      rows: 2,
    }),

    field.textarea("motherHubbardNotes", "Mother Hubbard Notes", {
      tab: "provisions",
      section: "mother-hubbard",
      dependsOn: "provisions",
      dependsOnValue: "Mother Hubbard",
      rows: 2,
    }),

    // Continuous Development
    field.number(
      "timeBetweenCompletionValue",
      "Length of Time Between Completion/Abandonment",
      {
        tab: "provisions",
        section: "development",
        dependsOn: "provisions",
        dependsOnValue: "Continuous Development",
      },
    ),

    field.combobox(
      "timeBetweenCompletionUnit",
      "Length of Time Unit",
      ["Days", "Months", "Years"],
      {
        tab: "provisions",
        section: "development",
        dependsOn: "provisions",
        dependsOnValue: "Continuous Development",
      },
    ),

    // Offset
    field.text("offsetDistance", "Distance of Restriction", {
      tab: "provisions",
      section: "offset",
      dependsOn: "provisions",
      dependsOnValue: "Offset",
      gridColumn: "span 2",
    }),

    // Consent to Assign
    field.combobox(
      "consentType",
      "Type of Consent",
      [
        "Lessor Must Give Prior Consent",
        "Lessee to Provide Notice Only",
        "Lessee Can Convey to Company Affiliated Entities",
      ],
      {
        tab: "provisions",
        section: "consent",
        dependsOn: "provisions",
        dependsOnValue: "Consent to Assign",
        gridColumn: "span 2",
      },
    ),

    // ========== RECORDATION & REFERENCES TAB ==========
    {
      id: "recordation",
      label: "Recordation",
      type: "custom" as const,
      tab: "recordation",
      section: "recordation",
      gridColumn: "span 2" as const,
    },

    field.textarea("notes", "Notes", {
      tab: "recordation",
      section: "notes",
      gridColumn: "span 2",
      rows: 8,
      helpText: "Free form - no more than 3 pages",
    }),

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

export default leasesConfig;
