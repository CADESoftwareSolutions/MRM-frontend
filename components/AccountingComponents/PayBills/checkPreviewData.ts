import { useMemo } from "react";
import { useApInvoices } from "@/hooks/useApInvoices";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { ApInvoice, ApInvoiceLine, roundCents } from "@/types/apInvoices";
import { formatAccountLabel } from "@/types/chartOfAccounts";
import { BankAccount, CheckRunCheck } from "@/types/checkRuns";
import type { CheckDistributionLine, CheckPreviewData, CheckStubLine } from "./CheckPreview";

/** Spreads a payment across the invoice's coding lines in proportion, with the rounding cents on
 * the last line so the distribution always adds up to what the check pays. */
const prorate = (lines: ApInvoiceLine[], paid: number): { line: ApInvoiceLine; amount: number }[] => {
  const coded = roundCents(lines.reduce((sum, line) => sum + line.amount, 0));
  if (roundCents(paid) === coded) return lines.map((line) => ({ line, amount: line.amount }));
  let remaining = roundCents(paid);
  return lines.map((line, index) => {
    if (index === lines.length - 1) return { line, amount: remaining };
    const amount = coded ? roundCents((line.amount * paid) / coded) : 0;
    remaining = roundCents(remaining - amount);
    return { line, amount };
  });
};

const memoFor = (invoiceNumbers: string[]) =>
  invoiceNumbers.length <= 3 ? `Inv ${invoiceNumbers.join(", ")}` : `${invoiceNumbers.length} invoices, see stub`;

export const bankLabelForCheck = (bank: BankAccount | undefined) =>
  bank ? `${bank.bankName} · ${bank.bankCityState}` : "";

export const buildCheckPreview = (
  check: CheckRunCheck,
  checkDate: string,
  bank: BankAccount | undefined,
  invoicesById: Map<string, ApInvoice>,
  accountLabel: (accountId: string) => string,
): CheckPreviewData => {
  const paid = check.items.flatMap((item) => {
    const invoice = invoicesById.get(item.invoiceId);
    return invoice ? [{ invoice, amount: item.amount }] : [];
  });

  const lines: CheckStubLine[] = paid.map(({ invoice, amount }) => ({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    description: invoice.stubDescription || invoice.lines[0]?.description || "",
    invoiceAmount: invoice.invoiceAmount,
    discount: 0,
    paid: amount,
    journalId: invoice.journalId ?? undefined,
  }));

  const distribution = new Map<string, CheckDistributionLine>();
  for (const { invoice, amount } of paid) {
    for (const share of prorate(invoice.lines, amount)) {
      const { line } = share;
      const subAccountLabel = line.wellLabel || line.projectLabel || undefined;
      const key = [line.accountId, subAccountLabel, line.afe, line.deck].join("|");
      const existing = distribution.get(key);
      if (existing) {
        existing.amount = roundCents(existing.amount + share.amount);
      } else {
        distribution.set(key, {
          accountLabel: accountLabel(line.accountId),
          subAccountLabel,
          afe: line.afe ?? undefined,
          deck: line.deck ?? undefined,
          amount: share.amount,
        });
      }
    }
  }

  const first = paid[0]?.invoice;
  return {
    checkNumber: check.checkNumber,
    checkDate,
    amount: check.amount,
    payee: { name: first?.vendorName ?? check.vendorName, addressLines: first?.remitTo ?? [] },
    memo: memoFor(paid.map(({ invoice }) => invoice.invoiceNumber)),
    bankAccountLabel: bankLabelForCheck(bank),
    lines,
    distribution: Array.from(distribution.values()),
  };
};

/** The printable checks for a run (or a selection that isn't a run yet). */
export const useCheckPreviews = (
  checks: CheckRunCheck[],
  checkDate: string,
  bank: BankAccount | undefined,
): CheckPreviewData[] => {
  const { invoices } = useApInvoices();
  const { getAccount } = useChartOfAccounts();
  const { settings } = useCompanySettings();
  const companyName = settings?.companyName;
  const companyAddressLines = settings?.companyAddressLines;

  return useMemo(() => {
    const invoicesById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
    const accountLabel = (accountId: string) => {
      const account = getAccount(accountId);
      return account ? formatAccountLabel(account) : accountId;
    };
    return checks.map((check) => ({
      ...buildCheckPreview(check, checkDate, bank, invoicesById, accountLabel),
      companyName,
      companyAddressLines,
    }));
  }, [bank, checkDate, checks, companyAddressLines, companyName, getAccount, invoices]);
};
