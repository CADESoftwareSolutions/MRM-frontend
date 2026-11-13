import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { FETCH_PARTIES } from "@/graphql/Contacts";
import { executeGraphQL } from "@/lib/api";
import { ContactAddressLine, partyMailingAddress } from "@/lib/contactAddress";
import { mockNameId } from "@/lib/nameId";

export interface ContactOption {
  id: string;
  name: string;
  nameLine2: string;
  nameId: string;
  classifications: string[];
  city: string;
  state: string;
  /** Mailing address (same pick as the Contacts list) as "line1, City, ST zip", skipping blanks. */
  addressSummary: string;
  isActive: boolean;
  taxIdLast4: string;
  w9OnFile: boolean;
}

// Nested under useContacts' ["parties", accountId] so its invalidate-after-save (a prefix match)
// also refreshes every picker, while staying a separate cache entry for this different shape.
export const contactOptionsQueryKey = (accountId: number) =>
  ["parties", accountId, "options"] as const;

const toAddressSummary = (address: ContactAddressLine | undefined): string => {
  if (!address) return "";
  const stateZip = [address.state, address.zip].filter(Boolean).join(" ");
  return [address.line1, address.city, stateZip].filter(Boolean).join(", ");
};

const toContactOption = (party: any): ContactOption => {
  const id = String(party.id);
  const address = partyMailingAddress(party.addresses);
  const taxDigits = String(party.taxInfo?.taxId ?? "").replace(/\D/g, "");
  return {
    id,
    // Contacts stores Name Line 1 in nameFirst and Line 2 in nameMiddle, and nameFull joins both,
    // so nameFull is only the fallback for parties created outside the Contacts form.
    name:
      [party.nameFirst, party.nameLast].filter(Boolean).join(" ") ||
      party.nameFull ||
      "Unnamed contact",
    nameLine2: party.nameMiddle || "",
    nameId: mockNameId(id),
    classifications: (party.partyTypes ?? []).filter(Boolean),
    city: address?.city || "",
    state: address?.state || "",
    addressSummary: toAddressSummary(address),
    isActive: party.isActive !== false,
    taxIdLast4: taxDigits.length >= 4 ? taxDigits.slice(-4) : "",
    w9OnFile: Boolean(party.taxInfo?.w9OnFile),
  };
};

const byActiveThenName = (a: ContactOption, b: ContactOption) =>
  Number(b.isActive) - Number(a.isActive) ||
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** Read-only contact list for pickers on other screens. useContacts is the Contacts page's own
 * hook and resets moduleViewAtom on unmount, so it can't be reused outside that page. */
export const useContactOptions = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const accountId = userProfile?.account?.id ?? 0;

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: contactOptionsQueryKey(accountId),
    queryFn: async (): Promise<ContactOption[]> => {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });
      const parties: any[] = result?.parties ?? [];
      // Same rule as the Contacts list: a company's internal contacts aren't payees on their own.
      const internalContactIds = new Set(
        parties.flatMap((p) =>
          (p.relatedContacts ?? []).map((rc: any) => rc.relatedParty?.id).filter(Boolean),
        ),
      );
      return parties
        .filter((p) => !internalContactIds.has(p.id))
        .map(toContactOption)
        .sort(byActiveThenName);
    },
    enabled: !!accountId,
    // Refreshes after the user adds a contact in the Contacts tab opened from a picker.
    refetchOnWindowFocus: true,
  });

  return {
    options: data,
    loading: isLoading || !accountId,
    isError,
    refetch: () => {
      void refetch();
    },
  };
};
