import { useQuery } from "@tanstack/react-query";

import { FETCH_STATE_COUNTY_REFERENCE } from "@/graphql/ReferenceData";
import { API_URL } from "@/lib/api";

const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

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

const executeGraphQL = async (query: string) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const result = await response.json();
  if (response.status === 401) throw new Error("Authentication required");
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
};

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
