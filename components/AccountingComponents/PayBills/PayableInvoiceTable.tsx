import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { Input } from "@/components/ui/input";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ApInvoice, VendorPay, daysBetweenIso, formatIsoDate, formatMoney, formatUsd } from "@/types/apInvoices";
import { PayBadge, dividerClass, pluralize, rowBorderClass, tableHeadClass, tableShellClass } from "./ui";

export interface PayableGroup {
  vendorId: string;
  vendorName: string;
  pay: VendorPay;
  invoices: ApInvoice[];
}

interface PayableInvoiceTableProps {
  groups: PayableGroup[];
  loading: boolean;
  today: string;
  /** Selected invoice id → the pay amount as typed. */
  amounts: Record<string, string>;
  /** Invoice id → what's wrong with its pay amount. */
  amountErrors: Record<string, string>;
  /** Vendor id → the checks the current selection writes to them. */
  checksByVendor: Map<string, { count: number; total: number }>;
  selectAll: "all" | "some" | "none";
  onSelectAll: (checked: boolean) => void;
  onToggle: (invoice: ApInvoice, checked: boolean) => void;
  onAmountChange: (invoice: ApInvoice, text: string) => void;
  onAmountBlur: (invoice: ApInvoice) => void;
}

const COLUMN_COUNT = 7;

export const PayableInvoiceTable = ({
  groups,
  loading,
  today,
  amounts,
  amountErrors,
  checksByVendor,
  selectAll,
  onSelectAll,
  onToggle,
  onAmountChange,
  onAmountBlur,
}: PayableInvoiceTableProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const head = `px-3.5 py-3 text-left ${tableHeadClass(isLight)}`;
  const muted = isLight ? "text-gray-500" : "text-white/50";
  const checkbox = "size-4 accent-purple-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
  const selectable = groups.some((group) => group.pay !== "No" && group.invoices.length > 0);

  return (
    <div className={`${tableShellClass(isLight)} overflow-x-auto`}>
      <table className="w-full min-w-[820px] text-sm">
        <caption className="sr-only">Payable invoices, grouped by vendor</caption>
        <thead>
          <tr className={`border-b ${dividerClass(isLight)}`}>
            <th className="w-10 px-3.5 py-3">
              <input
                type="checkbox"
                aria-label="Select all payable invoices"
                className={checkbox}
                disabled={!selectable}
                checked={selectAll === "all"}
                ref={(el) => {
                  if (el) el.indeterminate = selectAll === "some";
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className={head}>Invoice #</th>
            <th className={head}>Journal ID</th>
            <th className={head}>Invoice Date</th>
            <th className={head}>Due Date</th>
            <th className={`${head} text-right`}>Amount Due</th>
            <th className={`${head} text-right`}>Pay Amount</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                  <span className={`text-sm ${isLight ? "text-gray-500" : "text-purple-200/70"}`}>Loading...</span>
                </div>
              </td>
            </tr>
          ) : groups.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="py-16 text-center">
                <p className={isLight ? "text-gray-500" : "text-purple-200/70"}>
                  No approved invoices to pay with these filters
                </p>
              </td>
            </tr>
          ) : (
            groups.map((group) => {
              const onHold = group.pay === "No";
              const checks = checksByVendor.get(group.vendorId);
              return (
                <Fragment key={group.vendorId}>
                  <tr
                    className={`border-b ${isLight ? "border-purple-200 bg-purple-100/70" : "border-purple-300/20 bg-purple-600/[0.14]"}`}
                  >
                    <td colSpan={COLUMN_COUNT} className="px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <strong className="text-white">{group.vendorName}</strong>
                          <PayBadge pay={group.pay} />
                          {group.pay === "Monthly" && (
                            <span className={`text-xs ${muted}`}>Combined into one check</span>
                          )}
                        </div>
                        <span className={`text-xs tabular-nums ${muted}`}>
                          {onHold
                            ? "Change Pay on the vendor to release"
                            : checks
                              ? `${pluralize(checks.count, "check")} · ${formatUsd(checks.total)}`
                              : "Not selected"}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.invoices.map((invoice) => {
                    const selected = !onHold && invoice.id in amounts;
                    const error = selected ? amountErrors[invoice.id] : undefined;
                    const late = daysBetweenIso(invoice.dueDate, today) ?? 0;
                    const cell = `px-3.5 py-1.5 h-[46px] whitespace-nowrap ${onHold ? muted : "text-white"}`;
                    return (
                      <tr key={invoice.id} className={`border-b ${rowBorderClass(isLight)}`}>
                        <td className="px-3.5 py-1.5">
                          <input
                            type="checkbox"
                            className={checkbox}
                            disabled={onHold}
                            checked={selected}
                            onChange={(e) => onToggle(invoice, e.target.checked)}
                            aria-label={`Pay invoice ${invoice.invoiceNumber}${onHold ? " (vendor on hold)" : ""}`}
                          />
                        </td>
                        <td className={`${cell} ${onHold ? "" : "font-semibold"}`}>{invoice.invoiceNumber}</td>
                        <td className={`${cell} ${muted}`}>{invoice.journalId ?? "—"}</td>
                        <td className={cell}>{formatIsoDate(invoice.invoiceDate)}</td>
                        <td className={cell}>
                          {late > 0 && !onHold ? (
                            <span className="font-semibold text-red-300" title={`${pluralize(late, "day")} late`}>
                              {formatIsoDate(invoice.dueDate)}
                              <span className="sr-only"> (overdue)</span>
                            </span>
                          ) : (
                            formatIsoDate(invoice.dueDate)
                          )}
                        </td>
                        <td className={`${cell} text-right tabular-nums`}>
                          {formatMoney(invoice.balance)}
                          {invoice.balance !== invoice.invoiceAmount && (
                            <span className={`block text-xs ${muted}`}>of {formatMoney(invoice.invoiceAmount)}</span>
                          )}
                        </td>
                        <td className={`${cell} text-right`}>
                          {onHold ? (
                            "—"
                          ) : (
                            <div className="inline-flex flex-col items-end">
                              <Input
                                inputMode="decimal"
                                aria-label={`Pay amount for ${invoice.invoiceNumber}`}
                                aria-invalid={!!error}
                                aria-describedby={error ? `pay-error-${invoice.id}` : undefined}
                                value={selected ? amounts[invoice.id] : "0.00"}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => onAmountChange(invoice, e.target.value)}
                                onBlur={() => onAmountBlur(invoice)}
                                className={`h-8 w-[120px] px-2 text-right tabular-nums bg-white/5 border-purple-300/30 text-white ${
                                  selected ? "" : "opacity-50"
                                } ${error ? "ring-2 ring-red-500/70" : ""}`}
                              />
                              {error && (
                                <span
                                  id={`pay-error-${invoice.id}`}
                                  className="mt-0.5 text-xs text-red-300 whitespace-normal"
                                >
                                  {error}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PayableInvoiceTable;
