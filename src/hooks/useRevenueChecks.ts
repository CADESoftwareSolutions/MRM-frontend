import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import { MOCK_REVENUE_CHECKS } from "../mocks/revenue";
import { bumpTransactionCounts, chartOfAccountsQuery } from "./useChartOfAccounts";
import { taxDeductTypesQuery } from "./useTaxDeductTypes";
import {
  DEFAULT_DEPOSIT_ACCOUNT_ID,
  MAX_DEDUCTS,
  MAX_TAXES,
  RevenueCheck,
  RevenueCheckInput,
  RevenueLine,
  RevenueLineInput,
  checkAccountIds,
  glPeriodForDate,
  newRevenueId,
  postBlockers,
  propertyKey,
  stampCheckAccounts,
} from "../types/revenue";

const EMPTY: RevenueCheck[] = [];

/** Thrown by postCheck; `blockers` is what postBlockers returned. */
export class PostBlockedError extends Error {
  blockers: string[];

  constructor(checkNumber: string, blockers: string[]) {
    super(`Check #${checkNumber} can't be posted yet: ${blockers.join(" ")}`);
    this.name = "PostBlockedError";
    this.blockers = blockers;
  }
}

// gcTime is Infinity only while this is mocked: the cache is the only copy of the session's edits.
export const revenueChecksQuery = queryOptions({
  queryKey: ["revenueChecks"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_REVENUE_CHECKS)
  queryFn: async (): Promise<RevenueCheck[]> => structuredClone(MOCK_REVENUE_CHECKS),
  staleTime: Infinity,
  gcTime: Infinity,
});

const toLine = (input: RevenueLineInput): RevenueLine => {
  if (input.taxes.length > MAX_TAXES) throw new Error(`A line can carry at most ${MAX_TAXES} taxes`);
  if (input.deducts.length > MAX_DEDUCTS) throw new Error(`A line can carry at most ${MAX_DEDUCTS} deducts`);
  return { ...input, id: input.id || newRevenueId("rl"), incomeAccountId: input.incomeAccountId ?? null };
};

const findOrThrow = (all: RevenueCheck[], id: string) => {
  const found = all.find((c) => c.id === id);
  if (!found) throw new Error("Check not found");
  return found;
};

const assertDraft = (check: RevenueCheck) => {
  if (check.status === "posted") throw new Error(`Check #${check.checkNumber} is already posted`);
  if (check.status === "void") throw new Error(`Check #${check.checkNumber} is void`);
};

