import { useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";
import { formatGlPeriod } from "@/types/revenue";
import { READ_ONLY_CLASS, useEntryTheme } from "./entryTheme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthPickerProps {
  /** "2026-10" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const yearOf = (value: string) => {
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear();
};

/** Month-and-year picker for a G/L period. */
export const MonthPicker = ({
  value,
  onChange,
  placeholder = "Select month",
  disabled = false,
  invalid,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: MonthPickerProps) => {
  const theme = useEntryTheme();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => yearOf(value));
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedMonth = value.startsWith(`${year}-`) ? Number(value.slice(5, 7)) - 1 : 0;

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;
    let target = current;
    if (event.key in steps) target = Math.min(Math.max(current + steps[event.key], 0), buttons.length - 1);
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[target]?.focus();
  };

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        if (next) setYear(yearOf(value));
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          // Shares the select trigger's slot so index.css themes it like the app's other dropdowns.
          data-slot="select-trigger"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-purple-300/30 bg-white/5 px-3 text-sm text-white shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-50",
            READ_ONLY_CLASS,
            invalid && "ring-1 ring-red-500",
          )}
        >
          {/* "Nov 2026": the full month name doesn't fit a quarter-width field on a 1280px screen. */}
          <span className={cn("truncate", !value && "text-white/70")} title={value ? formatGlPeriod(value) : undefined}>
            {value ? formatGlPeriod(value).replace(/^(\w{3})\w+/, "$1") : placeholder}
          </span>
          <CalendarDays className="size-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={cn("w-64 p-3", theme.popoverText)}
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous year"
            onClick={() => setYear((y) => y - 1)}
            className="cal-nav-btn rounded-md p-1 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="cal-caption text-sm font-semibold tabular-nums">{year}</span>
          <button
            type="button"
            aria-label="Next year"
            onClick={() => setYear((y) => y + 1)}
            className="cal-nav-btn rounded-md p-1 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div ref={gridRef} onKeyDown={handleGridKeyDown} className="grid grid-cols-3 gap-1" role="listbox" aria-label={`Months of ${year}`}>
          {MONTHS.map((name, index) => {
            const period = `${year}-${String(index + 1).padStart(2, "0")}`;
            const selected = period === value;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={index === selectedMonth ? 0 : -1}
                onClick={() => {
                  onChange(period);
                  setOpen(false);
                }}
                className={cn(
                  "h-8 rounded-md text-sm cursor-pointer transition-colors",
                  selected ? "bg-purple-600 text-white" : theme.isLight ? "hover:bg-purple-100" : "hover:bg-purple-500/20",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthPicker;
