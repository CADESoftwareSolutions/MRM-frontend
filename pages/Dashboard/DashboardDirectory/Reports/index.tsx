import React from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";

type ReportsProps = {};

const Reports: React.FC<ReportsProps> = () => (
  <DashboardLayout>
    {" "}
    <div className="p-6" style={{ marginTop: `64px` }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Lets look at some Reports</h1>
        <p className="text-lg text-white/70">
          Here's what's happening with your business today
        </p>
      </div>
    </div>
  </DashboardLayout>
);

export default Reports;
