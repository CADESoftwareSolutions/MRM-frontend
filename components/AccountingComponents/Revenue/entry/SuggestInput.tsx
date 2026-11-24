import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";
import { useEntryTheme } from "./entryTheme";

export interface SuggestOption {
  value: string;
  /** Muted text on the right, e.g. the label's mapped account. */
  hint?: string;
}

interface SuggestInputProps {
  value: string;
  onCommit: (value: string) => void;
  options: SuggestOption[];
  /** Applied to whatever is committed, and used to spot an exact match. Defaults to trimming. */
  normalize?: (value: string) => string;
  /** Text after "Use “…”" on the row for a value that isn't in the list. */
  newValueNote?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

type Row = { kind: "option"; option: SuggestOption } | { kind: "new"; value: string };

const MAX_ROWS = 60;

/** Free-text field with a list of known values: pick one, or type a new value and leave the
 * field. Commits on pick, Enter or blur. The list portals to <body> so a scrolling grid can't
 * clip it. */
export const SuggestInput = ({
  value,
  onCommit,
  options,
  normalize = (v) => v.trim(),
  newValueNote,
  placeholder,
  disabled = false,
  invalid,
  autoFocus,
  className,
  id,
  "aria-label": ariaLabel,
}: SuggestInputProps) => {
  const theme = useEntryTheme();
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [arrowed, setArrowed] = useState(false);

  const query = text ?? "";
  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle ? options.filter((o) => o.value.toLowerCase().includes(needle)) : options;
    const typed = normalize(query);
    const typedKey = typed.toLowerCase();
    const exactOption = typed ? options.find((o) => normalize(o.value).toLowerCase() === typedKey) : undefined;
    const ordered = exactOption ? [exactOption, ...matches.filter((o) => o !== exactOption)] : matches;
    const optionRows: Row[] = ordered.slice(0, MAX_ROWS).map((option) => ({ kind: "option", option }));
    return typed && !exactOption ? [{ kind: "new", value: typed }, ...optionRows] : optionRows;
  }, [options, query, normalize]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const commitValue = (next: string) => {
    const typed = normalize(next);
    const known = typed ? options.find((o) => normalize(o.value).toLowerCase() === typed.toLowerCase()) : undefined;
    const clean = known ? normalize(known.value) : typed;
    if (clean !== value) onCommit(clean);
  };

  const pick = (row: Row) => {
    commitValue(row.kind === "new" ? row.value : row.option.value);
    setText(null);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
      setArrowed(true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      setArrowed(true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = arrowed ? rows[activeIndex] : normalize(query) ? rows[0] : undefined;
      if (open && row) pick(row);
      else if (text !== null) {
        commitValue(text);
        setText(null);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const typedValue = normalize(query);
  const optionId = (index: number) => `${listId}-opt-${index}`;

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
            aria-activedescendant={open && rows[activeIndex] ? optionId(activeIndex) : undefined}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            autoComplete="off"
            autoFocus={autoFocus}
            value={text ?? value}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => {
              setText(value);
              setActiveIndex(0);
              setArrowed(false);
              setOpen(true);
            }}
            onChange={(event) => {
              setText(event.target.value);
              setActiveIndex(0);
              setArrowed(false);
              if (!open) setOpen(true);
            }}
            onBlur={() => {
              if (text !== null) commitValue(text);
              setText(null);
              setOpen(false);
            }}
            onKeyDown={handleKeyDown}
            className={cn(className, "pr-7", invalid && "ring-1 ring-red-500")}
          />
          <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-white/60" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        id={listId}
        role="listbox"
        aria-label={ariaLabel ? `${ariaLabel} options` : "Options"}
        align="start"
        collisionPadding={8}
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={cn(
          "w-[max(var(--radix-popover-trigger-width),16rem)] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-md p-1",
          theme.popoverText,
          rows.length === 0 && "hidden",
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        onMouseDown={(event) => event.preventDefault()}
      >
        <div ref={listRef}>
          {rows.map((row, index) => {
            const isActive = index === activeIndex;
            const key = row.kind === "new" ? "__new__" : row.option.value;
            const selected = row.kind === "option" && normalize(row.option.value) === (typedValue || value);
            return (
              <button
                key={key}
                id={optionId(index)}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selected}
                data-active={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(row)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                  isActive && theme.optionActive,
                )}
              >
                {row.kind === "new" ? (
                  <>
                    <Plus className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      Use &ldquo;{row.value}&rdquo;
                      {newValueNote && <span className={cn("ml-1.5 text-xs", theme.popoverMuted)}>{newValueNote}</span>}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate">{row.option.value}</span>
                    {row.option.hint && (
                      <span className={cn("shrink-0 text-[11px] tabular-nums", theme.popoverMuted)}>{row.option.hint}</span>
                    )}
                    <Check className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SuggestInput;
