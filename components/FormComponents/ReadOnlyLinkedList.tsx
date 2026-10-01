export interface LinkedRef {
  id: string;
  name: string;
}

interface ReadOnlyLinkedListProps {
  title: string;
  rows: LinkedRef[];
  emptyMessage: string;
  isLight: boolean;
}

// Shared by TractCrossReferencesTab.tsx and SharedTractReferencesTab.tsx — both render the
// same "read-only list of linked records" shape, just sourced from opposite sides of the same
// tract_join rows (a Tract's own linked Leases/Deeds/Wells vs. a Lease/Deed/Well's linked
// Tracts' other Leases/Deeds/Wells).
export const ReadOnlyLinkedList = ({ title, rows, emptyMessage, isLight }: ReadOnlyLinkedListProps) => (
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

export default ReadOnlyLinkedList;
