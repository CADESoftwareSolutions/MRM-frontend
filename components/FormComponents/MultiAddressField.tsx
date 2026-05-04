import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Plus, X } from "lucide-react";
import { STATES } from "@/config/directoryConfig";

const ADDRESS_TYPES = [
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
  _partyAddressId?: number;
}

interface MultiAddressFieldProps {
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

const inputCls = "bg-white/5 border-purple-300/30 text-white h-9 placeholder:text-white/30";
const labelCls = "text-purple-100 font-semibold text-sm mb-1.5 block";

export const MultiAddressField = ({
  value,
  onChange,
  showValidation = false,
}: MultiAddressFieldProps) => {
  const [activeType, setActiveType] = useState("Physical");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep activeType in sync if the active entry gets removed
  useEffect(() => {
    if (!value.find((a) => a.type === activeType)) {
      setActiveType(value[0]?.type ?? "Physical");
    }
  }, [value, activeType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const usedTypes = new Set(value.map((a) => a.type));
  const availableTypes = ADDRESS_TYPES.filter((t) => !usedTypes.has(t));
  const activeEntry = value.find((a) => a.type === activeType);

  const update = (field: keyof AddressEntry, val: string) => {
    onChange(
      value.map((a) => (a.type === activeType ? { ...a, [field]: val } : a))
    );
  };

  const addType = (type: string) => {
    onChange([...value, emptyAddress(type)]);
    setActiveType(type);
    setShowMenu(false);
  };

  const removeType = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((a) => a.type !== type));
    if (activeType === type) setActiveType("Physical");
  };

  const isPhysical = activeType === "Physical";
  const physicalEntry = value.find((a) => a.type === "Physical");
  const physicalInvalid =
    showValidation &&
    isPhysical &&
    (!physicalEntry?.address || !physicalEntry?.city || !physicalEntry?.state);

  return (
    <div className="space-y-3">
      {/* Pill row */}
      <div className="flex flex-wrap items-center gap-2">
        {value.map((addr) => (
          <button
            key={addr.type}
            type="button"
            onClick={() => setActiveType(addr.type)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all border cursor-pointer ${
              activeType === addr.type
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-white/5 text-purple-200 border-purple-300/20 hover:bg-white/10"
            }`}
          >
            {addr.type}
            {addr.type !== "Physical" && (
              <X
                className="w-3 h-3 opacity-60 hover:opacity-100 hover:text-red-300 cursor-pointer"
                onClick={(e) => removeType(addr.type, e)}
              />
            )}
          </button>
        ))}

        {availableTypes.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((s) => !s)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-purple-300 border border-dashed border-purple-300/30 hover:border-purple-400/50 hover:text-purple-200 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add
              <ChevronDown className="w-3 h-3" />
            </button>
            {showMenu && (
              <div className="absolute top-full left-0 mt-1.5 bg-[#1a1a2e] border border-purple-300/30 rounded-lg py-1 z-50 shadow-xl min-w-[140px]">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addType(t)}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active address form */}
      {activeEntry && (
        <div className="rounded-lg bg-white/5 border border-purple-300/20 p-4 space-y-3">
          <div>
            <Label className={labelCls}>
              Address
              {isPhysical && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <Input
              value={activeEntry.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Street address"
              className={`${inputCls} ${physicalInvalid && !activeEntry.address ? "border-red-500" : ""}`}
            />
          </div>

          <div>
            <Label className={labelCls}>Address Line 2</Label>
            <Input
              value={activeEntry.addressLine2}
              onChange={(e) => update("addressLine2", e.target.value)}
              placeholder="Apt, suite, unit, etc."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>
                City
                {isPhysical && <span className="text-red-400 ml-1">*</span>}
              </Label>
              <Input
                value={activeEntry.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="City"
                className={`${inputCls} ${physicalInvalid && !activeEntry.city ? "border-red-500" : ""}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className={labelCls}>
                  State
                  {isPhysical && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Select
                  value={activeEntry.state || undefined}
                  onValueChange={(v) => update("state", v)}
                >
                  <SelectTrigger
                    className={`bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer data-[placeholder]:text-white/30 ${physicalInvalid && !activeEntry.state ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-[#1a1a2e] border-purple-300/30 max-h-[260px] overflow-y-auto z-50"
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
              </div>
              <div>
                <Label className={labelCls}>Zip</Label>
                <Input
                  value={activeEntry.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  placeholder="12345"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {physicalInvalid && (
            <p className="text-red-400 text-xs">
              Physical address, city, and state are required.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
