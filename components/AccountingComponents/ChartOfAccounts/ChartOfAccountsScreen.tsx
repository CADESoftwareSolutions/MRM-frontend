import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Download, Edit, Lock, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import {
  ACCOUNT_CATEGORIES,
  ACCOUNT_CATEGORY_LABELS,
  AccountCategory,
  ChartAccount,
  ChartAccountInput,
  formatAccountNumber,
} from "@/types/chartOfAccounts";
import { DeleteConfirmModal } from "../../modals/DeleteConfirmModal";
import { AccountEditorRow } from "./AccountEditorRow";
import { DeleteBlockedModal } from "./DeleteBlockedModal";
import { downloadChartOfAccountsCsv, formatAuditDate } from "./chartOfAccountsReport";

type CategoryFilter = "ALL" | AccountCategory;
type Editor = { mode: "add" } | { mode: "edit"; id: string } | null;

const COLUMN_WIDTHS = [112, 88, undefined, 140, 104, 120, 216, 116];
const COLUMN_COUNT = COLUMN_WIDTHS.length;

/** "5250-210 ALLISON DRILLING", as the confirm dialogs name an account. */
const accountName = (a: ChartAccount) => `${formatAccountNumber(a)} ${a.description}`;

const matchesSearch = (a: ChartAccount, query: string) =>
  !query || `${formatAccountNumber(a)} ${a.account} ${a.sub ?? ""} ${a.description}`.toUpperCase().includes(query);

