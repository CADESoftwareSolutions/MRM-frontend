import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { AP_STATUSES, AP_STATUS_LABELS, ApInvoiceStatus } from "@/types/apInvoices";

export type ApStatusFilter = ApInvoiceStatus | "all";

// Paid and Void only ever grow, so like the mockup they don't carry a count.
const COUNTED: ApInvoiceStatus[] = ["draft", "needs_review", "awaiting_approval", "approved", "scheduled"];

interface StatusChipsProps {
  value: ApStatusFilter;
  counts: Record<ApInvoiceStatus, number>;
  onChange: (value: ApStatusFilter) => void;
}

export const StatusChips = ({ value, counts, onChange }: StatusChipsProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const chips: ApStatusFilter[] = ["all", ...AP_STATUSES];

  return (
    <div
      role="group"
      aria-label="Status"
      className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
    >
      {chips.map((chip) => {
        const active = chip === value;
        const count = chip !== "all" && COUNTED.includes(chip) ? counts[chip] : 0;
        return (
          <button
            key={chip}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip)}
            className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              active
                ? "bg-purple-600 text-white"
                : isLight
                ? "text-purple-800 hover:bg-purple-200/60"
                : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
            }`}
          >
            {chip === "all" ? "All" : AP_STATUS_LABELS[chip]}
            {count > 0 && (
              <span
                className={`text-[11px] font-semibold leading-4 px-1.5 rounded-md tabular-nums ${
                  isLight
                    ? active
                      ? "bg-white text-purple-700"
                      : "bg-purple-100 text-purple-700"
                    : active
                    ? "bg-white/20"
                    : "bg-white/15"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StatusChips;
