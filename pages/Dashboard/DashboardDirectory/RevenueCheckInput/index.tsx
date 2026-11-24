import { useEffect, useState } from "react";
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

  // Saving a new check moves the address to ?id=… so the sidebar link starts a fresh check, but the
  // form that saved it stays mounted. Any other change of check opens a fresh form.
  const [savedNewId, setSavedNewId] = useState<string | null>(null);
  const [entry, setEntry] = useState({ checkId, key: 0 });
  if (entry.checkId !== checkId) {
    setEntry({ checkId, key: checkId !== null && checkId === savedNewId ? entry.key : entry.key + 1 });
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [entry.key, importing]);

  const openCheck = (id: string) => router.push(revenueCheckInputRoute({ id }));
  const showSavedCheck = (id: string) => {
    setSavedNewId(id);
    router.replace(revenueCheckInputRoute({ id }), undefined, { shallow: true });
  };
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
                key={entry.key}
                checkId={checkId}
                onBack={backToList}
                onOpenCheck={openCheck}
                onSaved={showSavedCheck}
                onImport={() => router.push(revenueCheckInputRoute({ mode: "import" }))}
              />
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RevenueCheckInput;
