import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCheckDate, formatMoney } from "@/types/revenue";
import { RevenueStatusBadge } from "../list/RevenueStatusBadge";
import { formatRowRanges, plural } from "./importModel";
import type { ReviewRow } from "./reviewModel";
import { SECTION_HEADER_CLASS, useImportTheme } from "./importTheme";

export interface ReviewStepProps {
  rows: ReviewRow[];
  /** Spreadsheet rows left out on upload because they had errors. */
  skippedRows: number[];
  onToggle: (key: string, included: boolean) => void;
}

export const ReviewStep = ({ rows, skippedRows, onToggle }: ReviewStepProps) => {
  const theme = useImportTheme();
  const included = rows.filter((row) => row.included);

  const warnings: string[] = [];
  if (skippedRows.length) {
    warnings.push(
      `${plural(skippedRows.length, "row")} with problems ${skippedRows.length === 1 ? "was" : "were"} left out on upload (row ${formatRowRanges(skippedRows)}), so ${skippedRows.length === 1 ? "its check" : "their checks"} may not balance.`,
    );
  }
  for (const row of rows) {
    const name = `Check #${row.check.checkNumber}`;
    if (row.duplicateOf) {
      warnings.push(
        `${name} from ${row.duplicateOf.operatorName} dated ${formatCheckDate(row.duplicateOf.checkDate)} is already in Revenue Checks${
          row.included ? " and will be imported again." : ", so it's unticked. Tick it to import it again anyway."
        }`,
      );
    }
    if (!row.included) continue;
    if (!row.totals.balanced) {
      warnings.push(
        `${name}: detail lines total ${formatMoney(row.totals.ownerNet)} but the check is ${formatMoney(row.check.checkAmount)} (difference ${formatMoney(row.totals.difference)}). It will be saved out of balance.`,
      );
    }
    for (const problem of row.lineProblems) warnings.push(`${name}: ${problem}`);
    for (const property of row.unlinked) {
      warnings.push(`${name}: ${property} isn't linked to a well. Link it on the check before posting.`);
    }
  }

  const th = `px-3 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${theme.headerText}`;
  const td = "px-3 py-2 whitespace-nowrap";

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Checks to import" className="rounded-xl border border-purple-300/20 bg-white/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3">
          <h3 className={SECTION_HEADER_CLASS}>Checks to import</h3>
          <span className="text-xs text-white/60">
            {plural(included.length, "check")} selected · $
            {formatMoney(included.reduce((sum, row) => sum + row.check.checkAmount, 0))}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-purple-300/20">
                <th className={`${th} w-10`}>
                  <span className="sr-only">Import</span>
                </th>
                <th className={`${th} text-left`}>Operator</th>
                <th className={`${th} text-left`}>Owner</th>
                <th className={`${th} text-left`}>Check #</th>
                <th className={`${th} text-left`}>Check Date</th>
                <th className={`${th} text-right`}>Amount</th>
                <th className={`${th} text-right`}>Lines</th>
                <th className={`${th} text-right`}>Owner Net</th>
                <th className={`${th} text-right`}>Difference</th>
                <th className={`${th} text-left`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b last:border-0 ${theme.rowBorder} ${row.included ? "" : "opacity-60"}`}
                >
                  <td className={td}>
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(event) => onToggle(row.key, event.target.checked)}
                      aria-label={`Import check ${row.check.checkNumber}`}
                      className="size-4 cursor-pointer accent-purple-600"
                    />
                  </td>
                  <td className={`${td} font-semibold text-white`}>{row.draft.operatorName}</td>
                  <td className={`${td} text-white`}>
                    {row.draft.ownerName}
                    {row.check.ownerNumber && (
                      <span className="block text-xs text-white/60">Owner # {row.check.ownerNumber}</span>
                    )}
                  </td>
                  <td className={`${td} tabular-nums text-white`}>{row.check.checkNumber}</td>
                  <td className={`${td} tabular-nums text-white`}>{formatCheckDate(row.check.checkDate)}</td>
                  <td className={`${td} text-right tabular-nums text-white`}>{formatMoney(row.check.checkAmount)}</td>
                  <td className={`${td} text-right tabular-nums text-white`}>{row.check.lines.length}</td>
                  <td className={`${td} text-right tabular-nums text-white`}>{formatMoney(row.totals.ownerNet)}</td>
                  <td
                    className={`${td} text-right tabular-nums ${
                      row.totals.balanced ? "text-white/60" : `font-semibold ${theme.badText}`
                    }`}
                  >
                    {formatMoney(row.totals.difference)}
                  </td>
                  <td className={td}>
                    <RevenueStatusBadge status={row.status} label={row.statusLabel} blockers={row.blockers} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {warnings.length > 0 ? (
        <section aria-label="Warnings" className={`rounded-lg border p-3 text-sm ${theme.warnBox}`}>
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {plural(warnings.length, "thing")} to know before saving
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {warnings.map((warning, index) => (
              <li key={`${index}-${warning}`}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${theme.okBox}`}>
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Every check balances and every property is linked to a well.
        </p>
      )}
    </div>
  );
};

export default ReviewStep;
