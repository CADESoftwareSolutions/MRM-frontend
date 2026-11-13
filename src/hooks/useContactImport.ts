import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileAtom } from "../atoms/userProfileAtom";
import {
  CREATE_ADDRESS_MUTATION,
  CREATE_PARTY_ADDRESS_MUTATION,
  CREATE_PARTY_MUTATION,
  CREATE_PARTY_PHONE_MUTATION,
  CREATE_PHONE_MUTATION,
  DELETE_ADDRESS_MUTATION,
  FETCH_PARTIES,
  UPDATE_ADDRESS_MUTATION,
  UPDATE_PARTY_MUTATION,
  UPDATE_PHONE_MUTATION,
} from "../graphql/Contacts";
import { executeGraphQL } from "../lib/api";
import { mockNameId } from "../lib/nameId";
import { useContactDetails } from "./useContactDetails";

/** A contact already in CADE, as the import matches and updates it. */
export interface ExistingContact {
  id: number;
  nameId: string;
  /** Name as the Contacts list shows it. */
  name: string;
  nameFirst: string;
  nameLine2: string;
  partyTypes: string[];
  email: string;
  isActive: boolean;
  notes: string;
  taxClassification: string;
  taxIdDigits: string;
  w9OnFile: boolean | null;
  addresses: {
    addressId: number;
    type: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  }[];
  phones: { phoneId: number; type: string; number: string }[];
}

/** Arguments for createParty / updateParty. Only what's set is sent, so an update leaves the rest as it is. */
export interface PartyChanges {
  partyTypes?: string[];
  nameFull?: string;
  nameFirst?: string;
  nameLast?: string;
  nameMiddle?: string;
  email?: string;
  isActive?: boolean;
  notes?: string;
  taxInfo?: { taxClassification?: string; taxId?: string; w9OnFile?: boolean; send1099?: boolean };
}

