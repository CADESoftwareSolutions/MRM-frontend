import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { TractPickerField, TractPickerFieldHandle, TractLinkEntry } from "../../../../components/FormComponents/TractPickerField";
import { CrossReferencesTab } from "../../../../components/FormComponents/CrossReferencesTab";
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
  const [tracts, setTractsState] = useState<TractLinkEntry[]>([]);
  const { stateCountyReference, dynamicOptions } = useLocationFieldOptions();

  // See Deeds/index.tsx for why tracts is mirrored into a ref too.
  const tractsRef = useRef(tracts);
  const setTracts = (next: TractLinkEntry[]) => {
    tractsRef.current = next;
    setTractsState(next);
  };
  const [liveLocation, setLiveLocation] = useState<{ stateCode?: string; countyName?: string }>({});
  const tractPickerRef = useRef<TractPickerFieldHandle>(null);
  // Surfaced at the OUTER form level (not just inside the Legal Descriptions tab) when the
  // always-present "add" or an open "edit" Legal Description card fails validation on save —
  // that card's own error summary lives inside a `hidden` TabsContent whenever the user is on a
  // different tab, so without this, clicking Save while looking at e.g. Well Details would
  // silently do nothing with no visible explanation at all.
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
    setTracts([]);
    setLiveLocation({});
    setLegalDescriptionBlockError(null);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setTracts(item._tracts || []);
    setLiveLocation({ stateCode: item.stateCode, countyName: item.countyName });
    setLegalDescriptionBlockError(null);
    _handleEdit(item);
  };

  const onSave = async (formData: any) => {
    // See Deeds/index.tsx's onSave for the full explanation of this sequence (no Recordation
    // tab here, so just the Legal Descriptions half applies).
    setLegalDescriptionBlockError(null);
    if (tractPickerRef.current?.hasAnyValue()) {
      const outcome = await tractPickerRef.current.trySubmit();
      if (outcome === "duplicate-pending") return;
      if (outcome === "error") {
        setLegalDescriptionBlockError(
          "A Legal Description has an error that needs to be fixed before this Well can be saved — check the Legal Descriptions tab.",
        );
        return;
      }
    }
    handleSave(formData, tractsRef.current);
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
                    locationTabLabel="Well Details"
                  />
                ),
                crossReferences: (
                  <CrossReferencesTab
                    entityType="well"
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
        itemName={pendingDeleteItem?.name || `Well #${pendingDeleteItem?.id}`}
        itemType="Well"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Wells;
