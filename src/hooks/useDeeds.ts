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
import { RecordationEntry } from "../../components/FormComponents/MultiRecordationField";
import { LegalDescriptionEntry } from "../../components/FormComponents/LegalDescriptionListField";
import { transformLegalDescriptions, buildLegalDescriptionInputs } from "./useLegalDescriptions";
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

// Backend stores grantor/grantee as title_document_conveyance_party rows (multi-grantee).
// FE still edits a single flat grantor + grantee pair, so we surface the first row per role
// and keep the raw list around in _conveyanceParties to avoid dropping extra rows on save.
const sortByOrder = (parties: any[]) =>
  [...parties].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const partyByRole = (parties: any[], role: string) =>
  sortByOrder(parties.filter((p) => p.role === role));

const transformDeed = (deed: any): Record<string, any> => {
  const parties = deed.conveyanceParties || [];
  const grantors = partyByRole(parties, "grantor");
  const grantees = partyByRole(parties, "grantee");
  return {
    id: deed.id,
    documentType: deed.documentType || "",
    interestType: deed.interestType || "",
    grantor: grantors[0]?.name || "",
    grantorInterestConveyed: grantors[0]?.interest || "",
    grantee: grantees[0]?.name || "",
    granteeInterestReceived: grantees[0]?.interest || "",
    stateCode: deed.stateCode || "",
    countyName: deed.countyName || "",
    consideration: deed.consideration ?? "",
    acres: deed.acres ?? "",
    reservations: deed.reservations || "",
    notes: deed.notes || "",
    _recordation: (deed.recordations || []).map(transformRecordation),
    _legalDescriptions: transformLegalDescriptions(deed.legalDescriptions),
    _conveyanceParties: parties,
  };
};

// Only index 0 of each role is editable via the flat form fields; any additional
// rows (multi-grantee deeds) are passed through unchanged so saving doesn't delete them.
const buildConveyancePartyInputs = (
  formData: Record<string, any>,
  existingParties: any[],
) => {
  const buildRole = (role: string, name: string, interest: string) => {
    const rest = partyByRole(existingParties, role).slice(1);
    const entries: any[] = [];
    if (name) entries.push({ role, name, interest: interest || null, sortOrder: 0 });
    rest.forEach((p, i) =>
      entries.push({ role, name: p.name, interest: p.interest || null, sortOrder: i + 1 })
    );
    return entries;
  };

  return [
    ...buildRole("grantor", formData.grantor, formData.grantorInterestConveyed),
    ...buildRole("grantee", formData.grantee, formData.granteeInterestReceived),
  ];
};

const buildDeedMutationVariables = (
  formData: Record<string, any>,
  recordation: RecordationEntry[],
  legalDescriptions: LegalDescriptionEntry[],
  accountId: number,
  existingParties: any[],
) => ({
  accountId,
  documentType: formData.documentType || null,
  interestType: formData.interestType || null,
  conveyanceParties: buildConveyancePartyInputs(formData, existingParties),
  stateCode: formData.stateCode || null,
  countyName: formData.countyName || null,
  consideration: formData.consideration ? Number(formData.consideration) : null,
  acres: formData.acres ? Number(formData.acres) : null,
  reservations: formData.reservations || null,
  notes: formData.notes || null,
  recordations: recordation.map(buildRecordationInput),
  legalDescriptions: buildLegalDescriptionInputs(legalDescriptions),
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

  const deeds = useMemo(() => rawDeeds.map(transformDeed), [rawDeeds]);

  const SEARCH_FIELDS = ["documentType", "grantor", "grantee", "interestType", "stateCode", "countyName"];

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
    legalDescriptions: LegalDescriptionEntry[],
  ) => {
    try {
      const variables = buildDeedMutationVariables(
        formData,
        recordation,
        legalDescriptions,
        accountId,
        selectedItem?._conveyanceParties || [],
      );
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
