import { useMemo } from "react";
import { useAtom } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { executeGraphQL } from "../lib/api";
import { FETCH_TRACTS } from "../graphql/Tracts";
import { FETCH_LEASES } from "../graphql/Leases";
import { FETCH_DEEDS } from "../graphql/Deeds";
import { FETCH_WELLS } from "../graphql/Wells";
import {
  FETCH_CROSS_REFERENCE_LINKS,
  CREATE_CROSS_REFERENCE_LINK_MUTATION,
  DELETE_CROSS_REFERENCE_LINK_MUTATION,
} from "../graphql/CrossReferences";
import { TRACT_TYPE_OPTIONS } from "../config/tractsConfig";
import { tractDisplayLabel } from "./useTracts";

// Off until the BE has a cross_reference_link table + crossReferenceLinks query and
// create/deleteCrossReferenceLink mutations (see src/graphql/CrossReferences.ts). While off,
// the add picker still works but saving surfaces MANUAL_DISABLED_MESSAGE instead of calling the BE.
export const MANUAL_CROSS_REFERENCES_ENABLED = false;
const MANUAL_DISABLED_MESSAGE =
  "Manually added cross-references can't be saved yet — the backend doesn't support them.";

export type CrossReferenceEntityType = "tract" | "lease" | "title_document" | "well";

export interface CrossReferenceOption {
  key: string;
  entityType: CrossReferenceEntityType;
  entityId: number;
  title: string;
  details: string[];
}

export interface CrossReferenceRow extends CrossReferenceOption {
  /** Why this row is here when it comes from shared tracts; null for manual-only rows. */
  derivedReason: string | null;
  /** Set when a manual link exists for this pair — the only kind of row that can be removed. */
  manualLinkId: number | null;
}

interface UseCrossReferencesProps {
  entityType: CrossReferenceEntityType;
  entityId?: number | null;
}

const toId = (id: unknown): number => Number(id);
const refKey = (type: CrossReferenceEntityType, id: unknown) => `${type}-${toId(id)}`;

const formatDate = (raw?: string | null): string | null => {
  if (!raw) return null;
  // Split instead of new Date(): a bare YYYY-MM-DD parses as UTC midnight and can render as the
  // previous day in US timezones.
  const [year, month, day] = raw.slice(0, 10).split("-");
  return year && month && day ? `${month}/${day}/${year}` : raw;
};

const location = (record: any): string | null =>
  [record?.countyName, record?.stateCode].filter(Boolean).join(", ") || null;

const acresLabel = (acres: unknown): string | null =>
  acres === null || acres === undefined || acres === "" ? null : `${Number(acres)} ac`;

const recordingLabel = (recordations?: any[]): string | null => {
  const rec = recordations?.[0];
  if (!rec) return null;
  const parts = [
    rec.volume && `Vol. ${rec.volume}`,
    rec.book && `Bk. ${rec.book}`,
    rec.page && `Pg. ${rec.page}`,
    rec.instrumentNumber && `Inst. ${rec.instrumentNumber}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const partyName = (parties: any[] | undefined, role: string): string | null => {
  const sorted = (parties || [])
    .filter((p) => p.role === role)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (!sorted.length) return null;
  return sorted.length > 1 ? `${sorted[0].name} et al.` : sorted[0].name;
};

const TRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRACT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const tractLegalShort = (tract: any): string | null => {
  const parts = [
    tract?.quarterCalls,
    tract?.lotNo && `Lot ${tract.lotNo}`,
    tract?.blockNo && `Blk ${tract.blockNo}`,
    tract?.section && `Sec ${tract.section}`,
    tract?.township && `T${tract.township}`,
    tract?.range && `R${tract.range}`,
    tract?.abstract && `A-${tract.abstract}`,
    tract?.survey,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
};

// Every describe* takes whatever shape it's handed — a full record from its own FETCH_* list,
// or the slimmer copy nested in FETCH_TRACTS's joins while the full list is still loading.
const describeLease = (lease: any): Omit<CrossReferenceOption, "key" | "entityType" | "entityId"> => ({
  title: [lease?.lessor, lease?.lessee].filter(Boolean).join(" → ") || `Lease #${lease?.id}`,
  details: [
    `Lease #${lease?.id}`,
    lease?.effectiveDate && `Eff. ${formatDate(lease.effectiveDate)}`,
    lease?.status,
    acresLabel(lease?.acres),
    location(lease),
    recordingLabel(lease?.recordations),
  ].filter(Boolean) as string[],
});

