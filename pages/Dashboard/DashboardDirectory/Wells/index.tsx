import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { LegalDescriptionListField, LegalDescriptionEntry } from "../../../../components/FormComponents/LegalDescriptionListField";
import wellsConfig from "@/config/wellsConfig";
import { useWells } from "@/hooks/useWells";
import { useLocationFieldOptions } from "@/hooks/useStateCountyReference";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";

const Wells = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [legalDescriptions, setLegalDescriptions] = useState<LegalDescriptionEntry[]>([]);
  const { stateCountyReference, dynamicOptions } = useLocationFieldOptions();

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
  } = useWells({
    config: wellsConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Wells",
      subtitle: `${count} ${count === 1 ? "well" : "wells"}`,
    });
    return () => setPageHeader({});
  }, [filteredData.length]);

  const handleAdd = () => {
    setLegalDescriptions([]);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setLegalDescriptions(item._legalDescriptions || []);
    _handleEdit(item);
  };

  const onSave = (formData: any) => {
    handleSave(formData, legalDescriptions);
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
                Add New Well
              </Button>
            </div>
          )}

          {view === "list" && (
            <List
              config={wellsConfig}
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
              config={wellsConfig}
              initialData={selectedItem}
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
              dynamicOptions={dynamicOptions}
              stateCountyReference={stateCountyReference}
              customContent={{
                legalDescriptions: (
                  <LegalDescriptionListField
                    value={legalDescriptions}
                    onChange={setLegalDescriptions}
                    stateCountyReference={stateCountyReference}
                  />
                ),
              }}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={pendingDeleteItem?.name || `Well #${pendingDeleteItem?.id}`}
        itemType="Well"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Wells;
