import React from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { useFormData } from "@/hooks/useFormData";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import leasesConfig, { MOCK_LEASES } from "./leasesConfig";
import Form from "../../../../components/FormComponents/Form";
import { List } from "../../../../components/FormComponents/List";

type LeasesProps = {};

const Leases: React.FC<LeasesProps> = () => {
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
  } = useFormData(leasesConfig, MOCK_LEASES);

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
      <div
        className="min-h-screen p-6 my-15"
        style={{
          background:
            "linear-gradient(135deg, #2d1b4e 0%, #1e1e3f 50%, #2d1b4e 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-300" />
              <h1 className="text-3xl font-bold text-white">
                {leasesConfig.title}
              </h1>
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
              config={leasesConfig}
              data={MOCK_LEASES}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredContacts={filteredData}
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
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leases;
