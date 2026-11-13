import { useState } from "react";
import { useAtomValue } from "jotai";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ApInvoice, formatUsd } from "@/types/apInvoices";
import { Modal, ModalHeader } from "../../../modals/Modal";

interface RejectInvoiceModalProps {
  invoice: ApInvoice;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export const RejectInvoiceModal = ({ invoice, onConfirm, onCancel }: RejectInvoiceModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      setError("Enter a reason so whoever entered the invoice knows what to fix.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reject this invoice.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Reject invoice"
        icon={<XCircle className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          <span className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
            {invoice.vendorName} · #{invoice.invoiceNumber} · {formatUsd(invoice.invoiceAmount)}
          </span>{" "}
          goes back to Draft with your reason, so it can be corrected and resubmitted.
        </p>
        <div>
          <Label htmlFor="ap-reject-reason" className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
            Reason
            <span className="text-red-500 text-sm font-bold">*</span>
          </Label>
          <Textarea
            id="ap-reject-reason"
            autoFocus
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Standby hours weren't on the field ticket"
            aria-invalid={!!error}
            aria-describedby={error ? "ap-reject-reason-error" : undefined}
            className="bg-white/5 border-purple-300/30 text-white min-h-[96px] resize-y"
          />
          {error && (
            <p id="ap-reject-reason-error" role="alert" className="text-red-400 text-xs mt-1">
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
            Reject invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectInvoiceModal;
