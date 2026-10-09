import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Form from "./Form";
import { TractLegalSummary } from "./TractLegalSummary";
import { Modal, ModalHeader } from "../modals/Modal";
import { themeAtom } from "@/atoms/NavigationAtom";
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
}

// A legal description is still a Tract row under the hood (so it stays reusable/cross-
// referenceable from Leases/Wells and the standalone Tracts screen — see
// useSharedTractReferences.ts), but the Deed/Lease/Well user authoring one shouldn't have to
// think in terms of "Tracts": this config only exposes tractsConfig's "legal" tab (Cross-
// References is a Tracts-screen concern), and itemName drives Form's own Save button label
// ("Save Legal Description" instead of "Save Tract"). Nothing in tractsConfig's "legal" tab is
// required (see tractsConfig.ts), so that's true here too without needing to override anything.
const legalOnlyFields = tractsConfig.fields.filter((f) => f.tab === "legal");
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
// (see useSharedTractReferences.ts's tract_join), Save here still creates/updates that Tract row
// immediately rather than deferring to the parent Lease/Deed/Well's own save.
export const LegalDescriptionForm = ({
  mode,
  accountId,
  initialData,
  availableTracts,
  linkedTractIds,
  onClose,
  onSaved,
  onLinkExisting,
}: LegalDescriptionFormProps) => {
  const queryClient = useQueryClient();
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const { data: stateCountyReference = [] } = useStateCountyReference();
  const [saveError, setSaveError] = useState<string | null>(null);
  // Set only when Save finds an existing State/County/Block/Section match — blocks the actual
  // create/update until the user either picks one of these or goes back to change the fields.
  const [pendingMatch, setPendingMatch] = useState<{ matches: TractOption[] } | null>(null);

  const dynamicOptions = useMemo(
    () =>
      stateCountyReference.length
        ? {
            stateCode: stateCountyReference.map((state) => ({
              value: state.code,
              label: state.name,
            })),
          }
        : {},
    [stateCountyReference],
  );

  const persist = async (formData: Record<string, any>) => {
    try {
      const tract = buildTractInput(formData);
      let id = initialData?.id;
      if (mode === "add") {
        const result = await executeGraphQL(CREATE_TRACT_MUTATION, { accountId, tract });
        id = result.createTract.tract.id;
      } else {
        await executeGraphQL(UPDATE_TRACT_MUTATION, { id: Number(id), tract });
      }
      onSaved({ id, ...tract });
      onClose();
      // Not awaited: the caller already has everything it needs from onSaved above, so the
      // card shouldn't sit open waiting on a full tract-list refetch just to close itself.
      queryClient.invalidateQueries({ queryKey: ["tracts"] });
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    const excludeId = mode === "edit" && initialData?.id != null ? Number(initialData.id) : undefined;
    const matches = findMatchingTracts(availableTracts, formData, excludeId);
    if (matches.length > 0) {
      setPendingMatch({ matches });
      return;
    }
    await persist(formData);
  };

  return (
    <div className="border border-purple-300/20 rounded-xl p-4 bg-white/5 space-y-2">
      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
        {mode === "add" ? "New Legal Description" : "Edit Legal Description"}
      </span>
      <Form
        config={legalOnlyConfig}
        initialData={initialData ?? undefined}
        onSave={handleSave}
        onCancel={onClose}
        mode={mode}
        saveError={saveError}
        onClearSaveError={() => setSaveError(null)}
        dynamicOptions={dynamicOptions}
        stateCountyReference={stateCountyReference}
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
            title="Matching Legal Description Found"
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

export default LegalDescriptionForm;
