import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PHONE_TYPES = ["Home", "Business", "Cell", "Fax", "Other"];

export interface PhoneEntry {
  type: string;
  number: string;
  _phoneId?: number;
  _partyPhoneId?: number;
}

interface SinglePhoneFieldProps {
  value: PhoneEntry[];
  onChange: (phones: PhoneEntry[]) => void;
}

export const SinglePhoneField = ({ value, onChange }: SinglePhoneFieldProps) => {
  const entry = value[0] ?? { type: "Home", number: "" };

  const set = (patch: Partial<PhoneEntry>) => {
    onChange([{ ...entry, ...patch }]);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-purple-100 font-semibold text-sm">Phone Number</Label>
      <div className="flex gap-2">
        <Select value={entry.type} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="w-28 shrink-0 bg-white/5 border-purple-300/30 text-white h-9 cursor-pointer text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-purple-300/30 z-50">
            {PHONE_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-white hover:bg-purple-400/30 focus:bg-purple-400/40 cursor-pointer">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={entry.number}
          onChange={(e) => set({ number: e.target.value })}
          placeholder="(555) 555-5555"
          className="bg-white/5 border-purple-300/30 text-white h-9 placeholder:text-white/30 flex-1"
        />
      </div>
    </div>
  );
};
