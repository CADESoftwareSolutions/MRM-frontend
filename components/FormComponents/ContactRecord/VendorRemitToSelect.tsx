import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndex";
import type { AddressEntry } from "../MultiAddressField";
import { resolveRemitToType } from "./vendorInfo";

interface VendorRemitToSelectProps {
  /** The stored preference, e.g. "Payment". */
  value: unknown;
  onChange: (type: string) => void;
  onBlur: () => void;
  invalid: boolean;
  /** The contact's addresses as currently edited on Name & Address. */
  addresses: AddressEntry[];
}

/** Picks which of the contact's addresses checks go to. Shows the address the preference
 * resolves to, so removing that address on Name & Address falls back to Payment, Mailing, then
 * Physical. */
export const VendorRemitToSelect = ({ value, onChange, onBlur, invalid, addresses }: VendorRemitToSelectProps) => {
  const choices = React.useMemo(() => {
    const seen = new Set<string>();
    return addresses.flatMap((entry) => {
      if (!entry.type || seen.has(entry.type)) return [];
      seen.add(entry.type);
      const line1 = entry.address.trim();
      return [{ type: entry.type, label: line1 ? `${entry.type} · ${line1}` : entry.type }];
    });
  }, [addresses]);

  const effective = resolveRemitToType(
    typeof value === "string" ? value : null,
    choices.map((choice) => choice.type),
  );

  return (
    <>
      <Select
        value={effective || undefined}
        onValueChange={(next) => {
          if (next !== value) onChange(next);
        }}
        onOpenChange={(open) => {
          if (!open) onBlur();
        }}
      >
        <SelectTrigger
          aria-label="Remit-to address"
          style={{ width: "100%" }}
          className={`bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer data-[placeholder]:text-white/70 ${
            invalid ? "ring-1 ring-red-500" : ""
          }`}
        >
          <SelectValue placeholder="Add an address on Name & Address" />
        </SelectTrigger>
        <SelectContent
          style={{ zIndex: Z_INDEX.modalDropdown }}
          className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
          position="popper"
          sideOffset={4}
        >
          {choices.map((choice) => (
            <SelectItem
              key={choice.type}
              value={choice.type}
              className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
            >
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {effective && <p className="form-help-text text-xs mt-1">Uses the address tagged {effective}.</p>}
    </>
  );
};

export default VendorRemitToSelect;
