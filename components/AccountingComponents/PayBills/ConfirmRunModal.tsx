import { ReactNode, useState } from "react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../modals/Modal";
import { PRIMARY_BUTTON_CLASS, errorMessage } from "./ui";

interface ConfirmRunModalProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for actions that undo work (reject, void, discard). */
  danger?: boolean;
  /** Asks for a required reason and passes it to onConfirm. */
  reason?: { label: string; placeholder: string; missing: string };
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export const ConfirmRunModal = ({
  title,
  icon,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  reason,
  onConfirm,
  onCancel,
}: ConfirmRunModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (reason && !text.trim()) {
      setError(reason.missing);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(text.trim());
    } catch (e) {
      setError(errorMessage(e, "Something went wrong. Try again."));
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onCancel} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader title={title} icon={icon} onClose={onCancel} isLight={isLight} />
      <div className="p-6 flex flex-col gap-4">
        <div className={`text-sm flex flex-col gap-2 ${isLight ? "text-gray-600" : "text-purple-200"}`}>{children}</div>
        {reason && (
          <div>
            <Label htmlFor="check-run-reason" className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
              {reason.label}
              <span className="text-red-500 text-sm font-bold">*</span>
            </Label>
            <Textarea
              id="check-run-reason"
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={reason.placeholder}
              aria-invalid={!!error}
              className="bg-white/5 border-purple-300/30 text-white min-h-[96px] resize-y"
            />
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={confirm}
            disabled={saving}
            // text-red-50 rather than text-white: .light-theme turns .text-white dark.
            className={danger ? "bg-red-600 hover:bg-red-700 text-red-50 cursor-pointer" : PRIMARY_BUTTON_CLASS}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmRunModal;
