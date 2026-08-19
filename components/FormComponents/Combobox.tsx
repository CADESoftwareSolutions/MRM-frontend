import * as React from "react";
import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { ComboboxBase } from "./ComboboxBase";

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

// The "add new value" row is a trailing virtual entry (not a sentinel value mixed into the
// options themselves), so a real option can never collide with it.
type Row = { kind: "option"; value: string } | { kind: "add"; value: string };

/** Dropdown that also takes free text — pick a listed option, or type a value that isn't
 * in the list yet and it's used as-is. */
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
  const rows = React.useMemo<Row[]>(() => {
    const query = value.trim().toLowerCase();
    const filtered = query ? options.filter((option) => option.toLowerCase().includes(query)) : options;
    const hasExactMatch = options.some((option) => option.toLowerCase() === value.trim().toLowerCase());
    const showAddRow = value.trim().length > 0 && !hasExactMatch;
    const optionRows: Row[] = filtered.map((option) => ({ kind: "option", value: option }));
    return showAddRow ? [...optionRows, { kind: "add", value: value.trim() }] : optionRows;
  }, [options, value]);

  return (
    <ComboboxBase
      inputValue={value}
      onInputChange={onChange}
      onBlur={onBlur}
      items={rows}
      getKey={(row) => (row.kind === "add" ? "__add__" : row.value)}
      onSelect={(row) => onChange(row.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      invalid={invalid}
      renderItem={(row, isActive, select) => {
        if (row.kind === "add") {
          return (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(row)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-purple-200 outline-none",
                isActive ? "bg-purple-400/40" : "hover:bg-purple-400/30",
              )}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">Use &ldquo;{row.value}&rdquo;</span>
            </button>
          );
        }

        const selected = row.value.toLowerCase() === value.trim().toLowerCase();
        return (
          <button
            type="button"
            role="option"
            aria-selected={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => select(row)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none",
              isActive ? "bg-purple-400/40" : "hover:bg-purple-400/30",
            )}
          >
            <span className="truncate">{row.value}</span>
            {selected && <Check className="size-4 shrink-0" />}
          </button>
        );
      }}
    />
  );
};
