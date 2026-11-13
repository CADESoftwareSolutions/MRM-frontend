import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { AlertCircle, FileText, Loader2, Paperclip, ScanLine, Upload, X } from "lucide-react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import {
  READABLE_DOCUMENT_ACCEPT,
  isImageFile,
  isPdfFile,
  isReadableDocument,
  useDocumentReader,
} from "@/hooks/useDocumentReader";
import type { DocumentKind, DocumentReadResultFor } from "@/types/documentReader";
import { AutoFilledBadge } from "./AutoFilledBadge";

export interface DocumentReaderPanelProps<K extends DocumentKind> {
  kind: K;
  title: string;
  readLabel: string;
  file: File | null;
  /** Called with null on Remove; a parent holding existingFileName should clear it then too. */
  onFileChange: (file: File | null) => void;
  /** A saved record's document name when there's no File to preview or read. */
  existingFileName?: string | null;
  attachments?: File[];
  /** The backup drop zone and list only render when this is given. */
  onAttachmentsChange?: (files: File[]) => void;
  onExtracted: (result: DocumentReadResultFor<K>) => void;
  autoFilledLabels?: string[];
  /** Defaults to true. False drops the preview box and keeps just the file row. */
  showPreview?: boolean;
  /** Extra actions under the document, e.g. "Import detail from Excel". */
  children?: ReactNode;
  className?: string;
}

const BACKUP_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff,.csv,.xls,.xlsx";

const KIND_NOUN: Record<DocumentKind, string> = {
  invoice: "invoice",
  checkStub: "check stub",
};

const GHOST_BUTTON =
  "h-7 px-2 text-xs text-purple-300 hover:bg-purple-500/20 hover:text-purple-100 cursor-pointer";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const openInNewTab = (file: File) => {
  const url = URL.createObjectURL(file);
  if (isReadableDocument(file)) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    // A blob URL's name is a GUID, so other file types download through a named link instead.
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  }
  // The new tab loads the blob asynchronously, so revoking right away would leave it blank.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const usePreviewUrl = (file: File | null) => {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return preview && preview.file === file ? preview.url : null;
};

