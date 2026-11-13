import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { ApDuplicateMatch, formatIsoDate, formatUsd } from "@/types/apInvoices";

const whereItStands = (match: ApDuplicateMatch): string => {
  const asJournal = match.journalId ? ` as ${match.journalId}` : "";
  switch (match.status) {
    case "scheduled":
      return `${asJournal} and is scheduled to pay${
        match.scheduledPayDate ? ` on ${formatIsoDate(match.scheduledPayDate).slice(0, 5)}` : ""
      }`;
    case "paid":
      return `${asJournal} and was paid${match.paidCheckNumber ? ` by Ck #${match.paidCheckNumber}` : ""}`;
    case "approved":
      return `${asJournal} and is approved`;
    case "awaiting_approval":
      return " and is awaiting approval";
    case "needs_review":
      return " and is also flagged as a possible duplicate";
    default:
      return " as a draft";
  }
};

/** "Invoice #88213 for $12,480.00 from this vendor is already entered as JE-26-04412 and is
 * scheduled to pay on 11/14." */
export const describeDuplicate = (match: ApDuplicateMatch): string => {
  const sameNumber = match.matchedBy[0] === "Invoice #";
  const what = sameNumber
    ? `Invoice #${match.invoiceNumber} for ${formatUsd(match.invoiceAmount)} from this vendor`
    : `Invoice #${match.invoiceNumber} from this vendor, dated ${formatIsoDate(match.invoiceDate)}, is for the same amount (${formatUsd(match.invoiceAmount)}) and`;
  return `${what} is already entered${whereItStands(match)}.`;
};

interface DuplicateBannerProps {
  matches: ApDuplicateMatch[];
  onReview: () => void;
}

export const DuplicateBanner = ({ matches, onReview }: DuplicateBannerProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [first] = matches;
  if (!first) return null;
  const more = matches.length - 1;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
        isLight ? "border-red-300 bg-red-50 text-red-800" : "border-red-500/40 bg-red-500/10 text-red-200",
      )}
    >
      <AlertTriangle className={cn("size-[18px] shrink-0", isLight ? "text-red-600" : "text-red-400")} />
      <span className="min-w-0 flex-[1_1_400px]">
        <span className="font-semibold">Possible duplicate.</span> {describeDuplicate(first)}
        {more > 0 && ` ${more} more possible ${more === 1 ? "match" : "matches"} on the Duplicates tab.`}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReview}
        className={cn(
          "bg-transparent shadow-none cursor-pointer",
          isLight
            ? "border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
            : "border-red-300/50 text-red-200 hover:bg-red-500/20 hover:text-red-100",
        )}
      >
        Review duplicate
      </Button>
    </div>
  );
};

export default DuplicateBanner;
