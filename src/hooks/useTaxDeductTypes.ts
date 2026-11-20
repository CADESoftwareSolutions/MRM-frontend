import { useCallback, useMemo } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_TAX_DEDUCT_TYPES } from "../mocks/revenue";
import {
  TaxDeductKind,
  TaxDeductType,
  findTaxDeductType,
  isTypeMapped,
  localIsoDate,
  newRevenueId,
  normalizeLabel,
} from "../types/revenue";
import { revenueChecksQuery } from "./useRevenueChecks";

const EMPTY: TaxDeductType[] = [];

export interface SeenTaxDeductLabel {
  label: string;
  kind: TaxDeductKind;
  operator?: string;
  /** The date of the check the label was printed on; defaults to today. */
  checkDate?: string;
}

// Read by the Tax & Deduct Types screen, the tab badge, the check list, check entry and import,
// postCheck and the account delete guard. gcTime is Infinity only while this is mocked: the cache is the only copy of the
// session's edits.
export const taxDeductTypesQuery = queryOptions({
  queryKey: ["taxDeductTypes"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_TAX_DEDUCT_TYPES)
  queryFn: async (): Promise<TaxDeductType[]> => structuredClone(MOCK_TAX_DEDUCT_TYPES),
  staleTime: Infinity,
  gcTime: Infinity,
});

const findOrThrow = (all: TaxDeductType[], id: string) => {
  const found = all.find((t) => t.id === id);
  if (!found) throw new Error("Label not found");
  return found;
};

/** Pass the chart of accounts so a label mapped to a missing or inactive account counts as unmapped. */
export const useTaxDeductTypes = (accounts?: { id: string; isActive: boolean }[]) => {
  const queryClient = useQueryClient();
  const { data = EMPTY, isLoading } = useQuery(taxDeductTypesQuery);

  const unmappedCount = useMemo(() => data.filter((t) => !isTypeMapped(t, accounts)).length, [data, accounts]);

  const findByLabel = useCallback(
    (label: string, kind: TaxDeductKind) => findTaxDeductType(data, label, kind),
    [data],
  );

  const readAll = useCallback(() => queryClient.ensureQueryData(taxDeductTypesQuery), [queryClient]);

  const writeAll = useCallback(
    (next: TaxDeductType[]) => queryClient.setQueryData(taxDeductTypesQuery.queryKey, next),
    [queryClient],
  );

  // Mapping a label clears its New flag; clearing the account leaves the flag as it was.
  // Mocked: no BE support yet — swap for executeGraphQL(UPDATE_TAX_DEDUCT_TYPE, { id, accountId })
  const setAccount = useCallback(
    async (id: string, accountId: string | null): Promise<TaxDeductType> => {
      const all = await readAll();
      const existing = findOrThrow(all, id);
      const updated: TaxDeductType = { ...existing, accountId, isNew: accountId ? false : existing.isNew };
      writeAll(all.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [readAll, writeAll],
  );

  // Deletes a label no saved check uses; a label printed on any check (draft, posted or void) stays.
  // Mocked: no BE support yet — swap for executeGraphQL(DELETE_TAX_DEDUCT_TYPE, { id })
  const deleteType = useCallback(
    async (id: string): Promise<void> => {
      const [all, checks] = await Promise.all([readAll(), queryClient.ensureQueryData(revenueChecksQuery)]);
      const existing = findOrThrow(all, id);
      const uses = checks.filter((check) =>
        check.lines.some((line) =>
          (existing.kind === "tax" ? line.taxes : line.deducts).some(
            (entry) => normalizeLabel(entry.label) === existing.label,
          ),
        ),
      ).length;
      if (uses) {
        throw new Error(`${existing.label} is used on ${uses} ${uses === 1 ? "check" : "checks"} and can't be deleted`);
      }
      writeAll(all.filter((t) => t.id !== id));
    },
    [readAll, writeAll, queryClient],
  );

  // Adds every label not seen before (as new and unmapped) and returns just those; known labels
  // pick up the operator, a line count and the latest check date they were seen on.
  // Mocked: no BE support yet — swap for executeGraphQL(ENSURE_TAX_DEDUCT_TYPES, { labels })
  const ensureTypes = useCallback(
    async (labels: SeenTaxDeductLabel[]): Promise<TaxDeductType[]> => {
      const all = await readAll();
      const next = [...all];
      const added: TaxDeductType[] = [];
      for (const seen of labels) {
        const label = normalizeLabel(seen.label);
        if (!label) continue;
        const seenOn = seen.checkDate || localIsoDate();
        const operator = seen.operator?.trim();
        const index = next.findIndex((t) => t.kind === seen.kind && t.label === label);
        if (index === -1) {
          const created: TaxDeductType = {
            id: newRevenueId("tdt"),
            label,
            kind: seen.kind,
            accountId: null,
            lineCount: 1,
            lastSeen: seenOn,
            operators: operator ? [operator] : [],
            isNew: true,
          };
          next.push(created);
          added.push(created);
          continue;
        }
        const existing = next[index];
        const lastSeen = existing.lastSeen && existing.lastSeen > seenOn ? existing.lastSeen : seenOn;
        const operators =
          operator && !existing.operators.includes(operator) ? [...existing.operators, operator] : existing.operators;
        const updated = { ...existing, lineCount: existing.lineCount + 1, lastSeen, operators };
        next[index] = updated;
        const addedAt = added.indexOf(existing);
        if (addedAt !== -1) added[addedAt] = updated;
      }
      writeAll(next);
      return added;
    },
    [readAll, writeAll],
  );

  return {
    types: data,
    loading: isLoading,
    unmappedCount,
    findByLabel,
    setAccount,
    ensureTypes,
    deleteType,
  };
};
