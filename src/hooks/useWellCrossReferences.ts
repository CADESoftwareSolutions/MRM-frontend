import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { CrossRefOption } from "../../components/FormComponents/CrossReferencePicker";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { tractDisplayLabel } from "./useTracts";
import {
  FETCH_LEASES,
  CREATE_LEASE_WELL_MUTATION,
  DELETE_LEASE_WELL_MUTATION,
} from "../graphql/Leases";
import {
  FETCH_DEEDS,
  CREATE_DEED_WELL_MUTATION,
  DELETE_DEED_WELL_MUTATION,
} from "../graphql/Deeds";
import {
  FETCH_WELLS,
  CREATE_WELL_ACQUISITION_MUTATION,
  UPDATE_WELL_ACQUISITION_MUTATION,
  DELETE_WELL_ACQUISITION_MUTATION,
} from "../graphql/Wells";
import {
  FETCH_CROSS_REFERENCE_LINKS,
  CREATE_CROSS_REFERENCE_LINK_MUTATION,
  DELETE_CROSS_REFERENCE_LINK_MUTATION,
} from "../graphql/CrossReferenceLinks";

export interface LinkedTract {
  id: string;
  tractId: number;
  name: string;
}

export interface LinkedWell {
  id: string;
  wellId: number;
  name: string;
}

export interface LinkedLease {
  id: string;
  leaseId: number;
  name: string;
}

export interface LinkedDeed {
  id: string;
  deedId: number;
  name: string;
}

export interface LinkedAcquisition {
  id: string;
  acquisitionId: number;
  name: string;
  cost: number | null;
}

