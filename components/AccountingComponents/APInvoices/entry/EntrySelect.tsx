import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";

// Radix Select reserves "" for "nothing selected", so "None" needs its own value.
const NONE = "__none__";

interface EntrySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Adds a "None" choice that maps to "". */
  noneLabel?: string;
  placeholder?: string;
  invalid?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const ITEM_CLASS =
  "hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white";

export const EntrySelect = ({
  id,
  value,
  onChange,
  options,
  noneLabel,
  placeholder = "Select",
  invalid,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: EntrySelectProps) => (
  <Select
    value={value || (noneLabel ? NONE : undefined)}
    onValueChange={(next) => onChange(next === NONE ? "" : next)}
  >
    <SelectTrigger
      id={id}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy}
      style={{ width: "100%" }}
      className={cn(
        "bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer data-[placeholder]:text-white/70",
        invalid && "ring-1 ring-red-500",
      )}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      style={{ zIndex: Z_INDEX.modalDropdown }}
      className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
      position="popper"
      sideOffset={4}
    >
      {noneLabel && (
        <SelectItem value={NONE} className={ITEM_CLASS}>
          {noneLabel}
        </SelectItem>
      )}
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default EntrySelect;
