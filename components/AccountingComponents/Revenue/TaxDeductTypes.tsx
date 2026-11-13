import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Info, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pageHeaderAtom, themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useRevenueChecks } from "@/hooks/useRevenueChecks";
import { TaxDeductTypeInput, useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { ChartAccount, formatAccountLabel } from "@/types/chartOfAccounts";
import { TaxDeductKind, TaxDeductType, formatCheckDate, isTypeMapped, normalizeLabel } from "@/types/revenue";
import { DeleteConfirmModal } from "../../modals/DeleteConfirmModal";
import { TaxDeductTypeModal } from "./types/TaxDeductTypeModal";
import { TypeAccountCell } from "./types/TypeAccountCell";
import {
  KIND_LABEL,
  TYPE_FILTERS,
  TypeFilter,
  compareTypes,
  labelCount,
  matchesFilter,
  seenFromLabel,
} from "./types/typesModel";

const PAGE_SIZE = 15;
const COLUMN_WIDTHS = [undefined, 96, 290, 80, 112, 190, 84];

type Editor = { mode: "add" } | { mode: "edit"; id: string } | null;

export const TaxDeductTypes = () => {
  const isLight = useAtomValue(themeAtom) === "light";
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const showToast = useSetAtom(showToastAtom);
  const { accounts, loading: accountsLoading } = useChartOfAccounts();
  const accountList = accountsLoading ? undefined : accounts;
  const { types, loading, setAccount, addType, updateType, deleteType } = useTaxDeductTypes(accountList);
  const { checks } = useRevenueChecks();

  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaxDeductType | null>(null);

  const usedLabels = useMemo(() => {
    const used = new Set<string>();
    for (const check of checks) {
      for (const line of check.lines) {
        for (const entry of line.taxes) used.add(`tax:${normalizeLabel(entry.label)}`);
        for (const entry of line.deducts) used.add(`deduct:${normalizeLabel(entry.label)}`);
      }
    }
    return used;
  }, [checks]);

  useEffect(() => {
    setPageHeader({ title: "Revenue Checks", subtitle: "Tax & deduct labels from operator check stubs" });
    return () => setPageHeader({});
  }, [setPageHeader]);

  const counts = useMemo(() => {
    const result = {} as Record<TypeFilter, number>;
    for (const { id } of TYPE_FILTERS) result[id] = types.filter((t) => matchesFilter(t, id, accountList)).length;
    return result;
  }, [types, accountList]);

  const visibleTypes = useMemo(() => {
    const query = normalizeLabel(searchTerm);
    return types
      .filter((t) => matchesFilter(t, filter, accountList) && (!query || t.label.includes(query)))
      .sort((a, b) => compareTypes(a, b, accountList));
  }, [types, filter, searchTerm, accountList]);

  const pageCount = Math.max(1, Math.ceil(visibleTypes.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageTypes = visibleTypes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const firstShown = currentPage * PAGE_SIZE + 1;
  const lastShown = currentPage * PAGE_SIZE + pageTypes.length;

  const editingType = editor?.mode === "edit" ? types.find((t) => t.id === editor.id) : undefined;
  const defaultKind: TaxDeductKind = filter === "DEDUCT" ? "deduct" : "tax";

  const pickAccount = async (type: TaxDeductType, account: ChartAccount) => {
    setActionError(null);
    try {
      await setAccount(type.id, account.id);
      showToast(`${type.label} now maps to ${formatAccountLabel(account)}`);
      return true;
    } catch (err) {
      setActionError((err as Error).message);
      return false;
    }
  };

  const clearAccount = async (type: TaxDeductType) => {
    setActionError(null);
    try {
      await setAccount(type.id, null);
      showToast(`${type.label} no longer maps to an account`);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setActionError(null);
    try {
      await deleteType(target.id);
      showToast(`Deleted ${target.label}`);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const saveLabel = async (input: TaxDeductTypeInput) => {
    if (editingType) {
      if (input.label !== editingType.label || input.kind !== editingType.kind) {
        const updated = await updateType(editingType.id, { label: input.label, kind: input.kind });
        showToast(`Saved ${updated.label}`);
      }
    } else {
      const created = await addType(input);
      showToast(`Added ${created.label}`);
    }
    setEditor(null);
  };

  const dividerColor = isLight ? "rgb(167 139 250 / 0.2)" : "rgb(167 139 250 / 0.15)";
  const borderColor = isLight ? "rgb(167 139 250 / 0.25)" : "rgb(167 139 250 / 0.2)";
  const containerBg = isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)";
  const mutedText = isLight ? "text-gray-500" : "text-purple-200/70";
  const outlineButton = isLight
    ? "bg-white border-purple-300/30 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
    : "bg-transparent border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white";
  const kindBadge: Record<TaxDeductKind, string> = isLight
    ? { tax: "bg-blue-100 text-blue-700 border-blue-300", deduct: "bg-purple-100 text-purple-700 border-purple-300" }
    : {
        tax: "bg-blue-500/20 text-blue-300 border-blue-400/30",
        deduct: "bg-purple-500/20 text-purple-300 border-purple-400/30",
      };
  const newBadge = isLight
    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
    : "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";

  const td = "px-4 py-2 h-[52px]";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-300/30 rounded-lg">
        <Info className="w-4 h-4 shrink-0 text-blue-300" />
        <p className="text-sm text-blue-200">
          Operators name the same tax or deduct differently. Map each label to a Chart of Accounts line once, and every
          check that uses it is coded automatically. New labels from imports land here. Checks already posted keep the
          account they posted to when you remap or rename a label.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter labels"
          className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
        >
          {TYPE_FILTERS.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(chip.id);
                  setPage(0);
                }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white"
                    : isLight
                      ? "text-purple-700 hover:bg-purple-200/60"
                      : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
                }`}
              >
                {chip.label}
                <span
                  className={`rounded-[5px] px-1.5 text-[11px] font-semibold tabular-nums ${
                    active ? "bg-black/20" : "bg-white/10"
                  }`}
                >
                  <span className="sr-only">, </span>
                  {counts[chip.id]}
                </span>
              </button>
            );
          })}
        </div>

        <Button onClick={() => setEditor({ mode: "add" })} className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Label
        </Button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-300">{actionError}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-200 ml-4 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border" style={{ borderColor, background: containerBg }}>
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 border-b rounded-t-xl"
          style={{ borderColor: dividerColor }}
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isLight ? "text-gray-400" : "text-purple-300/60"
              }`}
            />
            <Input
              aria-label="Search labels"
              placeholder="Search labels…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className={`pl-9 h-9 border ${
                isLight
                  ? "bg-white border-purple-200 text-gray-800 placeholder:text-gray-400"
                  : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40"
              }`}
            />
          </div>
          <label
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-white/70 cursor-pointer"
            title="When off, tax labels list Taxes accounts and deduct labels list Deductions accounts, unless a label already maps outside them."
          >
            <Switch
              checked={showAllCategories}
              onCheckedChange={setShowAllCategories}
              className={`cursor-pointer data-[state=checked]:bg-purple-600 ${
                isLight ? "data-[state=unchecked]:bg-purple-200" : "data-[state=unchecked]:bg-white/20"
              }`}
            />
            Show all account categories
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm" style={{ tableLayout: "fixed" }}>
            <caption className="sr-only">Tax and deduct labels</caption>
            <colgroup>
              {COLUMN_WIDTHS.map((width, i) => (
                <col key={i} style={width ? { width } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr
                className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${
                  isLight ? "text-gray-500" : "text-purple-200/80"
                }`}
                style={{ borderColor: dividerColor }}
              >
                <th className="px-4 py-3">Label (as printed on stubs)</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Maps to account</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Seen from</th>
                <th className="px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMN_WIDTHS.length} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                      <span className={`text-sm ${mutedText}`}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : pageTypes.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_WIDTHS.length} className="text-center py-16">
                    <p className={mutedText}>
                      {types.length
                        ? "No labels match"
                        : "No tax or deduct labels yet. They're added as you import check detail, or add one yourself."}
                    </p>
                  </td>
                </tr>
              ) : (
                pageTypes.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b last:border-0 transition-colors ${
                      isLight ? "border-purple-100 hover:bg-purple-300/30" : "border-purple-300/10 hover:bg-purple-500/[0.12]"
                    }`}
                  >
                    <td className={td}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-semibold text-white" title={t.label}>
                          {t.label}
                        </span>
                        {t.isNew && (
                          <Badge variant="outline" className={`text-xs font-medium ${newBadge}`}>
                            New
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className={td}>
                      <Badge variant="outline" className={`text-xs font-medium ${kindBadge[t.kind]}`}>
                        {KIND_LABEL[t.kind]}
                      </Badge>
                    </td>
                    <td className={td}>
                      <TypeAccountCell
                        type={isTypeMapped(t, accountList) ? t : { ...t, accountId: null }}
                        showAllCategories={showAllCategories}
                        onPick={(account) => pickAccount(t, account)}
                        onClear={() => void clearAccount(t)}
                      />
                    </td>
                    <td className={`${td} text-right tabular-nums text-white`}>{t.lineCount.toLocaleString("en-US")}</td>
                    <td className={`${td} tabular-nums text-white/60`}>{formatCheckDate(t.lastSeen) || "—"}</td>
                    <td className={td}>
                      {t.operators.length ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="block truncate rounded-sm text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                              {seenFromLabel(t.operators)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            sideOffset={4}
                            // Portals to <body>, where a plain z-50 would slide under the fixed app bar.
                            style={{ zIndex: Z_INDEX.modalDropdown }}
                            className={`max-w-xs text-left ${isLight ? "" : "border border-purple-300/30"}`}
                          >
                            {t.operators.join(", ")}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: "edit", id: t.id })}
                        aria-label={`Edit ${t.label}`}
                        title="Edit"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isLight
                            ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                            : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      {!usedLabels.has(`${t.kind}:${t.label}`) && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(t)}
                          aria-label={`Delete ${t.label}`}
                          title="Delete"
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? "text-red-600 hover:text-red-800 hover:bg-red-100"
                              : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t"
          style={{ borderColor: dividerColor }}
        >
          <span className="text-xs text-white/60">
            {visibleTypes.length
              ? `Showing ${firstShown}–${lastShown} of ${labelCount(visibleTypes.length)}`
              : "No labels match"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className={`cursor-pointer ${outlineButton}`}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
              className={`cursor-pointer ${outlineButton}`}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        itemName={pendingDelete?.label ?? "this label"}
        itemType="Label"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      {(editor?.mode === "add" || editingType) && (
        <TaxDeductTypeModal
          type={editingType}
          defaultKind={defaultKind}
          onSave={saveLabel}
          onCancel={() => setEditor(null)}
        />
      )}
    </div>
  );
};

export default TaxDeductTypes;
