import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import Form from "../FormComponents/Form";
import tractsConfig from "@/config/tractsConfig";
import { buildTractInput } from "@/hooks/useTracts";
import { useStateCountyReference } from "@/hooks/useStateCountyReference";
import { CREATE_TRACT_MUTATION, UPDATE_TRACT_MUTATION } from "@/graphql/Tracts";
import { executeGraphQL } from "@/lib/api";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Modal, ModalHeader } from "./Modal";

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

  return (
    // portal: this is mounted deep inside the lease/deed form's Tabs content, which sets a
    // transform on its active panel (Radix's tab animation) — that would anchor a plain
    // `position: fixed` modal to the form instead of the viewport, so it has to escape via
    // portal straight to <body>. isLight: the portal lands outside DashboardLayout's
    // `.light-theme` wrapper, so Modal has to be told the theme explicitly to reapply it.
    <Modal onClose={onClose} portal isLight={isLight} maxWidthClassName="max-w-6xl" heightClassName="h-[90vh]">
      <ModalHeader
        title={mode === "add" ? "Add New Tract" : "Tract Details"}
        icon={<MapPin className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onClose}
        isLight={isLight}
      />

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
    </Modal>
  );
};

export default TractFormModal;
