import { queryOptions, useQuery } from "@tanstack/react-query";
import { MOCK_REVENUE_CHECKS } from "../mocks/revenue";
import { RevenueCheck } from "../types/revenue";

const EMPTY: RevenueCheck[] = [];

// gcTime is Infinity only while this is mocked: the cache is the only copy of the session's edits.
export const revenueChecksQuery = queryOptions({
  queryKey: ["revenueChecks"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_REVENUE_CHECKS)
  queryFn: async (): Promise<RevenueCheck[]> => structuredClone(MOCK_REVENUE_CHECKS),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const useRevenueChecks = () => {
  const { data = EMPTY, isLoading } = useQuery(revenueChecksQuery);
  return { checks: data, loading: isLoading };
};