export const ChartOfAccountsScreen = () => {
  const isLight = useAtomValue(themeAtom) === "light";
  const showToast = useSetAtom(showToastAtom);
  const { accounts, loading, addAccount, updateAccount, deleteAccount, setAccountActive } = useChartOfAccounts();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [pendingDelete, setPendingDelete] = useState<ChartAccount | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Set when an editor closes; the effect below returns focus to that row's Edit button (or Add).
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!focusTarget || editor) return;
    document.querySelector<HTMLElement>(`[data-coa-focus="${CSS.escape(focusTarget)}"]`)?.focus();
    setFocusTarget(null);
  }, [focusTarget, editor, accounts]);

  const closeEditor = (target: string) => {
    setEditor(null);
    setFocusTarget(target);
  };

  const chips = useMemo(
    () => [
      { id: "ALL" as CategoryFilter, label: "All", count: accounts.length },
      ...ACCOUNT_CATEGORIES.map((category) => ({
        id: category as CategoryFilter,
        label: ACCOUNT_CATEGORY_LABELS[category],
        count: accounts.filter((a) => a.category === category).length,
      })),
    ],
    [accounts],
  );

  const rows = useMemo(() => {
    const query = searchTerm.trim().toUpperCase();
    return accounts.filter(
      (a) => (categoryFilter === "ALL" || a.category === categoryFilter) && matchesSearch(a, query),
    );
  }, [accounts, categoryFilter, searchTerm]);

  const defaultCount = accounts.filter((a) => a.isDefault).length;
  const countLabel = `Showing ${rows.length} of ${accounts.length} accounts · ${defaultCount} default, ${
    accounts.length - defaultCount
  } custom`;

  const runAction = async (action: () => Promise<unknown>, successMessage?: string) => {
    setActionError(null);
    try {
      await action();
      if (successMessage) showToast(successMessage);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const saveNew = async (input: ChartAccountInput) => {
    await addAccount(input);
    closeEditor("add");
  };

  const saveEdit = (id: string) => async (input: ChartAccountInput) => {
    await updateAccount(id, input);
    closeEditor(id);
  };

  const requestDelete = (account: ChartAccount) => {
    setActionError(null);
    setPendingDelete(account);
  };

  const clearPendingDelete = () => setPendingDelete(null);

  const confirmDelete = async () => {
    const target = pendingDelete;
    clearPendingDelete();
    if (!target) return;
    if (editor?.mode === "edit" && editor.id === target.id) setEditor(null);
    await runAction(() => deleteAccount(target.id), `Deleted ${accountName(target)}`);
  };

  const markInactive = async () => {
    const target = pendingDelete;
    clearPendingDelete();
    if (!target) return;
    await runAction(() => setAccountActive(target.id, false), `${accountName(target)} marked inactive`);
  };

  const dividerColor = isLight ? "rgb(167 139 250 / 0.2)" : "rgb(167 139 250 / 0.15)";
  const borderColor = isLight ? "rgb(167 139 250 / 0.25)" : "rgb(167 139 250 / 0.2)";
  const containerBg = isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)";
  const mutedText = isLight ? "text-gray-500" : "text-purple-200/70";
  const categoryBadge = isLight
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : "bg-purple-500/20 text-purple-300 border-purple-400/30";
  const statusBadge = (active: boolean) =>
    active
      ? isLight
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-green-500/20 text-green-300 border-green-400/30"
      : isLight
        ? "bg-gray-100 text-gray-500 border-gray-300"
        : "bg-gray-500/20 text-gray-300 border-gray-400/30";
  const iconButton = (tone: "purple" | "red" | "green") =>
    `p-1.5 rounded-md transition-colors cursor-pointer ${
      tone === "red"
        ? isLight
          ? "text-red-600 hover:text-red-800 hover:bg-red-50"
          : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
        : tone === "green"
          ? isLight
            ? "text-green-700 hover:text-green-900 hover:bg-green-50"
            : "text-green-300 hover:text-green-100 hover:bg-green-500/20"
          : isLight
            ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
            : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
    }`;

  const editorDefaultCategory: AccountCategory = categoryFilter === "ALL" ? "EXPENSES" : categoryFilter;

  const renderRow = (a: ChartAccount) => {
    if (editor?.mode === "edit" && editor.id === a.id) {
      return (
        <AccountEditorRow
          key={a.id}
          account={a}
          accounts={accounts}
          defaultCategory={a.category}
          isLight={isLight}
          onSave={saveEdit(a.id)}
          onCancel={() => closeEditor(a.id)}
        />
      );
    }

    const name = accountName(a);
    return (
      <tr
        key={a.id}
        className={`border-b last:border-0 transition-colors ${
          isLight ? "border-purple-100 hover:bg-purple-300/30" : "border-purple-300/10 hover:bg-purple-500/[0.12]"
        }`}
      >
        <td className="px-4 py-3 h-14">
          <span className="flex items-center gap-1.5 font-semibold tabular-nums text-white">
            {a.isDefault && (
              <span role="img" aria-label="Default account" title="Default account: can't be changed or deleted">
                <Lock className="w-3.5 h-3.5 shrink-0 text-purple-300" strokeWidth={2.5} />
              </span>
            )}
            {a.account}
          </span>
        </td>
        <td className="px-4 py-3 tabular-nums text-white/60">{a.sub ?? "—"}</td>
        <td className="px-4 py-3">
          <span className="block truncate text-white" title={a.description}>
            {a.description}
          </span>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className={`text-xs font-medium ${categoryBadge}`}>
            {a.category}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className={`text-xs font-medium ${statusBadge(a.isActive)}`}>
            {a.isActive ? "Active" : "Inactive"}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-white">{a.transactionCount.toLocaleString("en-US")}</td>
        <td className="px-4 py-3 text-xs leading-snug">
          <span className="block truncate text-white/90">
            Created by {a.createdBy} · {formatAuditDate(a.createdAt)}
          </span>
          <span className="block truncate text-white/60">
            {a.isDefault ? "Default · locked" : `Updated by ${a.updatedBy} · ${formatAuditDate(a.updatedAt)}`}
          </span>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          {!a.isDefault && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-coa-focus={a.id}
                onClick={() => setEditor({ mode: "edit", id: a.id })}
                aria-label={`Edit ${name}`}
                title="Edit"
                className={iconButton("purple")}
              >
                <Edit className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              {!a.isActive && (
                <button
                  type="button"
                  onClick={() => runAction(() => setAccountActive(a.id, true))}
                  aria-label={`Reactivate ${name}`}
                  title="Reactivate"
                  className={iconButton("green")}
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
              {(a.isActive || a.transactionCount === 0) && (
                <button
                  type="button"
                  onClick={() => requestDelete(a)}
                  aria-label={`Delete ${name}`}
                  title="Delete"
                  className={iconButton("red")}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-300/30 rounded-lg">
        <Lock className="w-4 h-4 shrink-0 text-blue-300" />
        <p className="text-sm text-blue-200">
          Accounts with a lock come with CADE and can&apos;t be changed or deleted. An account with posted
          transactions can&apos;t be deleted either.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
        >
          {chips.map((chip) => {
            const active = categoryFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryFilter(chip.id)}
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
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => downloadChartOfAccountsCsv(accounts)}
            className={`cursor-pointer ${
              isLight
                ? "bg-white border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                : "bg-white/5 border-purple-300/30 text-purple-100 hover:bg-purple-500/30 hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            Chart of Accounts Report
          </Button>
          <Button
            data-coa-focus="add"
            onClick={() => setEditor({ mode: "add" })}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
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
        <div className="flex items-center gap-3 px-5 py-4 border-b rounded-t-xl" style={{ borderColor: dividerColor }}>
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isLight ? "text-gray-400" : "text-purple-300/60"
              }`}
            />
            <Input
              aria-label="Search accounts"
              placeholder="Search account #, sub or description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 h-9 border ${
                isLight
                  ? "bg-white border-purple-200 text-gray-800 placeholder:text-gray-400"
                  : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40"
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm" style={{ tableLayout: "fixed" }}>
            <caption className="sr-only">Chart of accounts</caption>
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
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Sub</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3">Created / Updated</th>
                <th className="px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {editor?.mode === "add" && (
                <AccountEditorRow
                  accounts={accounts}
                  defaultCategory={editorDefaultCategory}
                  isLight={isLight}
                  onSave={saveNew}
                  onCancel={() => closeEditor("add")}
                />
              )}
              {loading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                      <span className={`text-sm ${mutedText}`}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="text-center py-16">
                    <p className={mutedText}>No accounts found</p>
                  </td>
                </tr>
              ) : (
                rows.map(renderRow)
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t rounded-b-xl" style={{ borderColor: dividerColor }}>
          <span className={`text-xs ${mutedText}`}>{countLabel}</span>
        </div>
      </div>

      {pendingDelete && pendingDelete.transactionCount > 0 && (
        <DeleteBlockedModal
          accountName={accountName(pendingDelete)}
          transactionCount={pendingDelete.transactionCount}
          onMarkInactive={markInactive}
          onCancel={clearPendingDelete}
        />
      )}
      <DeleteConfirmModal
        isOpen={!!pendingDelete && pendingDelete.transactionCount === 0}
        itemName={pendingDelete ? accountName(pendingDelete) : "this account"}
        itemType="Account"
        onConfirm={confirmDelete}
        onCancel={clearPendingDelete}
      />
    </div>
  );
};

export default ChartOfAccountsScreen;
