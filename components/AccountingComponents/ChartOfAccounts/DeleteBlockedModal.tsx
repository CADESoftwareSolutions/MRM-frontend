import { Button } from "@/components/ui/button";
import { Modal } from "../../modals/Modal";

interface DeleteBlockedModalProps {
  accountName: string;
  transactionCount: number;
  usages?: string[];
  onMarkInactive: () => void;
  onCancel: () => void;
}

/** Shown instead of DeleteConfirmModal when the account has posted transactions or is used by a vendor default or tax/deduct mapping. */
export const DeleteBlockedModal = ({
  accountName,
  transactionCount,
  usages = [],
  onMarkInactive,
  onCancel,
}: DeleteBlockedModalProps) => (
  <Modal onClose={onCancel} closeOnBackdropClick maxWidthClassName="max-w-md">
    <div className="p-6" role="dialog" aria-modal="true" aria-labelledby="coa-delete-blocked-title">
      <h2 id="coa-delete-blocked-title" className="text-white text-lg font-semibold mb-2">
        Can&apos;t delete this account
      </h2>
      <p className="text-purple-200 text-sm mb-3">
        {transactionCount > 0 ? (
          <>
            <span className="text-white font-medium">{accountName}</span> has{" "}
            <span className="text-white font-medium">
              {transactionCount.toLocaleString("en-US")} posted{" "}
              {transactionCount === 1 ? "transaction" : "transactions"}
            </span>
            . It stays in the chart so past reports still add up.
          </>
        ) : (
          <>
            <span className="text-white font-medium">{accountName}</span> is still in use.
          </>
        )}
      </p>
      {usages.length > 0 && (
        <ul className="list-disc pl-5 text-purple-200 text-sm mb-3 space-y-0.5">
          {usages.map((usage) => (
            <li key={usage}>{usage}</li>
          ))}
        </ul>
      )}
      <p className="text-purple-200 text-sm mb-6">
        Mark it Inactive instead. It&apos;s hidden from account pickers for new entries, and reports keep its
        history.
      </p>
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
        >
          Cancel
        </Button>
        <Button onClick={onMarkInactive} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
          Mark Inactive
        </Button>
      </div>
    </div>
  </Modal>
);
