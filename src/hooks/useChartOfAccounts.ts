import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { QueryClient, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import { MOCK_CHART_OF_ACCOUNTS } from "../mocks/chartOfAccounts";
import { taxDeductTypesQuery } from "./useTaxDeductTypes";
import {
  ChartAccount,
  ChartAccountInput,
  ChartAccountPatch,
  compareAccounts,
  formatAccountNumber,
  isSameAccountNumber,
} from "../types/chartOfAccounts";

const EMPTY: ChartAccount[] = [];

// Every screen that reads accounts shares this one cache entry. gcTime is Infinity only while
// this is mocked: the cache is the only copy of the session's edits, so it must outlive every
// screen that reads it.
export const chartOfAccountsQuery = queryOptions({
  queryKey: ["chartOfAccounts"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_CHART_OF_ACCOUNTS)
  queryFn: async (): Promise<ChartAccount[]> => structuredClone(MOCK_CHART_OF_ACCOUNTS),
  staleTime: Infinity,
  gcTime: Infinity,
});

// Each account counts once per posted transaction, however many of its lines use it.
// Mocked: no BE support yet — the backend will derive counts from the G/L once posting exists.
export const bumpTransactionCounts = async (
  queryClient: QueryClient,
  accountIds: Array<string | null | undefined>,
  delta: number,
): Promise<void> => {
  const ids = new Set(accountIds.filter((id): id is string => !!id));
  if (!ids.size) return;
  await queryClient.ensureQueryData(chartOfAccountsQuery);
  queryClient.setQueryData<ChartAccount[]>(chartOfAccountsQuery.queryKey, (all) =>
    all?.map((a) => (ids.has(a.id) ? { ...a, transactionCount: Math.max(0, a.transactionCount + delta) } : a)),
  );
};

// Where an account is referenced outside the chart, for the delete guard.
// Mocked: no BE support yet — the backend will answer this from its foreign keys.
const findAccountUsages = async (queryClient: QueryClient, accountId: string): Promise<string[]> => {
  const types = await queryClient.ensureQueryData(taxDeductTypesQuery);
  return types.filter((t) => t.accountId === accountId).map((t) => `Mapped to ${t.kind} label ${t.label}`);
};

const isWholeInRange = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 9999;

const normalizeDescription = (description: string) => description.trim().replace(/\s+/g, " ").toUpperCase();

const assertValidInput = (input: ChartAccountInput, others: ChartAccount[]) => {
  if (!isWholeInRange(input.account)) throw new Error("Account must be a whole number from 1 to 9999");
  if (input.sub !== null && !isWholeInRange(input.sub)) throw new Error("Sub must be a whole number from 1 to 9999");
  if (!/[A-Z]/.test(input.description) || !/^[A-Z0-9 ]+$/.test(input.description)) {
    throw new Error("Description must be letters and numbers and include a letter");
  }
  if (others.some((other) => isSameAccountNumber(other, input))) {
    throw new Error(`${formatAccountNumber(input)} already exists`);
  }
};

const findOrThrow = (all: ChartAccount[], id: string) => {
  const found = all.find((a) => a.id === id);
  if (!found) throw new Error("Account not found");
  return found;
};

export const useChartOfAccounts = () => {
  const queryClient = useQueryClient();
  const profile = useAtomValue(userProfileAtom);
  const currentUser = profile?.user?.username || "you";

  const { data = EMPTY, isLoading } = useQuery(chartOfAccountsQuery);

  const accounts = useMemo(() => [...data].sort(compareAccounts), [data]);
  const byId = useMemo(() => new Map(data.map((a) => [a.id, a])), [data]);

  const getAccount = useCallback((id: string | null | undefined) => (id ? byId.get(id) : undefined), [byId]);

  const readAll = useCallback(() => queryClient.ensureQueryData(chartOfAccountsQuery), [queryClient]);

  const writeAll = useCallback(
    (next: ChartAccount[]) => queryClient.setQueryData(chartOfAccountsQuery.queryKey, next),
    [queryClient],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(CREATE_CHART_ACCOUNT, input)
  const addAccount = useCallback(
    async (input: ChartAccountInput): Promise<ChartAccount> => {
      const all = await readAll();
      const clean: ChartAccountInput = { ...input, description: normalizeDescription(input.description) };
      assertValidInput(clean, all);
      const now = new Date().toISOString();
      const created: ChartAccount = {
        ...clean,
        // The BE will assign ids; a random one can't collide with a renumbered or deleted account.
        id: `coa-${crypto.randomUUID()}`,
        isDefault: false,
        isActive: true,
        transactionCount: 0,
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now,
      };
      writeAll([...all, created]);
      return created;
    },
    [readAll, writeAll, currentUser],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(UPDATE_CHART_ACCOUNT, { id, ...patch })
  const updateAccount = useCallback(
    async (id: string, patch: ChartAccountPatch): Promise<ChartAccount> => {
      const all = await readAll();
      const existing = findOrThrow(all, id);
      if (existing.isDefault) throw new Error("Default accounts can't be changed");
      const next: ChartAccountInput = {
        account: patch.account ?? existing.account,
        sub: patch.sub !== undefined ? patch.sub : existing.sub,
        description: normalizeDescription(patch.description ?? existing.description),
        category: patch.category ?? existing.category,
      };
      if (existing.transactionCount > 0 && !isSameAccountNumber(existing, next)) {
        throw new Error("Account and Sub can't change once transactions are posted");
      }
      if (existing.transactionCount > 0 && next.category !== existing.category) {
        throw new Error("Category can't change once transactions are posted");
      }
      assertValidInput(
        next,
        all.filter((a) => a.id !== id),
      );
      const unchanged =
        isSameAccountNumber(existing, next) &&
        existing.description === next.description &&
        existing.category === next.category;
      if (unchanged) return existing;
      const updated: ChartAccount = {
        ...existing,
        ...next,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
      };
      writeAll(all.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    [readAll, writeAll, currentUser],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(DELETE_CHART_ACCOUNT, { id })
  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      const existing = findOrThrow(await readAll(), id);
      if (existing.isDefault) throw new Error("Default accounts can't be deleted");
      if (existing.transactionCount > 0) throw new Error("Accounts with posted transactions can't be deleted");
      const usages = await findAccountUsages(queryClient, id);
      if (usages.length) throw new Error(`Can't delete: ${usages.join("; ")}`);
      writeAll((await readAll()).filter((a) => a.id !== id));
    },
    [queryClient, readAll, writeAll],
  );

  const getAccountUsages = useCallback((id: string) => findAccountUsages(queryClient, id), [queryClient]);

  // Mocked: no BE support yet — swap for executeGraphQL(SET_CHART_ACCOUNT_ACTIVE, { id, active })
  const setAccountActive = useCallback(
    async (id: string, active: boolean): Promise<void> => {
      const all = await readAll();
      const existing = findOrThrow(all, id);
      if (existing.isDefault) throw new Error("Default accounts are always active");
      if (existing.isActive === active) return;
      const updated = { ...existing, isActive: active, updatedBy: currentUser, updatedAt: new Date().toISOString() };
      writeAll(all.map((a) => (a.id === id ? updated : a)));
    },
    [readAll, writeAll, currentUser],
  );

  return {
    accounts,
    loading: isLoading,
    getAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountUsages,
    setAccountActive,
  };
};
