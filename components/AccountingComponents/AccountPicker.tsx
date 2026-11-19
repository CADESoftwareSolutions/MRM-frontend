import * as React from "react";
import { useAtomValue } from "jotai";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";
import {
  AccountCategory,
  ChartAccount,
  compareAccounts,
  formatAccountLabel,
  formatAccountNumber,
} from "@/types/chartOfAccounts";

export interface AccountPickerProps {
  value: string | null;
  onChange: (id: string, account: ChartAccount) => void;
  /** Limit the choices to these categories. The current value still shows if it's outside them. */
  categories?: AccountCategory[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  /** "sm" is the compact height for dense grids (coding lines, tax/deduct rows). */
  size?: "sm" | "default";
  /** When given, an × appears while an account is picked, and clicking it calls this. */
  onClear?: () => void;
  onBlur?: () => void;
  id?: string;
  "aria-label"?: string;
  /** Id of the element holding this field's error message. */
  "aria-describedby"?: string;
}

// Lower is better; null means no match. "6000 110" is read as "6000-110".
const rank = (account: ChartAccount, query: string): number | null => {
  const number = formatAccountNumber(account);
  if (number === query) return 0;
  if (number.startsWith(query)) return 1;
  if (account.description.startsWith(query)) return 2;
  if (
    number.includes(query) ||
    account.description.includes(query) ||
    formatAccountLabel(account).includes(query) ||
    `${number} ${account.description}`.includes(query)
  ) {
    return 3;
  }
  return null;
};

const normalizeQuery = (raw: string) =>
  raw
    .trim()
    .toUpperCase()
    .replace(/^(\d+)\s+(\d+)/, "$1-$2");

/** Searchable account picker backed by useChartOfAccounts. Inactive accounts can't be picked
 * but still display when they're the current value. The list portals to <body> so it isn't
 * clipped by scrolling grids or modals. */
export const AccountPicker = React.forwardRef<HTMLInputElement, AccountPickerProps>(function AccountPicker(
  {
    value,
    onChange,
    categories,
    placeholder = "Select account",
    invalid,
    disabled = false,
    className,
    size = "default",
    onClear,
    onBlur,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
  },
  ref,
) {
  const isLight = useAtomValue(themeAtom) === "light";
  const { accounts, loading, getAccount } = useChartOfAccounts();
  const listId = React.useId();
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  // Input and PopoverContent are plain function components (React 18 drops refs on those), so
  // the forwarded ref and the scroll container are reached through wrappers instead.
  React.useImperativeHandle(ref, () => anchorRef.current?.querySelector("input") as HTMLInputElement, []);

  const selected = getAccount(value);
  const categoryKey = categories?.join("|") ?? "";

  const items = React.useMemo(() => {
    const allowed = categoryKey ? new Set(categoryKey.split("|")) : null;
    const pickable = accounts.filter((a) => a.isActive && (!allowed || allowed.has(a.category)));
    const q = normalizeQuery(query);
    if (!q) return pickable;
    return pickable
      .map((account) => ({ account, score: rank(account, q) }))
      .filter((entry): entry is { account: ChartAccount; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score || compareAccounts(a.account, b.account))
      .map((entry) => entry.account);
  }, [accounts, categoryKey, query]);

  // A ref callback because the list portals in a render after `open` flips, so an effect would run
  // before the option exists. Scrolls the list by hand: scrollIntoView would also move the page
  // while the popover is still being positioned.
  const activeOptionRef = React.useCallback((node: HTMLButtonElement | null) => {
    const scroller = node?.closest<HTMLElement>('[role="listbox"]');
    if (!node || !scroller) return;
    const nodeRect = node.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    if (nodeRect.top < scrollerRect.top) scroller.scrollTop -= scrollerRect.top - nodeRect.top;
    else if (nodeRect.bottom > scrollerRect.bottom) scroller.scrollTop += nodeRect.bottom - scrollerRect.bottom;
  }, []);

  const openList = (nextQuery: string) => {
    if (disabled) return;
    setQuery(nextQuery);
    // With no query the full list shows, so start from the current pick, or nothing, so Enter
    // can't pick the first account by accident.
    setActiveIndex(nextQuery.trim() ? 0 : value ? items.findIndex((a) => a.id === value) : -1);
    setOpen(true);
  };

  const pick = (account: ChartAccount) => {
    onChange(account.id, account);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openList(query);
      else setActiveIndex((i) => (items.length ? Math.min(i + 1, items.length - 1) : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if ((event.key === "Delete" || event.key === "Backspace") && onClear && value && !query) {
      event.preventDefault();
      onClear();
    } else if (event.key === "Enter" && open && items[activeIndex]) {
      event.preventDefault();
      pick(items[activeIndex]);
    } else if (event.key === "Tab" && open && query.trim() && items[activeIndex]) {
      // Typing "6000-110" then Tab picks the match and moves on, for fast grid entry.
      pick(items[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const selectedLabel = selected
    ? `${formatAccountLabel(selected)}${selected.isActive ? "" : " (inactive)"}`
    : value && !loading
      ? "(deleted account)"
      : "";
  const inputValue = focused ? query : selectedLabel;
  const inputPlaceholder =
    focused && selectedLabel ? selectedLabel : loading && value ? "Loading accounts…" : placeholder;
  const showClear = !!onClear && !!value && !disabled;
  const activeOptionId = open && items[activeIndex] ? `${listId}-${items[activeIndex].id}` : undefined;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative w-full">
          <Input
            id={id}
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-invalid={invalid || undefined}
            aria-describedby={ariaDescribedBy}
            autoComplete="off"
            title={selectedLabel || undefined}
            value={inputValue}
            placeholder={inputPlaceholder}
            disabled={disabled}
            onFocus={() => {
              setFocused(true);
              openList("");
            }}
            onBlur={() => {
              setFocused(false);
              setOpen(false);
              setQuery("");
              onBlur?.();
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(event.target.value.trim() ? 0 : -1);
              if (!open && !disabled) setOpen(true);
            }}
            onMouseDown={() => {
              if (focused && !open) openList(query);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-white/5 border-purple-300/30 text-white",
              size === "sm" ? "h-8 px-2 pr-7 text-[13px] md:text-[13px]" : "h-9 pr-9",
              invalid && "ring-1 ring-red-500",
              className,
            )}
          />
          {showClear ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear account"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onClear?.();
                setQuery("");
              }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded p-0.5 text-white/60 hover:text-white cursor-pointer",
                size === "sm" ? "right-1.5" : "right-2.5",
              )}
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <ChevronsUpDown
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/60",
                size === "sm" ? "right-2 size-3.5" : "right-3 size-4",
              )}
            />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        id={listId}
        role="listbox"
        aria-label={ariaLabel ? `${ariaLabel} options` : "Accounts"}
        align="start"
        collisionPadding={8}
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={cn(
          "w-[max(var(--radix-popover-trigger-width),28rem)] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-md p-1",
          isLight ? "text-gray-900" : "text-white",
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        // Keeps focus (and so the open list) on the input while scrolling or clicking in here.
        onMouseDown={(event) => event.preventDefault()}
      >
        <div>
          {items.length === 0 ? (
            <div className={cn("px-2 py-2 text-sm", isLight ? "text-gray-500" : "text-white/60")}>
              {loading ? "Loading accounts…" : "No matching accounts"}
            </div>
          ) : (
            items.map((account, index) => {
              const isActive = index === activeIndex;
              const isSelected = account.id === value;
              return (
                <button
                  key={account.id}
                  id={`${listId}-${account.id}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  ref={isActive ? activeOptionRef : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(account)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                    isActive ? (isLight ? "bg-purple-100 text-purple-900" : "bg-purple-400/40") : "",
                  )}
                >
                  <span className="w-[4.75rem] shrink-0 font-medium tabular-nums">{formatAccountNumber(account)}</span>
                  <span className="min-w-0 flex-1 break-words">{account.description}</span>
                  <span className={cn("shrink-0 text-xs", isLight ? "text-gray-500" : "text-white/50")}>
                    {account.category}
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
});

export default AccountPicker;
