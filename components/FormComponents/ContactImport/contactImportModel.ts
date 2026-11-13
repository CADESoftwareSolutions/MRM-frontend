import { SEND_1099_BY_TAX_TYPE, STATES, TAX_TYPES, contactsConfig } from "@/config/contactsConfig";
import { normalizeClassification } from "@/hooks/useContactDetails";
import type {
  ContactImportPlan,
  ExistingContact,
  PartyChanges,
  PlannedAddress,
  PlannedAddressUpdate,
} from "@/hooks/useContactImport";
import { normalizeHeader, parseCsv, toCsv } from "@/lib/csv";
import { formatTaxId, maskTaxId, taxIdFormatFor } from "../ContactRecord/TaxIdInput";

// ── CADE fields ──────────────────────────────────────────────────────────────

/** Same order as the record's address tabs. */
export const ADDRESS_TYPES = ["Physical", "Mailing", "1099", "JIB", "Revenue", "Payment", "Correspondence"];
export const PHONE_TYPES = ["Home", "Business", "Cell", "Fax", "Other"];
/** The record form starts a new contact with a Home phone. */
export const DEFAULT_PHONE_TYPE = "Home";
export const NAME_MAX_LENGTH = 35;
/** The BE's name column limit; longer names fail to save. */
export const NAME_HARD_LIMIT = 100;
export const NAME_LINE2_LIMIT = 100;
export const EMAIL_LIMIT = 255;

export const BUILT_IN_CLASSIFICATIONS = (contactsConfig.fields.find((f) => f.id === "classifications")?.options ??
  []) as string[];

export type FieldKey =
  | "skip"
  | "name"
  | "nameLine2"
  | "classifications"
  | "address"
  | "addressLine2"
  | "city"
  | "state"
  | "zip"
  | "phone"
  | "email"
  | "status"
  | "taxType"
  | "taxId"
  | "w9"
  | "comments";

export const FIELD_LABELS: Record<FieldKey, string> = {
  skip: "Don't import",
  name: "Name",
  nameLine2: "Name Line 2",
  classifications: "Classification Type",
  address: "Address",
  addressLine2: "Address Line 2",
  city: "City",
  state: "State",
  zip: "Zip",
  phone: "Phone Number",
  email: "Email Address",
  status: "Active Status",
  taxType: "Tax Type",
  taxId: "Tax ID",
  w9: "W-9 on File",
  comments: "Comments",
};

export const FIELD_GROUPS: { label: string; fields: FieldKey[] }[] = [
  { label: "Name", fields: ["name", "nameLine2", "classifications"] },
  { label: "Address", fields: ["address", "addressLine2", "city", "state", "zip"] },
  { label: "Phone & Email", fields: ["phone", "email"] },
  { label: "Status & Tax", fields: ["status", "taxType", "taxId", "w9"] },
  { label: "Other", fields: ["comments"] },
];

/** Shown beside a matched column. */
export const FIELD_NOTES: Partial<Record<FieldKey, string>> = {
  classifications: "Separate multiple with ;",
  status: "A / I, Active / Inactive or Y / N",
  taxId: "9 digits; dashes are fine",
  w9: "Y / N read as Yes / No",
  zip: "5 digits or ZIP+4",
};

const ADDRESS_PARTS = ["address", "addressLine2", "city", "state", "zip"] as const;
export type AddressPart = (typeof ADDRESS_PARTS)[number];
export const isAddressPart = (field: FieldKey): field is AddressPart =>
  (ADDRESS_PARTS as readonly string[]).includes(field);

export interface ColumnTarget {
  field: FieldKey;
  /** Address parts: an address type, or null to follow "If Address Type is blank". Phones: a phone type. */
  type: string | null;
}

export const SKIP: ColumnTarget = { field: "skip", type: null };

export type MatchAction = "skip" | "fill" | "overwrite";

export interface ImportSettings {
  defaultClassification: string;
  defaultAddressType: string;
  onMatch: MatchAction;
}

export const DEFAULT_SETTINGS: ImportSettings = {
  defaultClassification: "REV",
  defaultAddressType: "Physical",
  onMatch: "fill",
};

/** One key per CADE field a column can fill: address parts and phones are per type. */
export const targetKey = (target: ColumnTarget, settings: ImportSettings): string | null => {
  if (target.field === "skip") return null;
  if (isAddressPart(target.field)) return `${target.field}:${target.type ?? settings.defaultAddressType}`;
  if (target.field === "phone") return `phone:${target.type ?? DEFAULT_PHONE_TYPE}`;
  return target.field;
};

export const targetLabel = (target: ColumnTarget, settings: ImportSettings): string => {
  const label = FIELD_LABELS[target.field];
  if (isAddressPart(target.field)) return `${label} (${target.type ?? settings.defaultAddressType})`;
  if (target.field === "phone") return `${label} (${target.type ?? DEFAULT_PHONE_TYPE})`;
  return label;
};

// ── Matching column names ────────────────────────────────────────────────────

const aliasMap = <T,>(groups: [T, string[]][]) =>
  new Map<string, T>(groups.flatMap(([value, keys]) => keys.map((key) => [key, value] as [string, T])));

// Keys are normalizeHeader()'d: lowercase letters and digits only, "#" read as "number".
const FIELD_ALIASES = aliasMap<FieldKey>([
  [
    "name",
    [
      "name",
      "name1",
      "nameline1",
      "fullname",
      "owner",
      "ownername",
      "payee",
      "payeename",
      "vendor",
      "vendorname",
      "contact",
      "contactname",
      "company",
      "companyname",
      "partyname",
    ],
  ],
  ["nameLine2", ["name2", "nameline2", "secondname", "attention", "attn", "careof", "incareof", "co"]],
  [
    "classifications",
    [
      "type",
      "types",
      "classification",
      "classifications",
      "classificationtype",
      "classificationtypes",
      "contacttype",
      "nametype",
      "partytype",
      "category",
    ],
  ],
  ["email", ["email", "emailaddress"]],
  ["status", ["status", "active", "activestatus", "activeinactive", "ownerstatus", "vendorstatus", "contactstatus", "namestatus"]],
  ["taxType", ["taxtype", "entity", "entitytype", "taxclassification", "taxpayertype", "taxentity", "taxentitytype"]],
  [
    "taxId",
    [
      "taxid",
      "taxidnumber",
      "taxidno",
      "taxnumber",
      "tin",
      "ssn",
      "ein",
      "ssntin",
      "tinssn",
      "ssnein",
      "einssn",
      "fein",
      "federalid",
      "federaltaxid",
      "taxpayerid",
      "taxpayeridnumber",
      "fedid",
    ],
  ],
  ["w9", ["w9", "w9onfile", "w9received", "w9status", "w9form"]],
  ["comments", ["comments", "comment", "notes", "note", "remarks", "memo"]],
]);

