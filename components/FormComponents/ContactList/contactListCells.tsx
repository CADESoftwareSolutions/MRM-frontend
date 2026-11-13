import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Tone, formatTimestamp, parseTimestamp } from "../ContactRecord/utils";
import { needsTaxDocs } from "./contactAlerts";
import type { ContactListRow } from "./useContactListRows";

// Same shape as List.tsx's status badges (outline Badge with a tinted border), picked by theme
// because index.css only re-colours some of these for light mode.
const TONE_BADGE_DARK: Record<Tone, string> = {
  danger: "bg-red-500/20 text-red-300 border-red-400/30",
  warning: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  info: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  success: "bg-green-500/20 text-green-300 border-green-400/30",
  neutral: "bg-gray-500/20 text-gray-300 border-gray-400/30",
};

const TONE_BADGE_LIGHT: Record<Tone, string> = {
  danger: "bg-red-100 text-red-700 border-red-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  info: "bg-blue-100 text-blue-700 border-blue-300",
  success: "bg-green-100 text-green-700 border-green-300",
  neutral: "bg-gray-100 text-gray-500 border-gray-300",
};

const ToneBadge = ({ tone, isLight, children }: { tone: Tone; isLight: boolean; children: ReactNode }) => (
  <Badge
    variant="outline"
    className={`min-w-0 max-w-full shrink text-xs font-medium ${(isLight ? TONE_BADGE_LIGHT : TONE_BADGE_DARK)[tone]}`}
  >
    <span className="truncate">{children}</span>
  </Badge>
);

/** "Nov 9" this year, "Nov 9, 2025" otherwise. */
const shortDate = (value: string | null): string => {
  const date = parseTimestamp(value);
  if (!date) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
};

/** Cells the Contacts list draws itself; every other column keeps List's own rendering. */
export const renderContactListCell = (column: string, row: ContactListRow, isLight: boolean): ReactNode | undefined => {
  const text = isLight ? "text-gray-700" : "text-white";
  const muted = isLight ? "text-gray-500" : "text-white/60";
  const empty = <span className={isLight ? "text-gray-500" : "text-white/40"}>—</span>;

  switch (column) {
    case "nameId":
      return <span className={`block truncate text-sm tabular-nums ${muted}`}>{row.nameId}</span>;

    case "name": {
      const name = row.displayName || row.name;
      return (
        <div className="min-w-0" title={[name, row.nameLine2].filter(Boolean).join("\n")}>
          <span className={`block truncate text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
            {name || "—"}
          </span>
          {row.nameLine2 && <span className={`block truncate text-xs ${muted}`}>{row.nameLine2}</span>}
        </div>
      );
    }

    case "phone":
      return row.phone ? <span className={`block truncate text-sm tabular-nums ${text}`}>{row.phone}</span> : empty;

    case "email":
      return row.email ? <span className={`block truncate text-sm ${muted}`}>{row.email}</span> : empty;

    case "mailingAddress":
      return row.mailingAddress ? (
        <span className={`block truncate text-sm ${text}`} title={row.mailingAddress}>
          {row.mailingAddress}
        </span>
      ) : (
        empty
      );

    case "w9OnFile":
      if (row.w9OnFile === "Yes") return <ToneBadge tone="success" isLight={isLight}>On file</ToneBadge>;
      return (
        <ToneBadge tone={needsTaxDocs(row.classifications) ? "danger" : "neutral"} isLight={isLight}>
          Missing
        </ToneBadge>
      );

    case "netting":
      return row.netting ? <span className={`text-sm ${text}`}>{row.netting}</span> : empty;

    case "updated": {
      const when = shortDate(row.updatedAt);
      const label = [row.updatedBy, when].filter(Boolean).join(" · ");
      if (!label) return empty;
      return (
        <span className={`block truncate text-xs ${muted}`} title={formatTimestamp(row.updatedAt) || undefined}>
          {label}
        </span>
      );
    }

    case "alerts": {
      const [first, ...rest] = row.alerts;
      if (!first) return empty;
      return (
        <div className="flex min-w-0 items-center gap-1.5" title={row.alerts.map((a) => a.text).join("\n")}>
          <ToneBadge tone={first.tone} isLight={isLight}>
            {first.text}
          </ToneBadge>
          {rest.length > 0 && (
            <span className={`shrink-0 text-xs ${isLight ? "text-gray-500" : "text-white/50"}`}>+{rest.length}</span>
          )}
        </div>
      );
    }

    default:
      return undefined;
  }
};
