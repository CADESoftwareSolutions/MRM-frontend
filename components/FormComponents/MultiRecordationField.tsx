import { useAtom } from "jotai";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountyCombobox } from "./CountyCombobox";
import { STATES } from "@/config/directoryConfig";
import { themeAtom } from "@/atoms/NavigationAtom";
import type { StateCountyReference } from "@/hooks/useStateCountyReference";
import { Z_INDEX } from "@/lib/zIndex";

export interface RecordationEntry {
  id: string;
  county: string;
  state: string;
  volume?: string;
  page?: string;
  instrumentId?: string;
  recordingDate?: string;
}

interface MultiRecordationFieldProps {
  value: RecordationEntry[];
  onChange: (entries: RecordationEntry[]) => void;
  /** Same reference data Basic Information's State/County pair uses, so recordation entries
   * get the identical validated county list instead of a free-text field. */
  stateCountyReference: StateCountyReference[];
}

const newEntry = (): RecordationEntry => ({
  id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  county: "",
  state: "",
});

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

export const MultiRecordationField = ({
  value,
  onChange,
  stateCountyReference,
}: MultiRecordationFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  const update = (id: string, patch: Partial<RecordationEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const countiesForState = (state: string) =>
    stateCountyReference.find((s) => s.code === state)?.counties ?? [];

  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-purple-300/20 rounded-xl p-4 bg-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
              Recordation #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              className="p-1.5 rounded transition-colors cursor-pointer text-red-400/60 hover:text-red-300 hover:bg-red-500/20"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>State</label>
              <Select
                value={entry.state || undefined}
                onValueChange={(state) => {
                  // A county belonging to the old state wouldn't necessarily exist in the
                  // new one — same reset Basic Information's State/County pair does.
                  if (state !== entry.state) update(entry.id, { state, county: "" });
                }}
              >
                <SelectTrigger
                  style={{ width: "100%" }}
                  className={`${inputCls} cursor-pointer data-[placeholder]:text-white/70`}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent
                  style={{ zIndex: Z_INDEX.modalDropdown }}
                  className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
                  position="popper"
                  sideOffset={4}
                >
                  {STATES.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelCls}>County</label>
              <CountyCombobox
                value={entry.county}
                onChange={(county) => update(entry.id, { county })}
                counties={countiesForState(entry.state)}
                disabled={!entry.state}
                placeholder={entry.state ? "Select county" : "Select state first"}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Volume</label>
              <input
                type="text"
                value={entry.volume ?? ""}
                onChange={(e) => update(entry.id, { volume: e.target.value })}
                placeholder="Volume"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Page</label>
              <input
                type="text"
                value={entry.page ?? ""}
                onChange={(e) => update(entry.id, { page: e.target.value })}
                placeholder="Page"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Instrument/Document ID</label>
              <input
                type="text"
                value={entry.instrumentId ?? ""}
                onChange={(e) => update(entry.id, { instrumentId: e.target.value })}
                placeholder="Instrument ID"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Recording Date</label>
              <DatePicker
                value={entry.recordingDate ?? ""}
                onChange={(recordingDate) => update(entry.id, { recordingDate })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, newEntry()])}
        className={`cursor-pointer ${
          isLight
            ? "border-purple-600 text-purple-600 hover:bg-purple-50"
            : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20"
        }`}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Recordation
      </Button>
    </div>
  );
};
