import { fallbackVendorDefaults } from "@/hooks/useVendorDefaults";
import {
  ApInvoice,
  ApInvoiceDraftInput,
  ApInvoiceLine,
  PaymentTerms,
  VendorDefaults,
  dueDateFromTerms,
  formatMoney,
  roundCents,
  todayIso,
} from "@/types/apInvoices";
import type { VendorChoice } from "./vendors";

/** One coding line as the grid edits it. Amounts stay as typed text until saved. */
export interface LineDraft {
  /** Stable React key; unsaved lines have no `id` yet. */
  key: string;
  id?: string;
  accountId: string;
  wellId: string | null;
  wellLabel: string;
  afe: string;
  stage: string;
  deck: string;
  projectId: string | null;
  projectLabel: string;
  description: string;
  amount: string;
}

export interface InvoiceDraft {
  vendorId: string;
  vendorName: string;
  vendorNameId: string;
  remitTo: string[];
  apAccountId: string;
  invoiceNumber: string;
  invoiceAmount: string;
  invoiceDate: string;
  dueDate: string;
  /** False while Due Date still follows Invoice Date + the vendor's terms. */
  dueDateManual: boolean;
  glPeriod: string;
  serviceDate: string;
  type1099: string;
  box1099: string;
  stubDescription: string;
  /** The saved document's name; a newly picked File is held separately until save. */
  documentName: string | null;
  attachmentNames: string[];
  lines: LineDraft[];
}

export type AutoField = "vendor" | "invoiceNumber" | "invoiceAmount" | "invoiceDate" | "dueDate" | "serviceDate";

export const AUTO_FIELD_LABELS: Record<AutoField, string> = {
  vendor: "Vendor",
  invoiceNumber: "Invoice #",
  invoiceAmount: "Invoice Amount",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  serviceDate: "Service Date",
};

export type HeaderErrorField =
  | "vendor"
  | "invoiceNumber"
  | "invoiceAmount"
  | "invoiceDate"
  | "dueDate"
  | "glPeriod";

export type HeaderErrors = Partial<Record<HeaderErrorField, string>>;

let lineSeq = 0;
const newLineKey = () => `line-${++lineSeq}`;

/** "$12,480.00" / "12480" / "(5.00)" → number; null when blank, not a number, or more than
 * 2 decimals. */
export const parseAmount = (text: string): number | null => {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const negative = /^\(.*\)$/.test(cleaned);
  const body = negative ? cleaned.slice(1, -1) : cleaned;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(body)) return null;
  if ((body.split(".")[1] ?? "").length > 2) return null;
  const n = Number(body);
  if (!Number.isFinite(n)) return null;
  return roundCents(negative ? -n : n);
};

export const isUnparseableAmount = (text: string): boolean => !!text.trim() && parseAmount(text) === null;

export const amountOf = (text: string): number => parseAmount(text) ?? 0;

/** Reformats typed money on blur ("12480" → "12,480.00"); leaves unparseable text alone. */
export const formatAmountInput = (text: string): string => {
  const n = parseAmount(text);
  return n === null ? text.trim() : formatMoney(n);
};

export const emptyLine = (accountId = ""): LineDraft => ({
  key: newLineKey(),
  accountId,
  wellId: null,
  wellLabel: "",
  afe: "",
  stage: "",
  deck: "",
  projectId: null,
  projectLabel: "",
  description: "",
  amount: "",
});

const lineFromInvoice = (line: ApInvoiceLine): LineDraft => ({
  key: newLineKey(),
  id: line.id,
  accountId: line.accountId,
  wellId: line.wellId,
  wellLabel: line.wellLabel,
  afe: line.afe ?? "",
  stage: line.stage ?? "",
  deck: line.deck ?? "",
  projectId: line.projectId,
  projectLabel: line.projectLabel,
  description: line.description,
  amount: formatMoney(line.amount),
});

/** The G/L month an invoice books to until someone picks one: the service date's month, else
 * the invoice date's. */
