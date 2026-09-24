import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, X } from "lucide-react";

const PHONE_TYPES = ["Home", "Business", "Cell", "Fax", "Other"];

export interface PhoneEntry {
  type: string;
  number: string;
  _phoneId?: number;
  _partyPhoneId?: number;
}

interface MultiPhoneFieldProps {
  value: PhoneEntry[];
  onChange: (phones: PhoneEntry[]) => void;
}

const emptyPhone = (type: string): PhoneEntry => ({ type, number: "" });

const inputCls = "bg-white/5 border-purple-300/30 text-white h-9 placeholder:text-white/30";
const labelCls = "text-purple-100 font-semibold text-sm mb-1.5 block";

export const MultiPhoneField = ({ value, onChange }: MultiPhoneFieldProps) => {
  const [activeType, setActiveType] = useState("Home");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep activeType in sync if the active entry gets removed
  useEffect(() => {
    if (!value.find((p) => p.type === activeType)) {
      setActiveType(value[0]?.type ?? "Home");
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

  const usedTypes = new Set(value.map((p) => p.type));
  const availableTypes = PHONE_TYPES.filter((t) => !usedTypes.has(t));
  const activeEntry = value.find((p) => p.type === activeType);

  const update = (val: string) => {
    onChange(
      value.map((p) => (p.type === activeType ? { ...p, number: val } : p))
    );
  };

  const addType = (type: string) => {
    onChange([...value, emptyPhone(type)]);
    setActiveType(type);
    setShowMenu(false);
  };

  const removeType = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((p) => p.type !== type));
    if (activeType === type) setActiveType("Home");
  };

  return (
    <div className="space-y-3">
      {/* Pill row */}
      <div className="flex flex-wrap items-center gap-2">
        {value.map((phone) => (
          <button
            key={phone.type}
            type="button"
            onClick={() => setActiveType(phone.type)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all border cursor-pointer ${
              activeType === phone.type
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-white/5 text-purple-200 border-purple-300/20 hover:bg-white/10"
            }`}
          >
            {phone.type}
            {phone.type !== "Home" && (
              <X
                className="w-3 h-3 opacity-60 hover:opacity-100 hover:text-red-300 cursor-pointer"
                onClick={(e) => removeType(phone.type, e)}
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

      {/* Active phone number */}
      {activeEntry && (
        <div className="rounded-lg bg-white/5 border border-purple-300/20 p-4">
          <Label className={labelCls}>Phone Number</Label>
          <Input
            type="tel"
            value={activeEntry.number}
            onChange={(e) => update(e.target.value)}
            placeholder="(555) 555-5555"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
};
