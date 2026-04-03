import React from "react";
import { API_URL } from "../../src/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";

type DashboardHeaderProps = {
  sidebarWidth: number;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarWidth }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        router.push("/Login");
      }
    } catch {
      router.push("/Login");
    }
  };

  return (
    <header
      className="fixed z-[1100] flex items-center justify-end px-6 bg-white/5 backdrop-blur-lg border-b border-white/10"
      style={{
        width: `calc(100% - ${sidebarWidth}px)`,
        left: `${sidebarWidth}px`,
        height: 64,
        top: 0,
      }}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer flex items-center gap-2.5">
            <span className="text-sm text-white/80 hidden sm:block">
              {userProfile?.user?.username}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-purple-600 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-48 bg-[#1a1a2e] border border-purple-300/20 z-[9999]"
        >
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-purple-500/20 focus:bg-purple-500/20 focus:text-white"
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
