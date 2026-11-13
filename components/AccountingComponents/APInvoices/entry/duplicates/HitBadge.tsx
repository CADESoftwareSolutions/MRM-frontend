import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { Badge } from "@/components/ui/badge";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";

/** Yellow badge for what a duplicate shares with this invoice ("Same", "Same invoice #"). */
export const HitBadge = ({ children, className }: { children: ReactNode; className?: string }) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        isLight ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
        className,
      )}
    >
      {children}
    </Badge>
  );
};

export default HitBadge;
