import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { AP_EDITABLE_STATUSES, formatGlPeriod, formatIsoDate, formatMoney } from "@/types/apInvoices";
import { ApPaymentStatusBadge, ApStatusBadge } from "../../StatusBadge";
import type { HistoryRowView } from "./historyRows";

interface HistoryTableProps {
  rows: HistoryRowView[];
  vendorName: string;
  onOpenInvoice: (id: string) => void;
}

export const HistoryTable = ({ rows, vendorName, onOpenInvoice }: HistoryTableProps) => {
  const isLight = useAtomValue(themeAtom) === "light";

  const muted = isLight ? "text-gray-500" : "text-white/60";
  const rowBorder = isLight ? "border-purple-100" : "border-purple-300/10";
  const th = "px-4 py-3 whitespace-nowrap";

  const statusCell = (row: HistoryRowView) => {
    if (row.payment) return <ApPaymentStatusBadge status={row.payment.status} />;
    return (
      <ApStatusBadge
        status={row.invoice?.status ?? "draft"}
        scheduledPayDate={row.invoice?.scheduledPayDate}
        paidCheckNumber={row.invoice?.paidCheckNumber}
      />
    );
  };

  const journalCell = (row: HistoryRowView) => {
    if (!row.current) return row.journalId ?? <span className={muted}>—</span>;
    const posted = row.invoice && !AP_EDITABLE_STATUSES.includes(row.invoice.status);
    if (!row.journalId) return <span className={muted}>{posted ? "This invoice" : "This draft"}</span>;
    return (
      <>
        {row.journalId} <span className={muted}>· This invoice</span>
      </>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-purple-300/20 bg-white/5">
      <table className="w-full min-w-[760px] text-sm">
        <caption className="sr-only">Invoices and payments for {vendorName || "this vendor"}, newest first</caption>
        <thead>
          <tr
            className={cn(
              "border-b text-left text-xs font-semibold uppercase tracking-wider",
              rowBorder,
              isLight ? "text-gray-500" : "text-purple-200/80",
            )}
          >
            <th scope="col" className={th}>
              Date
            </th>
            <th scope="col" className={th}>
              Type
            </th>
            <th scope="col" className={th}>
              Ref
            </th>
            <th scope="col" className={th}>
              Journal ID
            </th>
            <th scope="col" className={th}>
              G/L Period
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Amount
            </th>
            <th scope="col" className={th}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const openable = row.kind === "invoice" && !row.current;
            const open = () => onOpenInvoice(row.id);
            const ref = row.ref || "—";
            return (
              <tr
                key={row.current ? "current" : row.id}
                aria-current={row.current || undefined}
                onClick={openable ? open : undefined}
                className={cn(
                  "border-b last:border-0 text-white transition-colors",
                  rowBorder,
                  row.current
                    ? isLight
                      ? "bg-purple-50"
                      : "bg-purple-500/10"
                    : row.hit && (isLight ? "bg-yellow-50" : "bg-yellow-500/[0.08]"),
                  openable &&
                    cn("cursor-pointer", isLight ? "hover:bg-purple-300/50" : "hover:bg-purple-500/[0.18]"),
                )}
              >
                <td className="px-4 py-2.5 h-[46px] whitespace-nowrap">{formatIsoDate(row.date) || "—"}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{row.kind === "invoice" ? "Invoice" : "Payment"}</td>
                <td className={cn("px-4 py-2.5 whitespace-nowrap", row.sameNumber && "font-semibold")}>
                  {openable ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        open();
                      }}
                      aria-label={`Open invoice ${ref}`}
                      className="cursor-pointer rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      {ref}
                    </button>
                  ) : (
                    ref
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">{journalCell(row)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatGlPeriod(row.glPeriod) || "—"}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums">
                  {row.amount < 0 ? `(${formatMoney(-row.amount)})` : formatMoney(row.amount)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">{statusCell(row)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
