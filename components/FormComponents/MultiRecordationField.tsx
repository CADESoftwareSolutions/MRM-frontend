import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { themeAtom } from "@/atoms/NavigationAtom";
import type { StateCountyReference } from "@/hooks/useStateCountyReference";

export interface RecordationEntry {
  id: string;
  county: string;
  state: string;
  book?: string;
  volume?: string;
  page?: string;
  instrumentId?: string;
  recordingDate?: string;
}

interface MultiRecordationFieldProps {
  value: RecordationEntry[];
  onChange: (entries: RecordationEntry[]) => void;
  /** Same reference data Basic Information's State/County pair uses — looked up here only to
   * show the full state name ("Oregon"), not the abbreviation, next to the read-only field below. */
  stateCountyReference: StateCountyReference[];
  /** The parent Lease/Deed/Well's own current State/County (Basic Information tab) — the only
   * source of a recordation's State/County now. Shown here as a small read-only line and kept in
   * sync on every entry (new and already-added) whenever Basic Information changes, rather than
   * being independently editable per entry — recordation rows aren't shared with anything else,
   * so there's no downside to always overwriting them to match. */
  defaultState?: string;
  defaultCounty?: string;
  /** Fires with the current "New Recordation" draft every time it changes — lets the parent
   * auto-commit it (as if "Add Recordation" had been clicked) if the user fills some of it in
   * but saves the Lease/Deed/Well itself without explicitly clicking Add Recordation first. */
  onDraftChange?: (draft: DraftRecordation) => void;
}

// No state/county here — they're never part of what the user types into the draft anymore (see
// MultiRecordationFieldProps.defaultState/defaultCounty above), only injected at commit time.
export type DraftRecordation = Omit<RecordationEntry, "id" | "state" | "county">;

const emptyDraft = (): DraftRecordation => ({});

/** True once any field in the draft holds something — the signal a parent uses to decide
 * whether an unsaved draft is worth auto-committing before its own save goes through. State/
 * county deliberately don't count: they're always populated from Basic Information, not user
 * intent, so their presence alone shouldn't trigger an auto-commit of an otherwise-blank draft. */
export const hasRecordationDraftContent = (draft: DraftRecordation): boolean =>
  Boolean(draft.book || draft.volume || draft.page || draft.instrumentId || draft.recordingDate);

/** Turns a draft into a real RecordationEntry (same id shape "Add Recordation" itself uses),
 * stamping in the parent's current State/County — shared so a parent auto-committing an
 * untouched-but-filled-in draft at save time produces an entry indistinguishable from one the
 * user added by clicking the button. */
export const buildCommittedRecordation = (
  draft: DraftRecordation,
  state: string,
  county: string,
): RecordationEntry => ({
  ...draft,
  state,
  county,
  id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
});

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

export const MultiRecordationField = ({
  value,
  onChange,
  stateCountyReference,
  defaultState = "",
  defaultCounty = "",
  onDraftChange,
}: MultiRecordationFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  // Always-present, like LegalDescriptionForm's add card — no separate "Add Recordation"
  // trigger button to reveal it. Unlike a legal description, a recordation has no backend
  // entity of its own to create immediately: "Add Recordation" just appends this draft to
  // `value` (the real save happens when the parent Lease/Deed/Well form saves), so the button
  // reads "Add Recordation" rather than "Save".
  const [draft, setDraft] = useState<DraftRecordation>(emptyDraft);

  useEffect(() => {
    onDraftChange?.(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Keep every already-added entry's State/County in sync with Basic Information too, not just
  // new ones — recordation rows aren't shared with anything else, so there's no risk in always
  // overwriting them, and it's what makes "set once in Basic Information" actually true instead
  // of only applying going forward.
  useEffect(() => {
    if (value.length === 0) return;
    const needsSync = value.some((e) => e.state !== defaultState || e.county !== defaultCounty);
    if (needsSync) onChange(value.map((e) => ({ ...e, state: defaultState, county: defaultCounty })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultState, defaultCounty]);

  // Full name for the read-only State line below ("Oregon", not "OR").
  const stateName = useMemo(
    () => stateCountyReference.find((s) => s.code === defaultState)?.name || defaultState || "—",
    [stateCountyReference, defaultState],
  );

  const update = (id: string, patch: Partial<RecordationEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const addDraft = () => {
    onChange([...value, buildCommittedRecordation(draft, defaultState, defaultCounty)]);
    setDraft(emptyDraft());
  };

  const renderFields = (
    entry: DraftRecordation,
    onUpdate: (patch: Partial<RecordationEntry>) => void,
  ) => (
    <div className="space-y-2">
      {/* Read-only — State/County is set once on Basic Information and just reflected here. */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>State</label>
          <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{stateName}</p>
        </div>
        <div>
          <label className={labelCls}>County</label>
          <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{defaultCounty || "—"}</p>
        </div>
      </div>

      {/* Below that: Book/Volume/Page on the left, Instrument #/Recording Date on the right —
          one grid (not two independently-stacked columns) so rows always line up by their
          tallest cell regardless of any control being a different height (e.g. DatePicker vs a
          plain input); two flex columns with different gap sizes would drift out of alignment
          row by row instead. The blank cell after Instrument # is what creates "space in
          between" it and Recording Date, by pushing Recording Date down one full grid row. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <label className={labelCls}>Book</label>
          <input
            type="text"
            value={entry.book ?? ""}
            onChange={(e) => onUpdate({ book: e.target.value })}
            placeholder="Book"
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
          <label className={labelCls}>Volume</label>
          <input
            type="text"
            value={entry.volume ?? ""}
            onChange={(e) => onUpdate({ volume: e.target.value })}
            placeholder="Volume"
            className={inputCls}
          />
        </div>

        <div aria-hidden="true" />

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
          <label className={labelCls}>Recording Date</label>
          <DatePicker
            value={entry.recordingDate ?? ""}
            onChange={(recordingDate) => onUpdate({ recordingDate })}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Always present, before the saved list — same order as LegalDescriptionForm's add card. */}
      <div className="border border-purple-300/20 rounded-xl p-3 bg-white/5 space-y-2">
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
          className="border border-purple-300/20 rounded-xl p-3 bg-white/5"
        >
          <div className="flex items-center justify-between mb-2">
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
