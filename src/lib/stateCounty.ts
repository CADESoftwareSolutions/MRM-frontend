import type { CountyReference, StateCountyReference } from "@/hooks/useStateCountyReference";

const withCode = (name: string, code?: string | null) => (code ? `${name} (${code})` : name);

/** Lowercased, with a trailing "County"/"Parish"/"Borough"/"Census Area" dropped, so a typed-in
 * "Gregg County" matches the reference data's "Gregg". */
export const normalizeCountyName = (value: string) =>
  value.toLowerCase().replace(/\s+(county|parish|borough|census area)$/i, "").trim();

export const findCounty = (counties: CountyReference[], countyName: string) => {
  const target = normalizeCountyName(countyName);
  return counties.find((county) => normalizeCountyName(county.name) === target);
};

/** "Texas (TX)". */
export const stateNameWithCode = (state: StateCountyReference) => withCode(state.name, state.code);

/** "Gregg (183)": the name as given, plus the county's 3-digit FIPS code when the reference data has one. */
export const countyNameWithCode = (counties: CountyReference[], countyName: string) =>
  withCode(countyName, findCounty(counties, countyName)?.fipsCounty);

/** For read-only State lines. Falls back to the bare code if it isn't in the reference data. */
export const formatStateWithCode = (
  reference: StateCountyReference[],
  stateCode?: string | null,
): string => {
  if (!stateCode) return "—";
  const state = reference.find((s) => s.code === stateCode);
  return state ? stateNameWithCode(state) : stateCode;
};

/** For read-only County lines. */
export const formatCountyWithCode = (
  reference: StateCountyReference[],
  stateCode?: string | null,
  countyName?: string | null,
): string => {
  if (!countyName) return "—";
  const counties = reference.find((s) => s.code === stateCode)?.counties ?? [];
  return countyNameWithCode(counties, countyName);
};
