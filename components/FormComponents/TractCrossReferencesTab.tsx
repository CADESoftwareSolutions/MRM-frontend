import { useAtom } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";

export interface TractLinkedRef {
  id: string;
  name: string;
}

interface TractCrossReferencesTabProps {
  linkedLeases: TractLinkedRef[];
  linkedDeeds: TractLinkedRef[];
  hasId: boolean;
}

const ReadOnlyLinkedList = ({
  title,
  rows,
  emptyMessage,
  isLight,
}: {
  title: string;
  rows: TractLinkedRef[];
  emptyMessage: string;
  isLight: boolean;
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">{title}</h3>
    <div className="border border-purple-300/20 rounded-xl overflow-hidden bg-white/5">
      {rows.length === 0 ? (
        <p className="text-center text-xs text-purple-300/70 py-4">{emptyMessage}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li
              key={row.id}
              className={`px-3 py-2 text-sm border-b last:border-0 border-purple-300/10 ${
                isLight ? "text-gray-800" : "text-white"
              }`}
            >
              {row.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

// Read-only: a tract gets linked to a Lease/Deed by that record's own Legal Description tab
// authoring an entry against it (LegalDescriptionListField), not from here — this just surfaces
// what already points at this tract, same leaseLinks/titleDocumentLinks data useTracts.ts
// derives from FETCH_TRACTS.
export const TractCrossReferencesTab = ({ linkedLeases, linkedDeeds, hasId }: TractCrossReferencesTabProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  if (!hasId) {
    return (
      <p className="text-center text-sm text-purple-300/70 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save the tract to see linked leases and deeds.
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
    </div>
  );
};

export default TractCrossReferencesTab;
