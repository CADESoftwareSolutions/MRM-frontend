import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComboboxBaseProps<T> {
  inputValue: string;
  onInputChange: (value: string) => void;
  onBlur?: () => void;
  /** Already filtered for the current inputValue — filtering is caller-specific (fuzzy county
   * matching vs. plain substring), this component only owns open/close, active-row tracking,
   * and rendering whatever list it's handed. */
  items: T[];
  getKey: (item: T) => string | number;
  /** Full <button> for the row, including its own onClick. `select` closes the dropdown after
   * calling onSelect, so wiring a row's click to it keeps that behavior in one place instead
   * of every caller having to remember to close on select. */
  renderItem: (item: T, isActive: boolean, select: (item: T) => void) => React.ReactNode;
  onSelect: (item: T) => void;
  emptyMessage?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

/** Shared shell for a text input with a filtered, keyboard-navigable dropdown beneath it.
 * Owns open/close, active-row tracking, click-outside-to-close, and Arrow/Enter/Escape —
 * the interaction model Combobox (free-text + list) and CountyCombobox (fixed reference
 * list) both need identically. Callers own filtering and row rendering. */
export function ComboboxBase<T>({
  inputValue,
  onInputChange,
  onBlur,
  items,
  getKey,
  renderItem,
  onSelect,
  emptyMessage = "No results",
  disabled = false,
  placeholder,
  className,
  invalid,
}: ComboboxBaseProps<T>) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [openUpward, setOpenUpward] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Plain absolutely-positioned dropdown (no portal, no Radix collision detection) — near
  // the bottom of a card it would otherwise hang off the card into the page below it, which
  // (since it's still in the document's scrollable overflow) shows up as blank space past
  // the card's own background. Flip it above the input when there isn't room below.
  const DROPDOWN_MAX_HEIGHT = 256; // matches max-h-64
  const openDropdown = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow);
    }
    setOpen(true);
  };

  React.useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const select = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown();
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && items[activeIndex]) {
      event.preventDefault();
      select(items[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={inputValue}
          onChange={(event) => {
            onInputChange(event.target.value);
            openDropdown();
          }}
          onFocus={() => !disabled && openDropdown()}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(className, "pr-9", invalid && "border-red-500")}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
      </div>

      {open && !disabled && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 max-h-64 w-full overflow-y-auto rounded-md border border-purple-300/30 bg-[#1a1a2e] p-1 shadow-lg",
            openUpward ? "bottom-full mb-1" : "mt-1",
          )}
        >
          {items.length === 0 ? (
            <div className="px-2 py-2 text-sm text-white/60">{emptyMessage}</div>
          ) : (
            items.map((item, index) => (
              <React.Fragment key={getKey(item)}>
                {renderItem(item, index === activeIndex, select)}
              </React.Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
}
