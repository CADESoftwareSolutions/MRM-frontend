import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { tractDisplayLabel } from "./useTracts";
import { FETCH_LEASES, CREATE_LEASE_TRACT_MUTATION, CREATE_LEASE_WELL_MUTATION } from "../graphql/Leases";
import {
  FETCH_DEEDS,
  CREATE_DEED_TRACT_MUTATION,
  CREATE_DEED_LEASE_MUTATION,
  CREATE_DEED_WELL_MUTATION,
} from "../graphql/Deeds";
import { FETCH_WELLS } from "../graphql/Wells";
import {
  FETCH_LEGAL_DESCRIPTION_MATCH_SUGGESTIONS,
  CREATE_CROSS_REFERENCE_LINK_MUTATION,
} from "../graphql/CrossReferenceLinks";

// A record can suggest matches against itself; a Tract never can (see
// legal_description_matching.py's MATCH_SOURCE_ENTITY_TYPES).
export type SuggestionEntityType = "lease" | "title_document" | "well";
type TargetEntityType = "tract" | "lease" | "title_document" | "well";

export interface MatchSuggestion {
  entityType: TargetEntityType;
  entityId: number;
  label: string;
}

interface UseLegalDescriptionMatchSuggestionsProps {
  sourceEntityType: SuggestionEntityType;
  sourceEntityId?: number | null;
  accountId: number;
  /** True while this record's Cross-References tab is the one currently showing — gates the
   * suggestions query (no point checking before the tab's ever been opened) and, combined with
   * staleTime: 0 below, forces a fresh check every time the user returns to the tab rather than
   * silently reusing whatever was cached from an earlier visit (Form.tsx's tabs use forceMount
   * and never unmount, so a plain on-mount fetch would only ever run once). */
  isActive: boolean;
}

// Duplicated from useLeaseCrossReferences.ts/useDeedCrossReferences.ts/useWellCrossReferences.ts
// rather than shared — matches this codebase's existing convention of each cross-reference hook
// carrying its own small label helpers instead of a shared util module.
const leaseLabel = (lease: any): string =>
  [lease?.lessor, lease?.lessee].filter(Boolean).join(" / ") || `Lease #${lease?.id}`;

const deedLabel = (deed: any): string => {
  const grantor = (deed?.conveyanceParties || [])
    .filter((p: any) => p.role === "grantor")
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const type = deed?.documentType || "Deed";
  return grantor ? `${type} — ${grantor.name}` : `${type} #${deed?.id}`;
};

const wellLabel = (well: any): string => well?.name || `Well #${well?.id}`;

const toId = (id: unknown): number => Number(id);

interface Dispatch {
  mutation: string;
  variables: Record<string, any>;
  /** Query keys to invalidate on success, on top of the suggestions query itself (always
   * invalidated by addSuggestion below). */
  invalidateKeys: (string | number | null)[][];
}

