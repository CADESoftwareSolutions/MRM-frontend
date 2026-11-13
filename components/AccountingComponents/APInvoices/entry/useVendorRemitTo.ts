import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { executeGraphQL } from "@/lib/api";
import { FETCH_VENDOR_ADDRESSES } from "@/graphql/Contacts";
import { isContactVendorId } from "./vendors";

interface AddressRow {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  stateCode?: string | null;
  postalCode?: string | null;
}

interface PartyAddressRow {
  addressType?: string | null;
  isPrimary?: boolean | null;
  address?: AddressRow | null;
}

interface VendorAddress {
  addressType: string;
  isPrimary: boolean;
  lines: string[];
}

export interface VendorRemitTo {
  /** The address checks go to; null when the contact has no address at all. */
  lines: string[] | null;
  /** The type of the address used, e.g. "Payment". */
  addressType: string | null;
  /** False when the contact has no address of the wanted type and another one is shown. */
  matchedType: boolean;
  loading: boolean;
  /** The address lookup failed; `lines` can't be trusted. */
  isError: boolean;
}

const toLines = (address: AddressRow | null | undefined): string[] => {
  if (!address) return [];
  const stateZip = [address.stateCode, address.postalCode].filter(Boolean).join(" ");
  const cityLine = [address.city, stateZip].filter(Boolean).join(", ");
  return [address.line1, address.line2, cityLine].filter((line): line is string => !!line);
};

/** A contact vendor's remit-to: its address of `addressType` (the vendor's remit-to default),
 * else its primary or first address. Mock vendors aren't contacts, so this stays idle for them. */
export const useVendorRemitTo = (vendorId: string, addressType: string): VendorRemitTo => {
  const accountId = useAtomValue(userProfileAtom)?.account?.id ?? 0;
  const partyId = isContactVendorId(vendorId) ? Number(vendorId) : null;

  const { data, isLoading, isError } = useQuery({
    // Under useContacts' ["parties", accountId] so saving the contact refreshes this too.
    queryKey: ["parties", accountId, "addresses", partyId],
    queryFn: async (): Promise<VendorAddress[]> => {
      const result = await executeGraphQL(FETCH_VENDOR_ADDRESSES, { id: partyId });
      const rows: PartyAddressRow[] = result?.party?.addresses ?? [];
      return rows
        .map((row) => ({
          addressType: row.addressType || "",
          isPrimary: !!row.isPrimary,
          lines: toLines(row.address),
        }))
        .filter((row) => row.lines.length > 0);
    },
    enabled: partyId !== null && !!accountId,
    // "Edit vendor" opens in another tab, so refetch when the user comes back.
    staleTime: 0,
    refetchOnWindowFocus: "always",
  });

  return useMemo(() => {
    if (partyId === null) return { lines: null, addressType: null, matchedType: true, loading: false, isError: false };
    const addresses = data ?? [];
    const wanted = addresses.find((row) => row.addressType.toLowerCase() === addressType.toLowerCase());
    const shown = wanted ?? addresses.find((row) => row.isPrimary) ?? addresses[0];
    return {
      lines: shown?.lines ?? null,
      addressType: shown?.addressType || null,
      matchedType: !!wanted,
      loading: isLoading,
      isError,
    };
  }, [partyId, data, addressType, isLoading, isError]);
};
