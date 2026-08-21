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
import { executeGraphQL } from "../lib/api";

interface UseTractsProps {
  config: ModuleConfig;
  accountId: number;
}

// The single source of truth for "what fields does a tract have" — matches FETCH_TRACTS
// above and TractInput on the BE. buildTractInput (below) and transformTract build their
// write/read shapes from this instead of each hand-listing the same ~15 field names, so a
// field rename here is a compile error at both call sites instead of something that can
// silently drift out of sync. Also used by useLegalDescriptions.ts, which resolves each
// Deed/Lease/Well legal-description entry to a Tract row via the same buildTractInput.
export interface TractFields {
  tractNo?: string | null;
  tractLabel?: string | null;
  stateCode: string;
  countyName: string;
  tractType?: string | null;
  upi?: string | null;
  subSurvey?: string | null;
  legalDescription?: string | null;
  lotNo?: string | null;
  blockNo?: string | null;
  township?: string | null;
  surveyTownship?: string | null;
  section?: string | null;
  range?: string | null;
  abstract?: string | null;
  survey?: string | null;
  quarterCalls?: string | null;
  grossAcres?: number | null;
  netAcres?: number | null;
}

// A tract as loaded from FETCH_TRACTS: TractFields plus its id.
export interface TractOption extends TractFields {
  id: number;
}

// Tract has no single "name" column — build a display label from whatever identifying fields
// are set. Used by the standalone Tracts screen's list/search.
export const tractDisplayLabel = (tract: { id: number; tractNo?: string | null; tractLabel?: string | null; stateCode?: string | null; countyName?: string | null }): string =>
  tract.tractNo ||
  tract.tractLabel ||
  [tract.countyName, tract.stateCode].filter(Boolean).join(", ") ||
  `Tract #${tract.id}`;

const TRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRACT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

// A tract's own cross-references are read-only: the link is actually created from the
// Deed/Lease/Well side's Legal Description tab, not from here. FETCH_TRACTS carries these two
// relationships purely for display — same shape useDeedCrossReferences.ts /
// useLeaseCrossReferences.ts already read off Deed/Lease, just walked in reverse off Tract.
interface RawTract extends TractOption {
  leaseLinks?: { id: string | number; lease: { id: number; lessor?: string | null; lessee?: string | null } | null }[];
  titleDocumentLinks?: {
    id: string | number;
    titleDocument: {
      id: number;
      documentType?: string | null;
      conveyanceParties?: { role: string; name: string; sortOrder: number }[];
    } | null;
  }[];
}

const leaseLabel = (lease: any): string =>
  [lease?.lessor, lease?.lessee].filter(Boolean).join(" / ") || `Lease #${lease?.id}`;

// Mirrors useLeaseCrossReferences.ts's deedLabel: first grantor row (by sortOrder) named on
// the instrument, since title_document has no single "name" column of its own.
const deedLabel = (deed: any): string => {
  const grantor = (deed?.conveyanceParties || [])
    .filter((p: any) => p.role === "grantor")
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const type = deed?.documentType || "Deed";
  return grantor ? `${type} — ${grantor.name}` : `${type} #${deed?.id}`;
};

const transformTract = (tract: RawTract): Record<string, any> => ({
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
  _leaseLinks: (tract.leaseLinks || []).map((link) => ({
    id: String(link.id),
    name: leaseLabel(link.lease),
  })),
  _titleDocumentLinks: (tract.titleDocumentLinks || []).map((link) => ({
    id: String(link.id),
    name: deedLabel(link.titleDocument),
  })),
});

// Exported so resolveLegalDescriptionLinks (useLegalDescriptions.ts) can build the same
// GraphQL input for each inline-authored legal description without duplicating this mapping.
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
