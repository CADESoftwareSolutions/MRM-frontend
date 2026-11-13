import { useAtomValue } from "jotai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";

// Radix Select won't take "" as an item value (it's reserved for clearing back to the
// placeholder), so the "all" choice needs a real one.
const ALL_VALUE = "__all__";

interface FilterSelectProps {
  /** "" means unfiltered, shown as allLabel. */
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
  /** Prefix for the selected value, e.g. "Vendor" → "Vendor: Lone Star Wireline Inc.". */
  prefix: string;
  className?: string;
}

export const FilterSelect = ({ value, onChange, allLabel, options, prefix, className = "w-40" }: FilterSelectProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const selected = options.find((option) => option.value === value);

  return (
    <Select value={value || ALL_VALUE} onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}>
      <SelectTrigger
        aria-label={prefix}
        className={`${className} shrink-0 cursor-pointer ${
          isLight ? "bg-white border-purple-200 text-gray-800" : "bg-white/5 border-purple-300/30 text-white"
        }`}
      >
        <SelectValue>
          <span className="truncate">{selected ? `${prefix}: ${selected.label}` : allLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        // Portals to <body>, so it needs its own layer to stay above the fixed app bar if it
        // flips open upward.
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={`max-h-[300px] overflow-y-auto ${
          isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
        }`}
        position="popper"
        sideOffset={4}
      >
        {[{ value: ALL_VALUE, label: allLabel }, ...options].map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={`cursor-pointer ${
              isLight
                ? "text-gray-800"
                : "text-white hover:bg-purple-400/30 focus:bg-purple-400/30 data-[highlighted]:bg-purple-400/30"
            }`}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FilterSelect;
