import { useQuery } from "@tanstack/react-query";
import { FETCH_WELL_OPTIONS } from "../graphql/Wells";
import { executeGraphQL } from "../lib/api";

export interface WellOption {
  id: string;
  label: string;
  name: string;
  leaseName: string;
  wellNumber: string;
  apiNumber: string;
  operatorName: string;
  stateCode: string;
  countyName: string;
}

const toWellOption = (well: any): WellOption => {
  const name = well.name || "";
  const leaseName = well.leaseName || "";
  const wellNumber = well.wellNumber || "";
  return {
    id: String(well.id),
    label: name || [leaseName, wellNumber].filter(Boolean).join(" ") || `Well ${well.id}`,
    name,
    leaseName,
    wellNumber,
    apiNumber: well.apiNumber || "",
    operatorName: well.operatorName || "",
    stateCode: well.stateCode || "",
    countyName: well.countyName || "",
  };
};

// Lightweight read-only well list for pickers on other screens. useWells is the Wells page's own
// hook and resets moduleViewAtom on unmount, so it can't be reused outside that page.
export const useWellOptions = () => {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["wells", "options"],
    queryFn: async (): Promise<WellOption[]> => {
      const result = await executeGraphQL(FETCH_WELL_OPTIONS);
      return (result?.wells ?? []).map(toWellOption);
    },
    staleTime: 5 * 60 * 1000,
  });
  return {
    wells: data,
    loading: isLoading,
    isError,
    refetch: () => {
      void refetch();
    },
  };
};
