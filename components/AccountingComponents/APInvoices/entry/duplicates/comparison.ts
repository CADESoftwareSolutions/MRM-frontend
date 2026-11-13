import {
  ApDuplicateMatch,
  ApDuplicateRules,
  ApInvoiceDraftInput,
  DuplicateValidation,
  daysBetweenIso,
  formatGlPeriod,
  formatIsoDate,
  formatUsd,
  roundCents,
  todayIso,
} from "@/types/apInvoices";

/** How the Match column reads for one row: a "Same" badge, a short note, or nothing. */
export type CompareVerdict = { kind: "same" } | { kind: "note"; text: string } | { kind: "none" };

export interface ComparisonRow {
  key: string;
  label: string;
  ours: string;
  theirs: string;
  verdict: CompareVerdict;
  /** The duplicate rule this row is checked by; the row is highlighted when the match was caught by it. */
  rule?: DuplicateValidation;
  numeric?: boolean;
}

const SAME: CompareVerdict = { kind: "same" };
const NONE: CompareVerdict = { kind: "none" };
const note = (text: string): CompareVerdict => ({ kind: "note", text });

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Same normalization the duplicate check uses, so "Same" here agrees with what it flagged. */
export const normalizeInvoiceNumber = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, "");

/** The viewer's calendar day for a stored timestamp, as "YYYY-MM-DD". */
export const localDateOf = (timestamp: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) return timestamp;
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return timestamp.slice(0, 10);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** "today", or "on 10/29/2026". */
export const enteredWhen = (timestamp: string): string => {
  const day = localDateOf(timestamp);
  return day === todayIso() ? "today" : `on ${formatIsoDate(day)}`;
};

export const ruleLabel = (rule: DuplicateValidation, rules: ApDuplicateRules): string =>
  rule === "Invoice #" ? "Same invoice #" : `Same amount within ${rules.windowDays} days`;

const textVerdict = (a: string, b: string): CompareVerdict => {
  if (!a || !b) return NONE;
  return a === b ? SAME : note("Different");
};

const dateVerdict = (a: string | null, b: string | null): CompareVerdict => {
  if (!a || !b) return NONE;
  const apart = daysBetweenIso(a, b);
  if (apart === null) return NONE;
  const days = Math.abs(apart);
  return days === 0 ? SAME : note(`${days} ${days === 1 ? "day" : "days"} apart`);
};

/** "2 lines · 6000-110, 1470-120", plus a key that's equal when two invoices are coded alike
 * (same line count, same accounts). */
const codingOf = (lines: { accountId: string }[], accountNumber: (id: string) => string) => {
  const ids = Array.from(new Set(lines.map((line) => line.accountId).filter(Boolean)));
  const count = lines.length;
  const text = count
    ? `${count} ${count === 1 ? "line" : "lines"}${ids.length ? ` · ${ids.map(accountNumber).join(", ")}` : ""}`
    : "";
  return { text, key: `${count}|${[...ids].sort().join(",")}` };
};

/** The rows of the side-by-side table, in display order. Status is rendered separately. */
export const buildComparisonRows = (
  draft: ApInvoiceDraftInput,
  match: ApDuplicateMatch,
  accountNumber: (id: string) => string,
): ComparisonRow[] => {
  const oursNumber = draft.invoiceNumber.trim();
  const oursAmount = roundCents(draft.invoiceAmount);
  const theirsAmount = roundCents(match.invoiceAmount);
  const oursCoding = codingOf(draft.lines, accountNumber);
  const theirsCoding = codingOf(match.lines, accountNumber);
  const oursDoc = draft.documentName ?? "";
  const theirsDoc = match.documentName ?? "";

  return [
    {
      key: "vendor",
      label: "Vendor",
      ours: draft.vendorName,
      theirs: match.vendorName,
      verdict: draft.vendorId && draft.vendorId === match.vendorId ? SAME : note("Different"),
    },
    {
      key: "invoiceNumber",
      label: "Invoice #",
      ours: oursNumber,
      theirs: match.invoiceNumber,
      verdict: textVerdict(normalizeInvoiceNumber(oursNumber), normalizeInvoiceNumber(match.invoiceNumber)),
      rule: "Invoice #",
    },
    {
      key: "invoiceAmount",
      label: "Invoice Amount",
      ours: oursAmount > 0 ? formatUsd(oursAmount) : "",
      theirs: formatUsd(theirsAmount),
      verdict: oursAmount > 0 ? (oursAmount === theirsAmount ? SAME : note("Different")) : NONE,
      rule: "Invoice Amount",
      numeric: true,
    },
    {
      key: "invoiceDate",
      label: "Invoice Date",
      ours: formatIsoDate(draft.invoiceDate),
      theirs: formatIsoDate(match.invoiceDate),
      verdict: dateVerdict(draft.invoiceDate, match.invoiceDate),
    },
    {
      key: "serviceDate",
      label: "Service Date",
      ours: formatIsoDate(draft.serviceDate),
      theirs: formatIsoDate(match.serviceDate),
      verdict: dateVerdict(draft.serviceDate, match.serviceDate),
    },
    {
      key: "glPeriod",
      label: "G/L Period",
      ours: formatGlPeriod(draft.glPeriod),
      theirs: formatGlPeriod(match.glPeriod),
      verdict: textVerdict(draft.glPeriod, match.glPeriod),
    },
    {
      key: "coding",
      label: "Coding",
      ours: oursCoding.text,
      theirs: theirsCoding.text,
      verdict: oursCoding.text && theirsCoding.text ? (oursCoding.key === theirsCoding.key ? SAME : note("Different")) : NONE,
    },
    {
      key: "document",
      label: "Document",
      ours: oursDoc,
      theirs: theirsDoc,
      verdict:
        oursDoc && theirsDoc
          ? oursDoc.toLowerCase() === theirsDoc.toLowerCase()
            ? SAME
            : note("Different file")
          : NONE,
    },
  ];
};
