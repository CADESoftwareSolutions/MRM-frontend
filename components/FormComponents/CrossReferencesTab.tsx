import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Plus, Trash2, X } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import {
  useCrossReferences,
  CrossReferenceEntityType,
  CrossReferenceOption,
  CrossReferenceRow,
} from "@/hooks/useCrossReferences";
import { ComboboxBase } from "./ComboboxBase";

interface CrossReferencesTabProps {
  entityType: CrossReferenceEntityType;
  entityId?: number | null;
}

const NOUN: Record<CrossReferenceEntityType, { singular: string; plural: string }> = {
  tract: { singular: "tract", plural: "Tracts" },
  lease: { singular: "lease", plural: "Leases" },
  title_document: { singular: "deed", plural: "Deeds" },
  well: { singular: "well", plural: "Wells" },
};

const SECTION_ORDER: CrossReferenceEntityType[] = ["tract", "lease", "title_document", "well"];

const MAX_OPTIONS = 50;

const filterOptions = (options: CrossReferenceOption[], query: string) => {
  const lower = query.trim().toLowerCase();
  if (!lower) return options.slice(0, MAX_OPTIONS);
  return options
    .filter((option) => [option.title, ...option.details].join(" ").toLowerCase().includes(lower))
    .slice(0, MAX_OPTIONS);
};

interface AddPickerProps {
  type: CrossReferenceEntityType;
  options: CrossReferenceOption[];
  onSelect: (option: CrossReferenceOption) => void;
  onCancel: () => void;
  isLight: boolean;
}

const AddPicker = ({ type, options, onSelect, onCancel, isLight }: AddPickerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterOptions(options, query), [options, query]);

  // ComboboxBase opens its dropdown on focus, so focusing here shows the list right after
  // clicking "Add" instead of needing a second click into the input.
  useEffect(() => {
    wrapperRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <div ref={wrapperRef} className="flex items-start gap-2">
      <div className="flex-1">
        <ComboboxBase
          inputValue={query}
          onInputChange={setQuery}
          items={filtered}
          getKey={(option) => option.key}
          onSelect={onSelect}
          placeholder={`Search existing ${NOUN[type].plural.toLowerCase()}…`}
          emptyMessage={
            options.length === 0
              ? `No other ${NOUN[type].plural.toLowerCase()} available to add`
              : `No ${NOUN[type].plural.toLowerCase()} match`
          }
          className={`h-9 bg-white/5 border-purple-300/30 ${isLight ? "" : "text-white"}`}
          renderItem={(option, isActive, select) => (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(option)}
              className={`flex w-full cursor-pointer flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none hover:bg-purple-400/30 ${
                isActive ? "bg-purple-400/30" : ""
              }`}
            >
              <span>{option.title}</span>
              {option.details.length > 0 && (
                <span className="text-xs text-white/50">{option.details.join(" · ")}</span>
              )}
            </button>
          )}
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        title="Cancel"
        className={`h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md transition-colors cursor-pointer ${
          isLight ? "text-gray-600 hover:bg-purple-100" : "text-white/70 hover:bg-purple-500/20"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface SectionProps {
  type: CrossReferenceEntityType;
  rows: CrossReferenceRow[];
  options: CrossReferenceOption[];
  onAdd: (option: CrossReferenceOption) => Promise<void>;
  onRemove: (linkId: number) => Promise<void>;
  isLight: boolean;
  emptyMessage: string;
}

const Section = ({ type, rows, options, onAdd, onRemove, isLight, emptyMessage }: SectionProps) => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noun = NOUN[type];

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLight ? "text-gray-800" : "text-white/90"}`}>
          {noun.plural}
          <span className="ml-2 text-xs font-normal text-purple-300/70">{rows.length}</span>
        </h3>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAdding(true);
            }}
            className={`inline-flex items-center justify-center gap-1 w-24 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? "border-purple-600 text-purple-600 hover:bg-purple-50"
                : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add {noun.singular}
          </button>
        )}
      </div>

      {adding && (
        <AddPicker
          type={type}
          options={options}
          isLight={isLight}
          onCancel={() => {
            setAdding(false);
            setError(null);
          }}
          onSelect={(option) => run(() => onAdd(option))}
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="border border-purple-300/20 rounded-xl overflow-hidden bg-white/5">
        {rows.length === 0 ? (
          <p className="text-center text-xs text-purple-300/70 py-4">{emptyMessage}</p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-start justify-between gap-3 px-3 py-2.5 border-b last:border-0 border-purple-300/10"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className={`text-sm font-medium ${isLight ? "text-gray-800" : "text-white"}`}>{row.title}</p>
                  {row.details.length > 0 && (
                    <p className={`text-xs ${isLight ? "text-gray-600" : "text-white/60"}`}>{row.details.join(" · ")}</p>
                  )}
                  <p className={`text-xs ${isLight ? "text-purple-700" : "text-purple-300/80"}`}>
                    {[row.derivedReason, row.manualLinkId != null && "Added manually"].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {row.manualLinkId != null && (
                  <button
                    type="button"
                    onClick={() => run(() => onRemove(row.manualLinkId as number))}
                    title="Remove manual cross-reference"
                    className={`p-1.5 shrink-0 rounded-md transition-colors cursor-pointer ${
                      isLight
                        ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                        : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Shared Cross-References tab for Lease/Deed/Well/Tract: records sharing a tract (derived from
// Legal Descriptions, read-only) plus manually added links (removable). See useCrossReferences.ts.
export const CrossReferencesTab = ({ entityType, entityId }: CrossReferencesTabProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const { linkedTracts, linkedLeases, linkedDeeds, linkedWells, optionsFor, addLink, removeLink } =
    useCrossReferences({ entityType, entityId });

  if (entityId == null) {
    return (
      <p className="text-center text-sm text-purple-300/70 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save to enable cross-references.
      </p>
    );
  }

  const rowsByType: Record<CrossReferenceEntityType, CrossReferenceRow[]> = {
    tract: linkedTracts,
    lease: linkedLeases,
    title_document: linkedDeeds,
    well: linkedWells,
  };
  const selfNoun = NOUN[entityType].singular;

  return (
    <div className="space-y-6">
      <p className="text-xs text-purple-300/70">
        Records that share a tract with this {selfNoun} are listed automatically from Legal Descriptions. Use
        &ldquo;Add&rdquo; to cross-reference any other record by hand.
      </p>
      {SECTION_ORDER.map((type) => (
        <Section
          key={type}
          type={type}
          rows={rowsByType[type]}
          options={optionsFor(type)}
          onAdd={(option) => addLink(option.entityType, option.entityId)}
          onRemove={removeLink}
          isLight={isLight}
          emptyMessage={`No ${NOUN[type].plural.toLowerCase()} cross-referenced with this ${selfNoun} yet.`}
        />
      ))}
    </div>
  );
};

export default CrossReferencesTab;
