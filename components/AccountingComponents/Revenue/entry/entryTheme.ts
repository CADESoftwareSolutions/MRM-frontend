import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";

export const INPUT_CLASS = "h-9 bg-white/5 border-purple-300/30 text-white";
export const EDITOR_PANEL_CLASS = "rounded-lg border border-purple-300/20 bg-white/5 px-4 py-3";
export const EDITOR_PANEL_TITLE_CLASS = "text-base font-bold uppercase tracking-wider text-white";
/** Disabled (posted, read-only) fields stay legible instead of fading to half opacity. */
export const READ_ONLY_CLASS = "disabled:opacity-80 disabled:cursor-default";
export const SECTION_HEADER_CLASS = "text-base font-bold uppercase tracking-wider text-white";
export const NUM_CLASS = "text-right tabular-nums";

/** Classes the .light-theme overrides in index.css don't cover, picked per theme. Popover
 * classes are for content portalled to <body>, outside the .light-theme wrapper. */
export const useEntryTheme = () => {
  const isLight = useAtomValue(themeAtom) === "light";
  return useMemo(
    () => ({
      isLight,
      headerText: isLight ? "text-gray-500" : "text-white",
      rowBorder: isLight ? "border-purple-100" : "border-purple-300/10",
      groupRow: isLight ? "bg-purple-100" : "bg-purple-600/20",
      expandedRow: isLight ? "bg-purple-50/70" : "bg-white/[0.03]",
      ownerTint: isLight ? "bg-purple-50" : "bg-purple-600/10",
      rowHover: isLight ? "hover:bg-purple-200/40" : "hover:bg-purple-500/[0.12]",
      outlineButton: isLight
        ? "bg-white border-purple-300/30 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
        : "bg-transparent border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white",
      ghostButton: isLight
        ? "text-purple-700 hover:bg-purple-100 hover:text-purple-900"
        : "text-purple-300 hover:bg-purple-500/20 hover:text-purple-100",
      iconButton: isLight
        ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
        : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20",
      dangerIconButton: isLight
        ? "text-red-600 hover:text-red-800 hover:bg-red-50"
        : "text-red-400 hover:text-red-200 hover:bg-red-500/20",
      dangerButton: isLight
        ? "bg-transparent border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
        : "bg-transparent border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200",
      warnBadge: isLight
        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
        : "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      okBadge: isLight
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-green-500/20 text-green-300 border-green-400/30",
      badBadge: isLight ? "bg-red-100 text-red-700 border-red-300" : "bg-red-500/20 text-red-300 border-red-400/30",
      accountBadge: isLight
        ? "bg-purple-100 text-purple-800 border-purple-300"
        : "bg-purple-500/20 text-purple-200 border-purple-400/30",
      warnText: isLight ? "text-yellow-800" : "text-yellow-300",
      okText: isLight ? "text-green-700" : "text-green-300",
      badText: isLight ? "text-red-700" : "text-red-300",
      warnBox: isLight
        ? "bg-yellow-50 border-yellow-300 text-yellow-900"
        : "bg-yellow-500/10 border-yellow-400/30 text-yellow-100",
      voidBox: isLight ? "bg-gray-100 border-gray-300 text-gray-800" : "bg-gray-500/10 border-gray-400/30 text-gray-200",
      voidMuted: isLight ? "text-gray-600" : "text-gray-400",
      balancedBar: isLight ? "bg-green-50 border-green-300" : "bg-green-500/[0.08] border-green-300/35",
      unbalancedBar: isLight ? "bg-red-50 border-red-300" : "bg-red-500/[0.08] border-red-300/35",
      dashedLink: isLight
        ? "border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
        : "border-yellow-300/60 bg-yellow-500/[0.08] text-yellow-300 hover:bg-yellow-500/15",
      popoverText: isLight ? "text-gray-900" : "text-white",
      popoverMuted: isLight ? "text-gray-500" : "text-white/60",
      popoverDivider: isLight ? "border-purple-200" : "border-purple-300/15",
      optionActive: isLight ? "bg-purple-100 text-purple-900" : "bg-purple-400/40",
    }),
    [isLight],
  );
};

export type EntryTheme = ReturnType<typeof useEntryTheme>;
