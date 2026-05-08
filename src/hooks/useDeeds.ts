import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { ModuleConfig } from "../config/directoryConfig";
import { MOCK_DEEDS } from "../config/deedsConfig";

interface UseDeedsProps {
  config: ModuleConfig;
  accountId: number;
}

let _nextId = MOCK_DEEDS.length + 1;

const SEARCH_FIELDS = [
  "deedId",
  "typeOfDeed",
  "grantor",
  "grantee",
  "interestType",
  "state",
  "county",
];

export const useDeeds = ({ config: _config, accountId: _accountId }: UseDeedsProps) => {
  const [data, setData] = useState<Record<string, any>[]>(MOCK_DEEDS);
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
    legalDescriptions: any[],
    recordation: any[],
    attachments: any[]
  ) => {
    try {
      const payload = {
        ...formData,
        _legalDescriptions: legalDescriptions,
        _recordation: recordation,
        _attachments: attachments,
      };
      if (view === "add") {
        const newId = String(_nextId++);
        setData((prev) => [...prev, { ...payload, id: newId }]);
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
