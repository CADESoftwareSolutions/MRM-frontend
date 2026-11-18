import { useAtomValue } from "jotai";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { RevenueDisplayStatus } from "@/types/revenue";

const TONES_DARK: Record<RevenueDisplayStatus, string> = {
  Draft: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  "Out of balance": "bg-red-500/20 text-red-300 border-red-400/30",
  "Ready to post": "bg-blue-500/20 text-blue-300 border-blue-400/30",
  Posted: "bg-green-500/20 text-green-300 border-green-400/30",
  Void: "bg-gray-500/20 text-gray-300 border-gray-400/30",
};

const TONES_LIGHT: Record<RevenueDisplayStatus, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-300",
  "Out of balance": "bg-red-100 text-red-700 border-red-300",
  "Ready to post": "bg-blue-100 text-blue-700 border-blue-300",
  Posted: "bg-green-100 text-green-700 border-green-300",
  Void: "bg-gray-100 text-gray-600 border-gray-300",
};

export interface RevenueStatusBadgeProps {
  status: RevenueDisplayStatus;
  /** Defaults to the status itself, e.g. "Draft · 2 to fix". */
  label?: string;
  /** From postBlockers; shown in a tooltip when there are any. */
  blockers?: string[];
  className?: string;
}

export const RevenueStatusBadge = ({ status, label, blockers = [], className = "" }: RevenueStatusBadgeProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const badge = (
    <Badge
      variant="outline"
      tabIndex={blockers.length ? 0 : undefined}
      className={`text-xs font-medium ${(isLight ? TONES_LIGHT : TONES_DARK)[status]} ${className}`}
    >
      {label ?? status}
    </Badge>
  );
  if (!blockers.length || status === "Posted" || status === "Void") return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={4}
        // Portals to <body>, where a plain z-50 would slide under the fixed app bar.
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={`max-w-xs text-left ${isLight ? "" : "border border-purple-300/30"}`}
      >
        <p className="font-semibold mb-1">Can&apos;t post yet</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};

export default RevenueStatusBadge;
