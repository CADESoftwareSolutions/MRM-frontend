import * as React from "react";
import { useAtomValue } from "jotai";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";

export interface GridPickerOption {
  value: string;
  label: string;
  /** Second line in the list, e.g. a well's API # or an AFE's description. */
  detail?: string;
  /** Extra text the search matches on but doesn't show. */
  keywords?: string;
}

interface GridPickerProps {
  /** Text shown while the field isn't focused: the current pick, or a stored value that's no
   * longer listed. Typing never changes it; only picking from the list or clearing does. */
  display: string;
  /** The current option's value, check-marked in the list. */
  value: string | null;
  options: GridPickerOption[];
  onPick: (option: GridPickerOption) => void;
  /** When given, an × shows while something is picked. */
  onClear?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
}

const tokenize = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);

/** Compact searchable picker for coding-grid cells. Its list portals to <body> so the grid's
 * horizontal scroll container doesn't clip it. */
export const GridPicker = ({
  display,
  value,
  options,
  onPick,
  onClear,
  placeholder = "Select",
  emptyMessage = "No matches",
  loading = false,
  invalid,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: GridPickerProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const listId = React.useId();
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const rows = React.useMemo<GridPickerOption[]>(() => {
    const tokens = tokenize(query);
    if (!tokens.length) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.detail ?? ""} ${option.keywords ?? ""}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openList = () => {
    if (disabled) return;
    setQuery("");
    const selectedIndex = value ? options.findIndex((option) => option.value === value) : -1;
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const choose = (option: GridPickerOption) => {
    onPick(option);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && rows[activeIndex]) {
      event.preventDefault();
      choose(rows[activeIndex]);
    } else if (event.key === "Tab" && open && query.trim() && rows[activeIndex]) {
      choose(rows[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery("");
      setOpen(false);
    }
  };

  const showClear = !!onClear && !!display && !disabled;
  const activeOptionId = open && rows[activeIndex] ? `${listId}-${activeIndex}` : undefined;
  const muted = isLight ? "text-gray-500" : "text-white/50";

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative w-full">
          <Input
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-invalid={invalid || undefined}
            autoComplete="off"
            title={display || undefined}
            value={focused ? query : display}
            placeholder={focused && display ? display : placeholder}
            disabled={disabled}
            onFocus={() => {
              setFocused(true);
              openList();
            }}
            onBlur={() => {
              setFocused(false);
              setOpen(false);
              setQuery("");
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (!open && !disabled) setOpen(true);
            }}
            onMouseDown={() => {
              if (focused && !open) openList();
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-8 px-2 pr-7 text-[13px] md:text-[13px] bg-white/5 border-purple-300/30 text-white",
              invalid && "border-red-500",
              className,
            )}
          />
          {showClear ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Clear ${ariaLabel}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onClear?.();
                setQuery("");
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <ChevronsUpDown
              className={cn(
                "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-white/60",
                disabled && "opacity-50",
              )}
            />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        id={listId}
        role="listbox"
        aria-label={`${ariaLabel} options`}
        align="start"
        collisionPadding={8}
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={cn(
          "w-[max(var(--radix-popover-trigger-width),16rem)] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-md p-1",
          isLight ? "text-gray-900" : "text-white",
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        onMouseDown={(event) => event.preventDefault()}
      >
        <div ref={listRef}>
          {rows.length === 0 ? (
            <div className={cn("px-2 py-2 text-sm", muted)}>{loading ? "Loading…" : emptyMessage}</div>
          ) : (
            rows.map((option, index) => {
              const isActive = index === activeIndex;
              const activeClass = isActive ? (isLight ? "bg-purple-100 text-purple-900" : "bg-purple-400/40") : "";
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  data-active={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                    activeClass,
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.detail && <span className={cn("block truncate text-xs", muted)}>{option.detail}</span>}
                  </span>
                  <Check className={cn("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GridPicker;
