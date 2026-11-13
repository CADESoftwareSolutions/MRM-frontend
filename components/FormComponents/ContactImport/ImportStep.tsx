import { AlertCircle, AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import type { ContactImportOutcome } from "@/hooks/useContactImport";
import { SECTION_HEADER_CLASS, useImportTheme } from "../../AccountingComponents/Revenue/import/importTheme";
import { listJoin, plural } from "./contactImportModel";

/** Why rows weren't sent, counted when the import started. */
export interface SkippedBreakdown {
  errors: number;
  leftOut: number;
  matched: number;
  duplicates: number;
  unchanged: number;
}

export interface ImportRun {
  total: number;
  done: number;
  running: boolean;
  stopping: boolean;
  outcomes: ContactImportOutcome[];
  skipped: SkippedBreakdown;
  /** Set when the import couldn't run at all. */
  fatal: string | null;
}

export interface ImportStepProps {
  run: ImportRun;
  onDownloadRowsToFix: (() => void) | null;
  /** Contacts that saved but need an address or phone added by hand; not for uploading again. */
  onDownloadRowsToFinish: (() => void) | null;
}

const Tile = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className="rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3">
    <div className={`text-2xl font-semibold tabular-nums ${tone ?? "text-white"}`}>{value.toLocaleString("en-US")}</div>
    <div className="text-sm text-white/70">{label}</div>
  </div>
);

export const ImportStep = ({ run, onDownloadRowsToFix, onDownloadRowsToFinish }: ImportStepProps) => {
  const theme = useImportTheme();

  if (run.running) {
    const percent = run.total ? Math.round((run.done / run.total) * 100) : 0;
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-12">
        <Loader2 className="size-8 animate-spin text-purple-300" aria-hidden />
        <span className="text-sm text-white">
          Importing {Math.min(run.done + 1, run.total).toLocaleString("en-US")} of {run.total.toLocaleString("en-US")}…
        </span>
        <div
          role="progressbar"
          aria-label="Import progress"
          aria-valuemin={0}
          aria-valuemax={run.total}
          aria-valuenow={run.done}
          className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10"
        >
          <div className="h-full rounded-full bg-purple-600 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-white/60">
          {run.stopping
            ? "Stopping once the rows in progress finish…"
            : "Keep this page open until the import finishes."}
        </span>
      </div>
    );
  }

  if (run.fatal) {
    return (
      <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>The import couldn&apos;t run: {run.fatal}</span>
      </div>
    );
  }

  const created = run.outcomes.filter((o) => o.result === "created").length;
  const updated = run.outcomes.filter((o) => o.result === "updated").length;
  const failed = run.outcomes.filter((o) => o.result === "failed");
  const partial = run.outcomes.filter((o) => o.result !== "failed" && o.problems.length > 0);
  const notStarted = run.outcomes.filter((o) => o.result === "notStarted").length;
  const { skipped } = run;
  const skippedTotal = skipped.errors + skipped.leftOut + skipped.matched + skipped.duplicates + skipped.unchanged + notStarted;
  const skippedParts = [
    skipped.errors && `${skipped.errors.toLocaleString("en-US")} with errors`,
    skipped.leftOut && `${skipped.leftOut.toLocaleString("en-US")} you left out`,
    skipped.matched && `${plural(skipped.matched, "match", "matches")} for existing contacts`,
    skipped.unchanged && `${skipped.unchanged.toLocaleString("en-US")} already up to date`,
    skipped.duplicates && `${plural(skipped.duplicates, "repeated row")}`,
    notStarted && `${notStarted.toLocaleString("en-US")} not started because the import was stopped`,
  ].filter((part): part is string => !!part);
  const problems = failed.length + partial.length;
  const stopped = notStarted > 0;

  return (
    <div className="flex flex-col gap-4">
      <p
        role="status"
        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${problems || stopped ? theme.warnBox : theme.okBox}`}
      >
        {problems || stopped ? (
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        )}
        {stopped
          ? "The import was stopped. Rows already imported were kept."
          : problems
            ? `The import finished, but ${plural(problems, "row")} ${problems === 1 ? "needs" : "need"} a look.`
            : "The import finished."}
      </p>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <Tile label="Created" value={created} tone={created ? theme.okText : undefined} />
        <Tile label="Updated" value={updated} />
        <Tile label="Skipped" value={skippedTotal} />
        <Tile label="Failed" value={failed.length} tone={failed.length ? theme.badText : undefined} />
      </div>

      {skippedParts.length > 0 && <p className="text-sm text-white/70">Skipped: {listJoin(skippedParts)}.</p>}

      {problems > 0 && (
        <section aria-label="Rows that need a look" className={`rounded-lg border p-3 text-sm ${theme.errorBox}`}>
          <h3 className={`${SECTION_HEADER_CLASS} mb-2`}>Rows that need a look</h3>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {failed.map((outcome) => (
              <li key={outcome.rowNumber}>
                <span className="font-medium tabular-nums">Row {outcome.rowNumber}</span> · {outcome.name}: not
                {outcome.nameId ? ` updated (${outcome.nameId})` : " created"}. {outcome.error}
              </li>
            ))}
            {partial.map((outcome) => (
              <li key={outcome.rowNumber}>
                <span className="font-medium tabular-nums">Row {outcome.rowNumber}</span> · {outcome.name}: Contact saved
                ({outcome.result === "created" ? "created" : "updated"} as {outcome.nameId}) — add the address/phone by
                hand. Not saved: {outcome.problems.join("; ")}. Don&apos;t upload this row again.
              </li>
            ))}
          </ul>
        </section>
      )}

      {onDownloadRowsToFix && (
        <button
          type="button"
          onClick={onDownloadRowsToFix}
          className={`inline-flex items-center gap-1.5 self-start text-sm ${theme.link}`}
        >
          <Download className="size-3.5" aria-hidden />
          Download the rows to fix (.csv)
        </button>
      )}

      {onDownloadRowsToFinish && (
        <button
          type="button"
          onClick={onDownloadRowsToFinish}
          className={`inline-flex items-center gap-1.5 self-start text-sm ${theme.link}`}
        >
          <Download className="size-3.5" aria-hidden />
          Download the saved contacts to finish by hand (.csv)
        </button>
      )}
    </div>
  );
};

export default ImportStep;
