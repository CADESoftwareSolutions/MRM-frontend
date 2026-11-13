import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pageHeaderAtom, themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { useApInvoices } from "@/hooks/useApInvoices";
import { AP_STATUSES, ApInvoice, ApInvoiceStatus, todayIso } from "@/types/apInvoices";
import { AgingTiles } from "./list/AgingTiles";
import { ColumnPicker } from "./list/ColumnPicker";
import { FilterSelect } from "./list/FilterSelect";
import { InvoiceTable } from "./list/InvoiceTable";
import { RejectInvoiceModal } from "./list/RejectInvoiceModal";
import { ApStatusFilter, StatusChips } from "./list/StatusChips";
import {
  AP_LIST_COLUMNS,
  ApDueFilter,
  ApListColumn,
  ApListSort,
  DEFAULT_AP_SORT,
  DUE_FILTER_OPTIONS,
  compareInvoices,
  glPeriodOptions,
  matchesDue,
  matchesSearch,
  vendorOptions,
} from "./list/listModel";

export interface InvoiceListProps {
  onOpenInvoice: (id: string) => void;
  onNewInvoice: () => void;
  onPayBills: () => void;
}

const PAGE_SIZE = 25;
const COLUMNS_KEY = "mrm-columns-ap-invoices";
const ALL_COLUMNS = AP_LIST_COLUMNS.map((col) => col.id);