// Owner #, Owner Number, Vendor ID, Name ID, Acct No…: the other system's own numbering.
const NAME_ID_PATTERN = /^(owner|vendor|name|payee|customer|cust|account|acct|party|contact|interest)?(number|no|num|nbr|id|code)$/;

const ADDRESS_PART_ALIASES = aliasMap<AddressPart>([
  ["address", ["address", "address1", "addressline1", "addressline", "addr", "addr1", "street", "streetaddress", "line1"]],
  ["addressLine2", ["address2", "addressline2", "addr2", "line2", "street2", "suite"]],
  ["city", ["city", "town"]],
  ["state", ["state", "st", "statecode", "province", "stateprovince"]],
  ["zip", ["zip", "zipcode", "zip4", "zip5", "postalcode", "postcode", "postal", "zippostalcode", "zippostal"]],
]);

// Longer words first, so "mailing" is stripped whole rather than as "mail" + "ing".
const ADDRESS_TYPE_WORDS: [string, string][] = [
  ["correspondence", "Correspondence"],
  ["physical", "Physical"],
  ["mailing", "Mailing"],
  ["revenue", "Revenue"],
  ["payment", "Payment"],
  ["remitto", "Payment"],
  ["remit", "Payment"],
  ["phys", "Physical"],
  ["mail", "Mailing"],
  ["corr", "Correspondence"],
  ["1099", "1099"],
  ["jib", "JIB"],
  ["rev", "Revenue"],
  ["pay", "Payment"],
];

const PHONE_BASES = new Set(["phone", "phonenumber", "phoneno", "telephone", "telephonenumber", "tel", "telno", "number"]);
const PHONE_TYPE_WORDS: [string, string][] = [
  ["business", "Business"],
  ["office", "Business"],
  ["work", "Business"],
  ["home", "Home"],
  ["cell", "Cell"],
  ["mobile", "Cell"],
  ["fax", "Fax"],
  ["other", "Other"],
];
/** Words that are a phone column on their own ("Fax", "Mobile"). */
const STANDALONE_PHONE_WORDS = new Set(["cell", "mobile", "fax"]);

/** What's left of key once word is taken off its start or end. */
const withoutWord = (key: string, word: string): string[] => [
  ...(key.startsWith(word) ? [key.slice(word.length)] : []),
  ...(key.endsWith(word) ? [key.slice(0, key.length - word.length)] : []),
];

export interface HeaderGuess {
  target: ColumnTarget | null;
  /** Looks like the other system's Name ID, which CADE never imports. */
  nameId: boolean;
}

/** The CADE field a column name points at: "Mailing City" → City (Mailing), "Cell Phone" → Phone
 * Number (Cell), "Owner #" → a Name ID. */
export const guessColumn = (header: string): HeaderGuess => {
  const key = normalizeHeader(header);
  const guess = guessKey(key);
  if (guess.target || guess.nameId) return guess;
  // "Owner Address", "Vendor City", "Payee Zip": the prefix only says whose record it is.
  const prefix = ROLE_PREFIXES.find((word) => key.startsWith(word) && key.length > word.length);
  return prefix ? guessKey(key.slice(prefix.length)) : guess;
};

const ROLE_PREFIXES = ["owner", "vendor", "payee"];

const guessKey = (key: string): HeaderGuess => {
  if (!key) return { target: null, nameId: false };

  const field = FIELD_ALIASES.get(key);
  if (field) return { target: { field, type: null }, nameId: false };
  if (NAME_ID_PATTERN.test(key)) return { target: null, nameId: true };

  const part = ADDRESS_PART_ALIASES.get(key);
  if (part) return { target: { field: part, type: null }, nameId: false };
  for (const [word, type] of ADDRESS_TYPE_WORDS) {
    for (const rest of withoutWord(key, word)) {
      const typedPart = ADDRESS_PART_ALIASES.get(rest);
      if (typedPart) return { target: { field: typedPart, type }, nameId: false };
    }
  }

  if (PHONE_BASES.has(key) && key !== "number") return { target: { field: "phone", type: null }, nameId: false };
  for (const [word, type] of PHONE_TYPE_WORDS) {
    for (const rest of withoutWord(key, word)) {
      if (PHONE_BASES.has(rest) || (!rest && STANDALONE_PHONE_WORDS.has(word))) {
        return { target: { field: "phone", type }, nameId: false };
      }
    }
  }
  return { target: null, nameId: false };
};

/** The blank template's columns. Every one maps by name, so a filled-in template needs no mapping. */
export const CONTACT_TEMPLATE_HEADERS = [
  "Name",
  "Name Line 2",
  "Classification Type",
  ...["Physical", "Mailing"].flatMap((type) => [
    `${type} Address`,
    `${type} Address Line 2`,
    `${type} City`,
    `${type} State`,
    `${type} Zip`,
  ]),
  "Home Phone",
  "Business Phone",
  "Cell Phone",
  "Fax",
  "Email Address",
  "Active Status",
  "Tax Type",
  "Tax ID",
  "W-9 on File",
  "Comments",
];

export const buildTemplateCsv = (): string => toCsv([CONTACT_TEMPLATE_HEADERS]) + "\r\n";

// ── Reading the file ─────────────────────────────────────────────────────────

export interface SheetColumn {
  /** Position in the file, which is also the key for its mapping. */
  index: number;
  /** As in the file, or "Column F" when it has none. */
  header: string;
  /** normalizeHeader(header); "" for a column without a name. */
  key: string;
  /** The first data row's value. */
  sample: string;
  nameId: boolean;
}

export interface SheetRow {
  /** As Excel numbers it. */
  rowNumber: number;
  cells: string[];
}

export interface ParsedSheet {
  /** Row the column names are on; 0 when there are none. */
  headerRow: number;
  columns: SheetColumn[];
  rows: SheetRow[];
  /** Things worth knowing that don't stop the import. */
  notes: string[];
  /** Why nothing can be imported. */
  fatal: string | null;
}

// Exports sometimes open with a title or report-date line above the column names.
const HEADER_SEARCH_ROWS = 10;

const isBlankRecord = (record: string[]) => record.every((cell) => !cell.trim());

