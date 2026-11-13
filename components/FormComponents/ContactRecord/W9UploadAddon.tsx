import React from "react";
import { useSetAtom } from "jotai";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToastAtom } from "@/atoms/toastAtom";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toneClass } from "./utils";

interface W9UploadAddonProps {
  /** The W-9 on File field's value ("Yes" / "No" / ""). */
  value: any;
  onChange: (value: string) => void;
  /** null before the contact is saved — the files API needs an existing party to attach to. */
  partyId: number | null;
  isLight: boolean;
  onUploaded?: (fileName: string) => void;
}

/** Missing badge plus an Upload W-9 action that attaches the file to the contact's Documents and
 * sets W-9 on File to Yes (kept once the record is saved). */
export const W9UploadAddon = ({ value, onChange, partyId, isLight, onUploaded }: W9UploadAddonProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const showToast = useSetAtom(showToastAtom);
  const { uploadFile, uploading } = useFileUpload({ entityType: "party", entityId: partyId });
  const [error, setError] = React.useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    try {
      await uploadFile(file, { label: "W-9", documentKind: "W-9" });
      onChange("Yes");
      onUploaded?.(file.name);
      showToast(`${file.name} added to Documents. W-9 on File is now Yes; save to keep it.`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {value !== "Yes" && (
          <span
            className={`inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium ${toneClass("danger", isLight)}`}
          >
            Missing
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={partyId == null || uploading}
          onClick={() => inputRef.current?.click()}
          className="h-[26px] px-1.5 text-xs text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Uploading…" : "Upload W-9"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
      {partyId == null && <p className="form-help-text text-xs mt-1">Save the contact to upload a W-9.</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

export default W9UploadAddon;
