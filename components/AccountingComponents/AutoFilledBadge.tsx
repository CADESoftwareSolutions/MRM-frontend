import { useAtom } from "jotai";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";

interface AutoFilledBadgeProps {
  /** Tooltip text; pass "" for no tooltip. */
  title?: string;
  className?: string;
}

export const AutoFilledBadge = ({
  title = "Read from the attached document",
  className,
}: AutoFilledBadgeProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  // Badge doesn't forward refs, so the tooltip anchors to this wrapper instead.
  const badge = (
    <span className={cn("inline-flex align-middle", className)}>
      <Badge className="h-[18px] rounded-[5px] border-transparent bg-blue-500/20 px-1.5 py-0 text-[10px] font-bold leading-none tracking-wider text-blue-300">
        AUTO
      </Badge>
    </span>
  );

  if (!title) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={4}
        // Portals to <body>, where a plain z-50 would slide under the fixed app bar.
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={isLight ? undefined : "border border-purple-300/30"}
      >
        {title}
      </TooltipContent>
    </Tooltip>
  );
};

export default AutoFilledBadge;