const columnLetter = (index: number) => {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

const DATA_WORDS = new Set(["a", "i", "y", "n", "x", "yes", "no", "true", "false", "active", "inactive"]);

/** Values a data row holds, which can read like column names ("Active", "No") but aren't. */
const looksLikeData = (cell: string) => {
  const text = cell.trim();
  return DATA_WORDS.has(text.toLowerCase()) || (/\d/.test(text) && /^[\d\s.,$%()/:-]+$/.test(text));
};

const recognizedCount = (record: string[]) =>
  record.filter((cell) => {
    if (looksLikeData(cell)) return false;
    const guess = guessColumn(cell);
    return guess.target != null || guess.nameId;
  }).length;

// Row 1 is the header unless a later row is clearly a better one (a title line above the names).
const HEADER_LEAD_NEEDED = 2;

/** Reads a CSV of contacts, one per row. The column names are the first row, unless a later one
 * (among the first ten) recognizes at least two more names; with none recognized, the first row
 * with two or more values. */
export const parseContactSheet = (text: string): ParsedSheet => {
  const records = parseCsv(text);
  const empty = (fatal: string): ParsedSheet => ({ headerRow: 0, columns: [], rows: [], notes: [], fatal });

  const candidates = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => !isBlankRecord(record))
    .slice(0, HEADER_SEARCH_ROWS);
  if (!candidates.length) return empty("The file is empty.");

  let header = candidates[0];
  const firstScore = recognizedCount(header.record);
  let bestScore = firstScore;
  for (const candidate of candidates.slice(1)) {
    const score = recognizedCount(candidate.record);
    if (score > bestScore && score >= firstScore + HEADER_LEAD_NEEDED) {
      header = candidate;
      bestScore = score;
    }
  }
  if (bestScore === 0) {
    header = candidates.find(({ record }) => record.filter((cell) => cell.trim()).length >= 2) ?? candidates[0];
  }

  const headerRow = header.index + 1;
  const rows: SheetRow[] = records
    .slice(header.index + 1)
    .map((cells, offset) => ({ rowNumber: headerRow + 1 + offset, cells }))
    .filter((row) => !isBlankRecord(row.cells));
  const width = rows.reduce((max, row) => Math.max(max, row.cells.length), header.record.length);
  const firstRow = rows[0]?.cells ?? [];

  const columns: SheetColumn[] = [];
  const unnamed: string[] = [];
  for (let index = 0; index < width; index++) {
    const name = (header.record[index] ?? "").trim();
    if (!name && !rows.some((row) => (row.cells[index] ?? "").trim())) continue;
    const label = name || `Column ${columnLetter(index)}`;
    if (!name) unnamed.push(label);
    columns.push({
      index,
      header: label,
      key: normalizeHeader(name),
      sample: (firstRow[index] ?? "").trim(),
      nameId: guessColumn(name).nameId,
    });
  }

  const notes: string[] = [];
  if (header.index > 0 && records.slice(0, header.index).some((record) => !isBlankRecord(record))) {
    notes.push(`The column names are in row ${headerRow}, so the ${header.index === 1 ? "row" : "rows"} above them ${header.index === 1 ? "was" : "were"} ignored.`);
  }
  if (unnamed.length) {
    notes.push(`${listJoin(unnamed)} ${unnamed.length === 1 ? "has" : "have"} values but no column name.`);
  }
  const seen = new Map<string, number>();
  for (const column of columns) {
    if (column.key) seen.set(column.key, (seen.get(column.key) ?? 0) + 1);
  }
  const repeated = columns.filter((c, i) => c.key && (seen.get(c.key) ?? 0) > 1 && columns.findIndex((o) => o.key === c.key) === i);
  if (repeated.length) {
    notes.push(`More than one column is named ${listJoin(repeated.map((c) => `“${c.header}”`), "or")}.`);
  }

  if (!rows.length) {
    return { ...empty(`There are no rows under the column names in row ${headerRow}.`), headerRow, columns };
  }
  return { headerRow, columns, rows, notes, fatal: null };
};

// ── Mapping ──────────────────────────────────────────────────────────────────

export type MappingSource = "auto" | "template" | "user";

export interface ColumnMapping {
  target: ColumnTarget;
  source: MappingSource;
}

/** By SheetColumn.index. */
export type ColumnMappings = Record<number, ColumnMapping>;

/** Each column's field from the saved mapping when it has the column, else from its name. A
 * field already taken by an earlier column is left for the user. */
export const autoMap = (
  columns: SheetColumn[],
  settings: ImportSettings,
  template: { columns: Record<string, ColumnTarget> } | null,
): ColumnMappings => {
  const taken = new Set<string>();
  const mappings: ColumnMappings = {};
  for (const column of columns) {
    const saved = column.key ? template?.columns[column.key] : undefined;
    const target = saved ?? (column.key ? guessColumn(column.header).target : null);
    const key = target ? targetKey(target, settings) : null;
    if (target && key && !taken.has(key)) {
      taken.add(key);
      mappings[column.index] = { target, source: saved ? "template" : "auto" };
    } else {
      mappings[column.index] = { target: SKIP, source: saved ? "template" : "auto" };
    }
  }
  return mappings;
};

/** The mapping to save: each named column's field, the first one winning when names repeat. */
export const templateColumns = (columns: SheetColumn[], mappings: ColumnMappings): Record<string, ColumnTarget> => {
  const saved: Record<string, ColumnTarget> = {};
  for (const column of columns) {
    if (column.key && !saved[column.key]) saved[column.key] = mappings[column.index]?.target ?? SKIP;
  }
  return saved;
};

export type ColumnState = "matched" | "skipped" | "notMapped" | "duplicate";

export interface ColumnReview {
  column: SheetColumn;
  mapping: ColumnMapping;
  state: ColumnState;
  /** The earlier column already mapped to the same field. */
  duplicateOf: string | null;
}

export const reviewColumns = (
  columns: SheetColumn[],
  mappings: ColumnMappings,
  settings: ImportSettings,
): ColumnReview[] => {
  const firstByKey = new Map<string, SheetColumn>();
  return columns.map((column) => {
    const mapping = mappings[column.index] ?? { target: SKIP, source: "auto" as const };
    const key = targetKey(mapping.target, settings);
    if (key) {
      const first = firstByKey.get(key);
      if (first) return { column, mapping, state: "duplicate", duplicateOf: first.header };
      firstByKey.set(key, column);
      return { column, mapping, state: "matched", duplicateOf: null };
    }
    return {
      column,
      mapping,
      state: column.nameId || mapping.source !== "auto" ? "skipped" : "notMapped",
      duplicateOf: null,
    };
  });
};

/** What has to change before the rows can be read. */
export const mappingProblems = (reviews: ColumnReview[], settings: ImportSettings): string[] => {
  const problems: string[] = [];
  if (!reviews.some((r) => r.state === "matched" && r.mapping.target.field === "name")) {
    problems.push("Choose the column that holds the Name.");
  }
  for (const review of reviews) {
    if (review.state !== "duplicate") continue;
    problems.push(
      `“${review.duplicateOf}” and “${review.column.header}” are both mapped to ${targetLabel(review.mapping.target, settings)}. Choose Don't import for one of them.`,
    );
  }
  return problems;
};

