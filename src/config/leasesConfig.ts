// configs/leasesConfig.ts
import { field, ModuleConfig, STATES } from "./directoryConfig";

export const leasesConfig: ModuleConfig = {
  name: "leases",
  title: "Leases",
  tabs: [
    { id: "basic", label: "Basic Information" },
    { id: "legal", label: "Legal Description" },
    { id: "terms", label: "Terms & Payments" },
    { id: "provisions", label: "Provisions" },
    { id: "recordation", label: "Recordation & References" },
  ],
  listFields: [
    "leaseId",
    "lessor",
    "lessee",
    "effectiveDate",
    "expirationDate",
    "leaseStatus",
    "state",
    "county",
  ],
  fields: [
    // ========== BASIC TAB ==========
    field.select("leaseIdType", "Lease ID Type", ["smart", "custom"], {
      required: true,
      tab: "basic",
      section: "identification",
      defaultValue: "smart",
    }),

    field.text("leaseId", "Lease ID", {
      tab: "basic",
      section: "identification",
      dependsOn: "leaseIdType",
      dependsOnValue: "custom",
    }),

    field.select(
      "typeOfLease",
      "Type of Lease",
      ["Original", "Amended", "Ratification", "Top"],
      {
        required: true,
        tab: "basic",
        section: "identification",
      }
    ),

    field.text("document", "Document", {
      tab: "basic",
      section: "identification",
      gridColumn: "span 2",
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
      id: "expirationDate",
      label: "Expiration Date",
      type: "date",
      tab: "basic",
      section: "dates",
      gridColumn: "span 1",
    },

    field.number("royaltyRate", "Royalty Rate", {
      tab: "basic",
      section: "basic-details",
      placeholder: "0.00",
    }),

    field.select(
      "leaseStatus",
      "Lease Status",
      ["Active", "HBP", "Expired", "Released"],
      {
        required: true,
        tab: "basic",
        section: "basic-details",
        defaultValue: "Active",
      }
    ),

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

    field.select("costFree", "Cost Free", ["Yes", "No"], {
      tab: "basic",
      section: "basic-details",
    }),

    field.number("acres", "Acres", {
      tab: "basic",
      section: "basic-details",
      placeholder: "0.0000",
      helpText: "Decimal carried out to 4 places",
    }),

    // ========== LEGAL DESCRIPTION TAB ==========
    field.select(
      "legalDescriptionType",
      "Legal Description Type",
      [
        "Block/Section/Survey",
        "Rectangular (STR)",
        "Metes and Bounds",
        "Freeform",
      ],
      {
        required: true,
        tab: "legal",
        section: "legal-type",
        gridColumn: "span 2",
      }
    ),

    // Block/Section/Survey fields
    field.text("block", "Block", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    field.text("township", "Township", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    field.text("section", "Section", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    field.text("abstract", "Abstract", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    field.text("survey", "Survey", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    field.text("quarterCallsAliquot", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Block/Section/Survey",
    }),

    // Rectangular (STR) fields
    field.text("lot", "Lot", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    field.text("blockSTR", "Block", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    field.text("sectionSTR", "Section", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    field.text("townshipSTR", "Township", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    field.text("range", "Range", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    field.text("quarterCallsAliquotSTR", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Rectangular (STR)",
    }),

    // Metes and Bounds fields
    field.text("blockMB", "Block", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Metes and Bounds",
    }),

    field.text("sectionMB", "Section", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Metes and Bounds",
    }),

    field.text("surveyMB", "Survey", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Metes and Bounds",
    }),

    field.text("quarterCallsAliquotMB", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Metes and Bounds",
    }),

    field.textarea("legalDescriptionMB", "Legal Description", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Metes and Bounds",
      gridColumn: "span 2",
      rows: 10,
      helpText: "Free form - no more than 5 pages",
    }),

    // Freeform fields
    field.text("blockFF", "Block", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Freeform",
    }),

    field.text("sectionFF", "Section", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Freeform",
    }),

    field.text("surveyFF", "Survey", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Freeform",
    }),

    field.text("quarterCallsAliquotFF", "Quarter Calls/Aliquot", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Freeform",
    }),

    field.textarea("legalDescriptionFF", "Legal Description", {
      tab: "legal",
      section: "legal-details",
      dependsOn: "legalDescriptionType",
      dependsOnValue: "Freeform",
      gridColumn: "span 2",
      rows: 10,
      helpText: "Free form - no more than 5 pages",
    }),

    // ========== TERMS & PAYMENTS TAB ==========
    field.select("leaseType", "Lease Type", ["Paid Up", "Delay Rental"], {
      required: true,
      tab: "terms",
      section: "lease-type",
      gridColumn: "span 2",
    }),

    // Paid Up Lease fields
    field.number("paidUpLeaseBonus", "Paid Up Lease Bonus", {
      tab: "terms",
      section: "paid-up",
      dependsOn: "leaseType",
      dependsOnValue: "Paid Up",
      placeholder: "$0.00",
    }),

    field.select(
      "paidUpBonusReceived",
      "Paid Up Bonus Received",
      ["Yes", "No"],
      {
        tab: "terms",
        section: "paid-up",
        dependsOn: "leaseType",
        dependsOnValue: "Paid Up",
      }
    ),

    field.number("pricePerAcre", "Price/Acre", {
      tab: "terms",
      section: "paid-up",
      dependsOn: "leaseType",
      dependsOnValue: "Paid Up",
      placeholder: "$0.00",
    }),

    // Delay Rental fields
    field.number("delayRentalPaymentAmount", "Delay Rental Payment Amount", {
      tab: "terms",
      section: "delay-rental",
      dependsOn: "leaseType",
      dependsOnValue: "Delay Rental",
      placeholder: "$0.00",
    }),

    field.select(
      "delayRentalPaymentFrequency",
      "Delay Rental Payment Frequency",
      ["Monthly", "Annually"],
      {
        tab: "terms",
        section: "delay-rental",
        dependsOn: "leaseType",
        dependsOnValue: "Delay Rental",
      }
    ),

    field.select("surfaceRights", "Surface Rights", ["Yes", "No"], {
      tab: "terms",
      section: "rights",
      gridColumn: "span 2",
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
      }
    ),

    // Shut-In provisions
    field.number("shutInPeriodValue", "Shut-In Period", {
      tab: "provisions",
      section: "shut-in",
      dependsOn: "provisions",
      dependsOnValue: "Shut-In",
    }),

    field.select(
      "shutInPeriodUnit",
      "Shut-In Period Unit",
      ["Days", "Months", "Years"],
      {
        tab: "provisions",
        section: "shut-in",
        dependsOn: "provisions",
        dependsOnValue: "Shut-In",
      }
    ),

    field.number("shutInPaymentAmount", "Shut-In Payment Amount/Acre", {
      tab: "provisions",
      section: "shut-in",
      dependsOn: "provisions",
      dependsOnValue: "Shut-In",
      placeholder: "$0.00",
    }),

    field.select(
      "shutInFrequency",
      "Shut-In Frequency of Payment",
      ["Paid Annually", "Paid Monthly", "One-Time Payment"],
      {
        tab: "provisions",
        section: "shut-in",
        dependsOn: "provisions",
        dependsOnValue: "Shut-In",
      }
    ),

    // Option to Extend
    field.select("optionToExtend", "Option to Extend", ["Yes", "No"], {
      tab: "provisions",
      section: "extend-option",
      dependsOn: "provisions",
      dependsOnValue: "Option to Extend",
      gridColumn: "span 2",
    }),

    // Continuous Development
    field.select("horizontalPugh", "Horizontal Pugh", ["Yes", "No"], {
      tab: "provisions",
      section: "development",
      dependsOn: "provisions",
      dependsOnValue: "Continuous Development",
    }),

    field.select("verticalPugh", "Vertical Pugh", ["Yes", "No"], {
      tab: "provisions",
      section: "development",
      dependsOn: "provisions",
      dependsOnValue: "Continuous Development",
    }),

    field.select("motherHubbard", "Mother Hubbard", ["Yes", "No"], {
      tab: "provisions",
      section: "development",
      dependsOn: "provisions",
      dependsOnValue: "Continuous Development",
    }),

    field.select(
      "continuousDevelopment",
      "Continuous Development",
      ["Yes", "No"],
      {
        tab: "provisions",
        section: "development",
        dependsOn: "provisions",
        dependsOnValue: "Continuous Development",
      }
    ),

    field.number(
      "timeBetweenCompletionValue",
      "Length of Time Between Completion/Abandonment",
      {
        tab: "provisions",
        section: "development",
        dependsOn: "provisions",
        dependsOnValue: "Continuous Development",
      }
    ),

    field.select(
      "timeBetweenCompletionUnit",
      "Time Unit",
      ["Days", "Months", "Years"],
      {
        tab: "provisions",
        section: "development",
        dependsOn: "provisions",
        dependsOnValue: "Continuous Development",
      }
    ),

    // Pooling
    field.select("pooling", "Pooling", ["Yes", "No"], {
      tab: "provisions",
      section: "pooling",
      dependsOn: "provisions",
      dependsOnValue: "Pooling",
      gridColumn: "span 2",
    }),

    // Offset
    field.select(
      "offsetLocationRestrictions",
      "Offset Location Restrictions",
      ["Yes", "No"],
      {
        tab: "provisions",
        section: "offset",
        dependsOn: "provisions",
        dependsOnValue: "Offset",
      }
    ),

    field.text("distanceOfRestriction", "Distance of Restriction", {
      tab: "provisions",
      section: "offset",
      dependsOn: "provisions",
      dependsOnValue: "Offset",
    }),

    // Title Records
    field.select(
      "lessorEntitledToTitleRecords",
      "Lessor is Entitled to Title Records",
      ["Yes", "No"],
      {
        tab: "provisions",
        section: "title-records",
        dependsOn: "provisions",
        dependsOnValue: "Title Records",
        gridColumn: "span 2",
      }
    ),

    // Consent to Assign
    field.select("consentToAssign", "Consent to Assign", ["Yes", "No"], {
      tab: "provisions",
      section: "consent",
      dependsOn: "provisions",
      dependsOnValue: "Consent to Assign",
    }),

    field.select(
      "typeOfConsent",
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
      }
    ),

    // ========== RECORDATION & REFERENCES TAB ==========
    field.text("recordationCounty", "County", {
      tab: "recordation",
      section: "recordation",
      helpText:
        "Can have more than one recordation as deed can be recorded in multiple counties",
    }),

    field.select("recordationState", "State", STATES, {
      tab: "recordation",
      section: "recordation",
    }),

    field.text("volumePage", "Volume/Page", {
      tab: "recordation",
      section: "recordation",
      placeholder: "Volume / Page",
    }),

    field.text("instrumentDocumentId", "Instrument/Document ID", {
      tab: "recordation",
      section: "recordation",
    }),

    {
      id: "recordingDate",
      label: "Recording Date",
      type: "date",
      tab: "recordation",
      section: "recordation",
      gridColumn: "span 1",
    },

    // Cross-references
    field.text("crossRefNameId", "Cross-Reference Name ID", {
      tab: "recordation",
      section: "cross-reference",
      helpText: "Select from Name and Address screen",
    }),

    field.text("crossRefLeaseId", "Cross-Reference Lease ID", {
      tab: "recordation",
      section: "cross-reference",
    }),

    field.text("crossRefWellId", "Cross-Reference Well ID", {
      tab: "recordation",
      section: "cross-reference",
    }),

    field.text("crossRefTractId", "Cross-Reference Tract ID", {
      tab: "recordation",
      section: "cross-reference",
    }),

    field.text("crossRefAcquisitionId", "Cross-Reference Acquisition ID", {
      tab: "recordation",
      section: "cross-reference",
    }),

    field.textarea("notes", "Notes", {
      tab: "recordation",
      section: "notes",
      gridColumn: "span 2",
      rows: 8,
      helpText: "Free form - no more than 3 pages",
    }),
  ],
};

