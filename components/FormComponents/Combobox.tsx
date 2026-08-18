import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

/** Dropdown that also takes free text — pick a listed option, or type a value that isn't
 * in the list yet and it's used as-is. Same interaction model as CountyCombobox. */
export const Combobox: React.FC<ComboboxProps> = ({
  value = "",
  onChange,
  onBlur,
  options,
  disabled = false,
  placeholder = "Select or type to add",
  className,
  invalid,
}) => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, value]);

  const hasExactMatch = options.some(
    (option) => option.toLowerCase() === value.trim().toLowerCase(),
  );
  const showAddRow = value.trim().length > 0 && !hasExactMatch;
  // The "add new value" row is a trailing virtual entry at index filtered.length rather than
  // a sentinel mixed into `filtered` — filtered stays a plain string[] of real options, with
  // nothing that could collide with a real option someone types.
  const rowCount = filtered.length + (showAddRow ? 1 : 0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [value, options]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectValue = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, rowCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && activeIndex < rowCount) {
      event.preventDefault();
      selectValue(activeIndex === filtered.length ? value.trim() : filtered[activeIndex]);
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
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(className, "pr-9", invalid && "border-red-500")}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
      </div>

      {open && !disabled && rowCount > 0 && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-purple-300/30 bg-[#1a1a2e] p-1 shadow-lg"
        >
          {filtered.map((option, index) => {
            const isActive = index === activeIndex;
            const selected = option.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectValue(option)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none",
                  isActive ? "bg-purple-400/40" : "hover:bg-purple-400/30",
                )}
              >
                <span className="truncate">{option}</span>
                {selected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}

          {showAddRow && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectValue(value.trim())}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-purple-200 outline-none",
                activeIndex === filtered.length ? "bg-purple-400/40" : "hover:bg-purple-400/30",
              )}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">Use &ldquo;{value.trim()}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
