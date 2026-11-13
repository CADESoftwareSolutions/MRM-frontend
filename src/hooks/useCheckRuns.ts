import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import { MAX_CHECK_AMOUNT } from "../lib/amountInWords";
import { MOCK_BANK_ACCOUNTS, MOCK_CHECK_RUNS } from "../mocks/checkRuns";
import {
  AP_STATUS_LABELS,
  ApInvoice,
  ApPayment,
  VendorPay,
  formatIsoDate,
  formatUsd,
  roundCents,
} from "../types/apInvoices";
import {
  BankAccount,
  CHECK_RUN_STATUS_LABELS,
  CheckRun,
  CheckRunCheck,
  CheckRunInput,
  CheckRunItem,
  CheckRunStatus,
  PENDING_CHECK_RUN_STATUSES,
  formatBankAccountLabel,
} from "../types/checkRuns";
import { apInvoicesQuery, apPaymentsQuery, useApInvoices } from "./useApInvoices";
import { fallbackVendorDefaults, vendorDefaultsQuery } from "./useVendorDefaults";

// gcTime is Infinity only while this is mocked: the cache is the only copy of the session's
// edits, so it must outlive every screen that reads it.
export const checkRunsQuery = queryOptions({
  queryKey: ["checkRuns"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_CHECK_RUNS)
  queryFn: async (): Promise<CheckRun[]> => structuredClone(MOCK_CHECK_RUNS),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const bankAccountsQuery = queryOptions({
  queryKey: ["bankAccounts"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_BANK_ACCOUNTS)
  queryFn: async (): Promise<BankAccount[]> => structuredClone(MOCK_BANK_ACCOUNTS),
  staleTime: Infinity,
  gcTime: Infinity,
});

const NO_RUNS: CheckRun[] = [];
const NO_BANKS: BankAccount[] = [];

const newRunId = () => `run-${crypto.randomUUID()}`;

const nowIso = () => new Date().toISOString();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const describeRunStatus = (status: CheckRunStatus) => CHECK_RUN_STATUS_LABELS[status].toLowerCase();

export const isPendingRun = (run: CheckRun) => PENDING_CHECK_RUN_STATUSES.includes(run.status);

/** Numbers are assigned when a run is submitted, so drafts hold none. A voided run gives its
 * numbers back unless the checks were already printed on paper. */
const holdsCheckNumbers = (run: CheckRun) =>
  run.status === "void" ? !!run.printedAt : run.status !== "draft";

/** Groups invoices into checks by each vendor's Pay setting — "Check per entry" writes one check
 * per invoice, "Yes" and "Monthly" one check per vendor — keeping vendors in the order their first
 * invoice appears, and numbers them from `startingCheckNumber`. Invoices not in the map are skipped. */
export const planChecks = (
  items: CheckRunItem[],
  invoicesById: Map<string, ApInvoice>,
  payFor: (vendorId: string) => VendorPay,
  startingCheckNumber: number,
): CheckRunCheck[] => {
  const byVendor = new Map<string, { invoice: ApInvoice; item: CheckRunItem }[]>();
  for (const item of items) {
    const invoice = invoicesById.get(item.invoiceId);
    if (!invoice) continue;
    const entries = byVendor.get(invoice.vendorId) ?? [];
    entries.push({ invoice, item: { invoiceId: item.invoiceId, amount: roundCents(item.amount) } });
    byVendor.set(invoice.vendorId, entries);
  }

  const checks: CheckRunCheck[] = [];
  byVendor.forEach((entries, vendorId) => {
    const pay = payFor(vendorId);
    const groups = pay === "Check per entry" ? entries.map((entry) => [entry]) : [entries];
    for (const group of groups) {
      checks.push({
        checkNumber: String(startingCheckNumber + checks.length),
        vendorId,
        vendorName: group[0].invoice.vendorName,
        pay,
        items: group.map((entry) => entry.item),
        amount: roundCents(group.reduce((sum, entry) => sum + entry.item.amount, 0)),
      });
    }
  });
  return checks;
};

/** One past the highest number on the bank account or in any run that still holds its numbers. */
export const nextCheckNumberFor = (
  bank: BankAccount | undefined,
  runs: CheckRun[],
  excludeRunId?: string | null,
): number => {
  if (!bank) return 1;
  let last = bank.lastCheckNumber;
  for (const run of runs) {
    if (run.bankAccountId !== bank.id || run.id === excludeRunId || !holdsCheckNumbers(run)) continue;
    for (const check of run.checks) last = Math.max(last, Number(check.checkNumber) || 0);
  }
  return last + 1;
};

/** Invoices already in another started run. Drafts don't schedule their invoices, so the invoice
 * status alone can't tell. */
export const invoicesHeldByRuns = (runs: CheckRun[], excludeRunId?: string | null): Map<string, CheckRun> => {
  const held = new Map<string, CheckRun>();
  for (const run of runs) {
    if (run.id === excludeRunId || !isPendingRun(run)) continue;
    for (const item of run.items) held.set(item.invoiceId, run);
  }
  return held;
};

/** Why a submitted or approved run can't go ahead as planned, e.g. an invoice was voided after
 * the run was submitted. Empty when the run is fine. */
export const checkRunProblems = (
  run: CheckRun,
  invoicesById: Map<string, ApInvoice>,
  payFor?: (vendorId: string) => VendorPay,
): string[] => {
  if (run.status !== "awaiting_approval" && run.status !== "approved") return [];
  const problems: string[] = [];
  const heldVendors = new Set<string>();
  for (const item of run.items) {
    const invoice = invoicesById.get(item.invoiceId);
    if (!invoice) {
      problems.push("An invoice in this run no longer exists");
      continue;
    }
    const ref = `${invoice.vendorName} #${invoice.invoiceNumber}`;
    if (payFor?.(invoice.vendorId) === "No" && !heldVendors.has(invoice.vendorId)) {
      heldVendors.add(invoice.vendorId);
      problems.push(
        `${invoice.vendorName} is now on hold (Pay: No). Remove its invoices from this run, or set Pay on the vendor back`,
      );
    }
    if (invoice.status !== "scheduled" || invoice.scheduledRunId !== run.id) {
      problems.push(`${ref} is ${AP_STATUS_LABELS[invoice.status].toLowerCase()} and no longer in this run`);
    } else if (roundCents(item.amount) > roundCents(invoice.balance)) {
      problems.push(
        `${ref} has a ${formatUsd(invoice.balance)} balance, less than the ${formatUsd(item.amount)} this run pays`,
      );
    }
  }
  for (const check of run.checks) {
    if (check.amount > MAX_CHECK_AMOUNT) {
      problems.push(`Check #${check.checkNumber} is more than the ${formatUsd(MAX_CHECK_AMOUNT)} a check can print`);
    }
  }
  return problems;
};

const runFields = (run: CheckRun): CheckRunInput => ({
  bankAccountId: run.bankAccountId,
  checkDate: run.checkDate,
  startingCheckNumber: run.startingCheckNumber,
  items: run.items,
});

export const useCheckRuns = () => {
  const queryClient = useQueryClient();
  const username = useAtomValue(userProfileAtom)?.user?.username || "you";
  const { scheduleInvoices, unscheduleInvoices, markPaid } = useApInvoices();

  const { data: runs = NO_RUNS, isLoading: runsLoading } = useQuery(checkRunsQuery);
  const { data: bankAccounts = NO_BANKS, isLoading: banksLoading } = useQuery(bankAccountsQuery);

  const sortedRuns = useMemo(() => [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [runs]);
  const pendingRuns = useMemo(() => sortedRuns.filter(isPendingRun), [sortedRuns]);

  const getRun = useCallback(
    (id: string | null | undefined) => (id ? runs.find((run) => run.id === id) : undefined),
    [runs],
  );

  const getBankAccount = useCallback(
    (id: string | null | undefined) => (id ? bankAccounts.find((bank) => bank.id === id) : undefined),
    [bankAccounts],
  );

  const nextCheckNumber = useCallback(
    (bankAccountId: string, excludeRunId?: string | null) =>
      nextCheckNumberFor(
        bankAccounts.find((bank) => bank.id === bankAccountId),
        runs,
        excludeRunId,
      ),
    [bankAccounts, runs],
  );

  const writeRun = useCallback(
    (run: CheckRun) =>
      queryClient.setQueryData(checkRunsQuery.queryKey, (current = NO_RUNS) =>
        current.some((r) => r.id === run.id) ? current.map((r) => (r.id === run.id ? run : r)) : [...current, run],
      ),
    [queryClient],
  );

  const loadRun = useCallback(
    async (id: string, allowed: CheckRunStatus[], action: string): Promise<CheckRun> => {
      const run = (await queryClient.ensureQueryData(checkRunsQuery)).find((r) => r.id === id);
      if (!run) throw new Error("Check run not found");
      if (!allowed.includes(run.status)) {
        throw new Error(`Can't ${action} a check run that is ${describeRunStatus(run.status)}`);
      }
      return run;
    },
    [queryClient],
  );

  const loadInvoicesById = useCallback(
    async () => new Map((await queryClient.ensureQueryData(apInvoicesQuery)).map((invoice) => [invoice.id, invoice])),
    [queryClient],
  );

  const loadPayFor = useCallback(async () => {
    const vendorDefaults = await queryClient.ensureQueryData(vendorDefaultsQuery);
    return (vendorId: string) => (vendorDefaults[vendorId] ?? fallbackVendorDefaults(vendorId)).pay;
  }, [queryClient]);

  /** Checks the run against the latest invoices, vendor Pay settings and check numbers in use,
   * then plans its checks. `runId` is the run being saved, so its own invoices and numbers don't
   * count as taken. */
  const prepare = useCallback(
    async (input: CheckRunInput, runId: string) => {
      const [invoices, payments, allRuns, banks, vendorDefaults] = await Promise.all([
        queryClient.ensureQueryData(apInvoicesQuery),
        queryClient.ensureQueryData(apPaymentsQuery),
        queryClient.ensureQueryData(checkRunsQuery),
        queryClient.ensureQueryData(bankAccountsQuery),
        queryClient.ensureQueryData(vendorDefaultsQuery),
      ]);
      const payFor = (vendorId: string) => (vendorDefaults[vendorId] ?? fallbackVendorDefaults(vendorId)).pay;

      const bank = banks.find((b) => b.id === input.bankAccountId);
      if (!bank) throw new Error("Choose a bank account");
      if (!ISO_DATE.test(input.checkDate)) throw new Error("Enter the check date");
      if (!Number.isInteger(input.startingCheckNumber) || input.startingCheckNumber < 1) {
        throw new Error("Starting check # must be a whole number");
      }
      if (input.startingCheckNumber <= bank.lastCheckNumber) {
        throw new Error(
          `Starting check # must be higher than #${bank.lastCheckNumber}, the last check number used on ${formatBankAccountLabel(
            bank,
          )}`,
        );
      }
      if (!input.items.length) throw new Error("Select at least one invoice to pay");

      const byId = new Map(invoices.map((invoice) => [invoice.id, invoice]));
      const held = invoicesHeldByRuns(allRuns, runId);
      const seen = new Set<string>();
      const items: CheckRunItem[] = input.items.map((item) => {
        const invoice = byId.get(item.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        const ref = `${invoice.vendorName} #${invoice.invoiceNumber}`;
        if (seen.has(invoice.id)) throw new Error(`${ref} is in this run twice`);
        seen.add(invoice.id);
        const otherRun = held.get(invoice.id);
        if (otherRun) throw new Error(`${ref} is already in the ${formatIsoDate(otherRun.checkDate)} check run`);
        const inThisRun = invoice.status === "scheduled" && invoice.scheduledRunId === runId;
        if (invoice.status !== "approved" && !inThisRun) {
          throw new Error(`${ref} is ${AP_STATUS_LABELS[invoice.status].toLowerCase()} and can't be paid`);
        }
        if (payFor(invoice.vendorId) === "No") {
          throw new Error(`${invoice.vendorName} is on hold (Pay: No). Change Pay on the vendor to release it`);
        }
        const amount = roundCents(item.amount);
        if (!(amount > 0) || amount > roundCents(invoice.balance)) {
          throw new Error(
            `Pay amount for ${ref} must be more than $0.00 and no more than its ${formatUsd(invoice.balance)} balance`,
          );
        }
        return { invoiceId: invoice.id, amount };
      });

      const checks = planChecks(items, byId, payFor, input.startingCheckNumber);
      const tooBig = checks.find((check) => check.amount > MAX_CHECK_AMOUNT);
      if (tooBig) {
        throw new Error(
          `The check to ${tooBig.vendorName} would be ${formatUsd(tooBig.amount)}, more than the ${formatUsd(
            MAX_CHECK_AMOUNT,
          )} a check can print`,
        );
      }

      const used = new Map<string, string>();
      for (const payment of payments) {
        if (payment.bankAccountId === bank.id) used.set(payment.checkNumber, "a recorded payment");
      }
      for (const run of allRuns) {
        if (run.id === runId || run.bankAccountId !== bank.id || !holdsCheckNumbers(run)) continue;
        for (const check of run.checks) used.set(check.checkNumber, `the ${formatIsoDate(run.checkDate)} check run`);
      }
      const clash = checks.find((check) => used.has(check.checkNumber));
      if (clash) {
        throw new Error(
          `Check #${clash.checkNumber} is already used by ${used.get(clash.checkNumber)}. Start at #${nextCheckNumberFor(
            bank,
            allRuns,
            runId,
          )} or later`,
        );
      }

      return {
        input: { ...input, items },
        checks,
        total: roundCents(checks.reduce((sum, check) => sum + check.amount, 0)),
      };
    },
    [queryClient],
  );

  /** Takes the run's invoices back out of scheduled, skipping any that have since left it. */
  const releaseInvoices = useCallback(
    async (run: CheckRun) => {
      const byId = await loadInvoicesById();
      const ids = run.items
        .map((item) => byId.get(item.invoiceId))
        .filter((invoice): invoice is ApInvoice => invoice?.scheduledRunId === run.id)
        .map((invoice) => invoice.id);
      if (ids.length) await unscheduleInvoices(ids);
    },
    [loadInvoicesById, unscheduleInvoices],
  );

  const blankRun = useCallback(
    (id: string, now: string): Omit<CheckRun, keyof CheckRunInput | "checks" | "total" | "status"> => ({
      id,
      submittedBy: null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedReason: null,
      rejectedBy: null,
      rejectedAt: null,
      printedBy: null,
      printedAt: null,
      printCount: 0,
      postedBy: null,
      postedAt: null,
      paymentIds: [],
      voidedBy: null,
      voidedAt: null,
      createdBy: username,
      createdAt: now,
      updatedBy: username,
      updatedAt: now,
    }),
    [username],
  );

  /** Creates a draft run, or updates `id` when it's a draft. Drafts don't schedule their invoices,
   * but they hold them so no other run picks them up. Check numbers are assigned on submit. */
  const saveDraftRun = useCallback(
    async (input: CheckRunInput, id?: string | null): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(id ? UPDATE_CHECK_RUN : CREATE_CHECK_RUN, input)
      const existing = id ? await loadRun(id, ["draft"], "edit") : null;
      const runId = existing?.id ?? newRunId();
      const plan = await prepare(input, runId);
      const now = nowIso();
      const run: CheckRun = {
        ...(existing ?? blankRun(runId, now)),
        ...plan.input,
        checks: plan.checks.map((check) => ({ ...check, checkNumber: "" })),
        total: plan.total,
        status: "draft",
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [blankRun, loadRun, prepare, username, writeRun],
  );

  /** A new run straight to awaiting approval; its invoices become scheduled for the check date. */
  const createRun = useCallback(
    async (input: CheckRunInput): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(CREATE_CHECK_RUN, { ...input, submit: true })
      const runId = newRunId();
      const plan = await prepare(input, runId);
      await scheduleInvoices(
        plan.input.items.map((item) => item.invoiceId),
        runId,
        plan.input.checkDate,
      );
      const now = nowIso();
      const run: CheckRun = {
        ...blankRun(runId, now),
        ...plan.input,
        checks: plan.checks,
        total: plan.total,
        status: "awaiting_approval",
        submittedBy: username,
        submittedAt: now,
      };
      writeRun(run);
      return run;
    },
    [blankRun, prepare, scheduleInvoices, username, writeRun],
  );

  /** Sends a draft for approval, saving `input` over it first when given. */
  const submitRun = useCallback(
    async (id: string, input?: CheckRunInput): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(SUBMIT_CHECK_RUN, { id, ...input })
      const existing = await loadRun(id, ["draft"], "submit");
      const plan = await prepare(input ?? runFields(existing), id);
      await scheduleInvoices(
        plan.input.items.map((item) => item.invoiceId),
        id,
        plan.input.checkDate,
      );
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        ...plan.input,
        checks: plan.checks,
        total: plan.total,
        status: "awaiting_approval",
        submittedBy: username,
        submittedAt: now,
        rejectedReason: null,
        rejectedBy: null,
        rejectedAt: null,
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [loadRun, prepare, scheduleInvoices, username, writeRun],
  );

  // No role check yet: anyone can approve or reject a run.
  const approveRun = useCallback(
    async (id: string): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(APPROVE_CHECK_RUN, { id })
      const existing = await loadRun(id, ["awaiting_approval"], "approve");
      const problems = checkRunProblems(existing, await loadInvoicesById(), await loadPayFor());
      if (problems.length) throw new Error(`${problems[0]}. Reject the run to fix it`);
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        status: "approved",
        approvedBy: username,
        approvedAt: now,
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [loadInvoicesById, loadPayFor, loadRun, username, writeRun],
  );

  /** Back to draft with the reason; its invoices go back to approved. */
  const rejectRun = useCallback(
    async (id: string, reason: string): Promise<CheckRun> => {
      if (!reason.trim()) throw new Error("Give a reason for rejecting this check run");
      // Mocked: no BE support yet — swap for executeGraphQL(REJECT_CHECK_RUN, { id, reason })
      const existing = await loadRun(id, ["awaiting_approval"], "reject");
      await releaseInvoices(existing);
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        checks: existing.checks.map((check) => ({ ...check, checkNumber: "" })),
        status: "draft",
        submittedBy: null,
        submittedAt: null,
        rejectedReason: reason.trim(),
        rejectedBy: username,
        rejectedAt: now,
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [loadRun, releaseInvoices, username, writeRun],
  );

  /** Cancels a run that hasn't posted (a discarded draft too); its invoices go back to approved. */
  const voidRun = useCallback(
    async (id: string): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(VOID_CHECK_RUN, { id })
      const existing = await loadRun(id, PENDING_CHECK_RUN_STATUSES, "void");
      await releaseInvoices(existing);
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        status: "void",
        voidedBy: username,
        voidedAt: now,
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [loadRun, releaseInvoices, username, writeRun],
  );

  /** Records that the user confirmed the checks printed correctly and advances the bank account's
   * last check number. Nothing is paid or posted yet. */
  const markRunPrinted = useCallback(
    async (id: string): Promise<CheckRun> => {
      // Mocked: no BE support yet — swap for executeGraphQL(MARK_CHECK_RUN_PRINTED, { id })
      const existing = await loadRun(id, ["approved"], "print");
      const problems = checkRunProblems(existing, await loadInvoicesById(), await loadPayFor());
      if (problems.length) throw new Error(`${problems[0]}. Void the run and start a new one`);
      await queryClient.ensureQueryData(bankAccountsQuery);
      const highest = Math.max(0, ...existing.checks.map((check) => Number(check.checkNumber) || 0));
      queryClient.setQueryData(bankAccountsQuery.queryKey, (current = NO_BANKS) =>
        current.map((bank) =>
          bank.id === existing.bankAccountId
            ? { ...bank, lastCheckNumber: Math.max(bank.lastCheckNumber, highest) }
            : bank,
        ),
      );
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        printedBy: username,
        printedAt: now,
        printCount: existing.printCount + 1,
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return run;
    },
    [loadInvoicesById, loadPayFor, loadRun, queryClient, username, writeRun],
  );

  /** Once the user confirms the checks printed correctly: records one payment per check (which
   * marks the invoices paid and posts to the G/L) and closes the run. */
  const postRun = useCallback(
    async (id: string): Promise<{ run: CheckRun; payments: ApPayment[] }> => {
      // Mocked: no BE support yet — swap for executeGraphQL(POST_CHECK_RUN, { id })
      const existing = await loadRun(id, ["approved"], "post");
      if (!existing.printedAt) throw new Error("Print the checks before posting the run");
      const problems = checkRunProblems(existing, await loadInvoicesById(), await loadPayFor());
      if (problems.length) throw new Error(`${problems[0]}. Void the run and start a new one`);
      const payments = await markPaid(
        existing.checks.flatMap((check) =>
          check.items.map((item) => ({
            invoiceId: item.invoiceId,
            checkNumber: check.checkNumber,
            amount: item.amount,
            checkDate: existing.checkDate,
            bankAccountId: existing.bankAccountId,
            runId: existing.id,
          })),
        ),
      );
      const now = nowIso();
      const run: CheckRun = {
        ...existing,
        status: "posted",
        postedBy: username,
        postedAt: now,
        paymentIds: payments.map((payment) => payment.id),
        updatedBy: username,
        updatedAt: now,
      };
      writeRun(run);
      return { run, payments };
    },
    [loadInvoicesById, loadPayFor, loadRun, markPaid, username, writeRun],
  );

  return {
    runs: sortedRuns,
    pendingRuns,
    bankAccounts,
    loading: runsLoading || banksLoading,
    getRun,
    getBankAccount,
    nextCheckNumber,
    saveDraftRun,
    createRun,
    submitRun,
    approveRun,
    rejectRun,
    voidRun,
    markRunPrinted,
    postRun,
  };
};