const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const InvoiceList = ({ onOpenInvoice, onNewInvoice, onPayBills }: InvoiceListProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const showToast = useSetAtom(showToastAtom);
  const { invoices, loading, agingSummary, approveInvoice, rejectInvoice } = useApInvoices();

  const [statusFilter, setStatusFilter] = useState<ApStatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [dueFilter, setDueFilter] = useState<ApDueFilter>("");
  const [sort, setSort] = useState<ApListSort>(DEFAULT_AP_SORT);
  const [page, setPage] = useState(0);
  const [visibleCols, setVisibleCols] = useState<ApListColumn[]>(ALL_COLUMNS);
  const [rejecting, setRejecting] = useState<ApInvoice | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  const today = useMemo(() => todayIso(), []);

  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? "null");
      if (Array.isArray(saved)) {
        setVisibleCols(AP_LIST_COLUMNS.filter((col) => col.locked || saved.includes(col.id)).map((col) => col.id));
      }
    } catch {}
  }, []);

  const awaitingCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "awaiting_approval").length,
    [invoices],
  );

  useEffect(() => {
    const count = invoices.length;
    setPageHeader({
      title: "A/P Invoices",
      subtitle: loading
        ? "Enter, review and pay vendor invoices"
        : `${count} ${count === 1 ? "invoice" : "invoices"}${
            awaitingCount ? ` · ${awaitingCount} awaiting approval` : ""
          }`,
    });
    return () => setPageHeader({});
  }, [invoices.length, awaitingCount, loading, setPageHeader]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchTerm, vendorFilter, periodFilter, dueFilter, sort]);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          matchesSearch(invoice, searchTerm) &&
          (!vendorFilter || invoice.vendorId === vendorFilter) &&
          (!periodFilter || invoice.glPeriod === periodFilter) &&
          matchesDue(invoice, dueFilter, today),
      ),
    [invoices, searchTerm, vendorFilter, periodFilter, dueFilter, today],
  );

  const counts = useMemo(() => {
    const result = Object.fromEntries(AP_STATUSES.map((status) => [status, 0])) as Record<ApInvoiceStatus, number>;
    filtered.forEach((invoice) => result[invoice.status]++);
    return result;
  }, [filtered]);

  const rows = useMemo(
    () =>
      filtered
        .filter((invoice) => statusFilter === "all" || invoice.status === statusFilter)
        .sort((a, b) => compareInvoices(a, b, sort)),
    [filtered, statusFilter, sort],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const vendors = useMemo(() => vendorOptions(invoices), [invoices]);
  const periods = useMemo(() => glPeriodOptions(invoices), [invoices]);

  const toggleColumn = (id: ApListColumn) => {
    const next = visibleCols.includes(id)
      ? visibleCols.filter((col) => col !== id)
      : ALL_COLUMNS.filter((col) => col === id || visibleCols.includes(col));
    setVisibleCols(next);
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(next));
    } catch {}
  };

  const changeSort = (column: ApListColumn) =>
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: column === "invoiceDate" || column === "dueDate" ? "desc" : "asc" },
    );

  const approve = async (invoice: ApInvoice) => {
    setBusyIds((prev) => new Set(prev).add(invoice.id));
    try {
      const approved = await approveInvoice(invoice.id);
      showToast(`Approved ${invoice.vendorName} #${invoice.invoiceNumber} · ${approved.journalId}`);
    } catch (e) {
      showToast(errorMessage(e, "Couldn't approve this invoice."));
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(invoice.id);
        return next;
      });
    }
  };

  const confirmReject = async (reason: string) => {
    if (!rejecting) return;
    await rejectInvoice(rejecting.id, reason);
    showToast(`Sent ${rejecting.vendorName} #${rejecting.invoiceNumber} back to Draft`);
    setRejecting(null);
  };

  const outlineButton = `bg-transparent shadow-none cursor-pointer ${
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
  }`;
  const divider = isLight ? "border-[rgb(167_139_250/0.2)]" : "border-[rgb(167_139_250/0.15)]";
  const firstRow = rows.length ? currentPage * PAGE_SIZE + 1 : 0;
  const lastRow = currentPage * PAGE_SIZE + pageRows.length;

  return (
    <div className="flex flex-col gap-4">
      <AgingTiles aging={agingSummary} loading={loading} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatusChips value={statusFilter} counts={counts} onChange={setStatusFilter} />
        <div className="flex gap-2 flex-wrap">
          {/* A disabled button swallows pointer events, so the tooltip hangs off a wrapper. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex rounded-md outline-none">
                <Button variant="outline" disabled className={outlineButton}>
                  <Upload className="w-4 h-4" />
                  Import Invoices
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              style={{ zIndex: Z_INDEX.modalDropdown }}
              className={isLight ? undefined : "border border-purple-300/30"}
            >
              Coming soon
            </TooltipContent>
          </Tooltip>
          <Button variant="outline" onClick={onPayBills} className={outlineButton}>
            Pay Bills
          </Button>
          <Button onClick={onNewInvoice} className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
            <Plus className="w-4 h-4" />
            Enter Invoice
          </Button>
        </div>
      </div>

      <div
        className={`rounded-xl border ${
          isLight ? "border-[rgb(167_139_250/0.25)] bg-white/85" : "border-[rgb(167_139_250/0.2)] bg-white/[0.06]"
        }`}
      >
        <div className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b rounded-t-xl relative z-20 ${divider}`}>
          <div className="relative flex-[1_1_300px]">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isLight ? "text-gray-400" : "text-purple-300/60"
              }`}
            />
            <Input
              aria-label="Search invoices"
              placeholder="Search vendor, invoice #, Journal ID, AFE or well…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 h-9 border ${
                isLight
                  ? "bg-white border-purple-200 text-gray-800 placeholder:text-gray-400"
                  : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40"
              }`}
            />
          </div>
          <FilterSelect
            prefix="Vendor"
            allLabel="Vendor: All"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={vendors}
            className="w-48"
          />
          <FilterSelect
            prefix="G/L Period"
            allLabel="G/L Period: All"
            value={periodFilter}
            onChange={setPeriodFilter}
            options={periods}
            className="w-44"
          />
          <FilterSelect
            prefix="Due"
            allLabel="Due: Any time"
            value={dueFilter}
            onChange={(value) => setDueFilter(value as ApDueFilter)}
            options={DUE_FILTER_OPTIONS}
            className="w-44"
          />
          <ColumnPicker columns={AP_LIST_COLUMNS} visible={visibleCols} onToggle={toggleColumn} />
        </div>

        <InvoiceTable
          columns={AP_LIST_COLUMNS.filter((col) => visibleCols.includes(col.id))}
          invoices={pageRows}
          loading={loading}
          today={today}
          sort={sort}
          onSortChange={changeSort}
          onOpen={(invoice) => onOpenInvoice(invoice.id)}
          onApprove={approve}
          onReject={setRejecting}
          busyIds={busyIds}
        />

        {!loading && (
          <div className={`flex items-center justify-between gap-3 px-5 py-3 border-t flex-wrap ${divider}`}>
            <span className={`text-xs ${isLight ? "text-gray-500" : "text-white/50"}`}>
              {rows.length
                ? `Showing ${firstRow}–${lastRow} of ${rows.length} ${rows.length === 1 ? "invoice" : "invoices"}`
                : "No invoices"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className={outlineButton}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
                className={outlineButton}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {rejecting && (
        <RejectInvoiceModal invoice={rejecting} onConfirm={confirmReject} onCancel={() => setRejecting(null)} />
      )}
    </div>
  );
};

export default InvoiceList;
