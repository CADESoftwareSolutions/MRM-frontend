import { useCallback, useMemo } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_TAX_DEDUCT_TYPES } from "../mocks/revenue";
import { TaxDeductType, isTypeMapped, normalizeLabel } from "../types/revenue";
import { revenueChecksQuery } from "./useRevenueChecks";

const EMPTY: TaxDeductType[] = [];

// Read by the Tax & Deduct Types screen, the tab badge, the check list and the account delete
// guard. gcTime is Infinity only while this is mocked: the cache is the only copy of the
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

  return {
    types: data,
    loading: isLoading,
    unmappedCount,
    setAccount,
    deleteType,
  };
};