/** First-row sample as shown on Map columns; Tax IDs show only their last 4. */
export const sampleText = (review: ColumnReview): string => {
  const { sample, header } = review.column;
  if (!sample) return "";
  const isTaxId = review.mapping.target.field === "taxId" || guessColumn(header).target?.field === "taxId";
  if (!isTaxId) return sample;
  const format = /^\d{3}-\d{2}-\d{4}$/.test(sample) ? "ssn" : /^\d{2}-\d{7}$/.test(sample) ? "ein" : null;
  return maskTaxId(sample, format);
};

// ── Reading rows ─────────────────────────────────────────────────────────────

export type IssueCode =
  | "missingName"
  | "nameTooLong"
  | "badZip"
  | "badState"
  | "badTaxId"
  | "badEmail"
  | "badPhone"
  | "fieldTooLong"
  | "badTaxType"
  | "badStatus"
  | "badW9"
  | "incompleteAddress"
  | "ambiguousMatch";

/** How each problem reads in a count, e.g. "3 missing Name". */
export const ISSUE_LABELS: Record<IssueCode, string> = {
  missingName: "missing Name",
  nameTooLong: "Name over 100 characters",
  badZip: "bad Zip",
  badState: "bad State",
  badTaxId: "bad Tax ID",
  badEmail: "bad Email Address",
  badPhone: "bad Phone Number",
  fieldTooLong: "text too long",
  badTaxType: "unknown Tax Type",
  badStatus: "unknown Active Status",
  badW9: "unknown W-9 on File",
  incompleteAddress: "incomplete address",
  ambiguousMatch: "matching more than one contact",
};

export interface RowIssue {
  code: IssueCode;
  message: string;
}

export interface ImportAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  /** A State or Zip that couldn't be read, already reported as an error. */
  hasBadPart: boolean;
}

export interface ImportRecord {
  rowNumber: number;
  name: string;
  nameLine2: string;
  /** As imported: the row's types, or the "If Classification Type is blank" choice. */
  classifications: string[];
  /** The row had its own classification types. */
  classificationsGiven: boolean;
  newCustomTypes: string[];
  /** By address type; only types the row has a value for. */
  addresses: Record<string, ImportAddress>;
  /** By phone type. */
  phones: Record<string, string>;
  email: string;
  isActive: boolean | null;
  taxType: string;
  taxIdDigits: string;
  w9OnFile: boolean | null;
  comments: string;
  errors: RowIssue[];
  warnings: string[];
}

const squish = (value: string) => value.replace(/\s+/g, " ").trim();
const compact = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const STATE_CODES = new Set(STATES);
const STATE_NAMES: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  NEWHAMPSHIRE: "NH",
  NEWJERSEY: "NJ",
  NEWMEXICO: "NM",
  NEWYORK: "NY",
  NORTHCAROLINA: "NC",
  NORTHDAKOTA: "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  RHODEISLAND: "RI",
  SOUTHCAROLINA: "SC",
  SOUTHDAKOTA: "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  WESTVIRGINIA: "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

/** "TX", "tx", "Texas" → "TX"; null when it isn't one of the states the address form offers. */
const readState = (raw: string): string | null => {
  const code = compact(raw);
  return STATE_CODES.has(code) ? code : (STATE_NAMES[code] ?? null);
};

/** "79701", "79701-4412" or "797014412"; a 4- or 8-digit Zip gets back the leading zero Excel drops
 * from numbers (01234 → 1234). */
const readZip = (raw: string): { value: string; padded: boolean } | null => {
  const text = raw.replace(/\s/g, "");
  const full = /^(\d{5})-?(\d{4})?$/.exec(text);
  if (full) return { value: full[2] ? `${full[1]}-${full[2]}` : full[1], padded: false };
  const short = /^(\d{4})(?:-?(\d{4}))?$/.exec(text);
  if (short) return { value: short[2] ? `0${short[1]}-${short[2]}` : `0${short[1]}`, padded: true };
  return null;
};

const TAX_TYPE_BY_KEY = new Map<string, string>([
  ...TAX_TYPES.map((type) => [compact(type), type] as [string, string]),
  ...aliasMap<string>([
    ["Individual/Sole Proprietor", ["IND", "INDIV", "INDIVIDUAL", "SOLEPROP", "SOLEPROPRIETOR", "SOLEPROPRIETORSHIP"]],
    ["C-Corp", ["CORP", "CORPORATION", "CCORPORATION"]],
    ["S-Corp", ["SCORPORATION"]],
    ["Partnership", ["PART", "PTNR", "PARTNER", "LP", "LLP", "GP", "GENERALPARTNERSHIP", "LIMITEDPARTNERSHIP"]],
    ["Trust/Estate", ["TRUST", "ESTATE", "EST", "TRUSTORESTATE", "ESTATETRUST"]],
    ["LLC (C-Corp)", ["LLCC", "LLCCCORPORATION"]],
    ["LLC (S-Corp)", ["LLCS", "LLCSCORPORATION"]],
    ["LLC (Partnership)", ["LLCP", "LLCPART"]],
  ]),
]);

const YES = ["Y", "YES", "TRUE", "1"];
const NO = ["N", "NO", "FALSE", "0"];
const ACTIVE_WORDS = new Set(["A", "ACTIVE", ...YES]);
const INACTIVE_WORDS = new Set(["I", "INACTIVE", ...NO]);
const W9_YES = new Set([...YES, "X", "ONFILE", "RECEIVED"]);
const W9_NO = new Set([...NO, "NOTONFILE"]);

