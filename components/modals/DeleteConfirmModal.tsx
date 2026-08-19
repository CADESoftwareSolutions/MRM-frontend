import { Button } from "@/components/ui/button";
import { Modal } from "./Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  /** Noun shown in the title ("Delete {itemType}") and confirmation text — defaults to
   * "Item" since every caller should really be passing what it's actually deleting. */
  itemType?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  itemName,
  itemType = "Item",
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md">
      <div className="p-6">
        <h2 className="text-white text-lg font-semibold mb-2">Delete {itemType}</h2>
        <p className="text-purple-200 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">{itemName}</span>? This
          action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
