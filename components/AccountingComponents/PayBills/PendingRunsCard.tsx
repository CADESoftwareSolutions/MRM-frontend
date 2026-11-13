import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { formatIsoDate, formatMoney } from "@/types/apInvoices";
import { BankAccount, CheckRun, formatBankAccountLabel, formatCheckRange } from "@/types/checkRuns";
import {
  CARD_CLASS,
  RunStatusBadge,
  SECTION_TITLE_CLASS,
  dividerClass,
  formatStamp,
  outlineButtonClass,
  pluralize,
  rowBorderClass,
  tableHeadClass,
} from "./ui";

interface PendingRunsCardProps {
  runs: CheckRun[];
  activeRunId: string | null;
  getBankAccount: (id: string) => BankAccount | undefined;
  onOpen: (id: string) => void;
  onNewRun: () => void;
}

const actionLabel = (run: CheckRun) => {
  switch (run.status) {
    case "draft":
      return "Continue";
    case "awaiting_approval":
      return "Review";
    default:
      return run.printedAt ? "Confirm & post" : "Print";
  }
};

const lastActivity = (run: CheckRun) => {
  if (run.printedAt) return `Printed by ${run.printedBy} · ${formatStamp(run.printedAt)}`;
  if (run.approvedAt) return `Approved by ${run.approvedBy} · ${formatStamp(run.approvedAt)}`;
  if (run.submittedAt) return `Submitted by ${run.submittedBy} · ${formatStamp(run.submittedAt)}`;
  if (run.rejectedAt) return `Rejected by ${run.rejectedBy} · ${formatStamp(run.rejectedAt)}`;
  return `Saved by ${run.updatedBy} · ${formatStamp(run.updatedAt)}`;
};

/** Runs that were started but haven't posted, so a user can pick one back up. */
export const PendingRunsCard = ({ runs, activeRunId, getBankAccount, onOpen, onNewRun }: PendingRunsCardProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const head = `px-4 py-2.5 ${tableHeadClass(isLight)}`;

  return (
    <section aria-labelledby="pending-runs-title" className={`${CARD_CLASS} flex flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 id="pending-runs-title" className={SECTION_TITLE_CLASS}>
          Check runs in progress <span className="text-white/50 normal-case tracking-normal">· {runs.length}</span>
        </h2>
        {activeRunId && (
          <Button variant="outline" size="sm" onClick={onNewRun} className={outlineButtonClass(isLight)}>
            <Plus className="w-4 h-4" />
            New check run
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className={`border-y ${dividerClass(isLight)} text-left`}>
              <th className={head}>Check date</th>
              <th className={head}>Bank account</th>
              <th className={head}>Checks</th>
              <th className={head}>Status</th>
              <th className={`${head} text-right`}>Total</th>
              <th className={head}>Last activity</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const active = run.id === activeRunId;
              const bank = getBankAccount(run.bankAccountId);
              return (
                <tr
                  key={run.id}
                  aria-current={active ? "true" : undefined}
                  className={`border-b last:border-0 ${rowBorderClass(isLight)} ${
                    active ? (isLight ? "bg-purple-100/70" : "bg-purple-600/[0.18]") : ""
                  }`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-white">
                    {formatIsoDate(run.checkDate)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-white/70">
                    {bank ? formatBankAccountLabel(bank) : "—"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-white tabular-nums">
                    {pluralize(run.checks.length, "check")}
                    {formatCheckRange(run.checks) && ` · ${formatCheckRange(run.checks)}`}
                  </td>
                  <td className="px-4 py-2.5">
                    <RunStatusBadge status={run.status} printed={!!run.printedAt} />
                    {run.status === "draft" && run.rejectedReason && (
                      <span
                        className="mt-1 block max-w-[220px] truncate text-xs text-red-300"
                        title={run.rejectedReason}
                      >
                        Rejected: {run.rejectedReason}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-white tabular-nums">
                    {formatMoney(run.total)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-white/50">{lastActivity(run)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {active ? (
                      <span className="text-xs font-medium text-white/50">Open below</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpen(run.id)}
                        aria-label={`${actionLabel(run)} the ${formatIsoDate(run.checkDate)} check run`}
                        className={outlineButtonClass(isLight)}
                      >
                        {actionLabel(run)}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PendingRunsCard;
