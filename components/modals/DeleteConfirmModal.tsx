import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[#1a1a2e] border border-purple-300/30 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-white text-lg font-semibold mb-2">Delete Contact</h2>
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
    </div>
  );
};
