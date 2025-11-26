import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
} from "lucide-react";

const fullWidth = 240;
const collapsedWidth = 60;
const appBarHeight = 64;

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openList, setOpenList] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleList = () => setOpenList((prev) => !prev);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Logout Successful!", data);
        router.push("/");
      }
    } catch {
      alert("Server error. Please try again.");
    }
  };

  const menuItems = [
    { text: "Checks", icon: CheckSquare },
    { text: "Documents", icon: FileText },
    { text: "Payments", icon: CreditCard },
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
      {/* Sidebar */}
      <aside
        className="fixed flex h-screen flex-col bg-black/70 transition-all duration-300"
        style={{
          width: sidebarOpen ? `${fullWidth}px` : `${collapsedWidth}px`,
          zIndex: 1300,
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center px-4"
          style={{
            height: `${appBarHeight}px`,
            justifyContent: sidebarOpen ? "flex-end" : "center",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Menu */}
        <nav className="px-2">
          <TooltipProvider>
            <Collapsible open={openList} onOpenChange={setOpenList}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10"
                  style={{
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    padding: sidebarOpen ? "0.5rem 1rem" : "0.5rem",
                  }}
                >
                  <div
                    className="flex items-center"
                    style={{
                      minWidth: 0,
                      marginRight: sidebarOpen ? "0.5rem" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {openList ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                  {sidebarOpen && <span>Pages</span>}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const button = (
                    <Button
                      key={item.text}
                      variant="ghost"
                      className="w-full text-white transition-colors hover:bg-white/10"
                      style={{
                        paddingLeft: sidebarOpen ? "2rem" : "0.5rem",
                        justifyContent: sidebarOpen ? "flex-start" : "center",
                      }}
                    >
                      <div
                        className="flex items-center"
                        style={{
                          minWidth: 0,
                          marginRight: sidebarOpen ? "0.5rem" : "auto",
                          justifyContent: "center",
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {sidebarOpen && <span>{item.text}</span>}
                    </Button>
                  );

                  if (!sidebarOpen) {
                    return (
                      <Tooltip key={item.text}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.text}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </CollapsibleContent>
            </Collapsible>
          </TooltipProvider>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="min-h-screen w-full transition-all duration-300"
        style={{
          marginLeft: `${collapsedWidth}px`,
        }}
      >
        {/* Top App Bar */}
        <header
          className="fixed z-[1100] flex items-center justify-end bg-black/30 px-6 shadow-none transition-all duration-300"
          style={{
            width: `calc(100% - ${collapsedWidth}px)`,
            marginLeft: `${collapsedWidth}px`,
            height: `${appBarHeight}px`,
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0"
              >
                <Avatar className="h-10 w-10 bg-purple-600">
                  <AvatarFallback className="bg-purple-600 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <div className="p-6" style={{ marginTop: `${appBarHeight}px` }}>
          <h1 className="text-4xl font-bold">Welcome to your dashboard! 👋</h1>
          <p className="mt-4 text-lg text-white/80">
            Interact with your data, upload PDFs, pay bills, and more.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
