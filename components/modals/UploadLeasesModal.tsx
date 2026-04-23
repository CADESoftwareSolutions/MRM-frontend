import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadLeasesModalProps {
  onClose: () => void;
  onImport: (rows: Record<string, any>[]) => void;
}

function parseCSV(text: string): Record<string, any>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return headers.reduce(
      (obj, key, i) => {
        obj[key] = values[i] ?? "";
        return obj;
      },
      {} as Record<string, any>
    );
  });
}

export const UploadLeasesModal = ({ onClose, onImport }: UploadLeasesModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setRows([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError("No data rows found. Ensure the file has a header row and at least one data row.");
        } else {
          setRows(parsed);
        }
      } catch {
        setError("Failed to parse file. Please use a valid CSV format.");
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a2e] border border-purple-300/30 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-purple-300/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-300" />
            Upload Leases from Spreadsheet
          </h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-purple-200/70 text-sm">
            Upload a CSV file to bulk import leases. Column headers should match lease
            field names such as{" "}
            <code className="text-purple-300 bg-purple-900/40 px-1 rounded">lessor</code>,{" "}
            <code className="text-purple-300 bg-purple-900/40 px-1 rounded">lessee</code>,{" "}
            <code className="text-purple-300 bg-purple-900/40 px-1 rounded">state</code>,{" "}
            <code className="text-purple-300 bg-purple-900/40 px-1 rounded">county</code>,{" "}
            <code className="text-purple-300 bg-purple-900/40 px-1 rounded">effectiveDate</code>.
          </p>

          <div
            className="border-2 border-dashed border-purple-300/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400/50 hover:bg-white/5 transition-all"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <FileText className="w-10 h-10 text-purple-300/50 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                {rows.length > 0 && (
                  <p className="text-purple-300/70 text-sm mt-1">
                    {rows.length} row{rows.length !== 1 ? "s" : ""} detected
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-purple-200">Click or drag a CSV file here</p>
                <p className="text-purple-300/50 text-sm mt-1">.csv files supported</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Ready to import {rows.length} lease{rows.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:opacity-50"
            disabled={rows.length === 0}
            onClick={() => onImport(rows)}
          >
            Import {rows.length > 0 ? `${rows.length} Lease${rows.length !== 1 ? "s" : ""}` : "Leases"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-purple-300/30 text-purple-200 hover:bg-purple-500/20 cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
