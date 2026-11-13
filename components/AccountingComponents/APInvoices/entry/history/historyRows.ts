import { ApInvoice, ApInvoiceDraftInput, ApVendorHistoryRow, roundCents } from "@/types/apInvoices";
import { normalizeInvoiceNumber } from "../duplicates/comparison";

export interface HistoryRowView extends ApVendorHistoryRow {
  /** The invoice on screen, shown with its unsaved edits. */
  current: boolean;
  /** Same invoice # or same amount as the invoice on screen. */
  hit: boolean;
  sameNumber: boolean;
}

interface BuildHistoryRowsOptions {
  draft: ApInvoiceDraftInput;
  /** The saved invoice behind the screen, for its status and Journal ID; null while unsaved. */
  savedInvoice: ApInvoice | null;
  highlightInvoiceNumber: string;
  highlightAmount: number;
}

/** The vendor's history without the invoice on screen, then that invoice put back as it stands
 * on screen (unsaved edits included) where its date sorts it, ahead of anything else that day. */
export const buildHistoryRows = (
  others: ApVendorHistoryRow[],
  { draft, savedInvoice, highlightInvoiceNumber, highlightAmount }: BuildHistoryRowsOptions,
): HistoryRowView[] => {
  const number = normalizeInvoiceNumber(highlightInvoiceNumber);
  const amount = roundCents(highlightAmount);

  const rows: HistoryRowView[] = others.map((row) => {
    const sameNumber = row.kind === "invoice" && !!number && normalizeInvoiceNumber(row.ref) === number;
    const sameAmount = row.kind === "invoice" && amount > 0 && roundCents(row.amount) === amount;
    return { ...row, current: false, hit: sameNumber || sameAmount, sameNumber };
  });

  const draftRow: HistoryRowView = {
    id: savedInvoice?.id ?? "draft",
    kind: "invoice",
    date: draft.invoiceDate,
    ref: draft.invoiceNumber.trim(),
    journalId: savedInvoice?.journalId ?? null,
    glPeriod: draft.glPeriod,
    amount: roundCents(draft.invoiceAmount),
    invoice: savedInvoice,
    payment: null,
    current: true,
    hit: false,
    sameNumber: false,
  };

  const at = draft.invoiceDate
    ? rows.findIndex((row) => row.date < draft.invoiceDate || (row.date === draft.invoiceDate && row.kind === "payment"))
    : 0;
  return at === -1 ? [...rows, draftRow] : [...rows.slice(0, at), draftRow, ...rows.slice(at)];
};
