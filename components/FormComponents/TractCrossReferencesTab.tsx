import { useAtom } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ReadOnlyLinkedList, LinkedRef as TractLinkedRef } from "./ReadOnlyLinkedList";

export type { TractLinkedRef };

interface TractCrossReferencesTabProps {
  linkedLeases: TractLinkedRef[];
  linkedDeeds: TractLinkedRef[];
  linkedWells: TractLinkedRef[];
  hasId: boolean;
}

// Read-only: a tract gets linked to a Lease/Deed/Well by that record's own Legal Descriptions tab
// (TractPickerField), not from here — this just surfaces what already points at this tract,
// the same tract_join rows useTracts.ts derives from FETCH_TRACTS's `joins`.
export const TractCrossReferencesTab = ({ linkedLeases, linkedDeeds, linkedWells, hasId }: TractCrossReferencesTabProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  if (!hasId) {
    return (
      <p className="text-center text-sm text-purple-300/70 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save the tract to see linked leases, deeds, and wells.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ReadOnlyLinkedList
        title="Leases"
        rows={linkedLeases}
        emptyMessage="No leases reference this tract yet."
        isLight={isLight}
      />
      <ReadOnlyLinkedList
        title="Deeds"
        rows={linkedDeeds}
        emptyMessage="No deeds reference this tract yet."
        isLight={isLight}
      />
      <ReadOnlyLinkedList
        title="Wells"
        rows={linkedWells}
        emptyMessage="No wells reference this tract yet."
        isLight={isLight}
      />
    </div>
  );
};

export default TractCrossReferencesTab;
