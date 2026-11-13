import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { cn } from "@/lib/utils";
import { AP_STATUS_LABELS, ApDuplicateMatch, ApInvoice, ApInvoiceDraftInput } from "@/types/apInvoices";
import { formatAccountNumber } from "@/types/chartOfAccounts";
import { ApStatusBadge } from "../../StatusBadge";
import { CompareVerdict, buildComparisonRows } from "./comparison";
import { HitBadge } from "./HitBadge";

interface ComparisonTableProps {
  draft: ApInvoiceDraftInput;
  /** The saved invoice behind the screen, for its status; null while unsaved. */
  invoice: ApInvoice | null;
  match: ApDuplicateMatch;
  /** e.g. "Draft · entered today by aclark". */
  oursCaption: string;
  onOpenInvoice: (id: string) => void;
}

const COLUMN_WIDTHS: (number | undefined)[] = [160, undefined, undefined, 130];

export const ComparisonTable = ({ draft, invoice, match, oursCaption, onOpenInvoice }: ComparisonTableProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const { getAccount } = useChartOfAccounts();

  const rows = useMemo(
    () =>
      buildComparisonRows(draft, match, (id) => {
        const account = getAccount(id);
        return account ? formatAccountNumber(account) : id;
      }),
    [draft, match, getAccount],
  );

  const muted = isLight ? "text-gray-500" : "text-white/60";
  const rowBorder = isLight ? "border-purple-100" : "border-purple-300/10";
  const hitRow = isLight ? "bg-yellow-50" : "bg-yellow-500/[0.08]";
  const caption = cn("mt-0.5 block normal-case tracking-normal font-medium text-xs", muted);
  const link = cn(
    "cursor-pointer underline-offset-2 hover:underline",
    isLight ? "text-purple-700 hover:text-purple-900" : "text-purple-300 hover:text-purple-100",
  );

  const verdictCell = (verdict: CompareVerdict) =>
    verdict.kind === "same" ? (
      <HitBadge>Same</HitBadge>
    ) : verdict.kind === "note" ? (
      <span className={cn("text-xs", muted)}>{verdict.text}</span>
    ) : null;

  const valueCell = (text: string, strong: boolean, numeric?: boolean) =>
    text ? (
      <span className={cn("block truncate text-white", strong && "font-semibold", numeric && "tabular-nums")} title={text}>
        {text}
      </span>
    ) : (
      <span className={muted}>—</span>
    );

  const theirsTitle = match.journalId ?? AP_STATUS_LABELS[match.status];

  return (
    <div className="overflow-x-auto rounded-xl border border-purple-300/20 bg-white/5">
      <table className="w-full min-w-[760px] table-fixed text-sm">
        <caption className="sr-only">
          This invoice compared with {match.journalId ?? `invoice #${match.invoiceNumber}`}
        </caption>
        <colgroup>
          {COLUMN_WIDTHS.map((width, i) => (
            <col key={i} style={width ? { width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr
            className={cn(
              "border-b text-left align-bottom text-xs font-semibold uppercase tracking-wider",
              rowBorder,
              isLight ? "text-gray-500" : "text-purple-200/80",
            )}
          >
            <th scope="col" className="px-4 py-3">
              Field
            </th>
            <th scope="col" className="px-4 py-3">
              This invoice
              <span className={caption}>{oursCaption}</span>
            </th>
            <th scope="col" className="px-4 py-3">
              {theirsTitle}
              <span className={caption}>
                <button type="button" onClick={() => onOpenInvoice(match.id)} className={link}>
                  Open invoice
                </button>
              </span>
            </th>
            <th scope="col" className="px-4 py-3">
              Match
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hit = !!row.rule && match.matchedBy.includes(row.rule);
            return (
              <tr key={row.key} className={cn("border-b", rowBorder, hit && hitRow)}>
                <th scope="row" className={cn("px-4 py-2.5 h-[46px] text-left font-normal", muted)}>
                  {row.label}
                </th>
                <td className="px-4 py-2.5">{valueCell(row.ours, !!row.rule, row.numeric)}</td>
                <td className="px-4 py-2.5">{valueCell(row.theirs, !!row.rule, row.numeric)}</td>
                <td className="px-4 py-2.5">{verdictCell(row.verdict)}</td>
              </tr>
            );
          })}
          <tr>
            <th scope="row" className={cn("px-4 py-2.5 h-[46px] text-left font-normal", muted)}>
              Status
            </th>
            <td className="px-4 py-2.5">
              <ApStatusBadge
                status={invoice?.status ?? "draft"}
                scheduledPayDate={invoice?.scheduledPayDate}
                paidCheckNumber={invoice?.paidCheckNumber}
              />
            </td>
            <td className="px-4 py-2.5">
              <ApStatusBadge
                status={match.status}
                scheduledPayDate={match.scheduledPayDate}
                paidCheckNumber={match.paidCheckNumber}
              />
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
