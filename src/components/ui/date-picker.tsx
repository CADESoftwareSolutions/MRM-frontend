"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";

const DISPLAY_FORMAT = "MM/dd/yyyy";
const ISO_FORMAT = "yyyy-MM-dd";

const parseIso = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = parse(value, ISO_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
};

const parseDisplay = (text: string): Date | undefined => {
  const parsed = parse(text, DISPLAY_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
};

interface DatePickerProps {
  id?: string;
  /** ISO "yyyy-MM-dd", same value shape the native `<input type="date">` this replaces used —
   * so it round-trips through existing GraphQL mutations unchanged. */
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/** Typeable date field backed by a calendar popover. Clicking anywhere in the field (not just
 * the calendar icon) opens the popover; typing a full MM/DD/YYYY date commits it directly. */
export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value = "",
  onChange,
  onBlur,
  placeholder = "MM/DD/YYYY",
  className,
  invalid,
  disabled = false,
}) => {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const focusedRef = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => {
    const d = parseIso(value);
    return d ? format(d, DISPLAY_FORMAT) : "";
  });
  const [month, setMonth] = React.useState<Date>(() => parseIso(value) ?? new Date());

  // Keep the displayed text synced with external value changes (e.g. form reset/load), but
  // don't fight the user mid-keystroke by only resyncing while the field isn't focused.
  React.useEffect(() => {
    if (focusedRef.current) return;
    const d = parseIso(value);
    setText(d ? format(d, DISPLAY_FORMAT) : "");
    if (d) setMonth(d);
  }, [value]);

  const commit = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, ISO_FORMAT));
      setMonth(date);
      setText(format(date, DISPLAY_FORMAT));
    } else {
      onChange("");
    }
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={fieldRef} className="relative">
          <Input
            id={id}
            type="text"
            autoComplete="off"
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => {
              focusedRef.current = true;
              setOpen(true);
            }}
            onBlur={() => {
              focusedRef.current = false;
              const parsed = parseDisplay(text);
              if (parsed) {
                commit(parsed);
              } else if (text.trim() === "") {
                commit(undefined);
              } else {
                // Couldn't resolve to a real date — drop the stray text and fall back to
                // whatever the last committed value was instead of leaving garbage behind.
                const d = parseIso(value);
                setText(d ? format(d, DISPLAY_FORMAT) : "");
              }
              setOpen(false);
              onBlur?.();
            }}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              // Only auto-commit once the field is fully typed (fixed-width MM/DD/YYYY) —
              // committing on every partial keystroke can resolve to a nonsense date
              // (e.g. a year still being typed) before the user finishes.
              if (next.length === DISPLAY_FORMAT.length) {
                const parsed = parseDisplay(next);
                if (parsed) commit(parsed);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") setOpen(true);
              if (e.key === "Enter") {
                e.preventDefault();
                const parsed = parseDisplay(text);
                if (parsed) commit(parsed);
                setOpen(false);
              }
            }}
            className={cn("pr-9", className, invalid && "border-red-500")}
          />
          {/* Plain button, not a Radix PopoverTrigger — Trigger would compose its own toggle
              handler with this one via asChild and double-fire, canceling itself out on every
              click. The onInteractOutside guard below already keeps clicking this button from
              being treated as a dismiss, so a real Trigger buys nothing extra here. */}
          <button
            type="button"
            aria-label="Open calendar"
            disabled={disabled}
            // Without this, mousedown blurs the input first (closing the popover via
            // onBlur) and then this onClick re-toggles it — net effect is a flicker that
            // never actually closes on click when already open.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((o) => !o)}
            className="absolute right-0 top-0 flex h-full items-center px-2.5 text-purple-300/70 transition-colors hover:text-purple-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            <CalendarIcon className="size-4" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className="w-auto"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Keep focus on the input throughout calendar interactions instead of letting the
        // browser shift it to whichever day/nav button was clicked.
        onMouseDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking back into our own field (input or the icon button) is outside the
          // portaled Content from Radix's point of view, but should never count as a
          // dismiss — the field's own handlers already manage `open` for that.
          if (fieldRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <Calendar
          mode="single"
          selected={parseIso(value)}
          month={month}
          onMonthChange={setMonth}
          onSelect={(date) => {
            commit(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
