import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { WellOption } from "@/hooks/useWellOptions";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";
import { useImportTheme } from "./importTheme";

export interface WellPickerProps {
  wells: WellOption[];
  loading?: boolean;
  /** Well id, or null when nothing is picked. */
  value: string | null;
  /** Shown when the value isn't in the list (e.g. a remembered well that hasn't loaded). */
  valueLabel?: string | null;
  onChange: (well: WellOption) => void;
  /** Nothing picked yet and it needs one: shows the amber "needs a match" trigger. */
  needsMatch?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

// Rendering thousands of rows per keystroke makes typing lag; past this the user narrows instead.
const MAX_ROWS = 100;

const searchText = (well: WellOption) =>
  [well.label, well.leaseName, well.wellNumber, well.apiNumber, well.operatorName, well.countyName, well.stateCode]
    .join(" ")
    .toLowerCase();

const wellPlace = (well: WellOption) => [well.countyName, well.stateCode].filter(Boolean).join(", ");

/** Searchable well dropdown (name, API #, operator, county). */
export const WellPicker = ({
  wells,
  loading = false,
  value,
  valueLabel,
  onChange,
  needsMatch = false,
  placeholder = "Choose a well",
  "aria-label": ariaLabel,
}: WellPickerProps) => {
  const theme = useImportTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const searchable = useMemo(() => wells.map((well) => ({ well, text: searchText(well) })), [wells]);
  const matches = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return searchable.filter(({ text }) => tokens.every((t) => text.includes(t))).map(({ well }) => well);
  }, [searchable, query]);
  const rows = matches.slice(0, MAX_ROWS);
  const selected = value ? wells.find((w) => w.id === value) : undefined;

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }, [activeIndex, open]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("");
      setActiveIndex(Math.max(0, value ? wells.slice(0, MAX_ROWS).findIndex((w) => w.id === value) : 0));
    }
    setOpen(next);
  };

  const pick = (well: WellOption) => {
    onChange(well);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(Math.min(i + 1, rows.length - 1), 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (rows[activeIndex]) pick(rows[activeIndex]);
    }
  };

  const triggerLabel = selected?.label || valueLabel || (value ? "Unknown well" : placeholder);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {needsMatch && !value ? (
          <button
            type="button"
            aria-label={ariaLabel ? `${ariaLabel}: ${triggerLabel}` : undefined}
            className={`flex h-8 w-full items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed px-2 text-[13px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-[3px] ${theme.needButton}`}
          >
            {placeholder}
            <ChevronDown className="size-3.5 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={ariaLabel ? `${ariaLabel}: ${triggerLabel}` : undefined}
            // Shares the select trigger's slot so index.css gives it the app's dropdown border and
            // light-theme colours.
            data-slot="select-trigger"
            className="flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-purple-300/30 bg-white/5 px-2 text-[13px] text-white outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400/40"
          >
            <span className={cn("min-w-0 flex-1 truncate text-left", !value && "text-white/70")}>{triggerLabel}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label="Choose a well"
        style={{ zIndex: Z_INDEX.modalDropdown }}
        collisionPadding={8}
        className={cn(
          "flex w-[max(var(--radix-popover-trigger-width),26rem)] max-w-[calc(100vw_-_1rem)] flex-col overflow-hidden p-0",
          theme.popoverText,
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.querySelector("input")?.focus({ preventScroll: true });
        }}
      >
        <div ref={searchRef} className="relative p-2">
          <Search className={cn("pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2", theme.popoverMuted)} />
          <Input
            role="combobox"
            aria-label="Search wells"
            aria-expanded
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={rows[activeIndex] ? `${baseId}-${activeIndex}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search name, API #, operator, county…"
            className={cn(
              "h-9 pl-9",
              theme.isLight
                ? "bg-white border-purple-200 text-gray-900 placeholder:text-gray-400"
                : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40",
            )}
          />
        </div>
        <p className={cn("border-y px-3 py-2 text-xs", theme.popoverDivider, theme.popoverMuted)} aria-live="polite">
          {loading
            ? "Loading wells…"
            : `${matches.length.toLocaleString("en-US")} ${matches.length === 1 ? "well" : "wells"}${
                matches.length > MAX_ROWS ? ` · showing the first ${MAX_ROWS}, keep typing to narrow it down` : ""
              }`}
        </p>
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Matching wells"
          className={cn("relative max-h-72 overflow-y-auto", rows.length > 0 && "space-y-0.5 p-1.5")}
        >
          {rows.map((well, index) => {
            const isActive = index === activeIndex;
            const details = [well.apiNumber && `API ${well.apiNumber}`, well.operatorName, wellPlace(well)].filter(Boolean);
            return (
              <li
                key={well.id}
                id={`${baseId}-${index}`}
                role="option"
                aria-selected={well.id === value}
                data-index={index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (!isActive) setActiveIndex(index);
                }}
                onClick={() => pick(well)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2",
                  isActive && theme.optionActive,
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{well.label}</span>
                  {details.length > 0 && (
                    <span className={cn("block truncate text-xs", theme.popoverMuted)}>{details.join(" · ")}</span>
                  )}
                </span>
                {well.id === value && <Check className="size-4 shrink-0" aria-label="Selected" />}
              </li>
            );
          })}
        </ul>
        {!loading && rows.length === 0 && (
          <p className={cn("px-3 py-6 text-center text-sm", theme.popoverMuted)}>
            {wells.length ? `No wells match “${query.trim()}”` : "No wells yet"}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default WellPicker;
