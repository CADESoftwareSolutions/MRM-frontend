import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_WELLS,
  CREATE_WELL_MUTATION,
  UPDATE_WELL_MUTATION,
  DELETE_WELL_MUTATION,
} from "../graphql/Wells";
import { executeGraphQL } from "../lib/api";

interface UseWellsProps {
  config: ModuleConfig;
  accountId: number;
}

const transformWell = (well: any): Record<string, any> => ({
  id: well.id,
  name: well.name || "",
  leaseName: well.leaseName || "",
  wellNumber: well.wellNumber || "",
  operatorName: well.operatorName || "",
  fieldName: well.fieldName || "",
  rrcDistrict: well.rrcDistrict || "",
  apiNumber: well.apiNumber || "",
  stateCode: well.stateCode || "",
  countyName: well.countyName || "",
  notes: well.notes || "",
});

const buildWellMutationVariables = (formData: Record<string, any>, accountId: number) => ({
  accountId,
  name: formData.name || null,
  leaseName: formData.leaseName || null,
  wellNumber: formData.wellNumber || null,
  operatorName: formData.operatorName || null,
  fieldName: formData.fieldName || null,
  rrcDistrict: formData.rrcDistrict || null,
  apiNumber: formData.apiNumber || null,
  stateCode: formData.stateCode || null,
  countyName: formData.countyName || null,
  notes: formData.notes || null,
});

export const useWells = ({ config: _config, accountId }: UseWellsProps) => {
  const queryClient = useQueryClient();
  const queryKey = ["wells"];
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const { data: rawWells = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_WELLS);
      return result.wells as any[];
    },
  });

  const wells = useMemo(() => rawWells.map(transformWell), [rawWells]);

  const SEARCH_FIELDS = ["name", "operatorName", "stateCode", "countyName", "apiNumber"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return wells;
    const lower = searchTerm.toLowerCase();
    return wells.filter((well) =>
      SEARCH_FIELDS.some((fieldId) => well[fieldId]?.toString().toLowerCase().includes(lower))
    );
  }, [wells, searchTerm]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleSave = async (formData: Record<string, any>) => {
    try {
      const variables = buildWellMutationVariables(formData, accountId);
      if (view === "add") {
        await executeGraphQL(CREATE_WELL_MUTATION, variables);
      } else {
        await executeGraphQL(UPDATE_WELL_MUTATION, { id: Number(selectedItem?.id), ...variables });
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
      await executeGraphQL(DELETE_WELL_MUTATION, { id: Number(pendingDeleteItem.id) });
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
