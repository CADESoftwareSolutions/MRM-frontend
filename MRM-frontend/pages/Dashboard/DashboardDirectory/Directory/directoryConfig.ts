export type FieldType =
  | "text"
  | "select"
  | "multi-select"
  | "multi-badge"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date";

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  tab: "basic" | "tax" | "vendor" | string;
  section?: string;
  options?: string[] | { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
  gridColumn?: "span 1" | "span 2" | "span 3";
  defaultValue?: any;
  dependsOn?: string; // Show field only if another field has certain value
  dependsOnValue?: any;
  helpText?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
}

export interface ModuleConfig {
  name: string;
  title: string;
  tabs: TabConfig[];
  fields: FieldConfig[];
  listFields: string[]; // Fields to show in list view
}

// ============================================================================
// Field Builder Helpers - Makes creating configs less verbose
// ============================================================================

export const field = {
  text: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "text",
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  email: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "email",
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  phone: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "phone",
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  number: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "number",
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  select: (
    id: string,
    label: string,
    options: string[],
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "select",
    options,
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  multiSelect: (
    id: string,
    label: string,
    options: string[],
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "multi-select",
    options,
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  multiBadge: (
    id: string,
    label: string,
    options: string[],
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "multi-badge",
    options,
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  textarea: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {}
  ): FieldConfig => ({
    id,
    label,
    type: "textarea",
    tab: "basic",
    rows: 4,
    gridColumn: "span 2",
    ...opts,
  }),
};

const STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export const directoryConfig: ModuleConfig = {
  name: "directory",
  title: "Contact",
  tabs: [
    { id: "basic", label: "Name & Address" },
    { id: "tax", label: "Tax Information" },
    { id: "vendor", label: "A/P Vendor Info" },
  ],
  listFields: [
    "nameId",
    "name",
    "classifications",
    "email",
    "phone",
    "city",
    "state",
    "status",
  ],
  fields: [
    field.select("nameIdType", "Name ID Type", ["auto", "custom"], {
      required: true,
      section: "identification",
    }),

    field.text("nameId", "Name ID", {
      section: "identification",
      dependsOn: "nameIdType",
      dependsOnValue: "custom",
    }),

    field.multiBadge(
      "classifications",
      "Name Classification",
      ["REV", "JIB", "OPERATOR", "PURCHASER", "VENDOR", "EMPLOYEE", "PARTNER"],
      {
        required: true,
        section: "identification",
        gridColumn: "span 2",
      }
    ),

    field.text("name", "Name", {
      required: true,
      section: "basic-info",
    }),

    field.text("nameLine2", "Name Line 2", {
      section: "basic-info",
    }),

    field.multiBadge(
      "addressTypes",
      "Address Type",
      [
        "ALL",
        "Physical",
        "Mailing",
        "1099",
        "JIB",
        "Revenue",
        "Payment",
        "Correspondence",
      ],
      {
        section: "address",
        gridColumn: "span 2",
        defaultValue: ["ALL"],
      }
    ),

    field.text("address", "Address", {
      section: "address",
    }),

    field.text("addressLine2", "Address Line 2", {
      section: "address",
    }),

    field.text("city", "City", {
      section: "address",
    }),

    field.select("state", "State", STATES, {
      section: "address",
    }),

    field.text("zip", "Zip", {
      section: "address",
      placeholder: "12345 or 12345-6789",
    }),

    field.multiBadge(
      "phoneTypes",
      "Phone Number Type",
      ["Home", "Business", "Cell"],
      {
        section: "contact",
      }
    ),

    field.phone("phoneNumber", "Phone Number", {
      section: "contact",
    }),

    field.email("email", "Email Address", {
      section: "contact",
      gridColumn: "span 2",
    }),

    field.text("contactPerson", "Contact Person", {
      section: "contact-person",
      gridColumn: "span 2",
    }),

    field.multiBadge(
      "contactAddressTypes",
      "Contact Person Address Type",
      ["All", "Physical", "Mailing", "Correspondence"],
      {
        section: "contact-person",
        gridColumn: "span 2",
        defaultValue: ["All"],
      }
    ),

    field.text("contactAddress", "Contact Person Address", {
      section: "contact-person",
    }),

    field.text("contactAddressLine2", "Contact Person Address Line 2", {
      section: "contact-person",
    }),

    field.text("contactCity", "Contact Person City", {
      section: "contact-person",
    }),

    field.select("contactState", "Contact Person State", STATES, {
      section: "contact-person",
    }),

    field.text("contactZip", "Contact Person Zip", {
      section: "contact-person",
    }),

    field.phone("contactPhone", "Contact Person Phone Number", {
      section: "contact-person",
    }),

    field.email("contactEmail", "Contact Person Email", {
      section: "contact-person",
    }),

    field.select("status", "Active Status", ["Active", "Inactive"], {
      section: "status",
      defaultValue: "Active",
    }),

    field.textarea("comments", "Comments/Notes", {
      section: "notes",
      gridColumn: "span 2",
      helpText: "Auto-populate if address was changed or transfer was done",
    }),

    field.select(
      "taxClassification",
      "Tax Classification",
      [
        "Individual/Sole Proprietor",
        "C-Corp",
        "S-Corp",
        "Partnership",
        "Trust/Estate",
        "LLC (C-Corp)",
        "LLC (S-Corp)",
        "LLC (Partnership)",
      ],
      {
        tab: "tax",
        section: "tax-basic",
      }
    ),

    field.text("taxId", "Tax ID", {
      tab: "tax",
      section: "tax-basic",
      placeholder: "SSN or TIN format",
      helpText: "Format auto-created based on Owner Tax Classification",
    }),

    field.select("internalInHouse", "Internal/In House", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.select("federalTaxWithheld", "Federal Tax Withheld", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.select(
      "nonEmployeeComp",
      "Non-Employee Compensation",
      ["Yes", "No"],
      {
        tab: "tax",
        section: "tax-options",
      }
    ),

    field.select("send1099", "Send 1099", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
      helpText: "Auto-filled from tax classification, but can be overridden",
    }),

    field.select("w9OnFile", "W-9 on File", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.select("backupWithholding", "Backup Withholding", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.select("severanceTaxExempt", "Severance Tax Exempt", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.select("otherExempt", "Other Exempt", ["Yes", "No"], {
      tab: "tax",
      section: "tax-options",
    }),

    field.number("minPaymentAmount", "Minimum Payment Amount", {
      tab: "tax",
      section: "payment",
      placeholder: "$0.00",
      gridColumn: "span 2",
      helpText:
        "Company default will auto-apply but can be overridden per owner",
    }),

    field.select("pay", "Pay", ["Yes", "No", "Monthly", "Check per entry"], {
      tab: "vendor",
      section: "vendor-options",
      dependsOn: "classifications",
      dependsOnValue: "VENDOR",
      helpText: "Only appears for VENDOR classification",
    }),

    field.select(
      "duplicateInvoiceValidation",
      "Duplicate Invoice Validation",
      ["Validate by Invoice #", "Validate by Invoice Amount"],
      {
        tab: "vendor",
        section: "vendor-options",
        dependsOnValue: "VENDOR",
        dependsOn: "classifications",
      }
    ),
  ],
};
