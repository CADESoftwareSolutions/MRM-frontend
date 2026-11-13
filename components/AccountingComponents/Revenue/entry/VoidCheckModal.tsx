import { useState } from "react";
import { useAtomValue } from "jotai";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../../modals/Modal";

const REASON_ID = "rc-void-reason";
const REASON_ERROR_ID = "rc-void-reason-error";

interface VoidCheckModalProps {
  /** "Red River Midstream LP · Check #55190 · $1,206.45" */
  checkLabel: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

/** Confirms voiding a posted check, with the required reason. */
export const VoidCheckModal = ({ checkLabel, onConfirm, onCancel }: VoidCheckModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      setError("Enter a reason so anyone looking at this check later knows why it was voided.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't void this check.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Void check"
        icon={<Ban className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          Voiding reverses the posting of{" "}
          <span className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>{checkLabel}</span>. The check
          stays on file as Void for history: it&apos;s read-only and can&apos;t be posted again. To enter a corrected
          check, re-enter it as a new draft afterwards.
        </p>
        <div>
          <Label htmlFor={REASON_ID} className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
            Reason
            <span className="text-red-500 text-sm font-bold">*</span>
          </Label>
          <Textarea
            id={REASON_ID}
            autoFocus
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Operator stopped payment and is reissuing the check"
            aria-invalid={!!error}
            aria-describedby={error ? REASON_ERROR_ID : undefined}
            className="bg-white/5 border-purple-300/30 text-white min-h-[96px] resize-y"
          />
          {error && (
            <p id={REASON_ERROR_ID} className="text-red-400 text-xs mt-1">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            Void Check
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoidCheckModal;
