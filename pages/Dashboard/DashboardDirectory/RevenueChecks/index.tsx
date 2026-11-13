import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { RevenueCheckList } from "../../../../components/AccountingComponents/Revenue/RevenueCheckList";
import { RevenueCheckEntry } from "../../../../components/AccountingComponents/Revenue/RevenueCheckEntry";
import { RevenueImport } from "../../../../components/AccountingComponents/Revenue/RevenueImport";
import { TaxDeductTypes } from "../../../../components/AccountingComponents/Revenue/TaxDeductTypes";
import { moduleViewAtom, themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";

type RevenueTab = "checks" | "types";

const tabButtonClass = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all ${
    active ? "bg-purple-600 text-white" : "text-purple-100 hover:text-white hover:bg-purple-500/30"
  }`;

const RevenueChecks = () => {
  const [view, setView] = useAtom(moduleViewAtom);
  const [tab, setTab] = useState<RevenueTab>("checks");
  const [checkId, setCheckId] = useState<string | null>(null);
  const [newEntryKey, setNewEntryKey] = useState(0);
  const isLight = useAtomValue(themeAtom) === "light";
  const { accounts, loading: accountsLoading } = useChartOfAccounts();
  const { unmappedCount } = useTaxDeductTypes(accountsLoading ? undefined : accounts);

  useEffect(() => () => setView("list"), [setView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, checkId, newEntryKey]);

  const openCheck = (id: string) => {
    setCheckId(id);
    setView("edit");
  };

  const newCheck = () => {
    setCheckId(null);
    setNewEntryKey((k) => k + 1);
    setView("add");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto">
          {view === "list" && (
            <div className="space-y-4">
              <div
                role="group"
                aria-label="Revenue views"
                className="inline-flex bg-white/5 border border-purple-300/20 rounded-xl gap-1 p-1"
              >
                <button
                  type="button"
                  aria-pressed={tab === "checks"}
                  onClick={() => setTab("checks")}
                  className={tabButtonClass(tab === "checks")}
                >
                  Checks
                </button>
                <button
                  type="button"
                  aria-pressed={tab === "types"}
                  onClick={() => setTab("types")}
                  className={tabButtonClass(tab === "types")}
                >
                  Tax &amp; Deduct Types
                  {unmappedCount > 0 && (
                    <span
                      className={`rounded-[5px] px-1.5 text-[11px] font-semibold ${
                        isLight ? "bg-yellow-100 text-yellow-800" : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      <span className="sr-only">, </span>
                      {unmappedCount} to map
                    </span>
                  )}
                </button>
              </div>
              {tab === "checks" ? (
                <RevenueCheckList
                  onOpenCheck={openCheck}
                  onNewCheck={newCheck}
                  onImport={() => setView("import")}
                />
              ) : (
                <TaxDeductTypes />
              )}
            </div>
          )}
          {(view === "add" || view === "edit") && (
            <RevenueCheckEntry
              key={view === "edit" ? `edit-${checkId}` : `new-${newEntryKey}`}
              checkId={view === "edit" ? checkId : null}
              onBack={() => setView("list")}
              onOpenCheck={openCheck}
              onImport={() => setView("import")}
            />
          )}
          {view === "import" && (
            <RevenueImport
              onCancel={() => setView("list")}
              onDone={(id) => (id ? openCheck(id) : setView("list"))}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RevenueChecks;
