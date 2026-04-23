import { useState, useMemo } from "react";
import { ModuleConfig } from "../config/directoryConfig";
import { MOCK_LEASES } from "../config/leasesConfig";

interface UseLeasesProps {
  config: ModuleConfig;
  accountId: number;
}

let _nextId = MOCK_LEASES.length + 1;

const generateSmartId = (formData: any): string => {
  const state = formData.state || "XX";
  const block =
    formData.block ||
    formData.blockSTR ||
    formData.blockMB ||
    formData.blockFF;
  const section =
    formData.section ||
    formData.sectionSTR ||
    formData.sectionMB ||
    formData.sectionFF;
  if (block && section) {
    const b = String(block).padStart(3, "0");
    const s = String(section).padStart(3, "0");
    return `${state}-B${b}-S${s}`;
  }
  return `LSE-${new Date().getFullYear()}-${String(_nextId).padStart(3, "0")}`;
};

const SEARCH_FIELDS = [
  "leaseId",
  "lessor",
  "lessee",
  "leaseStatus",
  "state",
  "county",
  "typeOfLease",
  "effectiveDate",
  "expirationDate",
];

export const useLeases = ({ config: _config, accountId: _accountId }: UseLeasesProps) => {
  const [data, setData] = useState<Record<string, any>[]>(
    MOCK_LEASES.map((l) => ({ ...l, id: String(l.id) }))
  );
  const [loading] = useState(false);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) =>
      SEARCH_FIELDS.some((fieldId) => {
        const val = item[fieldId];
        if (Array.isArray(val))
          return val.some((v) => v?.toString().toLowerCase().includes(lower));
        return val?.toString().toLowerCase().includes(lower);
      })
    );
  }, [data, searchTerm]);

  const handleSave = async (formData: any) => {
    try {
      if (view === "add") {
        const leaseId =
          formData.leaseIdType === "smart"
            ? generateSmartId(formData)
            : formData.leaseId || generateSmartId(formData);
        const newId = String(_nextId++);
        setData((prev) => [...prev, { ...formData, id: newId, leaseId }]);
      } else {
        setData((prev) =>
          prev.map((item) =>
            item.id === selectedItem?.id ? { ...item, ...formData } : item
          )
        );
      }
      setView("list");
      setSelectedItem(null);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleDelete = (item: any) => setPendingDeleteItem(item);

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    setData((prev) => prev.filter((item) => item.id !== pendingDeleteItem.id));
    setPendingDeleteItem(null);
  };

  const cancelDelete = () => setPendingDeleteItem(null);

  const bulkImport = (rows: Record<string, any>[]) => {
    const newItems = rows.map((row) => ({
      ...row,
      id: String(_nextId++),
      leaseId: row.leaseId || generateSmartId(row),
    }));
    setData((prev) => [...prev, ...newItems]);
  };

  return {
    data,
    loading,
    view,
    searchTerm,
    selectedItem,
    saveError,
    clearSaveError: () => setSaveError(null),
    pendingDeleteItem,
    confirmDelete,
    cancelDelete,
    filteredData,
    setSearchTerm,
    handleAdd: () => {
      setSelectedItem(null);
      setView("add");
    },
    handleEdit: (item: Record<string, any>) => {
      setSelectedItem(item);
      setView("edit");
    },
    handleSave,
    handleDelete,
    handleCancel: () => {
      setView("list");
      setSelectedItem(null);
    },
    bulkImport,
  };
};
