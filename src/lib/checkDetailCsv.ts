import { normalizeHeader, parseCsvWithDelimiter, toCsv } from "@/lib/csv";
import {
  MAX_DEDUCTS,
  MAX_TAXES,
  RevenueLineInput,
  RevenueTaxDeduct,
  formatMoney,
  normalizeLabel,
  parseProdDate,
  roundCents,
  sumCents,
} from "@/types/revenue";

const range = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

/** The standard check detail layout (one detail line per row), in order. */
export const CHECK_DETAIL_HEADERS: string[] = [
  "Operator Name",
  "Owner Name",
  "Owner Number",
  "Check Number",
  "Check Date",
  "Check Amount",
  "Operator CC",
  "Property Description",
  "Product Code Description",
  "Interest Type",
  "Owner Percent",
  "Distribution Percent",
  "Prod Date",
  "Price",
  "BTU Factor",
  "Gross Volume",
  "Gross Value",
  "Gross Taxes",
  "Gross Deducts",
  "Net Value",
  "Owner Volume",
  "Owner Value",
  "Owner Taxes",
  "Owner Deducts",
  "Owner Net Value",
  ...range(MAX_TAXES).flatMap((n) => [`Tax Type ${n}`, `Gross Tax ${n}`, `Net Tax ${n}`]),
  ...range(MAX_DEDUCTS).flatMap((n) => [`Deduct Type ${n}`, `Gross Deduct ${n}`, `Net Deduct ${n}`]),
  "Detail Line Notation",
];

export interface CheckDetailRowError {
  /** Spreadsheet row number, as Excel shows it (the header is usually row 1). */
  row: number;
  message: string;
}

export interface CheckDetailCheck {
  /** Operator Name + Check Number + Check Date; rows that share it are one check. */
  key: string;
  operatorName: string;
  ownerName: string;
  ownerNumber: string;
  checkNumber: string;
  /** "2026-10-27" */
  checkDate: string;
  checkAmount: number;
  lines: RevenueLineInput[];
  /** The spreadsheet row each line came from, in the same order as lines. */
  rows: number[];
}

export interface CheckDetailParseResult {
  checks: CheckDetailCheck[];
  /** Spreadsheet row of the column names; null when none was found. */
  headerRow: number | null;
  /** Non-blank rows under the header, whether read, ignored or left out. */
  rowCount: number;
  lineCount: number;
  errors: CheckDetailRowError[];
  /** Rows with no Operator Name, Check Number or amounts, e.g. a list of labels under the data. */
  ignoredRows: number[];
  /** Things worth a look that don't stop a row from being read. */
  warnings: string[];
  /** Rows left out of the checks because they have errors. */
  skippedRows: number[];
  /** Standard columns the file doesn't have; their values are left blank. */
  missingColumns: string[];
  /** Columns in the file that aren't part of the standard layout. */
  unusedColumns: string[];
  /** Why nothing could be read (empty file, no header row, a required column missing). */
  fatal: string | null;
}

// ── Values ───────────────────────────────────────────────────────────────────

