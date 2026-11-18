import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { ChevronsUpDown } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ChartAccount } from "@/types/chartOfAccounts";
import { TaxDeductType } from "@/types/revenue";
import { AccountPicker } from "../../AccountPicker";
import { pickerCategories } from "./typesModel";

export interface TypeAccountCellProps {
  type: TaxDeductType;
  showAllCategories: boolean;
  /** Resolves true once saved. */
  onPick: (account: ChartAccount) => Promise<boolean>;
  onClear: () => void;
}

/** An unmapped label shows an amber "Choose account" button that turns into the picker on click.
 * It's a button rather than a restyled picker because the global `input` border rule in
 * index.css outranks any border colour passed to the picker's input. */
export const TypeAccountCell = ({ type, showAllCategories, onPick, onClear }: TypeAccountCellProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const { getAccount } = useChartOfAccounts();
  const pickerRef = useRef<HTMLInputElement>(null);
  const pickingRef = useRef(false);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (choosing) pickerRef.current?.focus();
  }, [choosing]);

  useEffect(() => {
    setChoosing(false);
  }, [type.accountId]);

  const pick = async (account: ChartAccount) => {
    if (account.id === type.accountId) return;
    if (!type.accountId) {
      // Mapping moves the row out of the unmapped group, and a focused node that React moves
      // loses focus without a reliable blur, leaving the picker stuck in its focused display.
      // The flag keeps the picker up (rather than flashing the amber button) until the save lands.
      pickingRef.current = true;
      pickerRef.current?.blur();
      pickingRef.current = false;
    }
    if (!(await onPick(account))) setChoosing(false);
  };

  if (!type.accountId && !choosing) {
    return (
      <button
        type="button"
        onClick={() => setChoosing(true)}
        aria-label={`Choose account for ${type.label}`}
        className={`flex h-8 w-full items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed px-2 text-[13px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-[3px] ${
          isLight
            ? "border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus-visible:ring-yellow-500/30"
            : "border-yellow-300/60 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 focus-visible:ring-yellow-300/30"
        }`}
      >
        Choose account
        <ChevronsUpDown className="size-3.5 shrink-0" />
      </button>
    );
  }

  return (
    <AccountPicker
      ref={pickerRef}
      size="sm"
      value={type.accountId}
      categories={pickerCategories(type.kind, showAllCategories, getAccount(type.accountId)?.category)}
      placeholder="Choose account"
      aria-label={`Account for ${type.label}`}
      onChange={(_, account) => void pick(account)}
      onClear={onClear}
      onBlur={() => {
        if (!pickingRef.current) setChoosing(false);
      }}
    />
  );
};

export default TypeAccountCell;
