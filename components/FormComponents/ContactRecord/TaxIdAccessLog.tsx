import React from "react";
import type { TaxIdAccessAction, TaxIdAccessEntry } from "@/hooks/useContactDetails";
import { PANEL, SECTION_HEADER, formatTimestamp, parseTimestamp } from "./utils";

const ACTION_LABELS: Record<TaxIdAccessAction, string> = {
  viewed: "Full Tax ID viewed",
  entered: "Tax ID entered",
  changed: "Tax ID changed",
};

interface TaxIdAccessLogProps {
  entries: TaxIdAccessEntry[];
  /** False before the contact is saved; nothing is logged until then. */
  saved: boolean;
  pageSize?: number;
}

export const TaxIdAccessLog = ({ entries, saved, pageSize = 5 }: TaxIdAccessLogProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const sorted = React.useMemo(
    () =>
      [...entries].sort(
        (a, b) => (parseTimestamp(b.at)?.getTime() ?? 0) - (parseTimestamp(a.at)?.getTime() ?? 0),
      ),
    [entries],
  );
  const visible = expanded ? sorted : sorted.slice(0, pageSize);

  return (
    <section className={PANEL} aria-label="Tax ID access log">
      <h3 className={`${SECTION_HEADER} mb-1`}>Tax ID Access Log</h3>
      {!saved ? (
        <p className="py-2 text-sm text-white/70">Views and changes are logged once the contact is saved.</p>
      ) : sorted.length === 0 ? (
        <p className="py-2 text-sm text-white/70">No views or changes logged yet.</p>
      ) : (
        visible.map((entry, i) => (
          <div
            key={entry.id}
            className={`py-2.5 ${i < visible.length - 1 ? "border-b border-purple-300/10" : ""}`}
          >
            <div className="text-sm text-white">{ACTION_LABELS[entry.action]}</div>
            <div className="text-xs text-white/70">
              {[entry.user, formatTimestamp(entry.at)].filter(Boolean).join(" · ")}
            </div>
          </div>
        ))
      )}
      {saved && sorted.length > pageSize && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs text-purple-300 hover:text-purple-100 hover:underline cursor-pointer"
        >
          {expanded ? "Show fewer" : `Show all ${sorted.length} entries`}
        </button>
      )}
    </section>
  );
};

export default TaxIdAccessLog;
