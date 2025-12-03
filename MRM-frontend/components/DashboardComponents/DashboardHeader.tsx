import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/router";
type DashboardHeaderProps = {
  sidebarWidth: number;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarWidth }) => {
  const router = useRouter();
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
      }
    } catch {
      router.push("/");
      alert("Server error. Please try again.");
    }
  };
  return (
    <header
      className="fixed z-[1100] flex items-center justify-end bg-black/30 px-6 backdrop-blur-sm shadow-lg "
      style={{
        width: `calc(100% - ${sidebarWidth}px)`,
        left: `${sidebarWidth}px`,
        height: 64,
        top: 0,
      }}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <Avatar className="h-10 w-10 bg-purple-600">
              <AvatarFallback className="bg-purple-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-48 bg-white z-[9999]"
        >
          <DropdownMenuItem
            onClick={handleLogout}
            className="w-full cursor-pointer whitespace-normal border-b border-gray-200 px-4 py-3 text-sm font-semibold text-[#1c2e4a] no-underline hover:!bg-green-50 focus:!bg-green-50 last:border-b-0"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default DashboardHeader;
