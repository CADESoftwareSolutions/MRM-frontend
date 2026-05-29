export type FieldType =
  | "text"
  | "select"
  | "boolean"
  | "multi-select"
  | "multi-badge"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "custom";

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
  /** GraphQL variable name. When set, this field's value is included in the mutation payload. */
  graphqlKey?: string;
  /** Transform the form value before sending to GraphQL. */
  toGraphQL?: (value: any) => any;
  /** For multi-badge: clicking a badge replaces the selection instead of toggling. */
  singleSelect?: boolean;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  noOuterSave?: boolean;
}

export interface ModuleConfig {
  name: string;
  title: string;
  itemName?: string; // Singular label used in save button, e.g. "Contact" vs title "Contacts"
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
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
  ): FieldConfig => ({
    id,
    label,
    type: "select",
    options,
    tab: "basic",
    gridColumn: "span 1",
    ...opts,
  }),

  boolean: (
    id: string,
    label: string,
    opts: Partial<FieldConfig> = {},
  ): FieldConfig => ({
    id,
    label,
    type: "boolean",
    options: ["Yes", "No"],
    tab: "basic",
    gridColumn: "span 1",
    toGraphQL: (value: string) => {
      if (value === "Yes") return true;
      if (value === "No") return false;
      return undefined;
    },
    ...opts,
  }),

  multiSelect: (
    id: string,
    label: string,
    options: string[],
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
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
    opts: Partial<FieldConfig> = {},
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

export const STATES = [
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
  title: "Contacts",
  itemName: "Contact",
  tabs: [
    { id: "basic", label: "Name & Address" },
    { id: "tax", label: "Tax Information" },
    { id: "vendor", label: "A/P Vendor Info" },
    { id: "contacts", label: "Internal Contacts", noOuterSave: true },
  ],
  listFields: [
    "name",
    "classifications",
    "phone",
    "email",
    "fullAddress",
    "status",
  ],
  fields: [
    field.text("nameLine1", "Name Line 1", {
      required: true,
      section: "default",
      gridColumn: "span 1",
      graphqlKey: "nameFirst",
    }),

    field.email("email", "Email Address", {
      section: "default",
      gridColumn: "span 1",
      graphqlKey: "email",
    }),

    field.text("nameLine2", "Name Line 2", {
      section: "default",
      gridColumn: "span 1",
      graphqlKey: "nameMiddle",
    }),

    {
      id: "phones",
      label: "Phone Numbers",
      type: "custom" as const,
      tab: "basic",
      section: "default",
      gridColumn: "span 1" as const,
    },

    field.multiBadge(
      "classifications",
      "Name Classification",
      ["REV", "JIB", "OPERATOR", "PURCHASER", "VENDOR", "EMPLOYEE", "PARTNER"],
      {
        required: true,
        section: "default",
        gridColumn: "span 1",
        defaultValue: [],
        graphqlKey: "partyTypes",
        toGraphQL: (v: string | string[]) => {
          const arr = Array.isArray(v) ? v : [v];
          const filtered = arr.filter(Boolean);
          return filtered.length > 0 ? filtered : undefined;
        },
      },
    ),

    field.select("status", "Active Status", ["Active", "Inactive"], {
      section: "default",
      defaultValue: "Active",
      graphqlKey: "isActive",
      toGraphQL: (v: string) => v === "Active",
    }),

    {
      id: "addresses",
      label: "Addresses",
      type: "custom",
      tab: "basic",
      section: "address",
      gridColumn: "span 2",
    },

    field.textarea("comments", "Comments/Notes", {
      section: "notes",
      gridColumn: "span 2",
      helpText: "Auto-populate if address was changed or transfer was done",
      graphqlKey: "notes",
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
        graphqlKey: "taxInfo.taxClassification",
      },
    ),

    field.text("taxId", "Tax ID", {
      tab: "tax",
      section: "tax-basic",
      placeholder: "SSN or TIN format",
      graphqlKey: "taxInfo.taxId",
    }),

    field.boolean("internalInHouse", "Internal/In House", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.internalInHouse",
    }),

    field.boolean("federalTaxWithheld", "Federal Tax Withheld", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.federalTaxWithheld",
    }),

    field.boolean("nonEmployeeComp", "Non-Employee Compensation", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.nonEmployeeComp",
    }),

    field.boolean("send1099", "Send 1099", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.send1099",
    }),

    field.boolean("w9OnFile", "W-9 on File", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.w9OnFile",
    }),

    field.boolean("backupWithholding", "Backup Withholding", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.backupWithholding",
    }),

    field.boolean("severanceTaxExempt", "Severance Tax Exempt", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.severanceTaxExempt",
    }),

    field.boolean("otherExempt", "Other Exempt", {
      tab: "tax",
      section: "tax-options",
      graphqlKey: "taxInfo.otherExempt",
    }),

    field.number("minPaymentAmount", "Minimum Payment Amount", {
      tab: "tax",
      section: "payment",
      placeholder: "$0.00",
      gridColumn: "span 2",
      helpText: "Optional per-party minimum payment threshold",
      graphqlKey: "taxInfo.minPaymentAmount",
      toGraphQL: (value: string | number) =>
        value === "" || value === undefined || value === null
          ? undefined
          : Number(value),
    }),

    field.select("pay", "Pay", ["Yes", "No", "Monthly", "Check per entry"], {
      tab: "vendor",
      section: "vendor-options",
      dependsOn: "classifications",
      dependsOnValue: "VENDOR",
      graphqlKey: "vendorInfo.pay",
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
        graphqlKey: "vendorInfo.duplicateInvoiceValidation",
      },
    ),
  ],
};
