import { useAtomValue } from "jotai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";

// Radix Select reserves "" for "nothing chosen", so the "all" choice needs a real value.
const ALL_VALUE = "__all__";

interface FieldSelectProps {
  id: string;
  /** "" means nothing chosen, shown as allLabel when there is one. */
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}

/** A labelled form select (the label sits above it), unlike the list screens' prefixed FilterSelect. */
export const FieldSelect = ({ id, value, onChange, options, allLabel }: FieldSelectProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const choices = allLabel ? [{ value: ALL_VALUE, label: allLabel }, ...options] : options;

  return (
    <Select
      value={value || (allLabel ? ALL_VALUE : "")}
      onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}
    >
      <SelectTrigger
        id={id}
        className={`w-full cursor-pointer ${
          isLight ? "bg-white border-purple-200 text-gray-800" : "bg-white/5 border-purple-300/30 text-white"
        }`}
      >
        <SelectValue placeholder="Choose…" />
      </SelectTrigger>
      <SelectContent
        // Portals to <body>, so it needs its own layer to stay above the fixed app bar.
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={`max-h-[300px] overflow-y-auto ${
          isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
        }`}
        position="popper"
        sideOffset={4}
      >
        {choices.map((option) => (
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

export default FieldSelect;