export const defaultGlPeriod = (draft: Pick<InvoiceDraft, "serviceDate" | "invoiceDate">): string => {
  const month = (draft.serviceDate || draft.invoiceDate).slice(0, 7);
  return /^\d{4}-\d{2}$/.test(month) ? month : "";
};

export const newInvoiceDraft = (): InvoiceDraft => {
  const today = todayIso();
  const defaults = fallbackVendorDefaults("");
  return {
    vendorId: "",
    vendorName: "",
    vendorNameId: "",
    remitTo: [],
    apAccountId: defaults.apAccountId,
    invoiceNumber: "",
    invoiceAmount: "",
    invoiceDate: today,
    dueDate: dueDateFromTerms(today, defaults.paymentTerms),
    dueDateManual: false,
    glPeriod: today.slice(0, 7),
    serviceDate: "",
    type1099: "",
    box1099: "",
    stubDescription: "",
    documentName: null,
    attachmentNames: [],
    lines: [emptyLine()],
  };
};

export const draftFromInvoice = (invoice: ApInvoice, terms: PaymentTerms): InvoiceDraft => ({
  vendorId: invoice.vendorId,
  vendorName: invoice.vendorName,
  vendorNameId: invoice.vendorNameId,
  remitTo: invoice.remitTo,
  apAccountId: invoice.apAccountId,
  invoiceNumber: invoice.invoiceNumber,
  invoiceAmount: invoice.invoiceAmount ? formatMoney(invoice.invoiceAmount) : "",
  invoiceDate: invoice.invoiceDate,
  dueDate: invoice.dueDate,
  dueDateManual: !!invoice.dueDate && invoice.dueDate !== dueDateFromTerms(invoice.invoiceDate, terms),
  glPeriod: invoice.glPeriod,
  serviceDate: invoice.serviceDate ?? "",
  type1099: invoice.type1099 ?? "",
  box1099: invoice.box1099 ?? "",
  stubDescription: invoice.stubDescription,
  documentName: invoice.documentName,
  attachmentNames: invoice.attachmentNames,
  lines: invoice.lines.length ? invoice.lines.map(lineFromInvoice) : [emptyLine()],
});

/** Switches the vendor and applies its defaults: A/P account, 1099 type and box, the due date
 * from its terms (unless set by hand) and its expense account on lines that have none. */
export const withVendor = (draft: InvoiceDraft, vendor: VendorChoice, defaults: VendorDefaults): InvoiceDraft => {
  const expenseAccountId = defaults.defaultExpenseAccountId;
  return {
    ...draft,
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorNameId: vendor.nameId,
    remitTo: vendor.remitTo ?? [],
    apAccountId: defaults.apAccountId,
    type1099: defaults.type1099 ?? "",
    box1099: defaults.box1099 ?? "",
    dueDate: draft.dueDateManual ? draft.dueDate : dueDateFromTerms(draft.invoiceDate, defaults.paymentTerms),
    lines: expenseAccountId
      ? draft.lines.map((line) => (line.accountId ? line : { ...line, accountId: expenseAccountId }))
      : draft.lines,
  };
};

/** A line is blank when nothing but the vendor's pre-filled default account is on it and its
 * amount is zero, so an untouched row isn't saved or submitted. */
export const isBlankLine = (line: LineDraft, defaultAccountId = ""): boolean =>
  (!line.accountId || line.accountId === defaultAccountId) &&
  !line.wellId &&
  !line.wellLabel &&
  !line.afe &&
  !line.stage &&
  !line.deck &&
  !line.projectId &&
  !line.projectLabel &&
  !line.description.trim() &&
  !amountOf(line.amount);

/** What Save Draft sends, plus the keys of the lines it kept (blank lines are dropped) in the
 * same order, so the saved line ids can be written back onto them. */
