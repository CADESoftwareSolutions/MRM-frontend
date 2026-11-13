import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { PayBillsScreen } from "../../../../components/AccountingComponents/PayBills/PayBillsScreen";

const PayBills = () => (
  <DashboardLayout>
    <div className="min-h-screen px-6 pb-6 pt-20">
      <div className="max-w-7xl mx-auto">
        <PayBillsScreen />
      </div>
    </div>
  </DashboardLayout>
);

export default PayBills;