const SCIENTIFIC = /^(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/;

/** Reads "1,234.56", "$1,234.56", "(132.11)", "-$132.11", "132.11-" (some exports put the sign
 * last) or "1.2345E-05"; null when it isn't a number. A trailing % is dropped, and a lone "-"
 * (Excel's accounting format for zero) reads as 0. Commas only count as thousands separators
 * ("1,23,4" isn't a number), except with decimalComma (a ";"-delimited file), where "," is the
 * decimal point and "." may group thousands. */
export const parseAmount = (raw: string, decimalComma = false): number | null => {
  let text = raw.replace(/[$\s%]/g, "");
  if (text === "-") return 0;
  let sign = 1;
  if (text.startsWith("(") && text.endsWith(")")) {
    sign = -1;
    text = text.slice(1, -1);
  }
  if (text.startsWith("-")) {
    sign = -sign;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }
  if (text.endsWith("-")) {
    sign = -sign;
    text = text.slice(0, -1);
  }

  if (decimalComma) {
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, "").replace(",", ".");
    else text = text.replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    text = text.replace(/,/g, "");
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text) && !SCIENTIFIC.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? sign * value + 0 : null;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Excel's pivot for two-digit years: 00-29 is 2000s, 30-99 is 1900s. */
const fullYear = (text: string) => (text.length === 2 ? (+text <= 29 ? 2000 + +text : 1900 + +text) : +text);

/** "10/27/2026", "10-27-26", "27-Oct-26", "27-Oct-2026" or "2026-10-27" (a time after it is
 * ignored) → "2026-10-27"; null when it isn't a real date. */
export const parseCheckDate = (raw: string): string | null => {
  const text = raw.trim().replace(/[ T]\d{1,2}:\d{2}.*$/, "");
  let year: number;
  let month: number;
  let day: number;
  const us = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const named = /^(\d{1,2})[-\s/.]+([A-Za-z]{3,9})\.?[-\s/.,]+(\d{2}|\d{4})$/.exec(text);
  if (us) {
    month = +us[1];
    day = +us[2];
    year = fullYear(us[3]);
  } else if (iso) {
    year = +iso[1];
    month = +iso[2];
    day = +iso[3];
  } else if (named) {
    day = +named[1];
    month = MONTHS.indexOf(named[2].slice(0, 3).toLowerCase()) + 1;
    year = fullYear(named[3]);
    if (!month) return null;
  } else {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

// ── Columns ──────────────────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string> = {
  operator: "operatorname",
  owner: "ownername",
  ownerno: "ownernumber",
  checkno: "checknumber",
  checkamt: "checkamount",
  cc: "operatorcc",
  property: "propertydescription",
  propertyname: "propertydescription",
  product: "productcodedescription",
  productcode: "productcodedescription",
  productdescription: "productcodedescription",
  productiondate: "proddate",
  btu: "btufactor",
  notation: "detaillinenotation",
  detailnotation: "detaillinenotation",
};

const canonicalHeader = (header: string) => {
  const key = normalizeHeader(header);
  return HEADER_ALIASES[key] ?? key;
};

type TextField =
  | "operatorName"
  | "ownerName"
  | "ownerNumber"
  | "checkNumber"
  | "operatorCc"
  | "propertyDescription"
  | "productCode"
  | "interestType"
  | "notation";

type NumberField =
  | "checkAmount"
  | "ownerPercent"
  | "distributionPercent"
  | "price"
  | "btuFactor"
  | "grossVolume"
  | "grossValue"
  | "grossTaxes"
  | "grossDeducts"
  | "netValue"
  | "ownerVolume"
  | "ownerValue"
  | "ownerTaxes"
  | "ownerDeducts"
  | "ownerNetValue";

type FieldId = TextField | NumberField | "checkDate" | "prodDate";

const FIELD_HEADERS: Record<FieldId, string> = {
  operatorName: "Operator Name",
  ownerName: "Owner Name",
  ownerNumber: "Owner Number",
  checkNumber: "Check Number",
  checkDate: "Check Date",
  checkAmount: "Check Amount",
  operatorCc: "Operator CC",
  propertyDescription: "Property Description",
  productCode: "Product Code Description",
  interestType: "Interest Type",
  ownerPercent: "Owner Percent",
  distributionPercent: "Distribution Percent",
  prodDate: "Prod Date",
  price: "Price",
  btuFactor: "BTU Factor",
  grossVolume: "Gross Volume",
  grossValue: "Gross Value",
  grossTaxes: "Gross Taxes",
  grossDeducts: "Gross Deducts",
  netValue: "Net Value",
  ownerVolume: "Owner Volume",
  ownerValue: "Owner Value",
  ownerTaxes: "Owner Taxes",
  ownerDeducts: "Owner Deducts",
  ownerNetValue: "Owner Net Value",
  notation: "Detail Line Notation",
};

const FIELD_IDS = Object.keys(FIELD_HEADERS) as FieldId[];

const REQUIRED_FIELDS: FieldId[] = [
  "operatorName",
  "ownerName",
  "checkNumber",
  "checkDate",
  "checkAmount",
  "productCode",
  "prodDate",
  "ownerNetValue",
];

/** Excel turns long numbers into "9.87654E+05" unless the column is formatted as Text. */
const ID_FIELDS: TextField[] = ["ownerNumber", "checkNumber", "operatorCc"];

interface EntryColumns {
  n: number;
  type?: number;
  gross?: number;
  net?: number;
}

interface ColumnMap {
  fields: Partial<Record<FieldId, number>>;
  taxes: EntryColumns[];
  deducts: EntryColumns[];
}

const buildColumnMap = (header: string[]) => {
  const indexByKey = new Map<string, number>();
  const unused: string[] = [];
  header.forEach((name, index) => {
    const key = canonicalHeader(name);
    if (!key) return;
    if (indexByKey.has(key)) unused.push(name.trim());
    else indexByKey.set(key, index);
  });

  const take = (key: string) => {
    const index = indexByKey.get(key);
    indexByKey.delete(key);
    return index;
  };

  const fields: ColumnMap["fields"] = {};
  for (const id of FIELD_IDS) fields[id] = take(normalizeHeader(FIELD_HEADERS[id]));

  const entryColumns = (count: number, type: string, gross: string, net: string) =>
    range(count).map((n) => ({
      n,
      type: take(`${type}${n}`),
      gross: take(`${gross}${n}`),
      net: take(`${net}${n}`),
    }));

  const map: ColumnMap = {
    fields,
    taxes: entryColumns(MAX_TAXES, "taxtype", "grosstax", "nettax"),
    deducts: entryColumns(MAX_DEDUCTS, "deducttype", "grossdeduct", "netdeduct"),
  };
  for (const index of Array.from(indexByKey.values())) unused.push(header[index].trim());
  return { map, unused };
};

const isHeaderRow = (record: string[]) => {
  const keys = new Set(record.map(canonicalHeader));
  return keys.has("operatorname") && keys.has("checknumber");
};

// Operator files sometimes open with a title or report-date line above the column names.
const HEADER_SEARCH_ROWS = 10;

// ── Rows ─────────────────────────────────────────────────────────────────────

interface ParsedRow {
  operatorName: string;
  ownerName: string;
  ownerNumber: string;
  checkNumber: string;
  checkDate: string;
  checkAmount: number;
  line: RevenueLineInput;
}

const AMOUNT_FIELDS: NumberField[] = [
  "checkAmount",
  "ownerPercent",
  "distributionPercent",
  "price",
  "btuFactor",
  "grossVolume",
  "grossValue",
  "grossTaxes",
  "grossDeducts",
  "netValue",
  "ownerVolume",
  "ownerValue",
  "ownerTaxes",
  "ownerDeducts",
  "ownerNetValue",
];

const hasAmounts = (record: string[], columns: ColumnMap) => {
  const indexes = [
    ...AMOUNT_FIELDS.map((id) => columns.fields[id]),
    ...[...columns.taxes, ...columns.deducts].flatMap((c) => [c.gross, c.net]),
  ];
  return indexes.some((index) => index != null && (record[index] ?? "").trim() !== "");
};

const isBlank = (record: string[]) => record.every((cell) => !cell.trim());

const readRow = (
  record: string[],
  columns: ColumnMap,
  decimalComma: boolean,
): { row: ParsedRow | null; errors: string[] } => {
  const errors: string[] = [];
  const cell = (index: number | undefined) => (index == null ? "" : (record[index] ?? "").trim());
  const text = (id: TextField) => cell(columns.fields[id]).replace(/\s+/g, " ");

  for (const id of REQUIRED_FIELDS) {
    if (!cell(columns.fields[id])) errors.push(`${FIELD_HEADERS[id]} is blank`);
  }

  for (const id of ID_FIELDS) {
    const raw = text(id);
    if (/^\d+(\.\d+)?E[+-]?\d+$/i.test(raw)) {
      errors.push(
        `${FIELD_HEADERS[id]} "${raw}" was shortened by Excel. Format that column as Text in Excel and save the CSV again`,
      );
    }
  }

  const amount = (raw: string, name: string): number | null => {
    if (!raw) return null;
    const value = parseAmount(raw, decimalComma);
    if (value === null) errors.push(`${name} "${raw}" isn't a number`);
    return value;
  };
  const num = (id: NumberField) => amount(cell(columns.fields[id]), FIELD_HEADERS[id]);

  const operatorCc = text("operatorCc");
  const propertyDescription = text("propertyDescription");
  if (!operatorCc && !propertyDescription) errors.push("Operator CC and Property Description are both blank");

  const checkDateRaw = cell(columns.fields.checkDate);
  const checkDate = checkDateRaw ? parseCheckDate(checkDateRaw) : null;
  if (checkDateRaw && !checkDate) errors.push(`Check Date "${checkDateRaw}" isn't a date (like 10/27/2026 or 27-Oct-26)`);

  const prodDateRaw = cell(columns.fields.prodDate);
  const prodDate = prodDateRaw ? parseProdDate(prodDateRaw) : null;
  if (prodDateRaw && !prodDate) errors.push(`Prod Date "${prodDateRaw}" isn't a month and year (like 0326)`);

  const entries = (list: EntryColumns[], kind: "Tax" | "Deduct"): RevenueTaxDeduct[] =>
    list.flatMap(({ n, type, gross, net }) => {
      const label = cell(type).replace(/\s+/g, " ");
      const grossRaw = cell(gross);
      const netRaw = cell(net);
      const grossValue = amount(grossRaw, `Gross ${kind} ${n}`);
      const netValue = amount(netRaw, `Net ${kind} ${n}`);
      if (!grossRaw && !netRaw) return [];
      if (!label) {
        errors.push(`Gross ${kind} ${n} / Net ${kind} ${n} have an amount but ${kind} Type ${n} is blank`);
        return [];
      }
      return [{ label, gross: grossValue ?? 0, net: netValue ?? 0 }];
    });

  const taxes = entries(columns.taxes, "Tax");
  const deducts = entries(columns.deducts, "Deduct");

  const checkAmount = num("checkAmount");
  const ownerPercent = num("ownerPercent");
  const distributionPercent = num("distributionPercent");
  const price = num("price");
  const btuFactor = num("btuFactor");
  const grossVolume = num("grossVolume");
  const grossValue = num("grossValue") ?? 0;
  const grossTaxes = num("grossTaxes") ?? sumCents(taxes.map((t) => t.gross));
  const grossDeducts = num("grossDeducts") ?? sumCents(deducts.map((d) => d.gross));
  const netValue = num("netValue") ?? sumCents([grossValue, grossTaxes, grossDeducts]);
  const ownerVolume = num("ownerVolume");
  const ownerValueRaw = num("ownerValue");
  const ownerTaxes = num("ownerTaxes") ?? sumCents(taxes.map((t) => t.net));
  const ownerDeducts = num("ownerDeducts") ?? sumCents(deducts.map((d) => d.net));
  const ownerNetValue = num("ownerNetValue");
  const ownerValue = ownerValueRaw ?? (ownerNetValue === null ? 0 : roundCents(ownerNetValue - ownerTaxes - ownerDeducts));

  if (errors.length || checkAmount === null || ownerNetValue === null || !checkDate || !prodDate) {
    return { row: null, errors };
  }

  return {
    errors,
    row: {
      operatorName: text("operatorName"),
      ownerName: text("ownerName"),
      ownerNumber: text("ownerNumber"),
      checkNumber: text("checkNumber"),
      checkDate,
      checkAmount: roundCents(checkAmount),
      line: {
        operatorCc,
        propertyDescription,
        wellId: null,
        wellLabel: null,
        productCode: text("productCode"),
        interestType: text("interestType"),
        ownerPercent: ownerPercent ?? 0,
        distributionPercent: distributionPercent ?? 0,
        prodDate,
        price: price ?? 0,
        btuFactor,
        grossVolume: grossVolume ?? 0,
        grossValue,
        grossTaxes,
        grossDeducts,
        netValue,
        ownerVolume: ownerVolume ?? 0,
        ownerValue,
        ownerTaxes,
        ownerDeducts,
        ownerNetValue,
        taxes,
        deducts,
        notation: text("notation"),
      },
    },
  };
};

export const checkGroupKey = (row: Pick<ParsedRow, "operatorName" | "checkNumber" | "checkDate">) =>
  [normalizeLabel(row.operatorName), row.checkNumber.trim(), row.checkDate].join("|");

const emptyResult = (fatal: string | null): CheckDetailParseResult => ({
  checks: [],
  headerRow: null,
  rowCount: 0,
  lineCount: 0,
  errors: [],
  ignoredRows: [],
  warnings: [],
  skippedRows: [],
  missingColumns: [],
  unusedColumns: [],
  fatal,
});

/** Reads an operator's check detail CSV in the standard layout into checks (rows grouped by
 * Operator Name + Check Number + Check Date), one detail line per row. Rows with
 * errors are reported and left out; the rest still come through. */
export const parseCheckDetailCsv = (text: string): CheckDetailParseResult => {
  const { rows: records, delimiter } = parseCsvWithDelimiter(text);
  const decimalComma = delimiter === ";";
  if (!records.some((record) => !isBlank(record))) return emptyResult("The file is empty.");

  const headerIndex = records.slice(0, HEADER_SEARCH_ROWS).findIndex(isHeaderRow);
  if (headerIndex === -1) {
    return emptyResult(
      "Couldn't find the column names. The file needs the standard check detail layout, starting with Operator Name, Owner Name, Owner Number, Check Number…",
    );
  }

  const headerRow = headerIndex + 1;
  const { map, unused } = buildColumnMap(records[headerIndex]);
  const missingRequired = REQUIRED_FIELDS.filter((id) => map.fields[id] == null).map((id) => FIELD_HEADERS[id]);
  const missingColumns = FIELD_IDS.filter((id) => map.fields[id] == null)
    .map((id) => FIELD_HEADERS[id])
    .filter((name) => !missingRequired.includes(name));
  if (!map.taxes.some((c) => c.type != null)) missingColumns.push("Tax Type 1–10");
  if (!map.deducts.some((c) => c.type != null)) missingColumns.push("Deduct Type 1–10");

  if (missingRequired.length) {
    return {
      ...emptyResult(
        `The file is missing ${missingRequired.length === 1 ? "a required column" : "required columns"}: ${missingRequired.join(", ")}.`,
      ),
      headerRow,
      errors: missingRequired.map((name) => ({ row: headerRow, message: `Missing required column ${name}` })),
      missingColumns,
      unusedColumns: unused,
    };
  }

  const result: CheckDetailParseResult = {
    ...emptyResult(null),
    headerRow,
    missingColumns,
    unusedColumns: unused,
  };
  const checks = new Map<string, CheckDetailCheck>();
  const datesByCheckNumber = new Map<string, { label: string; dates: Set<string> }>();

  records.slice(headerIndex + 1).forEach((record, offset) => {
    const rowNumber = headerRow + 1 + offset;
    if (isBlank(record)) return;
    result.rowCount += 1;

    const cell = (index: number | undefined) => (index == null ? "" : (record[index] ?? "").trim());
    if (!cell(map.fields.operatorName) && !cell(map.fields.checkNumber)) {
      if (!hasAmounts(record, map)) {
        result.ignoredRows.push(rowNumber);
        return;
      }
      result.skippedRows.push(rowNumber);
      result.errors.push({
        row: rowNumber,
        message: "Operator Name and Check Number are blank. This looks like a fill-down row — repeat the check header on every row",
      });
      return;
    }

    const { row, errors } = readRow(record, map, decimalComma);
    const rowErrors = [...errors];
    const key = row ? checkGroupKey(row) : "";
    const existing = row ? checks.get(key) : undefined;
    if (row && existing && Math.abs(existing.checkAmount - row.checkAmount) >= 0.005) {
      rowErrors.push(
        `Check Amount ${formatMoney(row.checkAmount)} differs from ${formatMoney(existing.checkAmount)} on row ${existing.rows[0]} for check #${row.checkNumber}`,
      );
    }

    if (row && existing) {
      const first = existing.rows[0];
      if (normalizeLabel(row.ownerName) !== normalizeLabel(existing.ownerName)) {
        rowErrors.push(
          `Owner Name "${row.ownerName}" differs from "${existing.ownerName}" on row ${first} for check #${row.checkNumber}`,
        );
      }
      if (row.ownerNumber.trim() !== existing.ownerNumber.trim()) {
        rowErrors.push(
          `Owner Number "${row.ownerNumber}" differs from "${existing.ownerNumber}" on row ${first} for check #${row.checkNumber}`,
        );
      }
    }

    if (!row || rowErrors.length) {
      result.skippedRows.push(rowNumber);
      result.errors.push(...rowErrors.map((message) => ({ row: rowNumber, message })));
      return;
    }

    result.lineCount += 1;
    const numberKey = `${normalizeLabel(row.operatorName)}|${row.checkNumber.trim()}`;
    const seen = datesByCheckNumber.get(numberKey) ?? { label: `${row.operatorName} check #${row.checkNumber}`, dates: new Set() };
    seen.dates.add(row.checkDate);
    datesByCheckNumber.set(numberKey, seen);
    if (existing) {
      existing.lines.push(row.line);
      existing.rows.push(rowNumber);
      return;
    }
    checks.set(key, {
      key,
      operatorName: row.operatorName,
      ownerName: row.ownerName,
      ownerNumber: row.ownerNumber,
      checkNumber: row.checkNumber,
      checkDate: row.checkDate,
      checkAmount: row.checkAmount,
      lines: [row.line],
      rows: [rowNumber],
    });
  });

  datesByCheckNumber.forEach(({ label, dates }) => {
    if (dates.size > 1) {
      result.warnings.push(`${label} appears with different Check Dates (${Array.from(dates).sort().join(", ")}). Each date is imported as its own check.`);
    }
  });

  result.checks = Array.from(checks.values());
  return result;
};

// ── Sample file ──────────────────────────────────────────────────────────────

const SAMPLE_ROWS: Record<string, string>[] = [
  {
    "Prod Date": "0326",
    Price: "84.20",
    "Gross Volume": "34.05",
    "Gross Value": "2867.32",
    "Gross Taxes": "-132.11",
    "Gross Deducts": "-106.46",
    "Net Value": "2628.75",
    "Owner Volume": "0.05",
    "Owner Value": "3.84",
    "Owner Taxes": "-0.18",
    "Owner Deducts": "-0.14",
    "Owner Net Value": "3.52",
    "Tax Type 1": "SEVERANCE TAX",
    "Gross Tax 1": "-132.11",
    "Net Tax 1": "-0.18",
    "Deduct Type 1": "TRANSPORTATION",
    "Gross Deduct 1": "-106.46",
    "Net Deduct 1": "-0.14",
  },
  {
    "Prod Date": "0426",
    Price: "87.89",
    "Gross Volume": "49.05",
    "Gross Value": "4311.17",
    "Gross Taxes": "-198.62",
    "Gross Deducts": "-154.47",
    "Net Value": "3958.08",
    "Owner Volume": "0.07",
    "Owner Value": "5.78",
    "Owner Taxes": "-0.27",
    "Owner Deducts": "-0.21",
    "Owner Net Value": "5.30",
    "Tax Type 1": "SEVERANCE",
    "Gross Tax 1": "-198.62",
    "Net Tax 1": "-0.27",
    "Deduct Type 1": "PROCESSING RELATED FEE",
    "Gross Deduct 1": "-154.47",
    "Net Deduct 1": "-0.21",
  },
];

const SAMPLE_CHECK: Record<string, string> = {
  "Operator Name": "SMITH OPERATING CO",
  "Owner Name": "JOHN DOE",
  "Owner Number": "123456",
  "Check Number": "987654",
  "Check Date": "10/27/2026",
  "Check Amount": "8.82",
  "Operator CC": "654654",
  "Property Description": "SMITH UNIT 1H",
  "Product Code Description": "OIL",
  "Interest Type": "ROYALTY INTEREST",
  "Owner Percent": "0.134003",
  "Distribution Percent": "0.134003",
};

/** The standard layout's column names plus two sample detail lines, for "Download sample file". */
export const buildSampleCheckDetailCsv = (): string =>
  toCsv([
    CHECK_DETAIL_HEADERS,
    ...SAMPLE_ROWS.map((sample) => CHECK_DETAIL_HEADERS.map((header) => sample[header] ?? SAMPLE_CHECK[header] ?? "")),
  ]) + "\r\n";