export default leasesConfig;

export const MOCK_LEASES = [
  {
    id: 1,
    leaseIdType: "smart",
    leaseId: "LSE-2024-001",
    typeOfLease: "Original",
    document: "Oil & Gas Lease Agreement",
    lessor: "John Smith",
    lessee: "Acme Energy Corporation",
    effectiveDate: "2024-01-15",
    primaryTermValue: 3,
    primaryTermUnit: "Years",
    expirationDate: "2027-01-15",
    royaltyRate: 0.1875,
    leaseStatus: "Active",
    state: "TX",
    county: "Reeves",
    costFree: "No",
    acres: 640.0,
    legalDescriptionType: "Block/Section/Survey",
    block: "10",
    township: "5S",
    section: "12",
    abstract: "A-123",
    survey: "Smith Survey",
    quarterCallsAliquot: "NW/4",
    leaseType: "Paid Up",
    paidUpLeaseBonus: 320000,
    paidUpBonusReceived: "Yes",
    pricePerAcre: 500,
    surfaceRights: "Yes",
    provisions: ["Shut-In", "Horizontal Pugh", "Pooling"],
    shutInPeriodValue: 90,
    shutInPeriodUnit: "Days",
    shutInPaymentAmount: 1.0,
    shutInFrequency: "Paid Annually",
    horizontalPugh: "Yes",
    pooling: "Yes",
    recordationCounty: "Reeves",
    recordationState: "TX",
    volumePage: "1234 / 567",
    instrumentDocumentId: "DOC-2024-0156",
    recordingDate: "2024-01-20",
    notes: "Standard oil and gas lease with favorable terms.",
  },
  {
    id: 2,
    leaseIdType: "smart",
    leaseId: "LSE-2024-002",
    typeOfLease: "Amended",
    document: "Amended Mineral Lease",
    lessor: "Jane Doe",
    lessee: "Pioneer Resources Inc",
    effectiveDate: "2023-06-01",
    primaryTermValue: 5,
    primaryTermUnit: "Years",
    expirationDate: "2028-06-01",
    royaltyRate: 0.25,
    leaseStatus: "HBP",
    state: "OK",
    county: "Canadian",
    costFree: "Yes",
    acres: 320.5,
    legalDescriptionType: "Rectangular (STR)",
    lot: "1",
    blockSTR: "8",
    sectionSTR: "14",
    townshipSTR: "12N",
    range: "8W",
    quarterCallsAliquotSTR: "SE/4",
    leaseType: "Delay Rental",
    delayRentalPaymentAmount: 3200,
    delayRentalPaymentFrequency: "Annually",
    surfaceRights: "No",
    provisions: [
      "Continuous Development",
      "Vertical Pugh",
      "Consent to Assign",
    ],
    continuousDevelopment: "Yes",
    verticalPugh: "Yes",
    timeBetweenCompletionValue: 180,
    timeBetweenCompletionUnit: "Days",
    consentToAssign: "Yes",
    typeOfConsent: "Lessee to Provide Notice Only",
    recordationCounty: "Canadian",
    recordationState: "OK",
    volumePage: "2456 / 123",
    instrumentDocumentId: "REC-2023-8901",
    recordingDate: "2023-06-10",
    notes: "Lease amended to extend primary term and increase royalty rate.",
  },
  {
    id: 3,
    leaseIdType: "custom",
    leaseId: "CUSTOM-TX-2024",
    typeOfLease: "Original",
    document: "Surface and Mineral Lease",
    lessor: "Smith Family Trust",
    lessee: "Western Exploration LLC",
    effectiveDate: "2024-03-01",
    primaryTermValue: 36,
    primaryTermUnit: "Months",
    expirationDate: "2027-03-01",
    royaltyRate: 0.2,
    leaseStatus: "Active",
    state: "TX",
    county: "Midland",
    costFree: "No",
    acres: 1280.75,
    legalDescriptionType: "Metes and Bounds",
    blockMB: "45",
    sectionMB: "20",
    surveyMB: "Block 45 Survey",
    quarterCallsAliquotMB: "All",
    legalDescriptionMB:
      "Beginning at the NE corner of Section 20, Block 45, thence South 5280 feet, thence West 5280 feet, thence North 5280 feet, thence East 5280 feet to the point of beginning.",
    leaseType: "Paid Up",
    paidUpLeaseBonus: 640000,
    paidUpBonusReceived: "Yes",
    pricePerAcre: 500,
    surfaceRights: "Yes",
    provisions: [
      "Shut-In",
      "Option to Extend",
      "Pooling",
      "Offset",
      "Title Records",
    ],
    shutInPeriodValue: 6,
    shutInPeriodUnit: "Months",
    shutInPaymentAmount: 2.5,
    shutInFrequency: "One-Time Payment",
    optionToExtend: "Yes",
    pooling: "Yes",
    offsetLocationRestrictions: "Yes",
    distanceOfRestriction: "660 feet from property line",
    lessorEntitledToTitleRecords: "Yes",
    recordationCounty: "Midland",
    recordationState: "TX",
    volumePage: "3567 / 890",
    instrumentDocumentId: "INS-2024-3456",
    recordingDate: "2024-03-15",
    crossRefNameId: "NAME-001, NAME-002",
    crossRefWellId: "WELL-2024-01",
    notes:
      "Prime acreage in highly productive area. Includes surface rights with restrictions on drilling locations.",
  },
];