export const DocumentReaderPanel = <K extends DocumentKind>({
  kind,
  title,
  readLabel,
  file,
  onFileChange,
  existingFileName,
  attachments = [],
  onAttachmentsChange,
  onExtracted,
  autoFilledLabels = [],
  showPreview = true,
  children,
  className,
}: DocumentReaderPanelProps<K>) => {
  const { readDocument, isReading, error, clearError } = useDocumentReader(kind);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(file);
  // Child elements fire their own enter/leave events, so a plain flag flickers (Safari most).
  const dragDepth = useRef(0);
  const backupDragDepth = useRef(0);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [backupDragging, setBackupDragging] = useState(false);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const previewUrl = usePreviewUrl(file);

  useEffect(
    () => () => {
      currentFileRef.current = null;
    },
    []
  );

  useEffect(() => {
    currentFileRef.current = file;
    clearError();
  }, [file, clearError]);

  const noun = KIND_NOUN[kind];
  const fileName = file?.name ?? existingFileName ?? null;
  const shownError = fileError ?? error;
  const mainDropActive = dragging && !backupDragging;

  const browseDocument = () => fileInputRef.current?.click();

  const pickDocument = (files: FileList | null) => {
    const next = files?.[0];
    if (!next) return;
    if (!isReadableDocument(next)) {
      setFileError(
        onAttachmentsChange
          ? `Only a PDF or image can be read as the ${noun}. Add other files as backup below.`
          : `Only a PDF or image can be read as the ${noun}.`
      );
      return;
    }
    setFileError(null);
    onFileChange(next);
  };

  const removeDocument = () => {
    setFileError(null);
    onFileChange(null);
  };

  const addAttachments = (files: FileList | null) => {
    if (!files || !onAttachmentsChange) return;
    const seen = new Set(attachments.map(fileKey));
    const added: File[] = [];
    for (const next of Array.from(files)) {
      if (seen.has(fileKey(next))) continue;
      seen.add(fileKey(next));
      added.push(next);
    }
    if (added.length > 0) onAttachmentsChange([...attachments, ...added]);
  };

  const removeAttachment = (index: number) =>
    onAttachmentsChange?.(attachments.filter((_, i) => i !== index));

  const handleRead = async () => {
    if (!file) return;
    const target = file;
    try {
      const result = await readDocument(target);
      if (currentFileRef.current === target) onExtracted(result);
    } catch {
      // The hook keeps the message as `error`, which renders below.
    }
  };

  const dropPlaceholder = (sizeClassName: string) => (
    <button
      type="button"
      onClick={browseDocument}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-all",
        sizeClassName,
        mainDropActive
          ? "border-purple-400 bg-purple-500/10"
          : "border-purple-300/30 hover:border-purple-400/50 hover:bg-white/5"
      )}
    >
      <Upload className="h-6 w-6 text-purple-300" />
      <span className="text-sm text-purple-200">
        {mainDropActive ? `Drop the ${noun} here` : `Click or drag the ${noun} here`}
      </span>
      <span className="text-xs text-white/50">PDF or image</span>
    </button>
  );

  const previewMessage = (message: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <FileText className="h-8 w-8 text-purple-300" />
      <p className="text-sm text-white/70">{message}</p>
    </div>
  );

  const renderPreview = () => {
    if (!file) {
      return previewMessage(`The saved ${noun} can't be previewed here yet. Replace it to read it again.`);
    }
    if (!previewUrl) return null;
    if (failedPreviewUrl !== previewUrl) {
      if (isImageFile(file)) {
        return (
          <img
            src={previewUrl}
            alt={`Preview of ${file.name}`}
            onError={() => setFailedPreviewUrl(previewUrl)}
            className="h-full w-full object-contain"
          />
        );
      }
      if (isPdfFile(file)) {
        return (
          <iframe
            src={previewUrl}
            title={`Preview of ${file.name}`}
            className="h-full w-full border-0"
          />
        );
      }
    }
    return previewMessage("No preview for this file. Use Open to view it.");
  };

  return (
    <section
      aria-label={title}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      // Without preventDefault anywhere in the panel, a near-miss drop makes the browser
      // navigate to the file and the unsaved form is lost.
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        dragDepth.current = Math.max(dragDepth.current - 1, 0);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        pickDocument(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-white/5 p-4 transition-colors",
        mainDropActive && fileName && !showPreview ? "border-purple-400" : "border-purple-300/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || isReading}
          aria-busy={isReading}
          onClick={handleRead}
          className={cn(
            "bg-transparent shadow-none cursor-pointer",
            isLight
              ? "border-purple-300 bg-white text-purple-700 hover:bg-purple-100 hover:text-purple-800"
              : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
          )}
        >
          {isReading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ScanLine className="size-3.5" />
          )}
          {isReading ? "Reading…" : readLabel}
        </Button>
      </div>

      {!fileName && dropPlaceholder(showPreview ? "h-64" : "py-5")}

      {fileName && showPreview && (
        <div
          className={cn(
            "relative h-64 overflow-hidden rounded-lg border bg-white/5",
            mainDropActive ? "border-purple-400" : "border-purple-300/20"
          )}
        >
          {renderPreview()}
          {mainDropActive && (
            // Covers the PDF iframe, which would otherwise swallow the drop.
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <span className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white">
                Drop to replace the {noun}
              </span>
            </div>
          )}
        </div>
      )}

      {fileName && (
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-purple-300" />
            <span className="truncate text-white" title={fileName}>
              {fileName}
            </span>
            <span className="shrink-0 text-xs text-white/50">
              · {file ? formatBytes(file.size) : "saved"}
            </span>
          </span>
          <span className="flex shrink-0 gap-1">
            {previewUrl && (
              <Button asChild variant="ghost" size="sm" className={GHOST_BUTTON}>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={browseDocument} className={GHOST_BUTTON}>
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeDocument}
              className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-100 cursor-pointer"
            >
              Remove
            </Button>
          </span>
        </div>
      )}

      {shownError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-2"
        >
          <p className="flex items-start gap-1.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {shownError}
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setFileError(null);
              clearError();
            }}
            className="shrink-0 cursor-pointer text-red-400 hover:text-red-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {autoFilledLabels.length > 0 && (
        <div className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2.5 py-2 text-xs text-blue-200">
          <p>
            Fields marked <AutoFilledBadge title="" /> were read from this document. Check them
            before saving.
          </p>
          <p className="mt-1 font-medium">Filled in: {autoFilledLabels.join(", ")}</p>
        </div>
      )}

      {children}

      {onAttachmentsChange && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            onDragEnter={(e) => {
              if (!hasFiles(e)) return;
              backupDragDepth.current += 1;
              setBackupDragging(true);
            }}
            onDragOver={(e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
              setBackupDragging(true);
            }}
            onDragLeave={(e) => {
              if (!hasFiles(e)) return;
              backupDragDepth.current = Math.max(backupDragDepth.current - 1, 0);
              if (backupDragDepth.current === 0) setBackupDragging(false);
            }}
            onDrop={(e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
              e.stopPropagation();
              backupDragDepth.current = 0;
              dragDepth.current = 0;
              setBackupDragging(false);
              setDragging(false);
              addAttachments(e.dataTransfer.files);
            }}
            className={cn(
              "w-full cursor-pointer rounded-lg border-2 border-dashed p-3 text-center text-xs text-purple-200 transition-all",
              backupDragging
                ? "border-purple-400 bg-purple-500/10"
                : "border-purple-300/30 hover:border-purple-400/50 hover:bg-white/5"
            )}
          >
            Drop backup here (tickets, receipts) or{" "}
            <span className="underline underline-offset-2">browse</span>
          </button>

          {attachments.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {attachments.map((attachment, index) => (
                <li
                  key={`${fileKey(attachment)}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-purple-300/20 bg-white/5 px-2.5 py-1.5"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-purple-300" />
                  <button
                    type="button"
                    onClick={() => openInNewTab(attachment)}
                    title={`Open ${attachment.name}`}
                    className="min-w-0 flex-1 cursor-pointer truncate text-left text-xs text-white hover:underline"
                  >
                    {attachment.name}
                  </button>
                  <span className="shrink-0 text-xs text-white/50">{formatBytes(attachment.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => removeAttachment(index)}
                    className="shrink-0 cursor-pointer text-white/50 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={READABLE_DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          pickDocument(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={backupInputRef}
        type="file"
        accept={BACKUP_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          addAttachments(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
};

export default DocumentReaderPanel;