const describeDeed = (deed: any): Omit<CrossReferenceOption, "key" | "entityType" | "entityId"> => {
  const rawType = deed?.documentType || "Deed";
  const type = /deed/i.test(rawType) ? rawType : `${rawType} Deed`;
  const grantor = partyName(deed?.conveyanceParties, "grantor");
  const grantee = partyName(deed?.conveyanceParties, "grantee");
  const parties = [grantor, grantee].filter(Boolean).join(" → ");
  return {
    title: parties ? `${type} — ${parties}` : `${type} #${deed?.id}`,
    details: [
      `Deed #${deed?.id}`,
      deed?.effectiveDate && `Eff. ${formatDate(deed.effectiveDate)}`,
      acresLabel(deed?.acres),
      location(deed),
      recordingLabel(deed?.recordations),
    ].filter(Boolean) as string[],
  };
};

const describeWell = (well: any): Omit<CrossReferenceOption, "key" | "entityType" | "entityId"> => ({
  title:
    well?.name ||
    [well?.leaseName, well?.wellNumber && `#${well.wellNumber}`].filter(Boolean).join(" ") ||
    `Well #${well?.id}`,
  details: [
    well?.apiNumber && `API ${well.apiNumber}`,
    well?.operatorName,
    well?.fieldName,
    location(well),
  ].filter(Boolean) as string[],
});

const describeTract = (tract: any): Omit<CrossReferenceOption, "key" | "entityType" | "entityId"> => ({
  title: tract ? tractDisplayLabel(tract) : "Tract",
  details: [
    TRACT_TYPE_LABELS[tract?.tractType ?? ""] || tract?.tractType,
    tractLegalShort(tract),
    location(tract),
    acresLabel(tract?.grossAcres),
  ].filter(Boolean) as string[],
});

const DESCRIBE: Record<CrossReferenceEntityType, (record: any) => Omit<CrossReferenceOption, "key" | "entityType" | "entityId">> = {
  tract: describeTract,
  lease: describeLease,
  title_document: describeDeed,
  well: describeWell,
};

const joinTarget = (join: any): { type: CrossReferenceEntityType; record: any } | null => {
  if (join.lease) return { type: "lease", record: join.lease };
  if (join.titleDocument) return { type: "title_document", record: join.titleDocument };
  if (join.well) return { type: "well", record: join.well };
  return null;
};

// Same query keys + queryFn return shapes as useTracts/useLeases/useDeeds/useWells, so this
// shares their cache entries instead of refetching (and their saves already invalidate them).
const useEntityList = (key: string, query: string, field: string, enabled: boolean) =>
  useQuery({
    queryKey: [key],
    queryFn: async () => {
      const result = await executeGraphQL(query);
      return result[field] as any[];
    },
    enabled,
  });

