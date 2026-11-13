export interface ContactAddressLine {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export const toAddressLine = (partyAddress: any): ContactAddressLine => ({
  type: partyAddress?.addressType || "",
  line1: partyAddress?.address?.line1 || "",
  line2: partyAddress?.address?.line2 || "",
  city: partyAddress?.address?.city || "",
  state: partyAddress?.address?.stateCode || "",
  zip: partyAddress?.address?.postalCode || "",
});

/** "2209 W Wall St, Ste 4, Midland, TX 79701", skipping blank parts. */
export const formatAddressLine = (a: ContactAddressLine | undefined): string =>
  a ? [a.line1, a.line2, a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";

/** Where mail goes: the Mailing address, else the primary one, else the first. */
export const pickMailingAddress = (addresses: ContactAddressLine[], raw: any[]): ContactAddressLine | undefined => {
  const mailing = addresses.find((a) => a.type === "Mailing");
  if (mailing) return mailing;
  const primaryIndex = raw.findIndex((a) => a?.isPrimary);
  return primaryIndex >= 0 ? addresses[primaryIndex] : addresses[0];
};

/** A party's mailing address from its raw GraphQL `addresses`. */
export const partyMailingAddress = (rawAddresses: any[] | null | undefined): ContactAddressLine | undefined => {
  const raw = rawAddresses ?? [];
  return pickMailingAddress(raw.map(toAddressLine), raw);
};
