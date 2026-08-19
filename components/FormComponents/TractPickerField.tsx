import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";
import { TractFormModal } from "../modals/TractFormModal";

// The single source of truth for "what fields does a tract have" — matches FETCH_TRACTS
// (src/graphql/Tracts.ts) and TractInput on the BE. src/hooks/useTracts.ts builds its
// read (transformTract) and write (buildTractInput) shapes from this instead of each
// hand-listing the same ~15 field names, so a field rename here is a compile error at both
// call sites instead of something that can silently drift out of sync.
export interface TractFields {
  tractNo?: string | null;
  tractLabel?: string | null;
  stateCode: string;
  countyName: string;
  tractType?: string | null;
  upi?: string | null;
  subSurvey?: string | null;
  legalDescription?: string | null;
  lotNo?: string | null;
  blockNo?: string | null;
  township?: string | null;
  surveyTownship?: string | null;
  section?: string | null;
  range?: string | null;
  abstract?: string | null;
  survey?: string | null;
  quarterCalls?: string | null;
  grossAcres?: number | null;
  netAcres?: number | null;
}

// A tract as the lease/deed pickers see it: TractFields plus its id. Optional fields stay
// optional since callers/tests may pass a bare id + display fields without the rest.
export interface TractOption extends TractFields {
  id: number;
}

export interface TractLinkEntry {
  tractId: number;
  sortOrder: number | null;
  grossAcres: number | null;
  netAcres: number | null;
  tractName?: string;
}

interface TractPickerFieldProps {
  availableTracts: TractOption[];
  value: TractLinkEntry[];
  onChange: (entries: TractLinkEntry[]) => void;
  accountId: number;
}

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";

// Tract has no single "name" column — build a display label from whatever identifying fields are set.
export const tractDisplayLabel = (tract: { id: number; tractNo?: string | null; tractLabel?: string | null; stateCode?: string | null; countyName?: string | null }): string =>
  tract.tractNo ||
  tract.tractLabel ||
  [tract.countyName, tract.stateCode].filter(Boolean).join(", ") ||
  `Tract #${tract.id}`;

// Shared between useLeases.ts and useDeeds.ts: both bind a lease/deed to tracts through an
// identically-shaped join row (tractId, sortOrder, grossAcres, netAcres, tract).
export const transformTractLinks = (tractLinks: any[]): TractLinkEntry[] =>
  (tractLinks || []).map((tractLink) => ({
    tractId: Number(tractLink.tractId),
    sortOrder: tractLink.sortOrder ?? null,
    grossAcres: tractLink.grossAcres ?? null,
    netAcres: tractLink.netAcres ?? null,
    tractName: tractLink.tract ? tractDisplayLabel(tractLink.tract) : undefined,
  }));

export const buildTractLinkInputs = (tractLinks: TractLinkEntry[]) =>
  tractLinks.map((tractLink) => ({
    tractId: Number(tractLink.tractId),
    sortOrder: tractLink.sortOrder ? Number(tractLink.sortOrder) : null,
    grossAcres: tractLink.grossAcres ? Number(tractLink.grossAcres) : null,
    netAcres: tractLink.netAcres ? Number(tractLink.netAcres) : null,
  }));

// A freshly-picked tract's id and a reloaded lease's tractId can come from different GraphQL
// responses (Tract.id may serialize as a string in one and a number in the other), so a
// strict === can silently never match after a save/reload. Routing every id through here
// before comparing/storing/keying-by-id is the one place that guards against that.
const toTractId = (id: unknown): number => Number(id);

const filterTracts = (tracts: TractOption[], query: string, excludeIds: Set<number>) => {
  const available = tracts.filter((tract) => !excludeIds.has(toTractId(tract.id)));
  const lower = query.trim().toLowerCase();
  if (!lower) return available.slice(0, 25);
  return available
    .filter((tract) =>
      [tract.tractNo, tract.tractLabel, tract.stateCode, tract.countyName].some((field) =>
        field?.toLowerCase().includes(lower),
      ),
    )
    .slice(0, 25);
};

const numberOrNull = (raw: string): number | null => (raw === "" ? null : Number(raw));

