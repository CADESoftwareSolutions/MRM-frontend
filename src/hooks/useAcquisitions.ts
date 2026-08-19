import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_ACQUISITIONS,
  CREATE_ACQUISITION_MUTATION,
  UPDATE_ACQUISITION_MUTATION,
  DELETE_ACQUISITION_MUTATION,
} from "../graphql/Acquisitions";
import { executeGraphQL } from "../lib/api";

interface UseAcquisitionsProps {
  config: ModuleConfig;
  accountId: number;
}

const transformAcquisition = (acquisition: any): Record<string, any> => ({
  id: acquisition.id,
  name: acquisition.name || "",
  acquisitionDate: acquisition.acquisitionDate || "",
  acquisitionAmount: acquisition.acquisitionAmount ?? "",
  notes: acquisition.notes || "",
});

const buildAcquisitionMutationVariables = (formData: Record<string, any>, accountId: number) => ({
  accountId,
  name: formData.name || null,
  acquisitionDate: formData.acquisitionDate || null,
  acquisitionAmount: formData.acquisitionAmount ? Number(formData.acquisitionAmount) : null,
  notes: formData.notes || null,
});

export const useAcquisitions = ({ config: _config, accountId }: UseAcquisitionsProps) => {
  const queryClient = useQueryClient();
  const queryKey = ["acquisitions"];
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const { data: rawAcquisitions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_ACQUISITIONS);
      return result.acquisitions as any[];
    },
  });

  const acquisitions = useMemo(() => rawAcquisitions.map(transformAcquisition), [rawAcquisitions]);

  const SEARCH_FIELDS = ["name"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return acquisitions;
    const lower = searchTerm.toLowerCase();
    return acquisitions.filter((acquisition) =>
      SEARCH_FIELDS.some((fieldId) => acquisition[fieldId]?.toString().toLowerCase().includes(lower))
    );
  }, [acquisitions, searchTerm]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleSave = async (formData: Record<string, any>) => {
    try {
      const variables = buildAcquisitionMutationVariables(formData, accountId);
      if (view === "add") {
        await executeGraphQL(CREATE_ACQUISITION_MUTATION, variables);
      } else {
        await executeGraphQL(UPDATE_ACQUISITION_MUTATION, { id: Number(selectedItem?.id), ...variables });
      }
      await invalidate();
      setView("list");
      setSelectedItem(null);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleDelete = (item: Record<string, any>) => setPendingDeleteItem(item);

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await executeGraphQL(DELETE_ACQUISITION_MUTATION, { id: Number(pendingDeleteItem.id) });
      await invalidate();
    } catch (err) {
      setSaveError((err as Error).message);
    }
    setPendingDeleteItem(null);
  };

  return {
    loading: isLoading,
    view,
    searchTerm,
    selectedItem,
    filteredData,
    saveError,
    clearSaveError: () => setSaveError(null),
    pendingDeleteItem,
    confirmDelete,
    cancelDelete: () => setPendingDeleteItem(null),
    setSearchTerm,
    handleAdd: () => { setSelectedItem(null); setView("add"); },
    handleEdit: (item: Record<string, any>) => { setSelectedItem(item); setView("edit"); },
    handleSave,
    handleDelete,
    handleCancel: () => { setView("list"); setSelectedItem(null); },
  };
};
