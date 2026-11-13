import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Z_INDEX } from "@/lib/zIndex";
import {
  ContactRecapData,
  RECAP_ITEM_IDS,
  RecapItemId,
  RecapPrefs,
} from "@/hooks/useContactDetails";
import { PANEL, SECTION_HEADER, Tone, formatDate, formatMoney, toneClass } from "./utils";

/** Live form values the recap reads so it agrees with what's on the Tax and Status fields. */
export interface RecapLiveValues {
  w9OnFile?: string;
  send1099?: string;
  form1099Type?: string;
  ownerNettingApplies?: string;
}

interface NotificationRecapProps {
  /** null for a contact that hasn't been saved yet. */
  recap: ContactRecapData | null;
  live: RecapLiveValues;
  prefs: RecapPrefs;
  onPrefsChange: (prefs: RecapPrefs) => void;
  isLight: boolean;
}

export const RECAP_ITEM_LABELS: Record<RecapItemId, string> = {
  suspense: "Money in suspense",
  outstandingChecks: "Checks outstanding",
  w9: "W-9 on file",
  form1099: `${new Date().getFullYear()} Form 1099`,
  netting: "Netting",
};

interface RecapRow {
  id: RecapItemId;
  detail: string;
  value: React.ReactNode;
}

const buildRows = (recap: ContactRecapData, live: RecapLiveValues, isLight: boolean): RecapRow[] => {
  const badge = (tone: Tone, text: string) => (
    <span className={`inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap ${toneClass(tone, isLight)}`}>
      {text}
    </span>
  );
  const strong = (text: string, className = "text-white") => (
    <strong className={`font-semibold tabular-nums whitespace-nowrap ${className}`}>{text}</strong>
  );
  const oldest = recap.oldestOutstandingCheck;
  const w9OnFile = live.w9OnFile === "Yes";
  const nettingOn = live.ownerNettingApplies === "Yes";
  const form1099Type = live.form1099Type !== undefined ? live.form1099Type : recap.form1099Type;

  return [
    {
      id: "suspense",
      detail: recap.suspenseAmount > 0 ? recap.suspenseReason : "Nothing held",
      value: strong(formatMoney(recap.suspenseAmount), recap.suspenseAmount > 0 ? "text-yellow-400" : "text-white"),
    },
    {
      id: "outstandingChecks",
      detail: oldest ? `Ck #${oldest.number} · ${oldest.days} days` : "None outstanding",
      value: strong(
        recap.outstandingCheckCount > 0
          ? `${recap.outstandingCheckCount} · ${formatMoney(recap.outstandingCheckAmount)}`
          : "0",
      ),
    },
    {
      id: "w9",
      detail: w9OnFile
        ? "Marked on the Tax Information tab"
        : recap.w9RequestedOn
          ? `Requested ${formatDate(recap.w9RequestedOn)}`
          : "Not requested yet",
      value: w9OnFile ? badge("success", "On file") : badge("danger", "Missing"),
    },
    {
      id: "form1099",
      detail: form1099Type
        ? [form1099Type, recap.form1099Reason].filter(Boolean).join(" · ")
        : "Set on the Tax Information tab",
      value:
        live.send1099 === "Yes"
          ? badge("info", "Will send")
          : live.send1099 === "No"
            ? badge("neutral", "Not sending")
            : badge("neutral", "Not set"),
    },
    {
      id: "netting",
      detail: nettingOn ? "Linked on the Netting tab" : "Owner Netting Applies is No",
      value: nettingOn
        ? strong(`${recap.nettingCount} ${recap.nettingCount === 1 ? "name" : "names"}`)
        : strong("Off", "text-white/70"),
    },
  ];
};

export const NotificationRecap = ({ recap, live, prefs, onPrefsChange, isLight }: NotificationRecapProps) => {
  const rows = recap ? buildRows(recap, live, isLight).filter((row) => prefs[row.id]) : [];

  return (
    <section className={PANEL} aria-label="Notification recap">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <h3 className={SECTION_HEADER}>Notification Recap</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            style={{ zIndex: Z_INDEX.modalDropdown }}
            className={`w-60 p-0 py-2 ${isLight ? "text-gray-800" : "text-white"}`}
          >
            <p className={`px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-purple-300/80"}`}>
              Show in recap
            </p>
            {RECAP_ITEM_IDS.map((id) => {
              const checked = prefs[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  onClick={() => onPrefsChange({ ...prefs, [id]: !checked })}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isLight ? "hover:bg-purple-50" : "hover:bg-purple-500/20"
                  }`}
                >
                  {RECAP_ITEM_LABELS[id]}
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      checked ? "bg-purple-600 border-purple-600" : isLight ? "border-gray-300" : "border-purple-300/40"
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>

      {!recap ? (
        <p className="py-2 text-sm text-white/70">The recap fills in once this contact is saved and has activity.</p>
      ) : rows.length === 0 ? (
        <p className="py-2 text-sm text-white/70">Every recap item is hidden. Use Customize to choose what shows.</p>
      ) : (
        rows.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-start justify-between gap-3 py-2.5 ${
              i < rows.length - 1 ? "border-b border-purple-300/10" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm text-white">{RECAP_ITEM_LABELS[row.id]}</div>
              <div className="text-xs text-white/70">{row.detail}</div>
            </div>
            {row.value}
          </div>
        ))
      )}

      <p className="mt-1.5 text-xs text-white/70">
        Pulled live from Revenue, Checks and Tax. Each company chooses which items show here.
      </p>
    </section>
  );
};

export default NotificationRecap;