export const TractPickerField = ({ availableTracts, value, onChange, accountId }: TractPickerFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // "add" opens a blank tract; "edit" opens tractModal.tract's full record — either way the
  // lease/deed form stays open underneath, per the modal's whole reason for existing.
  const [tractModal, setTractModal] = useState<{ mode: "add" | "edit"; tract?: TractOption } | null>(null);

  const linkedIds = useMemo(() => new Set(value.map((entry) => toTractId(entry.tractId))), [value]);
  const filteredTracts = useMemo(
    () => filterTracts(availableTracts, query, linkedIds),
    [availableTracts, query, linkedIds],
  );
  // Keyed lookup instead of an availableTracts.find(...) per linked row per render — this
  // component re-renders on every keystroke elsewhere in the lease/deed form (react-hook-form
  // watches the whole form), so a per-row linear scan adds up with more than a couple tracts.
  const tractsById = useMemo(
    () => new Map(availableTracts.map((tract) => [toTractId(tract.id), tract])),
    [availableTracts],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const addTract = (tract: TractOption) => {
    onChange([
      ...value,
      { tractId: toTractId(tract.id), tractName: tractDisplayLabel(tract), grossAcres: null, netAcres: null, sortOrder: value.length },
    ]);
    setQuery("");
    setOpen(false);
  };

  const updateEntry = (tractId: number, patch: Partial<TractLinkEntry>) => {
    onChange(value.map((entry) => (entry.tractId === tractId ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (tractId: number) => onChange(value.filter((entry) => entry.tractId !== tractId));

  return (
    <div className="space-y-4">
      <div ref={rootRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search tracts by number, state, or county"
            className={`${inputCls} pl-9`}
          />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-purple-300/30 bg-[#1a1a2e] p-1 shadow-lg">
            {filteredTracts.length === 0 ? (
              <div className="px-2 py-2 text-sm text-white/60">No tracts found</div>
            ) : (
              filteredTracts.map((tract) => (
                <button
                  key={tract.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTract(tract)}
                  className="flex w-full cursor-pointer flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none hover:bg-purple-400/30"
                >
                  <span>{tractDisplayLabel(tract)}</span>
                  <span className="text-xs text-white/50">
                    {[tract.countyName, tract.stateCode].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border border-purple-300/20 rounded-xl overflow-hidden bg-white/5">
        {value.length === 0 ? (
          <p className="text-center text-xs text-purple-300/40 py-6">No tracts linked yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-300/20">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Tract
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Gross Acres
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Net Acres
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Sort Order
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {value.map((entry) => {
                const fullTract = tractsById.get(toTractId(entry.tractId));
                return (
                  <tr key={entry.tractId} className="border-b last:border-0 border-purple-300/10">
                    <td className={`px-3 py-2 ${isLight ? "text-gray-800" : "text-white"}`}>
                      {entry.tractName || `Tract #${entry.tractId}`}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.grossAcres ?? ""}
                        onChange={(e) => updateEntry(entry.tractId, { grossAcres: numberOrNull(e.target.value) })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.netAcres ?? ""}
                        onChange={(e) => updateEntry(entry.tractId, { netAcres: numberOrNull(e.target.value) })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.sortOrder ?? ""}
                        onChange={(e) => updateEntry(entry.tractId, { sortOrder: numberOrNull(e.target.value) })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!fullTract}
                          onClick={() => fullTract && setTractModal({ mode: "edit", tract: fullTract })}
                          title={fullTract ? "View / edit tract" : undefined}
                          className={`p-1.5 rounded-md transition-colors ${
                            fullTract ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                          } ${
                            isLight
                              ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.tractId)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                              : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
                          }`}
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex justify-end p-3 border-t border-purple-300/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTractModal({ mode: "add" })}
            className={`cursor-pointer ${
              isLight
                ? "border-purple-600 text-purple-600 hover:bg-purple-50"
                : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Tract
          </Button>
        </div>
      </div>

      {tractModal && (
        <TractFormModal
          mode={tractModal.mode}
          accountId={accountId}
          initialData={tractModal.tract ?? undefined}
          onClose={() => setTractModal(null)}
          onSaved={(tract: Record<string, any>) => {
            // id must be spread-assigned last: tract already carries its own (possibly
            // unnormalized) id, and an object literal's later keys win — putting the
            // coercion first would get silently overwritten by ...tract's raw id.
            const saved = { ...tract, id: toTractId(tract.id) } as TractOption;
            if (tractModal.mode === "add") {
              addTract(saved);
            } else {
              updateEntry(saved.id, { tractName: tractDisplayLabel(saved) });
            }
          }}
        />
      )}
    </div>
  );
};

export default TractPickerField;
