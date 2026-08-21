import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { CrossRefOption } from "../../components/FormComponents/CrossReferencePicker";
import { FETCH_PARTIES } from "../graphql/Directory";
import { FETCH_LEASES } from "../graphql/Leases";
import { FETCH_WELLS } from "../graphql/Wells";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import {
  FETCH_DEEDS,
  CREATE_DEED_PARTY_MUTATION,
  DELETE_DEED_PARTY_MUTATION,
  CREATE_DEED_LEASE_MUTATION,
  DELETE_DEED_LEASE_MUTATION,
  CREATE_DEED_WELL_MUTATION,
  DELETE_DEED_WELL_MUTATION,
  CREATE_DEED_ACQUISITION_MUTATION,
  UPDATE_DEED_ACQUISITION_MUTATION,
  DELETE_DEED_ACQUISITION_MUTATION,
} from "../graphql/Deeds";

export interface LinkedParty {
  id: string;
  partyId: number;
  name: string;
}

export interface LinkedLease {
  id: string;
  leaseId: number;
  name: string;
}

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

interface UseDeedCrossReferencesProps {
  deedId?: number | null;
  accountId: number;
}

const leaseLabel = (lease: any): string =>
  [lease?.lessor, lease?.lessee].filter(Boolean).join(" / ") || `Lease #${lease?.id}`;

// GraphQL's ID scalar (what party/lease/well/acquisition ids are declared as) serializes over
// the wire as a string even though the underlying column is an int. Route every id through here
// so options/linked ids are actually numbers, not just typed as one, or Int-typed mutation
// variables like $wellId reject them at request time.
const toId = (id: unknown): number => Number(id);

// Deeds are already loaded on this page via useDeeds' identical ["deeds"] query — reusing the
// same key/queryFn just subscribes to that cache instead of firing a second request, and
// invalidating it here keeps both in sync without threading state back up through the page.
export const useDeedCrossReferences = ({ deedId, accountId }: UseDeedCrossReferencesProps) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // The current deed's own linked rows (parties/leaseLinks/wellLinks/acquisitionLinks) —
  // reuses useDeeds.ts's exact ["deeds"] query/key rather than fetching this one deed separately.
  const { data: rawDeeds = [] } = useQuery({
    queryKey: ["deeds"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_DEEDS);
      return result.deeds as any[];
    },
    enabled: deedId != null,
  });

  // Everything pickable in the four search boxes.
  const { data: parties = [] } = useQuery({
    queryKey: ["parties", accountId],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });
      return result.parties as any[];
    },
    enabled: deedId != null && !!accountId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_LEASES);
      return result.leases as any[];
    },
    enabled: deedId != null,
  });

  const { data: wells = [] } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_WELLS);
      return result.wells as any[];
    },
    enabled: deedId != null,
  });

  const { data: acquisitions = [] } = useQuery({
    queryKey: ["acquisitions"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_ACQUISITIONS);
      return result.acquisitions as any[];
    },
    enabled: deedId != null,
  });

  const currentDeed = useMemo(
    () => rawDeeds.find((deed) => Number(deed.id) === Number(deedId)),
    [rawDeeds, deedId],
  );

  const linkedParties: LinkedParty[] = useMemo(
    () =>
      (currentDeed?.parties || []).map((p: any) => ({
        id: String(p.id),
        partyId: toId(p.party?.id),
        name: p.party?.nameFull || `Party #${p.party?.id}`,
      })),
    [currentDeed],
  );

  const linkedLeases: LinkedLease[] = useMemo(
    () =>
      (currentDeed?.leaseLinks || []).map((l: any) => ({
        id: String(l.id),
        leaseId: toId(l.lease?.id),
        name: leaseLabel(l.lease),
      })),
    [currentDeed],
  );

  const linkedWells: LinkedWell[] = useMemo(
    () =>
      (currentDeed?.wellLinks || []).map((w: any) => ({
        id: String(w.id),
        wellId: toId(w.well?.id),
        name: w.well?.name || `Well #${w.well?.id}`,
      })),
    [currentDeed],
  );

  const linkedAcquisitions: LinkedAcquisition[] = useMemo(
    () =>
      (currentDeed?.acquisitionLinks || []).map((a: any) => ({
        id: String(a.id),
        acquisitionId: toId(a.acquisition?.id),
        name: a.acquisition?.name || `Acquisition #${a.acquisition?.id}`,
        cost: a.allocatedCost ?? null,
      })),
    [currentDeed],
  );

  const partyOptions: CrossRefOption[] = useMemo(
    () => parties.map((p: any) => ({ id: toId(p.id), label: p.nameFull })),
    [parties],
  );
  const leaseOptions: CrossRefOption[] = useMemo(
    () => leases.map((l: any) => ({ id: toId(l.id), label: leaseLabel(l) })),
    [leases],
  );
  const wellOptions: CrossRefOption[] = useMemo(
    () => wells.map((w: any) => ({ id: toId(w.id), label: w.name })),
    [wells],
  );
  const acquisitionOptions: CrossRefOption[] = useMemo(
    () => acquisitions.map((a: any) => ({ id: toId(a.id), label: a.name })),
    [acquisitions],
  );

  const guardedRun = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["deeds"] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addParty = (partyId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_PARTY_MUTATION, {
        accountId,
        deedId,
        partyId: toId(partyId),
        role: "cross_reference",
      });
    });

  const removeParty = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_PARTY_MUTATION, { id: Number(id) });
    });

  const addLease = (leaseId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_LEASE_MUTATION, { accountId, deedId, leaseId: toId(leaseId) });
    });

  const removeLease = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_LEASE_MUTATION, { id: Number(id) });
    });

  const addWell = (wellId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_WELL_MUTATION, { accountId, deedId, wellId: toId(wellId) });
    });

  const removeWell = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_WELL_MUTATION, { id: Number(id) });
    });

  const addAcquisition = (acquisitionId: number, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_ACQUISITION_MUTATION, {
        accountId,
        deedId,
        acquisitionId: toId(acquisitionId),
        allocatedCost: cost,
      });
    });

  const updateAcquisitionCost = (id: string, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(UPDATE_DEED_ACQUISITION_MUTATION, { id: Number(id), allocatedCost: cost });
    });

  const removeAcquisition = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_ACQUISITION_MUTATION, { id: Number(id) });
    });

  return {
    error,
    clearError: () => setError(null),
    linkedParties,
    linkedLeases,
    linkedWells,
    linkedAcquisitions,
    partyOptions,
    leaseOptions,
    wellOptions,
    acquisitionOptions,
    addParty,
    removeParty,
    addLease,
    removeLease,
    addWell,
    removeWell,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
  };
};

export default useDeedCrossReferences;
