import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { History } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useApInvoices } from "@/hooks/useApInvoices";
import { cn } from "@/lib/utils";
import type { ApInvoiceDraftInput } from "@/types/apInvoices";
import { HistoryTable } from "./history/HistoryTable";
import { buildHistoryRows } from "./history/historyRows";
import { SummaryTiles } from "./history/SummaryTiles";

export interface VendorHistoryTabProps {
  /** null until a vendor is picked. */
  vendorId: string | null;
  vendorName: string;
  /** The invoice on screen, unsaved edits included — for a "This draft" row while it isn't saved. */
  draft: ApInvoiceDraftInput;
  /** The saved invoice's id (its history row is "This draft"), or null before the first save. */
  invoiceId: string | null;
  /** Rows with this invoice # or this amount are highlighted. */
  highlightInvoiceNumber: string;
  highlightAmount: number;
  /** Opens another invoice in place of this one. */
  onOpenInvoice: (id: string) => void;
}

const BOX = "flex flex-col items-center gap-2 rounded-xl border border-purple-300/20 bg-white/5 px-6 py-10 text-center";

export const VendorHistoryTab = ({
  vendorId,
  vendorName,
  draft,
  invoiceId,
  highlightInvoiceNumber,
  highlightAmount,
  onOpenInvoice,
}: VendorHistoryTabProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const { loading, getInvoice, vendorHistory, vendorSummary } = useApInvoices();

  const others = useMemo(
    () => (vendorId ? vendorHistory(vendorId).filter((row) => row.id !== invoiceId) : []),
    [vendorId, vendorHistory, invoiceId],
  );
  const summary = useMemo(() => (vendorId ? vendorSummary(vendorId) : null), [vendorId, vendorSummary]);
  const savedInvoice = invoiceId ? getInvoice(invoiceId) ?? null : null;

  const rows = useMemo(
    () => buildHistoryRows(others, { draft, savedInvoice, highlightInvoiceNumber, highlightAmount }),
    [others, draft, savedInvoice, highlightInvoiceNumber, highlightAmount],
  );

  const muted = isLight ? "text-gray-500" : "text-white/60";

  if (!vendorId) {
    return (
      <div className={BOX}>
        <p className="text-sm text-white/70">Pick a vendor to see its history.</p>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className={BOX}>
        <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
        <span className={cn("text-sm", muted)}>Loading...</span>
      </div>
    );
  }

  if (!others.length) {
    return (
      <div className={BOX}>
        <History className={cn("size-8", isLight ? "text-purple-500" : "text-purple-300")} />
        <p className="font-medium text-white">No history for {vendorName || "this vendor"} yet</p>
        <p className={cn("text-sm", muted)}>Its invoices and payments will show here once they&apos;re entered.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <SummaryTiles summary={summary} />
      <HistoryTable rows={rows} vendorName={vendorName} onOpenInvoice={onOpenInvoice} />
      <span className={cn("text-xs", muted)}>
        Rows with the same invoice # or amount as this draft are highlighted.
      </span>
    </div>
  );
};

export default VendorHistoryTab;
