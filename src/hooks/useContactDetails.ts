import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { UseQueryResult, queryOptions, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import { mockNameId } from "../lib/nameId";
import {
  ContactAccountSettings,
  ContactComment,
  ContactCommentCategory,
  ContactListMoneyFacts,
  ContactRecapData,
  ContactRecordExtras,
  MOCK_CONTACT_ACCOUNT_SETTINGS,
  RecapPrefs,
  TaxIdAccessAction,
  TaxIdAccessEntry,
  buildMockContactExtras,
  buildMockContactListMoneyFacts,
  emptyContactExtras,
} from "../mocks/contacts";

export type {
  ContactComment,
  ContactCommentCategory,
  ContactListMoneyFacts,
  ContactRecapData,
  LinkedRecord,
  LinkedRecordKind,
  RecapItemId,
  RecapPrefs,
  TaxIdAccessAction,
  TaxIdAccessEntry,
} from "../mocks/contacts";
export { RECAP_ITEM_IDS } from "../mocks/contacts";

// gcTime is Infinity only while these are mocked: the cache is the only copy of the session's
// edits, so it has to outlive the record being closed and reopened.
export const contactExtrasQuery = (partyId: string) =>
  queryOptions({
    queryKey: ["contactExtras", partyId],
    // Mocked: no BE support yet — swap for executeGraphQL(FETCH_CONTACT_EXTRAS, { partyId })
    queryFn: async (): Promise<ContactRecordExtras> => structuredClone(buildMockContactExtras(partyId)),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const contactAccountSettingsQuery = queryOptions({
  queryKey: ["contactAccountSettings"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_CONTACT_SETTINGS)
  queryFn: async (): Promise<ContactAccountSettings> => structuredClone(MOCK_CONTACT_ACCOUNT_SETTINGS),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const contactListMoneyQuery = (partyId: string, isRevenueOwner: boolean) =>
  queryOptions({
    queryKey: ["contactListMoney", partyId, isRevenueOwner],
    // Mocked: no BE support yet — swap for executeGraphQL(FETCH_CONTACT_MONEY_FACTS, { partyId })
    queryFn: async (): Promise<ContactListMoneyFacts> => buildMockContactListMoneyFacts(partyId, isRevenueOwner),
    staleTime: Infinity,
  });

/** The record's recap reads the same per-contact money facts as the Contacts list, so the two agree. */
export const useRecapWithMoneyFacts = (
  partyId: string | null,
  isRevenueOwner: boolean,
  recap: ContactRecapData,
): ContactRecapData => {
  const { data: facts } = useQuery({ ...contactListMoneyQuery(partyId ?? "", isRevenueOwner), enabled: !!partyId });
  return useMemo(() => {
    if (!facts) return recap;
    return {
      ...recap,
      suspenseAmount: facts.suspenseAmount,
      suspenseReason: facts.suspenseAmount > 0 ? recap.suspenseReason || "Held in suspense" : "",
      outstandingCheckCount: facts.outstandingCheckCount,
      outstandingCheckAmount: facts.outstandingCheckAmount,
      oldestOutstandingCheck:
        facts.oldestOutstandingCheckNumber && facts.oldestOutstandingCheckDays != null
          ? { number: facts.oldestOutstandingCheckNumber, days: facts.oldestOutstandingCheckDays }
          : null,
    };
  }, [facts, recap]);
};

export interface ContactListParty {
  id: string;
  /** REV contacts are the ones that can have suspense money, revenue checks and netting. */
  isRevenueOwner: boolean;
}

/** What the Contacts list reads per row from the mocked extras. */
export interface ContactListExtras extends ContactListMoneyFacts {
  updatedBy: string | null;
  form1099Type: string;
}

type ListAuditFacts = Pick<ContactRecordExtras, "updatedBy" | "form1099Type">;

const pickListAuditFacts = (extras: ContactRecordExtras): ListAuditFacts => ({
  updatedBy: extras.updatedBy,
  form1099Type: extras.form1099Type,
});

// Module-level so react-query can keep each combined array stable between renders.
const auditData = (results: UseQueryResult<ListAuditFacts>[]) => results.map((r) => r.data);
const moneyData = (results: UseQueryResult<ContactListMoneyFacts>[]) => results.map((r) => r.data);

/** Per-row extras for the Contacts list, keyed by party id. Reads the same record extras the
 * contact record does (so the list's Updated by and 1099 type match it) plus the mocked money
 * facts. Rows whose data hasn't arrived yet are left out. */
export const useContactListExtras = (parties: ContactListParty[]): Map<string, ContactListExtras> => {
  const audit = useQueries({
    queries: parties.map((p) => ({ ...contactExtrasQuery(p.id), select: pickListAuditFacts })),
    combine: auditData,
  });
  const money = useQueries({
    queries: parties.map((p) => contactListMoneyQuery(p.id, p.isRevenueOwner)),
    combine: moneyData,
  });

  return useMemo(() => {
    const byId = new Map<string, ContactListExtras>();
    parties.forEach((p, i) => {
      const a = audit[i];
      const m = money[i];
      if (a && m) byId.set(p.id, { ...m, ...a });
    });
    return byId;
  }, [parties, audit, money]);
};

export interface ContactDetails extends ContactRecordExtras, ContactAccountSettings {
  /** null until the contact is first saved. */
  nameId: string | null;
}

export interface AddCommentOptions {
  auto?: boolean;
  category?: ContactCommentCategory;
}

/** Contact form fields with no BE column yet. Their values come from these extras as the form's
 * initial values and are written back by recordSave. Add a later tab's mocked fields here. */
export const MOCKED_FORM_FIELDS = ["form1099Type"] as const satisfies readonly (keyof ContactRecordExtras)[];
export type MockedFormValues = Pick<ContactRecordExtras, (typeof MOCKED_FORM_FIELDS)[number]>;

/** The MOCKED_FORM_FIELDS present on `source` (form data, or the loaded details). */
export const pickMockedFormValues = (source: Record<string, any>): Partial<MockedFormValues> =>
  Object.fromEntries(
    MOCKED_FORM_FIELDS.filter((id) => source[id] !== undefined).map((id) => [id, source[id] ?? ""]),
  ) as Partial<MockedFormValues>;

/** A plain string is filed as a general comment. */
export type AutoComment = string | { text: string; category: ContactCommentCategory };

export interface RecordSaveOptions {
  isNew: boolean;
  /** AUTO comments describing what the save changed, oldest first. */
  autoComments?: AutoComment[];
  /** MOCKED_FORM_FIELDS values from the saved form. */
  formValues?: Partial<MockedFormValues>;
  /** Set when the save entered or changed the Tax ID, to log it. */
  taxIdChange?: Exclude<TaxIdAccessAction, "viewed"> | null;
}

export const normalizeClassification = (name: string) => name.trim().replace(/\s+/g, " ").toUpperCase();

let commentSeq = 0;
const newComment = (text: string, author: string, opts: AddCommentOptions = {}): ContactComment => ({
  id: `c-${Date.now()}-${++commentSeq}`,
  createdAt: new Date().toISOString(),
  author,
  text,
  auto: opts.auto,
  category: opts.category ?? "general",
});

let accessSeq = 0;
const newAccessEntry = (action: TaxIdAccessAction, user: string): TaxIdAccessEntry => ({
  id: `t-${Date.now()}-${++accessSeq}`,
  at: new Date().toISOString(),
  user,
  action,
});

const NO_EXTRAS = emptyContactExtras();

/** Contact record extras the BE doesn't support yet (audit names, recap, comment log, linked
 * records, custom classification types, Type of 1099, Tax ID access log). Every read and write goes through react-query so swapping
 * in the real calls only changes the queryFns and the bodies of the mutations below. */
export const useContactDetails = (partyId: string | null) => {
  const queryClient = useQueryClient();
  const profile = useAtomValue(userProfileAtom);
  const currentUser = profile?.user?.username || "you";

  const extrasQuery = useQuery({ ...contactExtrasQuery(partyId ?? ""), enabled: partyId != null });
  const settingsQuery = useQuery(contactAccountSettingsQuery);

  const details = useMemo<ContactDetails>(
    () => ({
      ...(partyId != null && extrasQuery.data ? extrasQuery.data : NO_EXTRAS),
      ...(settingsQuery.data ?? MOCK_CONTACT_ACCOUNT_SETTINGS),
      nameId: partyId != null ? mockNameId(partyId) : null,
    }),
    [partyId, extrasQuery.data, settingsQuery.data],
  );

  const updateExtras = useCallback(
    async (id: string, update: (prev: ContactRecordExtras) => ContactRecordExtras) => {
      const prev = await queryClient.ensureQueryData(contactExtrasQuery(id));
      queryClient.setQueryData(contactExtrasQuery(id).queryKey, update(prev));
    },
    [queryClient],
  );

  const updateSettings = useCallback(
    async (update: (prev: ContactAccountSettings) => ContactAccountSettings) => {
      const prev = await queryClient.ensureQueryData(contactAccountSettingsQuery);
      queryClient.setQueryData(contactAccountSettingsQuery.queryKey, update(prev));
    },
    [queryClient],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(ADD_PARTY_COMMENT, { partyId, text, ... })
  const addComment = useCallback(
    async (text: string, opts: AddCommentOptions = {}) => {
      if (partyId == null) throw new Error("Save the contact before adding comments");
      const trimmed = text.trim();
      if (!trimmed) return;
      await updateExtras(partyId, (prev) => ({
        ...prev,
        comments: [newComment(trimmed, currentUser, opts), ...prev.comments],
      }));
    },
    [partyId, currentUser, updateExtras],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(UPDATE_CONTACT_SETTINGS, { recapPrefs })
  const setRecapPrefs = useCallback(
    (recapPrefs: RecapPrefs) => updateSettings((prev) => ({ ...prev, recapPrefs })),
    [updateSettings],
  );

  // Mocked: no BE support yet — swap for executeGraphQL(CREATE_CLASSIFICATION_TYPE, { name })
  const addCustomClassification = useCallback(
    async (name: string): Promise<string> => {
      const normalized = normalizeClassification(name);
      if (!normalized) throw new Error("Enter a classification name");
      await updateSettings((prev) =>
        prev.customClassifications.includes(normalized)
          ? prev
          : { ...prev, customClassifications: [...prev.customClassifications, normalized] },
      );
      return normalized;
    },
    [updateSettings],
  );

  // Mocked: no BE support yet — swap for a BE reveal query (e.g. executeGraphQL(REVEAL_TAX_ID, { partyId }))
  // that returns the full Tax ID and writes this entry itself.
  const logTaxIdView = useCallback(async () => {
    if (partyId == null) return;
    await updateExtras(partyId, (prev) => ({
      ...prev,
      taxIdAccessLog: [newAccessEntry("viewed", currentUser), ...prev.taxIdAccessLog],
    }));
  }, [partyId, currentUser, updateExtras]);

  // Mocked: the BE will stamp created/updated-by and write these AUTO entries itself on save —
  // drop this once it does. A contact created this session starts empty instead of seeded.
  const recordSave = useCallback(
    async (savedPartyId: string, opts: RecordSaveOptions) => {
      const texts: AutoComment[] = [...(opts.isNew ? ["Record created."] : []), ...(opts.autoComments ?? [])];
      const entries = texts
        .map((c) =>
          typeof c === "string"
            ? newComment(c, currentUser, { auto: true })
            : newComment(c.text, currentUser, { auto: true, category: c.category }),
        )
        .reverse();
      const access = opts.taxIdChange ? [newAccessEntry(opts.taxIdChange, currentUser)] : [];
      const formValues = opts.formValues ?? {};
      if (opts.isNew) {
        // Written before anything observes this key, so without these defaults it would get the
        // client's 5-minute gcTime and come back later as seeded mock history.
        queryClient.setQueryDefaults(["contactExtras"], { staleTime: Infinity, gcTime: Infinity });
        // The Contacts list reads every row's extras, so it may already be seeding this new
        // contact; that fetch would land after (and over) the empty extras below.
        await queryClient.cancelQueries({ queryKey: contactExtrasQuery(savedPartyId).queryKey });
        queryClient.setQueryData(contactExtrasQuery(savedPartyId).queryKey, {
          ...emptyContactExtras(currentUser),
          ...formValues,
          comments: entries,
          taxIdAccessLog: access,
        });
        return;
      }
      await updateExtras(savedPartyId, (prev) => ({
        ...prev,
        ...formValues,
        updatedBy: currentUser,
        comments: [...entries, ...prev.comments],
        taxIdAccessLog: [...access, ...prev.taxIdAccessLog],
      }));
    },
    [queryClient, currentUser, updateExtras],
  );

  return {
    details,
    loading: (partyId != null && extrasQuery.isLoading) || settingsQuery.isLoading,
    addComment,
    setRecapPrefs,
    addCustomClassification,
    recordSave,
    logTaxIdView,
  };
};

export default useContactDetails;
