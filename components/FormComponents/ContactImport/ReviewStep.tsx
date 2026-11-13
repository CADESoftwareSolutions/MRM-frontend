import { useEffect, useMemo, useRef, useState } from "react";
import { MatchBadge, MatchTone } from "../../AccountingComponents/Revenue/import/MatchBadge";
import { SECTION_HEADER_CLASS, useImportTheme } from "../../AccountingComponents/Revenue/import/importTheme";
import {
  ReviewRow,
  RowStatus,
  addressSummary,
  canImport,
  countRows,
  maskedTaxId,
  plural,
} from "./contactImportModel";

export type IncludedReviewRow = ReviewRow & { included: boolean };

export interface ReviewStepProps {
  rows: IncludedReviewRow[];
  onToggle: (rowNumbers: number[], included: boolean) => void;
}

type Filter = "all" | RowStatus;

const STATUS_BADGE: Record<RowStatus, { tone: MatchTone; label: string }> = {
  new: { tone: "green", label: "New" },
  update: { tone: "blue", label: "Update" },
  skip: { tone: "gray", label: "Skip" },
  error: { tone: "red", label: "Error" },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "update", label: "Update" },
  { id: "skip", label: "Skip" },
  { id: "error", label: "Error" },
];

// Rendering thousands of rows at once makes the step sluggish; the rest are a click away.
const PAGE_SIZE = 200;

export const ReviewStep = ({ rows, onToggle }: ReviewStepProps) => {
  const theme = useImportTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => countRows(rows), [rows]);
  const filtered = useMemo(() => (filter === "all" ? rows : rows.filter((row) => row.status === filter)), [rows, filter]);
  const visible = filtered.slice(0, shown);
  const togglable = filtered.filter(canImport);
  const togglableIncluded = togglable.filter((row) => row.included).length;
  const included = rows.filter((row) => row.included);
  const newCount = included.filter((row) => row.status === "new").length;

  useEffect(() => setShown(PAGE_SIZE), [filter]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = togglableIncluded > 0 && togglableIncluded < togglable.length;
    }
  }, [togglableIncluded, togglable.length]);

  const countFor = (id: Filter) => (id === "all" ? rows.length : counts[id]);
  const th = `px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${theme.headerText}`;
  const td = "px-3 py-2 align-top";

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Show rows" className="flex flex-wrap gap-0.5 self-start rounded-[10px] border border-purple-300/20 bg-white/5 p-[3px]">
        {FILTERS.map(({ id, label }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(id)}
              className={`h-[30px] rounded-md px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-purple-600 text-white"
                  : theme.isLight
                    ? "text-purple-700 hover:bg-purple-200/60"
                    : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
              }`}
            >
              {label} <span className="tabular-nums opacity-80">({countFor(id).toLocaleString("en-US")})</span>
            </button>
          );
        })}
      </div>

      <section aria-label="Rows to import" className="rounded-xl border border-purple-300/20 bg-white/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3">
          <h3 className={SECTION_HEADER_CLASS}>Rows to import</h3>
          <span className="text-xs text-white/60">
            {plural(included.length, "row")} selected · {newCount.toLocaleString("en-US")} new ·{" "}
            {plural(included.length - newCount, "update")}
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-white/60">No rows here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-purple-300/20">
                  <th className={`${th} w-10`}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={togglable.length > 0 && togglableIncluded === togglable.length}
                      disabled={togglable.length === 0}
                      onChange={(event) =>
                        onToggle(
                          togglable.map((row) => row.rowNumber),
                          event.target.checked,
                        )
                      }
                      aria-label="Import every row shown"
                      className="size-4 cursor-pointer accent-purple-600 disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className={th}>Row</th>
                  <th className={th}>Name</th>
                  <th className={th}>Address</th>
                  <th className={th}>Tax ID</th>
                  <th className={th}>Status</th>
                  <th className={th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const togglableRow = canImport(row);
                  const badge = STATUS_BADGE[row.status];
                  return (
                    <tr
                      key={row.rowNumber}
                      className={`border-b last:border-0 ${theme.rowBorder} ${togglableRow && !row.included ? "opacity-60" : ""}`}
                    >
                      <td className={td}>
                        <input
                          type="checkbox"
                          checked={row.included}
                          disabled={!togglableRow}
                          onChange={(event) => onToggle([row.rowNumber], event.target.checked)}
                          aria-label={`Import row ${row.rowNumber}`}
                          className="mt-0.5 size-4 cursor-pointer accent-purple-600 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className={`${td} tabular-nums text-white/70`}>{row.rowNumber}</td>
                      <td className={`${td} min-w-[180px] text-white`}>
                        <span className="block font-semibold">{row.record.name || "—"}</span>
                        {row.record.nameLine2 && <span className="block text-xs text-white/70">{row.record.nameLine2}</span>}
                        <span className="block text-xs text-white/60">{row.record.classifications.join(", ")}</span>
                      </td>
                      <td className={`${td} max-w-[260px] text-white/80`}>
                        <span className="line-clamp-2">{addressSummary(row.record) || "—"}</span>
                      </td>
                      <td className={`${td} whitespace-nowrap tabular-nums text-white/80`}>{maskedTaxId(row.record) || "—"}</td>
                      <td className={td}>
                        <MatchBadge tone={badge.tone}>{badge.label}</MatchBadge>
                        {togglableRow && !row.included && <span className="mt-1 block text-xs text-white/60">Left out</span>}
                      </td>
                      <td className={`${td} min-w-[300px]`}>
                        <ul className="flex flex-col gap-0.5 text-xs">
                          {row.errors.map((issue, i) => (
                            <li key={`${i}-${issue.message}`} className={theme.badText}>
                              {issue.message}
                            </li>
                          ))}
                          {row.warnings.map((warning, i) => (
                            <li key={`${i}-${warning}`} className={theme.warnText}>
                              {warning}
                            </li>
                          ))}
                          {row.note && <li className="text-white/70">{row.note}</li>}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > visible.length && (
          <div className="border-t border-purple-300/20 px-4 py-2.5">
            <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className={`text-sm ${theme.link}`}>
              Show {Math.min(PAGE_SIZE, filtered.length - visible.length).toLocaleString("en-US")} more of{" "}
              {(filtered.length - visible.length).toLocaleString("en-US")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewStep;
