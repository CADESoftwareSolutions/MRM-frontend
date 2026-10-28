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
import leasesConfig from "@/config/leasesConfig";
import { useLeases } from "@/hooks/useLeases";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";
import { useLocationFieldOptions } from "@/hooks/useStateCountyReference";

const Leases = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [tracts, setTractsState] = useState<TractLinkEntry[]>([]);
  const [recordation, setRecordationState] = useState<RecordationEntry[]>([]);
  const { stateCountyReference, dynamicOptions } = useLocationFieldOptions();

  // See Deeds/index.tsx for why these mirror state into refs too.
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
  const pendingRecordationDraftRef = useRef<DraftRecordation | null>(null);
  // See Deeds/index.tsx's onSave for why this exists — forces MultiRecordationField to remount
  // (clearing its local draft state) right after an auto-commit.
  const [recordationDraftKey, setRecordationDraftKey] = useState(0);
  const [liveLocation, setLiveLocation] = useState<{ stateCode?: string; countyName?: string }>({});
  const tractPickerRef = useRef<TractPickerFieldHandle>(null);
  // See Deeds/index.tsx's onSave for why this exists — surfaces a Legal Description validation
  // failure at the outer form level, since its own error summary can sit inside a hidden tab.
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
  } = useLeases({
    config: leasesConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Leases",
      subtitle: `${count} ${count === 1 ? "lease" : "leases"}`,
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
    // See Deeds/index.tsx's onSave for the full explanation of this sequence.
    setLegalDescriptionBlockError(null);
    if (tractPickerRef.current?.hasAnyValue()) {
      const outcome = await tractPickerRef.current.trySubmit();
      if (outcome === "duplicate-pending") return;
      if (outcome === "error") {
        setLegalDescriptionBlockError(
          "A Legal Description has an error that needs to be fixed before this Lease can be saved — check the Legal Descriptions tab.",
        );
        return;
      }
    }

    let finalRecordation = recordationRef.current;
    const pendingDraft = pendingRecordationDraftRef.current;
    if (pendingDraft && hasRecordationDraftContent(pendingDraft)) {
      finalRecordation = [
        ...recordationRef.current,
        buildCommittedRecordation(pendingDraft, liveLocation.stateCode || "", liveLocation.countyName || ""),
      ];
      setRecordation(finalRecordation);
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
                Add New Lease
              </Button>
            </div>
          )}

          {view === "list" && (
            <List
              config={leasesConfig}
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
              config={leasesConfig}
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
                    entityType="lease"
                    entityId={selectedItem?.id ? Number(selectedItem.id) : null}
                  />
                ),
                crossReferences: (
                  <CrossReferencesTab
                    entityType="lease"
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
        itemName={pendingDeleteItem?.lessor || `Lease #${pendingDeleteItem?.id}`}
        itemType="Lease"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Leases;
