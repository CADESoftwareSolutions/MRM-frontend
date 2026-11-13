import { useState } from "react";
import { useAtomValue } from "jotai";
import { CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { cn } from "@/lib/utils";
import {
  AP_STATUS_LABELS,
  ApDuplicateDecision,
  ApDuplicateMatch,
  ApDuplicateRules,
  ApInvoice,
  ApInvoiceDraftInput,
  formatIsoDate,
} from "@/types/apInvoices";
import { ComparisonTable } from "./duplicates/ComparisonTable";
import { enteredWhen, localDateOf, ruleLabel } from "./duplicates/comparison";
import { HitBadge } from "./duplicates/HitBadge";
import { ResolvePanel } from "./duplicates/ResolvePanel";

export interface DuplicatesTabProps {
  /** The invoice as it stands on screen, unsaved edits included: exactly what Save Draft would
   * send. Its `id` is undefined until a new invoice is first saved. */
  draft: ApInvoiceDraftInput;
  /** The saved invoice behind the screen (status, createdBy/createdAt, duplicateReview), or null
   * while a new invoice hasn't been saved yet. */
  invoice: ApInvoice | null;
  /** Live matches for `draft` under `rules`, from findDuplicates; each match's matchedBy lists
   * the rule(s) that caught it, primary rule first. */
  matches: ApDuplicateMatch[];
  /** The vendor's duplicate rules, from duplicateRulesFor(vendor defaults). */
  rules: ApDuplicateRules;
  /** True once someone marked this invoice "not a duplicate" (invoice.duplicateReview). */
  cleared: boolean;
  /** Approved / scheduled / paid / void / awaiting-approval invoices: show the comparison only. */
  readOnly: boolean;
  /** Opens another invoice in place of this one. */
  onOpenInvoice: (id: string) => void;
  /** Records the decision. The screen saves the draft first (so a brand-new one gets an id and
   * its needs_review flag), then resolves it. "not_duplicate" switches back to GL Coding and hides
   * the banner; "discarded" voids this invoice and returns to the list. Rejects with an Error whose
   * message is user-facing. */
  onResolve: (decision: ApDuplicateDecision, reason: string) => Promise<void>;
}

const matchLabel = (match: ApDuplicateMatch) =>
  `#${match.invoiceNumber} · ${match.journalId ?? AP_STATUS_LABELS[match.status]}`;

export const DuplicatesTab = ({
  draft,
  invoice,
  matches,
  rules,
  cleared,
  readOnly,
  onOpenInvoice,
  onResolve,
}: DuplicatesTabProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const username = useAtomValue(userProfileAtom)?.user?.username || "you";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const muted = isLight ? "text-gray-500" : "text-white/60";
  const emptyBox = "flex flex-col items-center gap-2 rounded-xl border border-purple-300/20 bg-white/5 px-6 py-10 text-center";

  if (!draft.vendorId) {
    return (
      <div className={emptyBox}>
        <p className="text-sm text-white/70">Pick a vendor to check this invoice for duplicates.</p>
      </div>
    );
  }

  const current = matches.find((match) => match.id === selectedId) ?? matches[0];
  const review = invoice?.duplicateReview ?? null;
  const showActions = !!current && !readOnly && !cleared;

  const oursCaption = invoice
    ? `${AP_STATUS_LABELS[invoice.status]} · entered ${enteredWhen(invoice.createdAt)} by ${invoice.createdBy}`
    : `Draft · entered today by ${username}`;

  const explainer =
    rules.validateBy === "Invoice #" ? (
      <>
        This vendor validates by <strong className="font-semibold text-white">Invoice #</strong>, and also flags the{" "}
        <strong className="font-semibold text-white">same amount within {rules.windowDays} days</strong>
      </>
    ) : (
      <>
        This vendor validates by{" "}
        <strong className="font-semibold text-white">
          Invoice Amount (the same amount within {rules.windowDays} days)
        </strong>
        , and also flags the <strong className="font-semibold text-white">same invoice #</strong>
      </>
    );

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-sm text-white/70">
        Checked when the invoice was entered. {explainer} (set on the vendor&apos;s A/P Vendor Info tab).
      </p>

      {review && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 px-3 py-2.5 text-sm text-blue-200">
          {review.decision === "not_duplicate" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-300" />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0 text-blue-300" />
          )}
          <span>
            <span className="font-semibold">
              {review.decision === "not_duplicate" ? "Marked not a duplicate" : "Discarded as a duplicate"}
            </span>{" "}
            by {review.by} on {formatIsoDate(localDateOf(review.at))}
            {review.reason ? `: ${review.reason}` : "."}
          </span>
        </div>
      )}

      {!current ? (
        <div className={emptyBox}>
          <ShieldCheck className="size-8 text-green-400" />
          <p className="font-medium text-white">No possible duplicates for this vendor</p>
          <p className={cn("max-w-[520px] text-sm", muted)}>
            No other invoice from {draft.vendorName || "this vendor"} has the same invoice # or the same amount
            within {rules.windowDays} days.
          </p>
        </div>
      ) : (
        <>
          {matches.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm", muted)}>{matches.length} possible duplicates:</span>
              <div
                role="group"
                aria-label="Possible duplicates"
                className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
              >
                {matches.map((match) => {
                  const active = match.id === current.id;
                  return (
                    <button
                      key={match.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(match.id)}
                      className={cn(
                        "inline-flex items-center h-8 px-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                        active
                          ? "bg-purple-600 text-white"
                          : isLight
                            ? "text-purple-800 hover:bg-purple-200/60"
                            : "text-purple-100 hover:bg-purple-500/30 hover:text-white",
                      )}
                    >
                      {matchLabel(match)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm", muted)}>Matched by</span>
            {current.matchedBy.map((rule) => (
              <HitBadge key={rule}>{ruleLabel(rule, rules)}</HitBadge>
            ))}
          </div>

          <ComparisonTable
            draft={draft}
            invoice={invoice}
            match={current}
            oursCaption={oursCaption}
            onOpenInvoice={onOpenInvoice}
          />
        </>
      )}

      {showActions && <ResolvePanel onResolve={onResolve} />}
    </div>
  );
};

export default DuplicatesTab;
