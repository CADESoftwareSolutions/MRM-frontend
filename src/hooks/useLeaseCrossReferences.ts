import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { CrossRefOption } from "../../components/FormComponents/CrossReferencePicker";
import { FETCH_WELLS } from "../graphql/Wells";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import { FETCH_DEEDS, CREATE_DEED_LEASE_MUTATION, DELETE_DEED_LEASE_MUTATION } from "../graphql/Deeds";
import {
  FETCH_LEASES,
  CREATE_LEASE_WELL_MUTATION,
  DELETE_LEASE_WELL_MUTATION,
  CREATE_LEASE_ACQUISITION_MUTATION,
  UPDATE_LEASE_ACQUISITION_MUTATION,
  DELETE_LEASE_ACQUISITION_MUTATION,
} from "../graphql/Leases";

export interface LinkedWell {
  id: string;
  wellId: number;
  name: string;
}

export interface LinkedAcquisition {
  id: string;
  acquisitionId: number;
  name: string;
  cost: number | null;
}

export interface LinkedDeed {
  id: string;
  deedId: number;
  name: string;
}

interface UseLeaseCrossReferencesProps {
  leaseId?: number | null;
  accountId: number;
}

// Deeds have no single "name" column — mirrors the grantor-first-row label useDeeds.ts derives
// for its own flat Grantor field, so a cross-referenced deed reads the same way here as it
// does on the Deeds screen itself.
const deedLabel = (deed: any): string => {
  const grantor = (deed?.conveyanceParties || [])
    .filter((p: any) => p.role === "grantor")
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const type = deed?.documentType || "Deed";
  return grantor ? `${type} — ${grantor.name}` : `${type} #${deed?.id}`;
};

// GraphQL's ID scalar (what well/acquisition/deed ids are declared as) serializes over the wire
// as a string even though the underlying column is an int — same reason TractPickerField keeps
// its own toTractId. Route every id through here so options/linked ids are actually numbers, not
// just typed as one, or Int-typed mutation variables like $wellId reject them at request time.
const toId = (id: unknown): number => Number(id);

// Same pattern as useDeedCrossReferences.ts: reuse the ["leases"]/["deeds"] queries useLeases.ts
// and useDeeds.ts already run on their pages instead of fetching a lease/deed by id separately,
// and invalidate those same keys after each link mutation to keep both in sync.
export const useLeaseCrossReferences = ({ leaseId, accountId }: UseLeaseCrossReferencesProps) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // The current lease's own linked rows (wellLinks/acquisitionLinks/titleDocumentLinks) —
  // reuses useLeases.ts's exact ["leases"] query/key rather than fetching this one lease separately.
  const { data: rawLeases = [] } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_LEASES);
      return result.leases as any[];
    },
    enabled: leaseId != null,
  });

  // Everything pickable in the three search boxes.
  const { data: wells = [] } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_WELLS);
      return result.wells as any[];
    },
    enabled: leaseId != null,
  });

  const { data: acquisitions = [] } = useQuery({
    queryKey: ["acquisitions"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_ACQUISITIONS);
      return result.acquisitions as any[];
    },
    enabled: leaseId != null,
  });

  const { data: deeds = [] } = useQuery({
    queryKey: ["deeds"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_DEEDS);
      return result.deeds as any[];
    },
    enabled: leaseId != null,
  });

  const currentLease = useMemo(
    () => rawLeases.find((lease) => Number(lease.id) === Number(leaseId)),
    [rawLeases, leaseId],
  );

  const linkedWells: LinkedWell[] = useMemo(
    () =>
      (currentLease?.wellLinks || []).map((w: any) => ({
        id: String(w.id),
        wellId: toId(w.well?.id),
        name: w.well?.name || `Well #${w.well?.id}`,
      })),
    [currentLease],
  );

  const linkedAcquisitions: LinkedAcquisition[] = useMemo(
    () =>
      (currentLease?.acquisitionLinks || []).map((a: any) => ({
        id: String(a.id),
        acquisitionId: toId(a.acquisition?.id),
        name: a.acquisition?.name || `Acquisition #${a.acquisition?.id}`,
        cost: a.allocatedCost ?? null,
      })),
    [currentLease],
  );

  const linkedDeeds: LinkedDeed[] = useMemo(
    () =>
      (currentLease?.titleDocumentLinks || []).map((d: any) => ({
        id: String(d.id),
        deedId: toId(d.titleDocument?.id),
        name: deedLabel(d.titleDocument),
      })),
    [currentLease],
  );

  const wellOptions: CrossRefOption[] = useMemo(
    () => wells.map((w: any) => ({ id: toId(w.id), label: w.name })),
    [wells],
  );
  const acquisitionOptions: CrossRefOption[] = useMemo(
    () => acquisitions.map((a: any) => ({ id: toId(a.id), label: a.name })),
    [acquisitions],
  );
  const deedOptions: CrossRefOption[] = useMemo(
    () => deeds.map((d: any) => ({ id: toId(d.id), label: deedLabel(d) })),
    [deeds],
  );

  const guardedRun = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addWell = (wellId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_LEASE_WELL_MUTATION, { accountId, leaseId, wellId: toId(wellId) });
    });

  const removeWell = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_LEASE_WELL_MUTATION, { id: Number(id) });
    });

  const addAcquisition = (acquisitionId: number, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_LEASE_ACQUISITION_MUTATION, {
        accountId,
        leaseId,
        acquisitionId: toId(acquisitionId),
        allocatedCost: cost,
      });
    });

  const updateAcquisitionCost = (id: string, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(UPDATE_LEASE_ACQUISITION_MUTATION, { id: Number(id), allocatedCost: cost });
    });

  const removeAcquisition = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_LEASE_ACQUISITION_MUTATION, { id: Number(id) });
    });

  const addDeed = (deedId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_LEASE_MUTATION, { accountId, deedId: toId(deedId), leaseId });
    });

  const removeDeed = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_LEASE_MUTATION, { id: Number(id) });
    });

  return {
    error,
    clearError: () => setError(null),
    linkedWells,
    linkedAcquisitions,
    linkedDeeds,
    wellOptions,
    acquisitionOptions,
    deedOptions,
    addWell,
    removeWell,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
    addDeed,
    removeDeed,
  };
};

export default useLeaseCrossReferences;
