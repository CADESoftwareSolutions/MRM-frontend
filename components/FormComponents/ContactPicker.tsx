import * as React from "react";
import { useAtom } from "jotai";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useContactOptions, type ContactOption } from "@/hooks/useContactOptions";
import { mockNameId } from "@/lib/nameId";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";
import { CLASSIFICATION_COLORS_DARK, CLASSIFICATION_COLORS_LIGHT } from "./List";

interface ContactPickerProps {
  /** Party id, or null when nothing is picked. */
  value: string | null;
  onChange: (id: string, option: ContactOption) => void;
  /** Limits the list to contacts with any of these classifications (e.g. ["VENDOR"]) until the
   * user chooses "Show all types". */
  classifications?: string[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  /** Defaults to opening the Contacts screen in a new tab so the form being filled in is kept. */
  onAddNew?: () => void;
  id?: string;
  "aria-label"?: string;
}

// Rendering thousands of rows per keystroke makes typing lag; past this the user narrows instead.
const MAX_ROWS = 100;

const tokenize = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString()} ${count === 1 ? one : many}`;

/** Wraps the first occurrence of each search token in <mark>. */
const highlight = (text: string, tokens: string[], markClassName: string): React.ReactNode => {
  const lower = text.toLowerCase();
  // Some characters change length when lowercased, which would shift every index below.
  if (tokens.length === 0 || lower.length !== text.length) return text;

  const ranges = tokens
    .map((token) => {
      const start = lower.indexOf(token);
      return [start, start + token.length] as const;
    })
    .filter(([start]) => start !== -1)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  ranges.forEach(([start, end]) => {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  });
  if (merged.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end]) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className={markClassName}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

/** Searchable contact dropdown for any "pick a contact" field (vendor, operator, owner…). */
export const ContactPicker: React.FC<ContactPickerProps> = ({
  value,
  onChange,
  classifications,
  placeholder = "Select contact",
  invalid,
  disabled = false,
  className,
  size = "default",
  onAddNew,
  id,
  "aria-label": ariaLabel,
}) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const { options, loading, isError, refetch } = useContactOptions();
  const failed = isError && options.length === 0;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [showAllTypes, setShowAllTypes] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const searchBoxRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const baseId = React.useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const classificationsKey = (classifications ?? []).map((c) => c.toUpperCase()).join("|");
  const typeFilter = React.useMemo(
    () => (classificationsKey ? new Set(classificationsKey.split("|")) : null),
    [classificationsKey],
  );
  const typesLabel = classificationsKey.split("|").join(" / ");

  const searchable = React.useMemo(
    () =>
      options.map((option) => ({
        option,
        fields: [
          option.name,
          option.nameLine2,
          option.nameId,
          option.city,
          option.state,
          option.taxIdLast4,
        ].map((field) => field.toLowerCase()),
      })),
    [options],
  );

  const filterOptions = React.useCallback(
    (search: string, allTypes: boolean) => {
      const tokens = tokenize(search);
      return searchable
        .filter(
          ({ option, fields }) =>
            (allTypes || !typeFilter || option.classifications.some((c) => typeFilter.has(c.toUpperCase()))) &&
            tokens.every((token) => fields.some((field) => field.includes(token))),
        )
        .map(({ option }) => option);
    },
    [searchable, typeFilter],
  );

  const filterActive = Boolean(typeFilter) && !showAllTypes;
  const matches = React.useMemo(
    () => filterOptions(query, showAllTypes),
    [filterOptions, query, showAllTypes],
  );
  const outsideTypeCount = React.useMemo(
    () => (filterActive && matches.length === 0 ? filterOptions(query, true).length : 0),
    [filterActive, matches.length, filterOptions, query],
  );
  const rows = matches.slice(0, MAX_ROWS);
  const tokens = tokenize(query);

  const selected = value ? options.find((option) => option.id === String(value)) : undefined;

  const openPicker = (initialQuery: string) => {
    setQuery(initialQuery);
    setShowAllTypes(false);
    const index = initialQuery
      ? 0
      : filterOptions("", false)
          .slice(0, MAX_ROWS)
          .findIndex((option) => option.id === String(value));
    setActiveIndex(Math.max(index, 0));
    setOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) openPicker("");
    else setOpen(false);
  };

  const select = (option: ContactOption) => {
    onChange(option.id, option);
    setOpen(false);
  };

  const handleAddNew = () => {
    setOpen(false);
    if (onAddNew) onAddNew();
    else window.open("/Dashboard/contacts", "_blank", "noopener");
  };

  const focusSearch = () => {
    searchBoxRef.current?.querySelector("input")?.focus({ preventScroll: true });
  };

  // Scrolls the list itself rather than calling scrollIntoView, which would also scroll the page
  // while Radix is still positioning the freshly opened popover.
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) {
      list.scrollTop = row.offsetTop;
    } else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }, [activeIndex, open]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(Math.min(index + 1, rows.length - 1), 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (rows[activeIndex]) select(rows[activeIndex]);
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openPicker("");
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      openPicker(event.key);
    }
  };

  const muted = isLight ? "text-gray-500" : "text-white/50";
  const divider = isLight ? "border-purple-200" : "border-purple-300/15";
  const linkButton = cn(
    "cursor-pointer text-xs underline underline-offset-2",
    isLight ? "text-purple-700 hover:text-purple-900" : "text-purple-300 hover:text-purple-100",
  );
  const classColors = isLight ? CLASSIFICATION_COLORS_LIGHT : CLASSIFICATION_COLORS_DARK;
  const fallbackBadge = isLight
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : "bg-purple-500/20 text-purple-300 border-purple-400/30";
  const inactiveBadge = isLight
    ? "bg-gray-100 text-gray-500 border-gray-300"
    : "bg-gray-500/20 text-gray-300 border-gray-400/30";
  const w9Badge = isLight
    ? "bg-green-100 text-green-700 border-green-300"
    : "bg-green-500/20 text-green-300 border-green-400/30";
  const markClassName = cn(
    "bg-transparent font-bold",
    isLight ? "text-purple-700" : "text-fuchsia-300",
  );

  const renderTriggerLabel = () => {
    if (selected) {
      return (
        <>
          <span className="tabular-nums text-white/60">{selected.nameId}</span>
          <span className="text-white/60"> · </span>
          {selected.name}
        </>
      );
    }
    if (value) {
      return (
        <>
          <span className="tabular-nums text-white/60">{mockNameId(value)}</span>
          <span className="text-white/60">
            {" "}
            · {loading ? "Loading…" : failed ? "Couldn't load contacts" : "Unknown contact"}
          </span>
        </>
      );
    }
    return <span className="text-white/70">{placeholder}</span>;
  };

  const countLine = loading
    ? "Loading contacts…"
    : query.trim()
      ? `${plural(matches.length, "match", "matches")} · name, Name ID, Tax ID last 4, city`
      : `${plural(matches.length, "contact", "contacts")} · search by name, Name ID, Tax ID last 4, city`;

  const renderEmptyState = () => {
    if (loading || rows.length > 0) return null;
    if (failed) {
      return (
        <div className={cn("flex flex-col items-center gap-1 px-3 py-6 text-center text-sm", muted)}>
          <p role="alert">Couldn’t load contacts.</p>
          <button type="button" className={linkButton} onClick={refetch}>
            Retry
          </button>
        </div>
      );
    }
    if (options.length === 0) {
      return <p className={cn("px-3 py-6 text-center text-sm", muted)}>No contacts yet</p>;
    }
    return (
      <div className={cn("flex flex-col items-center gap-1 px-3 py-6 text-center text-sm", muted)}>
        <p>
          {filterActive ? `No ${typesLabel} contacts` : "No contacts"}
          {query.trim() ? ` match “${query.trim()}”` : ""}
        </p>
        {outsideTypeCount > 0 && (
          <button
            type="button"
            className={linkButton}
            onClick={() => {
              setShowAllTypes(true);
              focusSearch();
            }}
          >
            Show {plural(outsideTypeCount, "match", "matches")} in other types
          </button>
        )}
      </div>
    );
  };

  return (
    <Popover open={open && !disabled} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={
            ariaLabel ? `${ariaLabel}: ${selected?.name ?? (value ? "unknown contact" : placeholder)}` : undefined
          }
          aria-invalid={invalid || undefined}
          // Shares the select trigger's slot so index.css gives it the same border and
          // light-theme colours as the app's other dropdowns.
          data-slot="select-trigger"
          disabled={disabled}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-purple-300/30 bg-white/5 px-3 text-sm text-white shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm" ? "h-8" : "h-9",
            className,
            invalid && "ring-1 ring-red-500",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{renderTriggerLabel()}</span>
          <ChevronDown className="size-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        aria-label="Choose a contact"
        style={{ zIndex: Z_INDEX.modalDropdown }}
        collisionPadding={8}
        className={cn(
          "flex w-[max(var(--radix-popover-trigger-width),28rem)] max-w-[calc(100vw_-_1rem)] flex-col overflow-hidden p-0",
          isLight ? "text-gray-900" : "text-white",
        )}
        // Radix's own auto-focus also selects the input's text, so a first letter typed on the
        // closed trigger (seeded into the query) would be replaced by the next keystroke.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchBoxRef.current?.querySelector("input")?.focus({ preventScroll: true });
        }}
      >
        <div ref={searchBoxRef} className="relative p-2">
          <Search
            className={cn(
              "pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2",
              isLight ? "text-gray-400" : "text-purple-300/60",
            )}
          />
          <Input
            role="combobox"
            aria-label="Search contacts"
            aria-expanded
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={rows[activeIndex] ? optionId(activeIndex) : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search name, Name ID, city…"
            className={cn(
              "h-9 pl-9",
              isLight
                ? "bg-white border-purple-200 text-gray-900 placeholder:text-gray-400"
                : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40",
            )}
          />
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-y px-3 py-2",
            divider,
          )}
        >
          <span aria-live="polite" className={cn("text-xs", muted)}>
            {countLine}
          </span>
          {typeFilter && (
            <span className="flex items-center gap-2">
              {filterActive && (
                <Badge className="border-transparent bg-purple-600 text-white">{typesLabel} only</Badge>
              )}
              <button
                type="button"
                className={linkButton}
                onClick={() => {
                  setShowAllTypes((all) => !all);
                  setActiveIndex(0);
                  focusSearch();
                }}
              >
                {filterActive ? "Show all types" : `${typesLabel} only`}
              </button>
            </span>
          )}
        </div>

        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Matching contacts"
          className={cn("relative max-h-72 overflow-y-auto", rows.length > 0 && "space-y-0.5 p-1.5")}
        >
          {rows.map((option, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={isActive}
                data-index={index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (!isActive) setActiveIndex(index);
                }}
                onClick={() => select(option)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                  isActive && (isLight ? "bg-purple-100" : "bg-purple-600/30"),
                  !option.isActive && "opacity-70",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {highlight(option.name, tokens, markClassName)}
                  </div>
                  {option.nameLine2 && (
                    <div className={cn("truncate text-xs", muted)}>
                      {highlight(option.nameLine2, tokens, markClassName)}
                    </div>
                  )}
                  <div className={cn("mt-1 flex flex-wrap items-center gap-1.5 text-xs", muted)}>
                    {option.addressSummary && <span>{option.addressSummary}</span>}
                    {option.classifications.map((classification) => (
                      <Badge
                        key={classification}
                        variant="outline"
                        className={cn("font-medium", classColors[classification] ?? fallbackBadge)}
                      >
                        {classification}
                      </Badge>
                    ))}
                    {option.w9OnFile && (
                      <Badge variant="outline" className={cn("font-medium", w9Badge)}>
                        W-9
                      </Badge>
                    )}
                    {option.taxIdLast4 && tokens.some((token) => option.taxIdLast4.includes(token)) && (
                      <span>Tax ID ···{option.taxIdLast4}</span>
                    )}
                    {!option.isActive && (
                      <Badge variant="outline" className={cn("font-medium", inactiveBadge)}>
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-xs tabular-nums",
                    isLight ? "text-purple-700" : "text-purple-200",
                  )}
                >
                  {option.id === String(value) && <Check className="size-3.5" aria-label="Selected" />}
                  {option.nameId}
                </span>
              </li>
            );
          })}
        </ul>

        {renderEmptyState()}

        {matches.length > MAX_ROWS && (
          <p className={cn("px-3 pb-2 text-xs", muted)}>
            Showing the first {MAX_ROWS} of {matches.length.toLocaleString()}. Keep typing to narrow it
            down.
          </p>
        )}

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2",
            divider,
          )}
        >
          <span className={cn("text-xs", muted)}>↑ ↓ to move · Enter to select · Esc to close</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddNew}
            className={cn(
              "cursor-pointer border border-dashed",
              isLight
                ? "border-purple-400 text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                : "border-purple-300/50 text-purple-300 hover:bg-purple-500/20 hover:text-purple-100",
            )}
          >
            <Plus className="size-3.5" />
            Add new contact
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContactPicker;
