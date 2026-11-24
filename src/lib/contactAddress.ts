export interface ContactAddressLine {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

/** One entry of a party's `addresses` as the GraphQL party queries return it. */
export interface RawPartyAddress {
  addressType?: string | null;
  isPrimary?: boolean | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    stateCode?: string | null;
    postalCode?: string | null;
  } | null;
}

export const toAddressLine = (partyAddress: RawPartyAddress | null | undefined): ContactAddressLine => ({
  type: partyAddress?.addressType || "",
  line1: partyAddress?.address?.line1 || "",
  line2: partyAddress?.address?.line2 || "",
  city: partyAddress?.address?.city || "",
  state: partyAddress?.address?.stateCode || "",
  zip: partyAddress?.address?.postalCode || "",
});

/** Where mail goes: the Mailing address, else the primary one, else the first. */
export const pickMailingAddress = (
  addresses: ContactAddressLine[],
  raw: (RawPartyAddress | null | undefined)[],
): ContactAddressLine | undefined => {
  const mailing = addresses.find((a) => a.type === "Mailing");
  if (mailing) return mailing;
  const primaryIndex = raw.findIndex((a) => a?.isPrimary);
  return primaryIndex >= 0 ? addresses[primaryIndex] : addresses[0];
};

/** A party's mailing address from its raw GraphQL `addresses`. */
export const partyMailingAddress = (
  rawAddresses: (RawPartyAddress | null | undefined)[] | null | undefined,
): ContactAddressLine | undefined => {
  const raw = rawAddresses ?? [];
  return pickMailingAddress(raw.map(toAddressLine), raw);
};
