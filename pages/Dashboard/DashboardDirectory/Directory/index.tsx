import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
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
    setSearchTerm,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
  } = useDirectory({
    config: directoryConfig,
    accountId: 1,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 my-15">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-300" />
              <h1 className="text-3xl font-bold text-white">Directory</h1>
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
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddressDirectory;
