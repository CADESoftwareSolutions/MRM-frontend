import { useRef, useState } from "react";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { useFileUpload, FileEntityType } from "@/hooks/useFileUpload";

interface LeaseAttachmentsTabProps {
  entityType: FileEntityType;
  // undefined/null in "add" mode before the parent record has been saved — attaching a
  // file requires an existing entity_id on the backend, so uploads are disabled until then.
  entityId?: number | null;
}

const ACCEPTED = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff,.csv,.xls,.xlsx";

const formatBytes = (bytes: number | null) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (type: string | null) => {
  if (!type) return "text-purple-300";
  if (type.includes("pdf")) return "text-red-400";
  if (type.includes("word") || type.includes("document")) return "text-blue-400";
  if (type.includes("image")) return "text-green-400";
  return "text-purple-300";
};

export const LeaseAttachmentsTab = ({ entityType, entityId }: LeaseAttachmentsTabProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const {
    attachments,
    loading,
    uploading,
    uploadError,
    clearUploadError,
    uploadFile,
    detachFile,
    getDownloadUrl,
  } = useFileUpload({ entityType, entityId });

  if (entityId == null) {
    return (
      <p className="text-center text-sm text-purple-300/60 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save to enable document uploads.
      </p>
    );
  }

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch {
        // uploadError is already surfaced below; keep uploading the rest of the batch
      }
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await detachFile(id);
    } finally {
      setRemovingId(null);
    }
  };

  const open = async (fileId: number) => {
    const url = await getDownloadUrl(fileId);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 transition-all ${
          uploading
            ? "border-purple-300/20 opacity-60 cursor-not-allowed"
            : dragging
              ? "border-purple-400 bg-purple-500/10 cursor-pointer"
              : "border-purple-300/30 hover:border-purple-400/50 hover:bg-white/5 cursor-pointer"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-purple-300/60 animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-purple-300/60" />
        )}
        <p className="text-sm text-purple-200">
          {uploading ? "Uploading…" : "Click or drag files here to attach"}
        </p>
        <p className="text-xs text-purple-300/50">PDF, Word, Excel, images supported</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {uploadError && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/40">
          <p className="text-xs text-red-300">{uploadError}</p>
          <button
            type="button"
            onClick={clearUploadError}
            className="text-red-400 hover:text-red-200 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File list */}
      {loading && (
        <p className="text-center text-xs text-purple-300/40 py-2">Loading documents…</p>
      )}

      {!loading && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-purple-300/20"
            >
              <FileText className={`w-5 h-5 shrink-0 ${fileIcon(a.contentType)}`} />
              <button
                type="button"
                onClick={() => open(a.fileId)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <p className="text-sm text-white truncate hover:underline">{a.originalFilename}</p>
                <p className="text-xs text-purple-300/60">{formatBytes(a.byteSize)}</p>
              </button>
              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={removingId === a.id}
                className="text-purple-300/50 hover:text-red-300 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              >
                {removingId === a.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && attachments.length === 0 && (
        <p className="text-center text-xs text-purple-300/40 py-2">No documents attached yet.</p>
      )}
    </div>
  );
};

export default LeaseAttachmentsTab;
