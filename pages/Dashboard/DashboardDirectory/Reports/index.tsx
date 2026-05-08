import { useEffect } from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { useAtom } from "jotai";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";

const Reports = () => {
  const [, setPageHeader] = useAtom(pageHeaderAtom);

  useEffect(() => {
    setPageHeader({ title: "Reports" });
    return () => setPageHeader({});
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto" />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
