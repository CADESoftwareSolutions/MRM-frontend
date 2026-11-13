import { useAtomValue } from "jotai";
import { Info, Undo2 } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { ApInvoice, formatIsoDate } from "@/types/apInvoices";

/** One line about where a saved invoice stands: why it came back, who approved it, how it was
 * paid. Nothing for a plain draft. */
export const StatusNote = ({ invoice }: { invoice: ApInvoice | null }) => {
  const isLight = useAtomValue(themeAtom) === "light";
  if (!invoice) return null;

  if (invoice.status === "draft" && invoice.rejectedReason) {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
          isLight ? "border-amber-300 bg-amber-50 text-amber-900" : "border-amber-400/40 bg-amber-500/10 text-amber-200",
        )}
      >
        <Undo2 className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Rejected:</span> {invoice.rejectedReason} Fix it and submit it again.
        </span>
      </div>
    );
  }

  const approved = invoice.approvedBy
    ? `Approved by ${invoice.approvedBy}${invoice.approvedAt ? ` on ${formatIsoDate(invoice.approvedAt)}` : ""}`
    : "Approved";
  const posted = invoice.journalId ? ` and posted to the G/L as ${invoice.journalId}` : "";

  let text: string | null = null;
  switch (invoice.status) {
    case "awaiting_approval":
      text = "Submitted for approval. Approve it to post it to the G/L, or reject it back to Draft with a reason.";
      break;
    case "approved":
      text = `${approved}${posted}. It's read-only now.`;
      break;
    case "scheduled":
      text = `${approved}${posted}. Scheduled to pay${
        invoice.scheduledPayDate ? ` on ${formatIsoDate(invoice.scheduledPayDate)}` : ""
      }.`;
      break;
    case "paid":
      text = `${approved}${posted}. Paid${invoice.paidCheckNumber ? ` by Ck #${invoice.paidCheckNumber}` : ""}.`;
      break;
    case "void":
      text =
        invoice.duplicateReview?.decision === "discarded"
          ? `Discarded as a duplicate by ${invoice.duplicateReview.by}${
              invoice.duplicateReview.reason ? `: ${invoice.duplicateReview.reason}` : ""
            }. It won't post or pay.`
          : "Voided. It won't post to the G/L or pay.";
      break;
  }
  if (!text) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 px-3 py-2.5 text-sm text-blue-200">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-300" />
      <span>{text}</span>
    </div>
  );
};

export default StatusNote;
