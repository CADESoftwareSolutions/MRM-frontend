import DashboardHome from "../../components/DashboardComponents/DashboardHome";
import DashboardLayout from "../../components/DashboardComponents/DashboardLayout";
import NewUserDashboard from "../../components/DashboardComponents/NewUserDashboard";

const mockData: string[] = ["test"];

const DashboardPage = () => {
  return (
    <DashboardLayout>
      {Array.isArray(mockData) && mockData.length > 0 ? (
        <DashboardHome />
      ) : (
        <NewUserDashboard />
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
