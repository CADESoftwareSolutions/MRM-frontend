import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import { TRACT_TYPE_OPTIONS } from "../config/tractsConfig";
import {
  FETCH_TRACTS,
  CREATE_TRACT_MUTATION,
  UPDATE_TRACT_MUTATION,
  DELETE_TRACT_MUTATION,
} from "../graphql/Tracts";
import { TractFields, TractOption, tractDisplayLabel } from "../../components/FormComponents/TractPickerField";
import { executeGraphQL } from "../lib/api";

interface UseTractsProps {
  config: ModuleConfig;
  accountId: number;
}

const TRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRACT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const transformTract = (tract: TractOption): Record<string, any> => ({
  id: tract.id,
  label: tractDisplayLabel(tract),
  tractTypeLabel: TRACT_TYPE_LABELS[tract.tractType ?? ""] || tract.tractType || "",
  tractType: tract.tractType || "",
  tractNo: tract.tractNo || "",
  stateCode: tract.stateCode || "",
  countyName: tract.countyName || "",
  upi: tract.upi || "",
  tractLabel: tract.tractLabel || "",
  subSurvey: tract.subSurvey || "",
  legalDescription: tract.legalDescription || "",
  lotNo: tract.lotNo || "",
  blockNo: tract.blockNo || "",
  township: tract.township || "",
  surveyTownship: tract.surveyTownship || "",
  section: tract.section || "",
  range: tract.range || "",
  abstract: tract.abstract || "",
  survey: tract.survey || "",
  quarterCalls: tract.quarterCalls || "",
  grossAcres: tract.grossAcres ?? "",
  netAcres: tract.netAcres ?? "",
});

// Exported so TractFormModal (the inline add/edit-tract flow embedded in the lease/deed
// legal-description tab) can build the same GraphQL input without duplicating this mapping.
// Typed to return exactly TractFields' keys — a field added/renamed there is a compile error
// here instead of a mutation silently missing (or carrying a stray extra) value.
export const buildTractInput = (formData: Record<string, any>): Record<keyof TractFields, string | number | null> => ({
  tractType: formData.tractType || null,
  tractNo: formData.tractNo || null,
  stateCode: formData.stateCode || null,
  countyName: formData.countyName || null,
  upi: formData.upi || null,
  tractLabel: formData.tractLabel || null,
  subSurvey: formData.subSurvey || null,
  legalDescription: formData.legalDescription || null,
  lotNo: formData.lotNo || null,
  blockNo: formData.blockNo || null,
  township: formData.township || null,
  surveyTownship: formData.surveyTownship || null,
  section: formData.section || null,
  range: formData.range || null,
  abstract: formData.abstract || null,
  survey: formData.survey || null,
  quarterCalls: formData.quarterCalls || null,
  grossAcres: formData.grossAcres ? Number(formData.grossAcres) : null,
  netAcres: formData.netAcres ? Number(formData.netAcres) : null,
});

// Same query + cache key the Lease/Deed tract picker reads from (useLeases.ts / useDeeds.ts) —
// they now share one FETCH_TRACTS (this file owns it) so a save/delete here only needs to
// invalidate one cache entry to keep every consumer in sync.
export const useTracts = ({ config: _config, accountId }: UseTractsProps) => {
  const queryClient = useQueryClient();
  const queryKey = ["tracts"];
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const { data: rawTracts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as TractOption[];
    },
  });

  const tracts = useMemo(() => rawTracts.map(transformTract), [rawTracts]);

  const SEARCH_FIELDS = ["label", "tractTypeLabel", "tractNo", "stateCode", "countyName"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return tracts;
    const lower = searchTerm.toLowerCase();
    return tracts.filter((tract) =>
      SEARCH_FIELDS.some((fieldId) => tract[fieldId]?.toString().toLowerCase().includes(lower))
    );
  }, [tracts, searchTerm]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleSave = async (formData: Record<string, any>) => {
    try {
      const tract = buildTractInput(formData);
      if (view === "add") {
        await executeGraphQL(CREATE_TRACT_MUTATION, { accountId, tract });
      } else {
        await executeGraphQL(UPDATE_TRACT_MUTATION, { id: Number(selectedItem?.id), tract });
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
      await executeGraphQL(DELETE_TRACT_MUTATION, { id: Number(pendingDeleteItem.id) });
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
