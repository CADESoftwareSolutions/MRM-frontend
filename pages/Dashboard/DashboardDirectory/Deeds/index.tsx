import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { LeaseAttachmentsTab } from "../../../../components/FormComponents/LeaseAttachmentsTab";
import { CrossReferencesTab } from "../../../../components/FormComponents/CrossReferencesTab";
import { TractPickerField, TractPickerFieldHandle, TractLinkEntry } from "../../../../components/FormComponents/TractPickerField";
import {
  MultiRecordationField,
  RecordationEntry,
  DraftRecordation,
  hasRecordationDraftContent,
  buildCommittedRecordation,
} from "../../../../components/FormComponents/MultiRecordationField";
import deedsConfig from "@/config/deedsConfig";
import { useDeeds } from "@/hooks/useDeeds";
import { useLocationFieldOptions } from "@/hooks/useStateCountyReference";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";

const Deeds = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [tracts, setTractsState] = useState<TractLinkEntry[]>([]);
  const [recordation, setRecordationState] = useState<RecordationEntry[]>([]);
  const { stateCountyReference, dynamicOptions } = useLocationFieldOptions();

  // Mirror state into refs too: onSave below needs tracts/recordation's truly-current value
  // right after an awaited step (the embedded Legal Description's own save), and a plain closure
  // over state would still see the pre-await value there — React hasn't re-rendered yet to hand
  // it a fresh one by the time the await resolves.
  const tractsRef = useRef(tracts);
  const setTracts = (next: TractLinkEntry[]) => {
    tractsRef.current = next;
    setTractsState(next);
  };
  const recordationRef = useRef(recordation);
  const setRecordation = (next: RecordationEntry[]) => {
    recordationRef.current = next;
    setRecordationState(next);
  };

  // The Recordation tab's own always-present "New Recordation" draft, mirrored up live via
  // onDraftChange — lets onSave below auto-commit it (as if "Add Recordation" were clicked) if
  // the user filled some of it in but saved the Deed itself without clicking that button.
  const pendingRecordationDraftRef = useRef<DraftRecordation | null>(null);
  // Bumped right after an auto-commit to force MultiRecordationField to remount (its own `key`
  // below) — the draft card is local state inside that component with no imperative reset, so
  // without this it would keep showing the just-committed values as if they were still pending.
  const [recordationDraftKey, setRecordationDraftKey] = useState(0);

  // Basic Information's own live State/County (not just the last-saved value) — tracked via
  // Form's watchFields/onFieldsChange. State/County is set once here and nowhere else: Legal
  // Descriptions and Recordation both just display this read-only (never their own independently
  // editable copy), so a change here, even before the Deed itself is saved, is reflected there
  // immediately instead of only after the next save+reload.
  const [liveLocation, setLiveLocation] = useState<{ stateCode?: string; countyName?: string }>({});

  // Imperative handle onto the Legal Descriptions tab's always-present "New Legal Description"
  // card — lets onSave below check/commit it the same way, before the Deed's own save proceeds.
  const tractPickerRef = useRef<TractPickerFieldHandle>(null);
  // Surfaced at the OUTER form level when that card (or an open "edit" one) fails validation —
  // its own error summary lives inside a `hidden` TabsContent whenever the user isn't on the
  // Legal Descriptions tab, so without this, clicking Save while on another tab would silently
  // do nothing with no visible explanation at all.
  const [legalDescriptionBlockError, setLegalDescriptionBlockError] = useState<string | null>(null);

  const {
    view,
    loading,
    searchTerm,
    selectedItem,
    filteredData,
    availableTracts,
    saveError,
    clearSaveError,
    pendingDeleteItem,
    confirmDelete,
    cancelDelete,
    setSearchTerm,
    handleAdd: _handleAdd,
    handleEdit: _handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
  } = useDeeds({
    config: deedsConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Deeds",
      subtitle: `${count} ${count === 1 ? "deed" : "deeds"}`,
    });
    return () => setPageHeader({});
  }, [filteredData.length]);

  const handleAdd = () => {
    setTracts([]);
    setRecordation([]);
    pendingRecordationDraftRef.current = null;
    setLiveLocation({});
    setLegalDescriptionBlockError(null);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setTracts(item._tracts || []);
    setRecordation(item._recordation || []);
    pendingRecordationDraftRef.current = null;
    setLiveLocation({ stateCode: item.stateCode, countyName: item.countyName });
    setLegalDescriptionBlockError(null);
    _handleEdit(item);
  };

  const onSave = async (formData: any) => {
    setLegalDescriptionBlockError(null);
    // If the Legal Descriptions tab's always-present add card has anything typed into it,
    // commit it first (same flow its own Save button runs) and wait for that to fully settle
    // before saving the Deed, so an in-progress legal description never gets silently dropped.
    if (tractPickerRef.current?.hasAnyValue()) {
      const outcome = await tractPickerRef.current.trySubmit();
      // "duplicate-pending": the match popup is now open — let the user resolve it there
      // instead of proceeding without the legal description. "error": the mutation (or its
      // validation) failed — surface that at the outer level too, since that tab may not even
      // be the one currently active. Either way, don't save the Deed yet.
      if (outcome === "duplicate-pending") return;
      if (outcome === "error") {
        setLegalDescriptionBlockError(
          "A Legal Description has an error that needs to be fixed before this Deed can be saved — check the Legal Descriptions tab.",
        );
        return;
      }
    }

    // Same idea for Recordation's always-present draft, but simpler — it's local data, not a
    // separate mutation, so "committing" it just means including it in this save's payload.
    let finalRecordation = recordationRef.current;
    const pendingDraft = pendingRecordationDraftRef.current;
    if (pendingDraft && hasRecordationDraftContent(pendingDraft)) {
      finalRecordation = [
        ...recordationRef.current,
        buildCommittedRecordation(pendingDraft, liveLocation.stateCode || "", liveLocation.countyName || ""),
      ];
      setRecordation(finalRecordation);
      // Clear immediately (synchronously, not just via the remount below) so a double-click or
      // a retry after a failed save can't read this same pending draft again and append a
      // second duplicate entry before React has even re-rendered.
      pendingRecordationDraftRef.current = null;
      setRecordationDraftKey((k) => k + 1);
    }

    handleSave(formData, finalRecordation, tractsRef.current);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto">
          {view === "list" && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleAdd}
                className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Deed
              </Button>
            </div>
          )}

          {view === "list" && (
            <List
              config={deedsConfig}
              data={filteredData}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {(view === "add" || view === "edit") && (
            <Form
              config={deedsConfig}
              initialData={selectedItem}
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={legalDescriptionBlockError || saveError}
              onClearSaveError={() => {
                setLegalDescriptionBlockError(null);
                clearSaveError();
              }}
              dynamicOptions={dynamicOptions}
              stateCountyReference={stateCountyReference}
              watchFields={["stateCode", "countyName"]}
              onFieldsChange={(values) =>
                setLiveLocation({ stateCode: values.stateCode, countyName: values.countyName })
              }
              customContent={{
                tracts: (
                  <TractPickerField
                    ref={tractPickerRef}
                    availableTracts={availableTracts}
                    value={tracts}
                    onChange={setTracts}
                    accountId={userProfile?.account?.id ?? 0}
                    defaultState={liveLocation.stateCode}
                    defaultCounty={liveLocation.countyName}
                  />
                ),
                recordation: (
                  <MultiRecordationField
                    key={recordationDraftKey}
                    value={recordation}
                    onChange={setRecordation}
                    stateCountyReference={stateCountyReference}
                    defaultState={liveLocation.stateCode}
                    defaultCounty={liveLocation.countyName}
                    onDraftChange={(draft) => {
                      pendingRecordationDraftRef.current = draft;
                    }}
                  />
                ),
                attachments: (
                  <LeaseAttachmentsTab
                    entityType="title_document"
                    entityId={selectedItem?.id ? Number(selectedItem.id) : null}
                  />
                ),
                crossReferences: (
                  <CrossReferencesTab
                    entityType="title_document"
                    entityId={selectedItem?.id ? Number(selectedItem.id) : null}
                  />
                ),
              }}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={pendingDeleteItem?.grantor || `Deed #${pendingDeleteItem?.id}`}
        itemType="Deed"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Deeds;
