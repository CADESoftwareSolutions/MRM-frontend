import { useRef, useState } from "react";
import { FileText, Upload, X, File } from "lucide-react";

export interface LeaseAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  file: File;
}

interface LeaseAttachmentsTabProps {
  value: LeaseAttachment[];
  onChange: (attachments: LeaseAttachment[]) => void;
}

const ACCEPTED = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (type: string) => {
  if (type.includes("pdf")) return "text-red-400";
  if (type.includes("word") || type.includes("document")) return "text-blue-400";
  if (type.includes("image")) return "text-green-400";
  return "text-purple-300";
};

export const LeaseAttachmentsTab = ({ value, onChange }: LeaseAttachmentsTabProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: LeaseAttachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date(),
      file: f,
    }));
    onChange([...value, ...newAttachments]);
  };

  const remove = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
          dragging
            ? "border-purple-400 bg-purple-500/10"
            : "border-purple-300/30 hover:border-purple-400/50 hover:bg-white/5"
        }`}
      >
        <Upload className="w-6 h-6 text-purple-300/60" />
        <p className="text-sm text-purple-200">Click or drag files here to attach</p>
        <p className="text-xs text-purple-300/50">PDF, Word, images supported</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* File list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-purple-300/20"
            >
              <FileText className={`w-5 h-5 shrink-0 ${fileIcon(a.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{a.name}</p>
                <p className="text-xs text-purple-300/60">{formatBytes(a.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="text-purple-300/50 hover:text-red-300 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-center text-xs text-purple-300/40 py-2">No documents attached yet.</p>
      )}
    </div>
  );
};

export default LeaseAttachmentsTab;
