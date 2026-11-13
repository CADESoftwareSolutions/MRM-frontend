import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../../modals/Modal";

interface DiscardChangesModalProps {
  onDiscard: () => void;
  onKeepEditing: () => void;
}

export const DiscardChangesModal = ({ onDiscard, onKeepEditing }: DiscardChangesModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Modal onClose={onKeepEditing} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Discard unsaved changes?"
        icon={<AlertTriangle className={`w-5 h-5 ${isLight ? "text-amber-600" : "text-amber-300"}`} />}
        onClose={onKeepEditing}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          This invoice has changes (or files) that haven&apos;t been saved. Leaving now loses them.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            autoFocus
            onClick={onKeepEditing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Keep editing
          </Button>
          <Button onClick={onDiscard} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
            Discard changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscardChangesModal;
