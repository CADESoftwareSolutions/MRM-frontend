import { useQuery } from "@tanstack/react-query";

import { FETCH_STATE_COUNTY_REFERENCE } from "@/graphql/ReferenceData";
import { executeGraphQL } from "@/lib/api";

export interface CountyReference {
  name: string;
  stateCode: string;
  fullName?: string | null;
  fipsState?: string | null;
  fipsCounty?: string | null;
}

export interface StateCountyReference {
  code: string;
  name: string;
  counties: CountyReference[];
}

export const useStateCountyReference = () =>
  useQuery<StateCountyReference[]>({
    queryKey: ["state-county-reference"],
    queryFn: async () => {
      const data = await executeGraphQL(FETCH_STATE_COUNTY_REFERENCE);
      return data.stateCountyReference ?? [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
