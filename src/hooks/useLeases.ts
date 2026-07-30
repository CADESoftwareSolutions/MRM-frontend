import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_LEASES,
  CREATE_LEASE_MUTATION,
  UPDATE_LEASE_MUTATION,
  DELETE_LEASE_MUTATION,
} from "../graphql/Leases";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { RecordationEntry } from "../../components/FormComponents/MultiRecordationField";
import { TractLinkEntry, transformTractLinks, buildTractLinkInputs } from "../../components/FormComponents/TractPickerField";
import { executeGraphQL } from "../lib/api";

interface UseLeasesProps {
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

const PROVISION_LABEL_TO_TYPE: Record<string, string> = {
  "Shut-In": "shut_in",
  "Option to Extend": "option_to_extend",
  "Continuous Development": "continuous_development",
  "Horizontal Pugh": "horizontal_pugh",
  "Vertical Pugh": "vertical_pugh",
  "Mother Hubbard": "mother_hubbard",
  "Pooling": "pooling",
  "Offset": "offset",
  "Title Records": "title_records",
  "Consent to Assign": "consent_to_assign",
};

const PROVISION_TYPE_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PROVISION_LABEL_TO_TYPE).map(([label, type]) => [type, label])
);

// The BE stores one row per provision type with a shared set of generic detail columns —
// not a dedicated boolean/field-set per provision type. Only the five types listed here carry
// any extra detail; the rest (horizontal/vertical pugh, mother hubbard, pooling, title records)
// are pure enabled flags with no fields of their own.
const PROVISION_DETAIL_FIELDS: Record<string, string[]> = {
  shut_in: ["periodValue", "periodUnit", "paymentPerAcre", "paymentFrequency"],
  option_to_extend: ["extendDurationValue", "extendDurationUnit"],
  continuous_development: ["timeBetweenCompletionValue", "timeBetweenCompletionUnit"],
  offset: ["offsetDistance"],
  consent_to_assign: ["consentType"],
};

const NUMERIC_PROVISION_FIELDS = new Set([
  "periodValue",
  "paymentPerAcre",
  "extendDurationValue",
  "timeBetweenCompletionValue",
]);

const transformProvisions = (provisions: any[]) => {
  const formValues: Record<string, any> = {};
  const enabledLabels: string[] = [];

  for (const provision of provisions) {
    if (!provision.isEnabled) continue;
    const label = PROVISION_TYPE_TO_LABEL[provision.provisionType];
    if (label) enabledLabels.push(label);

    for (const fieldId of PROVISION_DETAIL_FIELDS[provision.provisionType] || []) {
      formValues[fieldId] = provision[fieldId] ?? "";
    }
  }

  formValues.provisions = enabledLabels;
  return formValues;
};

const buildProvisionInputs = (formData: Record<string, any>): object[] => {
  const selectedLabels: string[] = formData.provisions || [];
  const selectedTypes = new Set(
    selectedLabels.map((label) => PROVISION_LABEL_TO_TYPE[label]).filter(Boolean)
  );

  return Array.from(selectedTypes).map((provisionType) => {
    const detail: Record<string, any> = {};
    for (const fieldId of PROVISION_DETAIL_FIELDS[provisionType] || []) {
      const raw = formData[fieldId];
      detail[fieldId] = raw ? (NUMERIC_PROVISION_FIELDS.has(fieldId) ? Number(raw) : raw) : null;
    }
    return { provisionType, isEnabled: true, ...detail };
  });
};

const transformLease = (lease: any): Record<string, any> => {
  const provisionFormValues = transformProvisions(lease.provisions || []);

  return {
    id: lease.id,
    leaseType: lease.leaseType || "",
    paymentType: lease.paymentType || "",
    parentLeaseId: lease.parentLeaseId ?? null,
    lessor: lease.lessor || "",
    lessee: lease.lessee || "",
    effectiveDate: lease.effectiveDate || "",
    primaryTermEndDate: lease.primaryTermEndDate || "",
    primaryTermValue: lease.primaryTermValue ?? "",
    primaryTermUnit: lease.primaryTermUnit || "",
    royaltyFractionNumerator: lease.royaltyFractionNumerator ?? "",
    royaltyFractionDenominator: lease.royaltyFractionDenominator ?? "",
    royaltyOfRoyaltyNumerator: lease.royaltyOfRoyaltyNumerator ?? "",
    royaltyOfRoyaltyDenominator: lease.royaltyOfRoyaltyDenominator ?? "",
    status: lease.status || "",
    stateCode: lease.stateCode || "",
    countyName: lease.countyName || "",
    acres: lease.acres ?? "",
    costFree: lease.costFree ? "Yes" : "No",
    paidUpBonus: lease.paidUpBonus ?? "",
    paidUpBonusReceived: lease.paidUpBonusReceived ? "Yes" : "No",
    bonusPerAcre: lease.bonusPerAcre ?? "",
    delayRentalAmount: lease.delayRentalAmount ?? "",
    delayRentalPerAcre: lease.delayRentalPerAcre ?? "",
    delayRentalFrequency: lease.delayRentalFrequency || "",
    surfaceRights: lease.surfaceRights ? "Yes" : "No",
    notes: lease.notes || "",
    ...provisionFormValues,
    _recordation: (lease.recordations || []).map(transformRecordation),
    _tractLinks: transformTractLinks(lease.tracts),
  };
};