interface UseWellCrossReferencesProps {
  wellId?: number | null;
  accountId: number;
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

const wellLabel = (well: any): string => well?.name || `Well #${well?.id}`;

// GraphQL's ID scalar serializes over the wire as a string even though the underlying column is
// an int. Route every id through here so options/linked ids are actually numbers, or Int-typed
// mutation variables like $leaseId reject them at request time.
const toId = (id: unknown): number => Number(id);

// A CrossReferenceLink row is a canonicalized, unordered (typeA,idA)/(typeB,idB) pair — this
// well could be on either side depending on which type sorted first. Returns whichever side
// isn't "this well".
const otherSide = (link: any, selfId: number): { type: string; id: number } => {
  if (link.entityTypeA === "well" && toId(link.entityIdA) === selfId) {
    return { type: link.entityTypeB, id: toId(link.entityIdB) };
  }
  return { type: link.entityTypeA, id: toId(link.entityIdA) };
};

// Same pattern as useLeaseCrossReferences.ts/useDeedCrossReferences.ts: reuse the ["wells"] query
// useWells.ts already runs on its page instead of fetching this one well separately, and
// invalidate it after each link mutation to keep both in sync. Lease/Deed links are the exact
// same lease_well/title_document_well rows Lease's and Deed's own tabs create — just created here
// with this well's id as wellId instead of leaseId/deedId.
export const useWellCrossReferences = ({ wellId, accountId }: UseWellCrossReferencesProps) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: rawWells = [] } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_WELLS);
      return result.wells as any[];
    },
    enabled: wellId != null,
  });

  // well<->tract and well<->well links live in the generic cross_reference_link table, not on
  // WellType itself (no relationship() there — see graphql_cross_reference_mutations.py), so
  // this is its own top-level query rather than nested in the ["wells"] one above.
  const { data: crossReferenceLinks = [] } = useQuery({
    queryKey: ["crossReferenceLinks", "well", wellId],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_CROSS_REFERENCE_LINKS, { entityType: "well", entityId: wellId });
      return result.crossReferenceLinks as any[];
    },
    enabled: wellId != null,
  });

  // Everything pickable in the five search boxes.
  const { data: tracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as any[];
    },
    enabled: wellId != null,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_LEASES);
      return result.leases as any[];
    },
    enabled: wellId != null,
  });

  const { data: deeds = [] } = useQuery({
    queryKey: ["deeds"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_DEEDS);
      return result.deeds as any[];
    },
    enabled: wellId != null,
  });

  const { data: acquisitions = [] } = useQuery({
    queryKey: ["acquisitions"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_ACQUISITIONS);
      return result.acquisitions as any[];
    },
    enabled: wellId != null,
  });

  const currentWell = useMemo(
    () => rawWells.find((well) => Number(well.id) === Number(wellId)),
    [rawWells, wellId],
  );

  const tractsById = useMemo(() => new Map(tracts.map((t: any) => [toId(t.id), t])), [tracts]);
  const wellsById = useMemo(() => new Map(rawWells.map((w: any) => [toId(w.id), w])), [rawWells]);

  const resolvedCrossReferenceLinks = useMemo(
    () => crossReferenceLinks.map((link: any) => ({ link, other: otherSide(link, Number(wellId)) })),
    [crossReferenceLinks, wellId],
  );

  const linkedTracts: LinkedTract[] = useMemo(
    () =>
      resolvedCrossReferenceLinks
        .filter(({ other }) => other.type === "tract")
        .map(({ link, other }) => {
          const tract = tractsById.get(other.id);
          return {
            id: String(link.id),
            tractId: other.id,
            name: tract ? tractDisplayLabel(tract) : `Tract #${other.id}`,
          };
        }),
    [resolvedCrossReferenceLinks, tractsById],
  );

  const linkedWells: LinkedWell[] = useMemo(
    () =>
      resolvedCrossReferenceLinks
        .filter(({ other }) => other.type === "well")
        .map(({ link, other }) => {
          const otherWell = wellsById.get(other.id);
          return {
            id: String(link.id),
            wellId: other.id,
            name: otherWell ? wellLabel(otherWell) : `Well #${other.id}`,
          };
        }),
    [resolvedCrossReferenceLinks, wellsById],
  );

  const linkedLeases: LinkedLease[] = useMemo(
    () =>
      (currentWell?.leaseLinks || []).map((l: any) => ({
        id: String(l.id),
        leaseId: toId(l.lease?.id),
        name: leaseLabel(l.lease),
      })),
    [currentWell],
  );

  const linkedDeeds: LinkedDeed[] = useMemo(
    () =>
      (currentWell?.titleDocumentLinks || []).map((d: any) => ({
        id: String(d.id),
        deedId: toId(d.titleDocument?.id),
        name: deedLabel(d.titleDocument),
      })),
    [currentWell],
  );

  const linkedAcquisitions: LinkedAcquisition[] = useMemo(
    () =>
      (currentWell?.acquisitionLinks || []).map((a: any) => ({
        id: String(a.id),
        acquisitionId: toId(a.acquisition?.id),
        name: a.acquisition?.name || `Acquisition #${a.acquisition?.id}`,
        cost: a.allocatedCost ?? null,
      })),
    [currentWell],
  );

  const tractOptions: CrossRefOption[] = useMemo(
    () => tracts.map((t: any) => ({ id: toId(t.id), label: tractDisplayLabel(t) })),
    [tracts],
  );
  // Same-type: excludes this well itself in addition to whatever's already linked (handled by
  // the picker's excludeIds prop below) — you can't cross-reference a well to itself.
  const wellOptions: CrossRefOption[] = useMemo(
    () =>
      rawWells
        .filter((w: any) => toId(w.id) !== Number(wellId))
        .map((w: any) => ({ id: toId(w.id), label: wellLabel(w) })),
    [rawWells, wellId],
  );
  const leaseOptions: CrossRefOption[] = useMemo(
    () => leases.map((l: any) => ({ id: toId(l.id), label: leaseLabel(l) })),
    [leases],
  );
  const deedOptions: CrossRefOption[] = useMemo(
    () => deeds.map((d: any) => ({ id: toId(d.id), label: deedLabel(d) })),
    [deeds],
  );
  const acquisitionOptions: CrossRefOption[] = useMemo(
    () => acquisitions.map((a: any) => ({ id: toId(a.id), label: a.name })),
    [acquisitions],
  );

  const guardedRun = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["wells"] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // well<->tract and well<->well links aren't nested on WellType (see the crossReferenceLinks
  // query above), so invalidating ["wells"] wouldn't refresh them — this invalidates their own
  // query key instead.
  const guardedRunGeneric = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["crossReferenceLinks", "well", wellId] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addTract = (tractId: number) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(CREATE_CROSS_REFERENCE_LINK_MUTATION, {
        accountId,
        entityTypeA: "well",
        entityIdA: wellId,
        entityTypeB: "tract",
        entityIdB: toId(tractId),
      });
    });

  const removeTract = (id: string) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(DELETE_CROSS_REFERENCE_LINK_MUTATION, { id: Number(id) });
    });

  const addWell = (otherWellId: number) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(CREATE_CROSS_REFERENCE_LINK_MUTATION, {
        accountId,
        entityTypeA: "well",
        entityIdA: wellId,
        entityTypeB: "well",
        entityIdB: toId(otherWellId),
      });
    });

  const removeWell = (id: string) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(DELETE_CROSS_REFERENCE_LINK_MUTATION, { id: Number(id) });
    });

  const addLease = (leaseId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_LEASE_WELL_MUTATION, { accountId, leaseId: toId(leaseId), wellId });
    });

  const removeLease = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_LEASE_WELL_MUTATION, { id: Number(id) });
    });

  const addDeed = (deedId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_WELL_MUTATION, { accountId, deedId: toId(deedId), wellId });
    });

  const removeDeed = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_WELL_MUTATION, { id: Number(id) });
    });

  const addAcquisition = (acquisitionId: number, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_WELL_ACQUISITION_MUTATION, {
        accountId,
        wellId,
        acquisitionId: toId(acquisitionId),
        allocatedCost: cost,
      });
    });

  const updateAcquisitionCost = (id: string, cost: number | null) =>
    guardedRun(async () => {
      await executeGraphQL(UPDATE_WELL_ACQUISITION_MUTATION, { id: Number(id), allocatedCost: cost });
    });

  const removeAcquisition = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_WELL_ACQUISITION_MUTATION, { id: Number(id) });
    });

  return {
    error,
    clearError: () => setError(null),
    linkedTracts,
    linkedWells,
    linkedLeases,
    linkedDeeds,
    linkedAcquisitions,
    tractOptions,
    wellOptions,
    leaseOptions,
    deedOptions,
    acquisitionOptions,
    addTract,
    removeTract,
    addWell,
    removeWell,
    addLease,
    removeLease,
    addDeed,
    removeDeed,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
  };
};

export default useWellCrossReferences;
