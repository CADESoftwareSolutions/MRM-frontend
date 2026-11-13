import { useAtomValue } from "jotai";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "../../../modals/Modal";

interface UnsavedChangesModalProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/** Asked before leaving for the Excel import, which starts new checks and drops what's on screen. */
export const UnsavedChangesModal = ({ onSave, onDiscard, onCancel }: UnsavedChangesModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md" isLight={isLight}>
      <ModalHeader
        title="Unsaved changes"
        icon={<Upload className={`w-5 h-5 ${isLight ? "text-purple-700" : "text-purple-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 flex flex-col gap-4">
        <p className={`text-sm ${isLight ? "text-gray-600" : "text-purple-200"}`}>
          This check has changes that aren&apos;t saved. Importing detail from Excel creates new checks and leaves this
          one, so save it first or discard the changes.
        </p>
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Cancel
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
