import { Button } from "@/components/ui/button";
import { FileText, House, Layers, Settings, Users } from "lucide-react";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useState } from "react";
import DashboardHeader from "../../components/DashboardComponents/DashboardHeader";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAtom } from "jotai";
import { openAccordionsAtom } from "@/atoms/NavigationAtom";

const fullWidth = 240;
const collapsedWidth = 60;
const appBarHeight = 64;

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const [openAccordions, setOpenAccordions] = useAtom(openAccordionsAtom);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const sidebarWidth = sidebarOpen ? fullWidth : collapsedWidth;
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const menuItems = [
    { type: "link", text: "Home", icon: House, route: "/Dashboard" },
    {
      type: "group",
      text: "Land",
      icon: Layers,
      items: [
        { text: "Leases", route: "/Dashboard/DashboardDirectory/Leases" },
        { text: "Wells", route: "/Dashboard/DashboardDirectory/Wells" },
        { text: "Deeds", route: "/Dashboard/DashboardDirectory/Deeds" },
      ],
    },
    {
      type: "group",
      text: "Accounting",
      icon: FileText,
      items: [
        { text: "Documents", route: "/Dashboard/DashboardDirectory/Documents" },
        { text: "Checks", route: "/Dashboard/DashboardDirectory/Checks" },
        { text: "Reports", route: "/Dashboard/DashboardDirectory/Reports" },
      ],
    },
    {
      type: "link",
      text: "Directory",
      icon: Users,
      route: "/Dashboard/DashboardDirectory/Directory",
    },
    {
      type: "link",
      text: "Settings",
      icon: Settings,
      route: "/Dashboard/Settings",
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
      className="flex min-h-screen text-white"
      style={{
        background:
          "linear-gradient(135deg, #2d1b4e 0%, #1e1e3f 50%, #2d1b4e 100%)",
      }}
    >
      <aside
        className="fixed flex h-screen flex-col bg-white/5 border-white/10 backdrop-blur-lg border-r border-white/10 backdrop-blur-sm transition-all duration-300 ease-in-out z-[1300]"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div
          className="flex items-center px-4"
          style={{ height: `${appBarHeight}px` }}
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

        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((group) => {
            const Icon = group.icon;
            const isActive =
              group.type === "link" && router.pathname === group.route;

            if (group.type === "link") {
              return (
                <Button
                  key={group.text}
                  variant="ghost"
                  onClick={() => router.push(group.route!)}
                  className={`w-full justify-start text-white transition-colors hover:bg-[#e91e63] cursor-pointer h-10 ${
                    isActive ? "bg-[#e91e63]" : ""
                  }`}
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
                    className={`flex w-full items-center text-white transition-colors hover:bg-[#e91e63] cursor-pointer h-10 py-0 hover:no-underline rounded-md ${
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
                          className={`w-full justify-start h-9 text-sm text-gray-300 hover:text-white hover:bg-[#e91e63] cursor-pointer px-4 ${
                            router.pathname === subItem.route
                              ? "bg-[#e91e63]/20 text-white"
                              : ""
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
        {children}
      </main>
    </div>
  );
};
export default DashboardLayout;
