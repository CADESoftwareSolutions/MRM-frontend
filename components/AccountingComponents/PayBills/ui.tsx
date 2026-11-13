import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { themeAtom } from "@/atoms/NavigationAtom";
import { VendorPay } from "@/types/apInvoices";
import { CHECK_RUN_STATUS_LABELS, CheckRunStatus } from "@/types/checkRuns";

export const CARD_CLASS = "rounded-xl border bg-white/10 backdrop-blur-md border-purple-300/30";
export const SUB_CARD_CLASS = "rounded-xl border bg-white/5 border-purple-300/20";
export const SECTION_TITLE_CLASS = "text-sm font-semibold text-white/90 uppercase tracking-wider";
export const LABEL_CLASS = "text-white font-semibold flex items-center gap-1 mb-1 text-sm";
export const FIELD_CLASS = "h-9 bg-white/5 border-purple-300/30 text-white";
export const PRIMARY_BUTTON_CLASS = "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer";

export const outlineButtonClass = (isLight: boolean) =>
  `bg-transparent shadow-none cursor-pointer ${
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
  }`;

export const ghostButtonClass = (isLight: boolean) =>
  `bg-transparent shadow-none cursor-pointer ${
    isLight
      ? "text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "text-purple-200 hover:bg-purple-500/20 hover:text-white"
  }`;

export const dangerButtonClass = (isLight: boolean) =>
  `bg-transparent shadow-none cursor-pointer border ${
    isLight
      ? "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
      : "border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200"
  }`;

export const tableShellClass = (isLight: boolean) =>
  `rounded-xl border ${
    isLight ? "border-[rgb(167_139_250/0.25)] bg-white/85" : "border-[rgb(167_139_250/0.2)] bg-white/[0.06]"
  }`;

export const dividerClass = (isLight: boolean) =>
  isLight ? "border-[rgb(167_139_250/0.2)]" : "border-[rgb(167_139_250/0.15)]";

export const tableHeadClass = (isLight: boolean) =>
  `text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${isLight ? "text-gray-500" : "text-purple-200/80"}`;

export const rowBorderClass = (isLight: boolean) => (isLight ? "border-purple-100" : "border-purple-300/10");

type Tone = "gray" | "yellow" | "blue" | "purple" | "green";

const TONES_DARK: Record<Tone, string> = {
  gray: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  purple: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  green: "bg-green-500/20 text-green-300 border-green-400/30",
};

const TONES_LIGHT: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600 border-gray-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  blue: "bg-blue-100 text-blue-700 border-blue-300",
  purple: "bg-purple-100 text-purple-700 border-purple-300",
  green: "bg-green-100 text-green-700 border-green-300",
};

const ToneBadge = ({ tone, children }: { tone: Tone; children: ReactNode }) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Badge variant="outline" className={`text-xs font-medium rounded-md ${(isLight ? TONES_LIGHT : TONES_DARK)[tone]}`}>
      {children}
    </Badge>
  );
};

const RUN_STATUS_TONE: Record<CheckRunStatus, Tone> = {
  draft: "gray",
  awaiting_approval: "yellow",
  approved: "blue",
  posted: "green",
  void: "gray",
};

export const RunStatusBadge = ({ status, printed = false }: { status: CheckRunStatus; printed?: boolean }) => (
  <ToneBadge tone={RUN_STATUS_TONE[status]}>
    {status === "approved" && printed ? "Printed, not posted" : CHECK_RUN_STATUS_LABELS[status]}
  </ToneBadge>
);

export const PayBadge = ({ pay }: { pay: VendorPay }) => (
  <ToneBadge tone={pay === "No" ? "gray" : "purple"}>{pay === "No" ? "Pay: No (on hold)" : `Pay: ${pay}`}</ToneBadge>
);

export const ErrorBanner = ({ message, onDismiss }: { message: string; onDismiss?: () => void }) => (
  <div
    role="alert"
    className="flex items-start justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3"
  >
    <p className="text-sm text-red-300">{message}</p>
    {onDismiss && (
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 text-red-400 hover:text-red-200 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ProblemsAlert = ({ problems, hint }: { problems: string[]; hint: string }) => (
  <div role="alert" className="flex gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
    <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-red-300" />
    <div className="text-sm text-red-300">
      <p className="font-semibold">This run can&apos;t go ahead as planned. {hint}</p>
      <ul className="mt-1 list-disc pl-5">
        {problems.map((problem, index) => (
          <li key={index}>{problem}</li>
        ))}
      </ul>
    </div>
  </div>
);

export const SummaryRow = ({
  label,
  children,
  last = false,
}: {
  label: ReactNode;
  children: ReactNode;
  last?: boolean;
}) => (
  <div
    className={`flex items-center justify-between gap-3 py-2.5 text-sm ${last ? "" : "border-b border-purple-300/10"}`}
  >
    <span className="text-white/70">{label}</span>
    <span className="text-right text-white tabular-nums">{children}</span>
  </div>
);

/** "Nov 11, 2026 3:05 PM" */
export const formatStamp = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const pluralize = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
