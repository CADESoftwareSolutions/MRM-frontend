import React from "react";
import { API_URL } from "../../src/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useQueryClient } from "@tanstack/react-query";

type DashboardHeaderProps = {
  sidebarWidth: number;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarWidth }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userProfile, setUserProfile] = useAtom(userProfileAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const isLight = theme === "light";

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "GET",
        credentials: "include",
      });
    } finally {
      queryClient.clear();
      setUserProfile(null);
      router.push("/");
    }
  };

  return (
    <header
      className="fixed z-[1100] flex items-center justify-end px-6 backdrop-blur-lg border-b"
      style={{
        width: `calc(100% - ${sidebarWidth}px)`,
        left: `${sidebarWidth}px`,
        height: 64,
        top: 0,
        background: isLight
          ? "linear-gradient(90deg, #e8e0f5 0%, #ede8f7 100%)"
          : "linear-gradient(90deg, #2d1b4e 0%, #1e1e3f 100%)",
        borderColor: isLight
          ? "rgb(167 139 250 / 0.25)"
          : "rgb(167 139 250 / 0.3)",
        boxShadow: isLight ? "0 2px 12px 0 rgb(139 92 246 / 0.12)" : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(isLight ? "dark" : "light")}
          className={`p-2 rounded-md transition-colors cursor-pointer ${isLight ? "text-purple-700/60 hover:text-purple-900 hover:bg-purple-200/50" : "text-white/50 hover:text-white hover:bg-white/10"}`}
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer flex items-center gap-2.5">
              <span
                className={`text-sm hidden sm:block ${isLight ? "text-purple-900/70" : "text-white/80"}`}
              >
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
            className="w-48 border z-[9999] bg-[#1a1a2e] border-purple-300/20"
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
      </div>
    </header>
  );
};

export default DashboardHeader;
