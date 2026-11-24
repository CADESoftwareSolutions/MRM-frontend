import type { ReactNode } from "react";
import type { CheckDetailCheck } from "@/lib/checkDetailCsv";
import { computeCheckTotals, formatMoney, sumCents } from "@/types/revenue";
import { MatchBadge } from "./MatchBadge";
import { plural } from "./importModel";
import { SECTION_HEADER_CLASS, useImportTheme } from "./importTheme";

export interface FileCheckRailProps {
  checks: CheckDetailCheck[];
  needsMatch: number;
  remember: boolean;
  onRememberChange: (remember: boolean) => void;
  /** "Smith Operating Co", or "these 3 operators". */
  rememberFor: string;
}

const CheckRow = ({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) => (
  <div className={`flex items-center justify-between gap-3 py-2 text-sm ${last ? "" : "border-b border-purple-300/10"}`}>
    <span className="text-white/70">{label}</span>
    <span className="min-w-0 text-right text-white">{children}</span>
  </div>
);

const BalanceBadge = ({ difference }: { difference: number }) =>
  Math.abs(difference) < 0.005 ? (
    <MatchBadge tone="green">Balanced</MatchBadge>
  ) : (
    <MatchBadge tone="red" title="Check amount − owner net total">
      Off by ${formatMoney(difference)}
    </MatchBadge>
  );

export const FileCheckRail = ({ checks, needsMatch, remember, onRememberChange, rememberFor }: FileCheckRailProps) => {
  const theme = useImportTheme();
  const totals = checks.map((check) => ({ check, totals: computeCheckTotals(check) }));
  const lineCount = checks.reduce((n, check) => n + check.lines.length, 0);
  const single = checks.length === 1;
  const numbers = checks.map((check) => `#${check.checkNumber}`);

  return (
    <aside aria-label="File check" className="max-w-full flex-[1_1_280px]">
      <section className="flex flex-col rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3.5">
        <h3 className={`${SECTION_HEADER_CLASS} mb-1`}>File Check</h3>
        <CheckRow label="Checks in file">
          <span className="tabular-nums">
            {checks.length} · {numbers.length <= 2 ? numbers.join(", ") : `${numbers.slice(0, 2).join(", ")}…`}
          </span>
        </CheckRow>
        <CheckRow label="Detail lines">
          <span className="tabular-nums">{lineCount}</span>
        </CheckRow>
        <CheckRow label={single ? "Check amount" : "Check amounts"}>
          <span className="tabular-nums">${formatMoney(sumCents(checks.map((c) => c.checkAmount)))}</span>
        </CheckRow>
        <CheckRow label="Owner net total" last={single}>
          <span className="tabular-nums">${formatMoney(sumCents(totals.map((t) => t.totals.ownerNet)))}</span>
        </CheckRow>
        {single ? (
          <CheckRow label="Balance" last>
            <BalanceBadge difference={totals[0].totals.difference} />
          </CheckRow>
        ) : (
          <div className="py-2">
            <p className="mb-1 text-sm text-white/70">Balance per check</p>
            <ul className="flex flex-col gap-1.5">
              {totals.map(({ check, totals: t }) => (
                <li key={check.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="tabular-nums text-white">#{check.checkNumber}</span>
                  <BalanceBadge difference={t.difference} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <p role="status" className={`my-1.5 text-xs ${needsMatch ? theme.warnText : theme.okText}`}>
          {needsMatch
            ? `${plural(needsMatch, "item")} ${needsMatch === 1 ? "needs" : "need"} a match before you can continue.`
            : "Everything is matched."}
        </p>

        <label className="flex cursor-pointer items-start gap-2 border-t border-purple-300/20 pt-2.5 text-[13px] text-white">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => onRememberChange(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-purple-600"
          />
          <span>
            Remember new matches for {rememberFor}
            <span className="block text-xs text-white/60">Owner numbers and Operator CCs match on their own next time.</span>
          </span>
        </label>
      </section>
    </aside>
  );
};

export default FileCheckRail;
