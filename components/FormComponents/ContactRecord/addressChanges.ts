import type { AddressEntry } from "../MultiAddressField";

const formatAddress = (a: AddressEntry) => {
  const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.address, a.addressLine2, cityLine].filter(Boolean).join(", ");
};

const byType = (list: AddressEntry[]) =>
  new Map(
    list
      .map((a) => [a.type, formatAddress(a)] as const)
      .filter(([, text]) => text),
  );

/** One AUTO comment line per address type that was added, changed or removed between the saved
 * record and what's about to be saved. */
export const describeAddressChanges = (before: AddressEntry[], after: AddressEntry[]): string[] => {
  const prev = byType(before);
  const next = byType(after);
  const changes: string[] = [];
  next.forEach((text, type) => {
    const old = prev.get(type);
    if (!old) changes.push(`${type} address added: ${text}.`);
    else if (old !== text) changes.push(`${type} address changed from ${old} to ${text}.`);
  });
  prev.forEach((text, type) => {
    if (!next.has(type)) changes.push(`${type} address removed (was ${text}).`);
  });
  return changes;
};
