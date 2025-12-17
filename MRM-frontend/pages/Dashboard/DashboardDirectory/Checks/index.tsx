import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckSquare,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Layers,
  Settings,
} from "lucide-react";
type ChecksProps = {};

const Checks: React.FC<ChecksProps> = () => {
  const fullWidth = 240;
  const collapsedWidth = 60;
  const appBarHeight = 64;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? fullWidth : collapsedWidth;
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const menuItems = [
    { text: "Checks", icon: CheckSquare },
    { text: "Documents", icon: FileText },
    { text: "Payments", icon: CreditCard },
    { text: "Leases", icon: FileSpreadsheet },
    { text: "Reports", icon: BarChart3 },
    { text: "Settings", icon: Settings },
  ];

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

        {/* Sidebar Menu */}
        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.text}
                variant="ghost"
                className="w-full text-white transition-colors hover:bg-[#e91e63] cursor-pointer"
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
          marginLeft: `64px`,
        }}
      >
        Check Information like uploading
      </main>
    </div>
  );
};

export default Checks;
