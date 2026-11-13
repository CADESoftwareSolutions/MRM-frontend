import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FETCH_ACQUISITIONS } from "../graphql/Acquisitions";
import { executeGraphQL } from "../lib/api";

export interface AcquisitionOption {
  id: string;
  name: string;
  /** "YYYY-MM-DD", or "" when the acquisition has no date. */
  acquisitionDate: string;
}

interface AcquisitionRow {
  id: number | string;
  name?: string | null;
  acquisitionDate?: string | null;
}

const toAcquisitionOption = (acquisition: AcquisitionRow): AcquisitionOption => ({
  id: String(acquisition.id),
  name: acquisition.name || `Acquisition ${acquisition.id}`,
  acquisitionDate: acquisition.acquisitionDate || "",
});

const NO_ACQUISITIONS: AcquisitionOption[] = [];

/** Read-only acquisition list for pickers on other screens. useAcquisitions is the Acquisitions
 * page's own hook and resets moduleViewAtom on unmount, so it can't be reused outside that page. */
export const useAcquisitionOptions = () => {
  const { data = NO_ACQUISITIONS, isLoading } = useQuery({
    // Nested under ["acquisitions"] so that screen's invalidate-after-save (a prefix match) also
    // refreshes these pickers, while staying a separate cache entry for this different shape.
    queryKey: ["acquisitions", "options"],
    queryFn: async (): Promise<AcquisitionOption[]> => {
      const result = await executeGraphQL(FETCH_ACQUISITIONS);
      const rows: AcquisitionRow[] = result?.acquisitions ?? [];
      return rows
        .map(toAcquisitionOption)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const getAcquisition = useCallback(
    (id: string | null | undefined) => (id ? data.find((acquisition) => acquisition.id === id) : undefined),
    [data],
  );

  return { acquisitions: data, loading: isLoading, getAcquisition };
};

export default useAcquisitionOptions;
