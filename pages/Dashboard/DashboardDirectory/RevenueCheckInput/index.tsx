import { useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { RevenueCheckEntry } from "../../../../components/AccountingComponents/Revenue/RevenueCheckEntry";
import { RevenueImport } from "../../../../components/AccountingComponents/Revenue/RevenueImport";
import {
  REVENUE_CHECKS_ROUTE,
  revenueCheckInputRoute,
} from "../../../../components/AccountingComponents/Revenue/revenueRoutes";

const queryValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || null;

/** Entering one check (new, or ?id= an existing one) and the Excel detail import (?mode=import).
 * The register and Tax & Deduct Types live on the Revenue Checks page. */
const RevenueCheckInput = () => {
  const router = useRouter();
  const checkId = queryValue(router.query.id);
  const importing = queryValue(router.query.mode) === "import";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [checkId, importing]);

  const openCheck = (id: string) => router.push(revenueCheckInputRoute({ id }));
  const backToList = () => router.push(REVENUE_CHECKS_ROUTE);

  return (
    <DashboardLayout>
      <div className="min-h-screen px-3 pb-6 pt-20">
        <div className="max-w-[92rem] mx-auto">
          {router.isReady &&
            (importing ? (
              <RevenueImport onCancel={backToList} onDone={(id) => (id ? openCheck(id) : backToList())} />
            ) : (
              <RevenueCheckEntry
                key={checkId ?? "new"}
                checkId={checkId}
                onBack={backToList}
                onOpenCheck={openCheck}
                onImport={() => router.push(revenueCheckInputRoute({ mode: "import" }))}
              />
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RevenueCheckInput;
