import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Modal, ModalHeader } from "./Modal";
import { Form } from "../FormComponents/Form";
import acquisitionsConfig from "@/config/acquisitionsConfig";
import type { ModuleConfig } from "@/config/contactsConfig";
import { CREATE_ACQUISITION_MUTATION } from "@/graphql/Acquisitions";
import { acquisitionsQuery, buildAcquisitionMutationVariables } from "@/hooks/useAcquisitions";
import { executeGraphQL } from "@/lib/api";

interface AddAcquisitionModalProps {
  accountId: number;
  isLight: boolean;
  onClose: () => void;
  /** Fires once the acquisition is saved and the shared ["acquisitions"] list has refetched with it. */
  onCreated: (acquisition: { id: string; name: string }) => void;
}

// The modal header already titles the form, so the first section's own divider and header would
// just stack a second rule right under the header's.
const modalConfig: ModuleConfig = {
  ...acquisitionsConfig,
  fields: acquisitionsConfig.fields.map((field) =>
    field.section === "identification" ? { ...field, section: "default" } : field,
  ),
};

// Saves the acquisition itself right away; linking it to the deed waits for the deed's own save,
// exactly like picking an existing acquisition.
export const AddAcquisitionModal = ({ accountId, isLight, onClose, onCreated }: AddAcquisitionModalProps) => {
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (formData: Record<string, any>) => {
    setSaveError(null);
    try {
      const result = await executeGraphQL(
        CREATE_ACQUISITION_MUTATION,
        buildAcquisitionMutationVariables(formData, accountId),
      );
      // Awaited so the picker's options already include the new acquisition once it's selected.
      await queryClient.invalidateQueries({ queryKey: acquisitionsQuery.queryKey });
      onCreated({ id: String(result.createAcquisition.acquisition.id), name: formData.name });
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  return (
    <Modal onClose={onClose} portal isLight={isLight} maxWidthClassName="max-w-xl">
      <ModalHeader
        title="Add New Acquisition"
        icon={<FileText className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onClose}
        isLight={isLight}
      />
      <div className="p-6">
        <Form
          config={modalConfig}
          onSave={handleSave}
          onCancel={onClose}
          mode="add"
          saveError={saveError}
          onClearSaveError={() => setSaveError(null)}
          bare
          compactActions
          submitLabel="Save Acquisition to This Deed"
        />
      </div>
    </Modal>
  );
};

export default AddAcquisitionModal;
