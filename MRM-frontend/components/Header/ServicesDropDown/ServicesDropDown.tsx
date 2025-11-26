import React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ourFeatures } from "../../HomePage/AboutUs/AboutUs";

const ServicesDropDown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="text-base font-medium text-white transition-colors hover:text-[#e91e63]"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Services
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {ourFeatures.map((feature) => (
          <DropdownMenuItem key={feature.title} asChild>
            <Link
              href={`/Services/${feature.slug}`}
              className="w-full cursor-pointer whitespace-normal border-b border-gray-200 px-4 py-3 text-sm font-semibold text-[#1c2e4a] no-underline hover:!bg-green-50 focus:!bg-green-50  last:border-b-0"
              style={{ lineHeight: 1.2 }}
            >
              {feature.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ServicesDropDown;