// The 12 valid (source type, target type) pairs a Lease/Deed/Well can be suggested a match for,
// and which existing mutation actually creates that link — dedicated-table pairs reuse the exact
// mutation their own manual picker calls (CreateLeaseTract, CreateDeedLease, ...); the four pairs
// with no dedicated table (well<->tract, lease<->lease, title_document<->title_document,
// well<->well) go through the generic CreateCrossReferenceLink. "Deed" below is title_document.
const buildDispatch = (
  accountId: number,
  sourceType: SuggestionEntityType,
  sourceId: number,
  targetType: TargetEntityType,
  targetId: number,
): Dispatch => {
  switch (`${sourceType}->${targetType}`) {
    case "lease->tract":
      return {
        mutation: CREATE_LEASE_TRACT_MUTATION,
        variables: { accountId, leaseId: sourceId, tractId: targetId },
        invalidateKeys: [["leases"], ["tracts"]],
      };
    case "lease->lease":
      return {
        mutation: CREATE_CROSS_REFERENCE_LINK_MUTATION,
        variables: {
          accountId,
          entityTypeA: "lease",
          entityIdA: sourceId,
          entityTypeB: "lease",
          entityIdB: targetId,
          source: "legal_description_match",
        },
        invalidateKeys: [["crossReferenceLinks", "lease", sourceId], ["crossReferenceLinks", "lease", targetId]],
      };
    case "lease->title_document":
      return {
        mutation: CREATE_DEED_LEASE_MUTATION,
        variables: { accountId, deedId: targetId, leaseId: sourceId },
        invalidateKeys: [["leases"], ["deeds"]],
      };
    case "lease->well":
      return {
        mutation: CREATE_LEASE_WELL_MUTATION,
        variables: { accountId, leaseId: sourceId, wellId: targetId },
        invalidateKeys: [["leases"], ["wells"]],
      };
    case "title_document->tract":
      return {
        mutation: CREATE_DEED_TRACT_MUTATION,
        variables: { accountId, deedId: sourceId, tractId: targetId },
        invalidateKeys: [["deeds"], ["tracts"]],
      };
    case "title_document->title_document":
      return {
        mutation: CREATE_CROSS_REFERENCE_LINK_MUTATION,
        variables: {
          accountId,
          entityTypeA: "title_document",
          entityIdA: sourceId,
          entityTypeB: "title_document",
          entityIdB: targetId,
          source: "legal_description_match",
        },
        invalidateKeys: [
          ["crossReferenceLinks", "title_document", sourceId],
          ["crossReferenceLinks", "title_document", targetId],
        ],
      };
    case "title_document->lease":
      return {
        mutation: CREATE_DEED_LEASE_MUTATION,
        variables: { accountId, deedId: sourceId, leaseId: targetId },
        invalidateKeys: [["deeds"], ["leases"]],
      };
    case "title_document->well":
      return {
        mutation: CREATE_DEED_WELL_MUTATION,
        variables: { accountId, deedId: sourceId, wellId: targetId },
        invalidateKeys: [["deeds"], ["wells"]],
      };
    case "well->tract":
      return {
        mutation: CREATE_CROSS_REFERENCE_LINK_MUTATION,
        variables: {
          accountId,
          entityTypeA: "well",
          entityIdA: sourceId,
          entityTypeB: "tract",
          entityIdB: targetId,
          source: "legal_description_match",
        },
        invalidateKeys: [["crossReferenceLinks", "well", sourceId]],
      };
    case "well->well":
      return {
        mutation: CREATE_CROSS_REFERENCE_LINK_MUTATION,
        variables: {
          accountId,
          entityTypeA: "well",
          entityIdA: sourceId,
          entityTypeB: "well",
          entityIdB: targetId,
          source: "legal_description_match",
        },
        invalidateKeys: [["crossReferenceLinks", "well", sourceId], ["crossReferenceLinks", "well", targetId]],
      };
    case "well->lease":
      return {
        mutation: CREATE_LEASE_WELL_MUTATION,
        variables: { accountId, leaseId: targetId, wellId: sourceId },
        invalidateKeys: [["wells"], ["leases"]],
      };
    case "well->title_document":
      return {
        mutation: CREATE_DEED_WELL_MUTATION,
        variables: { accountId, deedId: targetId, wellId: sourceId },
        invalidateKeys: [["wells"], ["deeds"]],
      };
    default:
      throw new Error(`No suggestion-acceptance mutation defined for ${sourceType} -> ${targetType}`);
  }
};

