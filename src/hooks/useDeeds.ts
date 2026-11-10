import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/contactsConfig";
import {
  FETCH_DEEDS,
  CREATE_DEED_MUTATION,
  UPDATE_DEED_MUTATION,
  DELETE_DEED_MUTATION,
  CREATE_DEED_ACQUISITION_MUTATION,
  UPDATE_DEED_ACQUISITION_MUTATION,
  DELETE_DEED_ACQUISITION_MUTATION,
} from "../graphql/Deeds";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { TractOption } from "./useTracts";
import { RecordationEntry } from "../../components/FormComponents/MultiRecordationField";
import { TractLinkEntry, transformTractLinks, buildTractLinkInputs } from "../../components/FormComponents/TractPickerField";
import {
  AcquisitionLinkValue,
  DeedAcquisitionLink,
  transformAcquisitionLinks,
} from "../../components/FormComponents/AcquisitionPickerField";
import type { ListSort } from "../../components/FormComponents/List";
import { executeGraphQL } from "../lib/api";

interface UseDeedsProps {
  config: ModuleConfig;
  accountId: number;
}

const buildRecordationInput = (entry: RecordationEntry) => ({
  stateCode: entry.state,
  countyName: entry.county,
  book: entry.book || null,
  volume: entry.volume || null,
  page: entry.page || null,
  instrumentNumber: entry.instrumentId || null,
  recordingDate: entry.recordingDate || null,
});