export interface PlannedAddress {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface PlannedAddressUpdate {
  type: string;
  addressId: number;
  line1?: string;
  line2?: string;
  city?: string;
  stateCode?: string;
  postalCode?: string;
}

/** Everything one spreadsheet row writes, worked out before the import starts. */
export interface ContactImportPlan {
  kind: "create" | "update";
  /** The matched contact; null when creating. */
  partyId: number | null;
  party: PartyChanges;
  addressCreates: PlannedAddress[];
  addressUpdates: PlannedAddressUpdate[];
  phoneCreates: { type: string; number: string }[];
  phoneUpdates: { type: string; phoneId: number; number: string }[];
  /** What an update changes, e.g. "Email Address", "Mailing address". Empty for a new contact. */
  changes: string[];
  /** Classification types the row adds that aren't on the custom list yet. */
  newCustomTypes: string[];
  taxIdChange: "entered" | "changed" | null;
}

export interface ContactImportJob {
  rowNumber: number;
  name: string;
  plan: ContactImportPlan;
}

export interface ContactImportOutcome {
  rowNumber: number;
  name: string;
  result: "created" | "updated" | "failed" | "notStarted";
  partyId: number | null;
  nameId: string | null;
  /** Why nothing was saved for the row. */
  error: string | null;
  /** Parts that didn't save although the contact itself did (an address or phone). */
  problems: string[];
}

export interface RunImportOptions {
  fileName: string;
  onProgress: (done: number) => void;
  shouldStop: () => boolean;
}

// Enough to keep the import moving without flooding the BE; each row is itself several calls in a row.
const CONCURRENCY = 3;

const NO_CONTACTS: ExistingContact[] = [];

const digitsOf = (value: unknown) => String(value ?? "").replace(/\D/g, "");

type Maybe<T> = T | null | undefined;

/** The parts of FETCH_PARTIES' party the import reads. */
interface RawParty {
  id: string;
  partyTypes?: Maybe<Maybe<string>[]>;
  nameFull?: Maybe<string>;
  nameFirst?: Maybe<string>;
  nameLast?: Maybe<string>;
  nameMiddle?: Maybe<string>;
  email?: Maybe<string>;
  isActive?: Maybe<boolean>;
  notes?: Maybe<string>;
  taxInfo?: Maybe<{ taxClassification?: Maybe<string>; taxId?: Maybe<string>; w9OnFile?: Maybe<boolean> }>;
  addresses?: Maybe<
    {
      addressType?: Maybe<string>;
      address?: Maybe<{
        id?: Maybe<string>;
        line1?: Maybe<string>;
        line2?: Maybe<string>;
        city?: Maybe<string>;
        stateCode?: Maybe<string>;
        postalCode?: Maybe<string>;
      }>;
    }[]
  >;
  phones?: Maybe<{ phoneType?: Maybe<string>; phone?: Maybe<{ id?: Maybe<string>; number?: Maybe<string> }> }[]>;
  relatedContacts?: Maybe<{ relatedParty?: Maybe<{ id?: Maybe<string> }> }[]>;
}

const toExistingContact = (party: RawParty): ExistingContact => {
  const id = parseInt(party.id, 10);
  const w9OnFile = party.taxInfo?.w9OnFile;
  return {
    id,
    nameId: mockNameId(id),
    name: [party.nameFirst, party.nameLast].filter(Boolean).join(" ") || party.nameFull || "",
    nameFirst: party.nameFirst || "",
    nameLine2: party.nameMiddle || "",
    partyTypes: (party.partyTypes ?? []).filter((type): type is string => !!type),
    email: party.email || "",
    isActive: party.isActive !== false,
    notes: party.notes || "",
    taxClassification: party.taxInfo?.taxClassification || "",
    taxIdDigits: digitsOf(party.taxInfo?.taxId),
    w9OnFile: typeof w9OnFile === "boolean" ? w9OnFile : null,
    addresses: (party.addresses ?? []).flatMap((pa) =>
      pa.address?.id
        ? [
            {
              addressId: parseInt(pa.address.id, 10),
              type: pa.addressType || "",
              line1: pa.address.line1 || "",
              line2: pa.address.line2 || "",
              city: pa.address.city || "",
              state: pa.address.stateCode || "",
              zip: pa.address.postalCode || "",
            },
          ]
        : [],
    ),
    phones: (party.phones ?? []).flatMap((pp) =>
      pp.phone?.id
        ? [{ phoneId: parseInt(pp.phone.id, 10), type: pp.phoneType || "", number: pp.phone.number || "" }]
        : [],
    ),
  };
};

const messageOf = (error: unknown) => (error instanceof Error && error.message) || "Something went wrong";

/** Reads the account's contacts for matching and writes imported rows with the same mutations,
 * in the same party → address → partyAddress → phone → partyPhone order, as the Contacts form. */
export const useContactImport = () => {
  const queryClient = useQueryClient();
  const accountId = useAtomValue(userProfileAtom)?.account?.id ?? 0;
  const { details, addCustomClassification, recordSave } = useContactDetails(null);

  // Under ["parties", accountId] so saving a contact anywhere refreshes the matches too.
  const existingQuery = useQuery({
    queryKey: ["parties", accountId, "import"],
    queryFn: async (): Promise<ExistingContact[]> => {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });
      const parties: RawParty[] = result?.parties ?? [];
      // A company's internal contacts aren't contacts of their own on the Contacts list, so rows don't match them.
      const internalContactIds = new Set(
        parties.flatMap((p) => (p.relatedContacts ?? []).map((rc) => rc.relatedParty?.id).filter(Boolean)),
      );
      return parties.filter((p) => !internalContactIds.has(p.id)).map(toExistingContact);
    },
    enabled: !!accountId,
  });

  const saveAddressesAndPhones = useCallback(
    async (partyId: number, plan: ContactImportPlan): Promise<string[]> => {
      const problems: string[] = [];
      const attempt = async (what: string, write: () => Promise<void>) => {
        try {
          await write();
        } catch (error) {
          problems.push(`${what}: ${messageOf(error)}`);
        }
      };

      for (const update of plan.addressUpdates) {
        const { type, addressId, ...parts } = update;
        await attempt(`${type} address`, async () => {
          await executeGraphQL(UPDATE_ADDRESS_MUTATION, { id: addressId, ...parts });
        });
      }
      for (const address of plan.addressCreates) {
        await attempt(`${address.type} address`, async () => {
          const created = await executeGraphQL(CREATE_ADDRESS_MUTATION, {
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            stateCode: address.state,
            postalCode: address.zip || undefined,
          });
          const addressId = parseInt(created.createAddress.address.id, 10);
          try {
            await executeGraphQL(CREATE_PARTY_ADDRESS_MUTATION, {
              accountId,
              partyId,
              addressId,
              addressType: address.type,
              isPrimary: address.type === "Physical",
            });
          } catch (error) {
            // Without the link the address belongs to no contact, so remove it rather than leave it behind.
            try {
              await executeGraphQL(DELETE_ADDRESS_MUTATION, { id: addressId });
            } catch {
              throw new Error(`${messageOf(error)} (the unlinked address #${addressId} couldn't be removed either)`);
            }
            throw error;
          }
        });
      }
      for (const phone of plan.phoneUpdates) {
        await attempt(`${phone.type} phone`, async () => {
          await executeGraphQL(UPDATE_PHONE_MUTATION, { id: phone.phoneId, number: phone.number });
        });
      }
      for (const phone of plan.phoneCreates) {
        await attempt(`${phone.type} phone`, async () => {
          const created = await executeGraphQL(CREATE_PHONE_MUTATION, { number: phone.number });
          await executeGraphQL(CREATE_PARTY_PHONE_MUTATION, {
            accountId,
            partyId,
            phoneId: parseInt(created.createPhone.phone.id, 10),
            phoneType: phone.type,
            isPrimary: false,
          });
        });
      }
      return problems;
    },
    [accountId],
  );

  const importRow = useCallback(
    async (job: ContactImportJob, fileName: string): Promise<ContactImportOutcome> => {
      const { plan } = job;
      const base = { rowNumber: job.rowNumber, name: job.name };
      let partyId = plan.partyId;
      try {
        if (plan.kind === "create") {
          const created = await executeGraphQL(CREATE_PARTY_MUTATION, { accountId, ...plan.party });
          partyId = parseInt(created.createParty.party.id, 10);
        } else {
          await executeGraphQL(UPDATE_PARTY_MUTATION, { id: plan.partyId, ...plan.party });
        }
      } catch (error) {
        return {
          ...base,
          result: "failed",
          partyId: plan.partyId,
          nameId: plan.partyId != null ? mockNameId(plan.partyId) : null,
          error: messageOf(error),
          problems: [],
        };
      }

      const savedId = partyId as number;
      const problems = await saveAddressesAndPhones(savedId, plan);
      const isNew = plan.kind === "create";
      await recordSave(String(savedId), {
        isNew,
        autoComments: [
          isNew ? `Imported from ${fileName}.` : `Updated from ${fileName}: ${plan.changes.join(", ")}.`,
        ],
        taxIdChange: plan.taxIdChange,
      }).catch(() => undefined);

      return {
        ...base,
        result: isNew ? "created" : "updated",
        partyId: savedId,
        nameId: mockNameId(savedId),
        error: null,
        problems,
      };
    },
    [accountId, saveAddressesAndPhones, recordSave],
  );

  /** Imports the jobs a few at a time, past any row that fails, and returns one outcome per job
   * in row order. Jobs not started because shouldStop() turned true come back as "notStarted". */
  const runImport = useCallback(
    async (jobs: ContactImportJob[], { fileName, onProgress, shouldStop }: RunImportOptions) => {
      const customTypes = Array.from(new Set(jobs.flatMap((job) => job.plan.newCustomTypes)));
      for (const type of customTypes) await addCustomClassification(type).catch(() => undefined);

      const outcomes = new Map<number, ContactImportOutcome>();
      let next = 0;
      let done = 0;
      const worker = async () => {
        while (next < jobs.length && !shouldStop()) {
          const job = jobs[next++];
          outcomes.set(job.rowNumber, await importRow(job, fileName));
          onProgress(++done);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

      if (done > 0) await queryClient.invalidateQueries({ queryKey: ["parties", accountId] });

      return jobs.map(
        (job): ContactImportOutcome =>
          outcomes.get(job.rowNumber) ?? {
            rowNumber: job.rowNumber,
            name: job.name,
            result: "notStarted",
            partyId: job.plan.partyId,
            nameId: null,
            error: null,
            problems: [],
          },
      );
    },
    [accountId, addCustomClassification, importRow, queryClient],
  );

  return {
    existing: existingQuery.data ?? NO_CONTACTS,
    existingLoading: existingQuery.isFetching,
    existingError: existingQuery.error ? messageOf(existingQuery.error) : null,
    reloadExisting: existingQuery.refetch,
    customClassifications: details.customClassifications,
    runImport,
  };
};

export default useContactImport;