const readFlag = (raw: string, yes: Set<string>, no: Set<string>): boolean | null => {
  const key = compact(raw);
  return yes.has(key) ? true : no.has(key) ? false : null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_EXTENSION = /\s*(?:x|ext\.?|extension)\s*(\d+)\s*$/i;

/** "432.555.1234" → "(432) 555-1234", the shape the Contacts form's phone field suggests; null when
 * it isn't a 10-digit number (an optional leading 1 is dropped). */
const formatPhone = (raw: string): string | null => {
  const extension = PHONE_EXTENSION.exec(raw)?.[1];
  let digits = raw.replace(PHONE_EXTENSION, "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}${extension ? ` x${extension}` : ""}`;
};

const SCIENTIFIC_NOTATION = /^\d+(\.\d+)?E[+-]?\d+$/i;

const quoted = (values: string[]) => listJoin(values.map((v) => `“${v}”`));

const customTypesWarning = (types: string[]) =>
  types.length === 1
    ? `${quoted(types)} isn't a classification type yet, so it's added as a custom type`
    : `${quoted(types)} aren't classification types yet, so they're added as custom types`;

const emptyAddress = (): ImportAddress => ({ line1: "", line2: "", city: "", state: "", zip: "", hasBadPart: false });

const readRecord = (
  row: SheetRow,
  mapped: ColumnReview[],
  settings: ImportSettings,
  knownTypes: Set<string>,
): ImportRecord => {
  const record: ImportRecord = {
    rowNumber: row.rowNumber,
    name: "",
    nameLine2: "",
    classifications: [],
    classificationsGiven: false,
    newCustomTypes: [],
    addresses: {},
    phones: {},
    email: "",
    isActive: null,
    taxType: "",
    taxIdDigits: "",
    w9OnFile: null,
    comments: "",
    errors: [],
    warnings: [],
  };
  const error = (code: IssueCode, message: string) => record.errors.push({ code, message });
  const addressOf = (type: string) => {
    if (!record.addresses[type]) record.addresses[type] = emptyAddress();
    return record.addresses[type];
  };

  for (const { column, mapping } of mapped) {
    const raw = (row.cells[column.index] ?? "").trim();
    if (!raw) continue;
    const { field } = mapping.target;
    const addressType = mapping.target.type ?? settings.defaultAddressType;

    switch (field) {
      case "name":
        record.name = squish(raw);
        break;
      case "nameLine2":
        record.nameLine2 = squish(raw);
        break;
      case "classifications": {
        const types: string[] = [];
        for (const token of raw.split(/[;,|]/)) {
          const type = normalizeClassification(token);
          if (type && !types.includes(type)) types.push(type);
        }
        record.classifications = types;
        record.classificationsGiven = types.length > 0;
        record.newCustomTypes = types.filter((type) => !knownTypes.has(type));
        break;
      }
      case "address":
        addressOf(addressType).line1 = squish(raw);
        break;
      case "addressLine2":
        addressOf(addressType).line2 = squish(raw);
        break;
      case "city":
        addressOf(addressType).city = squish(raw);
        break;
      case "state": {
        const code = readState(raw);
        if (code) addressOf(addressType).state = code;
        else {
          addressOf(addressType).hasBadPart = true;
          error("badState", `${addressType} State “${raw}” isn't a US state`);
        }
        break;
      }
      case "zip": {
        const zip = readZip(raw);
        if (!zip) {
          addressOf(addressType).hasBadPart = true;
          error("badZip", `${addressType} Zip “${raw}” isn't 5 digits or ZIP+4`);
        } else {
          addressOf(addressType).zip = zip.value;
          if (zip.padded) record.warnings.push(`${addressType} Zip ${raw} is read as ${zip.value} (Excel drops leading zeros)`);
        }
        break;
      }
      case "phone": {
        const type = mapping.target.type ?? DEFAULT_PHONE_TYPE;
        if (SCIENTIFIC_NOTATION.test(raw)) {
          error("badPhone", `${type} phone was shortened by Excel (${raw}). Format the column as Text in Excel and save the CSV again`);
          break;
        }
        const formatted = formatPhone(raw);
        record.phones[type] = formatted ?? squish(raw);
        if (!formatted) record.warnings.push(`${type} phone “${raw}” doesn't look like a 10-digit number`);
        break;
      }
      case "email":
        if (!EMAIL_PATTERN.test(raw)) error("badEmail", `Email Address “${raw}” isn't an email address`);
        else if (raw.length > EMAIL_LIMIT) {
          error("fieldTooLong", `Email Address is ${raw.length} characters; the most CADE can save is ${EMAIL_LIMIT}`);
        } else record.email = raw;
        break;
      case "status": {
        const active = readFlag(raw, ACTIVE_WORDS, INACTIVE_WORDS);
        if (active === null) error("badStatus", `Active Status “${raw}” isn't A / I, Active / Inactive or Y / N`);
        else record.isActive = active;
        break;
      }
      case "taxType": {
        const type = TAX_TYPE_BY_KEY.get(compact(raw));
        if (type) record.taxType = type;
        else if (compact(raw) === "LLC") {
          error("badTaxType", "Tax Type “LLC” needs its tax treatment: LLC (C-Corp), LLC (S-Corp) or LLC (Partnership)");
        } else error("badTaxType", `Tax Type “${raw}” isn't one of ${listJoin(TAX_TYPES, "or")}`);
        break;
      }
      case "taxId": {
        if (SCIENTIFIC_NOTATION.test(raw)) {
          error("badTaxId", "Tax ID was shortened by Excel. Format the column as Text in Excel and save the CSV again");
          break;
        }
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 9) record.taxIdDigits = digits;
        else {
          error(
            "badTaxId",
            `Tax ID has ${digits.length} ${digits.length === 1 ? "digit" : "digits"}, not 9${
              digits.length === 8 ? ". If Excel dropped a leading zero, format the column as Text and save the CSV again" : ""
            }`,
          );
        }
        break;
      }
      case "w9": {
        const onFile = readFlag(raw, W9_YES, W9_NO);
        if (onFile === null) error("badW9", `W-9 on File “${raw}” isn't Y or N`);
        else record.w9OnFile = onFile;
        break;
      }
      case "comments":
        record.comments = raw;
        break;
      case "skip":
        break;
    }
  }

  if (record.nameLine2.length > NAME_LINE2_LIMIT) {
    error("fieldTooLong", `Name Line 2 is ${record.nameLine2.length} characters; the most CADE can save is ${NAME_LINE2_LIMIT}`);
  }
  if (!record.name) error("missingName", "Name is blank");
  else if (record.name.length > NAME_HARD_LIMIT) {
    error("nameTooLong", `Name is ${record.name.length} characters; the most CADE can save is ${NAME_HARD_LIMIT}`);
  } else if (record.name.length > NAME_MAX_LENGTH) {
    record.warnings.push(
      `Name is ${record.name.length} characters. Over ${NAME_MAX_LENGTH}, the full name may not show through a window envelope`,
    );
  }
  if (!record.classificationsGiven) record.classifications = [settings.defaultClassification];
  return record;
};

export const readRecords = (
  sheet: ParsedSheet,
  reviews: ColumnReview[],
  settings: ImportSettings,
  customTypes: string[],
): ImportRecord[] => {
  const mapped = reviews.filter((review) => review.state === "matched");
  const knownTypes = new Set([...BUILT_IN_CLASSIFICATIONS, ...customTypes.map(normalizeClassification)]);
  return sheet.rows.map((row) => readRecord(row, mapped, settings, knownTypes));
};

// ── Matching existing contacts and planning each row ─────────────────────────

/** Case, punctuation and word order don't matter: "Whitfield, Margaret L." = "MARGARET L WHITFIELD". */
export const nameKey = (name: string): string =>
  name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");

const zip5 = (zip: string) => zip.replace(/\D/g, "").slice(0, 5);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const addTo = <T,>(map: Map<string, T[]>, key: string, item: T) => {
  const list = map.get(key);
  if (!list) map.set(key, [item]);
  else if (!list.includes(item)) list.push(item);
};

interface ContactIndex {
  byTaxId: Map<string, ExistingContact[]>;
  byNameZip: Map<string, ExistingContact[]>;
  byName: Map<string, ExistingContact[]>;
}

const indexContacts = (contacts: ExistingContact[]): ContactIndex => {
  const index: ContactIndex = { byTaxId: new Map(), byNameZip: new Map(), byName: new Map() };
  for (const contact of contacts) {
    if (contact.taxIdDigits.length === 9) addTo(index.byTaxId, contact.taxIdDigits, contact);
    const key = nameKey(contact.name);
    if (!key) continue;
    addTo(index.byName, key, contact);
    for (const address of contact.addresses) {
      const zip = zip5(address.zip);
      if (zip.length === 5) addTo(index.byNameZip, `${key}|${zip}`, contact);
    }
  }
  return index;
};

export type RowStatus = "new" | "update" | "skip" | "error";
export type SkipKind = "matched" | "duplicate" | "unchanged";

export interface ReviewRow {
  rowNumber: number;
  record: ImportRecord;
  status: RowStatus;
  match: ExistingContact | null;
  matchedBy: "taxId" | "nameZip" | null;
  errors: RowIssue[];
  warnings: string[];
  /** What a New / Update row will do, or why a row is skipped. */
  note: string;
  skipKind: SkipKind | null;
  plan: ContactImportPlan | null;
}

export const canImport = (row: ReviewRow) => row.status === "new" || row.status === "update";

const byTypeOrder = <T,>(entries: Record<string, T>, order: string[]): [string, T][] =>
  Object.entries(entries).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));

