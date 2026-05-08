import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { ModuleConfig } from "../config/directoryConfig";
import { MOCK_LEASES } from "../config/leasesConfig";
import { LegalDescriptionEntry } from "../../components/FormComponents/MultiLegalDescriptionField";
import { RecordationEntry } from "../../components/FormComponents/MultiRecordationField";
import { LeaseAttachment } from "../../components/FormComponents/LeaseAttachmentsTab";

interface UseLeasesProps {
  config: ModuleConfig;
  accountId: number;
}

let _nextId = MOCK_LEASES.length + 1;

const generateSmartId = (formData: any, legalDescriptions: LegalDescriptionEntry[]): string => {
  const state = formData.state || "XX";
  const first = legalDescriptions[0];
  if (first?.block && first?.section) {
    const b = String(first.block).padStart(3, "0");
    const s = String(first.section).padStart(3, "0");
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
  const [data, setData] = useState<Record<string, any>[]>(MOCK_LEASES);
  const [loading] = useState(false);
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
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

  const handleSave = async (
    formData: any,
    legalDescriptions: LegalDescriptionEntry[],
    recordation: RecordationEntry[],
    attachments: LeaseAttachment[]
  ) => {
    try {
      const payload = {
        ...formData,
        _legalDescriptions: legalDescriptions,
        _recordation: recordation,
        _attachments: attachments,
      };
      if (view === "add") {
        const leaseId =
          formData.leaseIdType === "smart"
            ? generateSmartId(formData, legalDescriptions)
            : formData.leaseId || generateSmartId(formData, legalDescriptions);
        const newId = String(_nextId++);
        setData((prev) => [...prev, { ...payload, id: newId, leaseId }]);
      } else {
        setData((prev) =>
          prev.map((item) =>
            item.id === selectedItem?.id ? { ...item, ...payload } : item
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
  };
};
