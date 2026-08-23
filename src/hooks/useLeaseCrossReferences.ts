import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { CrossRefOption } from "../../components/FormComponents/CrossReferencePicker";
import { FETCH_WELLS } from "../graphql/Wells";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { tractDisplayLabel } from "./useTracts";
import { FETCH_DEEDS, CREATE_DEED_LEASE_MUTATION, DELETE_DEED_LEASE_MUTATION } from "../graphql/Deeds";
import {
  FETCH_LEASES,
  CREATE_LEASE_TRACT_MUTATION,
  DELETE_LEASE_TRACT_MUTATION,
  CREATE_LEASE_WELL_MUTATION,
  DELETE_LEASE_WELL_MUTATION,
  CREATE_LEASE_ACQUISITION_MUTATION,
  UPDATE_LEASE_ACQUISITION_MUTATION,
  DELETE_LEASE_ACQUISITION_MUTATION,
} from "../graphql/Leases";
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

// lease<->lease has no dedicated table (see CrossReferenceLinks.ts) — a link to another Lease
// goes through the generic table, same as well<->well on useWellCrossReferences.ts.
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

const leaseLabel = (lease: any): string =>
  [lease?.lessor, lease?.lessee].filter(Boolean).join(" / ") || `Lease #${lease?.id}`;

// GraphQL's ID scalar (what well/acquisition/deed ids are declared as) serializes over the wire
// as a string even though the underlying column is an int. Route every id through here so
// options/linked ids are actually numbers, not just typed as one, or Int-typed mutation
// variables like $wellId reject them at request time.
const toId = (id: unknown): number => Number(id);

// A CrossReferenceLink row is a canonicalized, unordered (typeA,idA)/(typeB,idB) pair — this
// lease could be on either side depending on which type sorted first. Returns whichever side
// isn't "this lease". Mirrors useWellCrossReferences.ts's otherSide for the well<->well case.
const otherSide = (link: any, selfId: number): { type: string; id: number } => {
  if (link.entityTypeA === "lease" && toId(link.entityIdA) === selfId) {
    return { type: link.entityTypeB, id: toId(link.entityIdB) };
  }
  return { type: link.entityTypeA, id: toId(link.entityIdA) };
};

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

  // lease<->lease links live in the generic cross_reference_link table, not nested on LeaseType
  // (no relationship() there — see graphql_cross_reference_mutations.py), so this is its own
  // top-level query rather than nested in the ["leases"] one above.
  const { data: crossReferenceLinks = [] } = useQuery({
    queryKey: ["crossReferenceLinks", "lease", leaseId],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_CROSS_REFERENCE_LINKS, { entityType: "lease", entityId: leaseId });
      return result.crossReferenceLinks as any[];
    },
    enabled: leaseId != null,
  });

  // Everything pickable in the four search boxes.
  const { data: tracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as any[];
    },
    enabled: leaseId != null,
  });

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

  const leasesById = useMemo(() => new Map(rawLeases.map((l: any) => [toId(l.id), l])), [rawLeases]);

  const resolvedCrossReferenceLinks = useMemo(
    () => crossReferenceLinks.map((link: any) => ({ link, other: otherSide(link, Number(leaseId)) })),
    [crossReferenceLinks, leaseId],
  );

  const linkedLeases: LinkedLease[] = useMemo(
    () =>
      resolvedCrossReferenceLinks
        .filter(({ other }) => other.type === "lease")
        .map(({ link, other }) => {
          const otherLease = leasesById.get(other.id);
          return {
            id: String(link.id),
            leaseId: other.id,
            name: otherLease ? leaseLabel(otherLease) : `Lease #${other.id}`,
          };
        }),
    [resolvedCrossReferenceLinks, leasesById],
  );

  const linkedTracts: LinkedTract[] = useMemo(
    () =>
      (currentLease?.tracts || []).map((t: any) => ({
        id: String(t.id),
        tractId: toId(t.tract?.id),
        name: t.tract ? tractDisplayLabel(t.tract) : `Tract #${t.tract?.id}`,
      })),
    [currentLease],
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

  const tractOptions: CrossRefOption[] = useMemo(
    () => tracts.map((t: any) => ({ id: toId(t.id), label: tractDisplayLabel(t) })),
    [tracts],
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
  // Same-type: excludes this lease itself in addition to whatever's already linked (handled by
  // the picker's excludeIds prop below) — you can't cross-reference a lease to itself.
  const leaseOptions: CrossRefOption[] = useMemo(
    () =>
      rawLeases
        .filter((l: any) => toId(l.id) !== Number(leaseId))
        .map((l: any) => ({ id: toId(l.id), label: leaseLabel(l) })),
    [rawLeases, leaseId],
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

  // lease<->lease isn't nested on LeaseType (see the crossReferenceLinks query above), so
  // invalidating ["leases"] wouldn't refresh it — this invalidates its own query key instead.
  const guardedRunGeneric = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["crossReferenceLinks", "lease", leaseId] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addTract = (tractId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_LEASE_TRACT_MUTATION, { accountId, leaseId, tractId: toId(tractId) });
    });

  const removeTract = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_LEASE_TRACT_MUTATION, { id: Number(id) });
    });

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

  const addLease = (otherLeaseId: number) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(CREATE_CROSS_REFERENCE_LINK_MUTATION, {
        accountId,
        entityTypeA: "lease",
        entityIdA: leaseId,
        entityTypeB: "lease",
        entityIdB: toId(otherLeaseId),
      });
    });

  const removeLease = (id: string) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(DELETE_CROSS_REFERENCE_LINK_MUTATION, { id: Number(id) });
    });

  return {
    error,
    clearError: () => setError(null),
    linkedTracts,
    linkedWells,
    linkedAcquisitions,
    linkedDeeds,
    linkedLeases,
    tractOptions,
    wellOptions,
    acquisitionOptions,
    deedOptions,
    leaseOptions,
    addTract,
    removeTract,
    addWell,
    removeWell,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
    addDeed,
    removeDeed,
    addLease,
    removeLease,
  };
};

export default useLeaseCrossReferences;
