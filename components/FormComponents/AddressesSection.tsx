import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { STATES } from "@/config/directoryConfig";

export const ADDRESS_TYPES = [
  "Physical",
  "Mailing",
  "1099",
  "JIB",
  "Revenue",
  "Payment",
  "Correspondence",
];

export interface AddressEntry {
  type: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  _addressId?: number;
}

interface AddressesSectionProps {
  value: AddressEntry[];
  onChange: (addresses: AddressEntry[]) => void;
  showValidation?: boolean;
}

const emptyAddress = (type: string): AddressEntry => ({
  type,
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
});

const commonInput = "bg-white/5 border-purple-300/30 text-white h-9 placeholder:text-white/30";
const labelClass = "text-purple-100 font-semibold text-sm mb-2 block";

export const AddressesSection = ({
  value,
  onChange,
  showValidation = false,
}: AddressesSectionProps) => {
  const update = (index: number, field: keyof AddressEntry, val: string) => {
    onChange(value.map((a, i) => (i === index ? { ...a, [field]: val } : a)));
  };

  const addAddress = () => {
    const used = new Set(value.map((a) => a.type));
    const next = ADDRESS_TYPES.find((t) => !used.has(t));
    if (next) onChange([...value, emptyAddress(next)]);
  };

  const removeAddress = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const availableTypesFor = (currentIndex: number) => {
    const used = new Set(
      value.map((a, i) => (i !== currentIndex ? a.type : null))
    );
    return ADDRESS_TYPES.filter((t) => !used.has(t));
  };

  return (
    <div className="space-y-6">
      {value.map((addr, index) => {
        const isPhysical = addr.type === "Physical";
        const missingAddress = showValidation && isPhysical && !addr.address;
        const missingCity = showValidation && isPhysical && !addr.city;
        const missingState = showValidation && isPhysical && !addr.state;

        return (
          <div key={index}>
            {index > 0 && (
              <div className="border-t border-purple-300/20 mb-6" />
            )}

            {/* Address type header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isPhysical ? (
                  <span className="text-sm font-semibold text-purple-100 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full">
                    Physical
                    <span className="text-red-400 ml-1">*</span>
                  </span>
                ) : (
                  <Select
                    value={addr.type}
                    onValueChange={(v) => update(index, "type", v)}
                  >
                    <SelectTrigger className="w-48 bg-white/5 border-purple-300/30 text-white h-8 text-sm cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-300/30 z-50">
                      {availableTypesFor(index).map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="text-white hover:bg-purple-400/30 focus:bg-purple-400/40 cursor-pointer"
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {!isPhysical && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAddress(index)}
                  className="text-red-300 hover:text-red-100 hover:bg-red-500/20 cursor-pointer h-8 px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <Label className={labelClass}>
                  Address{isPhysical && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Input
                  value={addr.address}
                  onChange={(e) => update(index, "address", e.target.value)}
                  placeholder="Street address"
                  className={`${commonInput} ${missingAddress ? "border-red-500" : ""}`}
                />
                {missingAddress && (
                  <p className="text-red-400 text-xs mt-1">Address is required</p>
                )}
              </div>

              <div className="col-span-2">
                <Label className={labelClass}>Address Line 2</Label>
                <Input
                  value={addr.addressLine2}
                  onChange={(e) => update(index, "addressLine2", e.target.value)}
                  placeholder="Apt, suite, unit, etc."
                  className={commonInput}
                />
              </div>

              <div>
                <Label className={labelClass}>
                  City{isPhysical && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Input
                  value={addr.city}
                  onChange={(e) => update(index, "city", e.target.value)}
                  placeholder="City"
                  className={`${commonInput} ${missingCity ? "border-red-500" : ""}`}
                />
                {missingCity && (
                  <p className="text-red-400 text-xs mt-1">City is required</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={labelClass}>
                    State{isPhysical && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  <Select
                    value={addr.state}
                    onValueChange={(v) => update(index, "state", v)}
                  >
                    <SelectTrigger
                      className={`bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer data-[placeholder]:text-white/30 ${missingState ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto z-50"
                      position="popper"
                      sideOffset={4}
                    >
                      {STATES.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="text-white hover:bg-purple-400/30 focus:bg-purple-400/40 cursor-pointer"
                        >
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {missingState && (
                    <p className="text-red-400 text-xs mt-1">State is required</p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Zip</Label>
                  <Input
                    value={addr.zip}
                    onChange={(e) => update(index, "zip", e.target.value)}
                    placeholder="12345"
                    className={commonInput}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {value.length < ADDRESS_TYPES.length && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAddress}
          className="border-purple-300/30 text-purple-200 hover:bg-purple-500/20 cursor-pointer mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Address
        </Button>
      )}
    </div>
  );
};
