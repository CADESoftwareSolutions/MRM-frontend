import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { CrossRefOption } from "../../components/FormComponents/CrossReferencePicker";
import { FETCH_PARTIES } from "../graphql/Directory";
import { FETCH_LEASES } from "../graphql/Leases";
import { FETCH_WELLS } from "../graphql/Wells";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { tractDisplayLabel } from "./useTracts";
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
  CREATE_DEED_TRACT_MUTATION,
  DELETE_DEED_TRACT_MUTATION,
} from "../graphql/Deeds";
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

// title_document<->title_document has no dedicated table (see CrossReferenceLinks.ts) — a link
// to another Deed goes through the generic table, same as well<->well on useWellCrossReferences.ts.
export interface LinkedDeed {
  id: string;
  deedId: number;
  name: string;
}

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

const deedLabel = (deed: any): string => {
  const grantor = (deed?.conveyanceParties || [])
    .filter((p: any) => p.role === "grantor")
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const type = deed?.documentType || "Deed";
  return grantor ? `${type} — ${grantor.name}` : `${type} #${deed?.id}`;
};

// A CrossReferenceLink row is a canonicalized, unordered (typeA,idA)/(typeB,idB) pair — this
// deed could be on either side depending on which type sorted first. Returns whichever side
// isn't "this deed". Mirrors useWellCrossReferences.ts's otherSide for the well<->well case.
const otherSide = (link: any, selfId: number): { type: string; id: number } => {
  if (link.entityTypeA === "title_document" && toId(link.entityIdA) === selfId) {
    return { type: link.entityTypeB, id: toId(link.entityIdB) };
  }
  return { type: link.entityTypeA, id: toId(link.entityIdA) };
};

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

  // title_document<->title_document links live in the generic cross_reference_link table, not
  // nested on TitleDocumentType (no relationship() there — see
  // graphql_cross_reference_mutations.py), so this is its own top-level query rather than
  // nested in the ["deeds"] one above.
  const { data: crossReferenceLinks = [] } = useQuery({
    queryKey: ["crossReferenceLinks", "title_document", deedId],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_CROSS_REFERENCE_LINKS, {
        entityType: "title_document",
        entityId: deedId,
      });
      return result.crossReferenceLinks as any[];
    },
    enabled: deedId != null,
  });

  // Everything pickable in the five search boxes.
  const { data: tracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as any[];
    },
    enabled: deedId != null,
  });

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

  const deedsById = useMemo(() => new Map(rawDeeds.map((d: any) => [toId(d.id), d])), [rawDeeds]);

  const resolvedCrossReferenceLinks = useMemo(
    () => crossReferenceLinks.map((link: any) => ({ link, other: otherSide(link, Number(deedId)) })),
    [crossReferenceLinks, deedId],
  );

  const linkedDeeds: LinkedDeed[] = useMemo(
    () =>
      resolvedCrossReferenceLinks
        .filter(({ other }) => other.type === "title_document")
        .map(({ link, other }) => {
          const otherDeed = deedsById.get(other.id);
          return {
            id: String(link.id),
            deedId: other.id,
            name: otherDeed ? deedLabel(otherDeed) : `Deed #${other.id}`,
          };
        }),
    [resolvedCrossReferenceLinks, deedsById],
  );

  const linkedTracts: LinkedTract[] = useMemo(
    () =>
      (currentDeed?.tracts || []).map((t: any) => ({
        id: String(t.id),
        tractId: toId(t.tract?.id),
        name: t.tract ? tractDisplayLabel(t.tract) : `Tract #${t.tract?.id}`,
      })),
    [currentDeed],
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

  const tractOptions: CrossRefOption[] = useMemo(
    () => tracts.map((t: any) => ({ id: toId(t.id), label: tractDisplayLabel(t) })),
    [tracts],
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
  // Same-type: excludes this deed itself in addition to whatever's already linked (handled by
  // the picker's excludeIds prop below) — you can't cross-reference a deed to itself.
  const deedOptions: CrossRefOption[] = useMemo(
    () =>
      rawDeeds
        .filter((d: any) => toId(d.id) !== Number(deedId))
        .map((d: any) => ({ id: toId(d.id), label: deedLabel(d) })),
    [rawDeeds, deedId],
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

  // title_document<->title_document isn't nested on TitleDocumentType (see the
  // crossReferenceLinks query above), so invalidating ["deeds"] wouldn't refresh it — this
  // invalidates its own query key instead.
  const guardedRunGeneric = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["crossReferenceLinks", "title_document", deedId] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addTract = (tractId: number) =>
    guardedRun(async () => {
      await executeGraphQL(CREATE_DEED_TRACT_MUTATION, { accountId, deedId, tractId: toId(tractId) });
    });

  const removeTract = (id: string) =>
    guardedRun(async () => {
      await executeGraphQL(DELETE_DEED_TRACT_MUTATION, { id: Number(id) });
    });

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

  const addDeed = (otherDeedId: number) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(CREATE_CROSS_REFERENCE_LINK_MUTATION, {
        accountId,
        entityTypeA: "title_document",
        entityIdA: deedId,
        entityTypeB: "title_document",
        entityIdB: toId(otherDeedId),
      });
    });

  const removeDeed = (id: string) =>
    guardedRunGeneric(async () => {
      await executeGraphQL(DELETE_CROSS_REFERENCE_LINK_MUTATION, { id: Number(id) });
    });

  return {
    error,
    clearError: () => setError(null),
    linkedTracts,
    linkedParties,
    linkedLeases,
    linkedWells,
    linkedAcquisitions,
    linkedDeeds,
    tractOptions,
    partyOptions,
    leaseOptions,
    wellOptions,
    acquisitionOptions,
    deedOptions,
    addTract,
    removeTract,
    addParty,
    removeParty,
    addLease,
    removeLease,
    addWell,
    removeWell,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
    addDeed,
    removeDeed,
  };
};

export default useDeedCrossReferences;
