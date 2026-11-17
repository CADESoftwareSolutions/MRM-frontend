import {
  AccountCategory,
  ChartAccount,
  ChartAccountInput,
  formatAccountNumber,
  isSameAccountNumber,
} from "@/types/chartOfAccounts";

/** The inline add/edit row's raw field values, kept as typed so errors can describe them. */
export interface AccountDraft {
  account: string;
  sub: string;
  description: string;
  category: AccountCategory;
}

export interface AccountDraftValidation {
  account: string;
  sub: string;
  description: string;
  valid: boolean;
}

export const RULES_HINT = "Account and Sub are whole numbers from 1 to 9999. Account + Sub must be unique.";

const numberError = (raw: string, required: boolean) => {
  if (raw === "") return required ? "Required" : "";
  if (!/^\d+$/.test(raw)) return "Whole number only: no decimals or commas";
  const n = Number(raw);
  return n < 1 || n > 9999 ? "Must be 1 to 9999" : "";
};

const descriptionError = (raw: string) => {
  if (raw.trim() === "") return "Required";
  if (!/[A-Z]/.test(raw)) return "Must include letters";
  if (!/^[A-Z0-9 ]+$/.test(raw)) return "Letters and numbers only";
  return "";
};

export const draftToInput = (draft: AccountDraft): ChartAccountInput => ({
  account: Number(draft.account.trim()),
  sub: draft.sub.trim() === "" ? null : Number(draft.sub.trim()),
  description: draft.description.trim(),
  category: draft.category,
});

export const draftFromAccount = (account: ChartAccount): AccountDraft => ({
  account: String(account.account),
  sub: account.sub == null ? "" : String(account.sub),
  description: account.description,
  category: account.category,
});

/** `editingId` is left out of the uniqueness check so an account doesn't collide with itself. */
export const validateDraft = (
  draft: AccountDraft,
  accounts: ChartAccount[],
  editingId?: string,
): AccountDraftValidation => {
  const accountError = numberError(draft.account.trim(), true);
  const subError = numberError(draft.sub.trim(), false);
  const description = descriptionError(draft.description);
  let duplicate = "";
  if (!accountError && !subError) {
    const parsed = draftToInput(draft);
    if (accounts.some((a) => a.id !== editingId && isSameAccountNumber(a, parsed))) {
      duplicate = `${formatAccountNumber(parsed)} already exists`;
    }
  }
  return {
    account: accountError || duplicate,
    sub: subError,
    description,
    valid: !accountError && !subError && !description && !duplicate,
  };
};
