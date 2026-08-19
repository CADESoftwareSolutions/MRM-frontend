import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_DEEDS,
  CREATE_DEED_MUTATION,
  UPDATE_DEED_MUTATION,
  DELETE_DEED_MUTATION,
} from "../graphql/Deeds";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { RecordationEntry } from "../../components/FormComponents/MultiRecordationField";
import { TractLinkEntry, TractOption, transformTractLinks, buildTractLinkInputs } from "../../components/FormComponents/TractPickerField";
import { executeGraphQL } from "../lib/api";

interface UseDeedsProps {
  config: ModuleConfig;
  accountId: number;
}

const buildRecordationInput = (entry: RecordationEntry) => ({
  stateCode: entry.state,
  countyName: entry.county,
  volume: entry.volume || null,
  page: entry.page || null,
  instrumentNumber: entry.instrumentId || null,
  recordingDate: entry.recordingDate || null,
});

const transformRecordation = (rec: any): RecordationEntry => ({
  id: String(rec.id),
  state: rec.stateCode || "",
  county: rec.countyName || "",
  volume: rec.volume || "",
  page: rec.page || "",
  instrumentId: rec.instrumentNumber || "",
  recordingDate: rec.recordingDate || "",
});

const transformDeed = (deed: any): Record<string, any> => ({
  id: deed.id,
  documentType: deed.documentType || "",
  interestType: deed.interestType || "",
  grantor: deed.grantor || "",
  grantorInterestConveyed: deed.grantorInterestConveyed || "",
  grantee: deed.grantee || "",
  granteeInterestReceived: deed.granteeInterestReceived || "",
  effectiveDate: deed.effectiveDate || "",
  executedDate: deed.executedDate || "",
  consideration: deed.consideration ?? "",
  acres: deed.acres ?? "",
  reservations: deed.reservations || "",
  notes: deed.notes || "",
  _recordation: (deed.recordations || []).map(transformRecordation),
  _tractLinks: transformTractLinks(deed.tracts),
});

const buildDeedMutationVariables = (
  formData: Record<string, any>,
  recordation: RecordationEntry[],
  tractLinks: TractLinkEntry[],
  accountId: number,
) => ({
  accountId,
  documentType: formData.documentType || null,
  interestType: formData.interestType || null,
  grantor: formData.grantor || null,
  grantorInterestConveyed: formData.grantorInterestConveyed || null,
  grantee: formData.grantee || null,
  granteeInterestReceived: formData.granteeInterestReceived || null,
  effectiveDate: formData.effectiveDate || null,
  executedDate: formData.executedDate || null,
  consideration: formData.consideration ? Number(formData.consideration) : null,
  acres: formData.acres ? Number(formData.acres) : null,
  reservations: formData.reservations || null,
  notes: formData.notes || null,
  recordations: recordation.map(buildRecordationInput),
  tractLinks: buildTractLinkInputs(tractLinks),
});

export const useDeeds = ({ config: _config, accountId }: UseDeedsProps) => {
  const queryClient = useQueryClient();
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const { data: rawDeeds = [], isLoading } = useQuery({
    queryKey: ["deeds"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_DEEDS);
      return result.deeds as any[];
    },
  });

  const { data: availableTracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as TractOption[];
    },
  });

  const deeds = useMemo(() => rawDeeds.map(transformDeed), [rawDeeds]);

  const SEARCH_FIELDS = ["documentType", "grantor", "grantee", "interestType", "effectiveDate"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return deeds;
    const lower = searchTerm.toLowerCase();
    return deeds.filter((deed) =>
      SEARCH_FIELDS.some((fieldId) => {
        const value = deed[fieldId];
        if (Array.isArray(value)) return value.some((v) => v?.toString().toLowerCase().includes(lower));
        return value?.toString().toLowerCase().includes(lower);
      })
    );
  }, [deeds, searchTerm]);

  const handleSave = async (
    formData: Record<string, any>,
    recordation: RecordationEntry[],
    tractLinks: TractLinkEntry[],
  ) => {
    try {
      const variables = buildDeedMutationVariables(formData, recordation, tractLinks, accountId);
      if (view === "add") {
        await executeGraphQL(CREATE_DEED_MUTATION, variables);
      } else {
        await executeGraphQL(UPDATE_DEED_MUTATION, { id: Number(selectedItem?.id), ...variables });
      }
      await queryClient.invalidateQueries({ queryKey: ["deeds"] });
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
      await executeGraphQL(DELETE_DEED_MUTATION, { id: Number(pendingDeleteItem.id) });
      await queryClient.invalidateQueries({ queryKey: ["deeds"] });
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
    availableTracts,
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
