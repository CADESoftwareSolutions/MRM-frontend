import { useAtomValue } from "jotai";
import { ArrowDown, ArrowUp, Check, Edit, Eye, Paperclip, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { AP_EDITABLE_STATUSES, ApInvoice, formatGlPeriod, formatIsoDate, formatMoney } from "@/types/apInvoices";
import { ApStatusBadge } from "../StatusBadge";
import { ApListColumn, ApListColumnDef, ApListSort, daysLate } from "./listModel";

interface InvoiceTableProps {
  columns: ApListColumnDef[];
  invoices: ApInvoice[];
  loading: boolean;
  today: string;
  sort: ApListSort;
  onSortChange: (column: ApListColumn) => void;
  onOpen: (invoice: ApInvoice) => void;
  onApprove: (invoice: ApInvoice) => void;
  onReject: (invoice: ApInvoice) => void;
  /** Invoices whose approve/reject is in flight; their quick actions are disabled. */
  busyIds: ReadonlySet<string>;
}

export const InvoiceTable = ({
  columns,
  invoices,
  loading,
  today,
  sort,
  onSortChange,
  onOpen,
  onApprove,
  onReject,
  busyIds,
}: InvoiceTableProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const text = isLight ? "text-gray-700" : "text-white";
  const muted = isLight ? "text-gray-500" : "text-white/50";
  const colSpan = columns.length + 2;

  const iconButton = `p-1.5 rounded-md transition-colors cursor-pointer ${
    isLight
      ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
      : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
  }`;

  const renderCell = (column: ApListColumn, invoice: ApInvoice) => {
    switch (column) {
      case "journalId":
        return <span className={muted}>{invoice.journalId ?? "Assigned on post"}</span>;
      case "vendor":
        return (
          <span className={`font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>{invoice.vendorName}</span>
        );
      case "invoiceNumber":
        return <span className={text}>{invoice.invoiceNumber}</span>;
      case "invoiceDate":
        return <span className={text}>{formatIsoDate(invoice.invoiceDate)}</span>;
      case "dueDate": {
        const late = daysLate(invoice, today);
        if (!late) return <span className={text}>{formatIsoDate(invoice.dueDate)}</span>;
        const red = isLight ? "text-red-700" : "text-red-300";
        return (
          <>
            <span className={`block font-semibold ${red}`}>{formatIsoDate(invoice.dueDate)}</span>
            <span className={`block text-xs ${red}`}>
              {late} {late === 1 ? "day" : "days"} late
            </span>
          </>
        );
      }
      case "glPeriod":
        return <span className={text}>{formatGlPeriod(invoice.glPeriod)}</span>;
      case "amount":
        return <span className={text}>{formatMoney(invoice.invoiceAmount)}</span>;
      case "balance":
        return <span className={invoice.balance ? text : muted}>{formatMoney(invoice.balance)}</span>;
      case "status":
        return (
          <ApStatusBadge
            status={invoice.status}
            scheduledPayDate={invoice.scheduledPayDate}
            paidCheckNumber={invoice.paidCheckNumber}
          />
        );
    }
  };

  const attachments = (invoice: ApInvoice) =>
    [invoice.documentName, ...invoice.attachmentNames].filter((name): name is string => !!name);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-sm">
        <thead>
          <tr className={`border-b ${isLight ? "border-[rgb(167_139_250/0.2)]" : "border-[rgb(167_139_250/0.15)]"}`}>
            {columns.map((col) => (
              <th
                key={col.id}
                aria-sort={
                  sort.column === col.id ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
                }
                className={`text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  isLight ? "text-gray-500" : "text-purple-200/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSortChange(col.id)}
                  className={`flex w-full items-center gap-1.5 px-4 py-3 uppercase cursor-pointer transition-colors ${
                    col.numeric ? "justify-end" : ""
                  } ${
                    sort.column === col.id
                      ? isLight
                        ? "text-purple-700"
                        : "text-white"
                      : isLight
                      ? "hover:text-purple-700"
                      : "hover:text-white"
                  }`}
                >
                  {col.label}
                  {sort.column === col.id &&
                    (sort.direction === "asc" ? (
                      <ArrowUp className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowDown className="w-3 h-3 shrink-0" />
                    ))}
                </button>
              </th>
            ))}
            <th className="w-10 px-2 py-3">
              <span className="sr-only">Attachment</span>
            </th>
            <th className="px-3 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                  <span className={`text-sm ${isLight ? "text-gray-500" : "text-purple-200/70"}`}>Loading...</span>
                </div>
              </td>
            </tr>
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="text-center py-16">
                <p className={isLight ? "text-gray-500" : "text-purple-200/70"}>No invoices found</p>
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => {
              const files = attachments(invoice);
              const awaiting = invoice.status === "awaiting_approval";
              const readOnly = !(AP_EDITABLE_STATUSES.includes(invoice.status) && invoice.status !== "awaiting_approval");
              const busy = busyIds.has(invoice.id);
              return (
                <tr
                  key={invoice.id}
                  onClick={() => onOpen(invoice)}
                  className={`border-b last:border-0 transition-colors cursor-pointer ${
                    isLight
                      ? "border-purple-100 hover:bg-purple-300/50"
                      : "border-purple-300/10 hover:bg-purple-500/[0.18]"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-2 h-[52px] whitespace-nowrap ${
                        col.numeric ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {renderCell(col.id, invoice)}
                    </td>
                  ))}
                  <td className="px-2 py-2 h-[52px]" onClick={(e) => e.stopPropagation()}>
                    {files.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            role="img"
                            tabIndex={0}
                            aria-label={`Attached: ${files.join(", ")}`}
                            className={`inline-flex outline-none ${isLight ? "text-purple-600" : "text-purple-300"}`}
                          >
                            <Paperclip className="w-4 h-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={4}
                          // Portals to <body>, where a plain z-50 would slide under the fixed app bar.
                          style={{ zIndex: Z_INDEX.modalDropdown }}
                          className={isLight ? undefined : "border border-purple-300/30"}
                        >
                          {files.join(", ")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-3 py-2 h-[52px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {awaiting && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onApprove(invoice)}
                            aria-label={`Approve invoice ${invoice.invoiceNumber}`}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onReject(invoice)}
                            aria-label={`Reject invoice ${invoice.invoiceNumber}`}
                            className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default ${
                              isLight
                                ? "border-red-300 text-red-700 hover:bg-red-50"
                                : "border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpen(invoice)}
                        aria-label={`${readOnly ? "View" : "Edit"} invoice ${invoice.invoiceNumber}`}
                        className={iconButton}
                      >
                        {readOnly ? (
                          <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />
                        ) : (
                          <Edit className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
