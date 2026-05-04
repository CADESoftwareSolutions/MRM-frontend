import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, House, Layers, Settings, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect } from "react";
import DashboardHeader from "../../components/DashboardComponents/DashboardHeader";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAtom } from "jotai";
import { openAccordionsAtom, sidebarOpenAtom, themeAtom } from "@/atoms/NavigationAtom";
import { useQuery } from "@tanstack/react-query";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { API_URL } from "@/lib/api";

const fullWidth = 240;
const collapsedWidth = 60;

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const [openAccordions, setOpenAccordions] = useAtom(openAccordionsAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const [theme] = useAtom(themeAtom);
  const [, setUserProfile] = useAtom(userProfileAtom);
  const isLight = theme === "light";
  const router = useRouter();

  const { data: profileData, error: profileError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/profile`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 401) throw Object.assign(new Error("Unauthorized"), { status: 401 });
      if (!res.ok) throw new Error("Profile fetch failed");
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (profileData) setUserProfile(profileData);
  }, [profileData]);

  useEffect(() => {
    if ((profileError as any)?.status === 401) router.push("/login");
  }, [profileError]);

  useEffect(() => {
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
  }, [isLight]);
  const sidebarWidth = sidebarOpen ? fullWidth : collapsedWidth;
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const menuItems = [
    { type: "link", text: "Home", icon: House, route: "/Dashboard" },
    {
      type: "group",
      text: "Land",
      icon: Layers,
      items: [
        { text: "Leases",    route: "/Dashboard/leases" },
        { text: "Wells",     route: "/Dashboard/wells" },
        { text: "Deeds",     route: "/Dashboard/deeds" },
      ],
    },
    {
      type: "group",
      text: "Accounting",
      icon: FileText,
      items: [
        { text: "Documents", route: "/Dashboard/documents" },
        { text: "Checks",    route: "/Dashboard/checks" },
        { text: "Reports",   route: "/Dashboard/reports" },
      ],
    },
    {
      type: "link",
      text: "Directory",
      icon: Users,
      route: "/Dashboard/directory",
    },
    {
      type: "link",
      text: "Settings",
      icon: Settings,
      route: "/Dashboard/settings",
    },
  ];

  const handleAccordionChange = (groupText: string) => {
    setOpenAccordions((prev) =>
      prev.includes(groupText)
        ? prev.filter((item) => item !== groupText)
        : [...prev, groupText]
    );
  };
  return (
    <div
      className={`flex min-h-screen ${isLight ? "text-gray-900" : "text-white"}`}
      style={{
        background: isLight
          ? "linear-gradient(135deg, #e8e0f5 0%, #ede8f7 50%, #e8e0f5 100%)"
          : "linear-gradient(135deg, #2d1b4e 0%, #1e1e3f 50%, #2d1b4e 100%)",
      }}
    >
      <aside
        className="fixed flex h-screen flex-col backdrop-blur-lg border-r transition-all duration-300 ease-in-out z-[1300]"
        style={{
          width: `${sidebarWidth}px`,
          background: isLight
            ? "linear-gradient(180deg, #e8e0f5 0%, #ede8f7 100%)"
            : "linear-gradient(180deg, #2d1b4e 0%, #1e1e3f 100%)",
          borderColor: isLight ? "rgb(167 139 250 / 0.25)" : "rgb(255 255 255 / 0.1)",
        }}
      >
        {/* Logo + company name — height matches header (64px) */}
        <div className="flex items-center justify-between px-3 border-b shrink-0" style={{ height: 64, borderColor: isLight ? "rgb(167 139 250 / 0.25)" : "rgb(167 139 250 / 0.3)" }}>
          <div className={`flex items-center gap-2 min-w-0 ${!sidebarOpen ? "justify-center w-full" : ""}`}>
            <Image
              src={isLight ? "/images/logo-light.svg" : "/images/logo-dark.svg"}
              alt="CADE Logo"
              width={32}
              height={32}
              className="shrink-0"
            />
            {sidebarOpen && (
              <span className={`text-base font-bold tracking-widest truncate ${isLight ? "text-purple-900" : "text-white"}`}>
                CADE
              </span>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`cursor-pointer shrink-0 ${isLight ? "text-purple-700/60 hover:text-purple-900 hover:bg-purple-200/50" : "text-white/60 hover:text-white hover:bg-white/10"}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-1 pt-3">
          {menuItems.map((group) => {
            const Icon = group.icon;
            const isActive =
              group.type === "link" && router.pathname === group.route;

            const navText = isLight ? "text-purple-900" : "text-white";
            const navHover = isLight ? "hover:bg-purple-300/40 hover:text-purple-900" : "hover:bg-purple-600 hover:text-white";
            const navActive = isLight ? "bg-purple-400/40 text-purple-900" : "bg-purple-600";
            const subText = isLight ? "text-purple-800/70" : "text-gray-300";
            const subActive = isLight ? "bg-purple-300/40 text-purple-900" : "bg-purple-600/20 text-white";

            if (group.type === "link") {
              return (
                <Button
                  key={group.text}
                  variant="ghost"
                  onClick={() => router.push(group.route!)}
                  className={`w-full justify-start transition-colors cursor-pointer h-10 ${navText} ${navHover} ${isActive ? navActive : ""}`}
                  style={{
                    padding: sidebarOpen ? "0.5rem 1rem" : "0.5rem",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                  }}
                >
                  <Icon className={`h-5 w-5 ${sidebarOpen ? "mr-3" : ""}`} />
                  {sidebarOpen && <span>{group.text}</span>}
                </Button>
              );
            }
            const isOpen = openAccordions.includes(group.text);

            return (
              <Accordion
                key={group.text}
                type="single"
                collapsible
                value={isOpen ? group.text : ""}
                onValueChange={() => handleAccordionChange(group.text)}
                className="w-full border-none space-y-1"
              >
                <AccordionItem value={group.text} className="border-none">
                  <AccordionTrigger
                    onClick={() => {
                      if (!sidebarOpen) {
                        setSidebarOpen(true);
                      }
                    }}
                    className={`flex w-full items-center transition-colors cursor-pointer h-10 py-0 hover:no-underline rounded-md ${navText} ${navHover} ${
                      !sidebarOpen
                        ? "justify-center px-0"
                        : "justify-between px-4"
                    } [&[data-state=open]>svg]:rotate-90`}
                    //@ts-expect-error forced prop
                    showIcon={sidebarOpen}
                  >
                    <div
                      className={`flex items-center ${
                        !sidebarOpen ? "justify-center" : ""
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${sidebarOpen ? "mr-3" : "mr-0"}`}
                      />
                      {sidebarOpen && (
                        <span className="text-sm font-medium ml-2">
                          {group.text}
                        </span>
                      )}
                    </div>
                    {!sidebarOpen && <span className="hidden" />}
                  </AccordionTrigger>

                  {sidebarOpen && (
                    <AccordionContent className="pb-1 pt-1 ml-4 space-y-1">
                      {group.items?.map((subItem) => (
                        <Button
                          key={subItem.text}
                          variant="ghost"
                          onClick={() => router.push(subItem.route)}
                          className={`w-full justify-start h-9 text-sm cursor-pointer px-4 ${subText} ${navHover} ${
                            router.pathname === subItem.route ? subActive : ""
                          }`}
                        >
                          {subItem.text}
                        </Button>
                      ))}
                    </AccordionContent>
                  )}
                </AccordionItem>
              </Accordion>
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
        <div className={isLight ? "light-theme" : ""}>
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
