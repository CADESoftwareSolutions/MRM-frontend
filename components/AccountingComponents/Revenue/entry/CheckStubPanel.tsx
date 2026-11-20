import { Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExtractedCheckStubFields } from "@/types/documentReader";
import { DocumentReaderPanel } from "../../DocumentReaderPanel";
import { SECTION_HEADER_CLASS, useEntryTheme } from "./entryTheme";

interface CheckStubPanelProps {
  readOnly: boolean;
  file: File | null;
  /** The saved stub's name when there's no File in hand. */
  fileName: string | null;
  onFileChange: (file: File | null) => void;
  onExtracted: (fields: ExtractedCheckStubFields) => void;
  autoFilledLabels: string[];
  onImport: () => void;
}

/** The check stub beside the header fields: attach it, read it, or import the detail lines
 * from the operator's Excel file instead. A posted check just names its stub. */
export const CheckStubPanel = ({
  readOnly,
  file,
  fileName,
  onFileChange,
  onExtracted,
  autoFilledLabels,
  onImport,
}: CheckStubPanelProps) => {
  const theme = useEntryTheme();

  if (readOnly) {
    return (
      <section aria-label="Check Stub" className="flex flex-col gap-3 rounded-xl border border-purple-300/20 bg-white/5 p-4">
        <h3 className={SECTION_HEADER_CLASS}>Check Stub</h3>
        {fileName ? (
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-purple-300" />
            <span className="truncate text-white" title={fileName}>
              {fileName}
            </span>
          </span>
        ) : (
          <p className="text-sm text-white/60">No stub attached.</p>
        )}
      </section>
    );
  }

  return (
    <DocumentReaderPanel
      kind="checkStub"
      title="Check Stub"
      readLabel="Read Stub"
      file={file}
      onFileChange={onFileChange}
      existingFileName={fileName}
      onExtracted={(result) => onExtracted(result.fields)}
      autoFilledLabels={autoFilledLabels}
      showPreview={false}
    >
      <Button type="button" variant="outline" onClick={onImport} className={cn("w-full cursor-pointer", theme.outlineButton)}>
        <Upload className="h-4 w-4" />
        Import detail from Excel
      </Button>
      <p className="text-xs text-white/60">
        Detail lines can come from the operator&apos;s Excel file, be typed in, or later be read from the stub.
      </p>
    </DocumentReaderPanel>
  );
};

export default CheckStubPanel;
