import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATES } from "@/config/directoryConfig";

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
}: MultiRecordationFieldProps) => {
  const update = (id: string, patch: Partial<RecordationEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

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
              <label className={labelCls}>County</label>
              <input
                type="text"
                value={entry.county}
                onChange={(e) => update(entry.id, { county: e.target.value })}
                placeholder="County"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>State</label>
              <select
                value={entry.state}
                onChange={(e) => update(entry.id, { state: e.target.value })}
                className="w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="" className="bg-[#1a1a2e]">Select state</option>
                {STATES.map((s) => (
                  <option key={s} value={s} className="bg-[#1a1a2e]">
                    {s}
                  </option>
                ))}
              </select>
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
              <input
                type="date"
                value={entry.recordingDate ?? ""}
                onChange={(e) => update(entry.id, { recordingDate: e.target.value })}
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
        className="border-purple-300/30 text-purple-600 hover:bg-purple-500/20 hover:text-white cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Recordation
      </Button>
    </div>
  );
};