// Cross-references for any Lease/Deed/Well/Tract = two sources merged:
//  - derived: whatever shares a tract with this record via tract_join (Legal Descriptions tab),
//    read off FETCH_TRACTS's `joins`; read-only here.
//  - manual: generic cross_reference_link rows a user added from the Cross-References tab;
//    removable here.
export const useCrossReferences = ({ entityType, entityId }: UseCrossReferencesProps) => {
  const queryClient = useQueryClient();
  const [userProfile] = useAtom(userProfileAtom);
  const hasId = entityId != null;

  const { data: tracts = [], isLoading: tractsLoading } = useEntityList("tracts", FETCH_TRACTS, "tracts", hasId);
  const { data: leases = [] } = useEntityList("leases", FETCH_LEASES, "leases", hasId);
  const { data: deeds = [] } = useEntityList("deeds", FETCH_DEEDS, "deeds", hasId);
  const { data: wells = [] } = useEntityList("wells", FETCH_WELLS, "wells", hasId);

  const manualQueryKey = ["crossReferenceLinks", entityType, entityId];
  const { data: manualLinks = [] } = useQuery({
    queryKey: manualQueryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_CROSS_REFERENCE_LINKS, { entityType, entityId });
      return result.crossReferenceLinks as any[];
    },
    enabled: MANUAL_CROSS_REFERENCES_ENABLED && hasId,
  });

  const recordsByKey = useMemo(() => {
    const map = new Map<string, any>();
    tracts.forEach((r) => map.set(refKey("tract", r.id), r));
    leases.forEach((r) => map.set(refKey("lease", r.id), r));
    deeds.forEach((r) => map.set(refKey("title_document", r.id), r));
    wells.forEach((r) => map.set(refKey("well", r.id), r));
    return map;
  }, [tracts, leases, deeds, wells]);

  const rows: CrossReferenceRow[] = useMemo(() => {
    if (!hasId) return [];
    const selfKey = refKey(entityType, entityId);
    const byKey = new Map<string, CrossReferenceRow & { via: string[] }>();

    const toOption = (type: CrossReferenceEntityType, id: unknown, fallback?: any): CrossReferenceOption => {
      const key = refKey(type, id);
      return { key, entityType: type, entityId: toId(id), ...DESCRIBE[type](recordsByKey.get(key) ?? fallback ?? { id }) };
    };

    const addDerived = (type: CrossReferenceEntityType, id: unknown, fallback: any, via: string | null, reason: string) => {
      const key = refKey(type, id);
      if (key === selfKey) return;
      let row = byKey.get(key);
      if (!row) {
        row = { ...toOption(type, id, fallback), derivedReason: reason, manualLinkId: null, via: [] };
        byKey.set(key, row);
      }
      if (via && !row.via.includes(via)) row.via.push(via);
    };

    if (entityType === "tract") {
      const self = tracts.find((t: any) => refKey("tract", t.id) === selfKey);
      const docKeys = new Set<string>();
      for (const join of self?.joins || []) {
        const target = joinTarget(join);
        if (!target) continue;
        docKeys.add(refKey(target.type, target.record.id));
        addDerived(target.type, target.record.id, target.record, null, "Has this tract in its Legal Descriptions");
      }
      for (const tract of tracts) {
        for (const join of tract.joins || []) {
          const target = joinTarget(join);
          if (!target || !docKeys.has(refKey(target.type, target.record.id))) continue;
          const docTitle = toOption(target.type, target.record.id, target.record).title;
          addDerived("tract", tract.id, tract, docTitle, "Shares");
        }
      }
    } else {
      for (const tract of tracts) {
        const joins = tract.joins || [];
        const includesSelf = joins.some((join: any) => {
          const target = joinTarget(join);
          return target && refKey(target.type, target.record.id) === selfKey;
        });
        if (!includesSelf) continue;
        addDerived("tract", tract.id, tract, null, "In this record's Legal Descriptions");
        const tractTitle = tractDisplayLabel(tract);
        for (const join of joins) {
          const target = joinTarget(join);
          if (target) addDerived(target.type, target.record.id, target.record, tractTitle, "Shares tract");
        }
      }
    }

    for (const link of manualLinks) {
      const aIsSelf = refKey(link.entityTypeA, link.entityIdA) === selfKey;
      const otherType = (aIsSelf ? link.entityTypeB : link.entityTypeA) as CrossReferenceEntityType;
      const otherId = aIsSelf ? link.entityIdB : link.entityIdA;
      if (!DESCRIBE[otherType]) continue;
      const key = refKey(otherType, otherId);
      const existing = byKey.get(key);
      if (existing) existing.manualLinkId = toId(link.id);
      else byKey.set(key, { ...toOption(otherType, otherId), derivedReason: null, manualLinkId: toId(link.id), via: [] });
    }

    return Array.from(byKey.values()).map(({ via, ...row }) => ({
      ...row,
      derivedReason: row.derivedReason && via.length ? `${row.derivedReason}: ${via.join(", ")}` : row.derivedReason,
    }));
  }, [hasId, entityType, entityId, tracts, manualLinks, recordsByKey]);

  const rowKeys = useMemo(() => new Set(rows.map((row) => row.key)), [rows]);

  // Everything of a given type that isn't this record and isn't already cross-referenced.
  const optionsFor = (type: CrossReferenceEntityType): CrossReferenceOption[] => {
    const list = { tract: tracts, lease: leases, title_document: deeds, well: wells }[type];
    const selfKey = refKey(entityType, entityId);
    return list
      .filter((record: any) => {
        const key = refKey(type, record.id);
        return key !== selfKey && !rowKeys.has(key);
      })
      .map((record: any) => ({
        key: refKey(type, record.id),
        entityType: type,
        entityId: toId(record.id),
        ...DESCRIBE[type](record),
      }));
  };

  const addLink = async (targetType: CrossReferenceEntityType, targetId: number) => {
    if (!MANUAL_CROSS_REFERENCES_ENABLED) throw new Error(MANUAL_DISABLED_MESSAGE);
    await executeGraphQL(CREATE_CROSS_REFERENCE_LINK_MUTATION, {
      accountId: userProfile?.account?.id,
      entityTypeA: entityType,
      entityIdA: toId(entityId),
      entityTypeB: targetType,
      entityIdB: targetId,
    });
    await queryClient.invalidateQueries({ queryKey: ["crossReferenceLinks"] });
  };

  const removeLink = async (linkId: number) => {
    if (!MANUAL_CROSS_REFERENCES_ENABLED) throw new Error(MANUAL_DISABLED_MESSAGE);
    await executeGraphQL(DELETE_CROSS_REFERENCE_LINK_MUTATION, { id: linkId });
    await queryClient.invalidateQueries({ queryKey: ["crossReferenceLinks"] });
  };

  const rowsOf = (type: CrossReferenceEntityType) => rows.filter((row) => row.entityType === type);

  return {
    isLoading: tractsLoading,
    linkedTracts: rowsOf("tract"),
    linkedLeases: rowsOf("lease"),
    linkedDeeds: rowsOf("title_document"),
    linkedWells: rowsOf("well"),
    optionsFor,
    addLink,
    removeLink,
  };
};

export default useCrossReferences;