const plannedAddress = (type: string, address: ImportAddress): PlannedAddress => ({
  type,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  zip: address.zip,
});

const createPlan = (record: ImportRecord): ContactImportPlan => {
  const taxInfo: NonNullable<PartyChanges["taxInfo"]> = {};
  if (record.taxType) taxInfo.taxClassification = record.taxType;
  if (record.taxIdDigits) taxInfo.taxId = formatTaxId(record.taxIdDigits, taxIdFormatFor(record.taxType));
  if (record.w9OnFile !== null) taxInfo.w9OnFile = record.w9OnFile;
  const send1099 = SEND_1099_BY_TAX_TYPE[record.taxType];
  if (send1099) taxInfo.send1099 = send1099 === "Yes";
  return {
    kind: "create",
    partyId: null,
    party: {
      partyTypes: record.classifications,
      nameFull: [record.name, record.nameLine2].filter(Boolean).join(" "),
      nameFirst: record.name,
      nameMiddle: record.nameLine2 || undefined,
      email: record.email || undefined,
      isActive: record.isActive ?? true,
      notes: record.comments || undefined,
      taxInfo: Object.keys(taxInfo).length ? taxInfo : undefined,
    },
    addressCreates: byTypeOrder(record.addresses, ADDRESS_TYPES).map(([type, address]) => plannedAddress(type, address)),
    addressUpdates: [],
    phoneCreates: byTypeOrder(record.phones, PHONE_TYPES).map(([type, number]) => ({ type, number })),
    phoneUpdates: [],
    changes: [],
    newCustomTypes: record.newCustomTypes,
    taxIdChange: record.taxIdDigits ? "entered" : null,
  };
};

const sameText = (a: string, b: string) => a.trim() === b.trim();
const sameLoose = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const sameDigits = (a: string, b: string) => a.replace(/\D/g, "") === b.replace(/\D/g, "");

const isBlankAddress = (a: { line1: string; line2: string; city: string; state: string; zip: string }) =>
  !(a.line1.trim() || a.line2.trim() || a.city.trim() || a.state.trim() || a.zip.trim());

const sameZip = (a: string, b: string) => {
  const x = a.replace(/\D/g, "");
  const y = b.replace(/\D/g, "");
  return x === y || (x.length === 5 && y.startsWith(x)) || (y.length === 5 && x.startsWith(y));
};

/** The whole address, not part by part: "Ste 200" or a Zip alone can't make it the same address. */
const sameAddress = (
  a: { line1: string; line2: string; city: string; state: string; zip: string },
  b: { line1: string; line2: string; city: string; state: string; zip: string },
) =>
  compact(a.line1) === compact(b.line1) &&
  compact(a.line2) === compact(b.line2) &&
  compact(a.city) === compact(b.city) &&
  compact(a.state) === compact(b.state) &&
  sameZip(a.zip, b.zip);

/** What a row's address does to a contact: add one, replace the one on file, leave it, or keep the
 * one on file because Fill never replaces a filled-in address. */
type AddressAction = "create" | "replace" | "same" | "keep";

const addressAction = (
  address: ImportAddress,
  current: ExistingContact["addresses"][number] | undefined,
  mode: "fill" | "overwrite",
): AddressAction => {
  if (!current) return "create";
  if (isBlankAddress(current)) return "replace";
  if (sameAddress(address, current)) return "same";
  return mode === "overwrite" ? "replace" : "keep";
};

const unionTypes = (current: string[], incoming: string[]) =>
  unique([...current, ...incoming.filter((type) => !current.includes(type))]);

/** Fill: only what's blank in CADE. Overwrite: whatever differs, except that an address is written
 * whole, notes are added to and classification types are only ever added. A blank cell never
 * changes anything. */
