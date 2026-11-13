import { AP_STATUSES, ApInvoice, daysBetweenIso, formatGlPeriod } from "@/types/apInvoices";

export type ApListColumn =
  | "journalId"
  | "vendor"
  | "invoiceNumber"
  | "invoiceDate"
  | "dueDate"
  | "glPeriod"
  | "amount"
  | "balance"
  | "status";

export interface ApListColumnDef {
  id: ApListColumn;
  label: string;
  locked?: boolean;
  numeric?: boolean;
}

export const AP_LIST_COLUMNS: ApListColumnDef[] = [
  { id: "journalId", label: "Journal ID" },
  { id: "vendor", label: "Vendor", locked: true },
  { id: "invoiceNumber", label: "Invoice #", locked: true },
  { id: "invoiceDate", label: "Invoice Date" },
  { id: "dueDate", label: "Due Date" },
  { id: "glPeriod", label: "G/L Period" },
  { id: "amount", label: "Amount", numeric: true },
  { id: "balance", label: "Balance", numeric: true },
  { id: "status", label: "Status", locked: true },
];

export interface ApListSort {
  column: ApListColumn;
  direction: "asc" | "desc";
}

export const DEFAULT_AP_SORT: ApListSort = { column: "invoiceDate", direction: "desc" };

export type ApDueFilter = "" | "past_due" | "next_7" | "next_30";

export const DUE_FILTER_OPTIONS: { value: Exclude<ApDueFilter, "">; label: string }[] = [
  { value: "past_due", label: "Past due" },
  { value: "next_7", label: "Due in 7 days" },
  { value: "next_30", label: "Due in 30 days" },
];

const isUnpaid = (invoice: ApInvoice) => invoice.status !== "paid" && invoice.status !== "void" && invoice.balance > 0;

/** Days past due for an unpaid invoice; 0 when it isn't late (or is paid/void). */
export const daysLate = (invoice: ApInvoice, today: string): number =>
  isUnpaid(invoice) ? Math.max(0, daysBetweenIso(invoice.dueDate, today) ?? 0) : 0;

export const matchesDue = (invoice: ApInvoice, due: ApDueFilter, today: string): boolean => {
  if (!due) return true;
  if (!isUnpaid(invoice)) return false;
  const daysUntilDue = daysBetweenIso(today, invoice.dueDate);
  if (daysUntilDue === null) return false;
  if (due === "past_due") return daysUntilDue < 0;
  return daysUntilDue >= 0 && daysUntilDue <= (due === "next_7" ? 7 : 30);
};

export const matchesSearch = (invoice: ApInvoice, term: string): boolean => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    invoice.vendorName,
    invoice.vendorNameId,
    invoice.invoiceNumber,
    invoice.journalId ?? "",
    ...invoice.lines.flatMap((line) => [line.afe ?? "", line.wellLabel]),
  ];
  return haystack.some((value) => value.toLowerCase().includes(needle));
};

const STATUS_RANK = Object.fromEntries(AP_STATUSES.map((status, index) => [status, index]));

const sortValue = (invoice: ApInvoice, column: ApListColumn): string | number => {
  switch (column) {
    case "journalId":
      return invoice.journalId ?? "";
    case "vendor":
      return invoice.vendorName.toLowerCase();
    case "invoiceNumber":
      return invoice.invoiceNumber.toLowerCase();
    case "invoiceDate":
      return invoice.invoiceDate;
    case "dueDate":
      return invoice.dueDate;
    case "glPeriod":
      return invoice.glPeriod;
    case "amount":
      return invoice.invoiceAmount;
    case "balance":
      return invoice.balance;
    case "status":
      return STATUS_RANK[invoice.status];
  }
};

export const compareInvoices = (a: ApInvoice, b: ApInvoice, sort: ApListSort): number => {
  const left = sortValue(a, sort.column);
  const right = sortValue(b, sort.column);
  const primary =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true });
  const result = primary || a.createdAt.localeCompare(b.createdAt);
  return sort.direction === "asc" ? result : -result;
};

export const glPeriodOptions = (invoices: ApInvoice[]) =>
  Array.from(new Set(invoices.map((invoice) => invoice.glPeriod)))
    .sort((a, b) => b.localeCompare(a))
    .map((period) => ({ value: period, label: formatGlPeriod(period) }));

export const vendorOptions = (invoices: ApInvoice[]) =>
  Array.from(new Map(invoices.map((invoice) => [invoice.vendorId, invoice.vendorName])).entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }));
