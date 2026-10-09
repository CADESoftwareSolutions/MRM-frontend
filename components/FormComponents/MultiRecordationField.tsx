import { useState } from "react";
import { useAtom } from "jotai";
import { Trash2 } from "lucide-react";
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
import { STATES } from "@/config/contactsConfig";
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

type DraftRecordation = Omit<RecordationEntry, "id">;

const emptyDraft = (): DraftRecordation => ({ county: "", state: "" });

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
  // Always-present, like LegalDescriptionForm's add card — no separate "Add Recordation"
  // trigger button to reveal it. Unlike a legal description, a recordation has no backend
  // entity of its own to create immediately: "Add Recordation" just appends this draft to
  // `value` (the real save happens when the parent Lease/Deed/Well form saves), so the button
  // reads "Add Recordation" rather than "Save".
  const [draft, setDraft] = useState<DraftRecordation>(emptyDraft());

  const update = (id: string, patch: Partial<RecordationEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const countiesForState = (state: string) =>
    stateCountyReference.find((s) => s.code === state)?.counties ?? [];

  const addDraft = () => {
    onChange([
      ...value,
      { ...draft, id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
    setDraft(emptyDraft());
  };

  const renderFields = (
    entry: DraftRecordation,
    onUpdate: (patch: Partial<RecordationEntry>) => void,
  ) => (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className={labelCls}>State</label>
        <Select
          value={entry.state || undefined}
          onValueChange={(state) => {
            // A county belonging to the old state wouldn't necessarily exist in the
            // new one — same reset Basic Information's State/County pair does.
            if (state !== entry.state) onUpdate({ state, county: "" });
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
          onChange={(county) => onUpdate({ county })}
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
          onChange={(e) => onUpdate({ volume: e.target.value })}
          placeholder="Volume"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Page</label>
        <input
          type="text"
          value={entry.page ?? ""}
          onChange={(e) => onUpdate({ page: e.target.value })}
          placeholder="Page"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Instrument/Document ID</label>
        <input
          type="text"
          value={entry.instrumentId ?? ""}
          onChange={(e) => onUpdate({ instrumentId: e.target.value })}
          placeholder="Instrument ID"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Recording Date</label>
        <DatePicker
          value={entry.recordingDate ?? ""}
          onChange={(recordingDate) => onUpdate({ recordingDate })}
          className={inputCls}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Always present, before the saved list — same order as LegalDescriptionForm's add card. */}
      <div className="border border-purple-300/20 rounded-xl p-4 bg-white/5 space-y-2">
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
          New Recordation
        </span>
        {renderFields(draft, (patch) => setDraft((d) => ({ ...d, ...patch })))}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraft(emptyDraft())}
            className="border-purple-300/30 text-purple-600 hover:bg-purple-500/20 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={addDraft}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
          >
            Add Recordation
          </Button>
        </div>
      </div>

      {value.length > 0 && <div className="border-t border-purple-300/20" />}

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
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isLight
                  ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                  : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
              }`}
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {renderFields(entry, (patch) => update(entry.id, patch))}
        </div>
      ))}
    </div>
  );
};
