import { type DragEvent, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import type { CheckDetailParseResult } from "@/lib/checkDetailCsv";
import { downloadSampleCheckDetail } from "./importFile";
import { formatRowRanges, plural } from "./importModel";
import { SECTION_HEADER_CLASS, useImportTheme } from "./importTheme";

export interface UploadStepProps {
  fileName: string | null;
  result: CheckDetailParseResult | null;
  reading: boolean;
  /** The file couldn't be read at all (wrong type, unreadable). */
  fileError: string | null;
  onFile: (file: File) => void;
}

// Past this the list stops helping; the user fixes the pattern in Excel and uploads again.
const MAX_ERRORS_SHOWN = 50;

export const UploadStep = ({ fileName, result, reading, fileError, onFile }: UploadStepProps) => {
  const theme = useImportTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const errors = result?.errors ?? [];
  const shownErrors = errors.slice(0, MAX_ERRORS_SHOWN);
  const ready = result && !result.fatal && result.checks.length > 0;
  const skippedPronoun = result?.skippedRows.length === 1 ? "it" : "them";

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-describedby="check-detail-upload-help"
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400/40 ${
          dragging ? theme.dropZoneActive : theme.dropZone
        }`}
      >
        {reading ? (
          <Loader2 className="size-10 animate-spin text-purple-300" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-10 text-purple-300" aria-hidden />
        )}
        {fileName ? (
          <>
            <span className="text-base font-medium text-white">{fileName}</span>
            <span className="text-sm text-white/60">
              {reading ? "Reading…" : "Drop another file here or click to choose a different one"}
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-medium text-white">
              Drag the operator&apos;s check detail here, or click to browse
            </span>
            <span className="text-sm text-white/60">.csv files</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />

      <div
        id="check-detail-upload-help"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm"
      >
        <p className="text-white/70">
          One detail line per row, columns Operator Name … Detail Line Notation. In Excel, choose File › Save As › CSV
          before uploading.
        </p>
        <button
          type="button"
          onClick={downloadSampleCheckDetail}
          className={`inline-flex items-center gap-1.5 text-sm ${theme.link}`}
        >
          <Download className="size-3.5" aria-hidden />
          Download sample file
        </button>
      </div>

      {fileError && (
        <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{fileError}</span>
        </div>
      )}

      {result?.fatal && (
        <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{result.fatal}</span>
        </div>
      )}

      <div role="status">
        {result && !result.fatal && (
          <section
            aria-label="What was read"
            className="flex flex-col gap-3 rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3"
          >
            <h3 className={SECTION_HEADER_CLASS}>What was read</h3>
            <p className={`flex items-start gap-2 text-sm ${ready ? theme.okText : theme.badText}`}>
              {ready ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span>
                {plural(result.rowCount, "row")} under the column names:{" "}
                {ready
                  ? `${plural(result.checks.length, "check")} with ${plural(result.lineCount, "detail line")}.`
                  : "no detail lines could be read."}
              </span>
            </p>

            {result.ignoredRows.length > 0 && (
              <p className="text-sm text-white/70">
                {plural(result.ignoredRows.length, "row")} with no Operator Name, Check Number or amounts{" "}
                {result.ignoredRows.length === 1 ? "was" : "were"} ignored (row {formatRowRanges(result.ignoredRows)}),
                such as a list of labels under the data.
              </p>
            )}

            {result.warnings.map((warning) => (
              <p key={warning} className={`text-sm ${theme.warnText}`}>
                {warning}
              </p>
            ))}

            {result.missingColumns.length > 0 && (
              <p className="text-sm text-white/70">
                Not in the file, so left blank: {result.missingColumns.join(", ")}.
              </p>
            )}

            {result.unusedColumns.length > 0 && (
              <p className="text-sm text-white/70">
                Not part of the standard layout, so not imported: {result.unusedColumns.join(", ")}.
              </p>
            )}

            {errors.length > 0 && (
              <div className={`rounded-lg border p-3 text-sm ${theme.errorBox}`}>
                <p className="font-semibold">
                  {plural(result.skippedRows.length, "row")} {result.skippedRows.length === 1 ? "has" : "have"} problems
                  {ready
                    ? ` and will be left out. Fix ${skippedPronoun} in Excel and upload again, or continue without ${skippedPronoun}.`
                    : `. Fix ${skippedPronoun} in Excel and upload the file again.`}
                </p>
                <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
                  {shownErrors.map((error, index) => (
                    <li key={`${error.row}-${index}`}>
                      <span className="font-medium tabular-nums">Row {error.row}:</span> {error.message}
                    </li>
                  ))}
                </ul>
                {errors.length > shownErrors.length && (
                  <p className="mt-2">and {plural(errors.length - shownErrors.length, "more problem")}.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default UploadStep;
