import React from "react";
import { Check } from "lucide-react";
import { PAY_OPTIONS, PAY_OPTION_DESCRIPTIONS, VendorPay } from "@/types/apInvoices";

interface VendorPayOptionsProps {
  value: unknown;
  onChange: (value: VendorPay) => void;
  onBlur?: () => void;
  isLight: boolean;
}

const NEXT_KEYS = ["ArrowRight", "ArrowDown"];
const PREV_KEYS = ["ArrowLeft", "ArrowUp"];

/** Pay as selectable cards. A radio group: Tab reaches the chosen card, arrow keys change it. */
export const VendorPayOptions = ({ value, onChange, onBlur, isLight }: VendorPayOptionsProps) => {
  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = PAY_OPTIONS.indexOf(value as VendorPay);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;
  const last = PAY_OPTIONS.length - 1;

  const choose = (index: number) => {
    onChange(PAY_OPTIONS[index]);
    cardRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const next = NEXT_KEYS.includes(event.key)
      ? index === last ? 0 : index + 1
      : PREV_KEYS.includes(event.key)
        ? index === 0 ? last : index - 1
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? last
            : null;
    if (next === null) return;
    event.preventDefault();
    choose(next);
  };

  return (
    <div className="@container">
      <div
        role="radiogroup"
        aria-label="Pay"
        className="grid grid-cols-1 gap-2 @sm:grid-cols-2 @2xl:grid-cols-4"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur?.();
        }}
      >
        {PAY_OPTIONS.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={option}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={() => choose(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                selected
                  ? isLight
                    ? "border-purple-600 bg-purple-50"
                    : "border-purple-500 bg-purple-600/20"
                  : isLight
                    ? "border-purple-200 bg-white hover:bg-purple-50/60"
                    : "border-purple-300/20 bg-white/[0.03] hover:bg-white/10"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
                {option}
                {selected && <Check className="w-4 h-4 shrink-0 text-purple-300" aria-hidden="true" />}
              </span>
              <span className="text-xs text-white/70">{PAY_OPTION_DESCRIPTIONS[option]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VendorPayOptions;
