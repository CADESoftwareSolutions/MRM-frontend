import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { Badge } from "@/components/ui/badge";
import { themeAtom } from "@/atoms/NavigationAtom";

export type MatchTone = "green" | "yellow" | "gray" | "red" | "blue";

const TONES_DARK: Record<MatchTone, string> = {
  green: "bg-green-500/20 text-green-300 border-green-400/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  gray: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  red: "bg-red-500/20 text-red-300 border-red-400/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
};

const TONES_LIGHT: Record<MatchTone, string> = {
  green: "bg-green-100 text-green-700 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  gray: "bg-gray-100 text-gray-600 border-gray-300",
  red: "bg-red-100 text-red-700 border-red-300",
  blue: "bg-blue-100 text-blue-700 border-blue-300",
};

export const MatchBadge = ({ tone, children, title }: { tone: MatchTone; children: ReactNode; title?: string }) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Badge variant="outline" title={title} className={`text-xs font-medium ${(isLight ? TONES_LIGHT : TONES_DARK)[tone]}`}>
      {children}
    </Badge>
  );
};

export default MatchBadge;
