import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Search, Trash2 } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";

export interface TractOption {
  id: number;
  tractNo?: string | null;
  tractLabel?: string | null;
  stateCode: string;
  countyName: string;
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
}

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

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

const filterTracts = (tracts: TractOption[], query: string, excludeIds: Set<number>) => {
  const available = tracts.filter((tract) => !excludeIds.has(tract.id));
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

export const TractPickerField = ({ availableTracts, value, onChange }: TractPickerFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const linkedIds = useMemo(() => new Set(value.map((entry) => entry.tractId)), [value]);
  const filteredTracts = useMemo(
    () => filterTracts(availableTracts, query, linkedIds),
    [availableTracts, query, linkedIds],
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
      { tractId: tract.id, tractName: tractDisplayLabel(tract), grossAcres: null, netAcres: null, sortOrder: value.length },
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
        <label className={labelCls}>Add Tract</label>
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

      {value.length === 0 ? (
        <p className="text-center text-xs text-purple-300/40 py-2">No tracts linked yet.</p>
      ) : (
        <div className="border border-purple-300/20 rounded-xl overflow-hidden bg-white/5">
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
              {value.map((entry) => (
                <tr key={entry.tractId} className="border-b last:border-0 border-purple-300/10">
                  <td className="px-3 py-2 text-white">
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
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.tractId)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isLight
                          ? "text-red-500 hover:text-red-700 hover:bg-red-100"
                          : "text-red-300 hover:text-red-200 hover:bg-red-500/20"
                      }`}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TractPickerField;
