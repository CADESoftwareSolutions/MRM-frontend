import { useState } from "react";
import { useAtomValue } from "jotai";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { RevenueCheckList } from "../../../../components/AccountingComponents/Revenue/RevenueCheckList";
import { TaxDeductTypes } from "../../../../components/AccountingComponents/Revenue/TaxDeductTypes";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";

type RevenueTab = "checks" | "types";

const tabButtonClass = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all ${
    active ? "bg-purple-600 text-white" : "text-purple-100 hover:text-white hover:bg-purple-500/30"
  }`;

/** The check register and Tax & Deduct Types. */
const RevenueChecks = () => {
  const [tab, setTab] = useState<RevenueTab>("checks");
  const isLight = useAtomValue(themeAtom) === "light";
  const { accounts, loading: accountsLoading } = useChartOfAccounts();
  const { unmappedCount } = useTaxDeductTypes(accountsLoading ? undefined : accounts);

  return (
    <DashboardLayout>
      <div className="min-h-screen px-3 pb-6 pt-20">
        <div className="max-w-[92rem] mx-auto">
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
              <RevenueCheckList />
            ) : (
              <TaxDeductTypes />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RevenueChecks;
