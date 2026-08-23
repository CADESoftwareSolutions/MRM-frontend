import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader } from "../modals/Modal";
import {
  useLegalDescriptionMatchSuggestions,
  SuggestionEntityType,
} from "@/hooks/useLegalDescriptionMatchSuggestions";

interface SuggestedCrossReferencesModalProps {
  sourceEntityType: SuggestionEntityType;
  sourceEntityId?: number | null;
  accountId: number;
  /** Same isActive this record's *CrossReferencesTab already receives from Form.tsx — passed
   * straight through so the underlying hook re-checks fresh every time this tab is opened. */
  isActive: boolean;
  isLight: boolean;
}

const SOURCE_NOUN: Record<SuggestionEntityType, string> = {
  lease: "Lease",
  title_document: "Deed",
  well: "Well",
};

const TARGET_NOUN: Record<string, string> = {
  tract: "Tract",
  lease: "Lease",
  title_document: "Deed",
  well: "Well",
};

// One shared modal for Lease/Deed/Well's Cross-References tabs — parameterized by
// sourceEntityType/sourceEntityId rather than forked per type, matching CrossReferencePicker/
// LinkedRowsTable's existing single-generic-component precedent in this codebase.
export const SuggestedCrossReferencesModal = ({
  sourceEntityType,
  sourceEntityId,
  accountId,
  isActive,
  isLight,
}: SuggestedCrossReferencesModalProps) => {
  const { suggestions, error, clearError, modalOpen, closeModal, addSuggestion, isPending } =
    useLegalDescriptionMatchSuggestions({ sourceEntityType, sourceEntityId, accountId, isActive });

  if (!modalOpen) return null;

  return (
    <Modal onClose={closeModal} portal isLight={isLight} maxWidthClassName="max-w-lg" heightClassName="max-h-[80vh]">
      <ModalHeader
        title={`Suggested Cross-References for This ${SOURCE_NOUN[sourceEntityType]}`}
        onClose={closeModal}
        isLight={isLight}
      />
      <div className="p-6 pt-4 space-y-3 overflow-y-auto">
        <p className={`text-xs ${isLight ? "text-gray-500" : "text-purple-300/70"}`}>
          These records share a matching legal description with this {SOURCE_NOUN[sourceEntityType].toLowerCase()}.
          Add any that should be cross-referenced.
        </p>

        {error && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/40">
            <p className="text-xs text-red-300">{error}</p>
            <button type="button" onClick={clearError} className="text-red-400 hover:text-red-200 cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={`${suggestion.entityType}-${suggestion.entityId}`}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                isLight ? "border-purple-200 bg-purple-50/50" : "border-purple-300/20 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-200 bg-purple-500/20">
                  {TARGET_NOUN[suggestion.entityType] || suggestion.entityType}
                </span>
                <span className={`truncate text-sm ${isLight ? "text-gray-800" : "text-white"}`}>
                  {suggestion.label}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isPending(suggestion.entityType, suggestion.entityId)}
                onClick={() => addSuggestion(suggestion.entityType, suggestion.entityId)}
                className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending(suggestion.entityType, suggestion.entityId) ? "Adding…" : "Add"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            className={`cursor-pointer ${
              isLight
                ? "border-purple-600 text-purple-600 hover:bg-purple-50"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            }`}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SuggestedCrossReferencesModal;
