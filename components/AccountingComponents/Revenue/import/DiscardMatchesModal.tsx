import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader } from "../../../modals/Modal";
import { PRIMARY_BUTTON_CLASS, useImportTheme } from "./importTheme";

export interface DiscardMatchesModalProps {
  onDiscard: () => void;
  onKeepMatching: () => void;
}

export const DiscardMatchesModal = ({ onDiscard, onKeepMatching }: DiscardMatchesModalProps) => {
  const theme = useImportTheme();
  return (
    <Modal onClose={onKeepMatching} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={theme.isLight}>
      <ModalHeader
        title="Discard this import?"
        icon={<AlertTriangle className={`w-5 h-5 ${theme.isLight ? "text-amber-600" : "text-amber-300"}`} />}
        onClose={onKeepMatching}
        isLight={theme.isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${theme.isLight ? "text-gray-600" : "text-purple-200"}`}>
          The matches you made on this file haven&apos;t been saved. Leaving now loses them.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" autoFocus onClick={onKeepMatching} className={`cursor-pointer ${theme.outlineButton}`}>
            Keep matching
          </Button>
          <Button onClick={onDiscard} className={`${PRIMARY_BUTTON_CLASS} text-white`}>
            Discard import
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscardMatchesModal;
