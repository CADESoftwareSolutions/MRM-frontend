import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RevenueCheckTotals, formatMoney } from "@/types/revenue";
import { useEntryTheme } from "./entryTheme";

interface BalanceBarProps {
  checkAmount: number;
  totals: RevenueCheckTotals;
  /** Nothing else stands in the way of posting. */
  readyToPost: boolean;
}

/** Check amount against the detail lines' owner net, live as the user types. Only the badge is a
 * live region, so screen readers hear the state change, not every keystroke's totals. */
export const BalanceBar = ({ checkAmount, totals, readyToPost }: BalanceBarProps) => {
  const theme = useEntryTheme();
  const { balanced } = totals;

  const stat = (label: string, value: string, tone?: string) => (
    <div>
      <span className={cn("block text-xs font-semibold uppercase tracking-wider", theme.headerText)}>{label}</span>
      <strong className={cn("block text-xl font-semibold tabular-nums text-white", tone)}>{value}</strong>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border px-4 py-3",
        balanced ? theme.balancedBar : theme.unbalancedBar,
      )}
    >
      {stat("Check amount", `$${formatMoney(checkAmount)}`)}
      {stat("Detail lines (owner net)", `$${formatMoney(totals.ownerNet)}`)}
      {stat("Difference", `$${formatMoney(totals.difference)}`, balanced ? theme.okText : theme.badText)}
      <Badge
        role="status"
        variant="outline"
        className={cn("ml-auto rounded-md text-xs font-medium", balanced ? theme.okBadge : theme.badBadge)}
      >
        {balanced ? <Check className="size-3" strokeWidth={3} /> : <AlertTriangle className="size-3" />}
        {balanced ? (readyToPost ? "Balanced, ready to post" : "Balanced") : "Out of balance"}
      </Badge>
    </div>
  );
};

export default BalanceBar;
