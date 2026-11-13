import { useState } from "react";
import { useAtomValue } from "jotai";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import type { ApDuplicateDecision } from "@/types/apInvoices";
import { ERROR_RING } from "../EntryField";

interface ResolvePanelProps {
  onResolve: (decision: ApDuplicateDecision, reason: string) => Promise<void>;
}

const REASON_ID = "ap-duplicate-reason";
const REASON_ERROR_ID = "ap-duplicate-reason-error";

export const ResolvePanel = ({ onResolve }: ResolvePanelProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ApDuplicateDecision | null>(null);

  const resolve = async (decision: ApDuplicateDecision) => {
    setActionError(null);
    if (!reason.trim()) {
      setReasonError("Enter a reason before you decide");
      return;
    }
    setBusy(decision);
    try {
      await onResolve(decision, reason.trim());
    } catch (e) {
      setActionError(e instanceof Error && e.message ? e.message : "Couldn't record your decision.");
    } finally {
      setBusy(null);
    }
  };

  const outlineButton = cn(
    "bg-transparent shadow-none cursor-pointer",
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white",
  );
  const dangerButton = cn(
    "bg-transparent shadow-none cursor-pointer",
    isLight
      ? "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
      : "border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200",
  );

  return (
    <section
      aria-labelledby="ap-duplicate-decision"
      className="flex flex-col gap-2.5 rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3.5"
    >
      <h3 id="ap-duplicate-decision" className="text-sm font-semibold text-white/90 uppercase tracking-wider">
        What do you want to do?
      </h3>
      <div className="max-w-[640px]">
        <Label htmlFor={REASON_ID} className="text-white font-semibold flex flex-wrap items-center gap-1 mb-1 text-sm">
          Reason
          <span className="text-red-500 text-sm font-bold">*</span>
          <span className={cn("text-xs font-normal", isLight ? "text-gray-500" : "text-white/60")}>
            (saved to the invoice history)
          </span>
        </Label>
        <Input
          id={REASON_ID}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError) setReasonError(null);
          }}
          placeholder="e.g. Vendor re-sent the same invoice by email"
          aria-invalid={!!reasonError}
          aria-describedby={reasonError ? REASON_ERROR_ID : undefined}
          disabled={!!busy}
          className={cn("h-9 bg-white/5 border-purple-300/30 text-white", reasonError && ERROR_RING)}
        />
        {reasonError && (
          <p id={REASON_ERROR_ID} className="text-red-400 text-xs mt-1">
            {reasonError}
          </p>
        )}
      </div>

      {actionError && (
        <p role="alert" className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-sm text-red-300">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!!busy} onClick={() => resolve("discarded")} className={dangerButton}>
          <Trash2 className="w-4 h-4" />
          {busy === "discarded" ? "Discarding…" : "It's a duplicate: discard this draft"}
        </Button>
        <Button variant="outline" disabled={!!busy} onClick={() => resolve("not_duplicate")} className={outlineButton}>
          {busy === "not_duplicate" ? "Saving…" : "Not a duplicate: keep entering"}
        </Button>
      </div>
    </section>
  );
};

export default ResolvePanel;
