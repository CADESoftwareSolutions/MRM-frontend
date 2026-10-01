import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { executeGraphQL } from "../lib/api";
import { FETCH_TRACTS } from "../graphql/Tracts";

export type TractEntityType = "lease" | "title_document" | "well";

export interface SharedTractReference {
  id: string;
  entityType: TractEntityType;
  entityId: number;
  name: string;
}

interface UseSharedTractReferencesProps {
  entityType: TractEntityType;
  entityId?: number | null;
}

const leaseLabel = (lease: any): string =>
  [lease?.lessor, lease?.lessee].filter(Boolean).join(" / ") || `Lease #${lease?.id}`;

// Mirrors the deedLabel convention used elsewhere (useTracts.ts, formerly useLeaseCrossReferences.ts):
// first grantor row named on the instrument, since title_document has no single "name" column.
const deedLabel = (deed: any): string => {
  const grantor = (deed?.conveyanceParties || [])
    .filter((p: any) => p.role === "grantor")
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const type = deed?.documentType || "Deed";
  return grantor ? `${type} — ${grantor.name}` : `${type} #${deed?.id}`;
};

const wellLabel = (well: any): string => well?.name || `Well #${well?.id}`;

const toId = (id: unknown): number => Number(id);

// Cross-References is now purely derived, not manually curated: a Lease/Deed/Well's
// Cross-References tab lists every OTHER Lease/Deed/Well that shares at least one Tract with
// it (added from its own Legal Descriptions tab), read straight off FETCH_TRACTS's `joins` rather than any
// dedicated link table. One shared hook for all three entity types since the derivation is
// identical regardless of which of the three this record is — only the "which id is self"
// check differs.
export const useSharedTractReferences = ({ entityType, entityId }: UseSharedTractReferencesProps) => {
  // Same ["tracts"] query/cache key the standalone Tracts screen and the Tracts-tab picker use
  // (useTracts.ts / TractPickerField.tsx) — shares one fetch/cache entry.
  const { data: rawTracts = [], isLoading } = useQuery({
    queryKey: ["tracts"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_TRACTS);
      return result.tracts as any[];
    },
    enabled: entityId != null,
  });

  const sharedReferences: SharedTractReference[] = useMemo(() => {
    if (entityId == null) return [];
    const selfId = toId(entityId);
    const isSelf = (type: TractEntityType, id: number) => entityType === type && id === selfId;

    const seen = new Set<string>();
    const result: SharedTractReference[] = [];
    const addIfNotSelf = (type: TractEntityType, id: number, name: string) => {
      if (isSelf(type, id)) return;
      const key = `${type}-${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ id: key, entityType: type, entityId: id, name });
    };

    for (const tract of rawTracts) {
      const joins = tract.joins || [];
      const sharesThisTract = joins.some((join: any) => {
        if (join.lease) return isSelf("lease", toId(join.lease.id));
        if (join.titleDocument) return isSelf("title_document", toId(join.titleDocument.id));
        if (join.well) return isSelf("well", toId(join.well.id));
        return false;
      });
      if (!sharesThisTract) continue;

      for (const join of joins) {
        if (join.lease) addIfNotSelf("lease", toId(join.lease.id), leaseLabel(join.lease));
        if (join.titleDocument) addIfNotSelf("title_document", toId(join.titleDocument.id), deedLabel(join.titleDocument));
        if (join.well) addIfNotSelf("well", toId(join.well.id), wellLabel(join.well));
      }
    }

    return result;
  }, [rawTracts, entityType, entityId]);

  return {
    isLoading,
    linkedLeases: sharedReferences.filter((r) => r.entityType === "lease"),
    linkedDeeds: sharedReferences.filter((r) => r.entityType === "title_document"),
    linkedWells: sharedReferences.filter((r) => r.entityType === "well"),
  };
};

export default useSharedTractReferences;
