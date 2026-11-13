import {
  BOXES_1099,
  DUPLICATE_VALIDATION_OPTIONS,
  DuplicateValidation,
  PAY_OPTIONS,
  PAYMENT_TERMS,
  SAME_AMOUNT_WINDOW_OPTIONS,
  TYPES_1099,
} from "../types/apInvoices";

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
  | "county-combobox"
  | "combobox"
  | "custom"
  | "readonly";

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
  /** Overrides the shared textarea's default 100px min-height (px). Opt-in — omit to keep current sizing. */
  textareaMinHeight?: number;
  gridColumn?: "span 1" | "span 2" | "span 3" | "span 6";
  /** Opt a section into a denser 3- or 6-column layout (default is 2, or 3 automatically when every field in the section is type "boolean"). 6 is for sections mixing 2-, 3-, and 1-wide rows (e.g. tractsConfig's legal-description section) — every field's gridColumn is then expressed out of 6 (span 2/3/6) so rows of 2 or 3 fields coexist in one grid. */
  sectionColumns?: 3 | 6;
  defaultValue?: any;
  dependsOn?: string; // Show field only if another field has certain value
  dependsOnValue?: any;
  helpText?: string;
  /** GraphQL variable name. When set, this field's value is included in the mutation payload. */
  graphqlKey?: string;
  /** Transform the form value before sending to GraphQL. */
  toGraphQL?: (value: any) => any;
  /** Transform the GraphQL value back into the form value when loading. */
  fromGraphQL?: (value: any) => any;
  /** For multi-badge: clicking a badge replaces the selection instead of toggling. */
  singleSelect?: boolean;
  /** For county-combobox: state field id used to choose the county option set. */
  countyStateField?: string;
  /** For county-combobox: show the picked county with its FIPS code ("389 - Reeves County") while the field isn't being edited. */
  showCountyCode?: boolean;
  /** Opt-in: splits the section into independent left/right columns instead of the normal auto-flow grid. Every field in the section must set this for the split to apply. */
  layoutColumn?: "left" | "right";
  /** Opt-in: hides the section's uppercase header text (the border-top divider still shows). Set on any field in the section. */
  hideSectionHeader?: boolean;
  /** For text-like fields: caps the length (input limit + validation) and shows a live "n / max" counter inside the input. */
  maxLength?: number;
  /** How maxLength is enforced. "block" (default) caps the input and fails validation; "warn"
   * accepts any length, turns the counter amber once over and shows maxLengthWarning under the field. */
  maxLengthMode?: "block" | "warn";
  /** For maxLengthMode "warn": the note shown under the field while it's over maxLength. */
  maxLengthWarning?: string;
  /** For readonly fields: shows a lock icon before the value. `placeholder` sets the text shown while it's empty. */
  lockIcon?: boolean;
  /** Opt-in: shows helpText under the input instead of above it, so a row of inputs where only
   * some have help still lines up. */
  helpBelow?: boolean;
  /** Opt-in: fills this field from another field (`from`) each time that one changes, until the
   * user picks a value of their own. The label shows an AUTO tag while the value still matches.
   * `value` returns undefined to leave the field alone. */
  autoFill?: { from: string; value: (sourceValue: any) => any };
  /** Opt-in: emptying this field when it held a value on load sends "" to GraphQL (the BE ignores
   * null) so the stored value is cleared. Needs a graphqlKey; used by the Contacts save. */
  clearable?: boolean;
  /** For maxLengthMode "warn": a hard cap applied as the input's maxLength (the counter and
   * warning still use maxLength). */
  hardMaxLength?: number;
  /** Extra check run with the field's other rules. Return a message to fail it. Also receives the
   * value the form opened with, so a check can skip values the user hasn't changed. */
  validate?: (value: any, initialValue?: any) => true | string;
  /** Opt-in: required only while this returns true for the form's current values. */
  requiredWhen?: (values: Record<string, any>) => boolean;
  /** Opt-in: leaves out the label row (e.g. a field that is its section's only control, under
   * the section header). The control must label itself, e.g. with aria-label. */
  hideLabel?: boolean;
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
  /** List header (and Columns picker) text per listFields id. Ids left out get a label derived from the id. */
  listLabels?: Record<string, string>;
  /** Bump when listFields changes. Each user's saved column choices are kept per version, so ones
   * made against the old columns are dropped and the new defaults show instead. */
  listColumnsVersion?: number;
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
    options: string[] | { value: string; label: string }[],
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

  /** Same as select, but the dropdown also accepts free text — pick a listed option or type a new one. */
  combobox: (
    id: string,
    label: string,
    options: string[],
    opts: Partial<FieldConfig> = {},
  ): FieldConfig => ({
    id,
    label,
    type: "combobox",
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
    fromGraphQL: (value: boolean | null | undefined) => {
      if (value === true) return "Yes";
      if (value === false) return "No";
      return "";
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

/**
 * State + county field pair for a "location" section — same pattern used by Leases and Deeds.
 * Pairs with `useLocationFieldOptions` (src/hooks/useStateCountyReference.ts) for the state
 * dropdown options, and relies on `stateCountyReference` being passed into <Form> for counties.
 */
export const locationFields = (
  section: string,
  opts: {
    stateId?: string;
    countyId?: string;
    tab?: string;
    required?: boolean;
  } = {},
): FieldConfig[] => {
  const stateId = opts.stateId ?? "stateCode";
  const countyId = opts.countyId ?? "countyName";
  const tab = opts.tab ?? "basic";
  const required = opts.required ?? true;
  return [
    field.select(stateId, "State", STATES, { required, tab, section }),
    {
      id: countyId,
      label: "County",
      type: "county-combobox",
      required,
      tab,
      section,
      gridColumn: "span 1",
      countyStateField: stateId,
      placeholder: "Select county",
      showCountyCode: true,
    },
  ];
};

export const TAX_TYPES = [
  "Individual/Sole Proprietor",
  "C-Corp",
  "S-Corp",
  "Partnership",
  "Trust/Estate",
  "LLC (C-Corp)",
  "LLC (S-Corp)",
  "LLC (Partnership)",
];

/** Tax Types whose Tax ID is an SSN (###-##-####); every other type uses an EIN (##-#######). */
export const SSN_TAX_TYPES = ["Individual/Sole Proprietor"];

/** Send 1099 default per Tax Type: corporations don't get one. */
export const SEND_1099_BY_TAX_TYPE: Record<string, "Yes" | "No"> = {
  "Individual/Sole Proprietor": "Yes",
  Partnership: "Yes",
  "Trust/Estate": "Yes",
  "LLC (Partnership)": "Yes",
  "C-Corp": "No",
  "S-Corp": "No",
  "LLC (C-Corp)": "No",
  "LLC (S-Corp)": "No",
};

export const FORM_1099_TYPES = ["1099-MISC", "1099-RENTAL", "1099-SALES", "1099-NEC"];

/** What the BE's vendorInfo.duplicateInvoiceValidation stores for each A/P duplicate rule. */
export const DUPLICATE_VALIDATION_BE_VALUES: Record<DuplicateValidation, string> = {
  "Invoice #": "Validate by Invoice #",
  "Invoice Amount": "Validate by Invoice Amount",
};

/** The vendor tab's explicit "no 1099" choice for 1099 Type / Box. Blank means not set yet. */
export const NO_1099 = "None";

export type ContactListView = "brief" | "detailed";

export const CONTACT_LIST_VIEWS: Record<ContactListView, { label: string; help: string; fields: string[] }> = {
  brief: {
    label: "Brief",
    help: "Brief: who they are and what needs attention",
    fields: ["nameId", "name", "classifications", "cityState", "phone", "status", "alerts"],
  },
  detailed: {
    label: "Detailed",
    help: "Detailed: every column the Name & Address report can include",
    fields: [
      "nameId",
      "name",
      "classifications",
      "mailingAddress",
      "phone",
      "email",
      "taxClassification",
      "w9OnFile",
      "form1099",
      "netting",
      "status",
      "updated",
    ],
  },
};

const CONTACT_LIST_LABELS: Record<string, string> = {
  nameId: "Name ID",
  name: "Name",
  classifications: "Classification",
  cityState: "City, State",
  phone: "Phone",
  status: "Status",
  alerts: "Alerts",
  mailingAddress: "Mailing Address",
  email: "Email",
  taxClassification: "Tax Type",
  w9OnFile: "W-9",
  form1099: "1099",
  netting: "Netting",
  updated: "Updated",
};

const VENDOR_ONLY: Partial<FieldConfig> = {
  tab: "vendor",
  dependsOn: "classifications",
  dependsOnValue: "VENDOR",
};

export const contactsConfig: ModuleConfig = {
  name: "directory",
  title: "Contacts",
  itemName: "Contact",
  tabs: [
    { id: "basic", label: "Name & Address" },
    { id: "tax", label: "Tax Information" },
    { id: "netting", label: "Netting", noOuterSave: true },
    { id: "vendor", label: "A/P Vendor Info" },
    { id: "contacts", label: "Internal Contacts", noOuterSave: true },
    { id: "documents", label: "Documents", noOuterSave: true },
    { id: "linked", label: "Linked Records", noOuterSave: true },
  ],
  // The Contacts page swaps in CONTACT_LIST_VIEWS[view].fields; this is the default (Brief) set.
  listFields: CONTACT_LIST_VIEWS.brief.fields,
  listLabels: CONTACT_LIST_LABELS,
  fields: [
    // Name ID will come from the BE; until then useContacts fills it with mockNameId(party.id).
    {
      id: "nameId",
      label: "Name ID",
      type: "readonly",
      tab: "basic",
      section: "default",
      gridColumn: "span 1",
      lockIcon: true,
      placeholder: "Assigned when saved",
      helpText: "Generated by CADE when the contact is first saved. Read only.",
    },

    // partyTypes is a free-form string list in the BE, so custom classifications save like the
    // built-in ones; the page adds them to the badge row through dynamicOptions.
    field.multiBadge(
      "classifications",
      "Classification Type",
      ["REV", "JIB", "OPERATOR", "PURCHASER", "VENDOR", "EMPLOYEE", "PARTNER"],
      {
        required: true,
        section: "default",
        gridColumn: "span 1",
        defaultValue: [],
        helpText: "Select all that apply. VENDOR adds the A/P Vendor tab.",
        graphqlKey: "partyTypes",
        toGraphQL: (v: string | string[]) => {
          const arr = Array.isArray(v) ? v : [v];
          const filtered = arr.filter(Boolean);
          return filtered.length > 0 ? filtered : undefined;
        },
        fromGraphQL: (v: any) => (Array.isArray(v) ? v.filter(Boolean) : []),
      },
    ),

    field.text("nameLine1", "Name", {
      required: true,
      section: "default",
      gridColumn: "span 1",
      maxLength: 35,
      maxLengthMode: "warn",
      maxLengthWarning: "Over 35 characters. The full name may not show through a window envelope.",
      helpText: "Up to 35 characters shows in full through a window envelope.",
      hardMaxLength: 100,
      validate: (v: string) => !v || v.length <= 100 || "Name can be at most 100 characters",
      graphqlKey: "nameFirst",
    }),

    field.text("nameLine2", "Name Line 2", {
      section: "default",
      gridColumn: "span 1",
      placeholder: "c/o, attention, or second owner",
      maxLength: 100,
      clearable: true,
      graphqlKey: "nameMiddle",
    }),

    {
      id: "addresses",
      label: "Addresses",
      type: "custom",
      tab: "basic",
      section: "addresses",
      gridColumn: "span 2",
    },

    {
      id: "phones",
      label: "Phone Numbers",
      type: "custom",
      tab: "basic",
      section: "phone-&-email",
      gridColumn: "span 1",
    },

    field.email("email", "Email Address", {
      section: "phone-&-email",
      clearable: true,
      graphqlKey: "email",
    }),

    field.select("status", "Active Status", ["Active", "Inactive"], {
      section: "status",
      defaultValue: "Active",
      graphqlKey: "isActive",
      toGraphQL: (v: string) => v === "Active",
      fromGraphQL: (v: boolean | null | undefined) =>
        v === false ? "Inactive" : "Active",
    }),

    field.boolean("ownerNettingApplies", "Owner Netting Applies", {
      section: "status",
      defaultValue: "No",
      helpText: "Yes shows the Netting tab.",
    }),

    // Renders its own header row (with the link to Internal Contacts), so the section's is hidden.
    {
      id: "contactPerson",
      label: "Contact Person",
      type: "custom",
      tab: "basic",
      section: "contact-person",
      gridColumn: "span 2",
      hideSectionHeader: true,
    },

    // Tax tab. The page supplies the Tax ID, W-9 and minimum-payment controls (fieldRenderers /
    // fieldAddons); form1099Type has no BE column yet, so it's saved through useContactDetails.
    field.select("taxClassification", "Tax Type", TAX_TYPES, {
      tab: "tax",
      section: "tax-identification",
      sectionColumns: 3,
      requiredWhen: (values) =>
        ((values.classifications as string[] | undefined) ?? []).some((c) => c === "REV" || c === "VENDOR"),
      helpText: "Required for REV and VENDOR contacts.",
      graphqlKey: "taxInfo.taxClassification",
    }),

    field.text("taxId", "Tax ID", {
      tab: "tax",
      section: "tax-identification",
      graphqlKey: "taxInfo.taxId",
      clearable: true,
      // Legacy IDs that were saved in another shape shouldn't block unrelated saves.
      validate: (v: string | undefined, initial?: string) =>
        !v || v === initial || String(v).replace(/\D/g, "").length === 9 || "Tax ID must be 9 digits",
    }),

    field.boolean("w9OnFile", "W-9 on File", {
      tab: "tax",
      section: "tax-identification",
      graphqlKey: "taxInfo.w9OnFile",
    }),

    field.boolean("send1099", "Send 1099", {
      tab: "tax",
      section: "1099-reporting",
      sectionColumns: 3,
      helpText: "Filled in from Tax Type. Change it to override.",
      helpBelow: true,
      autoFill: { from: "taxClassification", value: (taxType: string) => SEND_1099_BY_TAX_TYPE[taxType] },
      graphqlKey: "taxInfo.send1099",
    }),

    field.select("form1099Type", "Type of 1099", FORM_1099_TYPES, {
      tab: "tax",
      section: "1099-reporting",
    }),

    field.boolean("nonEmployeeComp", "Non-Employee Compensation", {
      tab: "tax",
      section: "1099-reporting",
      graphqlKey: "taxInfo.nonEmployeeComp",
    }),

    field.boolean("internalInHouse", "Internal / In House", {
      tab: "tax",
      section: "withholding-&-exemptions",
      graphqlKey: "taxInfo.internalInHouse",
    }),

    field.boolean("federalTaxWithheld", "Federal Tax Withheld", {
      tab: "tax",
      section: "withholding-&-exemptions",
      graphqlKey: "taxInfo.federalTaxWithheld",
    }),

    field.boolean("backupWithholding", "Backup Withholding", {
      tab: "tax",
      section: "withholding-&-exemptions",
      helpText: "Usually Yes while no W-9 / TIN is on file.",
      helpBelow: true,
      graphqlKey: "taxInfo.backupWithholding",
    }),

    field.boolean("severanceTaxExempt", "Severance Tax Exempt", {
      tab: "tax",
      section: "withholding-&-exemptions",
      graphqlKey: "taxInfo.severanceTaxExempt",
    }),

    field.boolean("otherExempt", "Other Exempt", {
      tab: "tax",
      section: "withholding-&-exemptions",
      graphqlKey: "taxInfo.otherExempt",
    }),

    // Empty means "use the company default" (useCompanySettings), so no amount is sent.
    field.number("minPaymentAmount", "Minimum Payment Amount", {
      tab: "tax",
      section: "payment",
      helpText:
        "Revenue below this amount is held until it adds up. The company default is set in Settings › Accounting.",
      helpBelow: true,
      graphqlKey: "taxInfo.minPaymentAmount",
      toGraphQL: (value: string | number) =>
        value === "" || value === undefined || value === null
          ? undefined
          : Number(value),
    }),

    // A/P Vendor Info tab. Pay and duplicate validation are BE columns (vendorInfo); the rest have
    // none yet and are saved through useVendorDefaults, which the A/P screens read. The page
    // supplies the Pay cards, account pickers and remit-to choices (fieldRenderers).
    field.select("pay", "Pay", PAY_OPTIONS, {
      ...VENDOR_ONLY,
      section: "pay",
      gridColumn: "span 2",
      hideLabel: true,
      graphqlKey: "vendorInfo.pay",
    }),

    field.select(
      "duplicateInvoiceValidation",
      "Validate by",
      DUPLICATE_VALIDATION_OPTIONS.map((rule) => ({ value: DUPLICATE_VALIDATION_BE_VALUES[rule], label: rule })),
      {
        ...VENDOR_ONLY,
        section: "duplicate-invoice-validation",
        helpText: "Both checks run when an invoice is entered, and matches show on its Duplicates tab.",
        helpBelow: true,
        graphqlKey: "vendorInfo.duplicateInvoiceValidation",
      },
    ),

    field.select(
      "sameAmountWindowDays",
      "Same-amount window",
      SAME_AMOUNT_WINDOW_OPTIONS.map((days) => ({ value: String(days), label: `${days} days` })),
      {
        ...VENDOR_ONLY,
        section: "duplicate-invoice-validation",
        helpText: "Used when validating by amount.",
        helpBelow: true,
      },
    ),

    field.text("apAccountId", "A/P Account #", {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
      sectionColumns: 3,
    }),

    field.text("defaultExpenseAccountId", "Default Expense Account", {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
    }),

    field.select("paymentTerms", "Payment Terms", PAYMENT_TERMS, {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
      helpText: "Sets Due Date from Invoice Date.",
      helpBelow: true,
    }),

    field.select("type1099", "1099 Type", [NO_1099, ...TYPES_1099], {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
      placeholder: NO_1099,
      autoFill: { from: "form1099Type", value: (taxTabType: string) => taxTabType || undefined },
    }),

    field.select("box1099", "1099 Box", [NO_1099, ...BOXES_1099], {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
      placeholder: NO_1099,
    }),

    field.select("remitToAddressType", "Remit-to Address", [], {
      ...VENDOR_ONLY,
      section: "invoice-defaults",
    }),

    // The comment log draws its own header row (with the All / Vendor toggle).
    {
      id: "vendorComments",
      label: "Comments",
      type: "custom",
      ...VENDOR_ONLY,
      tab: "vendor",
      section: "comments",
      gridColumn: "span 2",
      hideSectionHeader: true,
    },
  ],
};
