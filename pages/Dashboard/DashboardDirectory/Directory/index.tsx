import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import { MultiAddressField, AddressEntry } from "../../../../components/FormComponents/MultiAddressField";
import { MultiPhoneField, PhoneEntry } from "../../../../components/FormComponents/MultiPhoneField";
import { directoryConfig } from "@/config/directoryConfig";
import { useDirectory } from "@/hooks/useDirectory";
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";

const DEFAULT_ADDRESSES: AddressEntry[] = [
  { type: "Physical", address: "", addressLine2: "", city: "", state: "", zip: "" },
];

const addressesFromItem = (item: any): AddressEntry[] => {
  const raw = item?._rawData?.addresses;
  if (!raw?.length) return DEFAULT_ADDRESSES;
  const mapped: AddressEntry[] = raw.map((a: any) => ({
    type: a.addressType || "Physical",
    address: a.address?.line1 || "",
    addressLine2: a.address?.line2 || "",
    city: a.address?.city || "",
    state: a.address?.stateCode || "",
    zip: a.address?.postalCode || "",
    _addressId: a.address?.id ? parseInt(a.address.id, 10) : undefined,
    _partyAddressId: a.id ? parseInt(a.id, 10) : undefined,
  }));
  const physical = mapped.find((a) => a.type === "Physical");
  const others = mapped.filter((a) => a.type !== "Physical");
  return physical ? [physical, ...others] : [DEFAULT_ADDRESSES[0], ...mapped];
};

const phonesFromItem = (item: any): PhoneEntry[] => {
  const rawPhones: any[] = item?._rawData?.phones || [];
  return rawPhones.map((pp: any) => ({
    type: pp.phoneType || "Business",
    number: pp.phone?.number || "",
    _phoneId: pp.phone?.id ? parseInt(pp.phone.id, 10) : undefined,
    _partyPhoneId: pp.id ? parseInt(pp.id, 10) : undefined,
  }));
};

const AddressDirectory = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [addresses, setAddresses] = useState<AddressEntry[]>(DEFAULT_ADDRESSES);
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [showAddressValidation, setShowAddressValidation] = useState(false);
  const addressesRef = useRef(addresses);
  const phonesRef = useRef(phones);
  addressesRef.current = addresses;
  phonesRef.current = phones;

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
    contacts,
    handleAddContact,
    handleUpdateContact,
    handleDeleteContact,
    setSearchTerm,
    handleAdd: _handleAdd,
    handleEdit: _handleEdit,
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

  useEffect(() => {
    const count = filteredData.length;
    setPageHeader({
      title: "Directory",
      subtitle: `${count} ${count === 1 ? "contact" : "contacts"}`,
    });
    return () => setPageHeader({});
  }, [filteredData.length]);

  const handleAdd = () => {
    setAddresses(DEFAULT_ADDRESSES);
    setPhones([]);
    setShowAddressValidation(false);
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setAddresses(addressesFromItem(item));
    setPhones(phonesFromItem(item));
    setShowAddressValidation(false);
    _handleEdit(item);
  };

  const onSave = (formData: any) => {
    const anyInvalid = addressesRef.current.some(
      (a) => !a.address || !a.city || !a.state
    );
    if (anyInvalid) {
      setShowAddressValidation(true);
      return;
    }
    setShowAddressValidation(false);
    handleSave(formData, addressesRef.current, phonesRef.current);
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
                Add New Contact
              </Button>
            </div>
          )}

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
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
              partyId={selectedItem?.id ? parseInt(selectedItem.id, 10) : undefined}
              contacts={contacts}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              customContent={{
                addresses: (
                  <MultiAddressField
                    value={addresses}
                    onChange={setAddresses}
                    showValidation={showAddressValidation}
                  />
                ),
                phones: (
                  <MultiPhoneField
                    value={phones}
                    onChange={setPhones}
                  />
                ),
              }}
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
