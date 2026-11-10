import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ForwardedRef } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { AddNewButton } from "./AddNewButton";
import { LegalDescriptionForm, LegalDescriptionFormHandle } from "./LegalDescriptionForm";
import { TractLegalSummary } from "./TractLegalSummary";
import { keyLegalValues } from "./legalDescriptionFields";
import { LinkTractDocumentsModal } from "../modals/LinkTractDocumentsModal";
import { useAddFormToggle } from "@/hooks/useAddFormToggle";
import { TractOption, tractDisplayLabel } from "@/hooks/useTracts";
import { CrossReferenceEntityType, TractDocument, documentsSharingTract } from "@/hooks/useCrossReferences";

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
  /** The Lease/Deed/Well this picker belongs to; entityId is null until it's first saved. */
  entityType: CrossReferenceEntityType;
  entityId?: number | null;
  /** The parent Lease/Deed/Well's own current State/County (Basic Information tab) — forwarded
   * straight through to LegalDescriptionForm, which shows it as a small read-only line rather
   * than letting it be independently edited per legal description. */
  defaultState?: string;
  defaultCounty?: string;
  /** Forwarded to LegalDescriptionForm — see its own prop doc. Wells passes "Well Details". */
  locationTabLabel?: string;
}

// Same shape as the thing it wraps — hasAnyValue/trySubmit check BOTH the "add" card and, if the
// pencil icon is open on an existing entry, that "edit" card too (see useImperativeHandle below),
// so a parent force-submitting this handle never misses whichever one actually has unsaved
// content. Each card is unmounted while closed, so a closed one reports nothing pending.
export type TractPickerFieldHandle = LegalDescriptionFormHandle;

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

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

