import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { directoryConfig } from "@/config/directoryConfig";
import { useDirectory } from "@/hooks/useDirectory";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";

const AddressDirectory = () => {
  const [userProfile] = useAtom(userProfileAtom);
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
  } = useDirectory({
    config: directoryConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 my-15">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Users className="w-8 h-8 text-purple-300 mt-1" />
              <div>
                <h1 className="text-3xl font-bold text-white leading-none">Directory</h1>
                <p className="text-sm text-white/50 mt-1">
                  {filteredData.length} {filteredData.length === 1 ? "contact" : "contacts"}
                </p>
              </div>
            </div>
            {view === "list" && (
              <Button
                onClick={handleAdd}
                className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2 " />
                Add New Contact
              </Button>
            )}
          </div>
          <div className="border-b border-purple-300/10 mb-8" />

          {view === "list" && (
            <List
              config={directoryConfig}
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
              config={directoryConfig}
              initialData={selectedItem}
              onSave={handleSave}
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
        itemName={pendingDeleteItem?.name || "this contact"}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default AddressDirectory;
