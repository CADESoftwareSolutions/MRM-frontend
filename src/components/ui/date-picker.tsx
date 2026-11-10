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
  // date-fns reads "yyyy" as 1–4 digits, so without this a half-typed "02/18/19" would commit
  // the year 0019.
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return undefined;
  const parsed = parse(text, DISPLAY_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
};

const SEGMENT_LENGTHS = [2, 2, 4];

/** Shapes raw typed/pasted text into MM/DD/YYYY and maps the caret into the result. Digits flow
 * into the next segment once one fills ("02181995" → "02/18/1995"); a typed "/" closes a segment
 * early, zero-padding a lone month/day digit once the caret has moved past it ("2/" → "02/"), but
 * not while that segment is still being edited. A slash is only ever inserted ahead of a digit,
 * never trailing, which is what lets backspace delete back across one without it reappearing. */
const formatDateInput = (raw: string, caret: number): { text: string; caret: number } => {
  const segments = ["", "", ""];
  let seg = 0;
  let caretSeg = 0;
  let caretOffset = 0;
  for (let i = 0; i <= raw.length; i++) {
    if (i === caret) {
      caretSeg = seg;
      caretOffset = segments[seg].length;
    }
    const ch = raw.charAt(i);
    if (/\d/.test(ch)) {
      if (segments[seg].length < SEGMENT_LENGTHS[seg]) {
        segments[seg] += ch;
      } else if (seg < 2) {
        // Spill into the next segment only if the slashes still ahead don't already delimit
        // every remaining one. If they do, this is a digit typed into a full segment mid-string,
        // and spilling would shift all the later digits over (e.g. the year into garbage).
        const slashesAhead = raw.slice(i + 1).split("/").length - 1;
        if (slashesAhead < 2 - seg) {
          seg++;
          segments[seg] = ch;
        }
      }
    } else if (ch === "/" && seg < 2 && segments[seg] !== "") {
      if (caret > i && segments[seg].length === 1 && segments[seg] !== "0") {
        segments[seg] = `0${segments[seg]}`;
      }
      seg++;
    }
  }
  return {
    text: segments.slice(0, seg + 1).join("/"),
    caret: segments.slice(0, caretSeg).reduce((pos, s) => pos + s.length + 1, 0) + caretOffset,
  };
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
 * the calendar icon) opens the popover; typing a full MM/DD/YYYY date commits it directly, with
 * the slashes optional ("02181995" works). */
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
            inputMode="numeric"
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
              const input = e.target;
              const { text: next, caret } = formatDateInput(
                input.value,
                input.selectionStart ?? input.value.length,
              );
              if (next !== input.value) {
                // Write the formatted text to the DOM ourselves so React's re-render finds it
                // already current and leaves the caret where we put it (React setting a changed
                // value would jump the caret to the end, breaking mid-string edits).
                input.value = next;
                input.setSelectionRange(caret, caret);
              }
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
        // "end" (not "start"): the calendar icon that opens this sits at the field's right
        // edge, so the popover should drop down aligned under it, not under the left edge of
        // the typed-date text.
        align="end"
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
