export type ApInvoiceStatus =
  | "draft"
  | "needs_review"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "paid"
  | "void";

export const AP_STATUSES: ApInvoiceStatus[] = [
  "draft",
  "needs_review",
  "awaiting_approval",
  "approved",
  "scheduled",
  "paid",
  "void",
];

export const AP_STATUS_LABELS: Record<ApInvoiceStatus, string> = {
  draft: "Draft",
  needs_review: "Needs Review",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  scheduled: "Scheduled",
  paid: "Paid",
  void: "Void",
};

/** Statuses whose header and coding can still change; everything later has posted to the G/L. */
export const AP_EDITABLE_STATUSES: ApInvoiceStatus[] = ["draft", "needs_review", "awaiting_approval"];

/** Posted and not yet fully paid: these make up the open A/P balance and the aging buckets. */
export const AP_OPEN_STATUSES: ApInvoiceStatus[] = ["approved", "scheduled"];

export interface ApInvoiceLine {
  id: string;
  accountId: string;
  wellId: string | null;
  wellLabel: string;
  afe: string | null;
  stage: string | null;
  deck: string | null;
  projectId: string | null;
  projectLabel: string;
  description: string;
  amount: number;
}

export type ApInvoiceLineInput = Omit<ApInvoiceLine, "id"> & { id?: string };

export type ApDuplicateDecision = "not_duplicate" | "discarded";

export interface ApDuplicateReview {
  decision: ApDuplicateDecision;
  reason: string;
  by: string;
  at: string;
  /** Ids of the matching invoices the reviewer actually looked at; a "not a duplicate" call only covers these. */
  clearedMatchIds: string[];
}

/** True when `matches` holds an invoice the saved "not a duplicate" review hasn't covered. */
export const hasUnreviewedDuplicates = (
  review: ApDuplicateReview | null | undefined,
  matches: { id: string }[],
): boolean => {
  if (!matches.length) return false;
  if (review?.decision !== "not_duplicate") return true;
  return matches.some((match) => !review.clearedMatchIds.includes(match.id));
};

