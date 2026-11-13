import { type DragEvent, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { SECTION_HEADER_CLASS, useImportTheme } from "../../AccountingComponents/Revenue/import/importTheme";
import { ParsedSheet, plural } from "./contactImportModel";

export interface UploadStepProps {
  fileName: string | null;
  sheet: ParsedSheet | null;
  reading: boolean;
  /** The file couldn't be read at all (wrong type, unreadable). */
  fileError: string | null;
  /** Name of the saved mapping picked for this file's columns. */
  templateName: string | null;
  onFile: (file: File) => void;
  onDownloadTemplate: () => void;
}

export const UploadStep = ({
  fileName,
  sheet,
  reading,
  fileError,
  templateName,
  onFile,
  onDownloadTemplate,
}: UploadStepProps) => {
  const theme = useImportTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

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
        aria-describedby="contact-import-upload-help"
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
            <span className="text-base font-medium text-white">Drag your contacts spreadsheet here, or click to browse</span>
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

      <div id="contact-import-upload-help" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-white/70">
          One contact per row, with the column names above the first one. In Excel, choose File › Save As › CSV (Comma
          delimited) before uploading.
        </p>
        <button type="button" onClick={onDownloadTemplate} className={`inline-flex items-center gap-1.5 text-sm ${theme.link}`}>
          <Download className="size-3.5" aria-hidden />
          Download a blank template (.csv)
        </button>
      </div>

      {fileError && (
        <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{fileError}</span>
        </div>
      )}

      {sheet?.fatal && (
        <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{sheet.fatal} Fix the file in Excel and upload it again.</span>
        </div>
      )}

      {sheet && !sheet.fatal && (
        <section
          aria-label="What was read"
          className="flex flex-col gap-2 rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3"
        >
          <h3 className={SECTION_HEADER_CLASS}>What was read</h3>
          <p className={`flex items-start gap-2 text-sm ${theme.okText}`}>
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {plural(sheet.rows.length, "row")} under the column names in row {sheet.headerRow}, with{" "}
              {plural(sheet.columns.length, "column")}.
            </span>
          </p>
          {templateName && (
            <p className="text-sm text-white/70">
              These columns match your saved mapping “{templateName}”, so its choices are used on the next step.
            </p>
          )}
          {sheet.notes.map((note) => (
            <p key={note} className="text-sm text-white/70">
              {note}
            </p>
          ))}
        </section>
      )}
    </div>
  );
};

export default UploadStep;