export const toDraftInput = (
  draft: InvoiceDraft,
  extra: {
    id?: string;
    remitTo: string[];
    documentName: string | null;
    attachmentNames: string[];
    defaultAccountId?: string;
  },
): { input: ApInvoiceDraftInput; lineKeys: string[] } => {
  const kept = draft.lines.filter((line) => !isBlankLine(line, extra.defaultAccountId));
  return {
    lineKeys: kept.map((line) => line.key),
    input: {
      id: extra.id,
      vendorId: draft.vendorId,
      vendorName: draft.vendorName,
      vendorNameId: draft.vendorNameId,
      remitTo: extra.remitTo,
      apAccountId: draft.apAccountId,
      invoiceNumber: draft.invoiceNumber.trim(),
      invoiceAmount: amountOf(draft.invoiceAmount),
      invoiceDate: draft.invoiceDate,
      dueDate: draft.dueDate,
      glPeriod: draft.glPeriod,
      serviceDate: draft.serviceDate || null,
      type1099: draft.type1099 || null,
      box1099: draft.box1099 || null,
      stubDescription: draft.stubDescription.trim(),
      documentName: extra.documentName,
      attachmentNames: extra.attachmentNames,
      lines: kept.map((line) => ({
        ...(line.id ? { id: line.id } : {}),
        accountId: line.accountId,
        wellId: line.wellId,
        wellLabel: line.wellLabel,
        afe: line.afe || null,
        stage: line.stage.trim() || null,
        deck: line.deck || null,
        projectId: line.projectId,
        projectLabel: line.projectLabel,
        description: line.description.trim(),
        amount: amountOf(line.amount),
      })),
    },
  };
};

/** Fills every other line's empty fields from line 1. Never the amount; a stage only follows
 * when that line ends up on line 1's AFE. */
export const copyFirstLineDown = (lines: LineDraft[]): LineDraft[] => {
  const [first, ...rest] = lines;
  if (!first) return lines;
  return [
    first,
    ...rest.map((line) => {
      const next = { ...line };
      if (!next.accountId) next.accountId = first.accountId;
      if (!next.wellId && !next.wellLabel) {
        next.wellId = first.wellId;
        next.wellLabel = first.wellLabel;
      }
      if (!next.afe) next.afe = first.afe;
      if (!next.stage && next.afe === first.afe) next.stage = first.stage;
      if (!next.deck) next.deck = first.deck;
      if (!next.projectId && !next.projectLabel) {
        next.projectId = first.projectId;
        next.projectLabel = first.projectLabel;
      }
      if (!next.description.trim()) next.description = first.description;
      return next;
    }),
  ];
};

/** Inserts a copy of lines[index] right below it, without its amount. */
export const copyLineBelow = (lines: LineDraft[], index: number): LineDraft[] => {
  const source = lines[index];
  if (!source) return lines;
  const copy: LineDraft = { ...source, key: newLineKey(), id: undefined, amount: "" };
  return [...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)];
};

export const distributedTotal = (lines: LineDraft[]): number =>
  roundCents(lines.reduce((sum, line) => sum + amountOf(line.amount), 0));

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-10" → "October 2026" */
export const formatGlMonth = (period: string): string => {
  const [year, month] = period.split("-");
  const name = MONTH_NAMES[Number(month) - 1];
  return name && year ? `${name} ${year}` : period;
};

const shiftMonth = (period: string, delta: number): string => {
  const [year, month] = period.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
};

/** G/L months to choose from, newest first: three months ahead back to two years ago, plus the
 * current value if it's outside that range. */
export const glMonthOptions = (selected: string): string[] => {
  const current = todayIso().slice(0, 7);
  const months = Array.from({ length: 28 }, (_, i) => shiftMonth(current, 3 - i));
  if (/^\d{4}-\d{2}$/.test(selected) && !months.includes(selected)) {
    months.push(selected);
    months.sort((a, b) => b.localeCompare(a));
  }
  return months;
};

/** Splits a stored "W-0142 Whitfield 1H" into its code and name; other labels are all code. */
export const splitWellLabel = (label: string): { code: string; name: string } => {
  const match = label.match(/^([A-Z]+-\d+)\s+(.+)$/);
  return match ? { code: match[1], name: match[2] } : { code: label, name: "" };
};
