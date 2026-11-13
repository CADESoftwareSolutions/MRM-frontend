import { useAtomValue } from "jotai";
import { Badge } from "@/components/ui/badge";
import { themeAtom } from "@/atoms/NavigationAtom";
import {
  AP_PAYMENT_STATUS_LABELS,
  ApInvoiceStatus,
  ApPaymentStatus,
  formatIsoDate,
} from "@/types/apInvoices";

type Tone = "gray" | "red" | "yellow" | "blue" | "purple" | "green";

const TONES_DARK: Record<Tone, string> = {
  gray: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  red: "bg-red-500/20 text-red-300 border-red-400/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  purple: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  green: "bg-green-500/20 text-green-300 border-green-400/30",
};

const TONES_LIGHT: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600 border-gray-300",
  red: "bg-red-100 text-red-700 border-red-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  blue: "bg-blue-100 text-blue-700 border-blue-300",
  purple: "bg-purple-100 text-purple-700 border-purple-300",
  green: "bg-green-100 text-green-700 border-green-300",
};

const STATUS_TONE: Record<ApInvoiceStatus, Tone> = {
  draft: "gray",
  needs_review: "red",
  awaiting_approval: "yellow",
  approved: "blue",
  scheduled: "purple",
  paid: "green",
  void: "gray",
};

const PAYMENT_TONE: Record<ApPaymentStatus, Tone> = {
  outstanding: "yellow",
  cleared: "green",
  void: "gray",
};

/** "11/14/2026" → "11/14" */
const shortDate = (iso: string) => formatIsoDate(iso).slice(0, 5);

export const apStatusBadgeLabel = (
  status: ApInvoiceStatus,
  scheduledPayDate?: string | null,
  paidCheckNumber?: string | null,
): string => {
  switch (status) {
    case "draft":
      return "Draft";
    case "needs_review":
      return "Possible duplicate";
    case "awaiting_approval":
      return "Awaiting approval";
    case "approved":
      return "Approved";
    case "scheduled":
      return scheduledPayDate ? `Scheduled · ${shortDate(scheduledPayDate)}` : "Scheduled";
    case "paid":
      return paidCheckNumber ? `Paid · Ck #${paidCheckNumber}` : "Paid";
    case "void":
      return "Void";
  }
};

const ToneBadge = ({ tone, label, className = "" }: { tone: Tone; label: string; className?: string }) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${(isLight ? TONES_LIGHT : TONES_DARK)[tone]} ${className}`}
    >
      {label}
    </Badge>
  );
};

export interface ApStatusBadgeProps {
  status: ApInvoiceStatus;
  /** Shown as "Scheduled · 11/14" when the invoice is in a check run. */
  scheduledPayDate?: string | null;
  /** Shown as "Paid · Ck #10437". */
  paidCheckNumber?: string | null;
  className?: string;
}

export const ApStatusBadge = ({ status, scheduledPayDate, paidCheckNumber, className }: ApStatusBadgeProps) => (
  <ToneBadge
    tone={STATUS_TONE[status]}
    label={apStatusBadgeLabel(status, scheduledPayDate, paidCheckNumber)}
    className={className}
  />
);

export const ApPaymentStatusBadge = ({ status, className }: { status: ApPaymentStatus; className?: string }) => (
  <ToneBadge tone={PAYMENT_TONE[status]} label={AP_PAYMENT_STATUS_LABELS[status]} className={className} />
);

export default ApStatusBadge;
