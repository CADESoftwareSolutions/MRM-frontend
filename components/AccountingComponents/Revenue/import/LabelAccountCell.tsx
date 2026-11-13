import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import type { AccountCategory } from "@/types/chartOfAccounts";
import { AccountPicker } from "../../AccountPicker";
import { useImportTheme } from "./importTheme";

export interface LabelAccountCellProps {
  label: string;
  value: string | null;
  onChange: (accountId: string | null) => void;
}

// Revenue-side accounts only: taxes, deducts, and income for reimbursements and interest.
const LABEL_CATEGORIES: AccountCategory[] = ["TAXES", "DEDUCTIONS", "INCOME"];

/** Until an account is picked this is an amber "Choose account" button that turns into the
 * picker on click, as on the Tax & Deduct Types tab: the global `input` border rule in index.css
 * outranks any border colour passed to the picker itself. */
export const LabelAccountCell = ({ label, value, onChange }: LabelAccountCellProps) => {
  const theme = useImportTheme();
  const { getAccount } = useChartOfAccounts();
  const pickerRef = useRef<HTMLInputElement>(null);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (choosing) pickerRef.current?.focus();
  }, [choosing]);

  if (!value && !choosing) {
    return (
      <button
        type="button"
        onClick={() => setChoosing(true)}
        aria-label={`Choose account for ${label}`}
        className={`flex h-8 w-full items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed px-2 text-[13px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-[3px] ${theme.needButton}`}
      >
        Choose account
        <ChevronsUpDown className="size-3.5 shrink-0" />
      </button>
    );
  }

  const currentCategory = getAccount(value)?.category;
  return (
    <AccountPicker
      ref={pickerRef}
      size="sm"
      value={value}
      categories={currentCategory && !LABEL_CATEGORIES.includes(currentCategory) ? undefined : LABEL_CATEGORIES}
      placeholder="Choose account"
      aria-label={`Account for ${label}`}
      onChange={(id) => {
        onChange(id);
        setChoosing(false);
      }}
      onClear={() => onChange(null)}
      onBlur={() => setChoosing(false)}
    />
  );
};

export default LabelAccountCell;