const updatePlan = (
  record: ImportRecord,
  contact: ExistingContact,
  mode: "fill" | "overwrite",
  warnings: string[],
): ContactImportPlan => {
  const writes = (next: string, current: string, same: (a: string, b: string) => boolean = sameText) =>
    !!next && (mode === "fill" ? !current.trim() : !same(next, current));
  const party: PartyChanges = {};
  const taxInfo: NonNullable<PartyChanges["taxInfo"]> = {};
  const changes: string[] = [];

  const nameChanged = !!record.name && (mode === "fill" ? !contact.name.trim() : nameKey(record.name) !== nameKey(contact.name));
  const line2Changed = writes(record.nameLine2, contact.nameLine2);
  if (nameChanged || line2Changed) {
    const name = nameChanged ? record.name : contact.name;
    const line2 = line2Changed ? record.nameLine2 : contact.nameLine2;
    party.nameFull = [name, line2].filter(Boolean).join(" ");
    // Contacts keeps Name Line 1 in nameFirst; a contact made elsewhere may only have nameFull.
    if (nameChanged || !contact.nameFirst) party.nameFirst = name;
    // The contact's old last name would otherwise be shown after the new name.
    if (nameChanged) party.nameLast = "";
    if (line2Changed) party.nameMiddle = line2;
    if (nameChanged) {
      changes.push("Name");
      if (contact.name.trim()) warnings.push(`Renames “${contact.name}” to “${record.name}”`);
    }
    if (line2Changed) changes.push("Name Line 2");
  }

  const incomingTypes = record.classificationsGiven || contact.partyTypes.length === 0 ? record.classifications : [];
  const mergedTypes = unionTypes(contact.partyTypes, incomingTypes);
  const addedTypes = mergedTypes.filter((type) => !contact.partyTypes.includes(type));
  if (addedTypes.length) {
    party.partyTypes = mergedTypes;
    changes.push("Classification Type");
  }
  if (writes(record.email, contact.email, sameLoose)) {
    party.email = record.email;
    changes.push("Email Address");
  }
  if (mode === "overwrite" && record.isActive !== null && record.isActive !== contact.isActive) {
    party.isActive = record.isActive;
    changes.push("Active Status");
  }
  const existingNotes = contact.notes.trim();
  if (record.comments && !existingNotes) {
    party.notes = record.comments;
    changes.push("Comments");
  } else if (mode === "overwrite" && record.comments && !existingNotes.includes(record.comments.trim())) {
    party.notes = `${existingNotes}\n\n${record.comments}`;
    changes.push("Comments (adds to notes)");
  }

  const taxTypeChanged = writes(record.taxType, contact.taxClassification);
  if (taxTypeChanged) {
    taxInfo.taxClassification = record.taxType;
    changes.push("Tax Type");
  }
  let taxIdChange: ContactImportPlan["taxIdChange"] = null;
  if (writes(record.taxIdDigits, contact.taxIdDigits, sameDigits)) {
    taxInfo.taxId = formatTaxId(
      record.taxIdDigits,
      taxIdFormatFor(taxTypeChanged ? record.taxType : contact.taxClassification),
    );
    taxIdChange = contact.taxIdDigits ? "changed" : "entered";
    changes.push("Tax ID");
  }
  if (
    record.w9OnFile !== null &&
    (mode === "fill" ? contact.w9OnFile === null : record.w9OnFile !== contact.w9OnFile)
  ) {
    taxInfo.w9OnFile = record.w9OnFile;
    changes.push("W-9 on File");
  }
  if (Object.keys(taxInfo).length) party.taxInfo = taxInfo;

  const addressCreates: PlannedAddress[] = [];
  const addressUpdates: PlannedAddressUpdate[] = [];
  for (const [type, address] of byTypeOrder(record.addresses, ADDRESS_TYPES)) {
    const current = contact.addresses.find((a) => a.type === type);
    const action = addressAction(address, current, mode);
    if (action === "create") {
      addressCreates.push(plannedAddress(type, address));
      changes.push(`${type} address`);
    } else if (action === "replace" && current) {
      addressUpdates.push({
        type,
        addressId: current.addressId,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        stateCode: address.state,
        postalCode: address.zip,
      });
      changes.push(`${type} address`);
    } else if (action === "keep") {
      warnings.push(`${type} address differs from the one on file — kept the existing one`);
    }
  }

  const phoneCreates: ContactImportPlan["phoneCreates"] = [];
  const phoneUpdates: ContactImportPlan["phoneUpdates"] = [];
  for (const [type, number] of byTypeOrder(record.phones, PHONE_TYPES)) {
    const current = contact.phones.find((p) => p.type === type);
    if (!current) {
      phoneCreates.push({ type, number });
      changes.push(`${type} phone`);
    } else if (writes(number, current.number, sameDigits)) {
      phoneUpdates.push({ type, phoneId: current.phoneId, number });
      changes.push(`${type} phone`);
    }
  }

  return {
    kind: "update",
    partyId: contact.id,
    party,
    addressCreates,
    addressUpdates,
    phoneCreates,
    phoneUpdates,
    changes,
    newCustomTypes: record.newCustomTypes.filter((type) => addedTypes.includes(type)),
    taxIdChange,
  };
};

const contactLabel = (contact: ExistingContact) => `${contact.nameId} ${contact.name}`.trim();

/** Matches each row to an existing contact (Tax ID first, then Name + Zip), decides its status and
 * works out what it will write. A contact matched by an earlier row, or a second row with the same
 * Tax ID or Name + Zip, is skipped so one import never creates or updates the same contact twice. */
