import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { LeaseAttachmentsTab, LeaseAttachment } from "../../../../components/FormComponents/LeaseAttachmentsTab";
import { TractPickerField, TractLinkEntry } from "../../../../components/FormComponents/TractPickerField";
import { MultiRecordationField, RecordationEntry } from "../../../../components/FormComponents/MultiRecordationField";
import leasesConfig from "@/config/leasesConfig";
import { useLeases } from "@/hooks/useLeases";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";
import { useStateCountyReference } from "@/hooks/useStateCountyReference";

const Leases = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [attachments, setAttachments] = useState<LeaseAttachment[]>([]);
  const [tractLinks, setTractLinks] = useState<TractLinkEntry[]>([]);
  const [recordation, setRecordation] = useState<RecordationEntry[]>([]);
  const { data: stateCountyReference = [] } = useStateCountyReference();

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
    setTractLinks([]);
    setRecordation([]);
    setAttachments([]);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setTractLinks(item._tractLinks || []);
    setRecordation(item._recordation || []);
    setAttachments(item._attachments || []);
    _handleEdit(item);
  };

  const onSave = (formData: any) => {
    handleSave(formData, recordation, tractLinks);
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
              saveError={saveError}
              onClearSaveError={clearSaveError}
              dynamicOptions={dynamicOptions}
              stateCountyReference={stateCountyReference}
              customContent={{
                tractLinks: (
                  <TractPickerField
                    availableTracts={availableTracts}
                    value={tractLinks}
                    onChange={setTractLinks}
                    accountId={userProfile?.account?.id ?? 0}
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
        itemName={pendingDeleteItem?.lessor || `Lease #${pendingDeleteItem?.id}`}
        itemType="Lease"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Leases;
