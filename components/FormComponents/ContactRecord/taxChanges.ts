import type { AutoComment, TaxIdAccessAction } from "@/hooks/useContactDetails";
import { taxIdDigits } from "./TaxIdInput";

const TRACKED: [field: string, label: string][] = [
  ["taxClassification", "Tax Type"],
  ["send1099", "Send 1099"],
  ["form1099Type", "Type of 1099"],
  ["w9OnFile", "W-9 on File"],
];

/** One AUTO tax comment for the Tax tab values a save changed, e.g. "Tax Type set to C-Corp.
 * Send 1099 set to No." Blank values are skipped: the BE doesn't clear a tax field sent blank. */
export const describeTaxChanges = (before: Record<string, any>, after: Record<string, any>): AutoComment[] => {
  const sentences = TRACKED.flatMap(([field, label]) => {
    const next = after[field] ?? "";
    if (next === "" || next === (before[field] ?? "")) return [];
    return [`${label} set to ${next}.`];
  });
  return sentences.length > 0 ? [{ text: sentences.join(" "), category: "tax" }] : [];
};

/** What a save did to the Tax ID, for the access log. */
export const taxIdChangeKind = (
  before?: string | null,
  after?: string | null,
): Exclude<TaxIdAccessAction, "viewed"> | null => {
  const prev = taxIdDigits(before);
  const next = taxIdDigits(after);
  if (!next || prev === next) return null;
  return prev ? "changed" : "entered";
};
