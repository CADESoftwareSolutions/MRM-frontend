import type { ReactNode } from "react";
import { formatIsoDate, formatUsd } from "@/types/apInvoices";
import { BankAccount, CheckRun, formatBankAccountLabel, formatCheckRange } from "@/types/checkRuns";
import { RunStatusBadge, formatStamp } from "./ui";

interface RunOverviewProps {
  run: CheckRun;
  bank: BankAccount | undefined;
  title: string;
  /** Buttons shown beside the title. */
  actions?: ReactNode;
}

const history = (run: CheckRun) =>
  [
    `Created by ${run.createdBy} · ${formatStamp(run.createdAt)}`,
    run.submittedAt && `Submitted by ${run.submittedBy} · ${formatStamp(run.submittedAt)}`,
    run.approvedAt && `Approved by ${run.approvedBy} · ${formatStamp(run.approvedAt)}`,
    run.printedAt &&
      `Printed by ${run.printedBy} · ${formatStamp(run.printedAt)}${run.printCount > 1 ? ` (${run.printCount} times)` : ""}`,
  ].filter((entry): entry is string => !!entry);

export const RunOverview = ({ run, bank, title, actions }: RunOverviewProps) => {
  const stats: [string, ReactNode][] = [
    ["Bank account", bank ? formatBankAccountLabel(bank) : "—"],
    ["Check date", formatIsoDate(run.checkDate)],
    ["Checks", `${run.checks.length} · ${formatCheckRange(run.checks)}`],
    ["Vendors", new Set(run.checks.map((check) => check.vendorId)).size],
    ["Invoices", run.items.length],
    ["Total", formatUsd(run.total)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
            {title}
            <RunStatusBadge status={run.status} printed={!!run.printedAt} />
          </h2>
          <p className="mt-1 text-xs text-white/50">{history(run).join(" · ")}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-purple-300/20 bg-white/5 px-3 py-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</dt>
            <dd className="mt-1 truncate font-semibold text-white tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default RunOverview;