// One shared hook backing SuggestedCrossReferencesModal.tsx for all three record types, rather
// than a hook (and modal) forked per Lease/Deed/Well — matches this codebase's existing
// precedent of CrossReferencePicker/LinkedRowsTable being single generic components every
// cross-reference tab reuses instead of each authoring its own.
export const useLegalDescriptionMatchSuggestions = ({
  sourceEntityType,
  sourceEntityId,
  accountId,
  isActive,
}: UseLegalDescriptionMatchSuggestionsProps) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  // Resets the "closed by the user" flag every time the tab is (re)entered, so a modal the user
  // dismissed on a prior visit is eligible to reopen on this one if suggestions still exist.
  const enteredRef = useRef(false);
  useEffect(() => {
    if (isActive && !enteredRef.current) {
      setDismissed(false);
    }
    enteredRef.current = isActive;
  }, [isActive]);

  const suggestionsQueryKey = ["legalDescriptionMatchSuggestions", sourceEntityType, sourceEntityId];
  const enabled = isActive && sourceEntityId != null;

  const { data: rawSuggestions = [], isLoading } = useQuery({
    queryKey: suggestionsQueryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_LEGAL_DESCRIPTION_MATCH_SUGGESTIONS, {
        entityType: sourceEntityType,
        entityId: sourceEntityId,
      });
      return result.legalDescriptionMatchSuggestions as { entityType: TargetEntityType; entityId: number }[];
    },
    enabled,
    // The QueryClient's default staleTime (_app.tsx) is 5 minutes — without overriding it here,
    // re-opening this tab within that window would silently reuse a stale suggestion list
    // instead of re-checking, which is exactly the behavior the feature spec rules out.
    staleTime: 0,
  });

  // Label lookups for whatever type each suggestion turns out to be — loaded from the same
  // ["tracts"]/["leases"]/["deeds"]/["wells"] caches the tab's own cross-reference hook already
  // populates, so this rarely triggers its own network request.
  const { data: tracts = [] } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => (await executeGraphQL(FETCH_TRACTS)).tracts as any[],
    enabled,
  });
  const { data: leases = [] } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => (await executeGraphQL(FETCH_LEASES)).leases as any[],
    enabled,
  });
  const { data: deeds = [] } = useQuery({
    queryKey: ["deeds"],
    queryFn: async () => (await executeGraphQL(FETCH_DEEDS)).deeds as any[],
    enabled,
  });
  const { data: wells = [] } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => (await executeGraphQL(FETCH_WELLS)).wells as any[],
    enabled,
  });

  const tractsById = useMemo(() => new Map(tracts.map((t: any) => [toId(t.id), t])), [tracts]);
  const leasesById = useMemo(() => new Map(leases.map((l: any) => [toId(l.id), l])), [leases]);
  const deedsById = useMemo(() => new Map(deeds.map((d: any) => [toId(d.id), d])), [deeds]);
  const wellsById = useMemo(() => new Map(wells.map((w: any) => [toId(w.id), w])), [wells]);

  const suggestions: MatchSuggestion[] = useMemo(
    () =>
      rawSuggestions.map((s) => {
        const entityId = toId(s.entityId);
        let label: string;
        switch (s.entityType) {
          case "tract": {
            const tract = tractsById.get(entityId);
            label = tract ? tractDisplayLabel(tract) : `Tract #${entityId}`;
            break;
          }
          case "lease": {
            const lease = leasesById.get(entityId);
            label = lease ? leaseLabel(lease) : `Lease #${entityId}`;
            break;
          }
          case "title_document": {
            const deed = deedsById.get(entityId);
            label = deed ? deedLabel(deed) : `Deed #${entityId}`;
            break;
          }
          case "well": {
            const well = wellsById.get(entityId);
            label = well ? wellLabel(well) : `Well #${entityId}`;
            break;
          }
          default:
            label = `${s.entityType} #${entityId}`;
        }
        return { entityType: s.entityType, entityId, label };
      }),
    [rawSuggestions, tractsById, leasesById, deedsById, wellsById],
  );

  // Never flashes an empty modal: only opens once loading has settled and there's actually
  // something to show, and only while the tab producing the suggestions is the active one.
  const modalOpen = enabled && !isLoading && !dismissed && suggestions.length > 0;
  const closeModal = () => setDismissed(true);

  // invalidateQueries triggers a background refetch rather than clearing `suggestions`
  // immediately (isLoading only covers the very first fetch, not a refetch) — so the accepted
  // suggestion can still be in the list, "Add" still enabled, for one round trip after the
  // click. Tracking in-flight keys here blocks a fast double-click from firing the mutation
  // twice for the same target.
  const isPending = (targetType: TargetEntityType, targetId: number) =>
    pendingKeys.has(`${targetType}-${targetId}`);

  const addSuggestion = async (targetType: TargetEntityType, targetId: number) => {
    if (sourceEntityId == null) return;
    const key = `${targetType}-${targetId}`;
    if (pendingKeys.has(key)) return;
    setPendingKeys((prev) => new Set(prev).add(key));
    try {
      setError(null);
      const { mutation, variables, invalidateKeys } = buildDispatch(
        accountId,
        sourceEntityType,
        Number(sourceEntityId),
        targetType,
        Number(targetId),
      );
      await executeGraphQL(mutation, variables);
      await Promise.all([
        ...invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        queryClient.invalidateQueries({ queryKey: suggestionsQueryKey }),
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return {
    suggestions,
    isLoading,
    error,
    clearError: () => setError(null),
    modalOpen,
    closeModal,
    addSuggestion,
    isPending,
  };
};

export default useLegalDescriptionMatchSuggestions;
