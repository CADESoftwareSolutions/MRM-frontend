import { useCallback } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { AfeOption, MOCK_AFES } from "../mocks/afes";

export type { AfeOption } from "../mocks/afes";

export const afeOptionsQuery = queryOptions({
  queryKey: ["afeOptions"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_AFES)
  queryFn: async (): Promise<AfeOption[]> => structuredClone(MOCK_AFES),
  staleTime: Infinity,
});

const NO_AFES: AfeOption[] = [];

/** Read-only AFE list for pickers (invoice coding lines). */
export const useAfeOptions = () => {
  const { data = NO_AFES, isLoading } = useQuery(afeOptionsQuery);
  const getAfe = useCallback(
    (number: string | null | undefined) => (number ? data.find((afe) => afe.number === number) : undefined),
    [data],
  );
  return { afes: data, loading: isLoading, getAfe };
};

export default useAfeOptions;
