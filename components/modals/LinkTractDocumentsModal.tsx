import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader } from "./Modal";
import { CROSS_REFERENCE_NOUN, CrossReferenceEntityType, TractDocument } from "@/hooks/useCrossReferences";
import { TractOption, tractDisplayLabel } from "@/hooks/useTracts";

interface LinkTractDocumentsModalProps {
  tract: TractOption;
  /** Every other record with this tract in its Legal Descriptions (documentsSharingTract). */
  documents: TractDocument[];
  /** The Lease/Deed/Well the tract is being added to. */
  entityType: CrossReferenceEntityType;
  isLight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const GROUP_ORDER: CrossReferenceEntityType[] = ["lease", "title_document", "well"];

// Confirmation only: a tract is the legal description, so every record sharing it is
// cross-referenced — there's nothing to pick, just a chance to see what's coming along.
export const LinkTractDocumentsModal = ({
  tract,
  documents,
  entityType,
  isLight,
  onConfirm,
  onCancel,
}: LinkTractDocumentsModalProps) => {
  const selfNoun = CROSS_REFERENCE_NOUN[entityType].singular;
  const mutedText = isLight ? "text-gray-600" : "text-white/60";

  return (
    <Modal onClose={onCancel} portal isLight={isLight} maxWidthClassName="max-w-xl">
      <ModalHeader
        title="Link Existing Legal Description"
        icon={<Link2 className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <div className="p-6 space-y-4">
        <p className={`text-sm ${isLight ? "text-gray-700" : "text-purple-200"}`}>
          <span className="font-semibold">{tractDisplayLabel(tract)}</span> is already in the Legal Descriptions of{" "}
          {documents.length === 1 ? "another record" : `${documents.length} other records`}. Linking it to this{" "}
          {selfNoun} will cross-reference it with {documents.length === 1 ? "that record" : "all of them"}:
        </p>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {GROUP_ORDER.map((type) => {
            const group = documents.filter((doc) => doc.entityType === type);
            if (group.length === 0) return null;
            return (
              <div key={type} className="space-y-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${isLight ? "text-purple-700" : "text-purple-300"}`}>
                  {CROSS_REFERENCE_NOUN[type].plural}
                </h3>
                {group.map((doc) => (
                  <div
                    key={doc.key}
                    className={`rounded-lg border px-3 py-2.5 space-y-0.5 ${
                      isLight ? "border-purple-200 bg-purple-50" : "border-purple-300/20 bg-white/5"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isLight ? "text-gray-800" : "text-white"}`}>{doc.title}</p>
                    {doc.details.length > 0 && <p className={`text-xs ${mutedText}`}>{doc.details.join(" · ")}</p>}
                    <p className={`text-xs ${isLight ? "text-purple-700" : "text-purple-300/80"}`}>
                      Quarter calls: {doc.quarterCalls || "—"}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={
              isLight
                ? "border-purple-600 text-purple-600 hover:bg-purple-50 cursor-pointer"
                : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
            }
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
            Link legal description
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkTractDocumentsModal;
