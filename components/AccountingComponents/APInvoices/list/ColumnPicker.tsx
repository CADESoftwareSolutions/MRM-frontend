import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Lock, SlidersHorizontal } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";

interface ColumnPickerProps<T extends string> {
  columns: { id: T; label: string; locked?: boolean }[];
  visible: T[];
  onToggle: (id: T) => void;
}

export const ColumnPicker = <T extends string>({ columns, visible, onToggle }: ColumnPickerProps<T>) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
          isLight
            ? "border-purple-200 text-gray-500 hover:bg-purple-50 hover:text-purple-700"
            : "border-purple-300/30 text-purple-300/70 hover:bg-purple-500/20 hover:text-purple-200"
        } ${open ? (isLight ? "bg-purple-50 text-purple-700" : "bg-purple-500/20 text-purple-200") : ""}`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Columns
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-xl z-50 py-2 ${
            isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
          }`}
        >
          <p
            className={`px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider ${
              isLight ? "text-gray-500" : "text-purple-300/80"
            }`}
          >
            Visible columns
          </p>
          {columns.map((col) => {
            const checked = visible.includes(col.id);
            return (
              <button
                key={col.id}
                type="button"
                aria-pressed={checked}
                disabled={col.locked}
                onClick={() => onToggle(col.id)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  col.locked
                    ? "cursor-default opacity-60"
                    : `cursor-pointer ${isLight ? "hover:bg-purple-50" : "hover:bg-purple-500/20"}`
                } ${isLight ? "text-gray-700" : "text-white"}`}
              >
                <span className="flex items-center gap-2">
                  {col.locked && <Lock className="w-3 h-3 opacity-50" />}
                  {col.label}
                </span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    checked ? "bg-purple-600 border-purple-600" : isLight ? "border-gray-300" : "border-purple-300/40"
                  }`}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColumnPicker;
