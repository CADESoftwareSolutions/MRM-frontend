import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

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

const inputCls = "bg-white/5 border-purple-300/30 text-white h-9 placeholder:text-white/30 flex-1";

export const MultiPhoneField = ({ value, onChange }: MultiPhoneFieldProps) => {
  const usedTypes = new Set(value.map((p) => p.type));
  const availableTypes = PHONE_TYPES.filter((t) => !usedTypes.has(t));

  const update = (index: number, field: keyof PhoneEntry, val: string) => {
    onChange(value.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  };

  const add = () => {
    const nextType = availableTypes[0] ?? "Other";
    onChange([...value, { type: nextType, number: "" }]);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const typesFor = (index: number) => {
    const used = new Set(value.map((p, i) => (i !== index ? p.type : null)));
    return PHONE_TYPES.filter((t) => !used.has(t));
  };

  return (
    <div className="space-y-2">
      {value.map((phone, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select
            value={phone.type}
            onValueChange={(v) => update(index, "type", v)}
          >
            <SelectTrigger className="w-32 shrink-0 bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-purple-300/30 z-50">
              {typesFor(index).map((t) => (
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

          <Input
            type="tel"
            value={phone.number}
            onChange={(e) => update(index, "number", e.target.value)}
            placeholder="(555) 555-5555"
            className={inputCls}
          />

          <button
            type="button"
            onClick={() => remove(index)}
            className="shrink-0 p-1.5 text-purple-300/50 hover:text-red-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {availableTypes.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="border-purple-300/30 text-purple-300 hover:bg-purple-500/20 cursor-pointer h-8 text-xs mt-1"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Phone
        </Button>
      )}
    </div>
  );
};
