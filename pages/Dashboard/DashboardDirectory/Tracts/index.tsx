import { useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import tractsConfig from "@/config/tractsConfig";
import { useTracts } from "@/hooks/useTracts";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { Button } from "@/components/ui/button";
import { useStateCountyReference } from "@/hooks/useStateCountyReference";

const Tracts = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
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
  } = useTracts({
    config: tractsConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Tracts",
      subtitle: `${count} ${count === 1 ? "tract" : "tracts"}`,
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
                Add New Tract
              </Button>
            </div>
          )}

          {view === "list" && (
            <List
              config={tractsConfig}
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
              config={tractsConfig}
              initialData={selectedItem}
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
              dynamicOptions={dynamicOptions}
              stateCountyReference={stateCountyReference}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={
          pendingDeleteItem?.label ||
          `Tract #${pendingDeleteItem?.id}`
        }
        itemType="Tract"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Tracts;
