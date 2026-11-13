import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ApInvoice, formatMoney, formatUsd } from "@/types/apInvoices";
import { CheckRun } from "@/types/checkRuns";
import { PayBadge, dividerClass, rowBorderClass, tableHeadClass, tableShellClass } from "./ui";

interface RunChecksTableProps {
  run: CheckRun;
  invoicesById: Map<string, ApInvoice>;
}

/** Every check in the run with the invoices it pays, for the approver to sign off on. */
export const RunChecksTable = ({ run, invoicesById }: RunChecksTableProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const head = `px-4 py-3 text-left ${tableHeadClass(isLight)}`;
  const muted = isLight ? "text-gray-500" : "text-white/50";

  return (
    <div className={`${tableShellClass(isLight)} overflow-x-auto`}>
      <table className="w-full min-w-[760px] text-sm">
        <caption className="sr-only">Checks in this run</caption>
        <thead>
          <tr className={`border-b ${dividerClass(isLight)}`}>
            <th className={head}>Check #</th>
            <th className={head}>Payee</th>
            <th className={head}>Invoices paid</th>
            <th className={`${head} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {run.checks.map((check) => (
            <tr key={check.checkNumber} className={`border-b align-top ${rowBorderClass(isLight)}`}>
              <td className="px-4 py-3 font-semibold text-white tabular-nums">{check.checkNumber}</td>
              <td className="px-4 py-3">
                <span className="block font-semibold text-white">{check.vendorName}</span>
                <span className="mt-1 inline-block">
                  <PayBadge pay={check.pay} />
                </span>
              </td>
              <td className="px-4 py-3">
                <ul className="flex flex-col gap-1">
                  {check.items.map((item) => {
                    const invoice = invoicesById.get(item.invoiceId);
                    return (
                      <li key={item.invoiceId} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium text-white">#{invoice?.invoiceNumber ?? "—"}</span>
                        <span className={`text-xs ${muted}`}>
                          {invoice?.journalId ?? ""}
                          {invoice?.stubDescription ? ` · ${invoice.stubDescription}` : ""}
                        </span>
                        <span className="text-white tabular-nums">{formatMoney(item.amount)}</span>
                        {invoice && item.amount < invoice.balance && (
                          <span className={`text-xs ${muted}`}>partial, of {formatMoney(invoice.balance)}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                {formatMoney(check.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="px-4 py-3 text-right font-semibold text-white">
              Total
            </td>
            <td className="px-4 py-3 text-right text-base font-bold text-white tabular-nums">{formatUsd(run.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default RunChecksTable;
