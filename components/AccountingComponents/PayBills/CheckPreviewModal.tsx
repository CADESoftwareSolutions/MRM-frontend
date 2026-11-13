import { useAtomValue } from "jotai";
import { Eye } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { formatIsoDate, formatUsd } from "@/types/apInvoices";
import { BankAccount, CheckRunCheck, formatCheckRange } from "@/types/checkRuns";
import { Modal, ModalHeader } from "../../modals/Modal";
import { CheckPreview } from "./CheckPreview";
import { useCheckPreviews } from "./checkPreviewData";
import { pluralize } from "./ui";

interface CheckPreviewModalProps {
  checks: CheckRunCheck[];
  checkDate: string;
  bank: BankAccount | undefined;
  onClose: () => void;
}

/** On-screen look at the checks a selection or run would print. Nothing prints from here. */
export const CheckPreviewModal = ({ checks, checkDate, bank, onClose }: CheckPreviewModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const previews = useCheckPreviews(checks, checkDate, bank);
  const total = checks.reduce((sum, check) => sum + check.amount, 0);

  return (
    <Modal
      onClose={onClose}
      closeOnBackdropClick
      maxWidthClassName="max-w-[920px]"
      heightClassName="h-[90vh]"
      isLight={isLight}
    >
      <ModalHeader
        title="Check preview"
        icon={<Eye className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onClose}
        isLight={isLight}
      />
      <p className={`px-6 pt-4 text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
        {pluralize(checks.length, "check")} · {formatCheckRange(checks)} · {formatIsoDate(checkDate)} ·{" "}
        <span className="tabular-nums">{formatUsd(total)}</span>. Previews are watermarked and can&apos;t be cashed. Checks print only after an approver approves the run.
      </p>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto flex w-max flex-col gap-6">
          {previews.map((check, index) => (
            <CheckPreview key={check.checkNumber || index} check={check} showGuides watermark />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CheckPreviewModal;
