import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";
import { TractFormModal } from "../modals/TractFormModal";
import { TractOption, tractDisplayLabel } from "@/hooks/useTracts";
import { tractsConfig, TRACT_TYPE_OPTIONS } from "@/config/tractsConfig";

export interface TractLinkEntry {
  tractId: number;
  sortOrder: number | null;
  grossAcres: number | null;
  netAcres: number | null;
  quarterCalls: string | null;
  depthRights: string | null;
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
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

// Same fields + dependsOnValue rules as tractsConfig.ts's "legal" tab — read from there instead
// of duplicating the type-to-fields mapping a second time, so a change to what a legal
// description type shows only ever needs to happen in one place. Used to render each linked
// tract's own legal description read-only (it belongs to the Tract record, not this link).
const LEGAL_FIELDS = tractsConfig.fields.filter(
  (f) => f.tab === "legal" && f.section === "legal-description",
);

const TRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRACT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const fieldAppliesToType = (dependsOnValue: any, tractType: string): boolean => {
  const targets = Array.isArray(dependsOnValue) ? dependsOnValue : [dependsOnValue];
  return targets.includes(tractType);
};

// Shared by useLeases.ts/useDeeds.ts/useWells.ts: all three bind their record to tracts
// through an identically-shaped tract_join row (tractId, sortOrder, grossAcres, netAcres,
// quarterCalls, depthRights, tract) — see TractJoin/TractLinkInput on the BE.
export const transformTractLinks = (tractLinks: any[]): TractLinkEntry[] =>
  (tractLinks || []).map((tractLink) => ({
    tractId: Number(tractLink.tractId),
    sortOrder: tractLink.sortOrder ?? null,
    grossAcres: tractLink.grossAcres ?? null,
    netAcres: tractLink.netAcres ?? null,
    quarterCalls: tractLink.quarterCalls ?? null,
    depthRights: tractLink.depthRights ?? null,
    tractName: tractLink.tract ? tractDisplayLabel(tractLink.tract) : undefined,
  }));

// depthRights is accepted by TractLinkInput for every parent type on the BE (TractJoin has no
// per-parent-type variant), even though it mostly matters for Leases — Deed/Well links just
// leave it null if unused rather than this component special-casing which parent it's bound to.
export const buildTractLinkInputs = (tractLinks: TractLinkEntry[]) =>
  tractLinks.map((tractLink, index) => ({
    tractId: Number(tractLink.tractId),
    sortOrder: tractLink.sortOrder ?? index,
    grossAcres: tractLink.grossAcres ? Number(tractLink.grossAcres) : null,
    netAcres: tractLink.netAcres ? Number(tractLink.netAcres) : null,
    quarterCalls: tractLink.quarterCalls || null,
    depthRights: tractLink.depthRights || null,
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
const stringOrNull = (raw: string): string | null => (raw === "" ? null : raw);

export const TractPickerField = ({ availableTracts, value, onChange, accountId }: TractPickerFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // "add" opens a blank tract; "edit" opens tractModal.tract's full record — either way the
  // lease/deed/well form stays open underneath, per the modal's whole reason for existing.
  const [tractModal, setTractModal] = useState<{ mode: "add" | "edit"; tract?: TractOption } | null>(null);

  const linkedIds = useMemo(() => new Set(value.map((entry) => toTractId(entry.tractId))), [value]);
  const filteredTracts = useMemo(
    () => filterTracts(availableTracts, query, linkedIds),
    [availableTracts, query, linkedIds],
  );
  // Keyed lookup instead of an availableTracts.find(...) per linked row per render — this
  // component re-renders on every keystroke elsewhere in the lease/deed/well form (react-hook-form
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
      {
        tractId: toTractId(tract.id),
        tractName: tractDisplayLabel(tract),
        grossAcres: null,
        netAcres: null,
        quarterCalls: null,
        depthRights: null,
        sortOrder: value.length,
      },
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

      {value.length === 0 ? (
        <p className="text-center text-xs text-purple-300/40 py-6 border border-dashed border-purple-300/30 rounded-xl">
          No tracts linked yet.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((entry) => {
            const fullTract = tractsById.get(toTractId(entry.tractId));
            const visibleLegalFields = fullTract
              ? LEGAL_FIELDS.filter((f) => fieldAppliesToType(f.dependsOnValue, fullTract.tractType || ""))
              : [];

            return (
              <div key={entry.tractId} className="border border-purple-300/20 rounded-xl p-4 bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isLight ? "text-gray-800" : "text-white"}`}>
                    {entry.tractName || `Tract #${entry.tractId}`}
                  </span>
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
                </div>

                {/* Read-only: this is the Tract's own legal description — edit it via the
                    pencil icon above (opens TractFormModal), not here. */}
                <div className="border-t border-purple-300/10 pt-3">
                  <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-2">
                    Legal Description
                  </h4>
                  {!fullTract ? (
                    <p className="text-xs text-purple-300/50">Tract details unavailable.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Legal Description Type</label>
                        <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>
                          {TRACT_TYPE_LABELS[fullTract.tractType ?? ""] || fullTract.tractType || "—"}
                        </p>
                      </div>
                      {visibleLegalFields.map((field) =>
                        field.type === "textarea" ? (
                          <div key={field.id} className="col-span-3">
                            <label className={labelCls}>{field.label}</label>
                            <p className={`text-sm whitespace-pre-wrap ${isLight ? "text-gray-800" : "text-white"}`}>
                              {(fullTract as any)[field.id] || "—"}
                            </p>
                          </div>
                        ) : (
                          <div key={field.id}>
                            <label className={labelCls}>{field.label}</label>
                            <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>
                              {(fullTract as any)[field.id] || "—"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Editable: per-link overrides (tract_join's own columns), independent of the
                    Tract row above. */}
                <div className="border-t border-purple-300/10 pt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Gross Acres</label>
                    <input
                      type="number"
                      value={entry.grossAcres ?? ""}
                      onChange={(e) => updateEntry(entry.tractId, { grossAcres: numberOrNull(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Net Acres</label>
                    <input
                      type="number"
                      value={entry.netAcres ?? ""}
                      onChange={(e) => updateEntry(entry.tractId, { netAcres: numberOrNull(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Quarter Calls</label>
                    <input
                      type="text"
                      value={entry.quarterCalls ?? ""}
                      onChange={(e) => updateEntry(entry.tractId, { quarterCalls: stringOrNull(e.target.value) })}
                      placeholder="e.g. NE/4"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Depth Rights</label>
                    <input
                      type="text"
                      value={entry.depthRights ?? ""}
                      onChange={(e) => updateEntry(entry.tractId, { depthRights: stringOrNull(e.target.value) })}
                      placeholder="e.g. All depths"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sort Order</label>
                    <input
                      type="number"
                      value={entry.sortOrder ?? ""}
                      onChange={(e) => updateEntry(entry.tractId, { sortOrder: numberOrNull(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
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