export interface ApInvoice {
  id: string;
  /** Assigned when the invoice is approved (posted), e.g. "JE-26-04412". */
  journalId: string | null;
  vendorId: string;
  vendorName: string;
  vendorNameId: string;
  remitTo: string[];
  apAccountId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  dueDate: string;
  /** "YYYY-MM" */
  glPeriod: string;
  serviceDate: string | null;
  type1099: string | null;
  box1099: string | null;
  stubDescription: string;
  lines: ApInvoiceLine[];
  status: ApInvoiceStatus;
  balance: number;
  documentName: string | null;
  attachmentNames: string[];
  scheduledRunId: string | null;
  scheduledPayDate: string | null;
  paidCheckNumber: string | null;
  duplicateReview: ApDuplicateReview | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** What the entry screen sends to saveDraft. Everything else on ApInvoice is owned by the workflow. */
export type ApInvoiceDraftInput = Pick<
  ApInvoice,
  | "vendorId"
  | "vendorName"
  | "vendorNameId"
  | "remitTo"
  | "apAccountId"
  | "invoiceNumber"
  | "invoiceAmount"
  | "invoiceDate"
  | "dueDate"
  | "glPeriod"
  | "serviceDate"
  | "type1099"
  | "box1099"
  | "stubDescription"
  | "documentName"
  | "attachmentNames"
> & { id?: string; lines: ApInvoiceLineInput[] };

export type ApPaymentStatus = "outstanding" | "cleared" | "void";

export const AP_PAYMENT_STATUS_LABELS: Record<ApPaymentStatus, string> = {
  outstanding: "Outstanding",
  cleared: "Cleared",
  void: "Void",
};

export interface ApPaymentApplication {
  invoiceId: string;
  amount: number;
}

export interface ApPayment {
  id: string;
  vendorId: string;
  checkNumber: string;
  checkDate: string;
  amount: number;
  bankAccountId: string;
  journalId: string;
  status: ApPaymentStatus;
  invoiceIds: string[];
  /** How much of this check went to each invoice (same order as invoiceIds). */
  applications: ApPaymentApplication[];
}

export interface ApPaymentInput {
  invoiceId: string;
  checkNumber: string;
  amount: number;
  checkDate: string;
  bankAccountId: string;
  /** The check run the invoice must still be scheduled in. */
  runId: string;
}

/** A vendor the A/P screens can pick that isn't a real contact yet (mock data only). */
export interface ApVendor {
  id: string;
  name: string;
  nameId: string;
  remitTo: string[];
}

export type DuplicateValidation = "Invoice #" | "Invoice Amount";

export const DUPLICATE_VALIDATION_OPTIONS: DuplicateValidation[] = ["Invoice #", "Invoice Amount"];

export const SAME_AMOUNT_WINDOW_OPTIONS = [30, 60, 90, 180];

export interface ApDuplicateRules {
  validateBy: DuplicateValidation;
  windowDays: number;
}

export interface ApDuplicateCandidate {
  id?: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
}

/** An existing invoice that looks like the candidate, plus which rule(s) caught it (primary rule first). */
export interface ApDuplicateMatch extends ApInvoice {
  matchedBy: DuplicateValidation[];
}

export interface ApAgingSummary {
  open: number;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
}

export interface ApVendorHistoryRow {
  id: string;
  kind: "invoice" | "payment";
  date: string;
  /** Invoice # for invoices, "Ck #10441" for payments. */
  ref: string;
  journalId: string | null;
  glPeriod: string;
  /** Payments are negative. */
  amount: number;
  invoice: ApInvoice | null;
  payment: ApPayment | null;
}

export interface ApVendorSummary {
  invoicesThisYear: number;
  paidThisYear: number;
  openCount: number;
  openBalance: number;
  nextDue: { invoiceId: string; dueDate: string; amount: number } | null;
  lastPayment: ApPayment | null;
  avgDaysToPay: number | null;
}

export type VendorPay = "Yes" | "No" | "Monthly" | "Check per entry";

export const PAY_OPTIONS: VendorPay[] = ["Yes", "Monthly", "Check per entry", "No"];

export const PAY_OPTION_DESCRIPTIONS: Record<VendorPay, string> = {
  Yes: "Include each invoice in check runs when it's due",
  Monthly: "One check a month for all open invoices",
  "Check per entry": "A separate check for every invoice",
  No: "Hold: never pick up in a check run",
};

export type PaymentTerms = "Due on receipt" | "Net 15" | "Net 30" | "Net 45" | "Net 60";

export const PAYMENT_TERMS: PaymentTerms[] = ["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"];

const PAYMENT_TERM_DAYS: Record<PaymentTerms, number> = {
  "Due on receipt": 0,
  "Net 15": 15,
  "Net 30": 30,
  "Net 45": 45,
  "Net 60": 60,
};

export const TYPES_1099 = ["1099-MISC", "1099-RENTAL", "1099-SALES", "1099-NEC"];

export const BOXES_1099 = ["Sales", "Royalty", "WI", "Lease Bonus", "Rents", "Nonemployee Comp.", "Other"];

export interface VendorDefaults {
  vendorId: string;
  pay: VendorPay;
  duplicateValidation: DuplicateValidation;
  sameAmountWindowDays: number;
  apAccountId: string;
  defaultExpenseAccountId: string | null;
  paymentTerms: PaymentTerms;
  type1099: string | null;
  box1099: string | null;
  /** Which of the contact's address types to remit to, e.g. "Payment". */
  remitToAddressType: string;
}

export type VendorDefaultsPatch = Partial<Omit<VendorDefaults, "vendorId">>;

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseIso = (iso: string): number | null => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
};

const toIso = (utcMs: number) => {
  const d = new Date(utcMs);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

/** Today's local calendar date as "YYYY-MM-DD". */
export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** Whole days from `from` to `to` (positive when `to` is later). Dates are compared as UTC
 * calendar days so DST and the viewer's timezone can't shift the count. Null when either date
 * is empty or invalid. */
export const daysBetweenIso = (from: string | null | undefined, to: string | null | undefined): number | null => {
  const a = from ? parseIso(from) : null;
  const b = to ? parseIso(to) : null;
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86_400_000);
};

export const addDaysIso = (iso: string, days: number): string => {
  const base = parseIso(iso);
  return base === null ? "" : toIso(base + days * 86_400_000);
};

/** "" when the invoice date isn't a valid "YYYY-MM-DD". */
export const dueDateFromTerms = (invoiceDate: string, terms: PaymentTerms): string =>
  addDaysIso(invoiceDate, PAYMENT_TERM_DAYS[terms] ?? 0);

/** "2026-11-04" → "11/04/2026" */
export const formatIsoDate = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return year && month && day ? `${month}/${day}/${year}` : iso;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" → "Oct 2026" */
export const formatGlPeriod = (period: string | null | undefined): string => {
  if (!period) return "";
  const [year, month] = period.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : period;
};

/** 12480 → "12,480.00" */
export const formatMoney = (amount: number): string =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 12480 → "$12,480.00", -5 → "-$5.00" */
export const formatUsd = (amount: number): string =>
  `${amount < 0 ? "-" : ""}$${formatMoney(Math.abs(amount))}`;

export const roundCents = (x: number): number => {
  const r = Math.round(Number(`${Math.abs(x).toFixed(8)}e2`));
  return (Math.sign(x) * r) / 100 || 0;
};
