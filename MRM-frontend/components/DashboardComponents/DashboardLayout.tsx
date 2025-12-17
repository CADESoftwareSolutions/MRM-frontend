import React, { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckSquare,
  CreditCard,
  FileSpreadsheet,
  FileText,
  House,
  Layers,
  Settings,
} from "lucide-react";
import { useState } from "react";
import DashboardHeader from "../../components/DashboardComponents/DashboardHeader";
import { useRouter } from "next/router";

const fullWidth = 240;
const collapsedWidth = 60;
const appBarHeight = 64;

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const sidebarWidth = sidebarOpen ? fullWidth : collapsedWidth;
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const menuItems = [
    { text: "Home", icon: House, route: "/Dashboard" },
    {
      text: "Checks",
      icon: CheckSquare,
      route: "/Dashboard/DashboardDirectory/Checks",
    },
    {
      text: "Documents",
      icon: FileText,
      route: "/Dashboard/DashboardDirectory/Documents",
    },
    {
      text: "Payments",
      icon: CreditCard,
      route: "/Dashboard/DashboardDirectory/Payments",
    },
    {
      text: "Leases",
      icon: FileSpreadsheet,
      route: "/Dashboard/DashboardDirectory/Leases",
    },
    {
      text: "Reports",
      icon: BarChart3,
      route: "/Dashboard/DashboardDirectory/Reports",
    },
    {
      text: "Settings",
      icon: Settings,
      route: "/Dashboard/DashboardDirectory/Settings",
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div
      className="flex min-h-screen text-white"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      }}
    >
      <aside
        className="fixed flex h-screen flex-col bg-black/90 backdrop-blur-sm transition-all duration-300 ease-in-out"
        style={{
          width: `${sidebarWidth}px`,
          zIndex: 1300,
        }}
      >
        <div
          className="flex items-center px-4"
          style={{
            height: `${appBarHeight}px`,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-white hover:bg-[#e91e63] cursor-pointer"
          >
            <Layers className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.route;
            const Icon = item.icon;
            return (
              <Button
                key={item.text}
                variant="ghost"
                onClick={() => handleNavigation(item.route)}
                className={`w-full text-white transition-colors hover:bg-[#e91e63] cursor-pointer ${
                  isActive ? "bg-[#e91e63]" : ""
                }`}
                style={{
                  padding: sidebarOpen ? "0.5rem 1rem" : "0.5rem",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    minWidth: "20px",
                    marginRight: sidebarOpen ? "0.5rem" : "0",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {sidebarOpen && <span>{item.text}</span>}
              </Button>
            );
          })}
        </nav>
      </aside>

      <main
        className="min-h-screen w-full transition-all duration-300 ease-in-out"
        style={{
          marginLeft: `${sidebarWidth}px`,
        }}
      >
        <DashboardHeader sidebarWidth={sidebarWidth} />
        {children}
      </main>
    </div>
  );
};
export default DashboardLayout;
