import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { LeaseAttachmentsTab, LeaseAttachment } from "../../../../components/FormComponents/LeaseAttachmentsTab";
import leasesConfig from "@/config/leasesConfig";
import { useLeases } from "@/hooks/useLeases";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";

const Leases = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const [attachments, setAttachments] = useState<LeaseAttachment[]>([]);

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
  } = useLeases({
    config: leasesConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const handleAdd = () => {
    setAttachments([]);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setAttachments(item._attachments || []);
    _handleEdit(item);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 my-15">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FileText className={`w-8 h-8 mt-1 ${isLight ? "text-purple-500" : "text-purple-300"}`} />
              <div>
                <h1 className={`text-3xl font-bold leading-none ${isLight ? "text-gray-900" : "text-white"}`}>Leases</h1>
                <p className={`text-sm mt-1 ${isLight ? "text-gray-400" : "text-white/50"}`}>
                  {filteredData.length}{" "}
                  {filteredData.length === 1 ? "lease" : "leases"}
                </p>
              </div>
            </div>
            {view === "list" && (
              <Button
                onClick={handleAdd}
                className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Lease
              </Button>
            )}
          </div>
          <div className="border-b border-purple-300/10 mb-8" />

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
              onSave={handleSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
              customContent={{
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
          pendingDeleteItem?.leaseId ||
          pendingDeleteItem?.lessor ||
          "this lease"
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Leases;
