import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../../modals/Modal";

interface UnsavedChangesModalProps {
  /** Why leaving matters, after "This check has changes that aren't saved." */
  reason: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal = ({ reason, onSave, onDiscard, onCancel }: UnsavedChangesModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Unsaved changes"
        icon={<AlertTriangle className={`w-5 h-5 ${isLight ? "text-purple-700" : "text-purple-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          This check has changes that aren&apos;t saved. {reason}
        </p>
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Keep editing
          </Button>
          <Button
            variant="outline"
            onClick={onDiscard}
            className="bg-transparent border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200 cursor-pointer"
          >
            Discard
          </Button>
          <Button onClick={onSave} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
            Save and continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UnsavedChangesModal;
