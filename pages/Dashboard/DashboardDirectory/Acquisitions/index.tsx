import { useEffect } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import acquisitionsConfig from "@/config/acquisitionsConfig";
import { useAcquisitions } from "@/hooks/useAcquisitions";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";

const Acquisitions = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);

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
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
  } = useAcquisitions({
    config: acquisitionsConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Acquisitions",
      subtitle: `${count} ${count === 1 ? "acquisition" : "acquisitions"}`,
    });
    return () => setPageHeader({});
  }, [filteredData.length]);

  const onSave = (formData: any) => {
    handleSave(formData);
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
                Add New Acquisition
              </Button>
            </div>
          )}

          {view === "list" && (
            <List
              config={acquisitionsConfig}
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
              config={acquisitionsConfig}
              initialData={selectedItem}
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={pendingDeleteItem?.name || `Acquisition #${pendingDeleteItem?.id}`}
        itemType="Acquisition"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Acquisitions;
