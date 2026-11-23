import { useCallback, useMemo } from "react";
import { QueryClient, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_CHART_OF_ACCOUNT,
  DELETE_CHART_OF_ACCOUNT,
  FETCH_CHART_OF_ACCOUNTS,
  UPDATE_CHART_OF_ACCOUNT,
} from "../graphql/ChartOfAccounts";
import { executeGraphQL } from "../lib/api";
import { taxDeductTypesQuery } from "./useTaxDeductTypes";
import {
  AccountCategory,
  ChartAccount,
  ChartAccountInput,
  ChartAccountPatch,
  DEFAULT_ACCOUNT_NUMBERS,
  compareAccounts,
  formatAccountNumber,
  isSameAccountNumber,
} from "../types/chartOfAccounts";

const EMPTY: ChartAccount[] = [];

interface ChartOfAccountRow {
  id: string | number;
  glAccount: number;
  subAccount: number | null;
  description: string;
  category: string;
  isActive: boolean;
  createdById: number | null;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PostedEntryRow {
  lines: { chartOfAccountId: string | number }[];
}

// The backend sends UTC with no zone and microseconds ("2026-11-19T17:02:11.531207"); Date would
// read that as local time, and some browsers reject more than three fraction digits.
const utcIso = (value: string) => {
  const trimmed = value.replace(/(\.\d{3})\d+/, "$1");
  return /(Z|[+-]\d\d:?\d\d)$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
};

// The backend appends where in the query each error happened ("…\n\nGraphQL request:3:5 …").
const runGraphQL = async (query: string, variables: Record<string, unknown>) => {
  try {
    return await executeGraphQL(query, variables);
  } catch (err) {
    throw new Error((err as Error).message.split("\n\nGraphQL request:")[0]);
  }
};

const toChartAccount = (row: ChartOfAccountRow, transactionCount: number): ChartAccount => {
  const sub = row.subAccount ?? null;
  return {
    id: String(row.id),
    account: row.glAccount,
    sub,
    description: row.description,
    category: row.category as AccountCategory,
    isDefault: sub === null && DEFAULT_ACCOUNT_NUMBERS.has(row.glAccount),
    isActive: row.isActive,
    transactionCount,
    createdById: row.createdById ?? null,
    createdAt: utcIso(row.createdAt),
    updatedById: row.updatedById ?? null,
    updatedAt: utcIso(row.updatedAt),
  };
};

// Each account counts once per posted entry, however many of the entry's lines use it.
const countPostedEntries = (entries: PostedEntryRow[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const id of new Set(entry.lines.map((line) => String(line.chartOfAccountId)))) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
};

// Every screen that reads accounts shares this one cache entry.
export const chartOfAccountsQuery = queryOptions({
  queryKey: ["chartOfAccounts"],
  queryFn: async (): Promise<ChartAccount[]> => {
    const result = await executeGraphQL(FETCH_CHART_OF_ACCOUNTS);
    const counts = countPostedEntries((result?.journalEntries ?? []) as PostedEntryRow[]);
    return ((result?.chartOfAccounts ?? []) as ChartOfAccountRow[]).map((row) =>
      toChartAccount(row, counts.get(String(row.id)) ?? 0),
    );
  },
  staleTime: 60_000,
});

// Where an account is referenced outside the chart, for the delete guard. The backend refuses to
// delete an account on journal or invoice lines itself; tax/deduct label mappings are still mocked,
// so this checks those.
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

  const { data = EMPTY, isLoading } = useQuery(chartOfAccountsQuery);

  const accounts = useMemo(() => [...data].sort(compareAccounts), [data]);
  const byId = useMemo(() => new Map(data.map((a) => [a.id, a])), [data]);

  const getAccount = useCallback((id: string | null | undefined) => (id ? byId.get(id) : undefined), [byId]);

  const readAll = useCallback(() => queryClient.ensureQueryData(chartOfAccountsQuery), [queryClient]);

  const writeAccount = useCallback(
    (account: ChartAccount) =>
      queryClient.setQueryData<ChartAccount[]>(chartOfAccountsQuery.queryKey, (all = []) =>
        all.some((a) => a.id === account.id) ? all.map((a) => (a.id === account.id ? account : a)) : [...all, account],
      ),
    [queryClient],
  );

  const addAccount = useCallback(
    async (input: ChartAccountInput): Promise<ChartAccount> => {
      const all = await readAll();
      const clean: ChartAccountInput = { ...input, description: normalizeDescription(input.description) };
      assertValidInput(clean, all);
      const result = await runGraphQL(CREATE_CHART_OF_ACCOUNT, {
        glAccount: clean.account,
        subAccount: clean.sub,
        description: clean.description,
        category: clean.category,
      });
      const created = toChartAccount(result.createChartOfAccount.chartOfAccount, 0);
      writeAccount(created);
      return created;
    },
    [readAll, writeAccount],
  );

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
      if (!isSameAccountNumber(existing, next)) {
        throw new Error("Account and Sub can't change once the account is created");
      }
      if (existing.transactionCount > 0 && next.category !== existing.category) {
        throw new Error("Category can't change once transactions are posted");
      }
      assertValidInput(
        next,
        all.filter((a) => a.id !== id),
      );
      if (existing.description === next.description && existing.category === next.category) return existing;
      const result = await runGraphQL(UPDATE_CHART_OF_ACCOUNT, {
        id: Number(id),
        description: next.description,
        category: next.category,
      });
      const updated = toChartAccount(result.updateChartOfAccount.chartOfAccount, existing.transactionCount);
      writeAccount(updated);
      return updated;
    },
    [readAll, writeAccount],
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      const existing = findOrThrow(await readAll(), id);
      if (existing.isDefault) throw new Error("Default accounts can't be deleted");
      if (existing.transactionCount > 0) throw new Error("Accounts with posted transactions can't be deleted");
      const usages = await findAccountUsages(queryClient, id);
      if (usages.length) throw new Error(`Can't delete: ${usages.join("; ")}`);
      const result = await runGraphQL(DELETE_CHART_OF_ACCOUNT, { id: Number(id) });
      if (!result?.deleteChartOfAccount?.success) throw new Error(`Couldn't delete ${formatAccountNumber(existing)}`);
      queryClient.setQueryData<ChartAccount[]>(chartOfAccountsQuery.queryKey, (all = []) =>
        all.filter((a) => a.id !== id),
      );
    },
    [queryClient, readAll],
  );

  const getAccountUsages = useCallback((id: string) => findAccountUsages(queryClient, id), [queryClient]);

  const setAccountActive = useCallback(
    async (id: string, active: boolean): Promise<void> => {
      const existing = findOrThrow(await readAll(), id);
      if (existing.isDefault) throw new Error("Default accounts are always active");
      if (existing.isActive === active) return;
      const result = await runGraphQL(UPDATE_CHART_OF_ACCOUNT, { id: Number(id), isActive: active });
      writeAccount(toChartAccount(result.updateChartOfAccount.chartOfAccount, existing.transactionCount));
    },
    [readAll, writeAccount],
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
