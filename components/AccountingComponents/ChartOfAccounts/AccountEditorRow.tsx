import { useId, useState, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndex";
import {
  ACCOUNT_CATEGORIES,
  AccountCategory,
  ChartAccount,
  ChartAccountInput,
  formatAccountNumber,
} from "@/types/chartOfAccounts";
import { AccountDraft, RULES_HINT, draftFromAccount, draftToInput, validateDraft } from "./accountDraft";

interface AccountEditorRowProps {
  /** Omitted for the add row. */
  account?: ChartAccount;
  accounts: ChartAccount[];
  defaultCategory: AccountCategory;
  isLight: boolean;
  onSave: (input: ChartAccountInput) => Promise<void>;
  onCancel: () => void;
}

type DraftField = "account" | "sub" | "description";

const inputCls = "h-9 bg-white/5 border-purple-300/30 text-white";

export const AccountEditorRow = ({
  account,
  accounts,
  defaultCategory,
  isLight,
  onSave,
  onCancel,
}: AccountEditorRowProps) => {
  const isEdit = !!account;
  const errorIdBase = useId();
  const errorId = (field: DraftField | "save") => `${errorIdBase}-${field}`;
  const numberLocked = !!account && account.transactionCount > 0;
  const categoryLocked = numberLocked;
  const categoryLockId = `${useId()}-category-lock`;
  const [draft, setDraft] = useState<AccountDraft>(() =>
    account ? draftFromAccount(account) : { account: "", sub: "", description: "", category: defaultCategory },
  );
  // A fresh add row shouldn't open already shouting "Required"; each field starts reporting
  // once it's been typed in or left.
  const [touched, setTouched] = useState<Record<DraftField, boolean>>({
    account: isEdit,
    sub: isEdit,
    description: isEdit,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const validation = validateDraft(draft, accounts, account?.id);
  const canSave = validation.valid && !saving;

  const errorFor = (field: DraftField) => (touched[field] ? validation[field] : "");
  const touch = (field: DraftField) => setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  const update = (field: DraftField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    touch(field);
    setSaveError(null);
  };

  const save = async () => {
    if (!canSave) {
      setTouched({ account: true, sub: true, description: true });
      return;
    }
    setSaving(true);
    try {
      await onSave(draftToInput(draft));
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const parsed = draftToInput(draft);
  const hint = validation.valid
    ? `Ready to save ${formatAccountNumber(parsed)} ${parsed.description} as ${draft.category}.`
    : RULES_HINT;
  const lockNote =
    account && numberLocked
      ? `Account, Sub and Category are locked: ${account.transactionCount.toLocaleString("en-US")} posted ${
          account.transactionCount === 1 ? "transaction" : "transactions"
        }.`
      : null;

  const accountNumber = account ? formatAccountNumber(account) : null;
  const labelPrefix = accountNumber ? `${accountNumber} ` : "New ";
  const errorText = (field: DraftField) =>
    errorFor(field) && (
      <p id={errorId(field)} className="text-red-400 text-xs mt-1 leading-snug">
        {errorFor(field)}
      </p>
    );
  const describedBy = (field: DraftField) => (errorFor(field) ? errorId(field) : undefined);

  return (
    <tr
      className={`border-b align-top ${
        isLight ? "bg-purple-100/70 border-purple-200" : "bg-purple-600/15 border-purple-300/30"
      }`}
    >
      <td className="px-4 py-3">
        <Input
          aria-label={`${labelPrefix}account number`}
          inputMode="numeric"
          placeholder="1–9999"
          autoFocus={!numberLocked}
          disabled={numberLocked}
          title={numberLocked ? "Locked: this account has posted transactions" : undefined}
          value={draft.account}
          onChange={(e) => update("account", e.target.value)}
          onBlur={() => touch("account")}
          onKeyDown={onKeyDown}
          aria-invalid={!!errorFor("account") || undefined}
          aria-describedby={describedBy("account")}
          className={`${inputCls} tabular-nums ${errorFor("account") ? "ring-1 ring-red-500" : ""}`}
        />
        {errorText("account")}
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label={`${labelPrefix}sub number`}
          inputMode="numeric"
          placeholder="Optional"
          disabled={numberLocked}
          title={numberLocked ? "Locked: this account has posted transactions" : undefined}
          value={draft.sub}
          onChange={(e) => update("sub", e.target.value)}
          onBlur={() => touch("sub")}
          onKeyDown={onKeyDown}
          aria-invalid={!!errorFor("sub") || undefined}
          aria-describedby={describedBy("sub")}
          className={`${inputCls} tabular-nums ${errorFor("sub") ? "ring-1 ring-red-500" : ""}`}
        />
        {errorText("sub")}
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label={`${labelPrefix}account description`}
          placeholder="Description"
          autoFocus={numberLocked}
          value={draft.description}
          onChange={(e) => update("description", e.target.value.toUpperCase())}
          onBlur={() => touch("description")}
          onKeyDown={onKeyDown}
          aria-invalid={!!errorFor("description") || undefined}
          aria-describedby={describedBy("description")}
          className={`${inputCls} ${errorFor("description") ? "ring-1 ring-red-500" : ""}`}
        />
        {errorText("description")}
      </td>
      <td className="px-4 py-3">
        <Select
          disabled={categoryLocked}
          value={draft.category}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, category: value as AccountCategory }))}
        >
          <SelectTrigger
            aria-label={`${labelPrefix}account category`}
            aria-describedby={categoryLocked ? categoryLockId : undefined}
            style={{ width: "100%" }}
            className={`${inputCls} cursor-pointer`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{ zIndex: Z_INDEX.modalDropdown }}
            className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
            position="popper"
            sideOffset={4}
          >
            {ACCOUNT_CATEGORIES.map((category) => (
              <SelectItem
                key={category}
                value={category}
                className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categoryLocked && (
          <p id={categoryLockId} className="text-white/60 text-xs mt-1 leading-snug">
            Locked: posted transactions.
          </p>
        )}
      </td>
      <td colSpan={3} className="px-4 py-3">
        <div className="pt-2 text-xs leading-snug space-y-1">
          {saveError ? (
            <p id={errorId("save")} role="alert" className="text-red-400">
              {saveError}
            </p>
          ) : (
            <p className={validation.valid ? "text-white/80" : "text-white/60"}>{hint}</p>
          )}
          {lockNote && <p className="text-white/60">{lockNote}</p>}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            aria-label={accountNumber ? `Save ${accountNumber}` : "Save new account"}
            aria-describedby={saveError ? errorId("save") : undefined}
            title="Save"
            className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label={accountNumber ? `Cancel editing ${accountNumber}` : "Cancel new account"}
            title="Cancel"
            className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isLight
                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                : "text-red-400 hover:text-red-200 hover:bg-red-500/20"
            }`}
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </td>
    </tr>
  );
};
