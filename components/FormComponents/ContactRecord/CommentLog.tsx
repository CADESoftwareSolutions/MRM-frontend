import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContactComment, ContactCommentCategory } from "@/hooks/useContactDetails";
import { PANEL, SECTION_HEADER, formatTimestamp, parseTimestamp } from "./utils";

interface CommentLogProps {
  comments: ContactComment[];
  /** The BE `notes` field, shown as the oldest entry so nothing written before the log existed is lost. */
  legacyNote?: { text: string; createdAt?: string | null } | null;
  /** Omit to show the log read-only (e.g. before the contact is saved). */
  onAdd?: (text: string) => Promise<void>;
  disabledHint?: string;
  pageSize?: number;
  title?: string;
  /** Adds an All / <category> toggle that starts on that category's comments. The legacy note
   * only shows under All. */
  filterCategory?: ContactCommentCategory;
  /** Drops the panel box, for a log shown as a section of a tab rather than in the side rail. */
  bare?: boolean;
}

const CATEGORY_LABELS: Record<ContactCommentCategory, string> = {
  general: "General",
  tax: "Tax",
  vendor: "Vendor",
};

const TAG = "inline-flex h-[18px] items-center rounded-[5px] px-1.5 text-[10px] font-bold tracking-wider";

interface Entry {
  key: string;
  meta: string;
  text: string;
  tag?: { label: string; className: string };
}

export const CommentLog = ({
  comments,
  legacyNote,
  onAdd,
  disabledHint = "Save the contact to start its comment log.",
  pageSize = 5,
  title = "Comments",
  filterCategory,
  bare = false,
}: CommentLogProps) => {
  const [draft, setDraft] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const activeCategory = filterCategory && !showAll ? filterCategory : null;
  const [saving, setSaving] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const entries = React.useMemo<Entry[]>(() => {
    const sorted = comments.filter((c) => !activeCategory || c.category === activeCategory).sort(
      (a, b) => (parseTimestamp(b.createdAt)?.getTime() ?? 0) - (parseTimestamp(a.createdAt)?.getTime() ?? 0),
    );
    const list: Entry[] = sorted.map((c) => ({
      key: c.id,
      meta: [formatTimestamp(c.createdAt), c.author].filter(Boolean).join(" · "),
      text: c.text,
      tag: c.auto ? { label: "AUTO", className: "bg-blue-500/20 text-blue-300" } : undefined,
    }));
    const note = legacyNote?.text.trim();
    if (note && !activeCategory) {
      list.push({
        key: "legacy-notes",
        meta: [formatTimestamp(legacyNote?.createdAt), "from the record's notes"].filter(Boolean).join(" · "),
        text: note,
        tag: { label: "NOTES", className: "bg-purple-500/20 text-purple-200" },
      });
    }
    return list;
  }, [comments, legacyNote, activeCategory]);

  const visible = expanded ? entries : entries.slice(0, pageSize);

  const submit = async () => {
    if (!onAdd || !draft.trim()) return;
    setSaving(true);
    try {
      await onAdd(draft);
      setDraft("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={bare ? undefined : PANEL} aria-label={title}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className={SECTION_HEADER}>{title}</h3>
        {filterCategory ? (
          <div
            role="group"
            aria-label="Show comments"
            className="inline-flex gap-0.5 rounded-md border border-purple-300/20 bg-white/5 p-0.5"
          >
            {[
              { all: true, label: "All" },
              { all: false, label: CATEGORY_LABELS[filterCategory] },
            ].map((option) => {
              const selected = showAll === option.all;
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setShowAll(option.all)}
                  className={`h-[22px] rounded-[5px] px-2 text-xs font-medium cursor-pointer transition-colors ${
                    selected ? "bg-purple-600 text-white" : "text-purple-200 hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-white/70">{entries.length} total</span>
        )}
      </div>

      {onAdd ? (
        <>
          <Textarea
            aria-label="Add a comment"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add a comment…"
            className="bg-white/5 border-purple-300/30 text-white min-h-[60px] resize-y"
          />
          <div className="flex justify-end mt-1.5 mb-0.5">
            <Button
              type="button"
              size="sm"
              disabled={!draft.trim() || saving}
              onClick={submit}
              className="h-8 bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-white/70 mb-1">{disabledHint}</p>
      )}

      {entries.length === 0 ? (
        <p className="py-2 text-sm text-white/70">
          {activeCategory ? `No ${CATEGORY_LABELS[activeCategory].toLowerCase()} comments yet.` : "No comments yet."}
        </p>
      ) : (
        visible.map((entry, i) => (
          <div
            key={entry.key}
            className={`py-2.5 ${i < visible.length - 1 ? "border-b border-purple-300/10" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
              {entry.tag && <span className={`${TAG} ${entry.tag.className}`}>{entry.tag.label}</span>}
              {entry.meta}
            </div>
            <p className="mt-1 text-sm text-white whitespace-pre-wrap break-words">{entry.text}</p>
          </div>
        ))
      )}

      {entries.length > pageSize && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs text-purple-300 hover:text-purple-100 hover:underline cursor-pointer"
        >
          {expanded ? "Show fewer" : `Show all ${entries.length} comments`}
        </button>
      )}
    </section>
  );
};

export default CommentLog;
