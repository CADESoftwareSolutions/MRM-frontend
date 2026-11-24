import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";

export const SECTION_HEADER_CLASS = "text-base font-bold uppercase tracking-wider text-white";
export const PRIMARY_BUTTON_CLASS = "bg-purple-600 hover:bg-purple-700 cursor-pointer";

/** Classes the .light-theme overrides in index.css don't cover, picked per theme. Popover classes
 * are for content portalled to <body>, outside the .light-theme wrapper. */
export const useImportTheme = () => {
  const isLight = useAtomValue(themeAtom) === "light";
  return useMemo(
    () => ({
      isLight,
      headerText: isLight ? "text-gray-500" : "text-white",
      rowBorder: isLight ? "border-purple-100" : "border-purple-300/10",
      outlineButton: isLight
        ? "bg-white border-purple-300/30 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
        : "bg-transparent border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white",
      ghostButton: isLight
        ? "text-purple-700 hover:bg-purple-100 hover:text-purple-900"
        : "text-purple-300 hover:bg-purple-500/20 hover:text-purple-100",
      link: isLight
        ? "text-purple-700 hover:text-purple-900 underline underline-offset-2 cursor-pointer"
        : "text-purple-300 hover:text-purple-100 underline underline-offset-2 cursor-pointer",
      needButton: isLight
        ? "border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus-visible:ring-yellow-500/30"
        : "border-yellow-300/60 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 focus-visible:ring-yellow-300/30",
      needRing: isLight ? "ring-1 ring-yellow-500" : "ring-1 ring-yellow-300/60",
      okDot: isLight ? "bg-green-100 text-green-700" : "bg-green-500/25 text-green-300",
      warnText: isLight ? "text-yellow-800" : "text-yellow-300",
      okText: isLight ? "text-green-700" : "text-green-300",
      badText: isLight ? "text-red-700" : "text-red-300",
      warnBox: isLight
        ? "bg-yellow-50 border-yellow-300 text-yellow-900"
        : "bg-yellow-500/10 border-yellow-400/30 text-yellow-100",
      errorBox: isLight ? "bg-red-50 border-red-300 text-red-800" : "bg-red-500/10 border-red-500/40 text-red-200",
      okBox: isLight ? "bg-green-50 border-green-300 text-green-800" : "bg-green-500/[0.08] border-green-300/35 text-green-200",
      dropZone: isLight
        ? "border-purple-300 hover:border-purple-500 hover:bg-purple-50"
        : "border-purple-300/30 hover:border-purple-400/50 hover:bg-white/5",
      dropZoneActive: isLight ? "border-purple-600 bg-purple-100" : "border-purple-400 bg-purple-500/10",
      popoverText: isLight ? "text-gray-900" : "text-white",
      popoverMuted: isLight ? "text-gray-500" : "text-white/50",
      popoverDivider: isLight ? "border-purple-200" : "border-purple-300/15",
      optionActive: isLight ? "bg-purple-100" : "bg-purple-600/30",
    }),
    [isLight],
  );
};

export type ImportTheme = ReturnType<typeof useImportTheme>;