const transformRecordation = (rec: any): RecordationEntry => ({
  id: String(rec.id),
  state: rec.stateCode || "",
  county: rec.countyName || "",
  book: rec.book || "",
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

// A deed can cover several tracts: each distinct value once, in the deed's own tract order.
const joinTractValues = (tractLinks: any[] | undefined, key: "blockNo" | "section") => {
  const values = sortByOrder(tractLinks || []).map((link) => link.tract?.[key]?.trim());
  return [...new Set(values.filter(Boolean))].join(", ");
};

// created_at is naive UTC (the BE writes datetime.utcnow() and serializes it with no offset), and
// new Date() would read an offset-less timestamp as local time. Appending Z parses it as UTC, so
// the local getters below give the day it was added in the user's timezone. slice(0, 19) drops
// the microseconds, which aren't part of the date format browsers are required to parse.
const formatAddedOn = (createdAt?: string | null): string => {
  const ms = createdAt ? Date.parse(`${createdAt.slice(0, 19)}Z`) : NaN;
  if (Number.isNaN(ms)) return "";
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
};

const naturalOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const compareRaw = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Text columns sort as shown, in natural order (Section 2 before Section 10), with blanks last in
// either direction and ties newest-first. Added On sorts on the raw created_at rather than its
// MM/DD/YYYY text, since ISO timestamps already order chronologically as plain strings.
const sortDeeds = (deeds: Record<string, any>[], { column, direction }: ListSort) => {
  const sign = direction === "asc" ? 1 : -1;
  return [...deeds].sort((a, b) => {
    if (column === "addedOn") return sign * compareRaw(a._createdAt, b._createdAt);
    const newestFirst = compareRaw(b._createdAt, a._createdAt);
    const av = String(a[column] ?? "");
    const bv = String(b[column] ?? "");
    if (!av || !bv) return Number(!av) - Number(!bv) || newestFirst;
    return sign * naturalOrder.compare(av, bv) || newestFirst;
  });
};

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
    effectiveDate: deed.effectiveDate || "",
    acres: deed.acres ?? "",
    reservations: deed.reservations || "",
    notes: deed.notes || "",
    // List-only columns; the form never reads or saves these.
    blockNo: joinTractValues(deed.tracts, "blockNo"),
    section: joinTractValues(deed.tracts, "section"),
    addedOn: formatAddedOn(deed.createdAt),
    _createdAt: deed.createdAt || "",
    _recordation: (deed.recordations || []).map(transformRecordation),
    _tracts: transformTractLinks(deed.tracts),
    _conveyanceParties: parties,
    _acquisitionLinks: transformAcquisitionLinks(deed.acquisitionLinks),
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
  tracts: TractLinkEntry[],
  accountId: number,
  existingParties: any[],
) => ({
  accountId,
  documentType: formData.documentType || null,
  interestType: formData.interestType || null,
  conveyanceParties: buildConveyancePartyInputs(formData, existingParties),
  stateCode: formData.stateCode || null,
  countyName: formData.countyName || null,
  effectiveDate: formData.effectiveDate || null,
  acres: formData.acres ? Number(formData.acres) : null,
  reservations: formData.reservations || null,
  notes: formData.notes || null,
  recordations: recordation.map(buildRecordationInput),
  tractLinks: buildTractLinkInputs(tracts),
});

// Brings the deed's first acquisition link (the one the single-select picker shows) in line with
// the picker. Any further links, created elsewhere, are never touched.
const saveAcquisitionLink = async (
  deedId: number,
  existing: DeedAcquisitionLink | null,
  next: AcquisitionLinkValue,
  accountId: number,
) => {
  const acquisitionId = next.acquisitionId ? Number(next.acquisitionId) : null;
  const allocatedCost = next.allocatedCost === "" ? null : Number(next.allocatedCost);
  const createLink = (id: number) =>
    executeGraphQL(CREATE_DEED_ACQUISITION_MUTATION, { accountId, deedId, acquisitionId: id, allocatedCost });

  if (!existing) {
    if (acquisitionId != null) await createLink(acquisitionId);
    return;
  }
  if (acquisitionId === existing.acquisitionId) {
    if (allocatedCost === existing.allocatedCost) return;
    // updateDeedAcquisition ignores a null allocatedCost (the BE's _apply_scalar_updates skips
    // nulls), so clearing the cost falls through to delete + recreate instead.
    if (allocatedCost != null) {
      await executeGraphQL(UPDATE_DEED_ACQUISITION_MUTATION, { id: existing.id, allocatedCost });
      return;
    }
  }
  // Delete before create: re-adding the same acquisition would hit the BE's unique (deed,
  // acquisition) constraint, and a failed create then leaves no link, which the next save can
  // fix, rather than an extra hidden one the picker can't.
  await executeGraphQL(DELETE_DEED_ACQUISITION_MUTATION, { id: existing.id });
  if (acquisitionId != null) await createLink(acquisitionId);
};

const SEARCH_FIELDS = [
  "documentType", "grantor", "grantee", "interestType", "stateCode", "countyName", "blockNo", "section",
];

export const useDeeds = ({ config: _config, accountId }: UseDeedsProps) => {
  const queryClient = useQueryClient();
  const [view, setView] = useAtom(moduleViewAtom);
  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [sort, setSort] = useState<ListSort>({ column: "addedOn", direction: "desc" });
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

  // Same ["tracts"] query/cache key the standalone Tracts screen uses (useTracts.ts) — shares
  // one fetch/cache entry rather than each screen maintaining its own copy.
  const { data: availableTracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as TractOption[];
    },
  });

  const deeds = useMemo(() => rawDeeds.map(transformDeed), [rawDeeds]);

  const stateOptions = useMemo(() => {
    const states = new Set<string>(deeds.map((deed) => deed.stateCode).filter(Boolean));
    // Keeps the active choice listed, so the dropdown still shows it after its last deed is deleted.
    if (stateFilter) states.add(stateFilter);
    return [...states].sort();
  }, [deeds, stateFilter]);

  const filteredData = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    const matches = deeds.filter((deed) => {
      if (stateFilter && deed.stateCode !== stateFilter) return false;
      if (!searchTerm) return true;
      return SEARCH_FIELDS.some((fieldId) => {
        const value = deed[fieldId];
        if (Array.isArray(value)) return value.some((v) => v?.toString().toLowerCase().includes(lower));
        return value?.toString().toLowerCase().includes(lower);
      });
    });
    return sortDeeds(matches, sort);
  }, [deeds, searchTerm, stateFilter, sort]);

  // A newly clicked column starts A–Z, except Added On, which starts newest-first like the default.
  const handleSortChange = (column: string) =>
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: column === "addedOn" ? "desc" : "asc" },
    );

  const handleSave = async (
    formData: Record<string, any>,
    recordation: RecordationEntry[],
    tracts: TractLinkEntry[],
    acquisitionLink: AcquisitionLinkValue,
  ) => {
    // Keyed off an existing id rather than `view`: an add whose deed saved but whose acquisition
    // link didn't (below) stays open holding the new deed, so a retry must update, not re-create.
    let deedId: number | null = selectedItem?.id != null ? Number(selectedItem.id) : null;
    try {
      const variables = buildDeedMutationVariables(
        formData,
        recordation,
        tracts,
        accountId,
        selectedItem?._conveyanceParties || [],
      );
      if (deedId == null) {
        const result = await executeGraphQL(CREATE_DEED_MUTATION, variables);
        deedId = Number(result.createDeed.deed.id);
      } else {
        await executeGraphQL(UPDATE_DEED_MUTATION, { id: deedId, ...variables });
      }
    } catch (err) {
      setSaveError((err as Error).message);
      return;
    }

    let linkError: string | null = null;
    try {
      await saveAcquisitionLink(deedId, selectedItem?._acquisitionLinks?.[0] ?? null, acquisitionLink, accountId);
    } catch (err) {
      linkError = (err as Error).message;
    }

    // tractLinks changes tract_join rows — the same data the ["tracts"] cache's `joins`
    // field represents (Tract Picker's availableTracts, the standalone Tracts screen's
    // backlinks, and every record's Cross-References tab all read off it), so it needs
    // invalidating here too, not just ["deeds"].
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["deeds"] }),
      queryClient.invalidateQueries({ queryKey: ["tracts"] }),
    ]);

    if (linkError) {
      // Stay on the form, now holding the deed as saved, so a retry diffs against the links that
      // actually exist rather than the ones loaded before this save.
      const savedDeed = queryClient
        .getQueryData<any[]>(["deeds"])
        ?.find((deed) => Number(deed.id) === deedId);
      setSelectedItem(savedDeed ? transformDeed(savedDeed) : { ...selectedItem, id: deedId });
      setSaveError(`The deed was saved, but its Acquisition and Cost couldn't be: ${linkError}`);
      return;
    }
    setView("list");
    setSelectedItem(null);
  };

  const handleDelete = (item: Record<string, any>) => setPendingDeleteItem(item);

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await executeGraphQL(DELETE_DEED_MUTATION, { id: Number(pendingDeleteItem.id) });
      // Deleting a deed cascades its tract_join rows too — same reasoning as handleSave above.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["deeds"] }),
        queryClient.invalidateQueries({ queryKey: ["tracts"] }),
      ]);
    } catch (err) {
      setSaveError((err as Error).message);
    }
    setPendingDeleteItem(null);
  };

  return {
    loading: isLoading,
    view,
    searchTerm,
    stateFilter,
    stateOptions,
    sort,
    selectedItem,
    filteredData,
    availableTracts,
    saveError,
    clearSaveError: () => setSaveError(null),
    pendingDeleteItem,
    confirmDelete,
    cancelDelete: () => setPendingDeleteItem(null),
    setSearchTerm,
    setStateFilter,
    handleSortChange,
    handleAdd: () => { setSelectedItem(null); setView("add"); },
    handleEdit: (item: Record<string, any>) => { setSelectedItem(item); setView("edit"); },
    handleSave,
    handleDelete,
    handleCancel: () => { setView("list"); setSelectedItem(null); },
  };
};
