import { useEffect } from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { useAtom } from "jotai";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";

const Documents = () => {
  const [, setPageHeader] = useAtom(pageHeaderAtom);

  useEffect(() => {
    setPageHeader({ title: "Documents" });
    return () => setPageHeader({});
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen px-3 pb-6 pt-20">
        <div className="max-w-[92rem] mx-auto" />
      </div>
    </DashboardLayout>
  );
};

export default Documents;
