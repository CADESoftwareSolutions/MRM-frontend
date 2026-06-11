import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Lock, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { ModuleConfig } from "../../src/config/directoryConfig";
import { useAtom } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";

interface ListProps {
  config: ModuleConfig;
  data: any[];
  loading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

const CLASSIFICATION_COLORS_DARK: Record<string, string> = {
  REV: "bg-green-500/20 text-green-300 border-green-400/30",
  JIB: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  OPERATOR: "bg-violet-500/20 text-violet-300 border-violet-400/30",
  PURCHASER: "bg-orange-500/20 text-orange-300 border-orange-400/30",
  VENDOR: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  EMPLOYEE: "bg-pink-500/20 text-pink-300 border-pink-400/30",
  PARTNER: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
};

const CLASSIFICATION_COLORS_LIGHT: Record<string, string> = {
  REV: "bg-green-100 text-green-700 border-green-300",
  JIB: "bg-blue-100 text-blue-700 border-blue-300",
  OPERATOR: "bg-violet-100 text-violet-700 border-violet-300",
  PURCHASER: "bg-orange-100 text-orange-700 border-orange-300",
  VENDOR: "bg-yellow-100 text-yellow-700 border-yellow-300",
  EMPLOYEE: "bg-pink-100 text-pink-700 border-pink-300",
  PARTNER: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  Active: "bg-green-500/20 text-green-300 border-green-400/30",
  Inactive: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  HBP: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  Expired: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  Released: "bg-orange-500/20 text-orange-300 border-orange-400/30",
};

const STATUS_COLORS_LIGHT: Record<string, string> = {
  Active: "bg-green-100 text-green-700 border-green-300",
  Inactive: "bg-gray-100 text-gray-500 border-gray-300",
  HBP: "bg-blue-100 text-blue-700 border-blue-300",
  Expired: "bg-gray-100 text-gray-500 border-gray-300",
  Released: "bg-orange-100 text-orange-700 border-orange-300",
};

const toLabel = (id: string) => {
  if (id === "fullAddress") return "Address";
  if (id === "leaseStatus") return "Status";
  return id.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
};

const isLockedColumn = (col: string, firstField: string) =>
  col === firstField ||
  col === "name" ||
  col === "lessor" ||
  col === "status" ||
  col === "leaseStatus";

const TruncatedCell = ({ text, isLight }: { text: string; isLight: boolean }) => (
  <span className={`block truncate text-sm w-full ${isLight ? "text-gray-700" : "text-white"}`}>
    {text}
  </span>
);

export const List: React.FC<ListProps> = ({
  config,
  data,
  loading = false,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  const storageKey = `mrm-columns-${config.name}`;
  const widthKey = `mrm-colwidths-${config.name}`;
  const firstField = config.listFields[0];

  const [visibleCols, setVisibleCols] = useState<string[]>([...config.listFields]);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(widthKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const getColWidth = (col: string) => colWidths[col] ?? 160;

  const startResize = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = getColWidth(col);
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(80, startWidth + ev.clientX - startX);
      setColWidths((prev) => {
        const updated = { ...prev, [col]: next };
        localStorage.setItem(widthKey, JSON.stringify(updated));
        return updated;
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const locked = config.listFields.filter((c) => isLockedColumn(c, firstField));
        const merged = [...new Set([...locked, ...parsed.filter((c) => config.listFields.includes(c))])];
        setVisibleCols(config.listFields.filter((c) => merged.includes(c)));
      }
    } catch {}
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleCols));
  }, [visibleCols, storageKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCol = (col: string) => {
    if (isLockedColumn(col, firstField)) return;
    setVisibleCols((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : config.listFields.filter((c) => [...prev, col].includes(c))
    );
  };

  const columns = config.listFields.filter((c) => visibleCols.includes(c));

  const classColors = isLight ? CLASSIFICATION_COLORS_LIGHT : CLASSIFICATION_COLORS_DARK;
  const statusColors = isLight ? STATUS_COLORS_LIGHT : STATUS_COLORS_DARK;
  const fallbackBadge = isLight
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : "bg-purple-500/20 text-purple-300 border-purple-400/30";
  const emptyText = isLight ? "text-gray-500" : "text-white/40";

  const renderCell = (fieldId: string, value: any, item: any) => {
    if (fieldId === "fullAddress") {
      const parts: string[] = [];
      if (item.address) parts.push(item.address);
      const cityState = [item.city, item.state].filter(Boolean).join(", ");
      if (cityState) parts.push(cityState);
      if (item.zip) parts.push(item.zip);
      if (!parts.length) return <span className={emptyText}>—</span>;
      const full = parts.join(", ");
      return <TruncatedCell text={full} isLight={isLight} />;
    }

    if (value == null || value === "") return <span className={emptyText}>—</span>;

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className={emptyText}>—</span>;
      const visible = value.slice(0, 2);
      const overflow = value.length - visible.length;
      return (
        <div className="flex items-center gap-1 overflow-hidden">
          {visible.map((v: string) => (
            <Badge key={v} variant="outline" className={`text-xs font-medium shrink-0 ${classColors[v] ?? fallbackBadge}`}>
              {v}
            </Badge>
          ))}
          {overflow > 0 && (
            <span className={`text-xs shrink-0 ${isLight ? "text-gray-400" : "text-white/40"}`}>+{overflow}</span>
          )}
        </div>
      );
    }

    if (fieldId === "status" || fieldId === "leaseStatus") {
      return (
        <Badge variant="outline" className={`text-xs font-medium ${statusColors[value] ?? fallbackBadge}`}>
          {value}
        </Badge>
      );
    }

    return <TruncatedCell text={String(value)} isLight={isLight} />;
  };

  const borderColor = isLight ? "rgb(167 139 250 / 0.25)" : "rgb(167 139 250 / 0.2)";
  const dividerColor = isLight ? "rgb(167 139 250 / 0.2)" : "rgb(167 139 250 / 0.15)";
  const containerBg = isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)";