const buildLeaseMutationVariables = (
  formData: Record<string, any>,
  recordation: RecordationEntry[],
  tractLinks: TractLinkEntry[],
  accountId: number,
) => ({
  accountId,
  leaseType: formData.leaseType || null,
  paymentType: formData.paymentType,
  parentLeaseId: formData.parentLeaseId ? Number(formData.parentLeaseId) : null,
  lessor: formData.lessor || null,
  lessee: formData.lessee || null,
  effectiveDate: formData.effectiveDate,
  primaryTermEndDate: formData.primaryTermEndDate || null,
  primaryTermValue: formData.primaryTermValue ? Number(formData.primaryTermValue) : null,
  primaryTermUnit: formData.primaryTermUnit || null,
  royaltyFractionNumerator: formData.royaltyFractionNumerator ? Number(formData.royaltyFractionNumerator) : null,
  royaltyFractionDenominator: formData.royaltyFractionDenominator ? Number(formData.royaltyFractionDenominator) : null,
  royaltyOfRoyaltyNumerator: formData.royaltyOfRoyaltyNumerator ? Number(formData.royaltyOfRoyaltyNumerator) : null,
  royaltyOfRoyaltyDenominator: formData.royaltyOfRoyaltyDenominator ? Number(formData.royaltyOfRoyaltyDenominator) : null,
  royaltyPercent: (formData.royaltyFractionNumerator && formData.royaltyFractionDenominator)
    ? Number(formData.royaltyFractionNumerator) / Number(formData.royaltyFractionDenominator)
    : null,
  status: formData.status,
  stateCode: formData.stateCode || null,
  countyName: formData.countyName || null,
  acres: formData.acres ? Number(formData.acres) : null,
  costFree: formData.costFree === "Yes",
  paidUpBonus: formData.paidUpBonus ? Number(formData.paidUpBonus) : null,
  paidUpBonusReceived: formData.paidUpBonusReceived === "Yes",
  bonusPerAcre: formData.bonusPerAcre ? Number(formData.bonusPerAcre) : null,
  delayRentalAmount: formData.delayRentalAmount ? Number(formData.delayRentalAmount) : null,
  delayRentalPerAcre: formData.delayRentalPerAcre ? Number(formData.delayRentalPerAcre) : null,
  delayRentalFrequency: formData.delayRentalFrequency || null,
  surfaceRights: formData.surfaceRights === "Yes",
  notes: formData.notes || null,
  recordations: recordation.map(buildRecordationInput),
  provisions: buildProvisionInputs(formData),
  tractLinks: buildTractLinkInputs(tractLinks),
});

export const useLeases = ({ config: _config, accountId }: UseLeasesProps) => {
  const queryClient = useQueryClient();
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const { data: rawLeases = [], isLoading } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_LEASES);
      return result.leases as any[];
    },
  });

  const { data: availableTracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as any[];
    },
  });

  const leases = useMemo(() => rawLeases.map(transformLease), [rawLeases]);

  const SEARCH_FIELDS = ["lessor", "lessee", "status", "stateCode", "countyName", "leaseType", "paymentType", "effectiveDate"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return leases;
    const lower = searchTerm.toLowerCase();
    return leases.filter((lease) =>
      SEARCH_FIELDS.some((fieldId) => {
        const value = lease[fieldId];
        if (Array.isArray(value)) return value.some((v) => v?.toString().toLowerCase().includes(lower));
        return value?.toString().toLowerCase().includes(lower);
      })
    );
  }, [leases, searchTerm]);

  const handleSave = async (
    formData: Record<string, any>,
    recordation: RecordationEntry[],
    tractLinks: TractLinkEntry[],
  ) => {
    try {
      const variables = buildLeaseMutationVariables(formData, recordation, tractLinks, accountId);
      if (view === "add") {
        await executeGraphQL(CREATE_LEASE_MUTATION, variables);
      } else {
        await executeGraphQL(UPDATE_LEASE_MUTATION, { id: Number(selectedItem?.id), ...variables });
      }
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
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
      await executeGraphQL(DELETE_LEASE_MUTATION, { id: Number(pendingDeleteItem.id) });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
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