export const useRevenueChecks = () => {
  const queryClient = useQueryClient();
  const profile = useAtomValue(userProfileAtom);
  const currentUser = profile?.user?.username || "you";

  const { data = EMPTY, isLoading } = useQuery(revenueChecksQuery);

  const getCheck = useCallback((id: string | null | undefined) => (id ? data.find((c) => c.id === id) : undefined), [data]);

  const readAll = useCallback(() => queryClient.ensureQueryData(revenueChecksQuery), [queryClient]);

  const writeAll = useCallback(
    (next: RevenueCheck[]) => queryClient.setQueryData(revenueChecksQuery.queryKey, next),
    [queryClient],
  );

  const buildCheck = useCallback(
    (input: RevenueCheckInput, existing: RevenueCheck | undefined, now: string): RevenueCheck => {
      const { lines, ...fields } = input;
      const defined = Object.fromEntries(
        Object.entries(fields).filter(([key, value]) => key !== "id" && value !== undefined),
      ) as Partial<RevenueCheck>;
      const base: RevenueCheck = existing ?? {
        id: newRevenueId("rc"),
        operatorId: null,
        operatorName: "",
        ownerId: null,
        ownerName: "",
        ownerNumber: "",
        checkNumber: "",
        checkDate: input.checkDate,
        checkAmount: 0,
        depositAccountId: DEFAULT_DEPOSIT_ACCOUNT_ID,
        depositDate: null,
        glPeriod: glPeriodForDate(input.checkDate),
        status: "draft",
        stubFileName: null,
        lines: [],
        postedBy: null,
        postedAt: null,
        voidedBy: null,
        voidedAt: null,
        voidReason: null,
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now,
      };
      return {
        ...base,
        ...defined,
        glPeriod: defined.glPeriod || base.glPeriod || glPeriodForDate(input.checkDate),
        depositAccountId: defined.depositAccountId || base.depositAccountId,
        lines: lines.map(toLine),
        updatedBy: currentUser,
        updatedAt: now,
      };
    },
    [currentUser],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(id ? UPDATE_REVENUE_CHECK : CREATE_REVENUE_CHECK, input)
  const saveDraft = useCallback(
    async (input: RevenueCheckInput): Promise<RevenueCheck> => {
      const all = await readAll();
      const existing = input.id ? findOrThrow(all, input.id) : undefined;
      if (existing) assertDraft(existing);
      const saved = buildCheck(input, existing, new Date().toISOString());
      const source = saved.reenteredFromId ? all.find((c) => c.id === saved.reenteredFromId) : undefined;
      if (source?.reenteredAsId && source.reenteredAsId !== saved.id && all.some((c) => c.id === source.reenteredAsId)) {
        throw new Error(`Check #${source.checkNumber} was already re-entered as a new draft`);
      }
      const next = existing ? all.map((c) => (c.id === saved.id ? saved : c)) : [...all, saved];
      writeAll(
        source && source.reenteredAsId !== saved.id
          ? next.map((c) => (c.id === source.id ? { ...c, reenteredAsId: saved.id } : c))
          : next,
      );
      return saved;
    },
    [readAll, writeAll, buildCheck],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(POST_REVENUE_CHECK, { id })
  const postCheck = useCallback(
    async (id: string): Promise<RevenueCheck> => {
      const [all, types, accounts] = await Promise.all([
        readAll(),
        queryClient.ensureQueryData(taxDeductTypesQuery),
        queryClient.ensureQueryData(chartOfAccountsQuery),
      ]);
      const check = findOrThrow(all, id);
      assertDraft(check);
      const blockers = postBlockers(check, types, accounts);
      if (blockers.length) throw new PostBlockedError(check.checkNumber, blockers);
      const now = new Date().toISOString();
      const posted: RevenueCheck = {
        ...stampCheckAccounts(check, types),
        status: "posted",
        postedBy: currentUser,
        postedAt: now,
        updatedBy: currentUser,
        updatedAt: now,
      };
      writeAll(all.map((c) => (c.id === id ? posted : c)));
      await bumpTransactionCounts(queryClient, checkAccountIds(posted, types), 1);
      return posted;
    },
    [readAll, writeAll, queryClient, currentUser],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(DELETE_REVENUE_CHECK, { id })
  const deleteCheck = useCallback(
    async (id: string): Promise<void> => {
      const all = await readAll();
      const check = findOrThrow(all, id);
      if (check.status === "posted") throw new Error("Posted checks can't be deleted. Void the check instead.");
      if (check.status === "void") throw new Error("Void checks are kept for history and can't be deleted");
      writeAll(
        all
          .filter((c) => c.id !== id)
          .map((c) => (c.id === check.reenteredFromId && c.reenteredAsId === id ? { ...c, reenteredAsId: null } : c)),
      );
    },
    [readAll, writeAll],
  );

  // Voiding reverses the posting but keeps the check, so its history (and who posted it) stays on file.
  // Mocked: no BE support yet — swap for executeGraphQL(VOID_REVENUE_CHECK, { id, reason })
  const voidCheck = useCallback(
    async (id: string, reason: string): Promise<RevenueCheck> => {
      const trimmed = reason.trim();
      if (!trimmed) throw new Error("Enter a reason for voiding the check");
      const [all, types] = await Promise.all([readAll(), queryClient.ensureQueryData(taxDeductTypesQuery)]);
      const check = findOrThrow(all, id);
      if (check.status === "void") throw new Error(`Check #${check.checkNumber} is already void`);
      if (check.status !== "posted") throw new Error("Only posted checks can be voided. Delete a draft instead.");
      const now = new Date().toISOString();
      const voided: RevenueCheck = {
        ...check,
        status: "void",
        voidedBy: currentUser,
        voidedAt: now,
        voidReason: trimmed,
        updatedBy: currentUser,
        updatedAt: now,
      };
      writeAll(all.map((c) => (c.id === id ? voided : c)));
      await bumpTransactionCounts(queryClient, checkAccountIds(check, types), -1);
      return voided;
    },
    [readAll, writeAll, queryClient, currentUser],
  );

  // Imports never post: every check comes in as a draft for someone to review and post.
  // Mocked: no BE support yet — swap for executeGraphQL(IMPORT_REVENUE_CHECKS, { checks: drafts })
  const importChecks = useCallback(
    async (drafts: RevenueCheckInput[]): Promise<string[]> => {
      const all = await readAll();
      const now = new Date().toISOString();
      const created = drafts.map((draft) => buildCheck({ ...draft, id: null }, undefined, now));
      writeAll([...all, ...created]);
      return created.map((c) => c.id);
    },
    [readAll, writeAll, buildCheck],
  );

  // Links (or with nulls, unlinks) every line in the property group, i.e. with this propertyKey.
  // Mocked: no BE support yet — swap for executeGraphQL(LINK_REVENUE_PROPERTY_WELL, { checkId, operatorCc, wellId })
  const linkWell = useCallback(
    async (checkId: string, operatorCc: string, wellId: string | null, wellLabel: string | null): Promise<RevenueCheck> => {
      const all = await readAll();
      const check = findOrThrow(all, checkId);
      assertDraft(check);
      const key = operatorCc.trim();
      const now = new Date().toISOString();
      const updated: RevenueCheck = {
        ...check,
        lines: check.lines.map((line) => (propertyKey(line) === key ? { ...line, wellId, wellLabel } : line)),
        updatedBy: currentUser,
        updatedAt: now,
      };
      writeAll(all.map((c) => (c.id === checkId ? updated : c)));
      return updated;
    },
    [readAll, writeAll, currentUser],
  );

  return {
    checks: data,
    loading: isLoading,
    getCheck,
    saveDraft,
    postCheck,
    deleteCheck,
    voidCheck,
    importChecks,
    linkWell,
  };
};
