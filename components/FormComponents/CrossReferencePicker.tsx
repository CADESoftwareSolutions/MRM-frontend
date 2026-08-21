import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

export interface CrossRefOption {
  id: number;
  label: string;
}

interface CrossReferencePickerProps {
  options: CrossRefOption[];
  excludeIds: Set<number>;
  placeholder: string;
  onAdd: (option: CrossRefOption) => void;
  disabled?: boolean;
  /** Extra control rendered to the right of the search box (e.g. a cost input for Acquisitions). */
  extraControl?: React.ReactNode;
}

// placeholder:text-white/30 is only boosted by index.css's dark-mode-brightness block when it's
// the element's own text color — that block doesn't reach the ::placeholder pseudo-element a
// `placeholder:` variant targets, so it rendered at a true (too-faint) 30% opacity in dark mode.
export const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-purple-400 transition-colors";

// A search-box-with-dropdown, generalized to any {id,label} option list — Names/Leases/Wells/
// Acquisitions on the Deeds cross-reference tab all need this exact interaction (search, click
// a result to add, exclude already-linked ids).
export const CrossReferencePicker = ({
  options,
  excludeIds,
  placeholder,
  onAdd,
  disabled = false,
  extraControl,
}: CrossReferencePickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filtered = useMemo(() => {
    const available = options.filter((option) => !excludeIds.has(option.id));
    const lower = query.trim().toLowerCase();
    if (!lower) return available.slice(0, 25);
    return available.filter((option) => option.label.toLowerCase().includes(lower)).slice(0, 25);
  }, [options, excludeIds, query]);

  return (
    <div className="flex gap-2">
      <div ref={rootRef} className="relative flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            placeholder={placeholder}
            className={`${inputCls} pl-9 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-purple-300/30 bg-[#1a1a2e] p-1 shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-2 py-2 text-sm text-white/60">No results</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onAdd(option);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none hover:bg-purple-400/30"
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {extraControl}
    </div>
  );
};

export default CrossReferencePicker;
