import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { LeaseAttachmentsTab, LeaseAttachment } from "../../../../components/FormComponents/LeaseAttachmentsTab";
import { MultiLegalDescriptionField, LegalDescriptionEntry } from "../../../../components/FormComponents/MultiLegalDescriptionField";
import { MultiRecordationField, RecordationEntry } from "../../../../components/FormComponents/MultiRecordationField";
import deedsConfig from "@/config/deedsConfig";
import { useDeeds } from "@/hooks/useDeeds";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";

const Deeds = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [attachments, setAttachments] = useState<LeaseAttachment[]>([]);
  const [legalDescriptions, setLegalDescriptions] = useState<LegalDescriptionEntry[]>([]);
  const [recordation, setRecordation] = useState<RecordationEntry[]>([]);
  const [showLegalValidation, setShowLegalValidation] = useState(false);

  const {
    view,
    loading,
    searchTerm,
    selectedItem,
    filteredData,
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
    setLegalDescriptions([]);
    setRecordation([]);
    setAttachments([]);
    setShowLegalValidation(false);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setLegalDescriptions(item._legalDescriptions || []);
    setRecordation(item._recordation || []);
    setAttachments(item._attachments || []);
    setShowLegalValidation(false);
    _handleEdit(item);
  };

  const onSave = (formData: any) => {
    if (legalDescriptions.length === 0) {
      setShowLegalValidation(true);
      return;
    }
    setShowLegalValidation(false);
    handleSave(formData, legalDescriptions, recordation, attachments);
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
              saveError={saveError}
              onClearSaveError={clearSaveError}
              customContent={{
                legalDescriptions: (
                  <MultiLegalDescriptionField
                    value={legalDescriptions}
                    onChange={setLegalDescriptions}
                    showValidation={showLegalValidation}
                  />
                ),
                recordation: (
                  <MultiRecordationField
                    value={recordation}
                    onChange={setRecordation}
                  />
                ),
                attachments: (
                  <LeaseAttachmentsTab
                    value={attachments}
                    onChange={setAttachments}
                  />
                ),
              }}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={
          pendingDeleteItem?.deedId ||
          pendingDeleteItem?.grantor ||
          "this deed"
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Deeds;
