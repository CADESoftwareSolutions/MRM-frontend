import { useState } from "react";
import { useAtomValue } from "jotai";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../../modals/Modal";

interface VoidInvoiceModalProps {
  /** "Permian Basin Water Services LLC · #88213 · $12,480.00" */
  invoiceLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const VoidInvoiceModal = ({ invoiceLabel, onConfirm, onCancel }: VoidInvoiceModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't void this invoice.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Void invoice"
        icon={<Ban className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          <span className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>{invoiceLabel}</span> stays on
          file as Void. It can&apos;t be submitted, approved or paid after this.
        </p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            Void invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoidInvoiceModal;
