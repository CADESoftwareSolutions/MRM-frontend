import { useAtom } from "jotai";
import DashboardHome from "../../components/DashboardComponents/DashboardHome";
import DashboardLayout from "../../components/DashboardComponents/DashboardLayout";
import NewUserDashboard from "../../components/DashboardComponents/NewUserDashboard";
import { userProfileAtom } from "../../store/atoms/userProfileAtom";
import { useEffect, useState } from "react";

export interface user {
  username: string;
}

const DashboardPage = () => {
  const [, setUserProfile] = useAtom(userProfileAtom);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mockData: [] = ["test"];

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/profile", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        setUserProfile(data);
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