export const buildReviewRows = (
  records: ImportRecord[],
  contacts: ExistingContact[],
  settings: ImportSettings,
): ReviewRow[] => {
  const index = indexContacts(contacts);
  const firstRowFor = new Map<string, number>();
  const nameZipRows = new Map<string, { rowNumber: number; taxId: string }[]>();
  const firstRowWithName = new Map<string, number>();

  return records.map((record): ReviewRow => {
    const errors = [...record.errors];
    const warnings = [...record.warnings];
    const zips = unique(
      Object.values(record.addresses)
        .map((a) => zip5(a.zip))
        .filter((zip) => zip.length === 5),
    );
    let match: ExistingContact | null = null;
    let matchedBy: ReviewRow["matchedBy"] = null;

    if (record.taxIdDigits) {
      const hits = index.byTaxId.get(record.taxIdDigits) ?? [];
      if (hits.length === 1) {
        match = hits[0];
        matchedBy = "taxId";
      } else if (hits.length > 1) {
        errors.push({
          code: "ambiguousMatch",
          message: `Tax ID matches ${hits.length} contacts (${listJoin(hits.map((h) => h.nameId))})`,
        });
      }
    }

    const key = record.name ? nameKey(record.name) : "";
    if (!match && key && !errors.some((e) => e.code === "ambiguousMatch")) {
      const hits = unique(zips.flatMap((zip) => index.byNameZip.get(`${key}|${zip}`) ?? []));
      const sameTaxId = hits.filter((h) => !record.taxIdDigits || !h.taxIdDigits || h.taxIdDigits === record.taxIdDigits);
      if (sameTaxId.length === 1) {
        match = sameTaxId[0];
        matchedBy = "nameZip";
      } else if (sameTaxId.length > 1) {
        errors.push({
          code: "ambiguousMatch",
          message: `Name and Zip match ${sameTaxId.length} contacts (${listJoin(sameTaxId.map((h) => h.nameId))})`,
        });
      } else if (hits.length) {
        warnings.push(`${hits[0].nameId} has the same Name and Zip but a different Tax ID, so this row adds a new contact`);
      } else {
        const sameName = index.byName.get(key) ?? [];
        if (sameName.length) {
          warnings.push(
            `${sameName.length === 1 ? `${sameName[0].nameId} has` : `${sameName.length} contacts have`} the same name${
              zips.length ? " but a different Zip" : ""
            }, so this row adds a new contact. Untick it if it's the same contact`,
          );
        }
      }
    }

    const skipsMatches = match && settings.onMatch === "skip";
    if (!skipsMatches) {
      const mode = settings.onMatch === "overwrite" ? "overwrite" : "fill";
      for (const [type, address] of byTypeOrder(record.addresses, ADDRESS_TYPES)) {
        if (address.hasBadPart) continue;
        const action = addressAction(address, match?.addresses.find((a) => a.type === type), mode);
        if (action === "same" || action === "keep") continue;
        const missing = [!address.line1 && "Address", !address.city && "City", !address.state && "State"].filter(
          (part): part is string => !!part,
        );
        if (missing.length) {
          errors.push({ code: "incompleteAddress", message: `${type} address is missing ${listJoin(missing)}` });
        }
      }
    }

    const base = { rowNumber: record.rowNumber, record, match, matchedBy, warnings };
    if (errors.length) return { ...base, status: "error", errors, note: "", skipKind: null, plan: null };

    // Rows with different Tax IDs are different contacts even when the name and Zip agree.
    const nameZipKeys = key ? zips.map((zip) => `${key}|${zip}`) : [];
    let first: number | undefined;
    if (match) first = firstRowFor.get(`id:${match.id}`);
    else {
      if (record.taxIdDigits) first = firstRowFor.get(`tax:${record.taxIdDigits}`);
      for (const nameZip of nameZipKeys) {
        if (first !== undefined) break;
        first = (nameZipRows.get(nameZip) ?? []).find(
          (other) => !other.taxId || !record.taxIdDigits || other.taxId === record.taxIdDigits,
        )?.rowNumber;
      }
    }
    if (first !== undefined) {
      return {
        ...base,
        status: "skip",
        errors,
        note: `Same contact as row ${first}, which is imported instead`,
        skipKind: "duplicate",
        plan: null,
      };
    }
    if (match) firstRowFor.set(`id:${match.id}`, record.rowNumber);
    else {
      if (record.taxIdDigits) firstRowFor.set(`tax:${record.taxIdDigits}`, record.rowNumber);
      for (const nameZip of nameZipKeys) {
        const rowsForKey = nameZipRows.get(nameZip) ?? [];
        rowsForKey.push({ rowNumber: record.rowNumber, taxId: record.taxIdDigits });
        nameZipRows.set(nameZip, rowsForKey);
      }
    }
    // Without a Tax ID or Zip two rows can't be told apart, so a repeated name is only pointed out.
    const sameNameRow = firstRowWithName.get(key);
    if (sameNameRow === undefined) firstRowWithName.set(key, record.rowNumber);
    else if (!match) warnings.push(`Same name as row ${sameNameRow}. Untick one if they're the same contact`);

    const by = matchedBy === "taxId" ? "by Tax ID" : "by Name + Zip";
    if (match && settings.onMatch === "skip") {
      return {
        ...base,
        status: "skip",
        errors,
        note: `Matches ${contactLabel(match)} ${by}, and matching rows are skipped`,
        skipKind: "matched",
        plan: null,
      };
    }
    if (!match) {
      const plan = createPlan(record);
      if (plan.newCustomTypes.length) warnings.push(customTypesWarning(plan.newCustomTypes));
      if (!plan.addressCreates.length) {
        warnings.push("Has no address. Its record asks for one the next time it's edited and saved");
      }
      return { ...base, status: "new", errors, note: "Adds a new contact", skipKind: null, plan };
    }

    const plan = updatePlan(record, match, settings.onMatch === "overwrite" ? "overwrite" : "fill", warnings);
    if (plan.newCustomTypes.length) warnings.push(customTypesWarning(plan.newCustomTypes));
    if (!plan.changes.length) {
      return {
        ...base,
        status: "skip",
        errors,
        note: `Matches ${contactLabel(match)} ${by}; ${settings.onMatch === "fill" ? "nothing blank to fill in" : "nothing differs"}`,
        skipKind: "unchanged",
        plan: null,
      };
    }
    return {
      ...base,
      status: "update",
      errors,
      note: `${settings.onMatch === "fill" ? "Fills in" : "Updates"} ${listJoin(plan.changes)} on ${contactLabel(match)} (matched ${by})`,
      skipKind: null,
      plan,
    };
  });
};

// ── Counting and display ─────────────────────────────────────────────────────

export interface ReviewCounts {
  new: number;
  update: number;
  skip: number;
  error: number;
  /** Rows matched to a contact already in CADE, whatever their status. */
  matched: number;
}

export const countRows = (rows: ReviewRow[]): ReviewCounts => {
  const counts: ReviewCounts = { new: 0, update: 0, skip: 0, error: 0, matched: 0 };
  for (const row of rows) {
    counts[row.status] += 1;
    if (row.match) counts.matched += 1;
  }
  return counts;
};

/** "3 missing Name, 2 bad Zip": rows per kind of error, most common first. */
export const summarizeErrors = (rows: ReviewRow[]): string => {
  const counts = new Map<IssueCode, number>();
  for (const row of rows) {
    for (const code of unique(row.errors.map((e) => e.code))) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => `${count.toLocaleString("en-US")} ${ISSUE_LABELS[code]}`)
    .join(", ");
};

/** "City, ST 79701" (with the street when there's room), from the Physical address or the first one. */
export const addressSummary = (record: ImportRecord): string => {
  const [, address] =
    byTypeOrder(record.addresses, ADDRESS_TYPES).find(([, a]) => a.line1 || a.city || a.state || a.zip) ?? [];
  if (!address) return "";
  const stateZip = [address.state, address.zip].filter(Boolean).join(" ");
  return [address.line1, address.city, stateZip].filter(Boolean).join(", ");
};

export const maskedTaxId = (record: ImportRecord): string =>
  record.taxIdDigits ? maskTaxId(record.taxIdDigits, taxIdFormatFor(record.taxType)) : "";

/** The file's own columns for the rows that need fixing, plus where each came from and why. */
export const buildRowsToFixCsv = (sheet: ParsedSheet, problems: { rowNumber: number; message: string }[]): string => {
  const byRow = new Map(sheet.rows.map((row) => [row.rowNumber, row]));
  const header = [...sheet.columns.map((c) => c.header), "Row", "Problem"];
  const rows = [...problems]
    .sort((a, b) => a.rowNumber - b.rowNumber)
    .map((problem) => [
      ...sheet.columns.map((c) => byRow.get(problem.rowNumber)?.cells[c.index] ?? ""),
      String(problem.rowNumber),
      problem.message,
    ]);
  // The BOM tells Excel the file is UTF-8, so names with accents open correctly.
  return "﻿" + toCsv([header, ...rows]) + "\r\n";
};

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/** ["A", "B", "C"] → "A, B and C" */
export const listJoin = (items: string[], last = "and"): string =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