  return (
    // Outer wrapper: NO overflow-hidden so the column-picker dropdown can escape
    <div className="rounded-xl border" style={{ borderColor, background: containerBg }}>

      {/* Search + column picker — sits above the table, z-index lets dropdown float over it */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b rounded-t-xl relative z-20"
        style={{ borderColor: dividerColor, background: containerBg }}
      >
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-gray-400" : "text-purple-300/60"}`} />
          <Input
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 h-9 border ${
              isLight
                ? "bg-white border-purple-200 text-gray-800 placeholder:text-gray-400"
                : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40"
            }`}
          />
        </div>

        {/* Column picker */}
        <div className="relative shrink-0" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? "border-purple-200 text-gray-500 hover:bg-purple-50 hover:text-purple-700"
                : "border-purple-300/30 text-purple-300/70 hover:bg-purple-500/20 hover:text-purple-200"
            } ${showPicker ? (isLight ? "bg-purple-50 text-purple-700" : "bg-purple-500/20 text-purple-200") : ""}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Columns
          </button>

          {showPicker && (
            <div
              className={`absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-xl z-50 py-2 ${
                isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
              }`}
            >
              <p className={`px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-purple-300/80"}`}>
                Visible columns
              </p>
              {config.listFields.map((col) => {
                const locked = isLockedColumn(col, firstField);
                const checked = visibleCols.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleCol(col)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                      locked ? "cursor-default opacity-60" : "cursor-pointer"
                    } ${
                      locked
                        ? ""
                        : isLight
                        ? "hover:bg-purple-50"
                        : "hover:bg-purple-500/20"
                    } ${isLight ? "text-gray-700" : "text-white"}`}
                  >
                    <span className="flex items-center gap-2">
                      {locked && <Lock className="w-3 h-3 opacity-50" />}
                      {toLabel(col)}
                    </span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        checked
                          ? "bg-purple-600 border-purple-600"
                          : isLight
                          ? "border-gray-300"
                          : "border-purple-300/40"
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table — overflow-hidden here clips the table corners at the bottom */}
      <div className="overflow-x-auto overflow-y-visible rounded-b-xl">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {columns.map((col) => (
              <col key={col} style={{ width: getColWidth(col) }} />
            ))}
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr className="border-b" style={{ borderColor: dividerColor }}>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`relative text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden ${
                    isLight ? "text-gray-500" : "text-purple-200/80"
                  }`}
                >
                  {toLabel(col)}
                  <div
                    onMouseDown={(e) => startResize(col, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center group"
                  >
                    <div className={`w-px h-4 rounded-full transition-colors group-hover:h-full ${
                      isLight ? "bg-purple-200 group-hover:bg-purple-400" : "bg-white/10 group-hover:bg-purple-400/60"
                    }`} />
                  </div>
                </th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                    <span className={`text-sm ${isLight ? "text-gray-500" : "text-purple-200/70"}`}>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-16">
                  <p className={isLight ? "text-gray-500" : "text-purple-200/70"}>
                    No {config.title.toLowerCase()} found
                  </p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  onClick={() => onEdit(item)}
                  className={`border-b last:border-0 transition-colors cursor-pointer ${
                    isLight
                      ? "border-purple-100 hover:bg-purple-200/60"
                      : "border-purple-300/10 hover:bg-purple-500/[0.18]"
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col} className="px-5 py-3 h-12 overflow-hidden">
                      {renderCell(col, item[col], item)}
                    </td>
                  ))}
                  <td className="px-5 py-3 h-12 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isLight
                            ? "text-gray-400 hover:text-purple-600 hover:bg-purple-100"
                            : "text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/20"
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isLight
                            ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                            : "text-red-400/60 hover:text-red-300 hover:bg-red-500/20"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default List;
