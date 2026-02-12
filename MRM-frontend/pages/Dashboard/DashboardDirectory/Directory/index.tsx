import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { List } from "../../../../components/FormComponents/List";
import Form from "../../../../components/FormComponents/Form";
import { directoryConfig } from "./directoryConfig";
import { useFormData } from "@/hooks/useFormData";

const AddressDirectory = () => {
  const MOCK_CONTACTS = [
    {
      id: 1,
      nameId: "AUTO-001",
      name: "Acme Corporation",
      classifications: ["VENDOR"],
      email: "contact@acme.com",
      phone: "555-0100",
      city: "Dallas",
      state: "TX",
      status: "Active",
    },
  ];

  const {
    view,
    searchTerm,
    selectedItem,
    filteredData,
    setSearchTerm,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
  } = useFormData(directoryConfig, MOCK_CONTACTS);

  const resetForm = () => {
    setFormData({
      nameIdType: "auto",
      nameId: "",
      classifications: [],
      name: "",
      nameLine2: "",
      addressTypes: [],
      address: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      phoneTypes: [],
      phoneNumber: "",
      email: "",
      contactPerson: "",
      contactAddressTypes: [],
      contactAddress: "",
      contactAddressLine2: "",
      contactCity: "",
      contactState: "",
      contactZip: "",
      contactPhone: "",
      contactEmail: "",
      status: "Active",
      comments: "",
      taxClassification: "",
      taxId: "",
      internalInHouse: "",
      federalTaxWithheld: "",
      nonEmployeeComp: "",
      send1099: "",
      w9OnFile: "",
      backupWithholding: "",
      severanceTaxExempt: "",
      otherExempt: "",
      minPaymentAmount: "",
      pay: "",
      duplicateInvoiceValidation: "",
    });
    setSelectedContact(null);
  };

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
              data={MOCK_CONTACTS}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredContacts={filteredData}
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