const TractPickerFieldImpl = (
  {
    availableTracts,
    value,
    onChange,
    accountId,
    entityType,
    entityId,
    defaultState,
    defaultCounty,
    locationTabLabel,
  }: TractPickerFieldProps,
  ref: ForwardedRef<TractPickerFieldHandle>,
) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const queryClient = useQueryClient();
  // An existing tract waiting on the link popup. `replacing` is the tract an edit card was open
  // on when its duplicate-match popup picked this one instead.
  const [pendingLink, setPendingLink] = useState<{
    tract: TractOption;
    replacing: number | null;
    documents: TractDocument[];
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // The pencil icon on an existing entry replaces that card with the edit form in place.
  const [editingTract, setEditingTract] = useState<TractOption | null>(null);
  // Cards loaded with the record start collapsed to their header row; these are the open ones —
  // toggled by the user, or linked since the form opened (see linkTract).
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const toggleExpanded = (tractId: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tractId)) next.delete(tractId);
      else next.add(tractId);
      return next;
    });
  const hasEntries = value.length > 0;
  const addForm = useAddFormToggle(hasEntries);
  // Bumping this remounts the add card blank — the only way to clear it while it stays showing
  // (nothing linked yet), since Form.tsx has no imperative reset.
  const [addFormKey, setAddFormKey] = useState(0);
  const closeAddForm = () => {
    addForm.close();
    setAddFormKey((k) => k + 1);
  };
  const addFormRef = useRef<LegalDescriptionFormHandle>(null);
  // Ref onto whichever LegalDescriptionForm the pencil icon currently has open (null the rest
  // of the time — React nulls a ref automatically when the component it's attached to
  // unmounts, which happens whenever editingTract closes or switches to a different entry).
  const editFormRef = useRef<LegalDescriptionFormHandle>(null);

  useImperativeHandle(ref, () => ({
    hasAnyValue: () =>
      (editFormRef.current?.hasAnyValue() ?? false) || (addFormRef.current?.hasAnyValue() ?? false),
    trySubmit: async () => {
      // Check the edit card first: it represents changes to an EXISTING tract, so losing those
      // silently would be worse than losing an unstarted "add new" draft. Abort immediately on
      // a failure there (don't let the add card's own outcome below mask it) — but a
      // successful edit-save still falls through to check the add card too, in case the user
      // had both open with content at once; neither should get silently skipped.
      if (editFormRef.current?.hasAnyValue()) {
        const editOutcome = await editFormRef.current.trySubmit();
        if (editOutcome === "duplicate-pending" || editOutcome === "error") return editOutcome;
      }
      if (!addFormRef.current?.hasAnyValue()) return "empty";
      return addFormRef.current.trySubmit();
    },
  }));

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

  // `replacing`: drop that tract's link in favour of this one — set when an edit card's
  // duplicate-match popup picked an existing tract instead of saving the one being edited.
  // Every other link (search box, add card) means the user's done adding for now.
  const linkTract = (tract: TractOption, replacing: number | null) => {
    const tractId = toTractId(tract.id);
    onChange([
      ...value.filter((entry) => entry.tractId !== replacing),
      {
        tractId,
        tractName: tractDisplayLabel(tract),
        grossAcres: null,
        netAcres: null,
        quarterCalls: null,
        depthRights: null,
        sortOrder: value.length,
      },
    ]);
    // Every way of linking a tract ends up here; its card opens so the acreage can be filled in.
    setExpandedIds((prev) => new Set(prev).add(tractId));
    if (replacing === null) {
      // The add card closes itself after its own save/link, which runs right after this. Any
      // other link (the search box) closes it only if it's empty, and otherwise keeps it open
      // even though this link means it would no longer show by default, so a draft isn't lost.
      if (addFormRef.current?.hasAnyValue()) addForm.open();
      else closeAddForm();
    }
  };

  // An existing tract may already be in other records' Legal Descriptions, and linking it
  // cross-references this record with all of them — show which ones before it's linked.
  const linkExistingTract = (tract: TractOption, replacing: number | null) => {
    const documents = documentsSharingTract(tract, { entityType, entityId }, queryClient);
    if (documents.length > 0) setPendingLink({ tract, replacing, documents });
    else linkTract(tract, replacing);
  };

  const updateEntry = (tractId: number, patch: Partial<TractLinkEntry>) => {
    onChange(value.map((entry) => (entry.tractId === tractId ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (tractId: number) => onChange(value.filter((entry) => entry.tractId !== tractId));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
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
                    onClick={() => {
                      linkExistingTract(tract, null);
                      setQuery("");
                      setOpen(false);
                    }}
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

        {addForm.showAddButton && (
          <AddNewButton label="Add New Legal Description" onClick={addForm.open} />
        )}
      </div>

      {hasEntries && (
        <div className="space-y-3">
          {value.map((entry) => {
            // Being edited below instead of shown as a static card.
            if (editingTract && toTractId(editingTract.id) === entry.tractId) {
              return (
                <LegalDescriptionForm
                  ref={editFormRef}
                  key={entry.tractId}
                  mode="edit"
                  accountId={accountId}
                  initialData={editingTract}
                  availableTracts={availableTracts}
                  linkedTractIds={linkedIds}
                  defaultState={defaultState}
                  defaultCounty={defaultCounty}
                  locationTabLabel={locationTabLabel}
                  onClose={() => setEditingTract(null)}
                  onSaved={(tract) => {
                    const saved = { ...tract, id: toTractId(tract.id) } as TractOption;
                    updateEntry(saved.id, { tractName: tractDisplayLabel(saved) });
                  }}
                  onLinkExisting={(matched) => {
                    linkExistingTract({ ...matched, id: toTractId(matched.id) }, entry.tractId);
                    setEditingTract(null);
                  }}
                />
              );
            }

            const fullTract = tractsById.get(toTractId(entry.tractId));
            const expanded = expandedIds.has(entry.tractId);
            const keyValues = fullTract ? keyLegalValues(fullTract) : [];
            const name = entry.tractName || `Tract #${entry.tractId}`;
            const dividerCls = `h-6 w-px shrink-0 ${isLight ? "bg-purple-300" : "bg-purple-300/40"}`;

            return (
              <div
                key={entry.tractId}
                className={`rounded-xl border ${isLight ? "border-purple-300 bg-white" : "border-purple-400/40 bg-white/5"}`}
              >
                {/* The whole row toggles. The chevron button is its keyboard/screen-reader handle
                    and has no onClick of its own: its clicks (Enter/Space included) bubble up to
                    this one, while pencil and trash stop theirs. */}
                <div
                  onClick={() => toggleExpanded(entry.tractId)}
                  className={`flex cursor-pointer select-none items-center gap-3 py-2.5 pl-3 pr-3 transition-colors ${
                    expanded ? "rounded-t-xl" : "rounded-xl"
                  } ${
                    isLight
                      ? "bg-gradient-to-r from-purple-100 to-purple-50/40 hover:bg-purple-100/60"
                      : "bg-gradient-to-r from-violet-500/20 to-white/[0.03] hover:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={`${name} details`}
                    className="shrink-0 rounded p-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-purple-300 transition-transform ${expanded ? "rotate-90" : ""}`}
                    />
                  </button>
                  {/* Each value's divider sits in the gap to its left, so the one starting a
                      wrapped line falls outside this box and overflow-hidden clips it. */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-9 gap-y-1 overflow-hidden">
                    <span title={name} className="min-w-0 max-w-full truncate text-sm font-semibold text-purple-200">
                      {name}
                    </span>
                    {keyValues.map(({ id, label, value }) => (
                      <span key={id} className="relative flex min-w-0 max-w-full items-baseline gap-1.5">
                        <span className={`absolute -left-4.5 top-1/2 -translate-y-1/2 ${dividerCls}`} />
                        <span className="shrink-0 text-xs uppercase tracking-wide text-purple-300/70">
                          {label}
                        </span>
                        <span title={value} className="truncate text-lg font-semibold text-white">
                          {value}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`mr-1 ${dividerCls}`} />
                    <button
                      type="button"
                      disabled={!fullTract}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fullTract) setEditingTract(fullTract);
                      }}
                      title={fullTract ? "Edit legal description" : undefined}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry(entry.tractId);
                      }}
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

                {/* One shared divider for the whole card body (read-only Legal Description +
                    editable per-link overrides) instead of two, so there's one less border/
                    padding gap to scroll past per linked entry. */}
                {expanded && (
                  <div className="mx-6 mb-4 border-t border-purple-300/10 pt-3 space-y-3">
                    {/* Read-only: this is the Tract's own legal description — edit it via the
                        pencil icon above (opens the inline LegalDescriptionForm), not here. */}
                    <div>
                      <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-2">
                        Legal Description
                      </h4>
                      {!fullTract ? (
                        <p className="text-xs text-purple-300/50">Tract details unavailable.</p>
                      ) : (
                        <TractLegalSummary tract={fullTract} isLight={isLight} />
                      )}
                    </div>

                    {/* Editable: per-link overrides (tract_join's own columns), independent of the
                        Tract row above. */}
                    <div className="grid grid-cols-3 gap-3">
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
                        <label className={labelCls}>Deep Rights</label>
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {addForm.showDivider && <div className="border-t border-purple-300/20" />}

      {addForm.showForm && (
        <div ref={addForm.anchorRef} className="scroll-mt-20 scroll-mb-6">
          <LegalDescriptionForm
            ref={addFormRef}
            key={addFormKey}
            mode="add"
            accountId={accountId}
            availableTracts={availableTracts}
            linkedTractIds={linkedIds}
            defaultState={defaultState}
            defaultCounty={defaultCounty}
            locationTabLabel={locationTabLabel}
            onClose={closeAddForm}
            onSaved={(tract: Record<string, any>) => {
              // id must be spread-assigned last: tract already carries its own (possibly
              // unnormalized) id, and an object literal's later keys win — putting the
              // coercion first would get silently overwritten by ...tract's raw id.
              linkTract({ ...tract, id: toTractId(tract.id) } as TractOption, null);
            }}
            onLinkExisting={(matched) => linkExistingTract({ ...matched, id: toTractId(matched.id) }, null)}
          />
        </div>
      )}

      {!hasEntries && (
        <p className="text-center text-xs text-purple-300/50">No legal descriptions linked yet.</p>
      )}

      {pendingLink && (
        <LinkTractDocumentsModal
          tract={pendingLink.tract}
          documents={pendingLink.documents}
          entityType={entityType}
          isLight={isLight}
          onCancel={() => setPendingLink(null)}
          onConfirm={() => {
            linkTract(pendingLink.tract, pendingLink.replacing);
            setPendingLink(null);
          }}
        />
      )}
    </div>
  );
};

export const TractPickerField = forwardRef(TractPickerFieldImpl);

export default TractPickerField;
