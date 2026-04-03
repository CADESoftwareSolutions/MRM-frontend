import { useAtom } from "jotai";
import { API_URL } from "../../src/lib/api";
import DashboardHome from "../../components/DashboardComponents/DashboardHome";
import DashboardLayout from "../../components/DashboardComponents/DashboardLayout";
import NewUserDashboard from "../../components/DashboardComponents/NewUserDashboard";
import { userProfileAtom } from "../../src/atoms/userProfileAtom";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface user {
  username: string;
}

const DashboardPage = () => {
  const [, setUserProfile] = useAtom(userProfileAtom);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mockData: string[] = ["test"];
  const router = useRouter();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 401) {
        router.push("/Login");
        return;
      }

      const data = await response.json();

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
