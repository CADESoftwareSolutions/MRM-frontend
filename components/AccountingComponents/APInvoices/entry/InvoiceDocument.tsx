import { Paperclip, X } from "lucide-react";
import type { DocumentReadResultFor } from "@/types/documentReader";
import { DocumentReaderPanel } from "../../DocumentReaderPanel";

interface InvoiceDocumentProps {
  readOnly: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** The saved document's name, shown when there's no File in hand. */
  documentName: string | null;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  /** Backup already saved on the invoice (names only; the files aren't stored yet). */
  savedAttachmentNames: string[];
  onSavedAttachmentNamesChange: (names: string[]) => void;
  onExtracted: (result: DocumentReadResultFor<"invoice">) => void;
  autoFilledLabels: string[];
}

const FileRow = ({ name, note, onRemove }: { name: string; note?: string; onRemove?: () => void }) => (
  <li className="flex items-center gap-2 rounded-md border border-purple-300/20 bg-white/5 px-2.5 py-1.5">
    <Paperclip className="h-3.5 w-3.5 shrink-0 text-purple-300" />
    <span className="min-w-0 flex-1 truncate text-xs text-white" title={name}>
      {name}
    </span>
    {note && <span className="shrink-0 text-xs text-white/50">{note}</span>}
    {onRemove && (
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        className="shrink-0 cursor-pointer text-white/50 hover:text-red-400"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </li>
);

export const InvoiceDocument = ({
  readOnly,
  file,
  onFileChange,
  documentName,
  attachments,
  onAttachmentsChange,
  savedAttachmentNames,
  onSavedAttachmentNamesChange,
  onExtracted,
  autoFilledLabels,
}: InvoiceDocumentProps) => {
  if (readOnly) {
    const names = [documentName, ...savedAttachmentNames].filter((name): name is string => !!name);
    return (
      <section
        aria-label="Invoice Document"
        className="flex flex-col gap-3 rounded-xl border border-purple-300/20 bg-white/5 p-4"
      >
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Invoice Document</h3>
        {names.length ? (
          <ul className="flex flex-col gap-1.5">
            {names.map((name, i) => (
              <FileRow key={`${name}-${i}`} name={name} note={i === 0 && documentName ? "Invoice" : "Backup"} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/50">No document attached.</p>
        )}
      </section>
    );
  }

  return (
    <DocumentReaderPanel
      kind="invoice"
      title="Invoice Document"
      readLabel="Read Invoice"
      file={file}
      onFileChange={onFileChange}
      existingFileName={documentName}
      attachments={attachments}
      onAttachmentsChange={onAttachmentsChange}
      onExtracted={onExtracted}
      autoFilledLabels={autoFilledLabels}
    >
      {savedAttachmentNames.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-label="Saved backup">
          {savedAttachmentNames.map((name, i) => (
            <FileRow
              key={`${name}-${i}`}
              name={name}
              note="saved"
              onRemove={() => onSavedAttachmentNamesChange(savedAttachmentNames.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
      )}
    </DocumentReaderPanel>
  );
};

export default InvoiceDocument;
