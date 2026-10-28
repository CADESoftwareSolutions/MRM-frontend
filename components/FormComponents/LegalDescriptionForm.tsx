import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type ForwardedRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormHandle } from "./Form";
import { TractLegalSummary } from "./TractLegalSummary";
import { Modal, ModalHeader } from "../modals/Modal";
import { themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import tractsConfig from "@/config/tractsConfig";
import { buildTractInput, tractDisplayLabel, TractOption } from "@/hooks/useTracts";
import { useStateCountyReference } from "@/hooks/useStateCountyReference";
import { CREATE_TRACT_MUTATION, UPDATE_TRACT_MUTATION } from "@/graphql/Tracts";
import { executeGraphQL } from "@/lib/api";

interface LegalDescriptionFormProps {
  mode: "add" | "edit";
  accountId: number;
  /** Full tract record (raw FETCH_TRACTS shape) when editing; omitted when adding. */
  initialData?: Record<string, any> | null;
  /** Every tract for this account — checked for a State/County/Block/Section match before
   * create/update so the same legal description never ends up saved as two different Tract rows. */
  availableTracts: TractOption[];
  /** Tracts already linked to this Lease/Deed/Well, so the match popup can tell "already linked
   * here" apart from "exists but not linked yet." */
  linkedTractIds: Set<number>;
  onClose: () => void;
  /** Fires with the saved tract (id + the fields just written) so the caller can update its own
   * linked-tract list without waiting on the ["tracts"] query to refetch. */
  onSaved: (tract: Record<string, any>) => void;
  /** Fires instead of onSaved when the user picks an already-existing matching tract from the
   * duplicate popup rather than creating/updating this one. */
  onLinkExisting: (tract: TractOption) => void;
  /** The parent Lease/Deed/Well's own current State/County (Basic Information tab) — only used
   * in "add" mode, where a brand-new tract has no location of its own yet and inherits the
   * parent's. In "edit" mode the tract's OWN stateCode/countyName (from initialData) is used
   * instead — see the tractState/tractCounty comment below for why. */
  defaultState?: string;
  defaultCounty?: string;
  /** Label of the parent's own Basic Information-equivalent tab, for the "set it there first"
   * error message below — Wells calls that tab "Well Details", not "Basic Information". */
  locationTabLabel?: string;
}

export interface LegalDescriptionFormHandle {
  /** True once any field in this card (Legal Description Type, Block, Section, …) currently
   * holds a value. See Form.tsx's FormHandle.hasAnyValue for why this isn't react-hook-form's
   * isDirty. */
  hasAnyValue: () => boolean;
  /** Triggers the same flow the card's own Save button does. Resolves once fully settled:
   * "empty" (nothing to do, hasAnyValue() was false), "saved" (the Tract was created/updated and
   * linked — onSaved already fired), "duplicate-pending" (a State/County/Block/Section match
   * was found; the duplicate popup is now open and the caller must NOT treat this as saved —
   * nothing is linked until the user resolves it), or "error" (either required-field validation
   * failed — this card's own "Please fill in the required fields" summary is now showing, same
   * as a real Save click would leave it — or the mutation itself failed with saveError showing;
   * either way nothing was linked). */
  trySubmit: () => Promise<"empty" | "saved" | "duplicate-pending" | "error">;
}

// A legal description is still a Tract row under the hood (so it stays reusable/cross-
// referenceable from Leases/Wells and the standalone Tracts screen — see
// useCrossReferences.ts), but the Deed/Lease/Well user authoring one shouldn't have to
// think in terms of "Tracts": this config only exposes tractsConfig's "legal" tab (Cross-
// References is a Tracts-screen concern), and itemName drives Form's own Save button label
// ("Save Legal Description" instead of "Save Tract"). Required-ness on tractsConfig's "legal"
// tab fields (block/section/survey, etc., varying per tractType) mirrors the backend's own
// TRACT_TYPE_REQUIRED_FIELDS and applies here unchanged via react-hook-form's normal validation.
//
// stateCode/countyName are excluded entirely — State/County is set once on the parent Lease/
// Deed/Well's own Basic Information tab and shown here as a plain read-only line (see the JSX
// below), not as editable fields on three different tabs that can drift out of sync with each
// other. The standalone Tracts screen is unaffected — it renders tractsConfig directly, not
// this filtered copy, so stateCode/countyName stay fully editable there.
const legalOnlyFields = tractsConfig.fields.filter(
  (f) => f.tab === "legal" && f.id !== "stateCode" && f.id !== "countyName",
);
// The "LEGAL DESCRIPTION" section header Form.tsx would otherwise print is redundant here —
// this card already has its own "New/Edit Legal Description" label right above it. Cloning
// (rather than mutating) keeps tractsConfig's own field objects — shared with the standalone
// Tracts screen — untouched; hideSectionHeader only needs to be set on one field since it's
// read off the whole section.
const legalOnlyConfig = {
  ...tractsConfig,
  itemName: "Legal Description",
  tabs: tractsConfig.tabs.filter((t) => t.id === "legal"),
  fields: legalOnlyFields.map((f, i) => (i === 0 ? { ...f, hideSectionHeader: true } : f)),
};

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

// State/County/Block/Section is the identity the PM wants enforced — every tractType shows both
// Block and Section somewhere (just paired differently per row), so this key applies regardless
// of which legal description type is selected.
const findMatchingTracts = (
  tracts: TractOption[],
  candidate: Record<string, any>,
  excludeId?: number,
): TractOption[] =>
  tracts.filter((tract) => {
    if (excludeId != null && Number(tract.id) === excludeId) return false;
    return (
      normalize(tract.stateCode) === normalize(candidate.stateCode) &&
      normalize(tract.countyName) === normalize(candidate.countyName) &&
      normalize(tract.blockNo) === normalize(candidate.blockNo) &&
      normalize(tract.section) === normalize(candidate.section)
    );
  });

// Inline card — same rendering pattern as MultiRecordationField's entries, not a popup modal —
// since the underlying Tract still needs a real id before it can be linked via tractLinks
// (see useCrossReferences.ts's tract_join), Save here still creates/updates that Tract row
// immediately rather than deferring to the parent Lease/Deed/Well's own save.
const LegalDescriptionFormImpl = (
  {
    mode,
    accountId,
    initialData,
    availableTracts,
    linkedTractIds,
    onClose,
    onSaved,
    onLinkExisting,
    defaultState,
    defaultCounty,
    locationTabLabel = "Basic Information",
  }: LegalDescriptionFormProps,
  ref: ForwardedRef<LegalDescriptionFormHandle>,
) => {
  const queryClient = useQueryClient();
  const showToast = useSetAtom(showToastAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const { data: stateCountyReference = [] } = useStateCountyReference();
  const [saveError, setSaveError] = useState<string | null>(null);
  // Set only when Save finds an existing State/County/Block/Section match — blocks the actual
  // create/update until the user either picks one of these or goes back to change the fields.
  const [pendingMatch, setPendingMatch] = useState<{ matches: TractOption[] } | null>(null);
  const innerFormRef = useRef<FormHandle>(null);
  // Mirrors handleSave's outcome synchronously (state wouldn't be readable yet by the time
  // trySubmit's await below resolves — see the comment on trySubmit).
  const outcomeRef = useRef<"saved" | "duplicate-pending" | "error" | null>(null);

  // A Tract is a shared entity — the same one can be linked to other Leases/Deeds/Wells besides
  // whichever one this card was opened from (see useCrossReferences.ts). Editing one here is
  // only ever meant to touch its legal-description details, never relocate it, so edit mode
  // keeps the tract's OWN stateCode/countyName (from initialData) instead of overwriting it with
  // whatever the CURRENTLY-VIEWED parent's Basic Information happens to say right now — that
  // would otherwise silently move a tract shared with some other Deed/Lease/Well every time this
  // one's county was edited. A brand-new tract (add mode) has no location of its own yet, so it
  // inherits the parent's current one, same as before.
  const tractState = mode === "edit" ? (initialData?.stateCode || defaultState) : defaultState;
  const tractCounty = mode === "edit" ? (initialData?.countyName || defaultCounty) : defaultCounty;

  // Full name for the read-only State line below ("Oregon", not "OR") — same reference data
  // Basic Information's own State field already uses.
  const stateName = useMemo(
    () => stateCountyReference.find((s) => s.code === tractState)?.name || tractState || "—",
    [stateCountyReference, tractState],
  );

  const persist = async (formData: Record<string, any>): Promise<boolean> => {
    try {
      // stateCode/countyName aren't form fields anymore (see legalOnlyFields above) — add mode
      // takes the parent's current location (tractState/tractCounty above); edit mode keeps the
      // tract's own, regardless of what formData or the parent's Basic Information says.
      const tract = { ...buildTractInput(formData), stateCode: tractState || null, countyName: tractCounty || null };
      let id = initialData?.id;
      if (mode === "add") {
        const result = await executeGraphQL(CREATE_TRACT_MUTATION, { accountId, tract });
        id = result.createTract.tract.id;
      } else {
        await executeGraphQL(UPDATE_TRACT_MUTATION, { id: Number(id), tract });
      }
      onSaved({ id, ...tract });
      onClose();
      // Only on create — editing an existing legal description is already visible changing
      // in place, so it doesn't need the same "something just happened" nudge a brand-new one does.
      if (mode === "add") {
        const savedLabel = tractDisplayLabel({
          id,
          tractNo: tract.tractNo != null ? String(tract.tractNo) : null,
          tractLabel: tract.tractLabel != null ? String(tract.tractLabel) : null,
          stateCode: tract.stateCode,
          countyName: tract.countyName,
        });
        showToast(`"${savedLabel}" added as a tract`);
      }
      // Not awaited: the caller already has everything it needs from onSaved above, so the
      // card shouldn't sit open waiting on a full tract-list refetch just to close itself.
      queryClient.invalidateQueries({ queryKey: ["tracts"] });
      return true;
    } catch (err) {
      setSaveError((err as Error).message);
      return false;
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    // stateCode/countyName are required on every tract type (tractsConfig.ts), but they're not
    // fields in this form (see legalOnlyFields above) — react-hook-form's own required check
    // never runs on them, so that has to happen here instead, against whichever value will
    // actually be persisted (tractState/tractCounty — the parent's current location in add
    // mode, the tract's own in edit mode).
    if (!tractState || !tractCounty) {
      setSaveError(`Set State and County on the ${locationTabLabel} tab before adding a legal description.`);
      outcomeRef.current = "error";
      return;
    }
    const excludeId = mode === "edit" && initialData?.id != null ? Number(initialData.id) : undefined;
    const matches = findMatchingTracts(
      availableTracts,
      { ...formData, stateCode: tractState, countyName: tractCounty },
      excludeId,
    );
    if (matches.length > 0) {
      setPendingMatch({ matches });
      outcomeRef.current = "duplicate-pending";
      return;
    }
    const ok = await persist(formData);
    outcomeRef.current = ok ? "saved" : "error";
  };

  useImperativeHandle(ref, () => ({
    hasAnyValue: () => innerFormRef.current?.hasAnyValue() ?? false,
    trySubmit: async () => {
      if (!innerFormRef.current?.hasAnyValue()) return "empty";
      outcomeRef.current = null;
      // Form's submit() runs validation then awaits handleSave above to completion, resolving
      // to false if validation failed — in that case handleSave above never ran (its own
      // "Please fill in the required fields" summary is showing instead), so outcomeRef is
      // still null and must NOT fall through to the "saved" default below.
      const valid = await innerFormRef.current.submit();
      if (!valid) return "error";
      // Both of handleSave's branches set outcomeRef before returning, so there's no race
      // reading it right after a valid submit resolves.
      return outcomeRef.current ?? "saved";
    },
  }));

  return (
    <div className="border border-purple-300/20 rounded-xl p-4 bg-white/5 space-y-2">
      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
        {mode === "add" ? "New Legal Description" : "Edit Legal Description"}
      </span>

      {/* Read-only — State/County is set once on Basic Information and just reflected here,
          never independently edited from this card. */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-purple-200 mb-1">State</label>
          <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{stateName}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-purple-200 mb-1">County</label>
          <p className={`text-sm ${isLight ? "text-gray-800" : "text-white"}`}>{tractCounty || "—"}</p>
        </div>
      </div>

      <Form
        ref={innerFormRef}
        config={legalOnlyConfig}
        initialData={initialData ?? undefined}
        onSave={handleSave}
        onCancel={onClose}
        mode={mode}
        saveError={saveError}
        onClearSaveError={() => setSaveError(null)}
        bare
        compactActions
      />

      {pendingMatch && (
        <Modal
          onClose={() => setPendingMatch(null)}
          portal
          isLight={isLight}
          maxWidthClassName="max-w-lg"
        >
          <ModalHeader
            title="Matching Tract Found"
            icon={<MapPin className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
            onClose={() => setPendingMatch(null)}
            isLight={isLight}
          />
          <div className="p-6 space-y-4">
            <p className={`text-sm ${isLight ? "text-gray-700" : "text-purple-200"}`}>
              {pendingMatch.matches.length === 1
                ? "A tract already exists"
                : `${pendingMatch.matches.length} tracts already exist`}{" "}
              with this same State, County, Block, and Section. To avoid a duplicate, add the
              existing one instead:
            </p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {pendingMatch.matches.map((match) => {
                const alreadyLinked = linkedTractIds.has(Number(match.id));
                return (
                  <div
                    key={match.id}
                    className={`rounded-lg border p-3 space-y-3 ${
                      isLight ? "border-purple-200 bg-purple-50" : "border-purple-300/20 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isLight ? "text-gray-800" : "text-white"}`}>
                        {tractDisplayLabel(match)}
                      </p>
                      {alreadyLinked ? (
                        <span className={`text-xs ${isLight ? "text-gray-500" : "text-purple-300/60"}`}>
                          Already linked
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            onLinkExisting(match);
                            setPendingMatch(null);
                            onClose();
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                    <TractLegalSummary tract={match} isLight={isLight} columns={2} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingMatch(null)}
                className={
                  isLight
                    ? "border-purple-600 text-purple-600 hover:bg-purple-50 cursor-pointer"
                    : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                }
              >
                Go back and edit
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const LegalDescriptionForm = forwardRef(LegalDescriptionFormImpl);

export default LegalDescriptionForm;
