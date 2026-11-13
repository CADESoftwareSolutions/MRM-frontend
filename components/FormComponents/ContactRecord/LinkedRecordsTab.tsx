import React from "react";
import Link from "next/link";
import { ArrowUpRight, Banknote, FileSignature, Layers, MapPin, LucideIcon } from "lucide-react";
import type { LinkedRecord, LinkedRecordKind } from "@/hooks/useContactDetails";
import { SECTION_HEADER, Tone, toneClass } from "./utils";

interface LinkedRecordsTabProps {
  records: LinkedRecord[];
  /** False for a contact that hasn't been saved yet. */
  saved: boolean;
  isLight: boolean;
}

const GROUPS: { kind: LinkedRecordKind; label: string; icon: LucideIcon }[] = [
  { kind: "tract", label: "Tracts", icon: MapPin },
  { kind: "lease", label: "Leases", icon: FileSignature },
  { kind: "check", label: "Checks", icon: Banknote },
  { kind: "deck", label: "Decks", icon: Layers },
];

const statusTone = (status: string): Tone => {
  if (/outstanding|suspense|missing/i.test(status)) return "warning";
  if (/cashed|active|paid/i.test(status)) return "success";
  if (/hbp/i.test(status)) return "info";
  return "neutral";
};

type Filter = LinkedRecordKind | "all";

export const LinkedRecordsTab = ({ records, saved, isLight }: LinkedRecordsTabProps) => {
  const [filter, setFilter] = React.useState<Filter>("all");

  if (!saved) {
    return (
      <div className="flex items-center justify-center py-16 text-purple-300/70 text-sm">
        Linked records show once this contact is saved and used on a tract, lease, check or deck.
      </div>
    );
  }

  const pill = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all cursor-pointer ${
      active
        ? "bg-purple-600 text-white border-purple-500"
        : "bg-white/5 text-purple-200 border-purple-300/20 hover:bg-white/10"
    }`;

  const shownGroups = GROUPS.filter((g) => filter === "all" || g.kind === filter);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className={SECTION_HEADER}>Linked Records</h3>
        <p className="form-help-text text-xs">Tracts, leases, checks and revenue decks this contact appears on.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter linked records">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={pill(filter === "all")}>
          All <span className="text-xs opacity-80">{records.length}</span>
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.kind}
            type="button"
            aria-pressed={filter === g.kind}
            onClick={() => setFilter(g.kind)}
            className={pill(filter === g.kind)}
          >
            {g.label} <span className="text-xs opacity-80">{records.filter((r) => r.kind === g.kind).length}</span>
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/70">Nothing links to this contact yet.</p>
      ) : (
        shownGroups.map((group) => {
          const items = records.filter((r) => r.kind === group.kind);
          if (items.length === 0) {
            return filter === group.kind ? (
              <p key={group.kind} className="py-6 text-center text-sm text-white/70">
                No {group.label.toLowerCase()} link to this contact.
              </p>
            ) : null;
          }
          const Icon = group.icon;
          return (
            <div key={group.kind} className="border-t border-purple-300/30 pt-2 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                {group.label} · {items.length}
              </h4>
              {items.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg bg-white/5 border border-purple-300/20 px-3 py-2.5"
                >
                  <Icon className="w-4 h-4 shrink-0 text-purple-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={record.href} className="text-sm font-medium text-white hover:underline">
                        {record.label}
                      </Link>
                      {record.status && (
                        <span
                          className={`inline-flex h-[20px] items-center rounded-md px-2 text-xs font-medium ${toneClass(
                            statusTone(record.status),
                            isLight,
                          )}`}
                        >
                          {record.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 truncate">{record.detail}</p>
                  </div>
                  <Link
                    href={record.href}
                    className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-100 hover:underline shrink-0"
                  >
                    Open
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

export default LinkedRecordsTab;
