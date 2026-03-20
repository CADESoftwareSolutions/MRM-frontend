import React from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import leasesConfig, { MOCK_LEASES } from "@/config/leasesConfig";
import Form from "../../../../components/FormComponents/Form";
import { List } from "../../../../components/FormComponents/List";

type LeasesProps = {};

const Leases: React.FC<LeasesProps> = () => {
  return (
    <DashboardLayout>
      <div
        className="min-h-screen p-6 my-15"
        style={{
          background:
            "linear-gradient(135deg, #2d1b4e 0%, #1e1e3f 50%, #2d1b4e 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-300" />
              <h1 className="text-3xl font-bold text-white">
                {leasesConfig.title}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leases;
