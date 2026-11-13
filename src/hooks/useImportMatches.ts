import { useCallback, useMemo } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeLabel } from "../types/revenue";

export interface RememberedWell {
  wellId: string;
  wellLabel: string;
}

/** What a check detail import remembered about one operator, for its next file. */
export interface OperatorImportMatches {
  /** The operator's contact id. */
  operatorId: string;
  /** Operator names as printed on its files (normalized), each pointing at this operator. */
  printedNames: string[];
  /** Owner Number on the operator's stubs → the owner's contact id. */
  owners: Record<string, string>;
  /** Operator CC → the well it was linked to. */
  wells: Record<string, RememberedWell>;
}

export interface ImportMatchesInput {
  operatorId: string;
  /** The operator name as printed on the file. */
  printedName: string;
  owners: Record<string, string>;
  wells: Record<string, RememberedWell>;
}

const EMPTY: OperatorImportMatches[] = [];

// gcTime is Infinity because the cache is the only copy of what's been remembered this session.
// Mocked: no BE support yet — swap the queryFn for executeGraphQL(FETCH_REVENUE_IMPORT_MATCHES) and
// saveMatches' cache write for executeGraphQL(SAVE_REVENUE_IMPORT_MATCHES, { matches: inputs })
export const importMatchesQuery = queryOptions({
  queryKey: ["revenueImportMatches"],
  queryFn: async (): Promise<OperatorImportMatches[]> => [],
  staleTime: Infinity,
  gcTime: Infinity,
});

const withoutBlanks = <T,>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key.trim(), value] as const)
      .filter(([key, value]) => key && value),
  ) as Record<string, T>;

/** Remembered owner-number → contact and operator CC → well matches, per operator, so an
 * operator's next check detail file matches without asking again. */
export const useImportMatches = () => {
  const queryClient = useQueryClient();
  const { data = EMPTY, isLoading } = useQuery(importMatchesQuery);

  const byOperator = useMemo(() => new Map(data.map((m) => [m.operatorId, m])), [data]);

  const findOperatorId = useCallback(
    (printedName: string): string | null => {
      const name = normalizeLabel(printedName);
      return (name && data.find((m) => m.printedNames.includes(name))?.operatorId) || null;
    },
    [data],
  );

  const getOwnerId = useCallback(
    (operatorId: string | null, ownerNumber: string): string | null =>
      (operatorId && byOperator.get(operatorId)?.owners[ownerNumber.trim()]) || null,
    [byOperator],
  );

  const getWell = useCallback(
    (operatorId: string | null, operatorCc: string): RememberedWell | null =>
      (operatorId && byOperator.get(operatorId)?.wells[operatorCc.trim()]) || null,
    [byOperator],
  );

  // Merges into what's already remembered; a printed name moves to the operator it's saved with.
  const saveMatches = useCallback(
    async (inputs: ImportMatchesInput[]): Promise<void> => {
      const all = await queryClient.ensureQueryData(importMatchesQuery);
      const next = all.map((m) => ({ ...m, printedNames: [...m.printedNames], owners: { ...m.owners }, wells: { ...m.wells } }));
      for (const input of inputs) {
        if (!input.operatorId) continue;
        const name = normalizeLabel(input.printedName);
        for (const other of next) {
          if (other.operatorId !== input.operatorId) other.printedNames = other.printedNames.filter((n) => n !== name);
        }
        let entry = next.find((m) => m.operatorId === input.operatorId);
        if (!entry) {
          entry = { operatorId: input.operatorId, printedNames: [], owners: {}, wells: {} };
          next.push(entry);
        }
        if (name && !entry.printedNames.includes(name)) entry.printedNames.push(name);
        Object.assign(entry.owners, withoutBlanks(input.owners));
        Object.assign(entry.wells, withoutBlanks(input.wells));
      }
      queryClient.setQueryData(importMatchesQuery.queryKey, next);
    },
    [queryClient],
  );

  return {
    matches: data,
    loading: isLoading,
    findOperatorId,
    getOwnerId,
    getWell,
    saveMatches,
  };
};
