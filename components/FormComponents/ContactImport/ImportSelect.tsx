import { useAtomValue } from "jotai";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";

export interface ImportSelectOption {
  value: string;
  label: string;
}

export interface ImportSelectGroup {
  label: string;
  options: ImportSelectOption[];
}

interface ImportSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Listed first, outside any group. */
  options?: ImportSelectOption[];
  groups?: ImportSelectGroup[];
  /** A dashed border, for a choice that means "nothing", like Don't import. */
  dashed?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}

const ITEM_CLASS =
  "hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white";

export const ImportSelect = ({
  id,
  value,
  onChange,
  options = [],
  groups = [],
  dashed,
  invalid,
  className,
  "aria-label": ariaLabel,
}: ImportSelectProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full cursor-pointer bg-white/5 border-purple-300/30 text-white",
          dashed && "border-dashed text-white/70",
          invalid && "ring-1 ring-red-500",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        // Portals to <body>, so it needs its own layer to stay above the fixed app bar.
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className="bg-[#1a1a2e] border-purple-300/30 max-h-[320px] overflow-y-auto"
        position="popper"
        sideOffset={4}
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
            {option.label}
          </SelectItem>
        ))}
        {groups.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel
              className={`pt-2 text-[11px] font-semibold uppercase tracking-wider ${
                isLight ? "text-purple-700" : "text-purple-300"
              }`}
            >
              {group.label}
            </SelectLabel>
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ImportSelect;
