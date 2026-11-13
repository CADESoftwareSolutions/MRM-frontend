import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import { MOCK_AP_INVOICES, MOCK_AP_PAYMENTS } from "../mocks/apInvoices";
import {
  AP_EDITABLE_STATUSES,
  AP_OPEN_STATUSES,
  AP_STATUS_LABELS,
  ApAgingSummary,
  ApDuplicateCandidate,
  ApDuplicateDecision,
  ApDuplicateMatch,
  ApDuplicateRules,
  ApInvoice,
  ApInvoiceDraftInput,
  ApInvoiceStatus,
  ApPayment,
  ApPaymentInput,
  ApVendorHistoryRow,
  ApVendorSummary,
  DuplicateValidation,
  daysBetweenIso,
  hasUnreviewedDuplicates,
  roundCents,
  todayIso,
} from "../types/apInvoices";
import { bumpTransactionCounts } from "./useChartOfAccounts";
import { duplicateRulesFor, fallbackVendorDefaults, vendorDefaultsQuery } from "./useVendorDefaults";

// gcTime is Infinity only while this is mocked: the cache is the only copy of the session's
// edits, so it must outlive every screen that reads it.
export const apInvoicesQuery = queryOptions({
  queryKey: ["apInvoices"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_AP_INVOICES)
  queryFn: async (): Promise<ApInvoice[]> => structuredClone(MOCK_AP_INVOICES),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const apPaymentsQuery = queryOptions({
  queryKey: ["apPayments"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_AP_PAYMENTS)
  queryFn: async (): Promise<ApPayment[]> => structuredClone(MOCK_AP_PAYMENTS),
  staleTime: Infinity,
  gcTime: Infinity,
});

const NO_INVOICES: ApInvoice[] = [];
const NO_PAYMENTS: ApPayment[] = [];

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const nowIso = () => new Date().toISOString();

const normalizeInvoiceNumber = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");

const isOpen = (invoice: ApInvoice) => AP_OPEN_STATUSES.includes(invoice.status) && invoice.balance > 0;

const JOURNAL_ID = /^JE-(\d{2})-(\d+)$/;

/** Hands out JE-YY-nnnnn ids after the highest one already used this year by an invoice or a
 * payment. The real BE will own this sequence. */
const journalIdSequence = (invoices: ApInvoice[], payments: ApPayment[]) => {
  const year = todayIso().slice(2, 4);
  let last = 0;
  for (const journalId of [...invoices.map((i) => i.journalId), ...payments.map((p) => p.journalId)]) {
    const match = journalId?.match(JOURNAL_ID);
    if (match && match[1] === year) last = Math.max(last, Number(match[2]));
  }
  return () => `JE-${year}-${String(++last).padStart(5, "0")}`;
};

/** Same vendor and same invoice #, or same vendor and same amount within the window — both
 * rules always run; validateBy only decides which one is reported first. Skips the candidate
 * itself and voided invoices. */
export const findApDuplicates = (
  invoices: ApInvoice[],
  candidate: ApDuplicateCandidate,
  rules: ApDuplicateRules,
): ApDuplicateMatch[] => {
  const invoiceNumber = normalizeInvoiceNumber(candidate.invoiceNumber || "");
  const amount = roundCents(Number(candidate.invoiceAmount) || 0);
  const order: DuplicateValidation[] =
    rules.validateBy === "Invoice Amount" ? ["Invoice Amount", "Invoice #"] : ["Invoice #", "Invoice Amount"];

  return invoices.flatMap((other) => {
    if (other.id === candidate.id || other.vendorId !== candidate.vendorId || other.status === "void") return [];
    const hits = new Set<DuplicateValidation>();
    if (invoiceNumber && normalizeInvoiceNumber(other.invoiceNumber) === invoiceNumber) hits.add("Invoice #");
    const apart = daysBetweenIso(other.invoiceDate, candidate.invoiceDate);
    if (amount > 0 && roundCents(other.invoiceAmount) === amount && apart !== null && Math.abs(apart) <= rules.windowDays) {
      hits.add("Invoice Amount");
    }
    return hits.size ? [{ ...other, matchedBy: order.filter((rule) => hits.has(rule)) }] : [];
  });
};

/** Unpaid balances of posted invoices, bucketed by days past due as of `asOf`. */
export const computeApAging = (invoices: ApInvoice[], asOf: string = todayIso()): ApAgingSummary => {
  const aging: ApAgingSummary = { open: 0, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
  for (const invoice of invoices) {
    if (!isOpen(invoice)) continue;
    const late = daysBetweenIso(invoice.dueDate, asOf);
    if (late === null) continue;
    const bucket: keyof ApAgingSummary =
      late <= 0 ? "current" : late <= 30 ? "d1_30" : late <= 60 ? "d31_60" : late <= 90 ? "d61_90" : "d90plus";
    aging[bucket] = roundCents(aging[bucket] + invoice.balance);
    aging.open = roundCents(aging.open + invoice.balance);
  }
  return aging;
};

/** A vendor's invoices and payments in one list, newest first (an invoice sorts above a
 * payment on the same day). */
export const buildApVendorHistory = (
  invoices: ApInvoice[],
  payments: ApPayment[],
  vendorId: string,
): ApVendorHistoryRow[] => {
  const rows: ApVendorHistoryRow[] = [
    ...invoices
      .filter((invoice) => invoice.vendorId === vendorId)
      .map((invoice) => ({
        id: invoice.id,
        kind: "invoice" as const,
        date: invoice.invoiceDate,
        ref: invoice.invoiceNumber,
        journalId: invoice.journalId,
        glPeriod: invoice.glPeriod,
        amount: invoice.invoiceAmount,
        invoice,
        payment: null,
      })),
    ...payments
      .filter((payment) => payment.vendorId === vendorId)
      .map((payment) => ({
        id: payment.id,
        kind: "payment" as const,
        date: payment.checkDate,
        ref: `Ck #${payment.checkNumber}`,
        journalId: payment.journalId,
        glPeriod: payment.checkDate.slice(0, 7),
        amount: -payment.amount,
        invoice: null,
        payment,
      })),
  ];
  rows.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (a.kind === b.kind ? 0 : a.kind === "invoice" ? -1 : 1) ||
      (b.invoice?.createdAt ?? "").localeCompare(a.invoice?.createdAt ?? ""),
  );
  return rows;
};

export const computeApVendorSummary = (
  invoices: ApInvoice[],
  payments: ApPayment[],
  vendorId: string,
  asOf: string = todayIso(),
): ApVendorSummary => {
  const year = asOf.slice(0, 4);
  const vendorInvoices = invoices.filter((invoice) => invoice.vendorId === vendorId);
  const vendorPayments = payments.filter((payment) => payment.vendorId === vendorId && payment.status !== "void");
  const open = vendorInvoices.filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const byId = new Map(vendorInvoices.map((invoice) => [invoice.id, invoice]));

  const lastCheckDate = new Map<string, string>();
  for (const payment of vendorPayments) {
    for (const invoiceId of payment.invoiceIds) {
      const seen = lastCheckDate.get(invoiceId);
      if (!seen || payment.checkDate > seen) lastCheckDate.set(invoiceId, payment.checkDate);
    }
  }
  const payDays = Array.from(lastCheckDate).flatMap(([invoiceId, checkDate]) => {
    const invoice = byId.get(invoiceId);
    const days = invoice?.status === "paid" ? daysBetweenIso(invoice.invoiceDate, checkDate) : null;
    return days === null ? [] : [days];
  });

  const lastPayment =
    [...vendorPayments].sort((a, b) => b.checkDate.localeCompare(a.checkDate))[0] ?? null;

  return {
    invoicesThisYear: vendorInvoices.filter(
      (i) => !["draft", "needs_review", "void"].includes(i.status) && i.invoiceDate.startsWith(year),
    ).length,
    paidThisYear: roundCents(
      vendorPayments.filter((p) => p.checkDate.startsWith(year)).reduce((sum, p) => sum + p.amount, 0),
    ),
    openCount: open.length,
    openBalance: roundCents(open.reduce((sum, invoice) => sum + invoice.balance, 0)),
    nextDue: open[0] ? { invoiceId: open[0].id, dueDate: open[0].dueDate, amount: open[0].balance } : null,
    lastPayment,
    avgDaysToPay: payDays.length ? Math.round(payDays.reduce((sum, d) => sum + d, 0) / payDays.length) : null,
  };
};

const postedAccountIds = (invoice: ApInvoice) => [invoice.apAccountId, ...invoice.lines.map((line) => line.accountId)];

const describeStatus = (status: ApInvoiceStatus) => AP_STATUS_LABELS[status].toLowerCase();

export const useApInvoices = () => {
  const queryClient = useQueryClient();
  const username = useAtomValue(userProfileAtom)?.user?.username || "you";

  const { data: invoices = NO_INVOICES, isLoading: invoicesLoading } = useQuery(apInvoicesQuery);
  const { data: payments = NO_PAYMENTS, isLoading: paymentsLoading } = useQuery(apPaymentsQuery);

  const getInvoice = useCallback((id: string) => invoices.find((invoice) => invoice.id === id), [invoices]);

  // Everything after an await re-reads the cache synchronously, so two callers in flight at once
  // can't both build on the same snapshot (and hand out the same id).
  const readInvoices = useCallback(
    () => queryClient.getQueryData(apInvoicesQuery.queryKey) ?? NO_INVOICES,
    [queryClient],
  );
  const readPayments = useCallback(
    () => queryClient.getQueryData(apPaymentsQuery.queryKey) ?? NO_PAYMENTS,
    [queryClient],
  );

  const writeInvoices = useCallback(
    (updated: ApInvoice[]) => {
      const byId = new Map(updated.map((invoice) => [invoice.id, invoice]));
      queryClient.setQueryData(apInvoicesQuery.queryKey, (current = NO_INVOICES) => {
        const existing = new Set(current.map((invoice) => invoice.id));
        return [
          ...current.map((invoice) => byId.get(invoice.id) ?? invoice),
          ...updated.filter((invoice) => !existing.has(invoice.id)),
        ];
      });
    },
    [queryClient],
  );

  /** Loads the invoice, checks it's in one of `allowed`, applies `change` and stamps who/when. */
  const transition = useCallback(
    async (
      id: string,
      allowed: ApInvoiceStatus[],
      action: string,
      change: (invoice: ApInvoice, all: ApInvoice[]) => Partial<ApInvoice>,
    ): Promise<ApInvoice> => {
      await queryClient.ensureQueryData(apInvoicesQuery);
      const all = readInvoices();
      const invoice = all.find((i) => i.id === id);
      if (!invoice) throw new Error("Invoice not found");
      if (!allowed.includes(invoice.status)) {
        throw new Error(`Can't ${action} an invoice that is ${describeStatus(invoice.status)}`);
      }
      const updated: ApInvoice = { ...invoice, ...change(invoice, all), updatedBy: username, updatedAt: nowIso() };
      writeInvoices([updated]);
      return updated;
    },
    [queryClient, readInvoices, username, writeInvoices],
  );

  const rulesForVendor = useCallback(
    async (vendorId: string): Promise<ApDuplicateRules> => {
      const stored = (await queryClient.ensureQueryData(vendorDefaultsQuery))[vendorId];
      return duplicateRulesFor(stored ?? fallbackVendorDefaults(vendorId));
    },
    [queryClient],
  );

  /** Creates or updates a draft. Runs the duplicate check with the vendor's rules (or `rules`):
   * a match flags it needs_review unless someone already marked it not a duplicate. Editing an
   * invoice that's awaiting approval pulls it back to draft so it has to be resubmitted. */
  const saveDraft = useCallback(
    async (input: ApInvoiceDraftInput, rules?: ApDuplicateRules): Promise<ApInvoice> => {
      // Mocked: no BE support yet — swap for executeGraphQL(input.id ? UPDATE_AP_INVOICE : CREATE_AP_INVOICE, ...)
      await queryClient.ensureQueryData(apInvoicesQuery);
      const effectiveRules = rules ?? (await rulesForVendor(input.vendorId));
      const all = readInvoices();
      const existing = input.id ? all.find((invoice) => invoice.id === input.id) : undefined;
      if (input.id && !existing) throw new Error("Invoice not found");
      if (existing && !AP_EDITABLE_STATUSES.includes(existing.status)) {
        throw new Error(`An invoice that is ${describeStatus(existing.status)} can't be edited`);
      }

      const id = existing?.id ?? newId("ap-inv");
      const { lines, ...fields } = input;
      const matches = findApDuplicates(all, { ...fields, id }, effectiveRules);
      const unchanged =
        !!existing &&
        existing.vendorId === fields.vendorId &&
        normalizeInvoiceNumber(existing.invoiceNumber) === normalizeInvoiceNumber(fields.invoiceNumber) &&
        roundCents(existing.invoiceAmount) === roundCents(fields.invoiceAmount) &&
        existing.invoiceDate === fields.invoiceDate;
      const review = unchanged ? existing.duplicateReview : null;
      const now = nowIso();

      const saved: ApInvoice = {
        journalId: null,
        scheduledRunId: null,
        scheduledPayDate: null,
        paidCheckNumber: null,
        approvedBy: null,
        approvedAt: null,
        rejectedReason: null,
        createdBy: username,
        createdAt: now,
        ...existing,
        ...fields,
        id,
        duplicateReview: review,
        lines: lines.map((line) => ({ ...line, id: line.id ?? newId("ap-line") })),
        invoiceAmount: roundCents(fields.invoiceAmount),
        balance: roundCents(fields.invoiceAmount),
        status: hasUnreviewedDuplicates(review, matches) ? "needs_review" : "draft",
        updatedBy: username,
        updatedAt: now,
      };
      writeInvoices([saved]);
      return saved;
    },
    [queryClient, readInvoices, rulesForVendor, username, writeInvoices],
  );

  const submitForApproval = useCallback(
    async (id: string) => {
      // Mocked: no BE support yet — swap for executeGraphQL(SUBMIT_AP_INVOICE, { id })
      await queryClient.ensureQueryData(apInvoicesQuery);
      const invoice = readInvoices().find((i) => i.id === id);
      if (invoice?.status === "needs_review") {
        throw new Error("Resolve the possible duplicate before submitting this invoice");
      }
      return transition(id, ["draft"], "submit", (current) => {
        if (!current.vendorId) throw new Error("Choose a vendor");
        if (!current.invoiceNumber.trim()) throw new Error("Enter the invoice #");
        if (!(current.invoiceAmount > 0)) throw new Error("Invoice amount must be more than zero");
        if (daysBetweenIso(current.invoiceDate, current.invoiceDate) === null) throw new Error("Enter the invoice date");
        if (daysBetweenIso(current.dueDate, current.dueDate) === null) throw new Error("Enter the due date");
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(current.glPeriod)) throw new Error("Choose the G/L period");
        if (!current.apAccountId) throw new Error("Choose the A/P account");
        if (!current.lines.length) throw new Error("Add at least one coding line");
        if (current.lines.some((line) => !line.accountId)) throw new Error("Every coding line needs an account");
        const distributed = roundCents(current.lines.reduce((sum, line) => sum + line.amount, 0));
        if (distributed !== roundCents(current.invoiceAmount)) {
          throw new Error("Coding lines must add up to the invoice amount");
        }
        return { status: "awaiting_approval", rejectedReason: null };
      });
    },
    [queryClient, readInvoices, transition],
  );

  const approveInvoice = useCallback(
    async (id: string) => {
      // Mocked: no BE support yet — swap for executeGraphQL(APPROVE_AP_INVOICE, { id })
      await queryClient.ensureQueryData(apPaymentsQuery);
      const approved = await transition(id, ["awaiting_approval"], "approve", (invoice, all) => ({
        status: "approved",
        journalId: invoice.journalId ?? journalIdSequence(all, readPayments())(),
        balance: invoice.invoiceAmount,
        approvedBy: username,
        approvedAt: nowIso(),
        rejectedReason: null,
      }));
      await bumpTransactionCounts(queryClient, postedAccountIds(approved), 1);
      return approved;
    },
    [queryClient, readPayments, transition, username],
  );

  const rejectInvoice = useCallback(
    async (id: string, reason: string) => {
      if (!reason.trim()) throw new Error("Give a reason for rejecting this invoice");
      // Mocked: no BE support yet — swap for executeGraphQL(REJECT_AP_INVOICE, { id, reason })
      return transition(id, ["awaiting_approval"], "reject", () => ({
        status: "draft",
        rejectedReason: reason.trim(),
      }));
    },
    [transition],
  );

  const voidInvoice = useCallback(
    async (id: string) => {
      // Mocked: no BE support yet — swap for executeGraphQL(VOID_AP_INVOICE, { id })
      await queryClient.ensureQueryData(apPaymentsQuery);
      let wasPosted = false;
      const voided = await transition(
        id,
        ["draft", "needs_review", "awaiting_approval", "approved", "scheduled"],
        "void",
        (invoice) => {
          const paid = readPayments().some(
            (payment) =>
              payment.status !== "void" && payment.applications.some((application) => application.invoiceId === id),
          );
          if (paid || roundCents(invoice.balance) !== roundCents(invoice.invoiceAmount)) {
            throw new Error("Can't void an invoice that has payments applied to it");
          }
          wasPosted = !!invoice.journalId;
          return { status: "void", balance: 0, scheduledRunId: null, scheduledPayDate: null };
        },
      );
      if (wasPosted) await bumpTransactionCounts(queryClient, postedAccountIds(voided), -1);
      return voided;
    },
    [queryClient, readPayments, transition],
  );

  const resolveDuplicate = useCallback(
    // Mocked: no BE support yet — swap for executeGraphQL(RESOLVE_AP_DUPLICATE, { id, decision, reason })
    async (id: string, decision: ApDuplicateDecision, reason: string, rules?: ApDuplicateRules) => {
      await queryClient.ensureQueryData(apInvoicesQuery);
      const current = readInvoices().find((invoice) => invoice.id === id);
      const effectiveRules = rules ?? (await rulesForVendor(current?.vendorId ?? ""));
      return transition(id, ["needs_review"], "resolve the duplicate on", (invoice, all) => ({
        status: decision === "discarded" ? "void" : "draft",
        ...(decision === "discarded" ? { balance: 0 } : {}),
        duplicateReview: {
          decision,
          reason: reason.trim(),
          by: username,
          at: nowIso(),
          clearedMatchIds: findApDuplicates(all, invoice, effectiveRules).map((match) => match.id),
        },
      }));
    },
    [queryClient, readInvoices, rulesForVendor, transition, username],
  );

  const findDuplicates = useCallback(
    (draft: ApDuplicateCandidate, rules: ApDuplicateRules) => findApDuplicates(invoices, draft, rules),
    [invoices],
  );

  const vendorHistory = useCallback(
    (vendorId: string) => buildApVendorHistory(invoices, payments, vendorId),
    [invoices, payments],
  );

  const vendorSummary = useCallback(
    (vendorId: string) => computeApVendorSummary(invoices, payments, vendorId),
    [invoices, payments],
  );

  const agingSummary = useMemo(() => computeApAging(invoices), [invoices]);

  const scheduleInvoices = useCallback(
    async (ids: string[], runId: string, payDate: string): Promise<ApInvoice[]> => {
      // Mocked: no BE support yet — swap for executeGraphQL(SCHEDULE_AP_INVOICES, { ids, runId, payDate })
      await queryClient.ensureQueryData(apInvoicesQuery);
      const vendorDefaults = await queryClient.ensureQueryData(vendorDefaultsQuery);
      const all = readInvoices();
      const targets = ids.map((id) => all.find((invoice) => invoice.id === id));
      const blocked = targets.filter(
        (invoice) =>
          !invoice ||
          !(invoice.status === "approved" || (invoice.status === "scheduled" && invoice.scheduledRunId === runId)) ||
          !(invoice.balance > 0) ||
          (vendorDefaults[invoice.vendorId] ?? fallbackVendorDefaults(invoice.vendorId)).pay === "No",
      );
      if (blocked.length) {
        const refs = blocked.map((invoice) => invoice?.invoiceNumber ?? "unknown invoice").join(", ");
        throw new Error(`Only approved invoices with a balance, from vendors that are paid, can be scheduled (${refs})`);
      }
      const now = nowIso();
      const updated = (targets as ApInvoice[]).map((invoice) => ({
        ...invoice,
        status: "scheduled" as const,
        scheduledRunId: runId,
        scheduledPayDate: payDate,
        updatedBy: username,
        updatedAt: now,
      }));
      writeInvoices(updated);
      return updated;
    },
    [queryClient, readInvoices, username, writeInvoices],
  );

  const unscheduleInvoices = useCallback(
    async (ids: string[]): Promise<ApInvoice[]> => {
      // Mocked: no BE support yet — swap for executeGraphQL(UNSCHEDULE_AP_INVOICES, { ids })
      await queryClient.ensureQueryData(apInvoicesQuery);
      const now = nowIso();
      const updated = readInvoices()
        .filter((invoice) => ids.includes(invoice.id) && invoice.status === "scheduled")
        .map((invoice) => ({
          ...invoice,
          status: "approved" as const,
          scheduledRunId: null,
          scheduledPayDate: null,
          updatedBy: username,
          updatedAt: now,
        }));
      writeInvoices(updated);
      return updated;
    },
    [queryClient, readInvoices, username, writeInvoices],
  );

  /** Records one ApPayment per check number (several invoices can share a check), reduces each
   * invoice's balance, and marks it paid at zero. A partial payment leaves it approved and takes
   * it out of its run. */
  const markPaid = useCallback(
    async (lines: ApPaymentInput[]): Promise<ApPayment[]> => {
      // Mocked: no BE support yet — swap for executeGraphQL(RECORD_AP_PAYMENTS, { payments: lines })
      await Promise.all([queryClient.ensureQueryData(apInvoicesQuery), queryClient.ensureQueryData(apPaymentsQuery)]);
      const all = readInvoices();
      const nextJournalId = journalIdSequence(all, readPayments());
      const byId = new Map(all.map((invoice) => [invoice.id, invoice]));
      const checks = new Map<string, ApPayment>();

      for (const line of lines) {
        const invoice = byId.get(line.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        const original = all.find((i) => i.id === line.invoiceId);
        if (original?.status !== "scheduled" || original.scheduledRunId !== line.runId) {
          throw new Error(`Invoice ${invoice.invoiceNumber} isn't scheduled in this check run and can't be paid`);
        }
        if (!AP_OPEN_STATUSES.includes(invoice.status)) {
          throw new Error(`Invoice ${invoice.invoiceNumber} is ${describeStatus(invoice.status)} and can't be paid`);
        }
        const amount = roundCents(line.amount);
        if (!(amount > 0) || amount > roundCents(invoice.balance)) {
          throw new Error(`Pay amount for ${invoice.invoiceNumber} must be between 0 and its balance`);
        }
        let check = checks.get(line.checkNumber);
        if (check && check.vendorId !== invoice.vendorId) {
          throw new Error(`Check #${line.checkNumber} can't pay more than one vendor`);
        }
        if (check && check.bankAccountId !== line.bankAccountId) {
          throw new Error(`Check #${line.checkNumber} can't be drawn on more than one bank account`);
        }
        if (!check) {
          check = {
            id: newId("ap-pay"),
            vendorId: invoice.vendorId,
            checkNumber: line.checkNumber,
            checkDate: line.checkDate,
            amount: 0,
            bankAccountId: line.bankAccountId,
            journalId: nextJournalId(),
            status: "outstanding",
            invoiceIds: [],
            applications: [],
          };
          checks.set(line.checkNumber, check);
        }
        check.amount = roundCents(check.amount + amount);
        if (!check.invoiceIds.includes(invoice.id)) check.invoiceIds.push(invoice.id);
        check.applications.push({ invoiceId: invoice.id, amount });

        const balance = roundCents(invoice.balance - amount);
        byId.set(invoice.id, {
          ...invoice,
          balance,
          status: balance <= 0 ? "paid" : "approved",
          scheduledRunId: balance <= 0 ? invoice.scheduledRunId : null,
          scheduledPayDate: balance <= 0 ? invoice.scheduledPayDate : null,
          paidCheckNumber: balance <= 0 ? line.checkNumber : invoice.paidCheckNumber,
          updatedBy: username,
          updatedAt: nowIso(),
        });
      }

      const created = Array.from(checks.values());
      writeInvoices(lines.map((line) => byId.get(line.invoiceId)!));
      queryClient.setQueryData(apPaymentsQuery.queryKey, (current = NO_PAYMENTS) => [...current, ...created]);
      return created;
    },
    [queryClient, readInvoices, readPayments, username, writeInvoices],
  );

  return {
    invoices,
    payments,
    loading: invoicesLoading || paymentsLoading,
    getInvoice,
    saveDraft,
    submitForApproval,
    approveInvoice,
    rejectInvoice,
    voidInvoice,
    resolveDuplicate,
    findDuplicates,
    vendorHistory,
    vendorSummary,
    agingSummary,
    scheduleInvoices,
    unscheduleInvoices,
    markPaid,
  };
};
