import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, X } from "lucide-react";
import Form from "../FormComponents/Form";
import tractsConfig from "@/config/tractsConfig";
import { buildTractInput } from "@/hooks/useTracts";
import { useStateCountyReference } from "@/hooks/useStateCountyReference";
import { CREATE_TRACT_MUTATION, UPDATE_TRACT_MUTATION } from "@/graphql/Tracts";
import { executeGraphQL } from "@/lib/api";
import { themeAtom } from "@/atoms/NavigationAtom";

interface TractFormModalProps {
  mode: "add" | "edit";
  accountId: number;
  /** Full tract record (raw FETCH_TRACTS shape) when editing; omitted when adding. */
  initialData?: Record<string, any> | null;
  onClose: () => void;
  /** Fires with the saved tract (id + the fields just written) so the caller can update
   * its own linked-tract list without waiting on the ["tracts"] query to refetch. */
  onSaved: (tract: Record<string, any>) => void;
}

// Add or edit a single tract without leaving the lease/deed form it's being linked from —
// same tractsConfig + Form the standalone Tracts page uses, just rendered `bare` in a modal.
export const TractFormModal = ({
  mode,
  accountId,
  initialData,
  onClose,
  onSaved,
}: TractFormModalProps) => {
  const queryClient = useQueryClient();
  const { data: stateCountyReference = [] } = useStateCountyReference();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

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

  const handleSave = async (formData: Record<string, any>) => {
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
      // modal shouldn't sit open waiting on a full tract-list refetch just to close itself.
      queryClient.invalidateQueries({ queryKey: ["tracts"] });
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  // Portaled straight to <body> — this is a page-level modal, not something scoped to
  // wherever it happens to be mounted in the lease/deed form's tree. Rendering it in place
  // would leave it `position: fixed` relative to any ancestor that sets a transform/filter
  // (Radix's tab/animation wrappers do), which anchors it inside the form instead of the
  // viewport. z-[10000] clears the sidebar (z-[1300]) and header dropdown (z-[9999]) alike.
  //
  // The portal also lands outside DashboardLayout's `.light-theme` wrapper div, so the theme
  // class has to be reapplied here for the Form fields inside to pick up light-mode styling.
  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 ${isLight ? "light-theme" : ""}`}
    >
      <div
        className={`rounded-xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col border ${
          isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b shrink-0 ${
            isLight ? "border-purple-100" : "border-purple-300/20"
          }`}
        >
          <h2
            className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-gray-900" : "text-white"}`}
          >
            <MapPin className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />
            {mode === "add" ? "Add New Tract" : "Tract Details"}
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors cursor-pointer ${
              isLight ? "text-gray-400 hover:text-gray-700" : "text-purple-300 hover:text-white"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <Form
            config={tractsConfig}
            initialData={initialData ?? undefined}
            onSave={handleSave}
            onCancel={onClose}
            mode={mode}
            saveError={saveError}
            onClearSaveError={() => setSaveError(null)}
            dynamicOptions={dynamicOptions}
            stateCountyReference={stateCountyReference}
            bare
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TractFormModal;
