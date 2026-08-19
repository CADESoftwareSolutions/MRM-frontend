import { X } from "lucide-react";

export const numberOrNull = (raw: string): number | null => (raw === "" ? null : Number(raw));

export interface LinkedRow {
  id: string;
  primary: string;
  secondary?: React.ReactNode;
}

interface LinkedRowsTableProps {
  rows: LinkedRow[];
  emptyMessage: string;
  nameHeader: string;
  extraHeader?: string;
  onRemove: (id: string) => void;
  isLight: boolean;
}

// Shared by Deed/LeaseCrossReferencesTab — a linked-entities table (Name/Lease/Well/Acquisition
// all render the same shape, just with or without an extra column like Acquisition's cost).
export const LinkedRowsTable = ({
  rows,
  emptyMessage,
  nameHeader,
  extraHeader,
  onRemove,
  isLight,
}: LinkedRowsTableProps) => (
  <div className="border border-purple-300/20 rounded-xl overflow-hidden bg-white/5">
    {rows.length === 0 ? (
      // text-purple-300/40 has no light-theme override (only /70 does) and no dark-mode
      // brightness boost either, so it rendered washed-out in both themes — /70 has both.
      <p className="text-center text-xs text-purple-300/70 py-4">{emptyMessage}</p>
    ) : (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-purple-300/20">
            <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
              {nameHeader}
            </th>
            {extraHeader && (
              <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
                {extraHeader}
              </th>
            )}
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0 border-purple-300/10">
              <td className={`px-3 py-2 ${isLight ? "text-gray-800" : "text-white"}`}>{row.primary}</td>
              {extraHeader && <td className="px-3 py-2">{row.secondary}</td>}
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    isLight
                      ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                      : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
                  }`}
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default LinkedRowsTable;
