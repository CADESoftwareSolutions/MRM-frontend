import { useEffect } from "react";
import { useSetAtom } from "jotai";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { ChartOfAccountsScreen } from "../../../../components/AccountingComponents/ChartOfAccounts/ChartOfAccountsScreen";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";

const ChartOfAccounts = () => {
  const setPageHeader = useSetAtom(pageHeaderAtom);

  useEffect(() => {
    setPageHeader({
      title: "Chart of Accounts",
      subtitle: "Categories used by revenue, JIB, AFE and A/P entries, and by income / expense reports",
    });
    return () => setPageHeader({});
  }, [setPageHeader]);

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <ChartOfAccountsScreen />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChartOfAccounts;
