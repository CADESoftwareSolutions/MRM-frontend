import { useAtom } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useSharedTractReferences, TractEntityType } from "@/hooks/useSharedTractReferences";
import { ReadOnlyLinkedList } from "./ReadOnlyLinkedList";

interface SharedTractReferencesTabProps {
  entityType: TractEntityType;
  entityId?: number | null;
}

const NOUN: Record<TractEntityType, string> = {
  lease: "lease",
  title_document: "deed",
  well: "well",
};

// One shared read-only tab for Lease/Deed/Well's Cross-References — lists every other record
// that shares at least one Tract with this one (added via its own Legal Descriptions tab), rather than a
// manually curated set of links. Requires an existing id since the derivation reads this
// record's saved tract_join rows off the Tracts cache.
export const SharedTractReferencesTab = ({ entityType, entityId }: SharedTractReferencesTabProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const { linkedLeases, linkedDeeds, linkedWells } = useSharedTractReferences({ entityType, entityId });

  if (entityId == null) {
    return (
      <p className="text-center text-sm text-purple-300/70 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save to enable cross-references.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-purple-300/70">
        Other records that share a tract with this {NOUN[entityType]}, added from its Legal Descriptions tab.
      </p>
      <ReadOnlyLinkedList
        title="Leases"
        rows={linkedLeases}
        emptyMessage="No leases share a tract with this record yet."
        isLight={isLight}
      />
      <ReadOnlyLinkedList
        title="Deeds"
        rows={linkedDeeds}
        emptyMessage="No deeds share a tract with this record yet."
        isLight={isLight}
      />
      <ReadOnlyLinkedList
        title="Wells"
        rows={linkedWells}
        emptyMessage="No wells share a tract with this record yet."
        isLight={isLight}
      />
    </div>
  );
};

export default SharedTractReferencesTab;
